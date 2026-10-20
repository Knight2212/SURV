'use client';

import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Poll, PollResponse, LeaderboardEntry } from '@/types';
import { Trophy, Medal, Award, Flame } from 'lucide-react';
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
          colors: ['#c6f19d', '#10B981', '#EA580C', '#2D4A3E', '#F59E0B'],
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
      <div data-ui="true" className="flex flex-col items-center justify-center p-12 sm:p-16 text-center rounded-xl bg-[#181F1C] border border-[#283E34] text-[#8C9188]">
        <div className="w-14 h-14 rounded-xl bg-[#233B31] text-[#c6f19d] flex items-center justify-center mb-4">
          <Trophy size={28} />
        </div>
        <h4 className="text-lg font-bold text-white mb-1.5">No Quiz Submissions Yet</h4>
        <p className="text-sm text-[#8C9188] max-w-sm">
          Attendee scores and rankings will appear here as soon as answers are submitted.
        </p>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const runnersUp = leaderboard.slice(3, 10);

  return (
    <div data-ui="true" className="flex flex-col gap-8 w-full">
      {/* Podium for Top 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-end pt-4">
        {/* 2nd Place (Silver) */}
        {top3[1] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="order-2 sm:order-1 flex flex-col items-center p-6 rounded-xl bg-[#181F1C] border border-[#283E34] text-center"
          >
            <div className="w-12 h-12 rounded-lg bg-[#233B31] flex items-center justify-center mb-3 text-slate-300">
              <Medal size={28} />
            </div>
            <span className="text-xs font-semibold text-[#8C9188]">
              2nd Place
            </span>
            <strong className="text-base sm:text-lg font-bold text-white mt-1 mb-1 truncate max-w-full">
              {top3[1].name}
            </strong>
            <span className="text-xl sm:text-2xl font-bold text-slate-200 tabular-nums">
              {top3[1].score} pts
            </span>
          </motion.div>
        )}

        {/* 1st Place (Gold Champion) */}
        {top3[0] && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className="order-1 sm:order-2 flex flex-col items-center p-8 rounded-xl bg-[#233B31] border border-[#c6f19d] text-center z-10"
          >
            <div className="w-14 h-14 rounded-xl bg-[#181F1C] flex items-center justify-center mb-3 text-[#c6f19d]">
              <Trophy size={32} />
            </div>
            <span className="text-xs font-bold text-[#c6f19d]">
              Leader
            </span>
            <strong className="text-lg sm:text-xl font-bold text-white mt-1 mb-1 truncate max-w-full">
              {top3[0].name}
            </strong>
            <span className="text-3xl font-bold text-amber-300 tabular-nums tracking-tight">
              {top3[0].score} pts
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#c6f19d] mt-2 bg-[#181F1C] px-2.5 py-0.5 rounded">
              <Flame size={13} /> {top3[0].correctCount} Correct
            </span>
          </motion.div>
        )}

        {/* 3rd Place (Bronze) */}
        {top3[2] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="order-3 flex flex-col items-center p-6 rounded-xl bg-[#181F1C] border border-[#283E34] text-center"
          >
            <div className="w-12 h-12 rounded-lg bg-[#233B31] flex items-center justify-center mb-3 text-amber-600">
              <Award size={28} />
            </div>
            <span className="text-xs font-semibold text-[#8C9188]">
              3rd Place
            </span>
            <strong className="text-base sm:text-lg font-bold text-white mt-1 mb-1 truncate max-w-full">
              {top3[2].name}
            </strong>
            <span className="text-xl sm:text-2xl font-bold text-amber-500 tabular-nums">
              {top3[2].score} pts
            </span>
          </motion.div>
        )}
      </div>

      {/* Runners Up List */}
      {runnersUp.length > 0 && (
        <div className="space-y-2 pt-4">
          <span className="text-xs font-semibold text-[#8C9188] block mb-2 px-1">
            Top Runners Up
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {runnersUp.map((entry, idx) => (
              <div
                key={entry.participantId}
                className="flex items-center justify-between p-3 rounded-lg bg-[#181F1C] border border-[#283E34]"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-[#233B31] text-[#8C9188] flex items-center justify-center text-xs tabular-nums font-bold">
                    #{idx + 4}
                  </span>
                  <span className="text-sm font-medium text-[#E6E5DC] truncate">
                    {entry.name}
                  </span>
                </div>
                <span className="text-sm tabular-nums font-bold text-white">
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
