import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

const registerSchema = z.object({
  username: z.string().trim().toLowerCase().min(3),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string(),
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = registerSchema.parse(req.body);
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Auto-assign first user as ADMIN, others as VIEWER for testing convenience
    const count = await prisma.user.count();
    const role = count === 0 ? 'ADMIN' : 'VIEWER';

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: role as any,
      },
    });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.status === 'INACTIVE') {
      return res.status(401).json({ error: 'Invalid credentials or inactive account' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

export default router;
