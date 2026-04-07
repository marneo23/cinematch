import { motion, AnimatePresence } from 'framer-motion';
import { MatchEvent } from '../hooks/useSocket';

interface MatchModalProps {
  match: MatchEvent | null;
  onDismiss: () => void;
}

export default function MatchModal({ match, onDismiss }: MatchModalProps) {
  return (
    <AnimatePresence>
      {match && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={onDismiss}
        >
          {/* Particle burst effect (pure CSS) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  background: i % 3 === 0 ? '#FF6B9D' : i % 3 === 1 ? '#FF4458' : '#FFD700',
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * 600,
                  y: (Math.random() - 0.5) * 600,
                  opacity: 0,
                  scale: [0, 1.5, 0],
                }}
                transition={{ duration: 1.5, delay: i * 0.04, ease: 'easeOut' }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.3, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative w-full max-w-sm text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow ring */}
            <div
              className="absolute inset-0 rounded-3xl blur-2xl opacity-30"
              style={{ background: 'linear-gradient(135deg, #FF6B9D, #FF4458)' }}
            />

            <div className="relative glass rounded-3xl p-8 overflow-hidden">
              <motion.h2
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-black gradient-text mb-1"
              >
                It's a Match!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-400 text-sm mb-6"
              >
                You both want to watch
              </motion.p>

              {/* Movie poster */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.35, type: 'spring', stiffness: 200 }}
                className="mb-4"
              >
                {match.posterUrl ? (
                  <img
                    src={match.posterUrl}
                    alt={match.title}
                    className="w-36 h-52 object-cover rounded-xl mx-auto card-shadow"
                  />
                ) : (
                  <div className="w-36 h-52 bg-gray-800 rounded-xl mx-auto" />
                )}
              </motion.div>

              <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xl font-bold mb-6"
              >
                {match.title}
              </motion.h3>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={onDismiss}
                className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #FF6B9D, #FF4458)' }}
              >
                Keep Swiping
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
