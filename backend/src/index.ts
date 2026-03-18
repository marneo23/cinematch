import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initSocketHandlers } from './socket/handlers';
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import swipeRoutes from './routes/swipes';
import movieRoutes from './routes/movies';
import matchRoutes from './routes/matches';
import genreRoutes from './routes/genres';

const app = express();
const httpServer = createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());

// Attach io instance to every request so routes can emit events
app.use((req, _res, next) => {
  (req as any).io = io;
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/rooms', roomRoutes);
app.use('/swipes', swipeRoutes);
app.use('/movies', movieRoutes);
app.use('/matches', matchRoutes);
app.use('/genres', genreRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io
initSocketHandlers(io);

const PORT = parseInt(process.env.PORT ?? '3001', 10);
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
