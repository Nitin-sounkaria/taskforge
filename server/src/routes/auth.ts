import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';
import { UAParser } from 'ua-parser-js';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg, details: errors.array() });
      return;
    }

    try {
      const { name, email, password } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      // Admin Logic: First user OR specific email becomes ADMIN
      const userCount = await prisma.user.count();
      const isAdminEmail = email.toLowerCase() === 'nitinbvcoe2024@gmail.com';
      const role = (userCount === 0 || isAdminEmail) ? 'ADMIN' : 'MEMBER';

      const ua = new UAParser(req.headers['user-agent']).getResult();
      const device = ua.device.model || ua.os.name || 'Unknown Device';
      const browser = `${ua.browser.name} ${ua.browser.version}`;

      const user = await prisma.user.create({
        data: { 
          name, 
          email, 
          password: hashedPassword, 
          role, 
          lastLogin: new Date(),
          lastDevice: device,
          lastBrowser: browser
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true, lastLogin: true },
      });

      // Create Session record
      await prisma.userSession.create({
        data: {
          userId: user.id,
          device,
          browser,
          ipAddress: req.ip || (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : req.headers['x-forwarded-for'])?.toString() || 'Unknown',
          loginAt: new Date()
        }
      });

      const tokenPayload = { userId: user.id, email: user.email, role: user.role };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      res.status(201).json({ user, accessToken, refreshToken });
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Failed to create account' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg, details: errors.array() });
      return;
    }

    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Update lastLogin and Device info
      const ua = new UAParser(req.headers['user-agent']).getResult();
      const device = ua.device.model || ua.os.name || 'Unknown Device';
      const browser = `${ua.browser.name} ${ua.browser.version}`;

      const isAdminEmail = email.toLowerCase() === 'nitinbvcoe2024@gmail.com' || email.toLowerCase() === 'nitin.bvcoe2024@gmail.com';

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { 
          lastLogin: new Date(),
          lastDevice: device,
          lastBrowser: browser,
          role: isAdminEmail ? 'ADMIN' : user.role
        }
      });

      // Create Session record
      await prisma.userSession.create({
        data: {
          userId: user.id,
          device,
          browser,
          ipAddress: req.ip || (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : req.headers['x-forwarded-for'])?.toString() || 'Unknown',
          loginAt: new Date()
        }
      });

      const tokenPayload = { userId: user.id, email: user.email, role: updatedUser.role };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ user: { ...userWithoutPassword, lastLogin: new Date() }, accessToken, refreshToken });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogout: new Date() }
    });

    // Close latest active session
    const activeSession = await prisma.userSession.findFirst({
      where: { userId, logoutAt: null },
      orderBy: { loginAt: 'desc' }
    });

    if (activeSession) {
      await prisma.userSession.update({
        where: { id: activeSession.id },
        data: { logoutAt: new Date() }
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout tracking failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const userEmail = req.user!.email;

    // AUTO-PROMOTE RULE: If this is the master email, ensure they are ADMIN
    if (userEmail.toLowerCase() === 'nitinbvcoe2024@gmail.com' || userEmail.toLowerCase() === 'nitin.bvcoe2024@gmail.com') {
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'ADMIN' }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true, lastLogin: true, lastLogout: true, lastDevice: true, lastBrowser: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// GET /api/auth/users - search users by email (for adding members)
router.get('/users', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { email: { contains: search as string, mode: 'insensitive' } },
              { name: { contains: search as string, mode: 'insensitive' } },
            ],
          }
        : {},
      select: { id: true, name: true, email: true, role: true },
      take: 10,
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search users' });
  }
});

export default router;
