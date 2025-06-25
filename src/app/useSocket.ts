"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket(roomId: string, nickname: string) {
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socket) {
      // Always connect to the current host (works in Docker, prod, dev)
      socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
        path: '/api/socketio',
      });
      socketRef.current = socket;
    }
    if (socket && roomId && nickname && !joined) {
      // Remove previous listeners to avoid duplicates
      socket.off('joined');
      socket.off('connect');
      socket.on('connect', () => {
        if (socket) socket.emit('join', { roomId, nickname });
      });
      socket.on('joined', () => {
        setJoined(true);
        setConnected(true);
      });
      // If already connected, emit join immediately
      if (socket && socket.connected) {
        socket.emit('join', { roomId, nickname });
      }
    }
    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, nickname]);

  return { socket: socketRef.current, connected, joined };
}
