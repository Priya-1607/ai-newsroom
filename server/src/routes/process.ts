import { Router } from 'express';
import { body, param } from 'express-validator';
import Article from '../models/Article';
import ReformattedContent from '../models/ReformattedContent';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ProcessService } from '../services/processService';

const router = Router();

// @route   POST /api/process/start
// @desc    Start processing an article for all platforms
// @access  Private
router.post(
  '/start',
  authenticate,
  [
    body('articleId').isMongoId().withMessage('Invalid article ID'),
    body('platforms')
      .optional()
      .isArray()
      .custom((value: any) => {
        const validPlatforms = [
          'linkedin',
          'tiktok',
          'newsletter',
          'seo',
          'press-release',
          'twitter',
          'instagram',
        ];
        return value.every((platform: string) => validPlatforms.includes(platform));
      }),
  ],
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const { articleId, platforms, brandVoiceId } = req.body;

    const article = await Article.findById(articleId);
    if (!article) {
      throw createError('Article not found', 404);
    }

    if (article.uploadedBy.toString() !== req.user?.id) {
      throw createError('Not authorized to process this article', 403);
    }

    // Update status to processing
    article.status = 'processing';
    await article.save();

    // Start the processing service
    const io = req.app.get('io');
    const processService = new ProcessService(io);

    const jobId = await processService.startProcessing({
      articleId: article._id.toString(),
      articleContent: article.content,
      articleTitle: article.title,
      brandVoiceId: brandVoiceId || article.brandVoice?.toString(),
      platforms: platforms || [
        'linkedin',
        'tiktok',
        'newsletter',
        'seo',
        'press-release',
      ],
      userId: req.user?.id || '',
    });

    res.json({
      success: true,
      message: 'Processing started',
      data: {
        jobId,
        articleId: article._id,
        platforms: platforms || ['linkedin', 'tiktok', 'newsletter', 'seo', 'press-release'],
      },
    });
  })
);

// @route   GET /api/process/status/:jobId
// @desc    Get processing status
// @access  Private
router.get(
  '/status/:jobId',
  authenticate,
  [param('jobId').isUUID().withMessage('Invalid job ID')],
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const { jobId } = req.params;

    // In production, get status from job queue/cache
    res.json({
      success: true,
      data: {
        jobId,
        status: 'processing', // pending, processing, completed, failed
        progress: 0,
        currentStep: 'Initializing...',
        agents: {
          researcher: { status: 'pending' },
          reformatter: { status: 'pending' },
          factChecker: { status: 'pending' },
          seoOptimizer: { status: 'pending' },
        },
      },
    });
  })
);

// @route   GET /api/process/results/:articleId
// @desc    Get processing results for an article
// @access  Private
router.get(
  '/results/:articleId',
  authenticate,
  [param('articleId').isMongoId().withMessage('Invalid article ID')],
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const { articleId } = req.params;
    const platform = req.query.platform as string;

    const article = await Article.findById(articleId);
    if (!article) {
      throw createError('Article not found', 404);
    }

    if (article.uploadedBy.toString() !== req.user?.id) {
      throw createError('Not authorized', 403);
    }

    const query: any = { articleId };
    if (platform) {
      query.platform = platform;
    }

    const results = await ReformattedContent.find(query);

    res.json({
      success: true,
      data: {
        article: {
          id: article._id,
          title: article.title,
          status: article.status,
        },
        reformattedContent: results,
      },
    });
  })
);

// @route   POST /api/process/reformat
// @desc    Reformat content for a specific platform
// @access  Private
router.post(
  '/reformat',
  authenticate,
  [
    body('content').notEmpty().withMessage('Content is required'),
    body('platform')
      .isIn(['linkedin', 'tiktok', 'newsletter', 'seo', 'press-release', 'twitter', 'instagram'])
      .withMessage('Invalid platform'),
    body('brandVoiceId').optional().isMongoId(),
  ],
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const { content, platform, brandVoiceId } = req.body;

    // In production, this would call the reformatter agent
    const processService = new ProcessService(req.app.get('io'));
    
    const result = await processService.reformatContent({
      content,
      platform,
      brandVoiceId,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

// @route   POST /api/process/fact-check
// @desc    Fact-check reformatted content
// @access  Private
router.post(
  '/fact-check',
  authenticate,
  [
    body('originalContent').notEmpty().withMessage('Original content is required'),
    body('reformattedContent').notEmpty().withMessage('Reformatted content is required'),
  ],
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const { originalContent, reformattedContent } = req.body;

    // In production, this would call the fact-checker agent
    const factCheckResult = {
      isVerified: true,
      discrepancies: [],
      verificationScore: 100,
      checkedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: {
        factCheck: factCheckResult,
      },
    });
  })
);

// @route   POST /api/process/optimize-seo
// @desc    Optimize content for SEO
// @access  Private
router.post(
  '/optimize-seo',
  authenticate,
  [
    body('content').notEmpty().withMessage('Content is required'),
    body('targetKeywords').optional().isArray(),
  ],
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const { content, targetKeywords, targetAudience } = req.body;

    // In production, this would call the SEO optimizer agent
    const seoResult = {
      optimizedContent: content,
      metaTitle: 'SEO Optimized Title',
      metaDescription: 'SEO optimized meta description',
      keywords: targetKeywords || [],
      suggestions: [
        'Add more internal links',
        'Include featured image',
        'Optimize heading structure',
      ],
    };

    res.json({
      success: true,
      data: seoResult,
    });
  })
);

// @route   POST /api/process/cancel/:jobId
// @desc    Cancel a processing job
// @access  Private
router.post(
  '/cancel/:jobId',
  authenticate,
  [param('jobId').isUUID().withMessage('Invalid job ID')],
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const { jobId } = req.params;

    // In production, cancel the job in the queue
    res.json({
      success: true,
      message: `Job ${jobId} cancelled`,
    });
  })
);

export default router;

