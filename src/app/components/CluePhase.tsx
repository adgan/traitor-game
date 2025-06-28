interface Results {
  votes: Record<string, string>;
  voteCounts: Record<string, number>;
}
interface CluePhaseProps {
  cluePhase: boolean;
  voting: boolean;
  results: Results | null;
  isMyTurn: boolean;
  clue: string;
  setClue: (v: string) => void;
  handleClueSubmit: () => void;
  t: (en: string, de: string) => string;
  clueTurn: number;
  totalPlayers: number;
}

export default function CluePhase({ cluePhase, voting, results, isMyTurn, clue, setClue, handleClueSubmit, t, clueTurn, totalPlayers }: CluePhaseProps) {
  if (!(cluePhase && !voting && !results)) return null;
  return (
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
  );
}
