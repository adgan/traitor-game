interface Results {
  votes: Record<string, string>;
  voteCounts: Record<string, number>;
}
interface AllCluesDisplayProps {
  allClues: string[];
  t: (en: string, de: string) => string;
  results: Results | null;
}

export default function AllCluesDisplay({ allClues, t, results }: AllCluesDisplayProps) {
  if (allClues.length === 0 || results) return null;
  return (
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
  );
}
