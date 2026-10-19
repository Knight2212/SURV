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
  ClipboardCheck,
  Play,
  CheckCircle2,
  Zap,
  Globe,
  ShieldCheck,
  Smartphone,
  Cpu,
  Layers,
  Star,
  Check,
  ChevronRight,
} from 'lucide-react';
import { initializeStore } from '@/lib/store';

// Interactive Mock Demo Card data
const DEMO_OPTIONS = [
  { id: 'opt-1', text: 'Live Audience Polling & Bar Charts', votes: 142, color: '#6366F1' },
  { id: 'opt-2', text: 'Anonymous Moderated Q&A with Upvoting', votes: 98, color: '#06B6D4' },
  { id: 'opt-3', text: 'Dynamic Real-time Word Clouds', votes: 76, color: '#10B981' },
  { id: 'opt-4', text: 'AI-Generated Quizzes & Gamification', votes: 124, color: '#F59E0B' },
];

export default function HomePage() {
  const router = useRouter();
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [demoSelected, setDemoSelected] = useState<string | null>('opt-1');
  const [demoVotes, setDemoVotes] = useState(DEMO_OPTIONS);

  useEffect(() => {
    initializeStore();
  }, []);

  // Format 9-digit PIN nicely with dashes as user types (e.g. 123-456-789)
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
      setErrorMsg('Please enter a valid 9-digit session PIN (e.g. 123-456-789)');
      return;
    }
    router.push(`/app/${pinInput}`);
  };

  const handleLaunchDemo = (type: 'participant' | 'presenter' | 'host') => {
    const demoPin = '123-456-789';
    if (type === 'participant') {
      router.push(`/app/${demoPin}`);
    } else if (type === 'presenter') {
      router.push(`/present/${demoPin}`);
    } else {
      router.push(`/host/${demoPin}`);
    }
  };

  const handleDemoVote = (optId: string) => {
    if (demoSelected === optId) return;
    setDemoSelected(optId);
    setDemoVotes(prev =>
      prev.map(opt => (opt.id === optId ? { ...opt, votes: opt.votes + 1 } : opt))
    );
  };

  const totalDemoVotes = demoVotes.reduce((acc, curr) => acc + curr.votes, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#07090E] text-slate-100 overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-indigo-600/15 via-violet-600/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-1/3 -left-40 w-[600px] h-[500px] bg-cyan-500/8 blur-[160px] rounded-full" />
        <div className="absolute bottom-20 -right-40 w-[600px] h-[500px] bg-emerald-500/8 blur-[160px] rounded-full" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 sm:px-10 py-4.5 border-b border-white/10 bg-[#07090E]/80 backdrop-blur-xl transition-all">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => router.push('/')}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <Radio size={20} className="text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">
            SURV<span className="text-cyan-400">.</span>
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hidden sm:inline-block">
            Realtime Engagement
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => router.push('/host')}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer"
          >
            Host Dashboard
          </button>
          <button
            onClick={() => handleLaunchDemo('presenter')}
            className="px-4.5 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Monitor size={15} />
            <span>Presenter Screen</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 sm:px-6 pt-16 sm:pt-24 pb-20 max-w-6xl mx-auto w-full">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-medium mb-8 backdrop-blur-md shadow-sm"
        >
          <Sparkles size={15} className="text-indigo-400 animate-pulse" />
          <span>Next-Generation Audience Response Platform</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-1" />
        </motion.div>

        {/* Hero Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black text-center tracking-tight leading-[1.08] max-w-4xl mb-6"
        >
          Transform any meeting or lecture into a{' '}
          <span className="bg-gradient-to-r from-white via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
            live conversation.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-xl text-slate-400 text-center max-w-2xl leading-relaxed mb-10"
        >
          Interactive live polling, real-time word clouds, anonymous Q&A with upvoting, and gamified quizzes with instant leaderboards. Zero app downloads.
        </motion.p>

        {/* PIN Join Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-2xl shadow-2xl shadow-indigo-950/40 mb-14"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Enter 9-Digit Session PIN
            </span>
            <span className="text-xs text-indigo-400 font-medium flex items-center gap-1">
              <Zap size={13} /> Instant Join
            </span>
          </div>

          <form onSubmit={handleJoin} className="flex flex-col gap-3.5">
            <input
              type="text"
              inputMode="numeric"
              value={pinInput}
              onChange={handlePinChange}
              placeholder="123-456-789"
              className="w-full text-center tracking-widest font-mono text-2xl font-bold py-3.5 bg-slate-950/80 border border-white/15 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              autoFocus
            />

            {errorMsg && (
              <span className="text-xs text-rose-400 text-center bg-rose-500/10 border border-rose-500/20 py-2 rounded-lg">
                {errorMsg}
              </span>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-6 font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer group"
            >
              <span>Join Session</span>
              <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          {/* Quick Demo Launch Link */}
          <div className="mt-5 pt-4 border-t border-white/10 text-center">
            <button
              onClick={() => handleLaunchDemo('participant')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play size={13} fill="currentColor" /> Or jump straight into the Demo Session (123-456-789)
            </button>
          </div>
        </motion.div>

        {/* Live Interactive Widget Demo on Landing Page */}
        <div className="w-full max-w-3xl mb-24">
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-indigo-500/20 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Interactive Live Poll Preview
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {totalDemoVotes} total live votes
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-5 leading-snug">
              What feature matters most for your live audience sessions?
            </h3>

            <div className="space-y-3">
              {demoVotes.map((opt, idx) => {
                const percentage = Math.round((opt.votes / totalDemoVotes) * 100);
                const isSelected = demoSelected === opt.id;

                return (
                  <div
                    key={opt.id}
                    onClick={() => handleDemoVote(opt.id)}
                    className={`relative p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer select-none overflow-hidden ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/20 shadow-md shadow-indigo-500/10'
                        : 'border-white/10 bg-white/3 hover:bg-white/6 hover:border-white/20'
                    }`}
                  >
                    {/* Fill Bar */}
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500/15 to-indigo-500/25 transition-all duration-700 ease-out z-0"
                      style={{ width: `${percentage}%` }}
                    />

                    {/* Content */}
                    <div className="relative z-10 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="text-sm font-semibold text-slate-200">
                          {opt.text}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-400 font-mono">
                          {opt.votes} votes
                        </span>
                        <span className="text-sm font-bold text-indigo-300 font-mono w-10 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-slate-500 text-center mt-4">
              Click any option above to cast a live vote and watch the visualizer update in real-time.
            </p>
          </div>
        </div>

        {/* 3 Core Experience Views (Bento Showcase) */}
        <div className="w-full mb-28">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Explore the 3 Core SURV Experiences
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Purpose-built interfaces tailored specifically for attendees, stage presenters, and session hosts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1: Participant App */}
            <div
              onClick={() => handleLaunchDemo('participant')}
              className="p-6 rounded-2xl bg-slate-900/50 border border-white/10 hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Smartphone size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Participant App</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Mobile-first zero-install audience interface. Vote in live polls, submit Q&A questions anonymously, and earn quiz badges.
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5 group-hover:text-indigo-300 pt-4 border-t border-white/5">
                <span>Launch Participant Web App</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>

            {/* 2: Presenter Projector Screen */}
            <div
              onClick={() => handleLaunchDemo('presenter')}
              className="p-6 rounded-2xl bg-slate-900/50 border border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-900/80 transition-all cursor-pointer group flex flex-col justify-between shadow-lg shadow-cyan-950/20"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Monitor size={24} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-white">Presenter Screen</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Stage HUD
                  </span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Cinematic fullscreen projection view. Auto-generating QR join code, dynamic animated word clouds, live bar graphs, and podium celebrations.
                </p>
              </div>
              <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5 group-hover:text-cyan-300 pt-4 border-t border-white/5">
                <span>Open Projector Display</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>

            {/* 3: Host Command Center */}
            <div
              onClick={() => handleLaunchDemo('host')}
              className="p-6 rounded-2xl bg-slate-900/50 border border-white/10 hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <BarChart3 size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Host Command Center</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Complete session control. Trigger polls, toggle voting locks, moderate audience questions, craft quizzes with Gemini AI, and export analytics.
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 group-hover:text-emerald-300 pt-4 border-t border-white/5">
                <span>Open Host Dashboard</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </div>

        {/* Real-World Use Cases */}
        <div className="w-full mb-28">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Engineered for High-Stakes Engagement
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Trusted by universities, enterprises, and conference organizers worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                <Globe size={20} />
              </div>
              <h4 className="font-bold text-white text-base">Higher Education</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Check conceptual comprehension in 300+ student lecture halls. Students participate anonymously without hesitation.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Users size={20} />
              </div>
              <h4 className="font-bold text-white text-base">Town Halls & All-Hands</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Crowdsource high-priority employee questions with real-time upvoting. Leadership addresses what truly matters.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Award size={20} />
              </div>
              <h4 className="font-bold text-white text-base">Interactive Training</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gamify product training and certifications with timed question challenges, correct answers, and podium celebrations.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <h4 className="font-bold text-white text-base">Hybrid Conferences</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect in-person and remote participants seamlessly with sub-second WebSocket sync and QR join codes.
              </p>
            </div>
          </div>
        </div>

        {/* Transparent Feature & Tier Matrix */}
        <div className="w-full mb-24">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 block">
              100% Free & Open Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              No Paywalls. No Participant Caps.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Compare SURV with legacy alternatives that charge thousands for enterprise polling.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/40">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/80">
                  <th className="p-4 sm:p-5 font-semibold text-slate-300">Platform Capability</th>
                  <th className="p-4 sm:p-5 font-bold text-cyan-400 bg-indigo-950/30">
                    SURV (This Platform)
                  </th>
                  <th className="p-4 sm:p-5 font-semibold text-slate-400">Vevox Free Tier</th>
                  <th className="p-4 sm:p-5 font-semibold text-slate-400">Slido Free Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Participant Limit</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-400 bg-indigo-950/20">
                    Unlimited
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400">100 participants</td>
                  <td className="p-4 sm:p-5 text-slate-400">100 participants</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Gemini AI Quiz Generation</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-400 bg-indigo-950/20">
                    Included (Free)
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">Not Available</td>
                  <td className="p-4 sm:p-5 text-slate-500">Enterprise Paid Only</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Live Word Clouds & Ratings</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-400 bg-indigo-950/20">
                    Included (Real-time)
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400">Limited</td>
                  <td className="p-4 sm:p-5 text-slate-400">3 polls per event</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Audience Q&A Moderation & Upvoting</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-400 bg-indigo-950/20">
                    Full Moderation Suite
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400">Basic</td>
                  <td className="p-4 sm:p-5 text-slate-400">Basic</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Data Export (JSON / Analytics)</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-400 bg-indigo-950/20">
                    Instant 1-Click Export
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">Paid Plan Only</td>
                  <td className="p-4 sm:p-5 text-slate-500">Paid Plan Only</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-medium text-white">Cost to Host & Run</td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-400 bg-indigo-950/20">
                    $0.00 / month (100% Free)
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400">$10 – $99+/mo for Pro</td>
                  <td className="p-4 sm:p-5 text-slate-400">$12 – $150+/mo for Pro</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="w-full p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-900/50 via-slate-900 to-violet-900/50 border border-indigo-500/30 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-5">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Ready to energize your next session?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Create a free room in 5 seconds. No account required to test or present.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => router.push('/host')}
                className="px-6 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all"
              >
                <span>Launch Host Dashboard</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => handleLaunchDemo('presenter')}
                className="px-6 py-3.5 text-sm font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl cursor-pointer transition-all"
              >
                View Presenter HUD
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/80 py-8 px-6 sm:px-10 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-400">SURV Interactive</span>
          <span>•</span>
          <span>Next.js 16 • Tailwind CSS • Supabase Realtime • Google Gemini AI</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="hover:text-slate-300 cursor-pointer" onClick={() => router.push('/host')}>
            Host Dashboard
          </span>
          <span className="hover:text-slate-300 cursor-pointer" onClick={() => handleLaunchDemo('presenter')}>
            Presenter View
          </span>
          <span className="hover:text-slate-300 cursor-pointer" onClick={() => handleLaunchDemo('participant')}>
            Participant View
          </span>
        </div>
      </footer>
    </div>
  );
}
