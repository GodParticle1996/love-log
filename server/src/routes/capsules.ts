import { Router, Response } from 'express';
import { Capsule } from '../models/Capsule.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';


const router = Router();

// GET /api/capsules — list all capsules (locked + unlocked)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const capsules = await Capsule.find({ userId: req.userId })
      .sort({ unlockDate: 1 })
      .select('title unlockDate isLocked isRevealed createdAt');

    const now = new Date();

    const locked = capsules
      .filter((c) => c.unlockDate > now)
      .map((c) => ({
        _id: c._id,
        title: c.title,
        unlockDate: c.unlockDate,
        isLocked: true,
        createdAt: c.createdAt,
      }));

    const unlocked = capsules
      .filter((c) => c.unlockDate <= now)
      .map((c) => ({
        _id: c._id,
        title: c.title,
        unlockDate: c.unlockDate,
        isLocked: false,
        isRevealed: c.isRevealed,
        createdAt: c.createdAt,
      }));

    res.json({ locked, unlocked, total: capsules.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/capsules/:id — view a single capsule (only if unlocked)
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const capsule = await Capsule.findOne({ _id: req.params.id, userId: req.userId });
    if (!capsule) {
      res.status(404).json({ error: 'Capsule not found' });
      return;
    }

    const now = new Date();
    if (capsule.unlockDate > now) {
      res.status(403).json({
        error: 'This capsule is still locked',
        unlockDate: capsule.unlockDate,
        title: capsule.title,
      });
      return;
    }

    // Mark revealed if not already
    if (!capsule.isRevealed) {
      capsule.isRevealed = true;
      capsule.isLocked = false;
      await capsule.save();
    }

    res.json({ capsule });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/capsules — create a new time capsule
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, unlockDate } = req.body;

    if (!title || !message || !unlockDate) {
      res.status(400).json({ error: 'Title, message, and unlock date are required' });
      return;
    }

    const unlock = new Date(unlockDate);
    if (unlock <= new Date()) {
      res.status(400).json({ error: 'Unlock date must be in the future' });
      return;
    }

    // Max 5 years in the future
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5);
    if (unlock > maxDate) {
      res.status(400).json({ error: 'Unlock date cannot be more than 5 years in the future' });
      return;
    }

    const capsule = await Capsule.create({
      userId: req.userId,
      title,
      message,
      unlockDate: unlock,
    });

    res.status(201).json({ capsule });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/capsules/:id — delete a capsule (even if locked)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const capsule = await Capsule.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!capsule) {
      res.status(404).json({ error: 'Capsule not found' });
      return;
    }
    res.json({ deleted: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
