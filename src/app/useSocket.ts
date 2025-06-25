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
    } else if (process.env.NEXT_PUBLIC_SOCKET_URL) {
      url = process.env.NEXT_PUBLIC_SOCKET_URL;
    } else {
      url = 'http://localhost:3000';
    }
    console.log('[useSocket] initializing socket.io with url:', url);
    socketRef.current = io(url, {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
      withCredentials: true,
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
    }
  }, [roomId, nickname, joined]);

  return { socket: socketRef.current, connected, joined };
}
