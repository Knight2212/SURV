'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Loader2, Check, RefreshCw, PlusCircle, AlertCircle } from 'lucide-react';
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
      <div data-ui="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#1D3228] border border-[#2D4A3E] rounded-2xl overflow-hidden text-[#E6E5DC]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 bg-[#15261F]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#233B31] border border-[#2D4A3E] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#c6f19d]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#E6E5DC] flex items-center gap-2">
                  AI Question Generator
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#233B31] text-[#c6f19d] border border-[#2D4A3E]">
                    Gemini AI
                  </span>
                </h3>
                <p className="text-xs text-[#E6E5DC]/60">
                  Instantly craft engaging questions, quizzes, or icebreakers
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#E6E5DC]/60 hover:text-white rounded-lg hover:bg-[#233B31] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!isGeminiConfigured && (
              <div className="flex items-start gap-3 p-3.5 bg-amber-950/40 border border-amber-800/40 rounded-xl text-amber-300 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  Using intelligent offline generator fallback. Add <code className="bg-black/40 px-1 py-0.5 rounded text-white">NEXT_PUBLIC_GEMINI_API_KEY</code> in <code className="bg-black/40 px-1 py-0.5 rounded text-white">.env.local</code> for live generative AI models.
                </span>
              </div>
            )}

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#E6E5DC]/80 block">
                Topic or presentation context
              </label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g., Key takeaways from our 2026 Q3 Product Architecture & Scalability review..."
                rows={3}
                className="w-full bg-[#15261F] border border-[#2D4A3E] rounded-xl px-4 py-3 text-sm text-[#E6E5DC] placeholder-[#E6E5DC]/40 focus:outline-none focus:border-[#c6f19d] transition-colors resize-none"
              />

              {/* Sample Topics */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SAMPLE_TOPICS.map(sample => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setTopic(sample)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[#15261F] hover:bg-[#233B31] text-[#E6E5DC]/70 hover:text-[#E6E5DC] border border-[#2D4A3E] transition-colors"
                  >
                    + {sample}
                  </button>
                ))}
              </div>
            </div>

            {/* Options Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#E6E5DC]/80 block mb-2">
                  Question format
                </label>
                <select
                  value={pollType}
                  onChange={e => setPollType(e.target.value as PollType)}
                  className="w-full bg-[#15261F] border border-[#2D4A3E] rounded-xl px-3.5 py-2.5 text-sm text-[#E6E5DC] focus:outline-none focus:border-[#c6f19d] transition-colors"
                >
                  <option value="quiz">Gamified Quiz (Timed with correct answer)</option>
                  <option value="multiple_choice">Multiple Choice Poll</option>
                  <option value="word_cloud">Dynamic Word Cloud Prompt</option>
                  <option value="rating">Rating Scale (1-5 stars)</option>
                  <option value="open_text">Open Feedback / Audience Thoughts</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[#E6E5DC]/80 block mb-2">
                  Number of questions
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 5, 8].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-colors ${
                        questionCount === num
                          ? 'bg-[#2D4A3E] text-[#c6f19d] border-[#c6f19d]'
                          : 'bg-[#15261F] text-[#E6E5DC]/60 border-[#2D4A3E] hover:bg-[#233B31]'
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
              className="w-full py-3 px-4 bg-[#c6f19d] hover:bg-[#b5e886] disabled:opacity-50 text-[#13231d] font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Synthesizing questions with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate questions</span>
                </>
              )}
            </button>

            {error && (
              <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-800/40 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            {/* Generated Preview List */}
            {generatedList.length > 0 && (
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#E6E5DC]/80">
                    Generated questions ({generatedList.filter(q => q.selected).length}/{generatedList.length} selected)
                  </span>
                  <button
                    onClick={handleGenerate}
                    className="text-xs text-[#c6f19d] hover:text-[#b5e886] flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={12} /> Regenerate
                  </button>
                </div>

                <div className="space-y-2.5">
                  {generatedList.map((q, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleSelect(idx)}
                      className={`p-3.5 rounded-xl border transition-colors cursor-pointer select-none ${
                        q.selected
                          ? 'bg-[#244237] border-[#c6f19d]/40 text-white'
                          : 'bg-[#15261F] border-[#2D4A3E] text-[#E6E5DC]/60 hover:bg-[#1D3228]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                            q.selected
                              ? 'bg-[#c6f19d] border-[#c6f19d] text-[#13231d]'
                              : 'border-[#2D4A3E] bg-[#15261F]'
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
                                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-medium'
                                      : 'bg-[#15261F] text-[#E6E5DC]/60 border border-[#2D4A3E]'
                                  }`}
                                >
                                  <span>{opt.text}</span>
                                  {opt.isCorrect && (
                                    <span className="text-[10px] font-semibold text-emerald-400 ml-1">
                                      Correct
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
            <div className="px-6 py-4 bg-[#15261F] flex items-center justify-between">
              <span className="text-xs text-[#E6E5DC]/60">
                Ready to add {generatedList.filter(q => q.selected).length} question(s)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-[#E6E5DC]/70 hover:text-white rounded-xl hover:bg-[#233B31] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndAdd}
                  className="px-5 py-2 text-xs font-semibold text-[#13231d] bg-[#c6f19d] hover:bg-[#b5e886] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PlusCircle size={15} />
                  <span>Add to session</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
