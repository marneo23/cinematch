import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /matches/:roomId
router.get('/:roomId', async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { roomId } = req.params;

  // Verify membership
  const membership = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!membership) {
    res.status(403).json({ error: 'You are not a member of this room' });
    return;
  }

  const matches = await prisma.match.findMany({
    where: { roomId },
    orderBy: { matchedAt: 'desc' },
  });

  res.json({ matches });
});

export default router;
