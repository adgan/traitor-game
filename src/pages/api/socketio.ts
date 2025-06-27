import { Server } from 'socket.io';
import type { NextApiRequest } from 'next';
import type { NextApiResponseServerIO } from '@/types/next';

// Store submitted words and players per room (persistent across requests)
const roomWords: Record<string, { words: string[]; sockets: string[]; clues: string[]; clueTurn: number; cluePhase: boolean; votes: Record<string, string>; nicknames: Record<string, string>; maxRoomSize: number }> = {};

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      transports: ['polling'], // Force long polling, disable websocket
    });
    res.socket.server.io = io;
    io.on('connection', (socket) => {
      // Helper to emit player list to all in room
      function emitPlayers(roomId: string) {
        if (roomWords[roomId]) {
          const players = roomWords[roomId].sockets.map(sid => roomWords[roomId].nicknames[sid] || '');
          io.to(roomId).emit('players', { players });
        }
      }

      // Join room
      socket.on('join', ({ roomId, nickname }) => {
        console.log('[socketio] join called', { roomId, nickname });
        if (!roomWords[roomId]) {
          console.log('[socketio] join failed: room does not exist', { roomId });
          socket.emit('roomError', { error: 'Room does not exist.' });
          return;
        }
        if (roomWords[roomId].sockets.length >= roomWords[roomId].maxRoomSize) {
          console.log('[socketio] join failed: room is full', { roomId });
          socket.emit('roomError', { error: 'Room is full.' });
          return;
        }
        socket.join(roomId);
        if (!roomWords[roomId].sockets.includes(socket.id)) {
          roomWords[roomId].sockets.push(socket.id);
          roomWords[roomId].nicknames[socket.id] = nickname;
        }
        console.log('[socketio] join success, sockets:', roomWords[roomId].sockets, 'nicknames:', roomWords[roomId].nicknames);
        socket.emit('joined', roomId);
        emitPlayers(roomId);
      });
      // Create room
      socket.on('createRoom', ({ roomId, maxRoomSize, nickname }) => {
        console.log('[socketio] createRoom called', { roomId, maxRoomSize, nickname });
        if (!roomWords[roomId]) {
          roomWords[roomId] = { words: [], sockets: [], clues: [], clueTurn: 0, cluePhase: false, votes: {}, nicknames: {}, maxRoomSize: maxRoomSize || 6 };
        }
        socket.join(roomId);
        if (!roomWords[roomId].sockets.includes(socket.id)) {
          roomWords[roomId].sockets.push(socket.id);
          roomWords[roomId].nicknames[socket.id] = nickname;
        }
        console.log('[socketio] createRoom success, sockets:', roomWords[roomId].sockets, 'nicknames:', roomWords[roomId].nicknames);
        socket.emit('joined', roomId);
        emitPlayers(roomId);
      });
      // Handle word submission
      socket.on('submitWord', ({ roomId, word }) => {
        if (!roomWords[roomId]) return;
        roomWords[roomId].words.push(word);
        // If all players submitted, start game
        if (roomWords[roomId].words.length === roomWords[roomId].sockets.length && roomWords[roomId].words.length >= 3) {
          // Pick a word
          const chosenWord = roomWords[roomId].words[Math.floor(Math.random() * roomWords[roomId].words.length)];
          // Assign traitor
          const traitorIdx = Math.floor(Math.random() * roomWords[roomId].sockets.length);
          roomWords[roomId].cluePhase = true;
          roomWords[roomId].clueTurn = 0;
          roomWords[roomId].clues = [];
          roomWords[roomId].votes = {};
          roomWords[roomId].sockets.forEach((sid, idx) => {
            if (idx === traitorIdx) {
              io.to(sid).emit('role', { role: 'traitor' });
            } else {
              io.to(sid).emit('role', { role: 'friend', word: chosenWord });
            }
          });
          // Notify first player to give a clue
          const firstSid = roomWords[roomId].sockets[0];
          io.to(firstSid).emit('yourTurn');
          io.to(roomId).emit('cluePhase', { turn: 0, total: roomWords[roomId].sockets.length });
        }
      });
      // Handle clue submission
      socket.on('submitClue', ({ roomId, clue }) => {
        const room = roomWords[roomId];
        if (!room || !room.cluePhase) return;
        room.clues.push(clue);
        // Advance turn
        room.clueTurn++;
        if (room.clueTurn < room.sockets.length) {
          // Next player's turn
          const nextSid = room.sockets[room.clueTurn];
          io.to(nextSid).emit('yourTurn');
          io.to(roomId).emit('cluePhase', { turn: room.clueTurn, total: room.sockets.length });
        } else {
          // All clues given, start voting phase
          room.cluePhase = false;
          io.to(roomId).emit('allClues', { clues: room.clues });
          io.to(roomId).emit('votingPhase');
        }
      });
      // Handle voting
      socket.on('submitVote', ({ roomId, suspectId }) => {
        const room = roomWords[roomId];
        if (!room) return;
        room.votes[socket.id] = suspectId;
        if (Object.keys(room.votes).length === room.sockets.length) {
          // All votes in, reveal results
          const voteCounts: Record<string, number> = {};
          Object.values(room.votes).forEach(id => {
            voteCounts[id] = (voteCounts[id] || 0) + 1;
          });
          io.to(roomId).emit('results', { votes: room.votes, voteCounts });
        }
      });
      // Leave room
      socket.on('leaveRoom', (roomId) => {
        if (!roomWords[roomId]) return;
        const idx = roomWords[roomId].sockets.indexOf(socket.id);
        if (idx !== -1) {
          roomWords[roomId].sockets.splice(idx, 1);
          roomWords[roomId].words.splice(idx, 1);
          if (roomWords[roomId].clues) roomWords[roomId].clues.splice(idx, 1);
          if (roomWords[roomId].votes) delete roomWords[roomId].votes[socket.id];
          if (roomWords[roomId].nicknames) delete roomWords[roomId].nicknames[socket.id];
          emitPlayers(roomId);
        }
        socket.leave(roomId);
        socket.emit('leftRoom', roomId);
      });
      // Clean up on disconnect
      socket.on('disconnect', () => {
        Object.keys(roomWords).forEach(roomId => {
          const idx = roomWords[roomId].sockets.indexOf(socket.id);
          if (idx !== -1) {
            roomWords[roomId].sockets.splice(idx, 1);
            roomWords[roomId].words.splice(idx, 1);
            if (roomWords[roomId].clues) roomWords[roomId].clues.splice(idx, 1);
            if (roomWords[roomId].votes) delete roomWords[roomId].votes[socket.id];
            if (roomWords[roomId].nicknames) delete roomWords[roomId].nicknames[socket.id];
            emitPlayers(roomId);
          }
        });
      });
    });
  }
  res.end();
}
