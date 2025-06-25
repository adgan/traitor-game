"use client";

import { useSocket } from "./useSocket";
import { useState, useEffect } from "react";
import { nanoid } from "nanoid";

export default function Home() {
  const [roomId, setRoomId] = useState("");
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
  const [roomCode, setRoomCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [maxRoomSize, setMaxRoomSize] = useState(6);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<'en' | 'de'>('en');
  const [players, setPlayers] = useState<string[]>([]);

  // Simple translation dictionary
  const t = (en: string, de: string) => (language === 'de' ? de : en);

  // Use a proper type for results
  interface Results {
    votes: Record<string, string>;
    voteCounts: Record<string, number>;
  }
  const [results, setResults] = useState<Results | null>(null);
  const { socket, connected, joined: socketJoined } = useSocket(roomId, nickname);

  // Generate a 5-digit room code
  const generateRoomCode = () => nanoid(5).toUpperCase();

  const handleCreateRoom = () => {
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

  // Leave room handler
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-red-100 via-rose-200 to-red-300">
      <div className="bg-white/90 rounded-3xl shadow-2xl p-10 max-w-md w-full flex flex-col items-center border border-red-200">
        <h1 className="text-4xl font-extrabold mb-6 text-red-700 tracking-tight drop-shadow-md font-sans">
          Traitor Party Game
        </h1>
        {!joined ? (
          <>
            <div className="w-full flex justify-end mb-2">
              <select
                className="border-2 border-red-400 rounded-xl px-2 py-1 bg-white text-red-900 text-sm font-semibold focus:border-red-600 focus:ring-2 focus:ring-red-200 outline-none shadow focus:shadow-lg"
                value={language}
                onChange={e => setLanguage(e.target.value as 'en' | 'de')}
                aria-label="Language selector"
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
            {error && (
              <div className="w-full mb-2 text-center text-red-700 bg-red-100 rounded-lg px-3 py-2 font-semibold border border-red-300">
                {error}
              </div>
            )}
            <input
              className="border-2 border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-200 rounded-xl px-4 py-3 mb-3 w-full bg-white text-red-900 placeholder:text-red-400 text-lg font-semibold transition-all outline-none shadow focus:shadow-lg"
              placeholder={t('Enter your nickname...', 'Gib deinen Spitznamen ein...')}
              value={nickname}
              maxLength={16}
              onChange={e => setNickname(e.target.value)}
            />
            <div className="flex flex-col gap-2 w-full mb-4">
              <button
                className="bg-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-red-800 transition-all w-full text-lg"
                onClick={handleCreateRoom}
              >
                {t('Create Room', 'Raum erstellen')}
              </button>
              <button
                className="bg-white text-red-700 border-2 border-red-400 px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-red-100 transition-all w-full text-lg"
                onClick={() => setCreatingRoom(false)}
              >
                {t('Join Room', 'Raum beitreten')}
              </button>
            </div>
            {creatingRoom && roomCode && (
              <div className="w-full flex flex-col items-center">
                <label className="mb-2 text-red-700 font-semibold">{t('Max Room Size', 'Maximale Raumgröße')}</label>
                <input
                  type="number"
                  min={3}
                  max={12}
                  className="border-2 border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-200 rounded-xl px-4 py-2 mb-3 w-32 bg-white text-red-900 text-lg font-semibold transition-all outline-none shadow focus:shadow-lg text-center"
                  value={maxRoomSize}
                  onChange={e => setMaxRoomSize(Number(e.target.value))}
                />
                <div className="text-center mt-2">
                  <p className="text-lg text-red-700 font-bold">{t('Room Code:', 'Raumcode:')}</p>
                  <p className="text-3xl font-mono text-red-800 tracking-widest bg-red-100 rounded-lg px-4 py-2 shadow-inner select-all">
                    {roomCode}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {t('Share this code with friends to join!', 'Teile diesen Code mit Freunden!')}
                  </p>
                </div>
              </div>
            )}
            {!creatingRoom && (
              <div className="w-full flex flex-col items-center">
                <input
                  className="border-2 border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-200 rounded-xl px-4 py-3 mb-3 w-full bg-white text-red-900 placeholder:text-red-400 text-lg font-semibold transition-all outline-none shadow focus:shadow-lg tracking-widest uppercase"
                  placeholder={t('Enter 5-letter room code...', 'Gib den 5-stelligen Raumcode ein...')}
                  value={input}
                  maxLength={5}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                />
                <button
                  className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-red-700 transition-all w-full text-lg"
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
            <p className="mb-2 text-lg text-red-700 font-medium">
              {t('Room:', 'Raum:')} <span className="font-mono text-red-500">{roomId}</span>
            </p>
            <p className="mb-4 text-red-500 font-semibold">
              {connected && socketJoined ? t('Connected!', 'Verbunden!') : t('Connecting...', 'Verbinde...')}
            </p>
            <input
              className="border-2 border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-200 rounded-xl px-4 py-3 mb-3 w-full bg-white text-red-900 placeholder:text-red-400 text-lg font-semibold transition-all outline-none shadow focus:shadow-lg"
              placeholder={t('Enter your word...', 'Gib dein Wort ein...')}
              value={word}
              onChange={(e) => setWord(e.target.value)}
              disabled={!connected || !socketJoined}
            />
            <button
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-red-700 transition-all w-full text-lg"
              onClick={handleWordSubmit}
              disabled={!word.trim() || !connected || !socketJoined}
            >
              {t('Submit Word', 'Wort abschicken')}
            </button>
          </div>
        ) : role ? (
          <div className="text-center">
            <p className="mb-2 text-lg font-semibold text-red-700">{t('Your role:', 'Deine Rolle:')}</p>
            <p
              className={
                role === "traitor"
                  ? "text-red-700 text-3xl font-extrabold drop-shadow-sm"
                  : "text-green-600 text-3xl font-extrabold drop-shadow-sm"
              }
            >
              {role === 'traitor' ? t('Traitor', 'Verräter') : t('Friend', 'Freund')}
            </p>
            {role === 'friend' && gameWord && (
              <p className="mt-4 text-lg text-red-700 font-medium">
                {t('The word is:', 'Das Wort ist:')} <span className="font-mono text-red-600 bg-red-100 px-2 py-1 rounded-lg shadow-inner">{gameWord}</span>
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
            <p className="mb-2 text-lg text-red-700 font-medium">
              {t('Waiting for other players to submit their words...', 'Warte auf die anderen Spieler...')}
            </p>
          </div>
        )}
        {role && cluePhase && !voting && !results && (
          <div className="w-full text-center mt-6">
            <h2 className="text-2xl font-bold mb-3 text-red-700">{t('Clue Phase', 'Hinweisrunde')}</h2>
            <p className="mb-2 text-red-500 font-medium">
              {t('Turn', 'Runde')} {clueTurn + 1} {t('of', 'von')} {totalPlayers}
            </p>
            {isMyTurn ? (
              <div>
                <input
                  className="border-2 border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-200 rounded-xl px-4 py-3 mb-3 w-full bg-white text-red-900 placeholder:text-red-400 text-lg font-semibold transition-all outline-none shadow focus:shadow-lg"
                  placeholder={t('Enter your clue...', 'Gib deinen Hinweis ein...')}
                  value={clue}
                  onChange={(e) => setClue(e.target.value)}
                />
                <button
                  className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-red-700 transition-all w-full text-lg"
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
            <h2 className="text-2xl font-bold mb-3 text-red-700">{t('All Clues', 'Alle Hinweise')}</h2>
            <ul className="mb-2">
              {allClues.map((c, i) => (
                <li
                  key={i}
                  className="mb-1 text-lg text-red-800 bg-red-100 rounded-lg px-3 py-1 shadow-inner"
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
        {voting && !results && (
          <div className="w-full text-center mt-6">
            <h2 className="text-2xl font-bold mb-3 text-red-700">{t('Voting Phase', 'Abstimmungsrunde')}</h2>
            <p className="mb-2 text-red-500 font-medium">
              {t('Vote for the suspected traitor:', 'Stimme für den vermuteten Verräter:')}
            </p>
            <select
              className="border-2 border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-200 rounded-xl px-4 py-3 mb-3 w-full bg-white text-red-900 text-lg font-semibold transition-all outline-none shadow focus:shadow-lg"
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
              className="bg-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-red-800 transition-all w-full text-lg"
              onClick={handleVote}
              disabled={!vote}
            >
              {t('Submit Vote', 'Abstimmen')}
            </button>
          </div>
        )}
        {results && (
          <div className="w-full text-center mt-6">
            <h2 className="text-2xl font-bold mb-3 text-red-700">{t('Results', 'Ergebnisse')}</h2>
            <ul className="mb-2">
              {Object.entries(results.voteCounts).map(([id, count], i) => (
                <li
                  key={i}
                  className="mb-1 text-lg text-red-800 bg-red-100 rounded-lg px-3 py-1 shadow-inner"
                >
                  {id}: {String(count)} {t('vote(s)', 'Stimme(n)')}
                </li>
              ))}
            </ul>
            <p className="mt-2 font-bold text-red-700">{t('Game Over!', 'Spiel vorbei!')}</p>
          </div>
        )}
        {joined && (
          <div className="w-full flex flex-col items-center mb-4">
            <p className="text-base text-red-700 font-semibold mb-1">
              {t('Your nickname:', 'Dein Spitzname:')} <span className="font-mono text-red-800">{nickname}</span>
            </p>
            <div className="w-full bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
              <p className="text-sm text-red-700 font-bold mb-1">{t('Players in this room:', 'Spieler in diesem Raum:')}</p>
              <ul className="flex flex-wrap gap-2">
                {players.map((p, i) => (
                  <li key={i} className="px-2 py-1 bg-white rounded shadow text-red-700 font-mono text-sm">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {joined && (
          <button
            className="mt-4 bg-white text-red-700 border-2 border-red-400 px-4 py-2 rounded-xl font-semibold shadow hover:bg-red-100 transition-all text-base"
            onClick={handleLeaveRoom}
          >
            {t('Leave Room', 'Raum verlassen')}
          </button>
        )}
      </div>
    </main>
  );
}
