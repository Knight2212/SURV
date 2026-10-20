'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Poll, PollResponse } from '@/types';
import { CheckCircle2, Trophy, Users } from 'lucide-react';

interface BarChartVisualizerProps {
  poll: Poll;
  responses: PollResponse[];
  compact?: boolean;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const DEFAULT_COLORS = [
  { bar: 'bg-[#2D4A3E]', badge: 'bg-[#2D4A3E]', text: 'text-[#c6f19d]', border: 'border-[#3D6655]' },
  { bar: 'bg-[#164e63]', badge: 'bg-[#0891b2]', text: 'text-[#22D3EE]', border: 'border-[#0891b2]/40' },
  { bar: 'bg-[#064e3b]', badge: 'bg-[#059669]', text: 'text-[#34D399]', border: 'border-[#059669]/40' },
  { bar: 'bg-[#78350f]', badge: 'bg-[#d97706]', text: 'text-[#FBBF24]', border: 'border-[#d97706]/40' },
  { bar: 'bg-[#7c2d12]', badge: 'bg-[#EA580C]', text: 'text-[#fb923c]', border: 'border-[#EA580C]/40' },
  { bar: 'bg-[#1f2937]', badge: 'bg-[#4b5563]', text: 'text-[#9ca3af]', border: 'border-[#4b5563]/40' },
];

export default function BarChartVisualizer({ poll, responses, compact = false }: BarChartVisualizerProps) {
  const options = poll.options || [];

  const stats = useMemo(() => {
    const totalResponses = responses.length;
    const counts: Record<string, number> = {};

    options.forEach(opt => {
      counts[opt.id] = 0;
    });

    responses.forEach(r => {
      if (typeof r.value === 'string' && counts[r.value] !== undefined) {
        counts[r.value] += 1;
      } else if (Array.isArray(r.value)) {
        r.value.forEach(val => {
          if (counts[val] !== undefined) counts[val] += 1;
        });
      }
    });

    const highestCount = Math.max(...Object.values(counts), 0);

    return {
      totalResponses,
      counts,
      highestCount,
    };
  }, [options, responses]);

  return (
    <div data-ui="true" className={`flex flex-col w-full ${compact ? 'gap-2.5' : 'gap-4'}`}>
      {options.map((opt, idx) => {
        const count = stats.counts[opt.id] || 0;
        const percentage = stats.totalResponses > 0 ? Math.round((count / stats.totalResponses) * 100) : 0;
        const isLeading = stats.totalResponses > 0 && count === stats.highestCount && count > 0;
        const isCorrect = poll.showCorrect && opt.isCorrect;
        const colorSet = DEFAULT_COLORS[idx % DEFAULT_COLORS.length];

        return (
          <motion.div
            key={opt.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.04 }}
            className={`relative rounded-lg border overflow-hidden ${
              compact ? 'p-3' : 'p-4 sm:p-5'
            } ${
              isCorrect
                ? 'bg-[#0f291e] border-emerald-500'
                : isLeading
                ? 'bg-[#181F1C] border-[#c6f19d]/40'
                : 'bg-[#181F1C] border-[#283E34] hover:border-[#3D6655]'
            }`}
          >
            {/* Animated Background Progress Fill */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute inset-y-0 left-0 z-0 opacity-40 ${
                isCorrect ? 'bg-emerald-600' : colorSet.bar
              }`}
            />

            {/* Foreground Content */}
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <span
                  className={`flex items-center justify-center font-bold text-white shrink-0 rounded ${
                    compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
                  } ${isCorrect ? 'bg-emerald-600' : colorSet.badge}`}
                >
                  {OPTION_LETTERS[idx] || idx + 1}
                </span>

                <span
                  className={`font-semibold text-white truncate ${
                    compact ? 'text-sm' : 'text-base sm:text-lg'
                  }`}
                >
                  {opt.text}
                </span>

                {isCorrect && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold text-emerald-300 bg-emerald-500/20 shrink-0 ml-1"
                  >
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>Correct</span>
                  </motion.span>
                )}

                {isLeading && !isCorrect && stats.totalResponses > 1 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#c6f19d] bg-[#233B31] px-2 py-0.5 rounded">
                    <Trophy size={11} className="text-[#c6f19d]" /> Leading
                  </span>
                )}
              </div>

              {/* Vote Stats */}
              <div className="flex items-baseline gap-2 shrink-0">
                <span
                  className={`font-bold tabular-nums tracking-tight ${
                    compact ? 'text-base' : 'text-lg sm:text-2xl'
                  } ${
                    isCorrect
                      ? 'text-emerald-400'
                      : isLeading
                      ? 'text-white'
                      : 'text-[#E6E5DC]'
                  }`}
                >
                  {percentage}%
                </span>
                <span className="text-xs text-[#8C9188] tabular-nums">
                  ({count})
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Footer Info */}
      <div className="flex items-center justify-between px-1 text-xs text-[#8C9188] pt-1">
        <span className="flex items-center gap-1.5 font-medium">
          <Users size={13} className="text-[#8C9188]" />
          <span>Total Responses:</span>
          <strong className="text-white tabular-nums">{stats.totalResponses}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              poll.isOpen ? 'bg-emerald-400' : 'bg-slate-500'
            }`}
          />
          <span className="font-medium text-[#E6E5DC]">
            {poll.isOpen ? 'Voting Open' : 'Voting Closed'}
          </span>
        </span>
      </div>
    </div>
  );
}
