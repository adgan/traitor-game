
// RoomManager: handles all room state and logic
import type { RoomWords } from './types';
export const roomWords: RoomWords = {};

export function getPlayers(roomId: string): string[] {
  const room = roomWords[roomId];
  if (!room) return [];
  return room.sockets.map(sid => room.nicknames[sid] || '');
}
