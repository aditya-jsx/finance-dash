import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ALL authenticated users can hit these endpoints. Role check was global, now it's record-level.

const recordSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1),
  date: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// Helper to check access
const getRecordAccess = async (recordId: string, userId: string) => {
  const record = await prisma.financialRecord.findUnique({
    where: { id: recordId },
    include: { accessRecords: true }
  });
  if (!record) return null;
  if (record.userId === userId) return 'OWNER';
  
  const access = record.accessRecords.find((a: any) => a.userId === userId);
  return access ? access.role : null; // 'VIEWER' or 'EDITOR' or null
};

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = recordSchema.parse(req.body);
    const record = await prisma.financialRecord.create({
      data: {
        ...data,
        userId: req.user!.id,
      },
    });
    res.json(record);
  } catch (err: any) {
    if (err instanceof z.ZodError) res.status(400).json({ error: err.issues });
    else res.status(500).json({ error: 'Server Error' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    // Fetch records they own OR they have access to
    const records = await prisma.financialRecord.findMany({
      where: {
        OR: [
          { userId: req.user!.id },
          { accessRecords: { some: { userId: req.user!.id } } }
        ]
      },
      include: {
        accessRecords: {
          include: { user: { select: { username: true, email: true } } }
        },
        user: { select: { username: true, email: true } } // creator
      },
      orderBy: { date: 'desc' },
    });
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: 'Server Error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const access = await getRecordAccess(req.params.id as string, req.user!.id);
    if (!access) return res.status(404).json({ error: 'Record not found' });
    if (access === 'VIEWER') return res.status(403).json({ error: 'You only have viewer access to this record' });

    const data = recordSchema.parse(req.body);
    const record = await prisma.financialRecord.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json(record);
  } catch (err: any) {
    if (err instanceof z.ZodError) res.status(400).json({ error: err.issues });
    else res.status(500).json({ error: 'Server Error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const access = await getRecordAccess(req.params.id as string, req.user!.id);
    if (!access) return res.status(404).json({ error: 'Record not found' });
    if (access === 'VIEWER') return res.status(403).json({ error: 'You only have viewer access to this record' });

    await prisma.financialRecord.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Server Error' });
  }
});

const shareSchema = z.object({
  username: z.string().trim().toLowerCase(),
  role: z.enum(['VIEWER', 'EDITOR'])
});

// POST /api/records/:id/share
router.post('/:id/share', async (req: AuthRequest, res: Response) => {
  try {
    const recordId = req.params.id as string;
    const access = await getRecordAccess(recordId, req.user!.id);
    
    if (!access) return res.status(404).json({ error: 'Record not found' });
    if (access !== 'OWNER') return res.status(403).json({ error: 'Only the owner can share this record' });

    const data = shareSchema.parse(req.body);
    
    const targetUser = await prisma.user.findUnique({ where: { username: data.username } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.id === req.user!.id) return res.status(400).json({ error: 'Cannot share with yourself' });

    const recordAccess = await prisma.recordAccess.upsert({
      where: {
        recordId_userId: {
          recordId,
          userId: targetUser.id
        }
      },
      update: { role: data.role as any },
      create: {
        recordId,
        userId: targetUser.id,
        role: data.role as any
      }
    });

    res.json(recordAccess);
  } catch (err: any) {
    if (err instanceof z.ZodError) res.status(400).json({ error: err.issues });
    else res.status(500).json({ error: 'Server Error' });
  }
});

// DELETE /api/records/:id/share/:username
router.delete('/:id/share/:username', async (req: AuthRequest, res: Response) => {
  try {
    const recordId = req.params.id as string;
    const access = await getRecordAccess(recordId, req.user!.id);
    
    if (!access) return res.status(404).json({ error: 'Record not found' });
    if (access !== 'OWNER') return res.status(403).json({ error: 'Only the owner can modify sharing' });

    const targetUser = await prisma.user.findUnique({ where: { username: req.params.username as string } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    await prisma.recordAccess.delete({
      where: {
        recordId_userId: {
          recordId,
          userId: targetUser.id
        }
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
