import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BUILD_NUMBER } from '../buildInfo';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Traitor Party Game",
  authors: [
    {
      name: "Adrian Ganseforth",
      url: "https://github.com/adgan",
    },
  ],
  description: "A fun party game where players submit words and guess the traitor's word.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-hidden`}
        style={{ minHeight: '100dvh', margin: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {children}
        </div>
        <div
          className="fixed bottom-0 left-0 text-xs text-gray-400 py-2 px-3 select-none pointer-events-none z-50"
          style={{ userSelect: 'none' }}
        >
          Build: {BUILD_NUMBER}
        </div>
      </body>
    </html>
  );
}
