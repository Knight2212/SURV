'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Poll, PollResponse } from '@/types';
import { Check, Send, Star, Lock, Sparkles, CheckCircle2, XCircle, BarChart3, Cloud, Zap, FileText, Clock } from 'lucide-react';
import BarChartVisualizer from './BarChartVisualizer';
import WordCloudVisualizer from './WordCloudVisualizer';
import RatingVisualizer from './RatingVisualizer';

interface ActivePollCardProps {
  poll: Poll;
  responses: PollResponse[];
  currentParticipantId: string;
  participantName?: string;
  onSubmitVote: (value: string | string[] | number) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export default function ActivePollCard({
  poll,
  responses,
  currentParticipantId,
  onSubmitVote,
}: ActivePollCardProps) {
  // Check if participant already voted
  const userResponse = responses.find(r => r.participantId === currentParticipantId);
  const hasVoted = Boolean(userResponse);

  const [selectedOption, setSelectedOption] = useState<string | null>(
    typeof userResponse?.value === 'string' ? userResponse.value : null
  );
  const [wordInput, setWordInput] = useState('');
  const [ratingInput, setRatingInput] = useState<number>(
    typeof userResponse?.value === 'number' ? userResponse.value : 0
  );
  const [openTextInput, setOpenTextInput] = useState(
    typeof userResponse?.value === 'string' ? userResponse.value : ''
  );
  const [submitted, setSubmitted] = useState(hasVoted);

  // Countdown timer support for timed questions
  const [timeLeft, setTimeLeft] = useState<number | null>(
    poll.timeLimit && poll.timeLimit > 0 ? poll.timeLimit : null
  );

  useEffect(() => {
    if (!poll.timeLimit || poll.timeLimit <= 0) {
      setTimeLeft(null);
      return;
    }
    setTimeLeft(poll.timeLimit);
    if (!poll.isOpen) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [poll.id, poll.timeLimit, poll.isOpen]);

  const isExpired = Boolean(poll.timeLimit && poll.timeLimit > 0 && timeLeft === 0);

  // Sync state if user response comes in
  useEffect(() => {
    if (userResponse) {
      setSubmitted(true);
      if (typeof userResponse.value === 'string') {
        setSelectedOption(userResponse.value);
        setWordInput(userResponse.value);
        setOpenTextInput(userResponse.value);
      } else if (typeof userResponse.value === 'number') {
        setRatingInput(userResponse.value);
      }
    }
  }, [userResponse]);

  const handleOptionClick = (optId: string) => {
    if (!poll.isOpen || isExpired) return;
    setSelectedOption(optId);
    onSubmitVote(optId);
    setSubmitted(true);
  };

  const handleWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordInput.trim() || !poll.isOpen || isExpired) return;
    onSubmitVote(wordInput.trim());
    setSubmitted(true);
  };

  const handleRatingClick = (val: number) => {
    if (!poll.isOpen || isExpired) return;
    setRatingInput(val);
    onSubmitVote(val);
    setSubmitted(true);
  };

  const handleOpenTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openTextInput.trim() || !poll.isOpen || isExpired) return;
    onSubmitVote(openTextInput.trim());
    setSubmitted(true);
  };

  return (
    <motion.div
      data-ui="true"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 sm:p-7 rounded-2xl bg-[#1D3228] border border-[#2D4A3E] flex flex-col gap-5 text-[#E6E5DC]"
    >
      {/* Header with Type & Status */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#233B31] text-[#c6f19d]">
          {poll.type === 'multiple_choice' ? (
            <>
              <BarChart3 size={13} className="text-[#c6f19d]" />
              <span>Multiple Choice</span>
            </>
          ) : poll.type === 'word_cloud' ? (
            <>
              <Cloud size={13} className="text-[#c6f19d]" />
              <span>Word Cloud</span>
            </>
          ) : poll.type === 'rating' ? (
            <>
              <Star size={13} className="text-[#c6f19d]" />
              <span>Rating Scale</span>
            </>
          ) : poll.type === 'quiz' ? (
            <>
              <Zap size={13} className="text-[#c6f19d]" />
              <span>Live Quiz</span>
            </>
          ) : (
            <>
              <FileText size={13} className="text-[#c6f19d]" />
              <span>Open Feedback</span>
            </>
          )}
        </span>

        <div className="flex items-center gap-2">
          {poll.timeLimit && poll.timeLimit > 0 && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tabular-nums border ${
                timeLeft === 0
                  ? 'text-rose-300 bg-rose-950/60 border-rose-800/40'
                  : timeLeft !== null && timeLeft <= 5
                  ? 'text-amber-300 bg-amber-950/60 border-amber-800/40 font-bold'
                  : 'text-[#c6f19d] bg-[#233B31] border-[#2D4A3E]'
              }`}
            >
              <Clock size={12} />
              <span>{timeLeft === 0 ? "Time's up" : `${timeLeft}s left`}</span>
            </span>
          )}

          {poll.isOpen && !isExpired ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Live voting</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-rose-300 bg-rose-950/60 border border-rose-800/40">
              <Lock size={12} />
              <span>{isExpired ? "Time's up" : "Voting closed"}</span>
            </span>
          )}
        </div>
      </div>

      {/* Live Countdown Progress Bar */}
      {poll.timeLimit && poll.timeLimit > 0 && timeLeft !== null && poll.isOpen && !isExpired && (
        <div className="w-full h-1.5 bg-[#15261F] rounded-full overflow-hidden -mt-2 border border-[#2D4A3E]/40">
          <div
            className={`h-full transition-[width] duration-1000 ease-linear rounded-full ${
              timeLeft <= 5 ? 'bg-amber-400' : 'bg-[#c6f19d]'
            }`}
            style={{ width: `${(timeLeft / poll.timeLimit) * 100}%` }}
          />
        </div>
      )}

      {/* Question Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-[#E6E5DC] leading-snug">
        {poll.title}
      </h2>

      {/* Voting Closed notice if applicable */}
      {(!poll.isOpen || isExpired) && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2">
          <Lock size={15} className="shrink-0" />
          <span>{isExpired ? "Time has expired for this question." : "Voting has been concluded by the presenter."}</span>
        </div>
      )}

      {/* Voting Controls or Answer Confirmation */}
      <div className="mt-1">
        {/* MULTIPLE CHOICE & QUIZ */}
        {(poll.type === 'multiple_choice' || poll.type === 'quiz') && (
          <div className="flex flex-col gap-2.5">
            {poll.options?.map((opt, idx) => {
              const isSelected = selectedOption === opt.id;
              const isCorrect = poll.showCorrect && opt.isCorrect;
              const isWrong = poll.showCorrect && isSelected && !opt.isCorrect;

              return (
                <button
                  key={opt.id}
                  disabled={!poll.isOpen}
                  onClick={() => handleOptionClick(opt.id)}
                  className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border text-left transition-colors ${
                    poll.isOpen ? 'cursor-pointer hover:border-[#c6f19d]/40' : 'cursor-default'
                  } ${
                    isCorrect
                      ? 'bg-emerald-950/60 border-emerald-500 text-white'
                      : isWrong
                      ? 'bg-rose-950/60 border-rose-500 text-white'
                      : isSelected
                      ? 'bg-[#28483B] border-[#c6f19d] text-white'
                      : 'bg-[#15261F] border-[#2D4A3E] text-[#E6E5DC]/90 hover:bg-[#1D3228]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 tabular-nums ${
                        isSelected
                          ? 'bg-[#c6f19d] text-[#13231d]'
                          : 'bg-[#233B31] text-[#E6E5DC]/70'
                      }`}
                    >
                      {OPTION_LETTERS[idx] || idx + 1}
                    </span>
                    <span className="text-sm sm:text-base font-semibold">{opt.text}</span>
                  </div>

                  {isCorrect && (
                    <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                  )}
                  {isWrong && (
                    <XCircle size={20} className="text-rose-400 shrink-0" />
                  )}
                  {isSelected && !poll.showCorrect && (
                    <Check size={18} className="text-[#c6f19d] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* WORD CLOUD */}
        {poll.type === 'word_cloud' && (
          <form onSubmit={handleWordSubmit} className="flex flex-col gap-3">
            <div className="flex gap-2.5">
              <input
                type="text"
                disabled={!poll.isOpen}
                value={wordInput}
                onChange={e => setWordInput(e.target.value)}
                placeholder="Enter a single word or short phrase..."
                maxLength={32}
                className="flex-1 px-4 py-3 bg-[#15261F] border border-[#2D4A3E] rounded-xl text-[#E6E5DC] placeholder-[#E6E5DC]/40 text-sm focus:outline-none focus:border-[#c6f19d] transition-colors"
              />
              <button
                type="submit"
                disabled={!poll.isOpen || !wordInput.trim()}
                className="px-5 py-3 font-semibold text-xs text-[#13231d] bg-[#c6f19d] hover:bg-[#b5e886] disabled:opacity-50 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                <Send size={15} />
                <span>Send word</span>
              </button>
            </div>
            {submitted && (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                <Check size={14} /> Word submitted to cloud! You can submit another if you wish.
              </span>
            )}
          </form>
        )}

        {/* RATING */}
        {poll.type === 'rating' && (
          <div className="flex flex-col items-center gap-4 py-3">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(val => {
                const isActive = ratingInput >= val;
                return (
                  <button
                    key={val}
                    type="button"
                    disabled={!poll.isOpen}
                    onClick={() => handleRatingClick(val)}
                    className={`p-3 rounded-xl border transition-colors ${
                      poll.isOpen ? 'cursor-pointer hover:border-amber-400/50' : 'cursor-default'
                    } ${
                      isActive
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-400'
                        : 'bg-[#15261F] border-[#2D4A3E] text-[#E6E5DC]/40'
                    }`}
                  >
                    <Star
                      size={28}
                      className={isActive ? 'fill-amber-400 text-amber-400' : 'text-[#E6E5DC]/30'}
                    />
                  </button>
                );
              })}
            </div>
            {ratingInput > 0 && (
              <span className="text-xs font-semibold text-amber-400 tabular-nums">
                You rated: {ratingInput} out of 5 stars
              </span>
            )}
          </div>
        )}

        {/* OPEN TEXT */}
        {poll.type === 'open_text' && (
          <form onSubmit={handleOpenTextSubmit} className="flex flex-col gap-3">
            <textarea
              disabled={!poll.isOpen}
              value={openTextInput}
              onChange={e => setOpenTextInput(e.target.value)}
              placeholder="Share your detailed feedback or comments here..."
              rows={4}
              className="w-full px-4 py-3 bg-[#15261F] border border-[#2D4A3E] rounded-xl text-[#E6E5DC] placeholder-[#E6E5DC]/40 text-sm focus:outline-none focus:border-[#c6f19d] transition-colors resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!poll.isOpen || !openTextInput.trim()}
                className="px-5 py-2.5 font-semibold text-xs text-[#13231d] bg-[#c6f19d] hover:bg-[#b5e886] disabled:opacity-50 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Send size={14} />
                <span>Share response</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Voting status / confirmation banner */}
      {submitted && (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-emerald-300 text-xs font-semibold">
          <Check size={16} />
          <span>Response recorded</span>
        </div>
      )}

      {/* Live Results Reveal Section (If Presenter enabled showResults) */}
      {poll.showResults && (
        <div className="mt-3 pt-5 bg-[#15261F]/60 p-4 rounded-xl flex flex-col gap-3.5">
          <div className="flex items-center gap-2 text-[#c6f19d] text-xs font-semibold">
            <Sparkles size={14} />
            <span>Live audience results</span>
          </div>

          {poll.type === 'multiple_choice' || poll.type === 'quiz' ? (
            <BarChartVisualizer poll={poll} responses={responses} compact={true} />
          ) : poll.type === 'word_cloud' ? (
            <WordCloudVisualizer responses={responses} />
          ) : poll.type === 'rating' ? (
            <RatingVisualizer responses={responses} />
          ) : null}
        </div>
      )}
    </motion.div>
  );
}
