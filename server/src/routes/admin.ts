import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Middleware to ensure user is an ADMIN
const isAdmin = (req: AuthRequest, res: Response, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

// GET /api/admin/stats - Global system overview
router.get('/stats', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [userCount, projectCount, taskCount, overdueTasks] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.task.count({
        where: {
          status: { not: 'DONE' },
          dueDate: { lt: new Date() }
        }
      })
    ]);

    res.json({
      users: userCount,
      projects: projectCount,
      tasks: taskCount,
      overdue: overdueTasks
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// GET /api/admin/users - Detailed member tracking
router.get('/users', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLogin: true,
        lastLogout: true,
        createdAt: true,
        _count: {
          select: {
            assignedTasks: true,
            ownedProjects: true
          }
        }
      },
      orderBy: { lastLogin: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user tracking data' });
  }
});

// GET /api/admin/tasks - Global task monitoring
router.get('/tasks', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignee: { select: { name: true, email: true } },
        project: { select: { name: true } }
      },
      orderBy: { dueDate: 'asc' }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch global task list' });
  }
});

export default router;
