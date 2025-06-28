import React from "react";

type WordEntrySectionProps = {
  darkMode: boolean;
  t: (en: string, de: string) => string;
  roomId: string;
  maxRoomSize: number;
  players: any[];
  connected: boolean;
  socketJoined: boolean;
  word: string;
  setWord: (w: string) => void;
  handleWordSubmit: () => void;
  isAdmin: () => boolean;
  startLocked: boolean;
  handleStartGame: () => void;
};

export default function WordEntrySection({
  darkMode,
  t,
  roomId,
  maxRoomSize,
  players,
  connected,
  socketJoined,
  word,
  setWord,
  handleWordSubmit,
  isAdmin,
  startLocked,
  handleStartGame,
}: WordEntrySectionProps) {
  return (
    <div className="w-full flex flex-col items-center">
      <div className={"flex flex-col items-center mb-2"}>
        <span className={"block text-base font-semibold mb-1 " + (darkMode ? "text-blue-200" : "text-blue-900")}>{t("Room", "Raum")}</span>
        <span
          className={
            "inline-block font-mono tracking-widest text-lg px-3 py-1 rounded-lg border shadow transition " +
            (darkMode
              ? "bg-blue-800 text-blue-50 border-blue-400 shadow-blue-900"
              : "bg-blue-100 text-blue-800 border-blue-400 shadow-blue-200")
          }
          style={{ letterSpacing: "0.15em", fontWeight: 700 }}
        >
          {roomId}
        </span>
      </div>
      <p className={"mb-1 font-medium " + (darkMode ? "text-blue-100" : "text-blue-900")}>{t("Room size:", "Raumgröße:")} <span className={darkMode ? "font-mono text-blue-200" : "font-mono text-blue-900"}>{maxRoomSize}</span></p>
      <p className={"mb-1 font-medium " + (darkMode ? "text-blue-100" : "text-blue-900")}>{t("Players joined:", "Spieler beigetreten:")} <span className={darkMode ? "font-mono text-blue-200" : "font-mono text-blue-900"}>{players.length}</span> / <span className={darkMode ? "font-mono text-blue-200" : "font-mono text-blue-900"}>{maxRoomSize}</span></p>
      {/* Only show lobby waiting messages if not in-game (i.e., before startLocked) */}
      {!startLocked && players.length < 3 && (
        <p className={"mb-2 font-medium rounded px-2 py-1 border transition-colors " + (darkMode ? "bg-blue-950 border-blue-900 text-blue-100" : "bg-blue-100 border-blue-200 text-blue-700")}>{t("Waiting for at least 3 players to join...", "Warte auf mindestens 3 Spieler...")}</p>
      )}
      {!startLocked && players.length < maxRoomSize && players.length >= 3 && (
        <p className={"mb-2 font-medium rounded px-2 py-1 border transition-colors " + (darkMode ? "bg-blue-950 border-blue-900 text-blue-100" : "bg-blue-100 border-blue-200 text-blue-700")}>{t("Waiting for more players or for the host to start...", "Warte auf weitere Spieler oder den Host...")}</p>
      )}
      <p className="mb-4 text-blue-700 font-medium">{connected && socketJoined ? t("Connected!", "Verbunden!") : t("Connecting...", "Verbinde...")}</p>
      {/* Only allow word input if not locked for start */}
      {(!isAdmin() || !startLocked) && (
        <>
          <input
            className={
              "border focus:ring-2 rounded-lg px-4 py-3 mb-3 w-full text-base font-medium transition outline-none " +
              (darkMode
                ? "border-slate-700 focus:border-blue-700 focus:ring-blue-900 bg-slate-800 text-blue-100 placeholder:text-slate-400"
                : "border-slate-300 focus:border-blue-400 focus:ring-blue-100 bg-slate-50 text-blue-900 placeholder:text-slate-400")
            }
            placeholder={t("Enter your word...", "Gib dein Wort ein...")}
            value={word}
            onChange={(e) => setWord(e.target.value)}
            disabled={!connected || !socketJoined}
          />
          <button
            className={
              "px-6 py-3 rounded-lg font-semibold shadow transition-all w-full text-base " +
              (darkMode
                ? "bg-blue-800 text-blue-100 hover:bg-blue-900"
                : "bg-blue-700 text-white hover:bg-blue-800")
            }
            onClick={handleWordSubmit}
            disabled={!word.trim() || !connected || !socketJoined}
          >
            {t("Submit Word", "Wort abschicken")}
          </button>
        </>
      )}
      {/* Start button for admin */}
      {isAdmin() && (
        <button
          className="mt-4 bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-800 transition-all w-full text-base"
          onClick={handleStartGame}
          disabled={players.length < 3 || startLocked}
        >
          {t("Start Game", "Spiel starten")}
        </button>
      )}
    </div>
  );
}
