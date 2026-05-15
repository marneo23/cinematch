# CineMatch — Tinder for Movies

A couples movie-decision app. Two users connect, swipe movies independently, and get a real-time "It's a Match!" notification when both like the same film.

## Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL — either local (via Docker) or a free [Neon](https://neon.tech) project
- A [TMDB API key](https://www.themoviedb.org/settings/api) (free)

### 2. Start the database

For a local Postgres on port `5433`:

```bash
docker-compose up -d
```

Or skip this step and point `DATABASE_URL` at a Neon project (see `backend/.env.example` for the connection-string format — use the `-pooler` endpoint to avoid cold-start timeouts).

### 3. Configure & run the backend

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, and TMDB_API_KEY
npm install
npx prisma migrate deploy
npm run dev
```

Backend runs on **http://localhost:3001**.

### 4. Configure & run the frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**.

---

## How to Test

1. Open two browser tabs (or two different browsers).
2. On each, enter a username — no signup, no password. A short-lived JWT session is issued on the spot.
3. User A: creates a room and shares the 6-char code.
4. User B: joins the room with that code.
5. Both pick their genres and reference movies, then land on the swipe screen.
6. Swipe right on the same movie from both accounts.
7. The "It's a Match!" modal fires on both screens in real time.
8. Tap the heart icon in the header to see match history.

---

## Project Structure

```
cinematch/
├── backend/          # Node.js + Express + Socket.io + Prisma
│   ├── prisma/       # Database schema & migrations
│   └── src/
│       ├── routes/   # auth, rooms, movies, swipes, matches, genres
│       ├── socket/   # Socket.io handlers
│       ├── middleware/
│       └── lib/      # Prisma client, TMDB helper
└── frontend/         # React + Vite + Tailwind + Framer Motion
    └── src/
        ├── pages/    # Login, Lobby, Room
        ├── components/ # MovieCard, SwipeStack, MatchModal, MatchHistory
        ├── hooks/    # useSocket, useMovies
        └── lib/      # axios instance, auth helpers
```

## Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, Socket.io
- **Database**: PostgreSQL (local Docker or Neon) + Prisma ORM
- **Auth**: JWT, passwordless (username-only ephemeral sessions)
- **Movies**: TMDB API
