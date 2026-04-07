import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';

interface Match {
  id: string;
  movieId: string;
  title: string;
  posterUrl: string;
  matchedAt: string;
}

interface MatchHistoryProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MatchHistory({ roomId, isOpen, onClose }: MatchHistoryProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api
      .get(`/matches/${roomId}`)
      .then((res) => setMatches(res.data.matches ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, roomId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-md bg-gray-900 rounded-t-3xl border border-white/10 p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">
                Matches{' '}
                {matches.length > 0 && (
                  <span className="text-sm font-normal text-gray-400">({matches.length})</span>
                )}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-brand-pink/30 border-t-brand-pink rounded-full animate-spin" />
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p className="font-medium">No matches yet</p>
                <p className="text-sm mt-1">Keep swiping to find movies you both like!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {matches.map((match) => (
                  <div key={match.id} className="rounded-xl overflow-hidden relative glass">
                    {match.posterUrl ? (
                      <img
                        src={match.posterUrl}
                        alt={match.title}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-800" />
                    )}
                    <div className="p-2">
                      <p className="text-xs font-semibold leading-tight line-clamp-2">{match.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(match.matchedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
