# 🎬 CineMatch — Tinder for Movies

A couples movie-decision app. Two users connect, swipe movies independently, and get a real-time "It's a Match!" notification when both like the same film.

## Quick Start

### 1. Prerequisites
- Node.js 18+
- Docker (for PostgreSQL) or a local PostgreSQL instance
- A [TMDB API key](https://www.themoviedb.org/settings/api) (free)

### 2. Start the database

```bash
docker-compose up -d
```

### 3. Configure the backend

```bash
cd backend
cp .env.example .env
# Edit .env and fill in:
#   DATABASE_URL (default works with docker-compose)
#   JWT_SECRET (any random string)
#   TMDB_API_KEY (from TMDB)
```

### 4. Install & migrate the backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```

Backend runs on **http://localhost:3001**

### 5. Configure & start the frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:3001 (already set)
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## How to Test

1. Open two browser tabs (or two different browsers)
2. Register two accounts
3. User A: creates a room → copies the 6-char code
4. User B: joins the room with the code
5. Both land on the swipe screen
6. Swipe right (like) on the same movie from both accounts
7. **"It's a Match!" modal fires on both screens** 🎉
8. Tap the ❤️ icon in the header to see match history

---

## Project Structure

```
cinematch/
├── backend/          # Node.js + Express + Socket.io + Prisma
│   ├── prisma/       # Database schema
│   └── src/
│       ├── routes/   # auth, rooms, movies, swipes, matches
│       ├── socket/   # Socket.io handlers
│       ├── middleware/
│       └── lib/      # Prisma client, TMDB helper
└── frontend/         # React + Vite + Tailwind + Framer Motion
    └── src/
        ├── pages/    # Login, Register, Lobby, Room
        ├── components/ # MovieCard, SwipeStack, MatchModal, MatchHistory
        ├── hooks/    # useSocket, useMovies
        └── lib/      # axios instance, auth helpers
```

## Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, Socket.io
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT + bcryptjs
- **Movies**: TMDB API
