import { Server } from 'socket.io';
import type { NextApiRequest } from 'next';
import type { NextApiResponseServerIO } from '@/types/next';
import { registerSocketHandlers } from '@/server/socketHandlers';

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      transports: ['polling'],
    });
    res.socket.server.io = io;
    io.on('connection', (socket) => {
      registerSocketHandlers(io, socket);
    });
  }
  res.end();
}
