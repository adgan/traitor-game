interface Player {
  playerId: string;
  nickname: string;
  inactive?: boolean;
}

interface VotingPhaseProps {
  voting: boolean;
  results: any;
  t: (en: string, de: string) => string;
  vote: string;
  setVote: (v: string) => void;
  handleVote: () => void;
  players: Player[];
  darkMode: boolean;
}

export default function VotingPhase({ voting, results, t, vote, setVote, handleVote, players, darkMode }: VotingPhaseProps) {
  if (!(voting && !results)) return null;
  return (
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
        {players.filter(p => !p.inactive).map((p) => (
          <option key={p.playerId} value={p.playerId}>
            {p.nickname}
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
  );
}
