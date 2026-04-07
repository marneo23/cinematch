import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { getUser, clearAuth } from '../lib/auth';

export default function LobbyPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'create' | 'join'>('create');

  async function handleCreate() {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/rooms');
      navigate(`/room/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create room');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/rooms/join', { code: code.trim() });
      navigate(`/room/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to join room');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <span className="text-gray-400 text-sm">{user?.username}</span>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-500 hover:text-gray-300 border border-white/10 rounded-lg px-3 py-1.5 transition-colors"
        >
          Sign out
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black gradient-text mb-2">CineMatch</h1>
          <p className="text-gray-400">Swipe together, watch together</p>
        </div>

        {/* Tabs */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => { setTab('create'); setError(''); }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                tab === 'create'
                  ? 'text-white border-b-2 border-brand-pink'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Create Room
            </button>
            <button
              onClick={() => { setTab('join'); setError(''); }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                tab === 'join'
                  ? 'text-white border-b-2 border-brand-pink'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Join Room
            </button>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            {tab === 'create' ? (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">
                  Create a new room and share the code with your partner to start swiping movies together.
                </p>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-white transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #FF6B9D, #FF4458)' }}
                >
                  {loading ? 'Creating...' : 'Create New Room'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <p className="text-gray-400 text-sm">
                  Enter the 6-character room code shared by your partner.
                </p>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="ENTER CODE"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-pink transition-colors text-center text-2xl font-bold tracking-widest uppercase"
                />
                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full py-3 rounded-xl font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #FF6B9D, #FF4458)' }}
                >
                  {loading ? 'Joining...' : 'Join Room'}
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
