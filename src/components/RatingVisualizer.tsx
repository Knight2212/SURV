'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PollResponse } from '@/types';
import { Star, Users } from 'lucide-react';

interface RatingVisualizerProps {
  responses: PollResponse[];
  maxRating?: number;
}

export default function RatingVisualizer({ responses, maxRating = 5 }: RatingVisualizerProps) {
  const stats = useMemo(() => {
    const total = responses.length;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    responses.forEach(r => {
      const val = Number(r.value);
      if (!isNaN(val) && val >= 1 && val <= maxRating) {
        distribution[val] = (distribution[val] || 0) + 1;
        sum += val;
      }
    });

    const average = total > 0 ? (sum / total).toFixed(1) : '0.0';

    return { total, distribution, average };
  }, [responses, maxRating]);

  return (
    <div data-ui="true" className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 sm:gap-8 p-6 sm:p-8 rounded-xl bg-[#181F1C] border border-[#283E34] items-center">
      {/* Big Average Score Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center justify-center p-6 rounded-lg bg-[#233B31] border border-[#283E34] text-center"
      >
        <span className="text-5xl sm:text-6xl font-bold text-amber-400 tracking-tight leading-none tabular-nums">
          {stats.average}
        </span>

        {/* Stars */}
        <div className="flex gap-1 my-3 text-amber-400">
          {[1, 2, 3, 4, 5].map(star => {
            const isFilled = Number(stats.average) >= star;
            const isHalf = Number(stats.average) >= star - 0.5 && !isFilled;

            return (
              <Star
                key={star}
                size={20}
                className={isFilled || isHalf ? 'fill-amber-400 text-amber-400' : 'text-[#8C9188]'}
              />
            );
          })}
        </div>

        <span className="text-xs text-[#8C9188] flex items-center gap-1.5 font-medium">
          <Users size={12} className="text-[#8C9188]" />
          <span>{stats.total} rating{stats.total === 1 ? '' : 's'}</span>
        </span>
      </motion.div>

      {/* Breakdown Bars */}
      <div className="flex flex-col gap-3">
        {[5, 4, 3, 2, 1].map((rating, idx) => {
          const count = stats.distribution[rating] || 0;
          const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

          return (
            <div key={rating} className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 w-10 font-bold text-[#E6E5DC]">
                <span>{rating}</span>
                <Star size={13} className="fill-amber-400 text-amber-400 shrink-0" />
              </div>

              {/* Progress Track */}
              <div className="flex-1 h-3 rounded-full bg-[#233B31] overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.4, delay: idx * 0.04 }}
                  className="h-full rounded-full bg-amber-400"
                />
              </div>

              <div className="w-16 text-right tabular-nums text-[#8C9188] font-medium shrink-0">
                <span>{percentage}%</span>
                <span className="text-[#8C9188] ml-1">({count})</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
