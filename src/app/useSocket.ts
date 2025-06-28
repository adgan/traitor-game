"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';


export function useSocket(roomId: string, nickname: string, playerId: string) {
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Only create/cleanup socket on mount/unmount
  useEffect(() => {
    let url = '';
    if (typeof window !== 'undefined') {
      url = window.location.origin;
      console.log('[useSocket] Detected window, using window.location.origin:', url);
    } else if (process.env.NEXT_PUBLIC_SOCKET_URL) {
      url = process.env.NEXT_PUBLIC_SOCKET_URL;
      console.log('[useSocket] Using NEXT_PUBLIC_SOCKET_URL:', url);
    } else {
      url = 'http://localhost:3000';
      console.log('[useSocket] Defaulting to localhost:', url);
    }
    console.log('[useSocket] initializing socket.io with url:', url);
    socketRef.current = io(url, {
      path: '/api/socketio',
      transports: ['polling'], // Only use polling, disables websocket
      withCredentials: true,
    });
    // --- SOCKET EVENT LOGGING ---
    socketRef.current.onAny((event, ...args) => {
      console.log(`[useSocket] [onAny] Event: ${event}`, ...args);
    });
    // --- END SOCKET EVENT LOGGING ---
    return () => {
      if (socketRef.current) {
        console.log('[useSocket] cleaning up, disconnecting socket');
        socketRef.current.off('players');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Emit join when both roomId, nickname, and playerId are set and not already joined
  useEffect(() => {
    const socket = socketRef.current;
    console.debug('[useSocket] useEffect [roomId, nickname, playerId, joined] triggered', { roomId, nickname, playerId, joined, socketExists: !!socket });
    if (socket && roomId && nickname && playerId && !joined) {
      socket.off('joined');
      socket.off('connect');
      socket.on('connect', () => {
        console.debug('[useSocket] socket connected, emitting join', { roomId, nickname, playerId });
        socket.emit('join', { roomId, nickname, playerId });
      });
      socket.on('joined', () => {
        console.debug('[useSocket] joined event received');
        setJoined(true);
        setConnected(true);
      });
      // If already connected, emit join immediately
      if (socket.connected) {
        console.debug('[useSocket] socket already connected, emitting join', { roomId, nickname, playerId });
        // socket.emit('join', { roomId, nickname, playerId });
      }
    } else {
      if (!roomId) console.warn('[useSocket] No roomId provided');
      if (!nickname) console.warn('[useSocket] No nickname provided');
      if (!playerId) console.warn('[useSocket] No playerId provided');
      if (!socket) console.warn('[useSocket] No socket instance available');
    }
  }, [roomId, nickname, playerId, joined]);

  return { socket: socketRef.current, connected, joined, players };
}
