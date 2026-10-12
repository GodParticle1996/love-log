import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cron from 'node-cron';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import memoryRoutes from './routes/memories.js';
import moodRoutes from './routes/moods.js';
import yearInReviewRoutes from './routes/yearInReview.js';
import capsuleRoutes from './routes/capsules.js';
import { sendOnThisDayNotification, checkAndNotifyCapsuleUnlocks } from './services/notifications.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/year-in-review', yearInReviewRoutes);
app.use('/api/capsules', capsuleRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// JSON error handler — without this, multer errors (bad file type, too large)
// fall through to Express's HTML error page and the UI can't show the message.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err?.status || 400).json({ error: err?.message || 'Request failed' });
});

// On This Day — runs daily at 9 AM (Asia/Kolkata timezone)
cron.schedule('0 9 * * *', async () => {
  console.log('[cron] Running daily checks...');
  try {
    await sendOnThisDayNotification();
  } catch (err) {
    console.error('[cron] On This Day failed:', err);
  }
  try {
    await checkAndNotifyCapsuleUnlocks();
  } catch (err) {
    console.error('[cron] Capsule unlock check failed:', err);
  }
});

// Connect to MongoDB and start
async function start() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    app.listen(config.port, () => {
      console.log(`LoveLog server running on http://localhost:${config.port}`);
      console.log('  POST /api/auth/register');
      console.log('  POST /api/auth/login');
      console.log('  GET  /api/auth/me');
      console.log('  GET  /api/memories');
      console.log('  POST /api/memories');
      console.log('  GET  /api/memories/on-this-day');
      console.log('  GET  /api/memories/map');
      console.log('  GET  /api/moods');
      console.log('  GET  /api/year-in-review/:year');
      console.log('  GET  /api/capsules');
      console.log('  POST /api/capsules');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
