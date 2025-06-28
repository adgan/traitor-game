interface Player {
  playerId: string;
  nickname: string;
  inactive?: boolean;
  admin?: boolean;
}

interface PlayerListProps {
  players: Player[];
  playerId: string;
  darkMode: boolean;
  t: (en: string, de: string) => string;
  roomId: string;
  socket: any;
  maxRoomSize: number;
}

export default function PlayerList({ players, playerId, darkMode, t, roomId, socket, maxRoomSize }: PlayerListProps) {
  const isAdmin = players.find(pl => pl.playerId === playerId)?.admin;
  return (
    <div className={
      'w-full rounded-lg p-2 mb-2 border ' +
      (darkMode ? 'bg-blue-950 border-blue-900' : 'bg-blue-50 border-blue-200')
    }>
      <div className="flex flex-wrap items-center justify-between mb-1">
        <p className={
          'text-sm font-bold ' +
          (darkMode ? 'text-blue-200' : 'text-blue-700')
        }>{t('Players in this room:', 'Spieler in diesem Raum:')}</p>
        <span className={
          'text-xs font-mono ' +
          (darkMode ? 'text-blue-300' : 'text-blue-500')
        }>{players.length} / {maxRoomSize}</span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {players.map((p) => {
          const isMe = p.playerId === playerId;
          const base = darkMode
            ? 'bg-blue-900 text-blue-100'
            : 'bg-white text-blue-700';
          const border = isMe
            ? (darkMode ? 'border-blue-400' : 'border-blue-500')
            : 'border-transparent';
          const inactive = p.inactive
            ? (darkMode
                ? 'opacity-50 grayscale'
                : 'opacity-60 grayscale')
            : '';
          return (
            <li
              key={p.playerId}
              className={`px-2 py-1 rounded shadow font-mono text-sm border-2 transition-all flex items-center gap-1 ${base} ${border} ${inactive}`}
              title={p.inactive ? t('Inactive', 'Inaktiv') : ''}
            >
              <span>{p.nickname}</span>
              {p.admin === true && (
                <span title={t('Admin', 'Admin')} className="ml-1 align-middle inline-block">
                  {/* Crown icon */}
                  <svg className="inline w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 3l2.39 4.84 5.36.78-3.88 3.78.92 5.36L10 14.77l-4.79 2.52.92-5.36-3.88-3.78 5.36-.78z"/></svg>
                </span>
              )}
              {/* Kick button for admin, not for self, not for already inactive */}
              {isAdmin && !isMe && !p.inactive && (
                <button
                  className="ml-1 px-1 py-0.5 rounded text-xs font-bold text-red-600 bg-red-100 hover:bg-red-200 border border-red-200 transition"
                  title={t('Kick player', 'Spieler entfernen')}
                  aria-label={t('Kick player', 'Spieler entfernen')}
                  onClick={() => {
                    if (socket) {
                      socket.emit('kickPlayer', {
                        roomId,
                        adminId: playerId,
                        targetPlayerId: p.playerId
                      });
                    }
                  }}
                >
                  {t('Kick', 'Kicken')}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
