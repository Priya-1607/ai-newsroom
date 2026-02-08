import { Router } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import { body } from 'express-validator';
import User from '../models/User';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Generate tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { id: userId },
    (process.env.JWT_SECRET || 'default-secret') as Secret,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
  );

  const refreshToken = jwt.sign(
    { id: userId, type: 'refresh' },
    (process.env.JWT_REFRESH_SECRET || 'refresh-secret') as Secret,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as any }
  );

  return { accessToken, refreshToken };
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('name').notEmpty().withMessage('Name is required'),
  ],
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const { email, password, name, company } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createError('Email already registered', 400);
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      company,
    });

    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          company: user.company,
        },
        accessToken,
        refreshToken,
      },
    });
  })
);

// @route   POST /api/auth/login
// @desc    User login
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw createError('Invalid credentials', 401);
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw createError('Invalid credentials', 401);
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString());

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          company: user.company,
          preferences: user.preferences,
        },
        accessToken,
        refreshToken,
      },
    });
  })
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post(
  '/refresh',
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw createError('Refresh token required', 400);
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        (process.env.JWT_REFRESH_SECRET || 'refresh-secret') as Secret
      ) as { id: string };

      const accessToken = jwt.sign(
        { id: decoded.id },
        (process.env.JWT_SECRET || 'default-secret') as Secret,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
      );

      res.json({
        success: true,
        data: { accessToken },
      });
    } catch (error) {
      throw createError('Invalid refresh token', 401);
    }
  })
);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const user = await User.findById(req.user?.id);
    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          company: user.company,
          avatar: user.avatar,
          preferences: user.preferences,
          createdAt: user.createdAt,
        },
      },
    });
  })
);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const { name, company, preferences, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user?.id,
      {
        ...(name && { name }),
        ...(company !== undefined && { company }),
        ...(preferences && { preferences }),
        ...(avatar !== undefined && { avatar }),
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  })
);

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
  ],
  asyncHandler(async (req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?.id).select('+password');
    if (!user) {
      throw createError('User not found', 404);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw createError('Current password is incorrect', 400);
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  })
);

export default router;

