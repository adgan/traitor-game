import Link from "next/link";

interface HeaderProps {
  darkMode: boolean;
  t: (en: string, de: string) => string;
  lang: string;
  setDarkMode: (v: (d: boolean) => boolean) => void;
  handleHelpClick: () => void;
}

export default function Header({ darkMode, t, lang, setDarkMode, handleHelpClick }: HeaderProps) {
  // helpLabel is not needed, just use inline
  return (
    <div className="relative w-full mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2">
        <h1 className="text-3xl font-bold text-blue-800 tracking-tight font-sans drop-shadow-sm text-center sm:text-left w-full">
          Traitor Party Game
        </h1>
        {/* Controls: always top right on desktop, below title on mobile */}
        <div className="flex gap-2 items-center justify-center sm:justify-end mt-3 sm:mt-0 w-full sm:w-auto">
          <button
            aria-label={darkMode ? t('Switch to light mode', 'Wechsel zu hell') : t('Switch to dark mode', 'Wechsel zu dunkel')}
            className={
              'rounded-full p-2 border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 ' +
              (darkMode
                ? 'bg-slate-800 border-slate-700 text-blue-200 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-blue-700 hover:bg-slate-200')
            }
            onClick={() => setDarkMode((d) => !d)}
            title={darkMode ? t('Switch to light mode', 'Wechsel zu hell') : t('Switch to dark mode', 'Wechsel zu dunkel')}
            type="button"
          >
            {darkMode ? (
              // Sun icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 7.07l-1.41-1.41M6.34 6.34L4.93 4.93m12.02 0l-1.41 1.41M6.34 17.66l-1.41 1.41"/></svg>
            ) : (
              // Moon icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/></svg>
            )}
          </button>
          <Link
            href="/help"
            className={
              (darkMode
                ? 'text-blue-300 hover:text-blue-100'
                : 'text-blue-600 hover:text-blue-800') +
              ' hover:underline font-medium transition-colors px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-300'
            }
            onClick={handleHelpClick}
          >
            {lang === "de" ? "Hilfe" : "Help"}
          </Link>
        </div>
      </div>
    </div>
  );
}
