import { useState, useCallback, useRef } from 'react';
import api from '../lib/api';

export interface Movie {
  id: string;
  title: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string | null;
  rating: number;
  releaseDate: string;
}

export function useMovies(roomId: string) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const fetchingRef = useRef(false);

  const fetchMovies = useCallback(async () => {
    if (fetchingRef.current || !roomId) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const res = await api.get('/movies', {
        params: { roomId, page: pageRef.current },
      });
      const newMovies: Movie[] = res.data.movies ?? [];
      setMovies((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const unique = newMovies.filter((m) => !existingIds.has(m.id));
        return [...prev, ...unique];
      });
      pageRef.current += 1;
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to load movies');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [roomId]);

  const removeTop = useCallback((count: number = 1) => {
    setMovies((prev) => prev.slice(count));
  }, []);

  const reset = useCallback(() => {
    setMovies([]);
    pageRef.current = 1;
  }, []);

  return { movies, loading, error, fetchMovies, removeTop, reset };
}
