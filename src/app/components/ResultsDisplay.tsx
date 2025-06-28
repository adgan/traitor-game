interface ResultsDisplayProps {
  results: {
    voteCounts: Record<string, number>;
  } | null;
  t: (en: string, de: string) => string;
  darkMode: boolean;
}

export default function ResultsDisplay({ results, t, darkMode }: ResultsDisplayProps) {
  if (!results) return null;
  return (
    <div className={
      'w-full text-center mt-6 ' +
      (darkMode ? 'text-blue-50' : 'text-blue-700')
    }>
      <h2 className={
        'text-2xl font-bold mb-3 ' +
        (darkMode ? 'text-blue-100' : 'text-blue-700')
      }>{t('Results', 'Ergebnisse')}</h2>
      <ul className="mb-2">
        {Object.entries(results.voteCounts).map(([id, count], i) => (
          <li
            key={i}
            className={
              'mb-1 text-lg rounded-lg px-3 py-1 shadow-inner ' +
              (darkMode ? 'bg-blue-800 text-blue-50' : 'bg-blue-100 text-blue-800')
            }
          >
            {id}: {String(count)} {t('vote(s)', 'Stimme(n)')}
          </li>
        ))}
      </ul>
      <p className={
        'mt-2 font-bold ' +
        (darkMode ? 'text-blue-200' : 'text-blue-700')
      }>{t('Game Over!', 'Spiel vorbei!')}</p>
    </div>
  );
}
