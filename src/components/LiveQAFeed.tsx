'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QAQuestion } from '@/types';
import { ThumbsUp, Pin, CheckCircle2, Trash2, Send, Sparkles, Search, MessageSquare, Flame, Clock3 } from 'lucide-react';

interface LiveQAFeedProps {
  questions: QAQuestion[];
  currentParticipantId: string;
  isHost?: boolean;
  allowAnonymous?: boolean;
  onUpvote: (questionId: string) => void;
  onSubmitQuestion?: (text: string, isAnonymous: boolean) => void;
  onModerate?: (questionId: string, updates: Partial<QAQuestion>) => void;
  onDelete?: (questionId: string) => void;
}

export default function LiveQAFeed({
  questions,
  currentParticipantId,
  isHost = false,
  allowAnonymous = true,
  onUpvote,
  onSubmitQuestion,
  onModerate,
  onDelete,
}: LiveQAFeedProps) {
  const [filter, setFilter] = useState<'top' | 'recent' | 'answered'>('top');
  const [searchQuery, setSearchQuery] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim() || submitting || !onSubmitQuestion) return;

    setSubmitting(true);
    onSubmitQuestion(newQuestionText.trim(), isAnonymous);
    setNewQuestionText('');
    setSubmitting(false);
  };

  const filteredQuestions = useMemo(() => {
    let list = [...questions];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item =>
        item.text.toLowerCase().includes(q) || item.authorName.toLowerCase().includes(q)
      );
    }

    if (filter === 'top') {
      return list.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.upvotes - a.upvotes;
      });
    } else if (filter === 'recent') {
      return list.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      // answered
      return list.filter(item => item.isAnswered);
    }
  }, [questions, filter, searchQuery]);

  return (
    <div data-ui="true" className="flex flex-col gap-5 w-full text-[#E6E5DC]">
      {/* Ask Question Input Box */}
      {onSubmitQuestion && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-2xl bg-[#1D3228] border border-[#2D4A3E] flex flex-col gap-3.5"
        >
          <div className="flex items-center gap-2 text-[#c6f19d] text-xs font-semibold">
            <Sparkles size={15} />
            <span>Ask the presenter</span>
          </div>

          <textarea
            value={newQuestionText}
            onChange={e => setNewQuestionText(e.target.value)}
            placeholder="Type your question or discussion point..."
            rows={2}
            className="w-full bg-[#15261F] border border-[#2D4A3E] rounded-xl px-4 py-3 text-sm text-[#E6E5DC] placeholder-[#E6E5DC]/40 focus:outline-none focus:border-[#c6f19d] transition-colors resize-none"
          />

          <div className="flex items-center justify-between pt-1">
            {allowAnonymous ? (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#E6E5DC]/70 hover:text-[#E6E5DC] select-none">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={e => setIsAnonymous(e.target.checked)}
                  className="rounded bg-[#15261F] border-[#2D4A3E] text-[#2D4A3E] focus:ring-[#c6f19d] w-4 h-4 cursor-pointer"
                />
                <span>Post anonymously</span>
              </label>
            ) : (
              <div />
            )}

            <button
              type="submit"
              disabled={!newQuestionText.trim() || submitting}
              className="py-2.5 px-5 text-xs font-semibold text-[#13231d] bg-[#c6f19d] hover:bg-[#b5e886] disabled:opacity-50 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Send size={14} />
              <span>Send question</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Filter Pills */}
        <div className="inline-flex bg-[#1D3228] rounded-full p-1 border border-[#2D4A3E]">
          {(['top', 'recent', 'answered'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                filter === tab
                  ? 'bg-[#c6f19d] text-[#13231d]'
                  : 'text-[#E6E5DC]/60 hover:text-[#E6E5DC]'
              }`}
            >
              {tab === 'top' ? (
                <>
                  <Flame size={13} />
                  <span>Top voted</span>
                </>
              ) : tab === 'recent' ? (
                <>
                  <Clock3 size={13} />
                  <span>Most recent</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} />
                  <span>Answered</span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex items-center max-w-xs w-full sm:w-56">
          <Search size={14} className="text-[#E6E5DC]/40 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-full bg-[#1D3228] border border-[#2D4A3E] text-xs text-[#E6E5DC] placeholder-[#E6E5DC]/40 focus:outline-none focus:border-[#c6f19d] transition-colors"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="flex flex-col gap-3">
        {filteredQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#1D3228]/40 border border-dashed border-[#2D4A3E] text-[#E6E5DC]/60">
            <MessageSquare size={28} className="text-[#E6E5DC]/40 mb-2" />
            <p className="text-sm font-medium text-[#E6E5DC]">No questions found</p>
            <span className="text-xs text-[#E6E5DC]/50 mt-1">
              Be the first to submit a question or clear search filters.
            </span>
          </div>
        ) : (
          <AnimatePresence>
            {filteredQuestions.map(q => {
              const hasUpvoted = q.upvotedBy.includes(currentParticipantId);

              return (
                <motion.div
                  key={q.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className={`flex items-start gap-4 p-4 sm:p-4.5 rounded-2xl border transition-colors ${
                    q.isPinned
                      ? 'bg-[#244237] border-[#c6f19d]/40'
                      : 'bg-[#1D3228] border-[#2D4A3E] hover:border-[#3D6354]'
                  }`}
                >
                  {/* Upvote Button */}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => onUpvote(q.id)}
                    className={`flex flex-col items-center justify-center min-w-11 px-2 py-2 rounded-xl border transition-colors cursor-pointer ${
                      hasUpvoted
                        ? 'bg-[#2D4A3E] border-[#c6f19d] text-[#c6f19d]'
                        : 'bg-[#15261F] hover:bg-[#233B31] border-[#2D4A3E] text-[#E6E5DC]/60 hover:text-[#E6E5DC]'
                    }`}
                    title={hasUpvoted ? 'Remove upvote' : 'Upvote this question'}
                  >
                    <ThumbsUp
                      size={15}
                      className={hasUpvoted ? 'fill-current text-[#c6f19d]' : 'text-[#E6E5DC]/50'}
                    />
                    <span className="text-xs font-bold tabular-nums mt-1">
                      {q.upvotes}
                    </span>
                  </motion.button>

                  {/* Content */}
                  <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#E6E5DC]">
                        {q.authorName}
                      </span>
                      <span className="text-[11px] text-[#E6E5DC]/50 tabular-nums">
                        • {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {q.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#233B31] text-[#c6f19d] border border-[#2D4A3E]">
                          <Pin size={10} /> Pinned
                        </span>
                      )}

                      {q.isAnswered && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                          <CheckCircle2 size={10} /> Answered
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-[#E6E5DC]/90 leading-relaxed break-words">
                      {q.text}
                    </p>

                    {/* Host Moderation Actions */}
                    {isHost && onModerate && (
                      <div className="flex items-center gap-3 mt-1.5 pt-2 text-xs text-[#E6E5DC]/60 bg-[#15261F]/60 px-3 py-1.5 rounded-lg">
                        <button
                          onClick={() => onModerate(q.id, { isPinned: !q.isPinned })}
                          className={`flex items-center gap-1 hover:text-white transition-colors cursor-pointer ${
                            q.isPinned ? 'text-[#c6f19d] font-semibold' : ''
                          }`}
                        >
                          <Pin size={12} /> {q.isPinned ? 'Unpin' : 'Pin to screen'}
                        </button>

                        <button
                          onClick={() => onModerate(q.id, { isAnswered: !q.isAnswered })}
                          className={`flex items-center gap-1 hover:text-white transition-colors cursor-pointer ${
                            q.isAnswered ? 'text-emerald-300 font-semibold' : ''
                          }`}
                        >
                          <CheckCircle2 size={12} /> {q.isAnswered ? 'Mark unanswered' : 'Mark answered'}
                        </button>

                        {onDelete && (
                          <button
                            onClick={() => onDelete(q.id)}
                            className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors ml-auto cursor-pointer"
                          >
                            <Trash2 size={12} /> Dismiss
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
