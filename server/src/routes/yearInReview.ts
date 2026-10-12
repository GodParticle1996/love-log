import { Router, Response } from 'express';
import { Memory } from '../models/Memory.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/year-in-review/:year
router.get('/:year', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const year = parseInt(req.params.year);
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);

    const memories = await Memory.find({
      userId: req.userId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    // Compute stats
    const totalMemories = memories.length;
    const totalPhotos = memories.reduce((sum, m) => sum + m.photos.length, 0);

    // Mood distribution
    const moodCounts: Record<string, number> = {};
    for (const m of memories) {
      if (m.mood) {
        moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
      }
    }
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

    // Top locations
    const locationCounts: Record<string, number> = {};
    for (const m of memories) {
      if (m.location) {
        locationCounts[m.location] = (locationCounts[m.location] || 0) + 1;
      }
    }
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));

    // Monthly breakdown
    const monthly = new Array(12).fill(0);
    for (const m of memories) {
      monthly[m.date.getMonth()]++;
    }

    // Most active month
    const mostActiveMonth = monthly.indexOf(Math.max(...monthly));

    // Top tags
    const tagCounts: Record<string, number> = {};
    for (const m of memories) {
      for (const tag of m.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Longest streak (consecutive days with memories)
    const dateSet = new Set(
      memories.map((m) => m.date.toISOString().slice(0, 10))
    );
    let longestStreak = 0;
    let currentStreak = 0;
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    for (let d = new Date(yearStart); d <= yearEnd; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      if (dateSet.has(key)) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    // Pick cover photos (one per quarter)
    const coverPhotos = memories
      .filter((m) => m.photos.length > 0)
      .slice(0, 12)
      .flatMap((m) => m.photos.map((p) => ({ url: p.url, title: m.title, month: m.date.getMonth() })));

    res.json({
      year,
      stats: {
        totalMemories,
        totalPhotos,
        topMood: topMood ? { emoji: topMood[0], count: topMood[1] } : null,
        topLocations,
        monthly,
        mostActiveMonth,
        topTags,
        longestStreak,
        moodDistribution: moodCounts,
      },
      coverPhotos,
      highlights: memories
        .sort((a, b) => (b.photos.length + (b.description?.length || 0) / 100) - (a.photos.length + (a.description?.length || 0) / 100))
        .slice(0, 12),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
