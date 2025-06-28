interface RoleDisplayProps {
  role: string | null;
  gameWord: string | null;
  t: (en: string, de: string) => string;
}

export default function RoleDisplay({ role, gameWord, t }: RoleDisplayProps) {
  if (!role) {
    return (
      <div className="text-center">
        <p className="mb-2 text-lg text-blue-700 font-medium">
          {t('Waiting for other players to submit their words...', 'Warte auf die anderen Spieler...')}
        </p>
      </div>
    );
  }
  return (
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
  );
}
