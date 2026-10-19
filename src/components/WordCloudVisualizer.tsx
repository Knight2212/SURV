'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PollResponse } from '@/types';
import { Cloud, Sparkles } from 'lucide-react';

interface WordCloudVisualizerProps {
  responses: PollResponse[];
  emptyMessage?: string;
}

const CLOUD_PALETTE = [
  { text: '#818CF8', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.25)', glow: 'rgba(99, 102, 241, 0.3)' },
  { text: '#22D3EE', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.25)', glow: 'rgba(6, 182, 212, 0.3)' },
  { text: '#34D399', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)', glow: 'rgba(16, 185, 129, 0.3)' },
  { text: '#FBBF24', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)', glow: 'rgba(245, 158, 11, 0.3)' },
  { text: '#F472B6', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.25)', glow: 'rgba(236, 72, 153, 0.3)' },
  { text: '#A78BFA', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.25)', glow: 'rgba(139, 92, 246, 0.3)' },
  { text: '#60A5FA', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.25)', glow: 'rgba(59, 130, 246, 0.3)' },
  { text: '#2DD4BF', bg: 'rgba(20, 184, 166, 0.12)', border: 'rgba(20, 184, 166, 0.25)', glow: 'rgba(20, 184, 166, 0.3)' },
];

export default function WordCloudVisualizer({
  responses,
  emptyMessage = 'Waiting for audience responses...',
}: WordCloudVisualizerProps) {
  // Aggregate frequencies
  const wordStats = useMemo(() => {
    const counts: Record<string, number> = {};

    responses.forEach(r => {
      if (typeof r.value === 'string') {
        const words = r.value
          .trim()
          .split(/[\s,]+/)
          .filter(w => w.length > 1);

        words.forEach(rawWord => {
          const capitalized = rawWord.charAt(0).toUpperCase() + rawWord.slice(1).toLowerCase();
          counts[capitalized] = (counts[capitalized] || 0) + 1;
        });
      }
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const maxCount = entries.length > 0 ? entries[0][1] : 1;
    const minCount = entries.length > 0 ? entries[entries.length - 1][1] : 1;

    return entries.map(([word, count], idx) => {
      const weight = maxCount === minCount ? 1 : (count - minCount) / (maxCount - minCount);
      const fontSize = 1.05 + weight * 1.8; // Rem scale from 1.05rem to 2.85rem
      const palette = CLOUD_PALETTE[idx % CLOUD_PALETTE.length];
      return { word, count, fontSize, palette, weight };
    });
  }, [responses]);

  if (wordStats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center rounded-2xl bg-slate-900/40 border border-dashed border-white/10 text-slate-400">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3 text-slate-300">
          <Cloud size={24} />
        </div>
        <p className="text-base font-medium text-slate-200">{emptyMessage}</p>
        <span className="text-xs text-slate-500 mt-1">
          Audience submissions will cluster and animate dynamically in real-time.
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-wrap items-center justify-center gap-3.5 sm:gap-5 p-8 sm:p-12 min-h-[280px] rounded-2xl bg-slate-900/50 border border-white/10 backdrop-blur-md overflow-hidden">
      <AnimatePresence>
        {wordStats.map(({ word, count, fontSize, palette }, index) => (
          <motion.span
            key={word}
            layout
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, delay: index * 0.02 }}
            style={{
              fontSize: `${fontSize}rem`,
              color: palette.text,
              backgroundColor: palette.bg,
              borderColor: palette.border,
              boxShadow: `0 0 25px ${palette.glow}`,
            }}
            className="inline-flex items-center gap-2 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full border font-bold cursor-default select-none transition-shadow"
            title={`${count} response${count > 1 ? 's' : ''}`}
          >
            <span>{word}</span>
            {count > 1 && (
              <span
                style={{ backgroundColor: palette.text }}
                className="text-[11px] font-black text-slate-950 px-2 py-0.5 rounded-full leading-none shadow-sm"
              >
                {count}
              </span>
            )}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
