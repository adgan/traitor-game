import type { Server, Socket } from 'socket.io';
import { roomWords } from './roomManager';
// import type { RoomPlayer } from './types/Room';
export function registerSocketHandlers(io: Server, socket: Socket) {
  // Admin kick feature
  socket.on('kickPlayer', (data: { roomId: string; adminId: string; targetPlayerId: string }) => {
    const { roomId, adminId, targetPlayerId } = data;
    const room = roomWords[roomId];
    if (!room) return;
    if (room.adminId !== adminId) {
      socket.emit('notification', { message: 'Only the admin can kick players.' });
      return;
    }
    const target = room.players.find(p => p.playerId === targetPlayerId);
    if (!target) {
      socket.emit('notification', { message: 'Player not found.' });
      return;
    }
    if (target.inactive) {
      socket.emit('notification', { message: 'Player is already inactive.' });
      return;
    }
    target.inactive = true;
    // If kicked player is admin (should not happen), reassign admin
    if (room.adminId === targetPlayerId) {
      const nextActive = room.players.find(p => !p.inactive && p.playerId !== targetPlayerId);
      if (nextActive) {
        room.adminId = nextActive.playerId;
        emitNotification(roomId, `${nextActive.nickname} is now the admin.`);
      } else {
        room.adminId = undefined;
      }
    }
    emitPlayers(roomId);
    emitNotification(roomId, `${target.nickname} was kicked by the admin.`);
    // Notify and forcibly disconnect the kicked player if connected
    if (target.socketId && io.sockets.sockets.has(target.socketId)) {
      io.to(target.socketId).emit('notification', { message: 'You were kicked from the room by the admin.' });
      io.to(target.socketId).emit('leftRoom', roomId);
      // Remove from all rooms and disconnect
      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        // Remove from all rooms (including the game room)
        for (const roomName of targetSocket.rooms) {
          if (roomName !== targetSocket.id) {
            targetSocket.leave(roomName);
          }
        }
        // Optionally, disconnect the socket to ensure no further events are received
        targetSocket.disconnect(true);
      }
    }
  });
  // Admin kick feature
  socket.on('kickPlayer', (data: { roomId: string; adminId: string; targetPlayerId: string }) => {
    const { roomId, adminId, targetPlayerId } = data;
    const room = roomWords[roomId];
    if (!room) return;
    if (room.adminId !== adminId) {
      socket.emit('notification', { message: 'Only the admin can kick players.' });
      return;
    }
    const targetIdx = room.players.findIndex(p => p.playerId === targetPlayerId);
    if (targetIdx === -1) {
      socket.emit('notification', { message: 'Player not found.' });
      return;
    }
    const target = room.players[targetIdx];
    // Remove the player from the room array entirely
    room.players.splice(targetIdx, 1);
    // If kicked player is admin (should not happen), reassign admin
    if (room.adminId === targetPlayerId) {
      const nextActive = room.players.find(p => !p.inactive);
      if (nextActive) {
        room.adminId = nextActive.playerId;
        emitNotification(roomId, `${nextActive.nickname} is now the admin.`);
      } else {
        room.adminId = undefined;
      }
    }
    emitPlayers(roomId);
    emitNotification(roomId, `${target.nickname} was kicked by the admin.`);
    // Notify and forcibly disconnect the kicked player
    io.to(target.socketId).emit('notification', { message: 'You were kicked from the room by the admin.' });
    io.to(target.socketId).emit('leftRoom', roomId);
    io.sockets.sockets.get(target.socketId)?.leave(roomId);
    io.sockets.sockets.get(target.socketId)?.disconnect(true);
  });
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
    // Always allow join if playerId is already in the room (even if room is full or inactive)
    let player = room.players.find(p => p.playerId === playerId);
    if (player) {
      // Reconnect: update socketId and mark active
      socket.join(roomId);
      player.socketId = socket.id;
      player.inactive = false;
      player.nickname = nickname; // allow nickname change on reconnect
      // Always emit joined for reconnects
      socket.emit('joined', roomId);
      emitPlayers(roomId);
      return;
    }
    // Remove any previously inactive/kicked player with this playerId (if present)
    room.players = room.players.filter(p => p.playerId !== playerId);
    // Only block new players if the number of active players is at or above maxRoomSize
    if (room.players.filter(p => !p.inactive).length >= room.maxRoomSize) {
      socket.emit('roomError', { error: 'Room is full.' });
      return;
    }
    socket.join(roomId);
    // New player
    player = { playerId, nickname, socketId: socket.id, inactive: false };
    room.players.push(player);
    emitNotification(roomId, `${nickname} joined the room.`);
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
    } else {
      // If room already exists, do not overwrite maxRoomSize
      if (typeof maxRoomSize === 'number' && roomWords[roomId].maxRoomSize !== maxRoomSize) {
        // Optionally, you could emit a warning here if client tries to change maxRoomSize
        // socket.emit('notification', { message: 'Room already exists. maxRoomSize cannot be changed.' });
      }
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
    // Remove room if no active players left
    const stillActive = room.players.some(p => !p.inactive);
    if (!stillActive) {
      console.log(`Removing room ${roomId} due to no active players.`);
      io.to(roomId).emit('roomClosed', { message: 'The room has been closed due to inactivity.' });
      // Optionally notify all players in the room
      delete roomWords[roomId];
    }
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
      // Remove room if no active players left
      const stillActive = room.players.some(p => !p.inactive);
      if (!stillActive) {
        delete roomWords[roomId];
      }
    });
  });
}
