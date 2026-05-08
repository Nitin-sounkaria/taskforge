import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function requireGlobalAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Global admin access required' });
    return;
  }
  next();
}

export function requireProjectAccess(requiredRole?: 'ADMIN' | 'MEMBER') {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Global admins bypass project-level checks
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    const projectId = req.params.id || req.params.projectId;
    if (!projectId) {
      res.status(400).json({ error: 'Project ID required' });
      return;
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: req.user.userId,
        },
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'You are not a member of this project' });
      return;
    }

    if (requiredRole === 'ADMIN' && membership.role !== 'ADMIN') {
      res.status(403).json({ error: 'Project admin access required' });
      return;
    }

    (req as any).projectRole = membership.role;
    next();
  };
}
