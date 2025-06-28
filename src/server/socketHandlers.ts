import type { Server, Socket } from 'socket.io';
import { roomWords } from './roomManager';
import type { RoomPlayer } from './types/Room';


export function registerSocketHandlers(io: Server, socket: Socket) {
  // Helper to emit player list to all in room, with admin info
  function emitPlayers(roomId: string) {
    const room = roomWords[roomId];
    if (!room) return;
    // Send array of { playerId, nickname, inactive, admin }
    const players = room.players.map(p => ({
      playerId: p.playerId,
      nickname: p.nickname,
      inactive: p.inactive,
      admin: room.adminId === p.playerId
    }));
    io.to(roomId).emit('players', { players });
  }

  // Helper to emit a notification to all in room
  function emitNotification(roomId: string, message: string) {
    io.to(roomId).emit('notification', { message });
  }

  // Join room
  socket.on('join', ({ roomId, nickname, playerId }) => {
    if (!roomWords[roomId]) {
      socket.emit('roomError', { error: 'Room does not exist.' });
      return;
    }
    const room = roomWords[roomId];
    if (room.players.length >= room.maxRoomSize) {
      socket.emit('roomError', { error: 'Room is full.' });
      return;
    }
    socket.join(roomId);
    let player = room.players.find(p => p.playerId === playerId);
    if (player) {
      // Reconnect: update socketId and mark active
      player.socketId = socket.id;
      player.inactive = false;
      player.nickname = nickname; // allow nickname change on reconnect
    } else {
      // New player
      player = { playerId, nickname, socketId: socket.id, inactive: false };
      room.players.push(player);
      emitNotification(roomId, `${nickname} joined the room.`);
    }
    // If no admin, assign this player as admin
    if (!room.adminId) {
      room.adminId = playerId;
    }
    socket.emit('joined', roomId);
    emitPlayers(roomId);
  });

  // Create room
  socket.on('createRoom', ({ roomId, maxRoomSize, nickname, playerId }) => {
    if (!roomWords[roomId]) {
      roomWords[roomId] = {
        words: [],
        players: [],
        clues: [],
        clueTurn: 0,
        cluePhase: false,
        votes: {},
        maxRoomSize: maxRoomSize || 6,
        adminId: playerId
      };
    }
    const room = roomWords[roomId];
    socket.join(roomId);
    let player = room.players.find(p => p.playerId === playerId);
    if (player) {
      player.socketId = socket.id;
      player.inactive = false;
      player.nickname = nickname;
    } else {
      player = { playerId, nickname, socketId: socket.id, inactive: false };
      room.players.push(player);
      emitNotification(roomId, `${nickname} created the room.`);
    }
    // Always ensure adminId is set
    if (!room.adminId) {
      room.adminId = playerId;
    }
    socket.emit('joined', roomId);
    emitPlayers(roomId);
  });

  // Handle word submission
  socket.on('submitWord', ({ roomId, word, playerId }) => {
    const room = roomWords[roomId];
    if (!room) return;
    const player = room.players.find(p => p.playerId === playerId);
    if (!player) return;
    room.words.push(word);
    emitNotification(roomId, `${player.nickname} submitted a word.`);
    const activePlayers = room.players.filter(p => !p.inactive);
    if (room.words.length === activePlayers.length && room.words.length >= 3) {
      emitNotification(roomId, `The game is starting!`);
      const chosenWord = room.words[Math.floor(Math.random() * room.words.length)];
      const traitorIdx = Math.floor(Math.random() * activePlayers.length);
      room.cluePhase = true;
      room.clueTurn = 0;
      room.clues = [];
      room.votes = {};
      activePlayers.forEach((p, idx) => {
        if (idx === traitorIdx) {
          io.to(p.socketId).emit('role', { role: 'traitor' });
        } else {
          io.to(p.socketId).emit('role', { role: 'friend', word: chosenWord });
        }
      });
      const firstPlayer = activePlayers[0];
      io.to(firstPlayer.socketId).emit('yourTurn');
      io.to(roomId).emit('cluePhase', { turn: 0, total: activePlayers.length });
    }
  });

  // Handle clue submission
  socket.on('submitClue', ({ roomId, clue, playerId }) => {
    const room = roomWords[roomId];
    if (!room || !room.cluePhase) return;
    const player = room.players.find(p => p.playerId === playerId);
    if (!player || player.inactive) return;
    room.clues.push(clue);
    room.clueTurn++;
    const activePlayers = room.players.filter(p => !p.inactive);
    if (room.clueTurn < activePlayers.length) {
      const nextPlayer = activePlayers[room.clueTurn];
      io.to(nextPlayer.socketId).emit('yourTurn');
      io.to(roomId).emit('cluePhase', { turn: room.clueTurn, total: activePlayers.length });
    } else {
      room.cluePhase = false;
      io.to(roomId).emit('allClues', { clues: room.clues });
      io.to(roomId).emit('votingPhase');
    }
  });

  // Handle voting
  socket.on('submitVote', ({ roomId, suspectId, playerId }) => {
    const room = roomWords[roomId];
    if (!room) return;
    const player = room.players.find(p => p.playerId === playerId);
    if (!player || player.inactive) return;
    room.votes[playerId] = suspectId;
    const activePlayers = room.players.filter(p => !p.inactive);
    if (Object.keys(room.votes).length === activePlayers.length) {
      const voteCounts: Record<string, number> = {};
      Object.values(room.votes).forEach(id => {
        voteCounts[id] = (voteCounts[id] || 0) + 1;
      });
      io.to(roomId).emit('results', { votes: room.votes, voteCounts });
    }
  });

  // Leave room (mark as inactive by playerId)
  socket.on('leaveRoom', ({ roomId, playerId }) => {
    if (!roomWords[roomId]) return;
    const room = roomWords[roomId];
    const player = room.players.find(p => p.playerId === playerId);
    if (player) {
      player.inactive = true;
      // If admin left, reassign admin to next active player
      if (room.adminId === playerId) {
        const nextActive = room.players.find(p => !p.inactive && p.playerId !== playerId);
        if (nextActive) {
          room.adminId = nextActive.playerId;
          emitNotification(roomId, `${nextActive.nickname} is now the admin.`);
        } else {
          room.adminId = undefined;
        }
      }
      emitPlayers(roomId);
      emitNotification(roomId, `${player.nickname} left the room.`);
    }
    socket.leave(roomId);
    socket.emit('leftRoom', roomId);
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    Object.keys(roomWords).forEach(roomId => {
      const room = roomWords[roomId];
      if (!room) return;
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        player.inactive = true;
        // If admin disconnected, reassign admin
        if (room.adminId === player.playerId) {
          const nextActive = room.players.find(p => !p.inactive && p.playerId !== player.playerId);
          if (nextActive) {
            room.adminId = nextActive.playerId;
            emitNotification(roomId, `${nextActive.nickname} is now the admin.`);
          } else {
            room.adminId = undefined;
          }
        }
        emitPlayers(roomId);
      }
    });
  });
}
