"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const translations = {
  en: {
    title: "Traitor Party Game – Help",
    howTo: "How to Play",
    session: "Session Recovery",
    troubleshooting: "Troubleshooting",
    back: "← Back to Game",
    howToList: [
      "One player creates a room and shares the code with friends.",
      "Each player joins the room by entering the code and a nickname.",
      "Choose your language before starting.",
      "When the game starts, everyone receives a secret role: ",
      "Friends get the same secret word. The Traitor gets a different word.",
      "Take turns giving clues about your word—be subtle!",
      "After all clues, vote for who you think the Traitor is.",
      "If the Traitor survives, they can guess the Friends' word for a final win!",
    ],
    sessionList: [
      "Your room and nickname are saved in your browser.",
      "If you reload or disconnect, you will automatically rejoin your last room.",
      "If you have issues, clear your browser storage or use a different nickname.",
    ],
    troubleshootingList: [
      'If you see "Connecting..." for a long time, check your internet or try reloading.',
      "Make sure everyone is using the same room code and language.",
      "For best results, use a modern browser (Chrome, Firefox, Edge, Safari).",
    ],
  },
  de: {
    title: "Traitor Partyspiel – Hilfe",
    howTo: "Spielanleitung",
    session: "Sitzungswiederherstellung",
    troubleshooting: "Fehlerbehebung",
    back: "← Zurück zum Spiel",
    howToList: [
      "Ein Spieler erstellt einen Raum und teilt den Code mit Freunden.",
      "Jeder Spieler tritt dem Raum mit Code und Spitznamen bei.",
      "Wähle vor Spielbeginn deine Sprache aus.",
      "Zu Beginn erhält jeder eine geheime Rolle: ",
      "Freunde bekommen dasselbe geheime Wort. Der Verräter erhält ein anderes Wort.",
      "Gebt reihum Hinweise zu eurem Wort – seid subtil!",
      "Nach allen Hinweisen stimmt ab, wer der Verräter ist.",
      "Überlebt der Verräter, darf er das Wort der Freunde erraten und kann so noch gewinnen!",
    ],
    sessionList: [
      "Dein Raum und Spitzname werden im Browser gespeichert.",
      "Nach Neuladen oder Verbindungsabbruch trittst du automatisch wieder deinem letzten Raum bei.",
      "Bei Problemen lösche die Browserdaten oder verwende einen anderen Spitznamen.",
    ],
    troubleshootingList: [
      'Siehst du lange „Verbinde...", prüfe deine Internetverbindung oder lade neu.',
      "Alle sollten denselben Raumcode und dieselbe Sprache nutzen.",
      "Nutze am besten einen modernen Browser (Chrome, Firefox, Edge, Safari).",
    ],
  },
} as const;

type Lang = keyof typeof translations;
const getTranslation = (lang: string) =>
  translations[(lang as Lang) in translations ? (lang as Lang) : "en"];

export default function HelpPage() {
  const [lang, setLang] = useState<string>("en");

  useEffect(() => {
    // Detect language from localStorage or browser
    const detected =
      typeof window !== "undefined"
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

  const tr = getTranslation(lang);

  return (
    <main className="max-w-2xl mx-auto p-6 text-base text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-4">{tr.title}</h1>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{tr.howTo}</h2>
        <ul className="list-disc pl-6 space-y-1">
          {tr.howToList.map((item: string, i: number) =>
            i === 3 ? (
              <li key={i}>
                {lang === "de"
                  ? "Zu Beginn erhält jeder eine geheime Rolle: "
                  : "When the game starts, everyone receives a secret role: "}
                <b>{lang === "de" ? "Freund" : "Friend"}</b>{" "}
                {lang === "de" ? "oder" : "or"}{" "}
                <b>{lang === "de" ? "Verräter" : "Traitor"}</b>.
              </li>
            ) : (
              <li key={i}>{item}</li>
            )
          )}
        </ul>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{tr.session}</h2>
        <ul className="list-disc pl-6 space-y-1">
          {tr.sessionList.map((item: string, i: number) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{tr.troubleshooting}</h2>
        <ul className="list-disc pl-6 space-y-1">
          {tr.troubleshootingList.map((item: string, i: number) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </section>
      <Link
        href="/"
        className="inline-block mt-4 text-blue-600 hover:underline"
      >
        {tr.back}
      </Link>
    </main>
  );
}
