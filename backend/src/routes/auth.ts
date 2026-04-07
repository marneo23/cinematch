import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const router = Router();

router.post('/session', async (req: Request, res: Response): Promise<void> => {
  const { username } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length < 2) {
    res.status(400).json({ error: 'Username must be at least 2 characters' });
    return;
  }

  const user = await prisma.user.create({
    data: { username: username.trim() },
    select: { id: true, username: true, createdAt: true },
  });

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET!,
    { expiresIn: '2h' }
  );

  res.status(201).json({ token, user });
});

export default router;
