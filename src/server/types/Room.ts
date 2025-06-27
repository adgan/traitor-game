export interface Room {
  words: string[];
  sockets: string[];
  clues: string[];
  clueTurn: number;
  cluePhase: boolean;
  votes: Record<string, string>;
  nicknames: Record<string, string>;
  maxRoomSize: number;
}
