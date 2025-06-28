"use client";


import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { useSocket } from "./useSocket";
import WordEntrySection from "./components/WordEntrySection";
import Header from "./components/Header";
import RoleDisplay from "./components/RoleDisplay";
import ResultsDisplay from "./components/ResultsDisplay";
import CluePhase from "./components/CluePhase";
import VotingPhase from "./components/VotingPhase";
import WordSubmittedWaiting from "./components/WordSubmittedWaiting";
import AllCluesDisplay from "./components/AllCluesDisplay";
import LobbyPreJoin from "./components/LobbyPreJoin";
import InRoomInfo from "./components/InRoomInfo";

export default function Home() {
  // --- Admin logic ---
  // Lock word input for all when admin starts game
  const [startLocked, setStartLocked] = useState(false);

  // Helper to check if current player is admin
  const isAdmin = () => {
    const me = players.find((p) => p.playerId === playerId);
    return !!(me && me.admin === true);
  };

  // Handler for admin to start the game
  const MIN_PLAYERS = 3;
  const handleStartGame = () => {
    if (!isAdmin() || players.length < MIN_PLAYERS) return;
    setStartLocked(true); // lock word input for all
    if (socket && roomId && playerId) {
      socket.emit('startGame', { roomId, adminId: playerId });
    }
  };

  // Listen for start lock reset (e.g. on new round or leave)
  // Remove duplicate joined declaration and move useEffect after all state declarations
  // Persistent playerId for reconnect logic
  const [playerId, setPlayerId] = useState<string>("");
  // On mount, generate or load playerId
  useEffect(() => {
    let pid = localStorage.getItem("playerId");
    if (!pid) {
      pid = nanoid();
      localStorage.setItem("playerId", pid);
    }
    setPlayerId(pid);
  }, []);

  // Dark mode state
  const [darkMode, setDarkMode] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [nickname, setNickname] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const { socket, connected, joined: socketJoined } = useSocket(roomId, nickname, playerId);
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
  // Removed unused: pendingRoomCode, roomCode
  const [maxRoomSize, setMaxRoomSize] = useState(6);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<'en' | 'de'>('en');
  type Player = { playerId: string; nickname: string; inactive?: boolean; admin?: boolean };
  const [players, setPlayers] = useState<Player[]>([]);
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
  }, [socket, playerId]);

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
    // removed setPendingRoomCode
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
    // removed setRoomCode
    setInput(code);
    setCreatingRoom(false);
    setJoined(true);
    setError("");
    // removed setPendingRoomCode
    if (socket && playerId) {
      socket.emit("createRoom", { roomId: code, maxRoomSize, nickname, playerId });
    }
  };

  const handleJoin = () => {
    if (!nickname.trim()) {
      setError("Please enter a nickname.");
      return;
    }
    if (input.trim().length === 5) {
      setRoomId(input.trim().toUpperCase());
      // removed setRoomCode
      setJoined(true);
      setError("");
      if (socket && playerId) {
        socket.emit("join", { roomId: input.trim().toUpperCase(), nickname, playerId });
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
    const onPlayers = (data: { players: Player[] }) => {
      // If the current player is not in the list, force leave UI state
      if (!data.players.some(p => p.playerId === playerId)) {
        setJoined(false);
        setRoomId("");
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
        setPlayers([]);
        return;
      }
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
  }, [socket, playerId]);

  useEffect(() => {
    if (!socket) return;
    const onRoomError = (data: { error: string }) => {
      setError(data.error);
      // Only reset joined state if the error is not a reconnect race ("Room is full" but player is in the list)
      setTimeout(() => {
        setJoined((prev) => {
          // If the player is not in the players list, force leave UI
          if (!players.some(p => p.playerId === playerId)) {
            setRoomId("");
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
            setPlayers([]);
            return false;
          }
          return prev;
        });
      }, 500);
    };
    const onLeftRoom = () => {
      // Call the same logic as handleLeaveRoom, but do not emit leaveRoom again
      setJoined(false);
      setRoomId("");
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
      setPlayers([]);
    };
    socket.on("roomError", onRoomError);
    socket.on("leftRoom", onLeftRoom);
    return () => {
      socket.off("roomError", onRoomError);
      socket.off("leftRoom", onLeftRoom);
    };
  }, [socket, players, playerId]);

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
      // removed setRoomCode
      setNickname(savedNickname);
      setInput(savedRoomId);
      setJoined(true);
      setError("");
      // Do NOT emit join here
    }
  }, []); // Only run on mount

  // Emit join when socket, roomId, and nickname are all set
  useEffect(() => {
    if (socket && roomId && nickname && joined && playerId) {
      // Prevent duplicate join emits by checking if player is in the current players list
      if (players.some(p => p.playerId === playerId)) return;
      socket.emit("join", { roomId, nickname, playerId });
    }
  }, [socket, roomId, nickname, joined, playerId, players]);

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
    if (socket && roomId && playerId) {
      socket.emit("leaveRoom", { roomId, playerId });
      setJoined(false);
      setRoomId("");
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

  // Remove duplicate leftRoom handler (handled above with full reload)

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

  // const helpLabel = lang === "de" ? "Hilfe" : "Help";
  const handleHelpClick = () => {
    localStorage.setItem("language", language);
  };

  // Persist dark mode preference (must be inside component)
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem("darkMode") : null;
    if (stored === "true") setDarkMode(true);
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("darkMode", darkMode ? "true" : "false");
    }
  }, [darkMode]);

  return (
    <main
      className={
        `flex min-h-screen flex-col items-center justify-center p-0 transition-colors duration-300 ` +
        (darkMode
          ? 'bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900'
          : 'bg-gradient-to-br from-blue-50 via-slate-100 to-blue-100')
      }
    >
      <div
        className={
          `relative rounded-2xl shadow-xl px-10 py-12 max-w-lg w-full flex flex-col items-center my-8 mx-2 md:mx-0 transition-colors duration-300 ` +
          (darkMode
            ? 'md:bg-slate-900/95 md:border md:border-slate-700'
            : 'md:bg-white/95 md:border md:border-slate-200')
        }
      >
        {/* Header with title and controls */}
        <Header
          darkMode={darkMode}
          t={t}
          lang={lang}
          setDarkMode={setDarkMode}
          handleHelpClick={handleHelpClick}
        />
        {/* All content below: add dark mode support by toggling text and bg classes where needed */}
        {!joined ? (
          <LobbyPreJoin
            darkMode={darkMode}
            language={language}
            setLanguage={setLanguage}
            t={t}
            nickname={nickname}
            setNickname={setNickname}
            error={error}
            handleStartCreateRoom={handleStartCreateRoom}
            creatingRoom={creatingRoom}
            maxRoomSize={maxRoomSize}
            setMaxRoomSize={setMaxRoomSize}
            handleConfirmCreateRoom={handleConfirmCreateRoom}
            setCreatingRoom={setCreatingRoom}
            input={input}
            setInput={setInput}
            handleJoin={handleJoin} />
        ) : startLocked || (!role && !wordSubmitted) ? (
          <WordEntrySection
            darkMode={darkMode}
            t={t}
            roomId={roomId}
            maxRoomSize={maxRoomSize}
            players={players}
            connected={connected}
            socketJoined={socketJoined}
            word={word}
            setWord={setWord}
            handleWordSubmit={handleWordSubmit}
            isAdmin={isAdmin}
            startLocked={startLocked}
            handleStartGame={handleStartGame}
          />
        ) : (!role && wordSubmitted) ? (
          <WordSubmittedWaiting
            darkMode={darkMode}
            t={t}
            word={word}
            setWordSubmitted={setWordSubmitted}
            setRole={setRole}
            setGameWord={setGameWord}
            socket={socket}
            roomId={roomId}
            nickname={nickname}
          />
        ) : (
          <RoleDisplay role={role} gameWord={gameWord} t={t} />
        )}
        <CluePhase
          cluePhase={cluePhase}
          voting={voting}
          results={results}
          isMyTurn={isMyTurn}
          clue={clue}
          setClue={setClue}
          handleClueSubmit={handleClueSubmit}
          t={t}
          clueTurn={clueTurn}
          totalPlayers={totalPlayers}
        />
        <AllCluesDisplay allClues={allClues} t={t} results={results} />
        <VotingPhase
          voting={voting}
          results={results}
          t={t}
          vote={vote}
          setVote={setVote}
          handleVote={handleVote}
          players={players}
          darkMode={darkMode}
        />
        <ResultsDisplay results={results} t={t} darkMode={darkMode} />
        {joined && (
          <InRoomInfo
            notifications={notifications}
            t={t}
            nickname={nickname}
            players={players}
            playerId={playerId}
            darkMode={darkMode}
            roomId={roomId}
            socket={socket}
            maxRoomSize={maxRoomSize}
          />
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
