export interface RoomPlayer {
  playerId: string;
  nickname: string;
  socketId: string;
  inactive: boolean;
}

export interface Room {
  words: string[];
  players: RoomPlayer[];
  clues: string[];
  clueTurn: number;
  cluePhase: boolean;
  votes: Record<string, string>;
  maxRoomSize: number;
}
