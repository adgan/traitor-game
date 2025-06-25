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
  // Use a proper type for results
  interface Results {
    votes: Record<string, string>;
    voteCounts: Record<string, number>;
  }
  const [results, setResults] = useState<Results | null>(null);
  const { socket, connected, joined: socketJoined } = useSocket(roomId);

  // Generate a 5-digit room code
  const generateRoomCode = () => nanoid(5).toUpperCase();

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    setRoomId(code);
    setRoomCode(code);
    setInput(code);
    setCreatingRoom(false);
    setJoined(true);
    if (socket) {
      socket.emit("createRoom", code);
    }
  };

  const handleJoin = () => {
    if (input.trim().length === 5) {
      setRoomId(input.trim().toUpperCase());
      setRoomCode(input.trim().toUpperCase());
      setJoined(true);
      if (socket) {
        socket.emit("join", input.trim().toUpperCase());
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
    socket.on("role", onRole);
    socket.on("yourTurn", onYourTurn);
    socket.on("cluePhase", onCluePhase);
    socket.on("allClues", onAllClues);
    socket.on("votingPhase", onVotingPhase);
    socket.on("results", onResults);
    return () => {
      socket.off("role", onRole);
      socket.off("yourTurn", onYourTurn);
      socket.off("cluePhase", onCluePhase);
      socket.off("allClues", onAllClues);
      socket.off("votingPhase", onVotingPhase);
      socket.off("results", onResults);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    const onRoomError = (data: { error: string }) => {
      alert(data.error);
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
            <div className="flex flex-col gap-2 w-full mb-4">
              <button
                className="bg-red-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-red-800 transition-all w-full text-lg"
                onClick={handleCreateRoom}
              >
                Create Room
              </button>
              <button
                className="bg-white text-red-700 border-2 border-red-400 px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-red-100 transition-all w-full text-lg"
                onClick={() => setCreatingRoom(false)}
              >
                Join Room
              </button>
            </div>
            {creatingRoom && roomCode && (
              <div className="w-full flex flex-col items-center">
                <div className="text-center mt-2">
                  <p className="text-lg text-red-700 font-bold">Room Code:</p>
                  <p className="text-3xl font-mono text-red-800 tracking-widest bg-red-100 rounded-lg px-4 py-2 shadow-inner select-all">
                    {roomCode}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Share this code with friends to join!
                  </p>
                </div>
              </div>
            )}
            {!creatingRoom && (
              <div className="w-full flex flex-col items-center">
                <input
                  className="border-2 border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-200 rounded-xl px-4 py-3 mb-3 w-full bg-white text-red-900 placeholder:text-red-400 text-lg font-semibold transition-all outline-none shadow focus:shadow-lg tracking-widest uppercase"
                  placeholder="Enter 5-letter room code..."
                  value={input}
                  maxLength={5}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                />
                <button
                  className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-red-700 transition-all w-full text-lg"
                  onClick={handleJoin}
                  disabled={input.trim().length !== 5}
                >
                  Join Room
                </button>
              </div>
            )}
          </>
        ) : !wordSubmitted ? (
          <div className="w-full flex flex-col items-center">
            <p className="mb-2 text-lg text-red-700 font-medium">
              Room:{" "}
              <span className="font-mono text-red-500">{roomId}</span>
            </p>
            <p className="mb-4 text-red-500 font-semibold">
              {connected && socketJoined ? "Connected!" : "Connecting..."}
            </p>
            <input
              className="border-2 border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-200 rounded-xl px-4 py-3 mb-3 w-full bg-white text-red-900 placeholder:text-red-400 text-lg font-semibold transition-all outline-none shadow focus:shadow-lg"
              placeholder="Enter your word..."
              value={word}
              onChange={(e) => setWord(e.target.value)}
              disabled={!connected || !socketJoined}
            />
            <button
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-red-700 transition-all w-full text-lg"
              onClick={handleWordSubmit}
              disabled={!word.trim() || !connected || !socketJoined}
            >
              Submit Word
            </button>
          </div>
        ) : role ? (
          <div className="text-center">
            <p className="mb-2 text-lg font-semibold text-red-700">Your role:</p>
            <p
              className={
                role === "traitor"
                  ? "text-red-700 text-3xl font-extrabold drop-shadow-sm"
                  : "text-green-600 text-3xl font-extrabold drop-shadow-sm"
              }
            >
              {role === "traitor" ? "Traitor" : "Friend"}
            </p>
            {role === "friend" && gameWord && (
              <p className="mt-4 text-lg text-red-700 font-medium">
                The word is:{" "}
                <span className="font-mono text-red-600 bg-red-100 px-2 py-1 rounded-lg shadow-inner">
                  {gameWord}
                </span>
              </p>
            )}
            {role === "traitor" && (
              <p className="mt-4 text-lg italic text-gray-500">
                You do NOT know the word!
              </p>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-2 text-lg text-red-700 font-medium">
              Waiting for other players to submit their words...
            </p>
          </div>
        )}
        {role && cluePhase && !voting && !results && (
          <div className="w-full text-center mt-6">
            <h2 className="text-2xl font-bold mb-3 text-red-700">Clue Phase</h2>
            <p className="mb-2 text-red-500 font-medium">
              Turn {clueTurn + 1} of {totalPlayers}
            </p>
            {isMyTurn ? (
              <div>
                <input
                  className="border-2 border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-200 rounded-xl px-4 py-3 mb-3 w-full bg-white text-red-900 placeholder:text-red-400 text-lg font-semibold transition-all outline-none shadow focus:shadow-lg"
                  placeholder="Enter your clue..."
                  value={clue}
                  onChange={(e) => setClue(e.target.value)}
                />
                <button
                  className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-red-700 transition-all w-full text-lg"
                  onClick={handleClueSubmit}
                  disabled={!clue.trim()}
                >
                  Submit Clue
                </button>
              </div>
            ) : (
              <p className="italic text-gray-400">
                Waiting for the current player to submit a clue...
              </p>
            )}
          </div>
        )}
        {allClues.length > 0 && !results && (
          <div className="w-full text-center mt-6">
            <h2 className="text-2xl font-bold mb-3 text-red-700">All Clues</h2>
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
            <h2 className="text-2xl font-bold mb-3 text-red-700">Voting Phase</h2>
            <p className="mb-2 text-red-500 font-medium">
              Vote for the suspected traitor:
            </p>
            <select
              className="border-2 border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-200 rounded-xl px-4 py-3 mb-3 w-full bg-white text-red-900 text-lg font-semibold transition-all outline-none shadow focus:shadow-lg"
              value={vote}
              onChange={(e) => setVote(e.target.value)}
            >
              <option value="">Select player</option>
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
              Submit Vote
            </button>
          </div>
        )}
        {results && (
          <div className="w-full text-center mt-6">
            <h2 className="text-2xl font-bold mb-3 text-red-700">Results</h2>
            <ul className="mb-2">
              {Object.entries(results.voteCounts).map(([id, count], i) => (
                <li
                  key={i}
                  className="mb-1 text-lg text-red-800 bg-red-100 rounded-lg px-3 py-1 shadow-inner"
                >
                  {id}: {String(count)} vote(s)
                </li>
              ))}
            </ul>
            <p className="mt-2 font-bold text-red-700">Game Over!</p>
          </div>
        )}
        {joined && (
          <button
            className="mt-4 bg-white text-red-700 border-2 border-red-400 px-4 py-2 rounded-xl font-semibold shadow hover:bg-red-100 transition-all text-base"
            onClick={handleLeaveRoom}
          >
            Leave Room
          </button>
        )}
      </div>
    </main>
  );
}
