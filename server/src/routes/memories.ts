import { Router, Response } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { Memory } from '../models/Memory.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { uploadPhoto, deletePhoto } from '../services/storage.js';
import { sendNewMemoryNotification } from '../services/notifications.js';

const router = Router();
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIMES.join(', ')}`));
    }
  },
});

// GET /api/memories — list memories with filters
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      mood,
      tag,
      year,
      month,
      q,
      favorite,
      sort = 'date',
      order = 'desc',
    } = req.query;

    const filter: any = { userId: req.userId };

    if (mood && typeof mood === 'string') {
      filter.mood = mood;
    }
    if (favorite === 'true') {
      filter.isFavorite = true;
    }
    if (q && typeof q === 'string' && q.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: rx }, { description: rx }, { location: rx }, { tags: rx }];
    }
    if (tag && typeof tag === 'string') {
      filter.tags = tag;
    }
    if (year) {
      const y = parseInt(year as string);
      filter.date = {
        $gte: new Date(y, 0, 1),
        $lte: new Date(y, 11, 31, 23, 59, 59, 999),
      };
    }
    if (month && year) {
      const y = parseInt(year as string);
      const m = parseInt(month as string) - 1;
      filter.date = {
        $gte: new Date(y, m, 1),
        $lte: new Date(y, m + 1, 0, 23, 59, 59, 999),
      };
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const sortObj: any = {};
    sortObj[sort as string] = order === 'asc' ? 1 : -1;

    const [memories, total] = await Promise.all([
      Memory.find(filter).sort(sortObj).skip(skip).limit(limitNum),
      Memory.countDocuments(filter),
    ]);

    res.json({
      memories,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/memories/on-this-day — get memories from this day in past years
router.get('/on-this-day', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    const month = today.getMonth();
    const day = today.getDate();

    const memories = await Memory.find({
      userId: req.userId,
      $expr: {
        $and: [
          { $eq: [{ $month: '$date' }, month + 1] },
          { $eq: [{ $dayOfMonth: '$date' }, day] },
          { $ne: [{ $year: '$date' }, today.getFullYear()] },
        ],
      },
    }).sort({ date: -1 });

    const grouped: Record<number, typeof memories> = {};
    for (const m of memories) {
      const yearsAgo = today.getFullYear() - m.date.getFullYear();
      if (!grouped[yearsAgo]) grouped[yearsAgo] = [];
      grouped[yearsAgo].push(m);
    }

    res.json({ memories: grouped });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/memories/memory-of-the-day — random past memory (not from today)
router.get('/memory-of-the-day', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    const month = today.getMonth();
    const day = today.getDate();

    const memories = await Memory.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.userId),
          $expr: {
            $not: {
              $and: [
                { $eq: [{ $month: '$date' }, month + 1] },
                { $eq: [{ $dayOfMonth: '$date' }, day] },
              ],
            },
          },
        },
      },
      { $sample: { size: 1 } },
    ]);

    if (memories.length === 0) {
      res.json({ memory: null });
      return;
    }

    res.json({ memory: memories[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/memories/map — all memories with location for the map view
router.get('/map', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const memories = await Memory.find({
      userId: req.userId,
      locationCoords: { $ne: null },
    }).select('title date location locationCoords mood photos');

    res.json({ memories });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/memories/:id
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const memory = await Memory.findOne({ _id: req.params.id, userId: req.userId });
    if (!memory) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }
    res.json({ memory });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/memories — create a memory with photo uploads
router.post('/', authMiddleware, upload.array('photos', 10), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, date, location, locationCoords, mood, tags, isPrivate } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    const photos: { url: string; key: string; caption?: string }[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const result = await uploadPhoto(file.buffer, file.mimetype, `memories/${req.userId}`);
        photos.push(result);
      }
    }

    // Handle individual photo captions from body
    if (req.body.photoCaptions) {
      try {
        const captions = JSON.parse(req.body.photoCaptions);
        if (Array.isArray(captions)) {
          captions.forEach((cap: string, i: number) => {
            if (photos[i]) photos[i].caption = cap;
          });
        }
      } catch { /* ignore invalid captions */ }
    }

    const parsedTags = tags ? (typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()) : tags) : [];

    const memory = await Memory.create({
      userId: req.userId,
      title,
      description: description || '',
      date: date ? new Date(date) : new Date(),
      location: location || undefined,
      locationCoords: locationCoords
        ? typeof locationCoords === 'string'
          ? JSON.parse(locationCoords)
          : locationCoords
        : undefined,
      mood: mood || undefined,
      photos,
      tags: parsedTags,
      isPrivate: isPrivate === 'true' || isPrivate === true,
    });

    // Send Telegram notification
    try {
      await sendNewMemoryNotification(memory);
    } catch { /* notification failure shouldn't block */ }

    res.status(201).json({ memory });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/memories/:id/favorite — toggle favorite
router.patch('/:id/favorite', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const memory = await Memory.findOne({ _id: req.params.id, userId: req.userId });
    if (!memory) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }
    memory.isFavorite = !memory.isFavorite;
    await memory.save();
    res.json({ memory });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/memories/:id
router.put('/:id', authMiddleware, upload.array('newPhotos', 10), async (req: AuthRequest, res: Response) => {
  try {
    const memory = await Memory.findOne({ _id: req.params.id, userId: req.userId });
    if (!memory) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    const { title, description, date, location, locationCoords, mood, tags, isPrivate, removePhotos, existingPhotoCaptions } = req.body;

    if (title !== undefined) memory.title = title;
    if (description !== undefined) memory.description = description;
    if (date !== undefined) memory.date = new Date(date);
    if (location !== undefined) memory.location = location;
    if (locationCoords !== undefined) {
      try {
        memory.locationCoords = typeof locationCoords === 'string' ? JSON.parse(locationCoords) : locationCoords;
      } catch {
        // ignore invalid locationCoords
      }
    }
    if (mood !== undefined) memory.mood = mood || null as any;
    if (tags !== undefined) {
      memory.tags = typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()) : tags;
    }
    if (isPrivate !== undefined) memory.isPrivate = isPrivate === 'true' || isPrivate === true;

    // Remove photos if requested
    if (removePhotos) {
      const keysToRemove: string[] = typeof removePhotos === 'string' ? JSON.parse(removePhotos) : removePhotos;
      for (const key of keysToRemove) {
        try { await deletePhoto(key); } catch { /* ignore */ }
      }
      memory.photos = memory.photos.filter((p) => !keysToRemove.includes(p.key));
    }

    // Update captions on existing photos
    if (existingPhotoCaptions) {
      try {
        const captions: string[] = typeof existingPhotoCaptions === 'string'
          ? JSON.parse(existingPhotoCaptions)
          : existingPhotoCaptions;
        if (Array.isArray(captions)) {
          memory.photos.forEach((photo, i) => {
            if (captions[i] !== undefined) {
              photo.caption = captions[i] || undefined;
            }
          });
        }
      } catch { /* ignore invalid captions */ }
    }

    // Add new photos
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      for (const file of files) {
        const result = await uploadPhoto(file.buffer, file.mimetype, `memories/${req.userId}`);
        memory.photos.push(result);
      }
    }

    await memory.save();
    res.json({ memory });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/memories/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const memory = await Memory.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!memory) {
      res.status(404).json({ error: 'Memory not found' });
      return;
    }

    // Clean up photos from R2
    for (const photo of memory.photos) {
      try { await deletePhoto(photo.key); } catch { /* ignore */ }
    }

    res.json({ deleted: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
