import { Router, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// POST /rooms — create a new room
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;

  const code = nanoid(6).toUpperCase();
  const room = await prisma.room.create({
    data: {
      code,
      members: {
        create: { userId },
      },
    },
    include: {
      members: { include: { user: { select: { id: true, username: true } } } },
    },
  });

  res.status(201).json(room);
});

// POST /rooms/join — join an existing room by code
router.post('/join', async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { code } = req.body;

  if (!code) {
    res.status(400).json({ error: 'code is required' });
    return;
  }

  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    include: { members: true },
  });

  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  const alreadyMember = room.members.some((m) => m.userId === userId);
  if (alreadyMember) {
    // Return the room if already a member (idempotent join)
    const fullRoom = await prisma.room.findUnique({
      where: { id: room.id },
      include: {
        members: { include: { user: { select: { id: true, username: true } } } },
      },
    });
    res.json(fullRoom);
    return;
  }

  if (room.members.length >= 2) {
    res.status(409).json({ error: 'Room is full (max 2 members)' });
    return;
  }

  await prisma.roomMember.create({ data: { roomId: room.id, userId } });

  const updatedRoom = await prisma.room.findUnique({
    where: { id: room.id },
    include: {
      members: { include: { user: { select: { id: true, username: true } } } },
    },
  });

  res.json(updatedRoom);
});

// PATCH /rooms/:id/preferences — update genre/reference movie preferences
router.patch('/:id/preferences', async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { id } = req.params;
  const { genreIds, referenceMovieIds, referenceMovieTitles } = req.body;

  const membership = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: id, userId } },
  });
  if (!membership) {
    res.status(403).json({ error: 'You are not a member of this room' });
    return;
  }

  const updated = await prisma.room.update({
    where: { id },
    data: {
      genreIds: Array.isArray(genreIds) ? genreIds : [],
      referenceMovieIds: Array.isArray(referenceMovieIds) ? referenceMovieIds : [],
      referenceMovieTitles: Array.isArray(referenceMovieTitles) ? referenceMovieTitles : [],
    },
    select: {
      id: true,
      genreIds: true,
      referenceMovieIds: true,
      referenceMovieTitles: true,
    },
  });

  res.json(updated);
});

// GET /rooms/:id — get room details
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { id } = req.params;

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, username: true } } } },
      matches: { orderBy: { matchedAt: 'desc' } },
    },
  });

  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  const isMember = room.members.some((m) => m.userId === userId);
  if (!isMember) {
    res.status(403).json({ error: 'You are not a member of this room' });
    return;
  }

  res.json(room);
});

export default router;
