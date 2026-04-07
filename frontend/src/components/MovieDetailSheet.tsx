import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { Movie } from '../hooks/useMovies';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profileUrl: string | null;
}

interface MovieDetailSheetProps {
  movie: Movie | null;
  onClose: () => void;
}

export default function MovieDetailSheet({ movie, onClose }: MovieDetailSheetProps) {
  const [cast, setCast] = useState<CastMember[]>([]);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!movie) return;
    setCast([]);
    setTrailerUrl(null);
    setLoading(true);
    api
      .get(`/movies/${movie.id}/details`)
      .then((res) => {
        setCast(res.data.cast ?? []);
        setTrailerUrl(res.data.trailerUrl ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [movie?.id]);

  const year = movie?.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;
  const rating = movie?.rating ? movie.rating.toFixed(1) : null;

  return (
    <AnimatePresence>
      {movie && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-md bg-gray-900 rounded-t-3xl border border-white/10 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="px-6 pb-8 pt-3">
              {/* Title + meta */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold leading-tight">{movie.title}</h2>
                  <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                    {year && <span>{year}</span>}
                    {rating && (
                      <span className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span> {rating}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Description */}
              {movie.overview && (
                <p className="text-sm text-gray-300 leading-relaxed mb-5">
                  {movie.overview}
                </p>
              )}

              {/* Trailer button */}
              {trailerUrl && (
                <a
                  href={trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 transition-colors text-white text-sm font-semibold mb-5"
                >
                  <span>▶</span> Watch trailer
                </a>
              )}

              {/* Cast */}
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-brand-pink/30 border-t-brand-pink rounded-full animate-spin" />
                </div>
              ) : cast.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Cast
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                    {cast.map((member) => (
                      <div key={member.id} className="flex flex-col items-center shrink-0 w-16">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-800 mb-1.5">
                          {member.profileUrl ? (
                            <img
                              src={member.profileUrl}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                                <circle cx="12" cy="8" r="4"/>
                                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-center leading-tight line-clamp-2">
                          {member.name}
                        </p>
                        <p className="text-[10px] text-gray-500 text-center leading-tight line-clamp-1 mt-0.5">
                          {member.character}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
