import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/dashboard/stats
router.get('/stats', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    const projectIds = isAdmin
      ? (await prisma.project.findMany({ select: { id: true } })).map((p) => p.id)
      : (await prisma.projectMember.findMany({ where: { userId }, select: { projectId: true } })).map((m) => m.projectId);

    const [totalProjects, tasks, overdueTasks] = await Promise.all([
      prisma.project.count({ where: { id: { in: projectIds } } }),
      prisma.task.findMany({ where: { projectId: { in: projectIds } }, select: { status: true, dueDate: true } }),
      prisma.task.count({
        where: {
          projectId: { in: projectIds },
          dueDate: { lt: new Date() },
          status: { not: 'DONE' },
        },
      }),
    ]);

    const statusCounts = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
    tasks.forEach((t) => { statusCounts[t.status]++; });

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dueThisWeek = tasks.filter(
      (t) => t.dueDate && t.dueDate >= now && t.dueDate <= weekFromNow && t.status !== 'DONE'
    ).length;

    res.json({
      totalProjects,
      totalTasks: tasks.length,
      statusCounts,
      overdueTasks,
      dueThisWeek,
      completionRate: tasks.length > 0 ? Math.round((statusCounts.DONE / tasks.length) * 100) : 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/dashboard/overdue
router.get('/overdue', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    const projectIds = isAdmin
      ? (await prisma.project.findMany({ select: { id: true } })).map((p) => p.id)
      : (await prisma.projectMember.findMany({ where: { userId }, select: { projectId: true } })).map((m) => m.projectId);

    const overdueTasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: new Date() },
        status: { not: 'DONE' },
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    });

    res.json(overdueTasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overdue tasks' });
  }
});

// GET /api/dashboard/recent-activity
router.get('/recent-activity', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    const projectIds = isAdmin
      ? (await prisma.project.findMany({ select: { id: true } })).map((p) => p.id)
      : (await prisma.projectMember.findMany({ where: { userId }, select: { projectId: true } })).map((m) => m.projectId);

    const activities = await prisma.activityLog.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

export default router;
