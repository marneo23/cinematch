import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { fetchPopularMovies, discoverMovies, fetchRecommendations, searchMovies, fetchMovieCredits, fetchMovieVideos, getPosterUrl, TMDBMovie } from '../lib/tmdb';

const router = Router();
router.use(authMiddleware);

function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// GET /movies/search?q=shrek
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: 'q query parameter is required' });
    return;
  }

  try {
    const results = await searchMovies(q);
    const movies = results.slice(0, 8).map((m) => ({
      id: String(m.id),
      title: m.title,
      year: m.release_date ? m.release_date.slice(0, 4) : null,
    }));
    res.json({ movies });
  } catch (err: any) {
    console.error('TMDB search error:', err);
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

// GET /movies/:id/details — cast + trailer for a specific movie
router.get('/:id/details', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [credits, videos] = await Promise.all([
      fetchMovieCredits(id),
      fetchMovieVideos(id),
    ]);

    const cast = credits.slice(0, 6).map((m) => ({
      id: m.id,
      name: m.name,
      character: m.character,
      profileUrl: m.profile_path
        ? `https://image.tmdb.org/t/p/w185${m.profile_path}`
        : null,
    }));

    const trailer = videos.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer'
    ) ?? videos.find((v) => v.site === 'YouTube');

    const trailerUrl = trailer
      ? `https://www.youtube.com/watch?v=${trailer.key}`
      : null;

    res.json({ cast, trailerUrl });
  } catch (err) {
    console.error('Failed to fetch movie details:', err);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

// GET /movies?roomId=X&page=1
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { userId } = (req as AuthRequest).user;
  const { roomId, page } = req.query;

  if (!roomId || typeof roomId !== 'string') {
    res.status(400).json({ error: 'roomId query parameter is required' });
    return;
  }

  // Verify membership and load all members' preferences
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { members: true },
  });

  const isMember = room?.members.some((m) => m.userId === userId);
  if (!room || !isMember) {
    res.status(403).json({ error: 'You are not a member of this room' });
    return;
  }

  const pageNum = parseInt(typeof page === 'string' ? page : '1', 10) || 1;

  // Aggregate preferences from all members (union)
  const allReferenceMovieIds = [...new Set(room.members.flatMap((m) => m.referenceMovieIds))];
  const allGenreIds = [...new Set(room.members.flatMap((m) => m.genreIds))];

  // Get all movieIds already swiped by this user in this room
  const swipedMovies = await prisma.swipe.findMany({
    where: { userId, roomId },
    select: { movieId: true },
  });
  const swipedIds = new Set(swipedMovies.map((s) => s.movieId));

  // Choose fetch strategy based on combined preferences
  const fetchPage = async (tmdbPage: number): Promise<TMDBMovie[]> => {
    if (allReferenceMovieIds.length > 0) {
      // Fetch recommendations for all reference movies in parallel, then merge + deduplicate
      const allResults = await Promise.all(
        allReferenceMovieIds.map((id) => fetchRecommendations(id, tmdbPage).catch(() => [] as TMDBMovie[]))
      );
      const seen = new Set<number>();
      const merged: TMDBMovie[] = [];
      // Interleave results so all references contribute evenly
      const maxLen = Math.max(...allResults.map((r) => r.length));
      for (let i = 0; i < maxLen; i++) {
        for (const list of allResults) {
          if (i < list.length && !seen.has(list[i].id)) {
            seen.add(list[i].id);
            merged.push(list[i]);
          }
        }
      }
      return merged;
    } else if (allGenreIds.length > 0) {
      return discoverMovies(allGenreIds, tmdbPage);
    } else {
      return fetchPopularMovies(tmdbPage);
    }
  };

  // Fetch movies from TMDB, trying multiple pages to get enough unswiped ones
  const results: any[] = [];
  let tmdbPage = pageNum;
  const maxPagesTry = 5;
  const target = 10;

  while (results.length < target && tmdbPage < pageNum + maxPagesTry) {
    try {
      const movies = shuffleArray(await fetchPage(tmdbPage));
      for (const movie of movies) {
        if (!swipedIds.has(String(movie.id))) {
          results.push({
            id: String(movie.id),
            title: movie.title,
            overview: movie.overview,
            posterUrl: getPosterUrl(movie.poster_path),
            backdropUrl: movie.backdrop_path
              ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
              : null,
            rating: movie.vote_average,
            releaseDate: movie.release_date,
          });
          if (results.length >= target) break;
        }
      }
    } catch (err) {
      console.error('TMDB fetch error on page', tmdbPage, err);
      break;
    }
    tmdbPage++;
  }

  res.json({ movies: results, page: pageNum });
});

export default router;
