import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { getUser } from '../lib/auth';
import { useMovies, Movie } from '../hooks/useMovies';
import { useSocket, MatchEvent } from '../hooks/useSocket';
import SwipeStack from '../components/SwipeStack';
import MatchModal from '../components/MatchModal';
import MatchHistory from '../components/MatchHistory';
import PreferencesPanel from '../components/PreferencesPanel';

interface RoomMemberData {
  userId: string;
  user: { id: string; username: string };
  genreIds: number[];
  referenceMovieIds: string[];
  referenceMovieTitles: string[];
}

interface RoomData {
  id: string;
  code: string;
  members: RoomMemberData[];
  matches: Array<{ id: string }>;
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const currentUser = getUser();

  const [room, setRoom] = useState<RoomData | null>(null);
  const [roomError, setRoomError] = useState('');
  const [currentMatch, setCurrentMatch] = useState<MatchEvent | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const { movies, loading, fetchMovies, removeTop, reset } = useMovies(roomId ?? '');

  // Load room data
  useEffect(() => {
    if (!roomId) return;
    api
      .get(`/rooms/${roomId}`)
      .then((res) => {
        const data = res.data as RoomData;
        setRoom(data);
        setMatchCount(data.matches?.length ?? 0);
        const partner = data.members.find((m) => m.userId !== currentUser?.id);
        if (partner) setPartnerOnline(false);
      })
      .catch(() => setRoomError('Room not found or access denied'));
  }, [roomId, currentUser?.id]);

  const handleMatch = useCallback((data: MatchEvent) => {
    setCurrentMatch(data);
    setMatchCount((c) => c + 1);
  }, []);

  const handlePartnerConnected = useCallback(() => {
    setPartnerOnline(true);
    if (!roomId) return;
    api
      .get(`/rooms/${roomId}`)
      .then((res) => {
        const data = res.data as RoomData;
        setRoom(data);
        setMatchCount(data.matches?.length ?? 0);
      })
      .catch(console.error);
  }, [roomId]);

  const handlePartnerDisconnected = useCallback(() => {
    setPartnerOnline(false);
  }, []);

  const handlePreferencesUpdated = useCallback(({ updatedBy }: { updatedBy: string }) => {
    // When the partner updates their preferences, reset our movie queue
    if (updatedBy !== currentUser?.id) {
      reset();
    }
  }, [currentUser?.id, reset]);

  useSocket({
    roomId: roomId ?? '',
    onMatch: handleMatch,
    onPartnerConnected: handlePartnerConnected,
    onPartnerDisconnected: handlePartnerDisconnected,
    onPreferencesUpdated: handlePreferencesUpdated,
  });

  // Auto-show preferences panel when both members are present and current user has no preferences set
  useEffect(() => {
    if (!room) return;
    const bothPresent = room.members.length >= 2;
    const myMember = room.members.find((m) => m.userId === currentUser?.id);
    const noPreferences = (myMember?.genreIds.length ?? 0) === 0 && (myMember?.referenceMovieIds.length ?? 0) === 0;
    if (bothPresent && noPreferences) {
      setShowPreferences(true);
    }
  }, [room]);

  const handlePreferencesSaved = useCallback(() => {
    // Reload room data to get updated preferences
    if (!roomId) return;
    api
      .get(`/rooms/${roomId}`)
      .then((res) => setRoom(res.data as RoomData))
      .catch(console.error);
    // Reset movie queue and re-fetch
    reset();
  }, [roomId, reset]);

  const handleSwipe = useCallback(
    async (movie: Movie, direction: 'like' | 'dislike') => {
      removeTop(1);

      try {
        await api.post('/swipes', {
          roomId,
          movieId: movie.id,
          direction,
          title: movie.title,
          posterUrl: movie.posterUrl,
        });
      } catch (err) {
        console.error('Failed to record swipe:', err);
      }
    },
    [roomId, removeTop]
  );

  const handleNeedMore = useCallback(() => {
    fetchMovies();
  }, [fetchMovies]);

  function copyCode() {
    if (!room) return;
    navigator.clipboard.writeText(room.code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }

  if (roomError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{roomError}</p>
          <button
            onClick={() => navigate('/lobby')}
            className="text-brand-pink hover:underline"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  const partner = room?.members.find((m) => m.userId !== currentUser?.id);
  const waitingForPartner = room && room.members.length < 2;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <button
          onClick={() => navigate('/lobby')}
          className="text-gray-400 hover:text-white transition-colors text-sm"
        >
          ← Back
        </button>

        <div className="flex items-center gap-2">
          {/* Room code */}
          <button
            onClick={copyCode}
            className="glass rounded-lg px-3 py-1.5 text-xs font-mono font-bold tracking-widest hover:bg-white/10 transition-colors"
          >
            {codeCopied ? '✓ Copied!' : room?.code ?? '...'}
          </button>

          {/* Partner status */}
          {partner && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <div
                className={`w-2 h-2 rounded-full ${
                  partnerOnline ? 'bg-green-400' : 'bg-gray-600'
                }`}
              />
              {partner.user.username}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Settings / preferences button */}
          <button
            onClick={() => setShowPreferences(true)}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Preferences"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>

          {/* Matches button */}
          <button
            onClick={() => setShowHistory(true)}
            className="relative text-sm text-gray-400 hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-brand-pink">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            {matchCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-pink rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                {matchCount > 9 ? '9+' : matchCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {waitingForPartner ? (
          /* Waiting for partner */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-sm"
          >
            <h2 className="text-xl font-bold mb-2">Waiting for your partner</h2>
            <p className="text-gray-400 text-sm mb-6">
              Share this code with your partner to join:
            </p>
            <button
              onClick={copyCode}
              className="glass rounded-2xl px-8 py-4 text-4xl font-black tracking-widest font-mono hover:bg-white/10 transition-colors"
            >
              {room?.code}
            </button>
            <p className="text-gray-500 text-xs mt-3">
              {codeCopied ? '✓ Copied to clipboard!' : 'Tap to copy'}
            </p>
          </motion.div>
        ) : (
          /* Swipe stack */
          <div className="w-full max-w-sm" style={{ height: '520px', paddingBottom: '64px' }}>
            <SwipeStack
              movies={movies}
              onSwipe={handleSwipe}
              onNeedMore={handleNeedMore}
              loading={loading}
            />
          </div>
        )}
      </main>

      {/* Match modal */}
      <MatchModal
        match={currentMatch}
        onDismiss={() => setCurrentMatch(null)}
      />

      {/* Match history */}
      <MatchHistory
        roomId={roomId ?? ''}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />

      {/* Preferences panel — initialized with the current user's own selections */}
      {(() => {
        const myMember = room?.members.find((m) => m.userId === currentUser?.id);
        return (
          <PreferencesPanel
            roomId={roomId ?? ''}
            isOpen={showPreferences}
            initialGenreIds={myMember?.genreIds ?? []}
            initialReferenceMovieIds={myMember?.referenceMovieIds ?? []}
            initialReferenceMovieTitles={myMember?.referenceMovieTitles ?? []}
            onClose={() => setShowPreferences(false)}
            onSaved={handlePreferencesSaved}
          />
        );
      })()}
    </div>
  );
}
