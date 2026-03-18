import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const router = Router();

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    res.status(400).json({ error: 'email, username, and password are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, username, passwordHash },
    select: { id: true, email: true, username: true, createdAt: true },
  });

  const secret = process.env.JWT_SECRET!;
  const token = jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: '7d' });

  res.status(201).json({ token, user });
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const secret = process.env.JWT_SECRET!;
  const token = jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: '7d' });

  const { passwordHash: _omit, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

export default router;
