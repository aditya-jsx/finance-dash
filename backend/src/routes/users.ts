import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware for authentication
router.use(authenticate);

// ONLY ADMIN can access user management
router.use(authorize(['ADMIN']));

// GET /api/users - List all users
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Update Role Schema
const roleSchema = z.object({
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']),
});

// PUT /api/users/:id/role - Update user role
router.put('/:id/role', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    // Prevent admin from removing their own admin status easily if desired, but omitting for simplicity
    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Cannot modify your own role' });
    }

    const data = roleSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id },
      data: { role: data.role as any },
      select: { id: true, email: true, role: true, status: true }
    });
    res.json(user);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues });
    } else {
      res.status(500).json({ error: 'Server Error' });
    }
  }
});

// Update Status Schema
const statusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

// PUT /api/users/:id/status - Update user status
router.put('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Cannot modify your own status' });
    }

    const data = statusSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id },
      data: { status: data.status as any },
      select: { id: true, email: true, role: true, status: true }
    });
    res.json(user);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues });
    } else {
      res.status(500).json({ error: 'Server Error' });
    }
  }
});

export default router;
