'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Loader2, Check, RefreshCw, PlusCircle, AlertCircle, Clock } from 'lucide-react';
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

const TIMER_PRESETS = [
  { label: 'No timer', value: 0 },
  { label: '5s', value: 5 },
  { label: '10s', value: 10 },
  { label: '15s', value: 15 },
  { label: '20s', value: 20 },
  { label: '30s', value: 30 },
  { label: '45s', value: 45 },
  { label: '60s', value: 60 },
];

export default function AIGeneratorModal({
  isOpen,
  onClose,
  onQuestionsGenerated,
}: AIGeneratorModalProps) {
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [customCountInput, setCustomCountInput] = useState<string>('5');
  const [pollType, setPollType] = useState<PollType>('quiz');
  
  // Timer settings
  const [selectedTimer, setSelectedTimer] = useState<number>(30);
  const [customTimerInput, setCustomTimerInput] = useState<string>('');
  const [isCustomTimer, setIsCustomTimer] = useState(false);

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

  const handleCountPresetClick = (num: number) => {
    setQuestionCount(num);
    setCustomCountInput(String(num));
  };

  const handleCustomCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setCustomCountInput(valStr);
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      setQuestionCount(Math.min(parsed, 50));
    }
  };

  const handleTimerPresetClick = (val: number) => {
    setSelectedTimer(val);
    setIsCustomTimer(false);
    setCustomTimerInput('');
  };

  const handleCustomTimerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setCustomTimerInput(valStr);
    setIsCustomTimer(true);
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      setSelectedTimer(parsed);
    }
  };

  const handleQuestionTimerChange = (index: number, newTimeLimit: number) => {
    setGeneratedList(prev =>
      prev.map((item, idx) =>
        idx === index
          ? { ...item, timeLimit: newTimeLimit > 0 ? newTimeLimit : undefined }
          : item
      )
    );
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please provide a topic or prompt.');
      return;
    }
    setError(null);
    setIsLoading(true);

    const effectiveTime = isCustomTimer
      ? Math.max(parseInt(customTimerInput, 10) || 5, 5)
      : selectedTimer;

    try {
      const results = await generateQuestions({
        topic: topic.trim(),
        count: Math.max(1, questionCount),
        type: pollType,
        timeLimit: effectiveTime > 0 ? effectiveTime : null,
      });

      setGeneratedList(
        results.map(q => ({
          ...q,
          timeLimit: q.timeLimit ?? (effectiveTime > 0 ? effectiveTime : undefined),
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
                  Synthesize custom timed questions, quizzes, or icebreakers
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#E6E5DC]/60 hover:text-white rounded-lg hover:bg-[#233B31] transition-colors cursor-pointer"
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
                    className="text-xs px-2.5 py-1 rounded-lg bg-[#15261F] hover:bg-[#233B31] text-[#E6E5DC]/70 hover:text-[#E6E5DC] border border-[#2D4A3E] transition-colors cursor-pointer"
                  >
                    + {sample}
                  </button>
                ))}
              </div>
            </div>

            {/* Format & Number of Questions Row */}
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

              {/* Number of Questions (Presets + Custom Type-In) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[#E6E5DC]/80 block">
                    Number of questions
                  </label>
                  <span className="text-[11px] text-[#c6f19d] font-semibold tabular-nums">
                    {questionCount} question{questionCount !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[3, 5, 8, 10, 15].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleCountPresetClick(num)}
                      className={`px-2.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        questionCount === num && customCountInput === String(num)
                          ? 'bg-[#2D4A3E] text-[#c6f19d] border-[#c6f19d]'
                          : 'bg-[#15261F] text-[#E6E5DC]/70 border-[#2D4A3E] hover:bg-[#233B31]'
                      }`}
                    >
                      {num} Qs
                    </button>
                  ))}

                  {/* Direct input for any custom question count */}
                  <div className="flex items-center gap-1 bg-[#15261F] border border-[#2D4A3E] rounded-lg px-2 py-1.5 min-w-[100px] flex-1">
                    <span className="text-[11px] text-[#E6E5DC]/50">Qty:</span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={customCountInput}
                      onChange={handleCustomCountChange}
                      placeholder="e.g. 12"
                      className="w-full bg-transparent text-xs font-bold text-white text-right focus:outline-none tabular-nums"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Time Limit Per Question Section (Presets from 5s + Custom Duration) */}
            <div className="space-y-2 p-4 rounded-xl bg-[#15261F] border border-[#2D4A3E]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#E6E5DC] flex items-center gap-1.5">
                  <Clock size={13} className="text-[#c6f19d]" />
                  <span>Time limit per question</span>
                </label>
                <span className="text-xs text-[#c6f19d] font-semibold tabular-nums">
                  {isCustomTimer
                    ? `${customTimerInput || 5} seconds (Custom)`
                    : selectedTimer > 0
                    ? `${selectedTimer} seconds`
                    : 'No time limit'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {TIMER_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleTimerPresetClick(preset.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      !isCustomTimer && selectedTimer === preset.value
                        ? 'bg-[#2D4A3E] text-[#c6f19d] border-[#c6f19d]'
                        : 'bg-[#1D3228] text-[#E6E5DC]/70 border-[#2D4A3E] hover:bg-[#233B31]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}

                {/* Custom duration input */}
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors min-w-[110px] ${
                  isCustomTimer ? 'bg-[#2D4A3E] border-[#c6f19d]' : 'bg-[#1D3228] border-[#2D4A3E]'
                }`}>
                  <span className="text-[11px] text-[#E6E5DC]/60">Custom:</span>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={customTimerInput}
                    onChange={handleCustomTimerChange}
                    placeholder="Sec..."
                    className="w-12 bg-transparent text-xs font-bold text-white text-right focus:outline-none tabular-nums"
                  />
                  <span className="text-[11px] text-[#E6E5DC]/60">s</span>
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
                  <span>Synthesizing {questionCount} questions with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate {questionCount} Questions</span>
                </>
              )}
            </button>

            {error && (
              <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-800/40 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            {/* Generated Preview List with Per-Question Timer Configuration */}
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
                      className={`p-3.5 rounded-xl border transition-colors ${
                        q.selected
                          ? 'bg-[#244237] border-[#c6f19d]/40 text-white'
                          : 'bg-[#15261F] border-[#2D4A3E] text-[#E6E5DC]/60 hover:bg-[#1D3228]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          onClick={() => toggleSelect(idx)}
                          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 cursor-pointer ${
                            q.selected
                              ? 'bg-[#c6f19d] border-[#c6f19d] text-[#13231d]'
                              : 'border-[#2D4A3E] bg-[#15261F]'
                          }`}
                        >
                          {q.selected && <Check size={14} />}
                        </div>

                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p
                              onClick={() => toggleSelect(idx)}
                              className="text-sm font-medium leading-snug cursor-pointer flex-1"
                            >
                              {idx + 1}. {q.title}
                            </p>

                            {/* Per-Question Duration Adjuster */}
                            <div className="flex items-center gap-1.5 shrink-0 bg-[#15261F] border border-[#2D4A3E] px-2 py-1 rounded-lg">
                              <Clock size={12} className="text-[#c6f19d]" />
                              <select
                                value={q.timeLimit || 0}
                                onChange={e => handleQuestionTimerChange(idx, parseInt(e.target.value, 10))}
                                className="bg-transparent text-[11px] font-semibold text-[#c6f19d] focus:outline-none cursor-pointer"
                              >
                                <option value={0} className="bg-[#1D3228] text-white">Untimed</option>
                                <option value={5} className="bg-[#1D3228] text-white">5s</option>
                                <option value={10} className="bg-[#1D3228] text-white">10s</option>
                                <option value={15} className="bg-[#1D3228] text-white">15s</option>
                                <option value={20} className="bg-[#1D3228] text-white">20s</option>
                                <option value={25} className="bg-[#1D3228] text-white">25s</option>
                                <option value={30} className="bg-[#1D3228] text-white">30s</option>
                                <option value={45} className="bg-[#1D3228] text-white">45s</option>
                                <option value={60} className="bg-[#1D3228] text-white">60s</option>
                                <option value={90} className="bg-[#1D3228] text-white">90s</option>
                                <option value={120} className="bg-[#1D3228] text-white">120s</option>
                              </select>
                            </div>
                          </div>

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
              <span className="text-xs text-[#E6E5DC]/60 tabular-nums">
                Ready to add {generatedList.filter(q => q.selected).length} question(s)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-[#E6E5DC]/70 hover:text-white rounded-xl hover:bg-[#233B31] transition-colors cursor-pointer"
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
