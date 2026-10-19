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
  { bar: 'from-indigo-500/20 to-indigo-500/40', badge: 'bg-indigo-600', text: 'text-indigo-400', border: 'border-indigo-500/40' },
  { bar: 'from-cyan-500/20 to-cyan-500/40', badge: 'bg-cyan-600', text: 'text-cyan-400', border: 'border-cyan-500/40' },
  { bar: 'from-emerald-500/20 to-emerald-500/40', badge: 'bg-emerald-600', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  { bar: 'from-amber-500/20 to-amber-500/40', badge: 'bg-amber-600', text: 'text-amber-400', border: 'border-amber-500/40' },
  { bar: 'from-rose-500/20 to-rose-500/40', badge: 'bg-rose-600', text: 'text-rose-400', border: 'border-rose-500/40' },
  { bar: 'from-purple-500/20 to-purple-500/40', badge: 'bg-purple-600', text: 'text-purple-400', border: 'border-purple-500/40' },
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
    <div className={`flex flex-col w-full ${compact ? 'gap-2.5' : 'gap-4'}`}>
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
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className={`relative rounded-xl border overflow-hidden transition-all duration-300 ${
              compact ? 'p-3' : 'p-4 sm:p-5'
            } ${
              isCorrect
                ? 'bg-emerald-950/25 border-emerald-500/60 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                : isLeading
                ? 'bg-slate-900/60 border-indigo-500/40 shadow-md shadow-indigo-950/20'
                : 'bg-white/[0.03] border-white/10 hover:border-white/15'
            }`}
          >
            {/* Animated Background Progress Fill */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute inset-y-0 left-0 z-0 bg-gradient-to-r ${
                isCorrect
                  ? 'from-emerald-500/20 to-emerald-500/35'
                  : colorSet.bar
              }`}
            />

            {/* Foreground Content */}
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <span
                  className={`flex items-center justify-center font-bold text-white shrink-0 rounded-lg shadow-sm ${
                    compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
                  } ${isCorrect ? 'bg-emerald-600' : colorSet.badge}`}
                >
                  {OPTION_LETTERS[idx] || idx + 1}
                </span>

                <span
                  className={`font-semibold text-slate-100 truncate ${
                    compact ? 'text-sm' : 'text-base sm:text-lg'
                  }`}
                >
                  {opt.text}
                </span>

                {isCorrect && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 shrink-0 ml-1"
                  >
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>Correct</span>
                  </motion.span>
                )}

                {isLeading && !isCorrect && stats.totalResponses > 1 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    <Trophy size={11} className="text-indigo-400" /> Leading
                  </span>
                )}
              </div>

              {/* Vote Stats */}
              <div className="flex items-baseline gap-2 shrink-0">
                <span
                  className={`font-extrabold font-mono tracking-tight ${
                    compact ? 'text-base' : 'text-lg sm:text-2xl'
                  } ${
                    isCorrect
                      ? 'text-emerald-400'
                      : isLeading
                      ? 'text-white'
                      : 'text-slate-300'
                  }`}
                >
                  {percentage}%
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ({count})
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Footer Info */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400 pt-1">
        <span className="flex items-center gap-1.5 font-medium">
          <Users size={13} className="text-slate-500" />
          <span>Total Responses:</span>
          <strong className="text-white font-mono">{stats.totalResponses}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              poll.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
          <span className="font-medium text-slate-300">
            {poll.isOpen ? 'Voting Open' : 'Voting Closed'}
          </span>
        </span>
      </div>
    </div>
  );
}
