'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Loader2, Check, RefreshCw, PlusCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { generateQuestions, isGeminiConfigured } from '@/lib/gemini';
import { PollType } from '@/types';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsGenerated: (
    questions: Array<{
      title: string;
      type: PollType;
      options: Array<{ text: string; isCorrect: boolean }>;
      timeLimit?: number;
    }>
  ) => void;
}

const SAMPLE_TOPICS = [
  'Modern Web Dev & React 19',
  'Corporate Strategy & OKRs',
  'All-Hands Team Icebreaker',
  'Cybersecurity Best Practices',
  'Product Design Sprint',
  'Climate & Sustainability',
];

export default function AIGeneratorModal({
  isOpen,
  onClose,
  onQuestionsGenerated,
}: AIGeneratorModalProps) {
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(4);
  const [pollType, setPollType] = useState<PollType>('quiz');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedList, setGeneratedList] = useState<
    Array<{
      title: string;
      type: PollType;
      options: Array<{ text: string; isCorrect: boolean }>;
      timeLimit?: number;
      selected: boolean;
    }>
  >([]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please provide a topic or prompt.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const results = await generateQuestions({
        topic: topic.trim(),
        count: questionCount,
        type: pollType,
      });

      setGeneratedList(
        results.map(q => ({
          ...q,
          selected: true,
        }))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate questions';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    setGeneratedList(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleConfirmAndAdd = () => {
    const selectedQuestions = generatedList
      .filter(q => q.selected)
      .map(({ title, type, options, timeLimit }) => ({
        title,
        type,
        options,
        timeLimit,
      }));

    if (selectedQuestions.length === 0) {
      setError('Please select at least one question to add.');
      return;
    }

    onQuestionsGenerated(selectedQuestions);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  AI Poll & Quiz Generator
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    Gemini AI
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Instantly craft engaging questions, quizzes, or icebreakers
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!isGeminiConfigured && (
              <div className="flex items-start gap-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  Using intelligent offline generator fallback. Add <code className="font-mono bg-black/40 px-1 py-0.5 rounded text-white">NEXT_PUBLIC_GEMINI_API_KEY</code> in <code className="font-mono bg-black/40 px-1 py-0.5 rounded text-white">.env.local</code> for live generative AI models.
                </span>
              </div>
            )}

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Topic or Presentation Context
              </label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g., Key takeaways from our 2026 Q3 Product Architecture & Scalability review..."
                rows={3}
                className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all resize-none"
              />

              {/* Sample Topics */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SAMPLE_TOPICS.map(sample => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setTopic(sample)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5 transition-colors"
                  >
                    + {sample}
                  </button>
                ))}
              </div>
            </div>

            {/* Options Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-2">
                  Question Format
                </label>
                <select
                  value={pollType}
                  onChange={e => setPollType(e.target.value as PollType)}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                >
                  <option value="quiz">🎯 Gamified Quiz (Correct Answer + 30s)</option>
                  <option value="multiple_choice">📊 Multiple Choice Poll</option>
                  <option value="word_cloud">☁️ Dynamic Word Cloud Prompt</option>
                  <option value="rating">⭐️ 1-5 Star Rating Question</option>
                  <option value="open_text">💬 Open Text / Audience Thoughts</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-2">
                  Number of Questions
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 5, 8].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        questionCount === num
                          ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-500/30'
                          : 'bg-slate-950/50 text-slate-400 border-white/10 hover:bg-white/5'
                      }`}
                    >
                      {num} Qs
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isLoading || !topic.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Synthesizing questions with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Questions</span>
                </>
              )}
            </button>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            {/* Generated Preview List */}
            {generatedList.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Generated Questions ({generatedList.filter(q => q.selected).length}/{generatedList.length} selected)
                  </span>
                  <button
                    onClick={handleGenerate}
                    className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                  >
                    <RefreshCw size={12} /> Regenerate
                  </button>
                </div>

                <div className="space-y-2.5">
                  {generatedList.map((q, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleSelect(idx)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                        q.selected
                          ? 'bg-violet-950/20 border-violet-500/40 text-white'
                          : 'bg-white/2 border-white/5 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                            q.selected
                              ? 'bg-violet-600 border-violet-500 text-white'
                              : 'border-white/20 bg-black/20'
                          }`}
                        >
                          {q.selected && <Check size={14} />}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <p className="text-sm font-medium leading-snug">
                            {idx + 1}. {q.title}
                          </p>

                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                              {q.options.map((opt, oIdx) => (
                                <div
                                  key={oIdx}
                                  className={`text-xs px-2.5 py-1 rounded-md flex items-center justify-between ${
                                    opt.isCorrect
                                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium'
                                      : 'bg-white/5 text-slate-400 border border-white/5'
                                  }`}
                                >
                                  <span>{opt.text}</span>
                                  {opt.isCorrect && (
                                    <span className="text-[10px] font-bold text-emerald-400 ml-1">
                                      ✓ Correct
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {generatedList.length > 0 && (
            <div className="px-6 py-4 bg-slate-900/80 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Ready to add {generatedList.filter(q => q.selected).length} question(s)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndAdd}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                >
                  <PlusCircle size={15} />
                  <span>Add to Session</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
