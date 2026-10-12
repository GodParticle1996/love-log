# 💝 LoveLog

A private shared journal & memory timeline for couples. Self-hosted on your home network, just for the two of you.

## Features

- 📖 **Memory Timeline** — Beautiful masonry grid of your shared memories with photos, locations, and tags
- 💝 **On This Day** — Daily Telegram notification reminding you of memories from this day in past years
- 🎭 **Mood Tracker** — Tag each memory with a mood emoji, see your relationship's emotional journey over time
- 📊 **Year in Review** — Auto-generated annual recap with stats, charts, highlights, and top locations
- 📸 **Photo Uploads** — Store photos on Cloudflare R2 (10 GB free tier) via drag-and-drop
- 🔐 **Private** — JWT auth, runs entirely on your home network

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB Atlas (M0 free tier) |
| File Storage | Cloudflare R2 (10 GB free) |
| Notifications | Telegram Bot API |
| Deployment | Docker + nginx |

## Quick Start

### 1. Clone and set up environment

```bash
cd lovelog/server
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, R2 credentials, and Telegram bot token
```

### 2. Install dependencies

```bash
# Server
cd server
npm install

# UI
cd ../ui
npm install
```

### 3. Run locally

```bash
# Terminal 1 — Server
cd server
npm run dev

# Terminal 2 — UI
cd ui
npm run dev
```

Open http://localhost:5173

### 4. Deploy with Docker

```bash
docker compose up -d
```

Open http://lovelog.local:3000 (or your server's IP)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `R2_ACCOUNT_ID` | For photos | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | For photos | R2 access key |
| `R2_SECRET_ACCESS_KEY` | For photos | R2 secret key |
| `R2_BUCKET_NAME` | For photos | R2 bucket name (default: lovelog-photos) |
| `R2_ENDPOINT` | For photos | R2 endpoint URL |
| `R2_PUBLIC_URL` | For photos | Public URL for R2 bucket |
| `TELEGRAM_BOT_TOKEN` | For notifications | Telegram bot token from @BotFather |
| `TELEGRAM_CHAT_ID` | For notifications | Telegram chat ID to send notifications |

## API Routes

```
POST   /api/auth/register     Create account (email, password, name, partnerName)
POST   /api/auth/login        Sign in
GET    /api/auth/me           Current user

GET    /api/memories          List memories (?page, ?mood, ?year, ?tag)
GET    /api/memories/on-this-day   Memories from today in past years
GET    /api/memories/map      All memories with locations
GET    /api/memories/:id      Single memory
POST   /api/memories          Create memory (multipart: photos + metadata)
PUT    /api/memories/:id      Update memory
DELETE /api/memories/:id      Delete memory

GET    /api/moods             Mood stats (?year)
GET    /api/year-in-review/:year  Annual recap
```

## Project Structure

```
lovelog/
├── server/                # Express API
│   └── src/
│       ├── index.ts       # Entry point + cron
│       ├── config.ts      # Env config
│       ├── models/        # Mongoose models
│       │   ├── User.ts
│       │   └── Memory.ts
│       ├── routes/        # API routes
│       │   ├── auth.ts
│       │   ├── memories.ts
│       │   ├── moods.ts
│       │   └── yearInReview.ts
│       ├── middleware/
│       │   └── auth.ts    # JWT middleware
│       └── services/
│           ├── storage.ts     # R2 photo upload
│           └── notifications.ts # Telegram bot
├── ui/                    # React frontend
│   └── src/
│       ├── App.tsx        # Routes
│       ├── hooks/useApi.ts
│       ├── pages/         # Timeline, Create, Detail, Moods, Review, Login
│       └── components/    # Navbar, MemoryCard, MoodPicker, PhotoUpload
├── docker-compose.yml
├── Dockerfile.ui
├── Dockerfile.server
└── nginx.conf
```
