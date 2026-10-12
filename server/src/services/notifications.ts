import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config.js';
import { Memory, IMemory } from '../models/Memory.js';
import { Capsule } from '../models/Capsule.js';

let bot: TelegramBot | null = null;

function getBot(): TelegramBot | null {
  if (!config.telegram.botToken || !config.telegram.chatId) return null;
  if (!bot) {
    bot = new TelegramBot(config.telegram.botToken, { polling: false });
  }
  return bot;
}

export async function sendOnThisDayNotification(): Promise<void> {
  const tg = getBot();
  if (!tg) return;

  const today = new Date();
  const yearsToCheck = [1, 2, 3, 5];

  for (const years of yearsToCheck) {
    const targetDate = new Date(today);
    targetDate.setFullYear(targetDate.getFullYear() - years);

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const memories = await Memory.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('userId', 'name partnerName')
      .limit(3);

    for (const memory of memories) {
      const user = memory.userId as any;
      const yearsAgo = years === 1 ? '1 year' : `${years} years`;
      const moodText = memory.mood ? ` ${memory.mood}` : '';
      const photoText = memory.photos.length > 0 ? ` 📸 ${memory.photos.length} photo(s)` : '';
      const locationText = memory.location ? ` 📍 ${memory.location}` : '';

      const message = [
        `💝 *On This Day — ${yearsAgo} ago*${moodText}`,
        '',
        `*${memory.title}*`,
        memory.description ? `_${memory.description.slice(0, 200)}${memory.description.length > 200 ? '...' : ''}_` : '',
        `${photoText}${locationText}`,
        '',
        `— ${user?.name || 'You'} & ${user?.partnerName || 'your partner'}`,
      ].join('\n');

      try {
        await tg.sendMessage(config.telegram.chatId, message, { parse_mode: 'Markdown' });
      } catch {
        // Fallback without markdown
        try {
          await tg.sendMessage(config.telegram.chatId, message.replace(/\*/g, '').replace(/_/g, ''));
        } catch {
          console.error('Failed to send Telegram notification');
        }
      }
    }
  }
}

export async function checkAndNotifyCapsuleUnlocks(): Promise<void> {
  const tg = getBot();
  if (!tg) return;

  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const capsules = await Capsule.find({
    unlockDate: { $gte: startOfDay, $lte: endOfDay },
    isLocked: true,
  }).populate('userId', 'name partnerName');

  for (const capsule of capsules) {
    const user = capsule.userId as any;
    const message = [
      `⏰ *Time Capsule Unlocked!* 🔓`,
      '',
      `*${capsule.title}*`,
      `_Created on ${capsule.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}_`,
      '',
      'Your time capsule is ready to open! Head to LoveLog to reveal it 💝',
      '',
      `— ${user?.name || 'You'} & ${user?.partnerName || 'your partner'}`,
    ].join('\n');

    try {
      await tg.sendMessage(config.telegram.chatId, message, { parse_mode: 'Markdown' });
      capsule.isLocked = false;
      await capsule.save();
    } catch {
      try {
        await tg.sendMessage(config.telegram.chatId, message.replace(/\*/g, '').replace(/_/g, ''));
        capsule.isLocked = false;
        await capsule.save();
      } catch {
        console.error('Failed to send capsule unlock notification');
      }
    }
  }
}

export async function sendNewMemoryNotification(memory: IMemory): Promise<void> {
  const tg = getBot();
  if (!tg) return;

  const user = await memory.populate('userId', 'name');
  const userName = (user.userId as any)?.name || 'Someone';
  const moodText = memory.mood ? ` ${memory.mood}` : '';

  const message = [
    `✨ *New Memory Added*${moodText}`,
    '',
    `*${memory.title}*`,
    memory.description ? `_${memory.description.slice(0, 150)}${memory.description.length > 150 ? '...' : ''}_` : '',
    `📍 ${memory.location || 'Somewhere special'}`,
    '',
    `Added by ${userName} 💕`,
  ].join('\n');

  try {
    await tg.sendMessage(config.telegram.chatId, message, { parse_mode: 'Markdown' });
  } catch {
    try {
      await tg.sendMessage(config.telegram.chatId, message.replace(/\*/g, '').replace(/_/g, ''));
    } catch {
      console.error('Failed to send Telegram notification');
    }
  }
}
