import { Router, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import ReformattedContent from '../models/ReformattedContent';
import Article from '../models/Article';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { DistributionService } from '../services/distributionService';

const router = Router();

// @route   POST /api/distribute
// @desc    Distribute content to a platform
// @access  Private
router.post(
  '/',
  authenticate,
  [
    body('contentId').optional().isMongoId().withMessage('Invalid content ID'),
    body('articleId').optional().isMongoId().withMessage('Invalid article ID'),
    body('platform')
      .isIn(['linkedin', 'twitter', 'facebook', 'instagram', 'newsletter', 'email'])
      .withMessage('Invalid platform'),
    body('scheduleTime')
      .optional()
      .isISO8601()
      .withMessage('Invalid schedule time'),
  ],
  asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { contentId, articleId, platform, scheduleTime, options } = req.body;

    if (!contentId && !articleId) {
      throw createError('Either contentId or articleId must be provided', 400);
    }

    let shareTitle = '';
    let shareContent = '';
    let shareId = '';

    if (contentId) {
      const content = await ReformattedContent.findById(contentId).populate('articleId');
      if (!content) {
        throw createError('Content not found', 404);
      }

      const article = await Article.findById(content.articleId);
      if (!article) {
        throw createError('Article not found', 404);
      }

      if (article.uploadedBy.toString() !== req.user?.id) {
        throw createError('Not authorized to distribute this content', 403);
      }

      shareTitle = content.title;
      shareContent = content.content;
      shareId = content._id.toString();
    } else if (articleId) {
      const article = await Article.findById(articleId);
      if (!article) {
        throw createError('Article not found', 404);
      }

      if (article.uploadedBy.toString() !== req.user?.id) {
        throw createError('Not authorized to distribute this content', 403);
      }

      shareTitle = article.title;
      shareContent = article.content;
      shareId = article._id.toString();
    }

    const distributionService = new DistributionService(req.app.get('io'));

    let result;
    if (scheduleTime) {
      // Schedule the post
      const scheduledPost = await distributionService.schedulePost({
        contentId: shareId,
        platform,
        scheduledTime: new Date(scheduleTime),
        content: shareContent,
        title: shareTitle,
        userId: req.user?.id || '',
        options,
      });

      result = {
        success: true,
        data: {
          scheduledPost,
          message: `Content scheduled for ${platform} on ${scheduleTime}`,
        },
      };
    } else {
      // Post immediately
      const postResult = await distributionService.postToPlatform({
        contentId: shareId,
        platform,
        content: shareContent,
        title: shareTitle,
        userId: req.user?.id || '',
        options,
      });

      result = {
        success: true,
        data: {
          postResult,
          message: `Content posted to ${platform} successfully`,
        },
      };
    }

    res.json(result);
  })
);

// @route   GET /api/distribute/history
// @desc    Get distribution history
// @access  Private
router.get(
  '/history',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { page = 1, limit = 20, platform, status } = req.query;

    // In production, fetch from database
    const mockHistory = [
      {
        id: '1',
        platform: 'linkedin',
        contentTitle: 'Breaking News: Tech Giant Announces AI Innovation',
        status: 'published',
        publishedAt: new Date().toISOString(),
        url: 'https://linkedin.com/posts/123',
      },
      {
        id: '2',
        platform: 'twitter',
        contentTitle: 'Breaking News: Tech Giant Announces AI Innovation',
        status: 'published',
        publishedAt: new Date().toISOString(),
        url: 'https://twitter.com/123',
      },
    ];

    res.json({
      success: true,
      data: {
        history: mockHistory,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: mockHistory.length,
          pages: Math.ceil(mockHistory.length / Number(limit)),
        },
      },
    });
  })
);

// @route   GET /api/distribute/scheduled
// @desc    Get scheduled posts
// @access  Private
router.get(
  '/scheduled',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const scheduledPosts = [
      {
        id: '1',
        contentId: 'abc123',
        platform: 'linkedin',
        scheduledTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        contentTitle: 'Upcoming Feature Article',
      },
    ];

    res.json({
      success: true,
      data: { scheduledPosts },
    });
  })
);

// @route   DELETE /api/distribute/scheduled/:id
// @desc    Cancel scheduled post
// @access  Private
router.delete(
  '/scheduled/:id',
  authenticate,
  [param('id').isMongoId().withMessage('Invalid scheduled post ID')],
  asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // In production, remove from schedule
    res.json({
      success: true,
      message: 'Scheduled post cancelled',
    });
  })
);

// @route   GET /api/distribute/platforms
// @desc    Get available platforms with connection status
// @access  Private
router.get(
  '/platforms',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.userDoc;
    const userPlatforms = user?.socialAccounts || [];

    const platforms = [
      {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: 'linkedin',
        connected: userPlatforms.find((p) => p.platform === 'linkedin')?.connected || false,
        username: userPlatforms.find((p) => p.platform === 'linkedin')?.username,
        maxLength: 3000,
        supportsScheduling: true,
      },
      {
        id: 'twitter',
        name: 'X (Twitter)',
        icon: 'twitter',
        connected: userPlatforms.find((p) => p.platform === 'twitter')?.connected || false,
        username: userPlatforms.find((p) => p.platform === 'twitter')?.username,
        maxLength: 280,
        supportsScheduling: true,
      },
      {
        id: 'facebook',
        name: 'Facebook',
        icon: 'facebook',
        connected: userPlatforms.find((p) => p.platform === 'facebook')?.connected || false,
        username: userPlatforms.find((p) => p.platform === 'facebook')?.username,
        maxLength: 63206,
        supportsScheduling: true,
      },
      {
        id: 'instagram',
        name: 'Instagram',
        icon: 'instagram',
        connected: userPlatforms.find((p) => p.platform === 'instagram')?.connected || false,
        username: userPlatforms.find((p) => p.platform === 'instagram')?.username,
        maxLength: 2200,
        supportsScheduling: true,
      },
      {
        id: 'newsletter',
        name: 'Newsletter',
        icon: 'mail',
        connected: true, // Newsletter is always "connected" as it's built-in or uses internal list
        maxLength: null,
        supportsScheduling: true,
      },
    ];

    res.json({
      success: true,
      data: { platforms },
    });
  })
);

// @route   POST /api/distribute/connect/:platform
// @desc    Connect a social media platform (Simulation Mode)
// @access  Private
router.post(
  '/connect/:platform',
  authenticate,
  [param('platform').isIn(['linkedin', 'twitter', 'facebook', 'instagram'])],
  asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { platform } = req.params;
    const { username } = req.body;

    const user = req.userDoc;
    if (!user) throw createError('User not found', 404);

    // Update or add the social account
    const accountIndex = user.socialAccounts.findIndex(a => a.platform === platform);

    if (accountIndex > -1) {
      user.socialAccounts[accountIndex].connected = true;
      user.socialAccounts[accountIndex].username = username || `@test_user_${platform}`;
      user.socialAccounts[accountIndex].connectedAt = new Date();
    } else {
      user.socialAccounts.push({
        platform,
        connected: true,
        username: username || `@test_user_${platform}`,
        connectedAt: new Date(),
      });
    }

    await user.save();

    res.json({
      success: true,
      message: `${platform} connected successfully (Simulation Mode)`,
      data: {
        platform,
        connected: true,
        username: username || `@test_user_${platform}`,
      }
    });
  })
);

// @route   DELETE /api/distribute/disconnect/:platform
// @desc    Disconnect a social media platform
// @access  Private
router.delete(
  '/disconnect/:platform',
  authenticate,
  [param('platform').isIn(['linkedin', 'twitter', 'facebook', 'instagram'])],
  asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { platform } = req.params;

    const user = req.userDoc;
    if (!user) throw createError('User not found', 404);

    user.socialAccounts = user.socialAccounts.filter(a => a.platform !== platform);
    await user.save();

    res.json({
      success: true,
      message: `${platform} disconnected successfully`,
    });
  })
);

// @route   POST /api/distribute/callback/:platform
// @desc    Handle OAuth callback
// @access  Public (should verify code)
router.post(
  '/callback/:platform',
  [param('platform').isIn(['linkedin', 'twitter', 'facebook', 'instagram'])],
  asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { platform } = req.params;
    const { code } = req.body;

    // In production, exchange code for access token
    res.json({
      success: true,
      message: `${platform} connected successfully`,
    });
  })
);

export default router;

