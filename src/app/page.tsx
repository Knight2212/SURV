'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Users,
  Sparkles,
  Monitor,
  ArrowRight,
  BarChart3,
  MessageSquare,
  Award,
  Smartphone,
  CheckCircle2,
  Lock,
  Flame,
  Globe,
  ShieldCheck,
  Check,
  ChevronRight,
  TrendingUp,
  Clock,
  Layers,
  Star,
} from 'lucide-react';
import { initializeStore } from '@/lib/store';

// Interactive Mock Demo Card data
const DEMO_POLL_OPTIONS = [
  { id: 'opt-a', label: 'A', text: 'Cloud-Native Microservices', votes: 142, color: '#7C3AED' },
  { id: 'opt-b', label: 'B', text: 'Event-Driven Architecture', votes: 118, color: '#06B6D4' },
  { id: 'opt-c', label: 'C', text: 'Serverless Edge Functions', votes: 84, color: '#10B981' },
  { id: 'opt-d', label: 'D', text: 'Modular Monolith with Turbopack', votes: 62, color: '#F59E0B' },
];

const USE_CASES = [
  {
    id: 'education',
    title: 'Higher Education & Lectures',
    tag: 'Active Learning',
    description: 'Transform 300-seat lecture halls into interactive learning spaces. Gauge comprehension instantly without student hesitation.',
    metrics: ['94% student participation', '100% anonymous voting', 'Zero app downloads'],
    quote: 'Students who never raised their hands now lead the discussion through anonymous polls.',
  },
  {
    id: 'corporate',
    title: 'All-Hands & Town Halls',
    tag: 'Executive Alignment',
    description: 'Empower employees to ask difficult, candid questions with crowdsourced upvoting. Leaders address top concerns transparently.',
    metrics: ['Real-time question upvoting', 'Presenter screen moderation', 'Instant feedback polls'],
    quote: 'Our executive Q&A sessions became 10x more transparent and impactful in one week.',
  },
  {
    id: 'workshops',
    title: 'Training & Design Sprints',
    tag: 'Continuous Engagement',
    description: 'Break the monotony of long presentations with word clouds, instant knowledge checks, and timed quiz battles with leaderboards.',
    metrics: ['Gemini AI question generation', 'Dynamic word cloud cluster', 'Podium celebrations'],
    quote: 'The AI quiz generator crafted our entire post-training assessment in 5 seconds flat.',
  },
  {
    id: 'conferences',
    title: 'Hybrid & Global Conferences',
    tag: 'Massive Scale',
    description: 'Connect in-person audience members and virtual attendees on a single synchronized stage with sub-second WebSocket latency.',
    metrics: ['Instant QR code joining', 'Universal device support', 'Unlimited participants'],
    quote: 'Seamless connection across both in-room projector screens and remote laptop viewers.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeUseCase, setActiveUseCase] = useState(0);

  // Interactive Live Hero Simulator State
  const [selectedHeroVote, setSelectedHeroVote] = useState<string>('opt-a');
  const [heroVotes, setHeroVotes] = useState(DEMO_POLL_OPTIONS);

  useEffect(() => {
    initializeStore();
  }, []);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 9);
    let formatted = raw;
    if (raw.length > 6) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6)}`;
    } else if (raw.length > 3) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    }
    setPinInput(formatted);
    if (errorMsg) setErrorMsg('');
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pinInput.replace(/[^0-9]/g, '');
    if (clean.length < 6) {
      setErrorMsg('Please enter a valid 9-digit session PIN');
      return;
    }
    router.push(`/app/${pinInput}`);
  };

  const handleHeroVote = (optId: string) => {
    if (selectedHeroVote === optId) return;
    setSelectedHeroVote(optId);
    setHeroVotes(prev =>
      prev.map(opt => (opt.id === optId ? { ...opt, votes: opt.votes + 1 } : opt))
    );
  };

  const totalHeroVotes = heroVotes.reduce((acc, curr) => acc + curr.votes, 0);

  return (
    <div className="min-h-screen bg-[#070A10] text-[#F8FAFC] selection:bg-violet-600/30 selection:text-violet-200">
      {/* Refined subtle background grid pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] z-0" />

      {/* Ambient center spotlight */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-violet-600/10 via-indigo-600/5 to-transparent blur-[140px] pointer-events-none z-0" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#070A10]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => router.push('/')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-600/20 group-hover:scale-105 transition-transform">
              <Radio size={16} className="text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              SURV<span className="text-violet-400">.</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <a href="#demo" className="hover:text-white transition-colors">
              Live Showcase
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Platform Features
            </a>
            <a href="#usecases" className="hover:text-white transition-colors">
              Solutions
            </a>
            <a href="#comparison" className="hover:text-white transition-colors">
              Why Free?
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/host')}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all cursor-pointer"
            >
              Host Dashboard
            </button>
            <button
              onClick={() => router.push('/present/123-456-789')}
              className="px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg shadow-md shadow-violet-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Monitor size={14} />
              <span>Presenter Screen</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 px-6 max-w-5xl mx-auto text-center">
        {/* Announcement Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles size={13} className="text-violet-400" />
          <span>Next-Generation Audience Response Platform</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] text-white mb-6">
          Transform presentations into{' '}
          <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-emerald-300 bg-clip-text text-transparent">
            live conversations.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          The modern, 100% free alternative to Vevox and Slido. Real-time polling, animated word clouds, anonymous Q&A, and gamified quizzes with zero app downloads.
        </p>

        {/* Single Unified Action Hub */}
        <div className="max-w-xl mx-auto p-2 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/50 mb-6">
          <form onSubmit={handleJoin} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex-1 w-full flex items-center px-4 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl focus-within:border-violet-500/60 transition-colors">
              <span className="text-xs font-bold font-mono text-slate-500 mr-2 tracking-wider">
                PIN:
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={pinInput}
                onChange={handlePinChange}
                placeholder="123-456-789"
                className="w-full bg-transparent text-sm sm:text-base font-mono font-bold text-white placeholder-slate-600 focus:outline-none tracking-widest"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 font-semibold text-xs sm:text-sm text-white bg-violet-600 hover:bg-violet-500 rounded-xl shadow-lg shadow-violet-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Join Session</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {errorMsg && (
            <p className="text-xs text-rose-400 text-center mt-2 font-medium">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Quick Launch Demo */}
        <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
          <span>Or explore ready-to-test sessions:</span>
          <button
            onClick={() => router.push('/app/123-456-789')}
            className="text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Smartphone size={13} /> Participant App
          </button>
          <span className="text-slate-600">•</span>
          <button
            onClick={() => router.push('/present/123-456-789')}
            className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Monitor size={13} /> Presenter Projector
          </button>
        </div>
      </section>

      {/* Interactive Live Product Arena (Dual-Screen Simulation) */}
      <section id="demo" className="relative z-10 py-12 px-6 max-w-6xl mx-auto">
        <div className="rounded-3xl bg-[#0D121D] border border-white/10 shadow-2xl overflow-hidden">
          {/* Mock Window Top Bar */}
          <div className="px-5 py-3.5 bg-slate-900/90 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-400 ml-2 hidden sm:inline">
                SURV Live Stage Simulator • PIN 123-456-789
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Synchronized Real-Time</span>
              </span>
            </div>
          </div>

          {/* Interactive Split Arena */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
            {/* Left: Stage Projector Screen (7 Cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                    <Monitor size={13} /> Stage Projection View
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {totalHeroVotes} Live Responses
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white mb-6 leading-snug">
                  Which tech architecture should our engineering team adopt for Q4?
                </h3>

                {/* Animated Bars */}
                <div className="space-y-3.5">
                  {heroVotes.map(opt => {
                    const percentage = Math.round((opt.votes / totalHeroVotes) * 100);
                    const isLeading = opt.id === 'opt-a';

                    return (
                      <div key={opt.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-300 flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center font-bold text-[10px] text-white">
                              {opt.label}
                            </span>
                            {opt.text}
                            {isLeading && (
                              <span className="text-[10px] text-violet-400 font-bold bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20">
                                Leading
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-slate-400">
                            <strong className="text-white font-bold">{percentage}%</strong> ({opt.votes})
                          </span>
                        </div>

                        {/* Progress track */}
                        <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-500">
                <span>Presenter Mode with auto-hiding controls</span>
                <span className="font-mono text-slate-400">Press Space for Next Poll</span>
              </div>
            </div>

            {/* Right: Participant Interactive Phone Preview (5 Cols) */}
            <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-950/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Smartphone size={13} /> Participant Phone (Interactive)
                  </span>
                  <span className="text-xs text-slate-400">Click to cast vote</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2.5">
                  <p className="text-xs font-semibold text-slate-400 mb-3">
                    Tap an option below to simulate live participant voting:
                  </p>

                  {heroVotes.map(opt => {
                    const isSelected = selectedHeroVote === opt.id;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleHeroVote(opt.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-violet-600/20 border-violet-500 text-white shadow-sm'
                            : 'bg-white/[0.02] border-white/[0.08] text-slate-300 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] ${
                              isSelected ? 'bg-violet-600 text-white' : 'bg-white/10 text-slate-400'
                            }`}
                          >
                            {opt.label}
                          </span>
                          <span>{opt.text}</span>
                        </div>

                        {isSelected && (
                          <CheckCircle2 size={16} className="text-violet-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-6 text-center">
                Audience members scan the QR code and vote with zero install required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Neo-Minimalist Bento Grid Features */}
      <section id="features" className="relative z-10 py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-2 block">
            Comprehensive Audience Tooling
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Everything modern presenters need.
          </h2>
        </div>

        {/* Real Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Bento Tile 1: Live Visualizers (Span 8) */}
          <div className="md:col-span-8 p-7 rounded-3xl bg-[#0D121D] border border-white/10 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Real-Time Dynamic Visualizers
              </h3>
              <p className="text-sm text-slate-400 max-w-lg mb-6 leading-relaxed">
                Choose between animated bar graphs with correct-answer reveals, dynamic word clouds with fluid text scaling, or 5-star rating breakdowns.
              </p>
            </div>

            {/* Visualizer Mini Mock */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/[0.06]">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-xs font-bold text-slate-300 block mb-1">Bar Charts</span>
                <span className="text-[11px] text-slate-500">Live spring-eased progress percentages</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-xs font-bold text-slate-300 block mb-1">Word Clouds</span>
                <span className="text-[11px] text-slate-500">Auto-clustered multi-color phrase tags</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-xs font-bold text-slate-300 block mb-1">5-Star Ratings</span>
                <span className="text-[11px] text-slate-500">Satisfaction scorecards & distributions</span>
              </div>
            </div>
          </div>

          {/* Bento Tile 2: Gemini AI Engine (Span 4) */}
          <div className="md:col-span-4 p-7 rounded-3xl bg-[#0D121D] border border-violet-500/30 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-violet-950/20">
            <div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center mb-4 shadow-md shadow-violet-600/30">
                <Sparkles size={20} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Gemini AI Engine
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                Input any topic or lecture theme. The built-in Google Gemini engine synthesizes timed quiz questions, correct answers, and options in seconds.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono text-violet-300">
              ⚡ Generated 5 Qs on &quot;System Design&quot;
            </div>
          </div>

          {/* Bento Tile 3: Anonymous Q&A (Span 4) */}
          <div className="md:col-span-4 p-7 rounded-3xl bg-[#0D121D] border border-white/10 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <MessageSquare size={20} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Crowdsourced Q&A
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                Audience members submit questions anonymously or with their name. Attendees upvote high-priority topics so leaders address what matters.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-300 truncate max-w-[180px]">&quot;How does the latency scale?&quot;</span>
              <span className="font-bold text-cyan-400 font-mono">▲ 48 votes</span>
            </div>
          </div>

          {/* Bento Tile 4: Gamified Quizzes (Span 8) */}
          <div className="md:col-span-8 p-7 rounded-3xl bg-[#0D121D] border border-white/10 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <Award size={20} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Gamified Quizzes & Live Podium
              </h3>
              <p className="text-sm text-slate-400 max-w-lg mb-6 leading-relaxed">
                Add timers and correct answers to any poll question. Reveal the animated podium celebration with confetti to crown the top attendee champions.
              </p>
            </div>

            {/* Podium Mockup */}
            <div className="grid grid-cols-3 gap-3 items-end pt-2">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center">
                <span className="text-[10px] font-bold text-slate-400">2ND PLACE</span>
                <p className="text-xs font-bold text-white truncate mt-0.5">Alex M.</p>
                <span className="text-xs font-mono font-bold text-slate-400">200 pts</span>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-center -translate-y-1">
                <span className="text-[10px] font-black text-amber-400">👑 CHAMPION</span>
                <p className="text-xs font-bold text-white truncate mt-0.5">Elena K.</p>
                <span className="text-xs font-mono font-bold text-amber-300">300 pts</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-900/20 border border-amber-800/30 text-center">
                <span className="text-[10px] font-bold text-amber-600">3RD PLACE</span>
                <p className="text-xs font-bold text-white truncate mt-0.5">Marcus D.</p>
                <span className="text-xs font-mono font-bold text-amber-500">100 pts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions & Use Cases (Interactive Tabs) */}
      <section id="usecases" className="relative z-10 py-20 px-6 max-w-6xl mx-auto border-t border-white/[0.06]">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-2 block">
            Proven Across High-Stakes Environments
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Tailored for every audience size.
          </h2>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {USE_CASES.map((uc, idx) => (
            <button
              key={uc.id}
              onClick={() => setActiveUseCase(idx)}
              className={`px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeUseCase === idx
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/5'
              }`}
            >
              {uc.title}
            </button>
          ))}
        </div>

        {/* Active Use Case Card */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0D121D] border border-white/10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {USE_CASES[activeUseCase].tag}
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              {USE_CASES[activeUseCase].title}
            </h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              {USE_CASES[activeUseCase].description}
            </p>

            <blockquote className="p-4 rounded-xl bg-white/[0.02] border-l-2 border-violet-500 text-xs sm:text-sm text-slate-300 italic">
              &quot;{USE_CASES[activeUseCase].quote}&quot;
            </blockquote>
          </div>

          <div className="md:col-span-5 space-y-3">
            {USE_CASES[activeUseCase].metrics.map((metric, mIdx) => (
              <div
                key={mIdx}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]"
              >
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-slate-200">{metric}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison: Why SURV is 100% Free Forever */}
      <section id="comparison" className="relative z-10 py-20 px-6 max-w-5xl mx-auto border-t border-white/[0.06]">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 block">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Zero Paywalls. No Participant Caps.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Legacy tools charge hundreds per month for basic features. SURV is open architecture and free forever.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* SURV Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-violet-950/30 to-[#0D121D] border-2 border-violet-500/60 shadow-2xl shadow-violet-950/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                  SURV Platform
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
                  100% FREE
                </span>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-xs text-slate-400 ml-2">/ month forever</span>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400" />
                  <strong>Unlimited audience participants</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400" />
                  <strong>Google Gemini AI quiz generator included</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400" />
                  <strong>Dynamic word clouds & 5-star ratings</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400" />
                  <strong>Audience Q&A upvoting & host moderation</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400" />
                  <strong>1-click session data export (JSON/CSV)</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400" />
                  <strong>Zero app downloads required</strong>
                </li>
              </ul>
            </div>

            <button
              onClick={() => router.push('/host')}
              className="w-full mt-8 py-3.5 px-6 font-semibold text-xs sm:text-sm text-white bg-violet-600 hover:bg-violet-500 rounded-xl shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Create Free Room Now</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Legacy Tools Card */}
          <div className="p-8 rounded-3xl bg-[#0D121D] border border-white/[0.08] flex flex-col justify-between opacity-80">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Legacy Commercial Tools (Vevox / Slido)
                </span>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-black text-slate-400">$99+</span>
                <span className="text-xs text-slate-500 ml-2">/ month for enterprise features</span>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-slate-400">
                <li className="flex items-center gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Free tier capped at only 100 participants</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>AI quiz generation locked behind enterprise tier</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Limited polls per event on free accounts</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Data export locked behind paid subscriptions</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Aggressive upgrade prompts during live sessions</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-white/[0.06] text-center text-xs text-slate-500">
              Why pay monthly fees when you can host your own platform for free?
            </div>
          </div>
        </div>
      </section>

      {/* Final Action CTA Banner */}
      <section className="relative z-10 py-20 px-6 max-w-5xl mx-auto">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-tr from-violet-900/40 via-slate-900 to-indigo-950/40 border border-violet-500/30 text-center shadow-2xl relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to energize your next session?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto mb-8">
            Create an interactive room in under 5 seconds. No account required to test or present.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => router.push('/host')}
              className="px-6 py-3.5 text-xs sm:text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl shadow-lg shadow-violet-600/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>Launch Host Command Center</span>
              <ArrowRight size={15} />
            </button>
            <button
              onClick={() => router.push('/present/123-456-789')}
              className="px-6 py-3.5 text-xs sm:text-sm font-semibold text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl cursor-pointer transition-all"
            >
              View Presenter Projector HUD
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#05070C] py-8 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">SURV Interactive</span>
            <span>•</span>
            <span>Next.js 16 • Tailwind CSS v4 • Supabase Realtime • Google Gemini AI</span>
          </div>

          <div className="flex items-center gap-6">
            <span
              className="hover:text-slate-300 cursor-pointer"
              onClick={() => router.push('/host')}
            >
              Host Dashboard
            </span>
            <span
              className="hover:text-slate-300 cursor-pointer"
              onClick={() => router.push('/present/123-456-789')}
            >
              Presenter View
            </span>
            <span
              className="hover:text-slate-300 cursor-pointer"
              onClick={() => router.push('/app/123-456-789')}
            >
              Participant View
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
