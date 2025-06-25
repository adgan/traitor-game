"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket(roomId: string) {
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socket) {
      socket = io({
        path: '/api/socketio',
      });
      socketRef.current = socket;
    }
    if (socket && roomId && !joined) {
      socket.emit('join', roomId);
      socket.on('joined', () => {
        setJoined(true);
        setConnected(true);
      });
    }
    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  return { socket: socketRef.current, connected, joined };
}
