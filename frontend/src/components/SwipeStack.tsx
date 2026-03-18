import { useEffect, useRef, useState, useCallback } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  PanInfo,
} from 'framer-motion';
import MovieCard from './MovieCard';
import MovieDetailSheet from './MovieDetailSheet';
import { Movie } from '../hooks/useMovies';

interface SwipeStackProps {
  movies: Movie[];
  onSwipe: (movie: Movie, direction: 'like' | 'dislike') => void;
  onNeedMore: () => void;
  loading: boolean;
}

const SWIPE_THRESHOLD = 100;
const VISIBLE_CARDS = 3;

export default function SwipeStack({ movies, onSwipe, onNeedMore, loading }: SwipeStackProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-25, 0, 25]);
  const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0, 1, 1, 1, 0]);

  // Like/dislike indicator opacity
  const likeOpacity = useTransform(x, [0, 80], [0, 1]);
  const dislikeOpacity = useTransform(x, [-80, 0], [1, 0]);

  const controls = useAnimation();
  const [swiping, setSwiping] = useState(false);
  const [expandedMovie, setExpandedMovie] = useState<Movie | null>(null);

  // Pre-fetch when stack is low
  const prevLengthRef = useRef(movies.length);
  useEffect(() => {
    if (movies.length <= 2 && prevLengthRef.current > 2) {
      onNeedMore();
    }
    prevLengthRef.current = movies.length;
  }, [movies.length, onNeedMore]);

  // Initial fetch
  useEffect(() => {
    if (movies.length === 0 && !loading) {
      onNeedMore();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSwipe = useCallback(
    async (direction: 'like' | 'dislike') => {
      if (swiping || movies.length === 0) return;
      setSwiping(true);

      const targetX = direction === 'like' ? 600 : -600;
      await controls.start({
        x: targetX,
        opacity: 0,
        transition: { duration: 0.35, ease: 'easeOut' },
      });

      onSwipe(movies[0], direction);
      x.set(0);
      controls.set({ x: 0, opacity: 1 });
      setSwiping(false);
    },
    [swiping, movies, controls, onSwipe, x]
  );

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
        handleSwipe(info.offset.x > 0 ? 'like' : 'dislike');
      } else {
        controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
      }
    },
    [handleSwipe, controls]
  );

  if (movies.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        {loading ? (
          <div className="text-center text-gray-400">
            <div className="w-12 h-12 border-2 border-brand-pink/30 border-t-brand-pink rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading movies...</p>
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <p className="text-4xl mb-3">🎬</p>
            <p className="font-medium">No more movies!</p>
            <p className="text-sm mt-1">Check back later for more.</p>
          </div>
        )}
      </div>
    );
  }

  const visible = movies.slice(0, VISIBLE_CARDS);

  return (
    <div className="relative w-full h-full">
      {/* Background cards (non-interactive) */}
      {visible
        .slice(1)
        .reverse()
        .map((movie, reverseIdx) => {
          const stackIdx = visible.length - 1 - reverseIdx; // 1-based from top
          const scale = 1 - stackIdx * 0.04;
          const translateY = stackIdx * 10;
          return (
            <div
              key={movie.id}
              className="absolute inset-0"
              style={{
                transform: `scale(${scale}) translateY(${translateY}px)`,
                zIndex: VISIBLE_CARDS - stackIdx,
              }}
            >
              <MovieCard movie={movie} />
            </div>
          );
        })}

      {/* Top card (draggable) */}
      <motion.div
        key={movies[0].id}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ x, rotate, opacity, zIndex: VISIBLE_CARDS + 1 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
        animate={controls}
      >
        {/* Like indicator */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-6 left-6 z-10 rotate-[-15deg] border-4 border-green-400 text-green-400 rounded-xl px-3 py-1 text-2xl font-black"
        >
          LIKE
        </motion.div>

        {/* Dislike indicator */}
        <motion.div
          style={{ opacity: dislikeOpacity }}
          className="absolute top-6 right-6 z-10 rotate-[15deg] border-4 border-red-500 text-red-500 rounded-xl px-3 py-1 text-2xl font-black"
        >
          NOPE
        </motion.div>

        <MovieCard movie={movies[0]} onExpand={() => setExpandedMovie(movies[0])} />
      </motion.div>

      {/* Movie detail sheet */}
      <MovieDetailSheet
        movie={expandedMovie}
        onClose={() => setExpandedMovie(null)}
      />

      {/* Buttons */}
      <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-6">
        <button
          onClick={() => handleSwipe('dislike')}
          disabled={swiping || movies.length === 0}
          className="w-14 h-14 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          title="Dislike"
        >
          ✕
        </button>
        <button
          onClick={() => handleSwipe('like')}
          disabled={swiping || movies.length === 0}
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #FF6B9D, #FF4458)' }}
          title="Like"
        >
          ♥
        </button>
      </div>
    </div>
  );
}
