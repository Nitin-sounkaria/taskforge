import { Router, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireProjectAccess } from '../middleware/rbac';

const router = Router();
const prisma = new PrismaClient();

router.get(
  '/projects/:id/tasks',
  authenticate,
  requireProjectAccess(),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const projectId = req.params.id;
      const { status, priority, assigneeId, search } = req.query;
      const where: any = { projectId };
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (assigneeId) where.assigneeId = assigneeId;
      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ];
      }
      const tasks = await prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }
);

router.post(
  '/projects/:id/tasks',
  authenticate,
  requireProjectAccess(),
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('description').optional().trim(),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('assigneeId').optional(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg });
      return;
    }
    try {
      const projectId = req.params.id;
      const { title, description, status, priority, dueDate, assigneeId } = req.body;
      if (assigneeId) {
        const isMember = await prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId: assigneeId } },
        });
        if (!isMember) {
          res.status(400).json({ error: 'Assignee must be a project member' });
          return;
        }
      }
      const task = await prisma.task.create({
        data: {
          title, description: description || null,
          status: status || 'TODO', priority: priority || 'MEDIUM',
          dueDate: dueDate ? new Date(dueDate) : null,
          projectId, assigneeId: assigneeId || null, creatorId: req.user!.userId,
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      });
      await prisma.activityLog.create({
        data: { action: 'TASK_CREATED', details: `Created task "${title}"`, userId: req.user!.userId, projectId, taskId: task.id },
      });
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
);

router.get('/tasks/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    if (req.user!.role !== 'ADMIN') {
      const isMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: req.user!.userId } },
      });
      if (!isMember) { res.status(403).json({ error: 'Access denied' }); return; }
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

router.put('/tasks/:id', authenticate,
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim(),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    body('dueDate').optional({ values: 'null' }).isISO8601(),
    body('assigneeId').optional({ values: 'null' }),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ error: errors.array()[0].msg }); return; }
    try {
      const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
      if (!existing) { res.status(404).json({ error: 'Task not found' }); return; }
      if (req.user!.role !== 'ADMIN') {
        const membership = await prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId: existing.projectId, userId: req.user!.userId } },
        });
        if (!membership) { res.status(403).json({ error: 'Access denied' }); return; }
        if (membership.role === 'MEMBER' && existing.assigneeId !== req.user!.userId) {
          res.status(403).json({ error: 'You can only update tasks assigned to you' }); return;
        }
      }
      const { title, description, status, priority, dueDate, assigneeId } = req.body;
      const task = await prisma.task.update({
        where: { id: req.params.id },
        data: {
          ...(title && { title }), ...(description !== undefined && { description }),
          ...(status && { status }), ...(priority && { priority }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      });
      await prisma.activityLog.create({
        data: { action: 'TASK_UPDATED', details: `Updated task "${task.title}"`, userId: req.user!.userId, projectId: existing.projectId, taskId: task.id },
      });
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
);

router.delete('/tasks/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    if (req.user!.role !== 'ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: req.user!.userId } },
      });
      if (!membership || membership.role !== 'ADMIN') {
        res.status(403).json({ error: 'Only project admins can delete tasks' }); return;
      }
    }
    await prisma.activityLog.create({
      data: { action: 'TASK_DELETED', details: `Deleted task "${task.title}"`, userId: req.user!.userId, projectId: task.projectId },
    });
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
