import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SURV | Live Audience Polling, Word Clouds & Interactive Q&A',
  description: 'Real-time audience engagement platform featuring live polling, dynamic word clouds, moderated Q&A, and gamified quizzes with zero app downloads.',
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
    <html lang="en">
      <body className="antialiased bg-[#0A0D12] text-[#F8FAFC] min-h-[100svh] selection:bg-emerald-500/30 selection:text-emerald-100">
        {children}
      </body>
    </html>
  );
}
