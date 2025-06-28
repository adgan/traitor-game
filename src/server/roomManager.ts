
// RoomManager: handles all room state and logic
import type { Room } from './types/Room';
export type RoomWords = Record<string, Room>;
export const roomWords: RoomWords = {};

// getPlayers is no longer used; player list is now sent with inactive info from socketHandlers
