import { Movie } from '../hooks/useMovies';

interface MovieCardProps {
  movie: Movie;
  style?: React.CSSProperties;
  className?: string;
  onExpand?: () => void;
}

export default function MovieCard({ movie, style, className = '', onExpand }: MovieCardProps) {
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;
  const rating = movie.rating ? movie.rating.toFixed(1) : null;

  return (
    <div
      className={`absolute inset-0 rounded-2xl overflow-hidden card-shadow select-none ${className}`}
      style={style}
    >
      {/* Poster */}
      {movie.posterUrl ? (
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <span className="text-6xl">🎬</span>
        </div>
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
        }}
      />

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-end justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold leading-tight mb-1">{movie.title}</h2>
            <div className="flex items-center gap-3 text-sm text-gray-300 mb-2">
              {year && <span>{year}</span>}
              {rating && (
                <span className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span> {rating}
                </span>
              )}
            </div>
            {movie.overview && (
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{movie.overview}</p>
            )}
          </div>

          {/* Expand button */}
          {onExpand && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              className="shrink-0 w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/25 hover:text-white transition-colors mb-0.5"
              title="More info"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
