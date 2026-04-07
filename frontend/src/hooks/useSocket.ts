import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '../lib/auth';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export interface MatchEvent {
  movieId: string;
  title: string;
  posterUrl: string;
  matchId: string;
  matchedAt: string;
}

interface UseSocketOptions {
  roomId: string;
  onMatch: (data: MatchEvent) => void;
  onPartnerConnected?: (data: { userId: string }) => void;
  onPartnerDisconnected?: (data: { userId: string }) => void;
  onPreferencesUpdated?: (data: { updatedBy: string }) => void;
}

export function useSocket({ roomId, onMatch, onPartnerConnected, onPartnerDisconnected, onPreferencesUpdated }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  // Stable callback refs to avoid re-subscribing
  const onMatchRef = useRef(onMatch);
  const onPartnerConnectedRef = useRef(onPartnerConnected);
  const onPartnerDisconnectedRef = useRef(onPartnerDisconnected);
  const onPreferencesUpdatedRef = useRef(onPreferencesUpdated);
  onMatchRef.current = onMatch;
  onPartnerConnectedRef.current = onPartnerConnected;
  onPartnerDisconnectedRef.current = onPartnerDisconnected;
  onPreferencesUpdatedRef.current = onPreferencesUpdated;

  useEffect(() => {
    const token = getToken();
    if (!token || !roomId) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-room', roomId);
    });

    socket.on('match', (data: MatchEvent) => {
      onMatchRef.current(data);
    });

    socket.on('partner-connected', (data: { userId: string }) => {
      onPartnerConnectedRef.current?.(data);
    });

    socket.on('partner-disconnected', (data: { userId: string }) => {
      onPartnerDisconnectedRef.current?.(data);
    });

    socket.on('preferences-updated', (data: { updatedBy: string }) => {
      onPreferencesUpdatedRef.current?.(data);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return () => {
      socket.emit('leave-room', roomId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  return { disconnect };
}
