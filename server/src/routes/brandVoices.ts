import { Router } from 'express';
import { body, param } from 'express-validator';
import BrandVoice from '../models/BrandVoice';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Default brand voice templates
const defaultVoices = {
  professional: {
    name: 'Professional News',
    description: 'Formal, authoritative tone for serious news coverage',
    systemPrompt: `You are a professional news editor for a major news outlet. Your writing is:
- Formal and authoritative
- Factual and objective
- Clear and precise
- Free of emotional language
- Structured with inverted pyramid style
Always maintain journalistic integrity and accuracy.`,
    tone: {
      formality: 'formal',
      sentiment: 'neutral',
      energy: 'medium',
    },
    style: {
      sentenceLength: 'medium',
      vocabulary: 'moderate',
      useEmojis: false,
      useHashtags: false,
    },
    keywords: [],
    phrasesToUse: ['According to sources', 'In a statement', 'Official figures show'],
    phrasesToAvoid: ['Amazing', 'Incredible', 'Shockingly'],
    platformOverrides: [],
  },
  casual: {
    name: 'Casual News',
    description: 'Friendly, engaging tone for younger audiences',
    systemPrompt: `You are a friendly news content creator who makes news engaging and accessible. Your writing is:
- Conversational and relatable
- Engaging with hooks and questions
- Uses emojis appropriately
- Breaks down complex topics
- Maintains accuracy while being approachable
Make the news feel like it coming from a knowledgeable friend.`,
    tone: {
      formality: 'casual',
      sentiment: 'positive',
      energy: 'high',
    },
    style: {
      sentenceLength: 'short',
      vocabulary: 'simple',
      useEmojis: true,
      useHashtags: true,
    },
    keywords: [],
    phrasesToUse: ['Here\'s the thing', 'You might be wondering', 'The bottom line'],
    phrasesToAvoid: ['Hitherto', 'Moreover', 'Consequently'],
    platformOverrides: [],
  },
  tech: {
    name: 'Tech News',
    description: 'Modern, innovative tone for technology coverage',
    systemPrompt: `You are a tech journalist covering the latest in technology and innovation. Your writing is:
- Forward-thinking and tech-savvy
- Explains technical concepts clearly
- Highlights innovation and impact
- Uses current tech terminology
- Balanced between excitement and skepticism
Help readers understand how technology affects their lives.`,
    tone: {
      formality: 'semi-formal',
      sentiment: 'neutral',
      energy: 'high',
    },
    style: {
      sentenceLength: 'medium',
      vocabulary: 'moderate',
      useEmojis: true,
      useHashtags: true,
    },
    keywords: ['AI', 'machine learning', 'innovation', 'digital transformation'],
    phrasesToUse: ['Game-changing', 'Disrupting the industry', 'Cutting-edge'],
    phrasesToAvoid: ['Old-fashioned', 'Behind the times'],
    platformOverrides: [],
  },
};

// @route   GET /api/brand-voices
// @desc    Get all brand voices
// @access  Private
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res, next) => {
    const voices = await BrandVoice.find({ createdBy: req.user?.id }).sort({
      isDefault: -1,
      name: 1,
    });

    res.json({
      success: true,
      data: { voices },
    });
  })
);

// @route   POST /api/brand-voices
// @desc    Create new brand voice
// @access  Private (Editor+)
router.post(
  '/',
  authenticate,
  authorize('admin', 'editor'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('systemPrompt').notEmpty().withMessage('System prompt is required'),
    body('tone').optional().isObject(),
    body('style').optional().isObject(),
  ],
  asyncHandler(async (req: AuthRequest, res, next) => {
    const {
      name,
      description,
      systemPrompt,
      tone,
      style,
      keywords,
      phrasesToUse,
      phrasesToAvoid,
      platformOverrides,
      isDefault,
    } = req.body;

    const voice = await BrandVoice.create({
      name,
      description,
      systemPrompt,
      tone,
      style,
      keywords: keywords || [],
      phrasesToUse: phrasesToUse || [],
      phrasesToAvoid: phrasesToAvoid || [],
      platformOverrides: platformOverrides || [],
      createdBy: req.user?.id,
      isDefault: isDefault || false,
    });

    res.status(201).json({
      success: true,
      data: { voice },
    });
  })
);

// @route   POST /api/brand-voices/templates
// @desc    Create brand voice from template
// @access  Private (Editor+)
router.post(
  '/templates',
  authenticate,
  authorize('admin', 'editor'),
  [body('template').isIn(['professional', 'casual', 'tech']).withMessage('Invalid template')],
  asyncHandler(async (req: AuthRequest, res, next) => {
    const { template, name, description } = req.body;
    const templateData = defaultVoices[template as keyof typeof defaultVoices];

    if (!templateData) {
      throw createError('Template not found', 400);
    }

    const voice = await BrandVoice.create({
      name: name || templateData.name,
      description: description || templateData.description,
      systemPrompt: templateData.systemPrompt,
      tone: templateData.tone,
      style: templateData.style,
      keywords: templateData.keywords,
      phrasesToUse: templateData.phrasesToUse,
      phrasesToAvoid: templateData.phrasesToAvoid,
      platformOverrides: templateData.platformOverrides,
      createdBy: req.user?.id,
      isDefault: false,
    });

    res.status(201).json({
      success: true,
      data: { voice },
      message: `Created brand voice from "${template}" template`,
    });
  })
);

// @route   GET /api/brand-voices/:id
// @desc    Get single brand voice
// @access  Private
router.get(
  '/:id',
  authenticate,
  [param('id').isMongoId().withMessage('Invalid brand voice ID')],
  asyncHandler(async (req: AuthRequest, res, next) => {
    const voice = await BrandVoice.findOne({
      _id: req.params.id,
      createdBy: req.user?.id,
    });

    if (!voice) {
      throw createError('Brand voice not found', 404);
    }

    res.json({
      success: true,
      data: { voice },
    });
  })
);

// @route   PUT /api/brand-voices/:id
// @desc    Update brand voice
// @access  Private (Editor+)
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'editor'),
  [
    param('id').isMongoId().withMessage('Invalid brand voice ID'),
    body('name').optional().notEmpty(),
    body('systemPrompt').optional().notEmpty(),
  ],
  asyncHandler(async (req: AuthRequest, res, next) => {
    const {
      name,
      description,
      systemPrompt,
      tone,
      style,
      keywords,
      phrasesToUse,
      phrasesToAvoid,
      platformOverrides,
      isDefault,
    } = req.body;

    const voice = await BrandVoice.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user?.id },
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(systemPrompt && { systemPrompt }),
        ...(tone && { tone }),
        ...(style && { style }),
        ...(keywords && { keywords }),
        ...(phrasesToUse && { phrasesToUse }),
        ...(phrasesToAvoid && { phrasesToAvoid }),
        ...(platformOverrides && { platformOverrides }),
        ...(isDefault !== undefined && { isDefault }),
      },
      { new: true, runValidators: true }
    );

    if (!voice) {
      throw createError('Brand voice not found', 404);
    }

    res.json({
      success: true,
      data: { voice },
    });
  })
);

// @route   DELETE /api/brand-voices/:id
// @desc    Delete brand voice
// @access  Private (Admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid brand voice ID')],
  asyncHandler(async (req: AuthRequest, res, next) => {
    const voice = await BrandVoice.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user?.id,
      isDefault: false, // Prevent deleting default voices
    });

    if (!voice) {
      throw createError('Brand voice not found or cannot be deleted', 404);
    }

    res.json({
      success: true,
      message: 'Brand voice deleted successfully',
    });
  })
);

// @route   POST /api/brand-voices/:id/test
// @desc    Test brand voice with sample content
// @access  Private
router.post(
  '/:id/test',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid brand voice ID'),
    body('content').notEmpty().withMessage('Test content is required'),
  ],
  asyncHandler(async (req: AuthRequest, res, next) => {
    const voice = await BrandVoice.findOne({
      _id: req.params.id,
      createdBy: req.user?.id,
    });

    if (!voice) {
      throw createError('Brand voice not found', 404);
    }

    const { content } = req.body;

    // In production, this would call OpenAI API
    // For now, return a simulated response
    const testOutput = `[TEST OUTPUT - ${voice.name}]
    
Original: ${content.substring(0, 100)}...

Transformed: This is a simulated transformation of the content 
in the voice of "${voice.name}". The system prompt used was:
"${voice.systemPrompt.substring(0, 100)}..."`;

    res.json({
      success: true,
      data: {
        original: content,
        transformed: testOutput,
        voice: {
          id: voice._id,
          name: voice.name,
        },
      },
    });
  })
);

export default router;

