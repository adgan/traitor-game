import type { Server, Socket } from 'socket.io';
import { roomWords, getPlayers } from './roomManager';


export function registerSocketHandlers(io: Server, socket: Socket) {
  // Helper to emit player list to all in room
  function emitPlayers(roomId: string) {
    io.to(roomId).emit('players', { players: getPlayers(roomId) });
  }

  // Helper to emit a notification to all in room
  function emitNotification(roomId: string, message: string) {
    io.to(roomId).emit('notification', { message });
  }

  // Join room
  socket.on('join', ({ roomId, nickname }) => {
    if (!roomWords[roomId]) {
      socket.emit('roomError', { error: 'Room does not exist.' });
      return;
    }
    if (roomWords[roomId].sockets.length >= roomWords[roomId].maxRoomSize) {
      socket.emit('roomError', { error: 'Room is full.' });
      return;
    }
    socket.join(roomId);
    if (!roomWords[roomId].sockets.includes(socket.id)) {
      roomWords[roomId].sockets.push(socket.id);
      roomWords[roomId].nicknames[socket.id] = nickname;
      emitNotification(roomId, `${nickname} joined the room.`);
    }
    socket.emit('joined', roomId);
    emitPlayers(roomId);
  });

  // Create room
  socket.on('createRoom', ({ roomId, maxRoomSize, nickname }) => {
    if (!roomWords[roomId]) {
      roomWords[roomId] = { words: [], sockets: [], clues: [], clueTurn: 0, cluePhase: false, votes: {}, nicknames: {}, maxRoomSize: maxRoomSize || 6 };
    }
    socket.join(roomId);
    if (!roomWords[roomId].sockets.includes(socket.id)) {
      roomWords[roomId].sockets.push(socket.id);
      roomWords[roomId].nicknames[socket.id] = nickname;
      emitNotification(roomId, `${nickname} created the room.`);
    }
    socket.emit('joined', roomId);
    emitPlayers(roomId);
  });

  // Handle word submission
  socket.on('submitWord', ({ roomId, word }) => {
    if (!roomWords[roomId]) return;
    roomWords[roomId].words.push(word);
    emitNotification(roomId, `${roomWords[roomId].nicknames[socket.id]} submitted a word.`);
    if (roomWords[roomId].words.length === roomWords[roomId].sockets.length && roomWords[roomId].words.length >= 3) {
      emitNotification(roomId, `The game is starting!`);
      const chosenWord = roomWords[roomId].words[Math.floor(Math.random() * roomWords[roomId].words.length)];
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
    room.clueTurn++;
    if (room.clueTurn < room.sockets.length) {
      const nextSid = room.sockets[room.clueTurn];
      io.to(nextSid).emit('yourTurn');
      io.to(roomId).emit('cluePhase', { turn: room.clueTurn, total: room.sockets.length });
    } else {
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
      const leftName = roomWords[roomId].nicknames[socket.id];
      roomWords[roomId].sockets.splice(idx, 1);
      roomWords[roomId].words.splice(idx, 1);
      if (roomWords[roomId].clues) roomWords[roomId].clues.splice(idx, 1);
      if (roomWords[roomId].votes) delete roomWords[roomId].votes[socket.id];
      if (roomWords[roomId].nicknames) delete roomWords[roomId].nicknames[socket.id];
      emitPlayers(roomId);
      if (leftName) emitNotification(roomId, `${leftName} left the room.`);
    }
    socket.leave(roomId);
    socket.emit('leftRoom', roomId);
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    Object.keys(roomWords).forEach(roomId => {
      const idx = roomWords[roomId].sockets.indexOf(socket.id);
      if (idx !== -1) {
        const leftName = roomWords[roomId].nicknames[socket.id];
        roomWords[roomId].sockets.splice(idx, 1);
        roomWords[roomId].words.splice(idx, 1);
        if (roomWords[roomId].clues) roomWords[roomId].clues.splice(idx, 1);
        if (roomWords[roomId].votes) delete roomWords[roomId].votes[socket.id];
        if (roomWords[roomId].nicknames) delete roomWords[roomId].nicknames[socket.id];
        emitPlayers(roomId);
        if (leftName) emitNotification(roomId, `${leftName} left the room.`);
      }
    });
  });
}
