'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Poll, PollResponse } from '@/types';
import { Check, Send, Star, Clock, Lock, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
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
    if (!poll.isOpen) return;
    setSelectedOption(optId);
    onSubmitVote(optId);
    setSubmitted(true);
  };

  const handleWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordInput.trim() || !poll.isOpen) return;
    onSubmitVote(wordInput.trim());
    setSubmitted(true);
  };

  const handleRatingClick = (val: number) => {
    if (!poll.isOpen) return;
    setRatingInput(val);
    onSubmitVote(val);
    setSubmitted(true);
  };

  const handleOpenTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openTextInput.trim() || !poll.isOpen) return;
    onSubmitVote(openTextInput.trim());
    setSubmitted(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 sm:p-7 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col gap-5"
    >
      {/* Header with Type & Status */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
          {poll.type === 'multiple_choice'
            ? '📊 Multiple Choice'
            : poll.type === 'word_cloud'
            ? '☁️ Word Cloud'
            : poll.type === 'rating'
            ? '⭐ Rating'
            : poll.type === 'quiz'
            ? '⚡ Gamified Quiz'
            : '📝 Open Feedback'}
        </span>

        <div className="flex items-center gap-2">
          {poll.isOpen ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Voting</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30">
              <Lock size={12} />
              <span>Voting Closed</span>
            </span>
          )}
        </div>
      </div>

      {/* Question Title */}
      <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
        {poll.title}
      </h2>

      {/* Voting Closed notice if applicable */}
      {!poll.isOpen && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center gap-2">
          <Lock size={15} className="shrink-0" />
          <span>Voting has been concluded by the presenter.</span>
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
                  className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border text-left transition-all ${
                    poll.isOpen ? 'cursor-pointer hover:border-indigo-400/50' : 'cursor-default'
                  } ${
                    isCorrect
                      ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-md shadow-emerald-950/30'
                      : isWrong
                      ? 'bg-rose-950/30 border-rose-500 text-white'
                      : isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-950/30'
                      : 'bg-white/[0.03] border-white/10 text-slate-200 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white/10 text-slate-300'
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
                    <Check size={18} className="text-indigo-400 shrink-0" />
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
                className="flex-1 px-4 py-3 bg-slate-950/80 border border-white/15 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
              <button
                type="submit"
                disabled={!poll.isOpen || !wordInput.trim()}
                className="px-5 py-3 font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                <Send size={15} />
                <span>Submit</span>
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
                    className={`p-3 rounded-xl border transition-all ${
                      poll.isOpen ? 'cursor-pointer hover:scale-110' : 'cursor-default'
                    } ${
                      isActive
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        : 'bg-white/5 border-white/10 text-slate-600'
                    }`}
                  >
                    <Star
                      size={28}
                      className={isActive ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
                    />
                  </button>
                );
              })}
            </div>
            {ratingInput > 0 && (
              <span className="text-xs font-semibold text-amber-400">
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
              className="w-full px-4 py-3 bg-slate-950/80 border border-white/15 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!poll.isOpen || !openTextInput.trim()}
                className="px-5 py-2.5 font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <Send size={14} />
                <span>Submit Feedback</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Voting status / confirmation banner */}
      {submitted && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold">
          <Check size={16} />
          <span>Response recorded!</span>
        </div>
      )}

      {/* Live Results Reveal Section (If Presenter enabled showResults) */}
      {poll.showResults && (
        <div className="mt-3 pt-5 border-t border-white/10 flex flex-col gap-3.5">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Live Audience Results</span>
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
