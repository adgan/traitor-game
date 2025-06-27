"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(roomId: string, nickname: string) {
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
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
    socketRef.current.on('connect', () => {
      console.log('[useSocket] socket connected:', socketRef.current?.id);
    });
    socketRef.current.on('connect_error', (err) => {
      console.error('[useSocket] connect_error', err);
    });
    socketRef.current.on('error', (err) => {
      console.error('[useSocket] error', err);
    });
    socketRef.current.on('disconnect', (reason) => {
      console.warn('[useSocket] disconnected', reason);
    });
    socketRef.current.on('reconnect_attempt', (attempt) => {
      console.log('[useSocket] reconnect_attempt', attempt);
    });
    socketRef.current.on('reconnect', (attempt) => {
      console.log('[useSocket] reconnect', attempt);
    });
    socketRef.current.on('reconnect_failed', () => {
      console.error('[useSocket] reconnect_failed');
    });
    socketRef.current.on('ping', () => {
      console.log('[useSocket] ping');
    });
    socketRef.current.on('pong', (latency) => {
      console.log('[useSocket] pong', latency);
    });
    // --- END SOCKET EVENT LOGGING ---
    return () => {
      if (socketRef.current) {
        console.log('[useSocket] cleaning up, disconnecting socket');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Emit join when both roomId and nickname are set and not already joined
  useEffect(() => {
    const socket = socketRef.current;
    console.log('[useSocket] useEffect [roomId, nickname, joined] triggered', { roomId, nickname, joined, socketExists: !!socket });
    if (socket && roomId && nickname && !joined) {
      socket.off('joined');
      socket.off('connect');
      socket.on('connect', () => {
        console.log('[useSocket] socket connected, emitting join', { roomId, nickname });
        socket.emit('join', { roomId, nickname });
      });
      socket.on('joined', () => {
        console.log('[useSocket] joined event received');
        setJoined(true);
        setConnected(true);
      });
      // If already connected, emit join immediately
      if (socket.connected) {
        console.log('[useSocket] socket already connected, emitting join', { roomId, nickname });
        socket.emit('join', { roomId, nickname });
      }
    } else {
      if (!roomId) console.warn('[useSocket] No roomId provided');
      if (!nickname) console.warn('[useSocket] No nickname provided');
      if (joined) console.log('[useSocket] Already joined, skipping join emit');
      if (!socket) console.warn('[useSocket] No socket instance available');
    }
  }, [roomId, nickname, joined]);

  return { socket: socketRef.current, connected, joined };
}
