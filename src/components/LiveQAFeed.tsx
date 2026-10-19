'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QAQuestion } from '@/types';
import { ThumbsUp, Pin, CheckCircle, Trash2, Send, Sparkles, Search, MessageSquare } from 'lucide-react';

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
    <div className="flex flex-col gap-5 w-full">
      {/* Ask Question Input Box */}
      {onSubmitQuestion && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md flex flex-col gap-3.5 shadow-xl"
        >
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={15} />
            <span>Ask the Presenter</span>
          </div>

          <textarea
            value={newQuestionText}
            onChange={e => setNewQuestionText(e.target.value)}
            placeholder="Type your question or discussion point..."
            rows={2}
            className="w-full bg-slate-950/80 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
          />

          <div className="flex items-center justify-between pt-1">
            {allowAnonymous ? (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={e => setIsAnonymous(e.target.checked)}
                  className="rounded bg-slate-950 border-white/20 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span>Post anonymously</span>
              </label>
            ) : (
              <div />
            )}

            <button
              type="submit"
              disabled={!newQuestionText.trim() || submitting}
              className="py-2.5 px-5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send size={14} />
              <span>Send Question</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Filter Pills */}
        <div className="inline-flex bg-white/5 rounded-full p-1 border border-white/10">
          {(['top', 'recent', 'answered'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'top' ? '🔥 Top Voted' : tab === 'recent' ? '⏱ Most Recent' : '✓ Answered'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex items-center max-w-xs w-full sm:w-56">
          <Search size={14} className="text-slate-500 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="flex flex-col gap-3">
        {filteredQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-slate-900/30 border border-dashed border-white/10 text-slate-400">
            <MessageSquare size={28} className="text-slate-500 mb-2" />
            <p className="text-sm font-medium text-slate-300">No questions found</p>
            <span className="text-xs text-slate-500 mt-1">
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
                  className={`flex items-start gap-4 p-4 sm:p-4.5 rounded-2xl border transition-all ${
                    q.isPinned
                      ? 'bg-gradient-to-r from-indigo-950/30 to-slate-900/70 border-indigo-500/50 shadow-lg shadow-indigo-950/20'
                      : 'bg-slate-900/50 border-white/10 hover:border-white/15'
                  }`}
                >
                  {/* Upvote Button */}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => onUpvote(q.id)}
                    className={`flex flex-col items-center justify-center min-w-11 px-2 py-2 rounded-xl border transition-all cursor-pointer ${
                      hasUpvoted
                        ? 'bg-indigo-600/25 border-indigo-500 text-indigo-400 shadow-sm shadow-indigo-600/30'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                    title={hasUpvoted ? 'Remove upvote' : 'Upvote this question'}
                  >
                    <ThumbsUp
                      size={15}
                      className={hasUpvoted ? 'fill-current text-indigo-400' : 'text-slate-400'}
                    />
                    <span className="text-xs font-extrabold font-mono mt-1">
                      {q.upvotes}
                    </span>
                  </motion.button>

                  {/* Content */}
                  <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-200">
                        {q.authorName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        • {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {q.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          <Pin size={10} /> PINNED
                        </span>
                      )}

                      {q.isAnswered && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle size={10} /> ANSWERED
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-100 leading-relaxed break-words">
                      {q.text}
                    </p>

                    {/* Host Moderation Actions */}
                    {isHost && onModerate && (
                      <div className="flex items-center gap-3 mt-1.5 pt-2 border-t border-white/5 text-xs text-slate-400">
                        <button
                          onClick={() => onModerate(q.id, { isPinned: !q.isPinned })}
                          className={`flex items-center gap-1 hover:text-white transition-colors cursor-pointer ${
                            q.isPinned ? 'text-indigo-400 font-semibold' : ''
                          }`}
                        >
                          <Pin size={12} /> {q.isPinned ? 'Unpin' : 'Pin to Screen'}
                        </button>

                        <button
                          onClick={() => onModerate(q.id, { isAnswered: !q.isAnswered })}
                          className={`flex items-center gap-1 hover:text-white transition-colors cursor-pointer ${
                            q.isAnswered ? 'text-emerald-400 font-semibold' : ''
                          }`}
                        >
                          <CheckCircle size={12} /> {q.isAnswered ? 'Mark Unanswered' : 'Mark Answered'}
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
