import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { fetchGenres } from '../lib/tmdb';

const router = Router();
router.use(authMiddleware);

// GET /genres
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const genres = await fetchGenres();
    res.json({ genres });
  } catch (err: any) {
    console.error('Failed to fetch genres:', err);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
});

export default router;
