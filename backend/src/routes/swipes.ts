import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Server } from 'socket.io';

const router = Router();
router.use(authMiddleware);

// POST /swipes
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { roomId, movieId, direction, title, posterUrl } = req.body;

  if (!roomId || !movieId || !direction) {
    res.status(400).json({ error: 'roomId, movieId, and direction are required' });
    return;
  }

  if (direction !== 'like' && direction !== 'dislike') {
    res.status(400).json({ error: 'direction must be "like" or "dislike"' });
    return;
  }

  // Verify membership
  const membership = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!membership) {
    res.status(403).json({ error: 'You are not a member of this room' });
    return;
  }

  // Upsert swipe (prevent duplicates)
  const swipe = await prisma.swipe.upsert({
    where: { userId_roomId_movieId: { userId, roomId, movieId } },
    update: { direction },
    create: { userId, roomId, movieId, direction },
  });

  // Match detection
  let matched = false;
  let matchData = null;

  if (direction === 'like') {
    // Find the other member of the room
    const members = await prisma.roomMember.findMany({
      where: { roomId },
      select: { userId: true },
    });

    const otherMember = members.find((m) => m.userId !== userId);

    if (otherMember) {
      // Check if the other member also liked this movie
      const otherSwipe = await prisma.swipe.findUnique({
        where: {
          userId_roomId_movieId: {
            userId: otherMember.userId,
            roomId,
            movieId,
          },
        },
      });

      if (otherSwipe && otherSwipe.direction === 'like') {
        // Check if match already exists (prevent duplicates)
        const existingMatch = await prisma.match.findFirst({
          where: { roomId, movieId },
        });

        if (!existingMatch) {
          matchData = await prisma.match.create({
            data: {
              roomId,
              movieId,
              title: title ?? '',
              posterUrl: posterUrl ?? '',
            },
          });
          matched = true;

          // Emit Socket.io event to room
          const io: Server = (req as any).io;
          io.to(roomId).emit('match', {
            movieId,
            title: title ?? '',
            posterUrl: posterUrl ?? '',
            matchId: matchData.id,
            matchedAt: matchData.matchedAt,
          });
        }
      }
    }
  }

  res.json({ swipe, matched, match: matchData });
});

export default router;
