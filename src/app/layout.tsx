import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SURV | Live Audience Polling, Dynamic Word Clouds & Interactive Q&A',
  description: 'The calm, modern audience engagement platform. Real-time polling, dynamic word clouds, crowdsourced Q&A, and gamified quizzes with zero app downloads.',
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
      <body className="antialiased bg-[#283E34] text-[#181F1C] min-h-[100svh] selection:bg-[#2D4A3E]/20 selection:text-[#2D4A3E]">
        {children}
      </body>
    </html>
  );
}
