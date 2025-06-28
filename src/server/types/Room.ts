export interface RoomPlayer {
  playerId: string;
  nickname: string;
  socketId: string;
  inactive: boolean;
  admin?: boolean;
}

export interface Room {
  words: string[];
  players: RoomPlayer[];
  clues: string[];
  clueTurn: number;
  cluePhase: boolean;
  votes: Record<string, string>;
  maxRoomSize: number;
  // Optionally store adminId for quick lookup
  adminId?: string;
}
