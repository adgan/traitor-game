
"use client";

import { useSocket } from "./useSocket";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import Link from "next/link";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [nickname, setNickname] = useState("");

  const [results, setResults] = useState<Results | null>(null);
  const { socket, connected, joined: socketJoined } = useSocket(roomId, nickname);

  const [input, setInput] = useState("");
  const [joined, setJoined] = useState(false);
  const [word, setWord] = useState("");
  const [wordSubmitted, setWordSubmitted] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [gameWord, setGameWord] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [clue, setClue] = useState("");
  const [cluePhase, setCluePhase] = useState(false);
  const [clueTurn, setClueTurn] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [voting, setVoting] = useState(false);
  const [allClues, setAllClues] = useState<string[]>([]);
  const [vote, setVote] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [pendingRoomCode, setPendingRoomCode] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [maxRoomSize, setMaxRoomSize] = useState(6);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<'en' | 'de'>('en');
  const [players, setPlayers] = useState<string[]>([]);
  const [lang, setLang] = useState("en");

  // Notification system
  const [notifications, setNotifications] = useState<{ id: number; message: string }[]>([]);
  // Show notifications as snackbars that disappear after 3s
  useEffect(() => {
    if (!socket) return;
    let notifId = 0;
    const onNotification = (data: { message: string }) => {
      notifId = notifId + 1;
      const id = Date.now() + Math.random();
      setNotifications((prev) => [...prev, { id, message: data.message }]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 3000);
    };
    socket.on('notification', onNotification);
    return () => {
      socket.off('notification', onNotification);
    };
  }, [socket]);

  // Simple translation dictionary
  const t = (en: string, de: string) => (language === 'de' ? de : en);

  // Use a proper type for results
  interface Results {
    votes: Record<string, string>;
    voteCounts: Record<string, number>;
  }


  // Generate a 5-digit room code
  const generateRoomCode = () => nanoid(5).toUpperCase();

  // Step 1: Start room creation (show options)
  const handleStartCreateRoom = () => {
    setCreatingRoom(true);
    setPendingRoomCode("");
    setError("");
  };

  // Step 2: Confirm and create room
  const handleConfirmCreateRoom = () => {
    if (!nickname.trim()) {
      setError("Please enter a nickname.");
      return;
    }
    const code = generateRoomCode();
    setRoomId(code);
    setRoomCode(code);
    setInput(code);
    setCreatingRoom(false);
    setJoined(true);
    setError("");
    setPendingRoomCode("");
    if (socket) {
      socket.emit("createRoom", { roomId: code, maxRoomSize, nickname });
    }
  };

  const handleJoin = () => {
    if (!nickname.trim()) {
      setError("Please enter a nickname.");
      return;
    }
    if (input.trim().length === 5) {
      setRoomId(input.trim().toUpperCase());
      setRoomCode(input.trim().toUpperCase());
      setJoined(true);
      setError("");
      if (socket) {
        socket.emit("join", { roomId: input.trim().toUpperCase(), nickname });
      }
    }
  };

  const handleWordSubmit = () => {
    if (socket && word.trim()) {
      socket.emit("submitWord", { roomId, word: word.trim() });
      setWordSubmitted(true);
    }
  };

  // Listen for role assignment
  useEffect(() => {
    if (!socket) return;
    const onRole = (data: { role: string; word?: string }) => {
      setRole(data.role);
      if (data.role === "friend" && data.word) setGameWord(data.word);
    };
    const onYourTurn = () => setIsMyTurn(true);
    const onCluePhase = (data: { turn: number; total: number }) => {
      setCluePhase(true);
      setClueTurn(data.turn);
      setTotalPlayers(data.total);
      setIsMyTurn(false);
    };
    const onAllClues = (data: { clues: string[] }) => {
      setAllClues(data.clues);
      setCluePhase(false);
    };
    const onVotingPhase = () => setVoting(true);
    const onResults = (data: Results) => setResults(data);
    const onPlayers = (data: { players: string[] }) => {
      setPlayers(data.players);
    };
    socket.on("role", onRole);
    socket.on("yourTurn", onYourTurn);
    socket.on("cluePhase", onCluePhase);
    socket.on("allClues", onAllClues);
    socket.on("votingPhase", onVotingPhase);
    socket.on("results", onResults);
    socket.on("players", onPlayers);
    return () => {
      socket.off("role", onRole);
      socket.off("yourTurn", onYourTurn);
      socket.off("cluePhase", onCluePhase);
      socket.off("allClues", onAllClues);
      socket.off("votingPhase", onVotingPhase);
      socket.off("results", onResults);
      socket.off("players", onPlayers);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    const onRoomError = (data: { error: string }) => {
      setError(data.error);
      setJoined(false);
      setRoomId("");
      setRoomCode("");
      setInput("");
    };
    socket.on("roomError", onRoomError);
    return () => {
      socket.off("roomError", onRoomError);
    };
  }, [socket]);

  const handleClueSubmit = () => {
    if (socket && clue.trim()) {
      socket.emit("submitClue", { roomId, clue: clue.trim() });
      setClue("");
      setIsMyTurn(false);
    }
  };

  const handleVote = () => {
    if (socket && vote) {
      socket.emit("submitVote", { roomId, suspectId: vote });
    }
  };

  // --- SESSION RECOVERY LOGIC ---
  // On mount, try to recover session from localStorage
  useEffect(() => {
    const savedRoomId = localStorage.getItem("roomId");
    const savedNickname = localStorage.getItem("nickname");
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage === "en" || savedLanguage === "de") setLanguage(savedLanguage);
    if (savedRoomId && savedNickname) {
      setRoomId(savedRoomId);
      setRoomCode(savedRoomId);
      setNickname(savedNickname);
      setInput(savedRoomId);
      setJoined(true);
      setError("");
      // Do NOT emit join here
    }
  }, []); // Only run on mount

  // Emit join when socket, roomId, and nickname are all set
  useEffect(() => {
    if (socket && roomId && nickname && joined) {
      socket.emit("join", { roomId, nickname });
    }
  }, [socket, roomId, nickname, joined]);

  // Save session info on join/create
  useEffect(() => {
    if (joined && roomId && nickname) {
      localStorage.setItem("roomId", roomId);
      localStorage.setItem("nickname", nickname);
      localStorage.setItem("language", language);
    }
  }, [joined, roomId, nickname, language]);

  // Clear session info on leave
  const handleLeaveRoom = () => {
    if (socket && roomId) {
      socket.emit("leaveRoom", roomId);
      setJoined(false);
      setRoomId("");
      setRoomCode("");
      setInput("");
      setWord("");
      setWordSubmitted(false);
      setRole(null);
      setGameWord(null);
      setIsMyTurn(false);
      setClue("");
      setCluePhase(false);
      setClueTurn(0);
      setTotalPlayers(0);
      setVoting(false);
      setAllClues([]);
      setVote("");
      setResults(null);
      localStorage.removeItem("roomId");
      localStorage.removeItem("nickname");
    }
  };

  useEffect(() => {
    if (!socket) return;
    const onLeftRoom = () => {
      // Optionally handle post-leave logic
    };
    socket.on("leftRoom", onLeftRoom);
    return () => {
      socket.off("leftRoom", onLeftRoom);
    };
  }, [socket]);

  useEffect(() => {
    const detected = typeof window !== "undefined"
      ? (localStorage.getItem("language") || navigator.language || "en").slice(0, 2)
      : "en";
    setLang(detected);
    // Listen for language changes in localStorage (from other tabs or in-app changes)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "language" && e.newValue) {
        setLang(e.newValue.slice(0, 2));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    setLang(language);
  }, [language]);

  const helpLabel = lang === "de" ? "Hilfe" : "Help";
  const handleHelpClick = () => {
    localStorage.setItem("language", language);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-0 bg-gradient-to-br from-blue-50 via-slate-100 to-blue-100">
      <div className="relative bg-white/95 rounded-2xl shadow-xl px-10 py-12 max-w-lg w-full flex flex-col items-center border border-slate-200 my-8 mx-2 md:mx-0">
        <h1 className="text-3xl font-bold mb-4 text-blue-800 tracking-tight font-sans drop-shadow-sm">
          Traitor Party Game
        </h1>
        {/* Help link in top-right corner, translated */}
        <div className="absolute top-6 right-6">
          <Link href="/help" className="text-blue-600 hover:underline font-medium transition-colors" onClick={handleHelpClick}>{helpLabel}</Link>
        </div>
        {!joined ? (
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
            {error && (
              <div className="w-full mb-3 text-center text-red-700 bg-red-100 rounded-lg px-3 py-2 font-medium border border-red-200">
                {error}
              </div>
            )}
            <input
              className="border border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg px-4 py-3 mb-4 w-full bg-slate-50 text-blue-900 placeholder:text-slate-400 text-base font-medium transition outline-none"
              placeholder={t('Enter your nickname...', 'Gib deinen Spitznamen ein...')}
              value={nickname}
              maxLength={16}
              onChange={e => setNickname(e.target.value)}
            />
            <div className="flex flex-col gap-2 w-full mb-6">
              <button
                className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-800 transition-all w-full text-base"
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
                <input
                  className="border border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg px-4 py-3 mb-3 w-full bg-slate-50 text-blue-900 placeholder:text-slate-400 text-base font-medium transition outline-none tracking-widest uppercase"
                  placeholder={t('Enter 5-letter room code...', 'Gib den 5-stelligen Raumcode ein...')}
                  value={input}
                  maxLength={5}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                />
                <button
                  className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-800 transition-all w-full text-base"
                  onClick={handleJoin}
                  disabled={input.trim().length !== 5}
                >
                  {t('Join Room', 'Raum beitreten')}
                </button>
              </div>
            )}
          </>
        ) : !wordSubmitted ? (
          <div className="w-full flex flex-col items-center">
            <p className="mb-2 text-base text-blue-900 font-semibold">
              {t('Room:', 'Raum:')} <span className="font-mono text-blue-700">{roomId}</span>
            </p>
            <p className="mb-1 text-blue-900 font-medium">
              {t('Room size:', 'Raumgröße:')} <span className="font-mono text-blue-900">{maxRoomSize}</span>
            </p>
            <p className="mb-1 text-blue-900 font-medium">
              {t('Players joined:', 'Spieler beigetreten:')} <span className="font-mono text-blue-900">{players.length}</span> / <span className="font-mono text-blue-900">{maxRoomSize}</span>
            </p>
            {players.length < 3 && (
              <p className="mb-2 text-blue-700 font-medium bg-blue-100 rounded px-2 py-1">
                {t('Waiting for at least 3 players to join...', 'Warte auf mindestens 3 Spieler...')}
              </p>
            )}
            {players.length < maxRoomSize && players.length >= 3 && (
              <p className="mb-2 text-blue-700 font-medium bg-blue-100 rounded px-2 py-1">
                {t('Waiting for more players or for the host to start...', 'Warte auf weitere Spieler oder den Host...')}
              </p>
            )}
            <p className="mb-4 text-blue-700 font-medium">
              {connected && socketJoined ? t('Connected!', 'Verbunden!') : t('Connecting...', 'Verbinde...')}
            </p>
            <input
              className="border border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg px-4 py-3 mb-3 w-full bg-slate-50 text-blue-900 placeholder:text-slate-400 text-base font-medium transition outline-none"
              placeholder={t('Enter your word...', 'Gib dein Wort ein...')}
              value={word}
              onChange={(e) => setWord(e.target.value)}
              disabled={!connected || !socketJoined}
            />
            <button
              className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-800 transition-all w-full text-base"
              onClick={handleWordSubmit}
              disabled={!word.trim() || !connected || !socketJoined}
            >
              {t('Submit Word', 'Wort abschicken')}
            </button>
          </div>
        ) : (!role && wordSubmitted) ? (
          <div className="w-full flex flex-col items-center bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 rounded-2xl shadow-lg p-6 border border-blue-200 animate-fade-in-up">
            <div className="flex flex-col items-center w-full">
              <svg className="w-12 h-12 text-blue-400 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-2xl font-bold text-blue-700 mb-1 tracking-tight drop-shadow">{t('Word submitted!', 'Wort abgeschickt!')}</p>
              <p className="text-base text-blue-900 font-semibold mb-4">
                {t('You submitted:', 'Du hast eingereicht:')} <span className="font-mono text-blue-900 bg-blue-100 px-2 py-1 rounded shadow-inner">{word}</span>
              </p>
              <button
                className="mb-4 bg-blue-200 hover:bg-blue-300 text-blue-900 border border-blue-400 px-5 py-2 rounded-xl font-semibold shadow-md transition-all text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
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
        ) : role ? (
          <div className="text-center">
            <p className="mb-2 text-lg font-semibold text-blue-700">{t('Your role:', 'Deine Rolle:')}</p>
            <p
              className={
                role === "traitor"
                  ? "text-blue-700 text-3xl font-extrabold drop-shadow-sm"
                  : "text-blue-900 text-3xl font-extrabold drop-shadow-sm"
              }
            >
              {role === 'traitor' ? t('Traitor', 'Verräter') : t('Friend', 'Freund')}
            </p>
            {role === 'friend' && gameWord && (
              <p className="mt-4 text-lg text-blue-700 font-medium">
                {t('The word is:', 'Das Wort ist:')} <span className="font-mono text-blue-900 bg-blue-100 px-2 py-1 rounded-lg shadow-inner">{gameWord}</span>
              </p>
            )}
            {role === 'traitor' && (
              <p className="mt-4 text-lg italic text-gray-500">
                {t('You do NOT know the word!', 'Du kennst das Wort NICHT!')}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-2 text-lg text-blue-700 font-medium">
              {t('Waiting for other players to submit their words...', 'Warte auf die anderen Spieler...')}
            </p>
          </div>
        )}
        {role && cluePhase && !voting && !results && (
          <div className="w-full text-center mt-6">
            <h2 className="text-2xl font-bold mb-3 text-blue-700">{t('Clue Phase', 'Hinweisrunde')}</h2>
            <p className="mb-2 text-blue-500 font-medium">
              {t('Turn', 'Runde')} {clueTurn + 1} {t('of', 'von')} {totalPlayers}
            </p>
            {isMyTurn ? (
              <div>
                <input
                  className="border-2 border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-3 mb-3 w-full bg-white text-blue-900 placeholder:text-blue-400 text-lg font-semibold transition-all outline-none shadow focus:shadow-lg"
                  placeholder={t('Enter your clue...', 'Gib deinen Hinweis ein...')}
                  value={clue}
                  onChange={(e) => setClue(e.target.value)}
                />
                <button
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-blue-700 transition-all w-full text-lg"
                  onClick={handleClueSubmit}
                  disabled={!clue.trim()}
                >
                  {t('Submit Clue', 'Hinweis abschicken')}
                </button>
              </div>
            ) : (
              <p className="italic text-gray-400">
                {t('Waiting for the current player to submit a clue...', 'Warte auf den aktuellen Spieler...')}
              </p>
            )}
          </div>
        )}
        {allClues.length > 0 && !results && (
          <div className="w-full text-center mt-6">
            <h2 className="text-2xl font-bold mb-3 text-blue-700">{t('All Clues', 'Alle Hinweise')}</h2>
            <ul className="mb-2">
              {allClues.map((c, i) => (
                <li
                  key={i}
                  className="mb-1 text-lg text-blue-800 bg-blue-100 rounded-lg px-3 py-1 shadow-inner"
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
        {voting && !results && (
          <div className="w-full text-center mt-6">
            <h2 className="text-2xl font-bold mb-3 text-blue-700">{t('Voting Phase', 'Abstimmungsrunde')}</h2>
            <p className="mb-2 text-blue-500 font-medium">
              {t('Vote for the suspected traitor:', 'Stimme für den vermuteten Verräter:')}
            </p>
            <select
              className="border-2 border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-3 mb-3 w-full bg-white text-blue-900 text-lg font-semibold transition-all outline-none shadow focus:shadow-lg"
              value={vote}
              onChange={(e) => setVote(e.target.value)}
            >
              <option value="">{t('Select player', 'Spieler wählen')}</option>
              {/* For demo: use player numbers, in real app use names/IDs */}
              {Array.from({ length: totalPlayers }).map((_, i) => (
                <option key={i} value={`player${i + 1}`}>
                  {`Player ${i + 1}`}
                </option>
              ))}
            </select>
            <button
              className="bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-blue-800 transition-all w-full text-lg"
              onClick={handleVote}
              disabled={!vote}
            >
              {t('Submit Vote', 'Abstimmen')}
            </button>
          </div>
        )}
        {results && (
          <div className="w-full text-center mt-6">
            <h2 className="text-2xl font-bold mb-3 text-blue-700">{t('Results', 'Ergebnisse')}</h2>
            <ul className="mb-2">
              {Object.entries(results.voteCounts).map(([id, count], i) => (
                <li
                  key={i}
                  className="mb-1 text-lg text-blue-800 bg-blue-100 rounded-lg px-3 py-1 shadow-inner"
                >
                  {id}: {String(count)} {t('vote(s)', 'Stimme(n)')}
                </li>
              ))}
            </ul>
            <p className="mt-2 font-bold text-blue-700">{t('Game Over!', 'Spiel vorbei!')}</p>
          </div>
        )}
        {joined && (
          <div className="w-full flex flex-col items-center mb-4">
            {/* Notification area */}
            {/* Snackbar notifications */}
            <div className="fixed bottom-6 left-1/2 z-50 flex flex-col items-center space-y-2" style={{ transform: 'translateX(-50%)' }}>
              {notifications.filter(n => n.message && n.message.trim()).map((notif) => (
                <div
                  key={notif.id}
                  className="bg-blue-100 border border-blue-400 text-blue-900 px-6 py-3 rounded-xl shadow-lg font-semibold text-base animate-fade-in-up transition-all"
                  style={{ minWidth: 220, maxWidth: 320 }}
                >
                  {notif.message}
                </div>
              ))}
            </div>
            <p className="text-base text-blue-700 font-semibold mb-1">
              {t('Your nickname:', 'Dein Spitzname:')} <span className="font-mono text-blue-800">{nickname}</span>
            </p>
            <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2">
              <div className="flex flex-wrap items-center justify-between mb-1">
                <p className="text-sm text-blue-700 font-bold">{t('Players in this room:', 'Spieler in diesem Raum:')}</p>
                <span className="text-xs text-blue-500 font-mono">{players.length} / {maxRoomSize}</span>
              </div>
              <ul className="flex flex-wrap gap-2">
                {players.map((p, i) => (
                  <li
                    key={i}
                    className={`px-2 py-1 bg-white rounded shadow text-blue-700 font-mono text-sm border-2 transition-all ${p === nickname ? 'border-blue-500' : 'border-transparent'}`}
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {joined && (
          <button
            className="mt-4 bg-white text-blue-700 border-2 border-blue-400 px-4 py-2 rounded-xl font-semibold shadow hover:bg-blue-100 transition-all text-base"
            onClick={handleLeaveRoom}
          >
            {t('Leave Room', 'Raum verlassen')}
          </button>
        )}
      </div>
    </main>
  );
}
