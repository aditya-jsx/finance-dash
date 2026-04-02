import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware for authentication
router.use(authenticate);

// GET /api/dashboard/summary
// Roles: VIEWER, ANALYST, ADMIN (All authenticated)
router.get('/summary', authorize(['VIEWER', 'ANALYST', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    // 1. Get raw totals
    const aggregations = await prisma.financialRecord.groupBy({
      by: ['type'],
      _sum: {
        amount: true,
      },
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    aggregations.forEach((agg: any) => {
      if (agg.type === 'INCOME') totalIncome = agg._sum.amount || 0;
      if (agg.type === 'EXPENSE') totalExpenses = agg._sum.amount || 0;
    });

    const netBalance = totalIncome - totalExpenses;

    // 2. Category wise totals
    const categoryAggregations = await prisma.financialRecord.groupBy({
      by: ['category', 'type'],
      _sum: {
        amount: true,
      },
    });

    const categoryWise = categoryAggregations.map((cat: any) => ({
      category: cat.category,
      type: cat.type,
      total: cat._sum.amount || 0,
    }));

    // 3. Recent activity
    const recentActivity = await prisma.financialRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        amount: true,
        type: true,
        category: true,
        date: true,
      }
    });

    // 4. Monthly trends using basic fetch (since prisma handles basic grouping, we aggregate here or via query)
    // Simplify by fetching recent 6 months and doing logic in JS, or grouping by truncated date
    const monthlyDataRaw = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE_TRUNC('month', date) as month,
        type,
        SUM(amount) as total
      FROM "FinancialRecord"
      GROUP BY DATE_TRUNC('month', date), type
      ORDER BY month DESC
      LIMIT 12
    `;

    const monthlyTrends = monthlyDataRaw.map((m: any) => ({
      month: m.month,
      type: m.type,
      total: m.total
    }));

    res.json({
      totalIncome,
      totalExpenses,
      netBalance,
      categoryWise,
      recentActivity,
      monthlyTrends
    });
  } catch (err: any) {
    console.error('Dashboard logic error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
