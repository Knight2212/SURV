import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SURV | Interactive Audience Response & Live Polling',
  description: 'Real-time audience engagement platform featuring live polling, dynamic word clouds, moderated Q&A, gamified quizzes, and self-paced surveys.',
  keywords: ['audience response system', 'live polling', 'vevox', 'interactive q&a', 'slido', 'word cloud', 'gamified quiz'],
  authors: [{ name: 'SURV Interactive' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-[#07090E] text-[#F8FAFC] min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}

