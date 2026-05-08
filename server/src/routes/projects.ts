import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireProjectAccess } from '../middleware/rbac';

const router = Router();
const prisma = new PrismaClient();

// GET /api/projects — list user's projects
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const isGlobalAdmin = req.user!.role === 'ADMIN';

    const where = isGlobalAdmin
      ? {}
      : {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        };

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { tasks: true } },
        tasks: {
          select: { status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const projectsWithStats = projects.map((p) => {
      const taskStats = {
        total: p.tasks.length,
        todo: p.tasks.filter((t) => t.status === 'TODO').length,
        inProgress: p.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
        inReview: p.tasks.filter((t) => t.status === 'IN_REVIEW').length,
        done: p.tasks.filter((t) => t.status === 'DONE').length,
      };
      const { tasks, _count, ...rest } = p;
      return { ...rest, taskStats };
    });

    res.json(projectsWithStats);
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects — create project
router.post(
  '/',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('description').optional().trim(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg });
      return;
    }

    try {
      const { name, description } = req.body;
      const userId = req.user!.userId;

      const project = await prisma.project.create({
        data: {
          name,
          description: description || null,
          ownerId: userId,
          members: {
            create: { userId, role: 'ADMIN' },
          },
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });

      await prisma.activityLog.create({
        data: {
          action: 'PROJECT_CREATED',
          details: `Created project "${name}"`,
          userId,
          projectId: project.id,
        },
      });

      res.status(201).json(project);
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

// GET /api/projects/:id — get project details
router.get('/:id', authenticate, requireProjectAccess(), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// PUT /api/projects/:id — update project
router.put(
  '/:id',
  authenticate,
  requireProjectAccess('ADMIN'),
  [
    body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty'),
    body('description').optional().trim(),
    body('status').optional().isIn(['ACTIVE', 'ARCHIVED']).withMessage('Invalid status'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg });
      return;
    }

    try {
      const { name, description, status } = req.body;
      const project = await prisma.project.update({
        where: { id: req.params.id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(status && { status }),
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });

      await prisma.activityLog.create({
        data: {
          action: 'PROJECT_UPDATED',
          details: `Updated project "${project.name}"`,
          userId: req.user!.userId,
          projectId: project.id,
        },
      });

      res.json(project);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update project' });
    }
  }
);

// DELETE /api/projects/:id
router.delete('/:id', authenticate, requireProjectAccess('ADMIN'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// POST /api/projects/:id/members — add member
router.post(
  '/:id/members',
  authenticate,
  requireProjectAccess('ADMIN'),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').optional().isIn(['ADMIN', 'MEMBER']).withMessage('Role must be ADMIN or MEMBER'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg });
      return;
    }

    try {
      const { email, role } = req.body;
      const projectId = req.params.id;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        res.status(404).json({ error: 'User not found with this email' });
        return;
      }

      const existingMember = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: user.id } },
      });
      if (existingMember) {
        res.status(409).json({ error: 'User is already a project member' });
        return;
      }

      const member = await prisma.projectMember.create({
        data: { projectId, userId: user.id, role: role || 'MEMBER' },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      await prisma.activityLog.create({
        data: {
          action: 'MEMBER_ADDED',
          details: `Added ${user.name} to project`,
          userId: req.user!.userId,
          projectId,
        },
      });

      res.status(201).json(member);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add member' });
    }
  }
);

// PUT /api/projects/:id/members/:userId — update member role
router.put(
  '/:id/members/:userId',
  authenticate,
  requireProjectAccess('ADMIN'),
  [body('role').isIn(['ADMIN', 'MEMBER']).withMessage('Role must be ADMIN or MEMBER')],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id: projectId, userId } = req.params;
      const { role } = req.body;

      const member = await prisma.projectMember.update({
        where: { projectId_userId: { projectId, userId } },
        data: { role },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      res.json(member);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update member role' });
    }
  }
);

// DELETE /api/projects/:id/members/:userId — remove member
router.delete(
  '/:id/members/:userId',
  authenticate,
  requireProjectAccess('ADMIN'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id: projectId, userId } = req.params;

      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (project?.ownerId === userId) {
        res.status(400).json({ error: 'Cannot remove the project owner' });
        return;
      }

      await prisma.projectMember.delete({
        where: { projectId_userId: { projectId, userId } },
      });

      await prisma.activityLog.create({
        data: {
          action: 'MEMBER_REMOVED',
          details: 'Removed a member from project',
          userId: req.user!.userId,
          projectId,
        },
      });

      res.json({ message: 'Member removed' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove member' });
    }
  }
);

export default router;
