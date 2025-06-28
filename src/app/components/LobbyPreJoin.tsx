interface LobbyPreJoinProps {
  darkMode: boolean;
  language: 'en' | 'de';
  setLanguage: (lang: 'en' | 'de') => void;
  t: (en: string, de: string) => string;
  nickname: string;
  setNickname: (v: string) => void;
  error: string;
  handleStartCreateRoom: () => void;
  creatingRoom: boolean;
  maxRoomSize: number;
  setMaxRoomSize: (v: number) => void;
  handleConfirmCreateRoom: () => void;
  setCreatingRoom: (v: boolean) => void;
  input: string;
  setInput: (v: string) => void;
  handleJoin: () => void;
}

export default function LobbyPreJoin({
  darkMode,
  language,
  setLanguage,
  t,
  nickname,
  setNickname,
  error,
  handleStartCreateRoom,
  creatingRoom,
  maxRoomSize,
  setMaxRoomSize,
  handleConfirmCreateRoom,
  setCreatingRoom,
  input,
  setInput,
  handleJoin,
}: LobbyPreJoinProps) {
  return (
    <>
      <div className="w-full flex justify-end mb-4">
        <select
          className="border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-blue-900 text-sm font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
          value={language}
          onChange={e => setLanguage(e.target.value as 'en' | 'de')}
          aria-label="Language selector"
        >
          <option value="en">English</option>
          <option value="de">Deutsch</option>
        </select>
      </div>
      <div className="w-full mb-6">
        <div className={
          'mb-4 p-4 rounded-xl text-base text-center font-medium border ' +
          (darkMode
            ? 'bg-blue-950 border-blue-900 text-blue-100'
            : 'bg-blue-50 border-blue-200 text-blue-900')
        }>
          <span className={
            'block text-lg font-bold mb-2 ' + (darkMode ? 'text-blue-100' : 'text-blue-900')
          }>{t('Welcome to Traitor Party Game!', 'Willkommen beim Traitor Party Game!')}</span>
          <span className="block mb-1">{t('To get started, enter your nickname below.', 'Gib zuerst deinen Spitznamen ein.')}</span>
          <span className="block mb-1">{t('You can create a new room or join an existing one.', 'Erstelle einen neuen Raum oder trete einem bestehenden bei.')}</span>
          <span className={
            'block mt-2 ' + (darkMode ? 'text-blue-300' : 'text-blue-700')
          }>{t('Tip: Share your room code with friends to play together!', 'Tipp: Teile deinen Raumcode mit Freunden!')}</span>
        </div>
      </div>
      {error && (
        <div className="w-full mb-3 text-center text-red-700 bg-red-100 rounded-lg px-3 py-2 font-medium border border-red-200">
          {error}
        </div>
      )}
      <input
        className={
          'border focus:ring-2 rounded-lg px-4 py-3 mb-4 w-full text-base font-medium transition outline-none ' +
          (darkMode
            ? 'border-slate-700 focus:border-blue-700 focus:ring-blue-900 bg-slate-800 text-blue-100 placeholder:text-slate-400'
            : 'border-slate-300 focus:border-blue-400 focus:ring-blue-100 bg-slate-50 text-blue-900 placeholder:text-slate-400')
        }
        placeholder={t('Enter your nickname...', 'Gib deinen Spitznamen ein...')}
        value={nickname}
        maxLength={16}
        onChange={e => setNickname(e.target.value)}
      />
      <div className="flex flex-col gap-2 w-full mb-6">
        <button
          className={
            'px-6 py-3 rounded-lg font-semibold shadow transition-all w-full text-base ' +
            (darkMode
              ? 'bg-blue-800 text-blue-100 hover:bg-blue-900'
              : 'bg-blue-700 text-white hover:bg-blue-800')
          }
          onClick={handleStartCreateRoom}
        >
          {t('Create Room', 'Raum erstellen')}
        </button>
      </div>
      {creatingRoom && (
        <div className="w-full flex flex-col items-center animate-fade-in-up">
          <h2 className="text-xl font-semibold mb-3 text-blue-900">{t('Room Settings', 'Raumeinstellungen')}</h2>
          <label className="mb-2 text-blue-800 font-medium">{t('Max Players', 'Maximale Spielerzahl')}</label>
          <div className="flex items-center gap-4 mb-4 w-full">
            <span className="text-blue-400 font-semibold">3</span>
            <input
              type="range"
              min={3}
              max={15}
              value={maxRoomSize}
              onChange={e => setMaxRoomSize(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <span className="text-blue-400 font-semibold">15</span>
          </div>
          <div className="mb-2 text-base text-blue-900 font-mono">{t('Selected:', 'Ausgewählt:')} {maxRoomSize}</div>
          <div className="flex gap-4 w-full mt-4">
            <button
              className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-800 transition-all w-full text-base"
              onClick={handleConfirmCreateRoom}
            >
              {t('Confirm & Create', 'Bestätigen & Erstellen')}
            </button>
            <button
              className="bg-slate-100 text-blue-900 px-6 py-3 rounded-lg font-semibold shadow hover:bg-slate-200 transition-all w-full text-base"
              onClick={() => setCreatingRoom(false)}
            >
              {t('Cancel', 'Abbrechen')}
            </button>
          </div>
        </div>
      )}
      {!creatingRoom && (
        <div className="w-full flex flex-col items-center">
          <div className="mb-2 text-blue-800 text-base font-medium text-center">
            {t('Already have a room code?', 'Hast du schon einen Raumcode?')}
          </div>
          <input
            className={
              'border focus:ring-2 rounded-lg px-4 py-3 mb-3 w-full text-base font-medium transition outline-none tracking-widest uppercase ' +
              (darkMode
                ? 'border-slate-700 focus:border-blue-700 focus:ring-blue-900 bg-slate-800 text-blue-100 placeholder:text-slate-400'
                : 'border-slate-300 focus:border-blue-400 focus:ring-blue-100 bg-slate-50 text-blue-900 placeholder:text-slate-400')
            }
            placeholder={t('Enter 5-letter room code...', 'Gib den 5-stelligen Raumcode ein...')}
            value={input}
            maxLength={5}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
          />
          <button
            className={
              'px-6 py-3 rounded-lg font-semibold shadow transition-all w-full text-base ' +
              (darkMode
                ? 'bg-blue-800 text-blue-100 hover:bg-blue-900'
                : 'bg-blue-700 text-white hover:bg-blue-800')
            }
            onClick={handleJoin}
            disabled={input.trim().length !== 5}
          >
            {t('Join Room', 'Raum beitreten')}
          </button>
        </div>
      )}
    </>
  );
}
