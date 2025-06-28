import Notifications from "./Notifications";
import PlayerList from "./PlayerList";


type Player = { playerId: string; nickname: string; inactive?: boolean; admin?: boolean };
interface InRoomInfoProps {
  notifications: { id: number; message: string }[];
  t: (en: string, de: string) => string;
  nickname: string;
  players: Player[];
  playerId: string;
  darkMode: boolean;
  roomId: string;
  socket: unknown;
  maxRoomSize: number;
}

export default function InRoomInfo({
  notifications,
  t,
  nickname,
  players,
  playerId,
  darkMode,
  roomId,
  socket,
  maxRoomSize,
}: InRoomInfoProps) {
  return (
    <div className="w-full flex flex-col items-center mb-4">
      <Notifications notifications={notifications} />
      <p className="text-base text-blue-700 font-semibold mb-1">
        {t('Your nickname:', 'Dein Spitzname:')} <span className="font-mono text-blue-800">{nickname}</span>
      </p>
      <PlayerList
        players={players}
        playerId={playerId}
        darkMode={darkMode}
        t={t}
        roomId={roomId}
        socket={socket}
        maxRoomSize={maxRoomSize}
      />
    </div>
  );
}
