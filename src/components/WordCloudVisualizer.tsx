'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PollResponse } from '@/types';
import { Cloud } from 'lucide-react';

interface WordCloudVisualizerProps {
  responses: PollResponse[];
  emptyMessage?: string;
}

const CLOUD_PALETTE = [
  { text: '#c6f19d', bg: 'rgba(198, 241, 157, 0.12)', border: 'rgba(198, 241, 157, 0.25)' },
  { text: '#22D3EE', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.25)' },
  { text: '#34D399', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' },
  { text: '#FBBF24', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' },
  { text: '#EA580C', bg: 'rgba(234, 88, 12, 0.12)', border: 'rgba(234, 88, 12, 0.25)' },
  { text: '#E6E5DC', bg: 'rgba(230, 229, 220, 0.12)', border: 'rgba(230, 229, 220, 0.25)' },
  { text: '#60A5FA', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.25)' },
  { text: '#2DD4BF', bg: 'rgba(20, 184, 166, 0.12)', border: 'rgba(20, 184, 166, 0.25)' },
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
      const fontSize = 1.05 + weight * 1.8;
      const palette = CLOUD_PALETTE[idx % CLOUD_PALETTE.length];
      return { word, count, fontSize, palette, weight };
    });
  }, [responses]);

  if (wordStats.length === 0) {
    return (
      <div data-ui="true" className="flex flex-col items-center justify-center p-12 sm:p-16 text-center rounded-xl bg-[#181F1C] border border-[#283E34] text-[#8C9188]">
        <div className="w-12 h-12 rounded-lg bg-[#233B31] flex items-center justify-center mb-3 text-[#E6E5DC]">
          <Cloud size={24} />
        </div>
        <p className="text-base font-medium text-white">{emptyMessage}</p>
        <span className="text-xs text-[#8C9188] mt-1">
          Audience submissions will cluster and animate dynamically in real-time.
        </span>
      </div>
    );
  }

  return (
    <div data-ui="true" className="relative flex flex-wrap items-center justify-center gap-3.5 sm:gap-5 p-8 sm:p-12 min-h-[280px] rounded-xl bg-[#181F1C] border border-[#283E34] overflow-hidden">
      <AnimatePresence>
        {wordStats.map(({ word, count, fontSize, palette }, index) => (
          <motion.span
            key={word}
            layout
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, delay: index * 0.02 }}
            style={{
              fontSize: `${fontSize}rem`,
              color: palette.text,
              backgroundColor: palette.bg,
              borderColor: palette.border,
            }}
            className="inline-flex items-center gap-2 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full border font-bold cursor-default select-none"
            title={`${count} response${count > 1 ? 's' : ''}`}
          >
            <span>{word}</span>
            {count > 1 && (
              <span
                style={{ backgroundColor: palette.text }}
                className="text-[11px] font-bold text-[#181F1C] px-2 py-0.5 rounded-full leading-none tabular-nums"
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
