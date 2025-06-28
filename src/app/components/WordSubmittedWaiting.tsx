interface WordSubmittedWaitingProps {
  darkMode: boolean;
  t: (en: string, de: string) => string;
  word: string;
  setWordSubmitted: (v: boolean) => void;
  setRole: (v: string | null) => void;
  setGameWord: (v: string | null) => void;
  socket: any;
  roomId: string;
  nickname: string;
}

export default function WordSubmittedWaiting({ darkMode, t, word, setWordSubmitted, setRole, setGameWord, socket, roomId, nickname }: WordSubmittedWaitingProps) {
  return (
    <div className={
      'w-full flex flex-col items-center rounded-2xl shadow-lg p-6 border animate-fade-in-up ' +
      (darkMode
        ? 'bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 border-blue-900'
        : 'bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 border-blue-200')
    }>
      <div className="flex flex-col items-center w-full">
        <svg className="w-12 h-12 text-blue-400 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p className={
          'text-2xl font-bold mb-1 tracking-tight drop-shadow ' +
          (darkMode ? 'text-blue-200' : 'text-blue-700')
        }>{t('Word submitted!', 'Wort abgeschickt!')}</p>
        <p className={
          'text-base font-semibold mb-4 ' +
          (darkMode ? 'text-blue-100' : 'text-blue-900')
        }>
          {t('You submitted:', 'Du hast eingereicht:')} <span className={
            'font-mono px-2 py-1 rounded shadow-inner ' +
            (darkMode ? 'text-blue-100 bg-blue-900' : 'text-blue-900 bg-blue-100')
          }>{word}</span>
        </p>
        <button
          className={
            'mb-4 border px-5 py-2 rounded-xl font-semibold shadow-md transition-all text-base focus:outline-none focus:ring-2 ' +
            (darkMode
              ? 'bg-blue-900 hover:bg-blue-800 text-blue-100 border-blue-700 focus:ring-blue-900'
              : 'bg-blue-200 hover:bg-blue-300 text-blue-900 border-blue-400 focus:ring-blue-400')
          }
          onClick={() => {
            setWordSubmitted(false);
            setRole(null);
            setGameWord(null);
            if (socket && roomId && nickname) {
              socket.emit('cancelWord', { roomId, nickname });
            }
          }}
        >
          {t('Change my word', 'Wort überdenken')}
        </button>
        <div className="flex items-center gap-2 mt-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          <p className="text-gray-500 italic text-base text-center">
            {t('Waiting for other players to submit their words...', 'Warte auf die anderen Spieler...')}
          </p>
        </div>
      </div>
    </div>
  );
}
