'use client';

import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Poll, PollResponse, LeaderboardEntry } from '@/types';
import { Trophy, Medal, Award, Flame, Users } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizLeaderboardProps {
  poll: Poll;
  responses: PollResponse[];
  triggerConfettiOnMount?: boolean;
}

export default function QuizLeaderboard({
  poll,
  responses,
  triggerConfettiOnMount = true,
}: QuizLeaderboardProps) {
  useEffect(() => {
    if (triggerConfettiOnMount && typeof window !== 'undefined') {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#06B6D4'],
        });
      } catch (e) {
        console.warn('Confetti launch error:', e);
      }
    }
  }, [triggerConfettiOnMount]);

  const leaderboard: LeaderboardEntry[] = useMemo(() => {
    const correctOption = poll.options?.find(o => o.isCorrect);
    if (!correctOption) return [];

    const map = new Map<string, LeaderboardEntry>();

    responses.forEach(r => {
      const isCorrect = r.value === correctOption.id;
      const existing = map.get(r.participantId) || {
        participantId: r.participantId,
        name: r.participantName || 'Anonymous Participant',
        score: 0,
        correctCount: 0,
      };

      if (isCorrect) {
        existing.correctCount += 1;
        existing.score += 100;
      }

      map.set(r.participantId, existing);
    });

    return Array.from(map.values()).sort(
      (a, b) => b.score - a.score || a.name.localeCompare(b.name)
    );
  }, [poll, responses]);

  if (leaderboard.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center rounded-2xl bg-slate-900/40 border border-dashed border-white/10 text-slate-400">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
          <Trophy size={28} />
        </div>
        <h4 className="text-lg font-bold text-white mb-1.5">No Quiz Submissions Yet</h4>
        <p className="text-sm text-slate-400 max-w-sm">
          Attendee scores and rankings will appear here as soon as answers are submitted.
        </p>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const runnersUp = leaderboard.slice(3, 10);

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Podium for Top 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-end pt-4">
        {/* 2nd Place (Silver) */}
        {top3[1] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="order-2 sm:order-1 flex flex-col items-center p-6 rounded-2xl bg-gradient-to-b from-slate-800/40 to-slate-900/80 border border-slate-400/30 text-center shadow-lg"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-400/10 flex items-center justify-center mb-3 text-slate-300">
              <Medal size={28} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              2nd Place
            </span>
            <strong className="text-base sm:text-lg font-bold text-white mt-1 mb-1 truncate max-w-full">
              {top3[1].name}
            </strong>
            <span className="text-xl sm:text-2xl font-black text-slate-200 font-mono">
              {top3[1].score} pts
            </span>
          </motion.div>
        )}

        {/* 1st Place (Gold Champion) */}
        {top3[0] && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className="order-1 sm:order-2 flex flex-col items-center p-8 rounded-2xl bg-gradient-to-b from-amber-500/20 via-slate-900/90 to-slate-950 border-2 border-amber-500/50 text-center shadow-2xl shadow-amber-500/20 z-10"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-3 text-amber-400 shadow-lg shadow-amber-500/30">
              <Trophy size={32} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              👑 Champion
            </span>
            <strong className="text-lg sm:text-xl font-black text-white mt-1 mb-1 truncate max-w-full">
              {top3[0].name}
            </strong>
            <span className="text-3xl font-black text-amber-300 font-mono tracking-tight">
              {top3[0].score} pts
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 mt-2 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
              <Flame size={13} /> {top3[0].correctCount} Correct
            </span>
          </motion.div>
        )}

        {/* 3rd Place (Bronze) */}
        {top3[2] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="order-3 flex flex-col items-center p-6 rounded-2xl bg-gradient-to-b from-amber-900/20 to-slate-900/80 border border-amber-700/30 text-center shadow-lg"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-700/10 flex items-center justify-center mb-3 text-amber-600">
              <Award size={28} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-600">
              3rd Place
            </span>
            <strong className="text-base sm:text-lg font-bold text-white mt-1 mb-1 truncate max-w-full">
              {top3[2].name}
            </strong>
            <span className="text-xl sm:text-2xl font-black text-amber-500 font-mono">
              {top3[2].score} pts
            </span>
          </motion.div>
        )}
      </div>

      {/* Runners Up List */}
      {runnersUp.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-white/10">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2 px-1">
            Top Runners Up
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {runnersUp.map((entry, idx) => (
              <div
                key={entry.participantId}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-white/5 text-slate-400 flex items-center justify-center text-xs font-mono font-bold">
                    #{idx + 4}
                  </span>
                  <span className="text-sm font-semibold text-slate-200 truncate">
                    {entry.name}
                  </span>
                </div>
                <span className="text-sm font-mono font-bold text-slate-300">
                  {entry.score} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
