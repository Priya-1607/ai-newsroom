import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { body, query, param } from 'express-validator';
import Article from '../models/Article';
import ReformattedContent from '../models/ReformattedContent';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { ProcessService } from '../services/processService';

const router = Router();

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (
  req: Express.Request,
  file: any,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: .txt, .pdf, .docx'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// @route   POST /api/articles
// @desc    Upload a new article
// @access  Private
router.post(
  '/',
  authenticate,
  upload.single('file'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content')
      .optional()
      .isString()
      .isLength({ min: 50 })
      .withMessage('Content must be at least 50 characters'),
    body('sourceUrl')
      .optional()
      .isURL()
      .withMessage('Invalid source URL'),
  ],
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const { title, content: textContent, sourceUrl } = req.body;
    let sourceType: 'text' | 'pdf' | 'docx' | 'url' = 'text';
    let finalContent: string = textContent || '';

    // Handle file upload
    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext === '.pdf') {
        sourceType = 'pdf';
        // In production, use pdf-parse here
        finalContent = `[PDF Content - ${req.file.originalname}]`;
      } else if (ext === '.docx') {
        sourceType = 'docx';
        // In production, use mammoth here
        finalContent = `[DOCX Content - ${req.file.originalname}]`;
      } else {
        sourceType = 'text';
        finalContent = req.file.buffer.toString('utf-8');
      }
    }

    // Calculate metadata
    const wordCount = finalContent.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed

    const article = await Article.create({
      title,
      content: finalContent,
      originalContent: finalContent,
      sourceType: sourceUrl ? 'url' : sourceType,
      sourceUrl: sourceUrl || undefined,
      uploadedBy: req.user?.id,
      metadata: {
        wordCount,
        readingTime,
        language: 'en',
        topics: [],
        sentiment: 'neutral',
      },
      status: 'pending',
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(req.user?.id || '').emit('article:uploaded', {
      articleId: article._id,
      title: article.title,
    });

    res.status(201).json({
      success: true,
      data: { article },
    });
  })
);

// @route   GET /api/articles
// @desc    Get all articles for user
// @access  Private
router.get(
  '/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Invalid page number'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Invalid limit'),
    query('status').optional().isIn(['pending', 'processing', 'completed', 'failed']),
    query('search').optional().isString(),
  ],
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip: number = (page - 1) * limit;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const query: any = { uploadedBy: req.user?.id };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const [articles, total] = await Promise.all([
      Article.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('brandVoice', 'name'),
      Article.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        articles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  })
);

// @route   GET /api/articles/:id
// @desc    Get single article
// @access  Private
router.get(
  '/:id',
  authenticate,
  [param('id').isMongoId().withMessage('Invalid article ID')],
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const article = await Article.findOne({
      _id: req.params.id,
      uploadedBy: req.user?.id,
    }).populate('brandVoice', 'name systemPrompt');

    if (!article) {
      throw createError('Article not found', 404);
    }

    // Get reformatted content for this article
    const reformattedContent = await ReformattedContent.find({
      articleId: article._id,
    });

    res.json({
      success: true,
      data: {
        article,
        reformattedContent,
      },
    });
  })
);

// @route   PUT /api/articles/:id
// @desc    Update article
// @access  Private (Editor+)
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'editor'),
  [
    param('id').isMongoId().withMessage('Invalid article ID'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  ],
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const { title, content, brandVoice } = req.body;

    const article = await Article.findOneAndUpdate(
      { _id: req.params.id, uploadedBy: req.user?.id },
      {
        ...(title && { title }),
        ...(content && { content }),
        ...(brandVoice && { brandVoice }),
      },
      { new: true, runValidators: true }
    );

    if (!article) {
      throw createError('Article not found', 404);
    }

    res.json({
      success: true,
      data: { article },
    });
  })
);

// @route   DELETE /api/articles/:id
// @desc    Delete article
// @access  Private (Admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid article ID')],
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const article = await Article.findOneAndDelete({
      _id: req.params.id,
      uploadedBy: req.user?.id,
    });

    if (!article) {
      throw createError('Article not found', 404);
    }

    // Delete associated reformatted content
    await ReformattedContent.deleteMany({ articleId: article._id });

    res.json({
      success: true,
      message: 'Article deleted successfully',
    });
  })
);

// @route   POST /api/articles/:id/process
// @desc    Start processing article for all platforms
// @access  Private
router.post(
  '/:id/process',
  authenticate,
  [param('id').isMongoId().withMessage('Invalid article ID')],
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const article = await Article.findOne({
      _id: req.params.id,
      uploadedBy: req.user?.id,
    });

    if (!article) {
      throw createError('Article not found', 404);
    }

    if (article.status === 'processing') {
      throw createError('Article is already being processed', 400);
    }

    // Update status to processing
    article.status = 'processing';
    await article.save();

    // Emit event to start processing
    const io = req.app.get('io');
    const processService = new ProcessService(io);

    // Start processing (background)
    processService.startProcessing({
      userId: req.user?.id || '',
      articleId: article._id.toString(),
      articleContent: article.content,
      articleTitle: article.title,
      brandVoiceId: article.brandVoice?.toString(),
      platforms: [],
    }).catch(err => console.error('Processing error:', err));

    // We already updated status to 'processing' above.

    res.json({
      success: true,
      message: 'Processing started',
      data: { articleId: article._id },
    });
  })
);

// @route   POST /api/articles/generate
// @desc    Generate a new article from info
// @access  Private
router.post(
  '/generate',
  authenticate,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('info').notEmpty().withMessage('Information/Notes are required'),
    body('brandVoiceId').optional().isMongoId().withMessage('Invalid Brand Voice ID'),
  ],
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const { title, info, brandVoiceId } = req.body;

    // Get brand voice if specified
    const brandVoice = brandVoiceId
      ? await require('../models/BrandVoice').default.findById(brandVoiceId)
      : null;

    const openAIAgent = new (require('../agents/openAIAgent').OpenAIAgent)();

    const generatedContent = await openAIAgent.generateArticle({
      title,
      info,
      brandVoiceStyle: brandVoice?.tone,
      systemPrompt: brandVoice?.systemPrompt,
    });

    // Calculate metadata
    const wordCount = generatedContent.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.ceil(wordCount / 200);

    const article = await Article.create({
      title,
      content: generatedContent,
      originalContent: generatedContent,
      sourceType: 'generated',
      uploadedBy: req.user?.id,
      brandVoice: brandVoiceId || undefined,
      metadata: {
        wordCount,
        readingTime,
        language: 'en',
        topics: [],
        sentiment: 'neutral',
      },
      status: 'pending',
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(req.user?.id || '').emit('article:uploaded', {
      articleId: article._id,
      title: article.title,
    });

    res.status(201).json({
      success: true,
      data: { article },
    });
  })
);

export default router;

