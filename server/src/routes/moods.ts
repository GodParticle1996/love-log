import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Memory } from '../models/Memory.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/moods — aggregate mood stats
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { year } = req.query;
    // Aggregation pipelines don't cast strings to ObjectId like find() does
    const matchFilter: any = { userId: new mongoose.Types.ObjectId(req.userId), mood: { $ne: null } };

    if (year) {
      const y = parseInt(year as string);
      matchFilter.date = {
        $gte: new Date(y, 0, 1),
        $lte: new Date(y, 11, 31, 23, 59, 59, 999),
      };
    }

    const moodCounts = await Memory.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const moodDistribution: Record<string, number> = {};
    const total = moodCounts.reduce((sum, m) => sum + m.count, 0);

    for (const entry of moodCounts) {
      if (entry._id) {
        moodDistribution[entry._id] = Math.round((entry.count / total) * 100);
      }
    }

    // Monthly mood breakdown
    const monthlyMoods = await Memory.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { month: { $month: '$date' }, mood: '$mood' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.month',
          moods: {
            $push: { mood: '$_id.mood', count: '$count' },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      total: moodCounts.reduce((sum, m) => sum + m.count, 0),
      distribution: moodDistribution,
      counts: Object.fromEntries(moodCounts.map((m) => [m._id, m.count])),
      monthly: monthlyMoods,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
