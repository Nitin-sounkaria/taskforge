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

    const statusCounts: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
    tasks.forEach((t) => { if (statusCounts[t.status] !== undefined) statusCounts[t.status]++; });

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

// GET /api/dashboard/charts — rich chart data
router.get('/charts', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    const projectIds = isAdmin
      ? (await prisma.project.findMany({ select: { id: true } })).map((p) => p.id)
      : (await prisma.projectMember.findMany({ where: { userId }, select: { projectId: true } })).map((m) => m.projectId);

    // Priority distribution
    const allTasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      select: { priority: true, status: true, projectId: true, assigneeId: true, createdAt: true },
    });

    const priorityCounts: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    allTasks.forEach((t) => { if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++; });

    // Tasks per project
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true, _count: { select: { tasks: true } } },
    });
    const tasksByProject = projects.map((p) => ({ name: p.name, tasks: p._count.tasks }));

    // Daily activity for past 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const recentActivities = await prisma.activityLog.findMany({
      where: { projectId: { in: projectIds }, createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true, action: true },
    });

    const dailyActivity: Record<string, { date: string; tasks_created: number; tasks_updated: number; total: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyActivity[key] = { date: key, tasks_created: 0, tasks_updated: 0, total: 0 };
    }
    recentActivities.forEach((a) => {
      const key = a.createdAt.toISOString().slice(0, 10);
      if (dailyActivity[key]) {
        dailyActivity[key].total++;
        if (a.action === 'TASK_CREATED') dailyActivity[key].tasks_created++;
        else if (a.action === 'TASK_UPDATED') dailyActivity[key].tasks_updated++;
      }
    });

    // Workload by member
    const members = await prisma.projectMember.findMany({
      where: { projectId: { in: projectIds } },
      select: { userId: true, user: { select: { name: true } } },
      distinct: ['userId'],
    });
    const workload = await Promise.all(
      members.map(async (m) => {
        const assigned = await prisma.task.count({
          where: { projectId: { in: projectIds }, assigneeId: m.userId, status: { not: 'DONE' } },
        });
        const completed = await prisma.task.count({
          where: { projectId: { in: projectIds }, assigneeId: m.userId, status: 'DONE' },
        });
        return { name: m.user.name, active: assigned, completed };
      })
    );

    res.json({
      priorityCounts,
      tasksByProject,
      dailyActivity: Object.values(dailyActivity),
      workload,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

export default router;
