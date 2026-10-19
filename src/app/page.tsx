'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Monitor,
  CheckCircle2,
  Check,
  Smartphone,
  Plus,
  Radio,
  Sparkles,
  MessageSquare,
  BarChart3,
  Star,
  Users,
  Copy,
} from 'lucide-react';
import { initializeStore } from '@/lib/store';

// Live interactive hero options
interface HeroOption {
  id: string;
  label: string;
  text: string;
  votes: number;
}

const INITIAL_HERO_OPTIONS: HeroOption[] = [
  { id: 'opt-a', label: 'A', text: 'Distributed Event-Driven Architecture', votes: 148 },
  { id: 'opt-b', label: 'B', text: 'Serverless Edge Functions & Fastly', votes: 112 },
  { id: 'opt-c', label: 'C', text: 'Modular Monolith with Rust Microservices', votes: 89 },
  { id: 'opt-d', label: 'D', text: 'GraphQL Federation with Apollo Router', votes: 57 },
];

const USE_CASES = [
  {
    id: 'lectures',
    title: 'University Lectures & Large Classes',
    scope: '300-seat lecture halls',
    claim: 'Zero student friction: everyone votes from their browser in three seconds.',
    description: 'Professors check live concept comprehension midway through lectures. Quiet students participate freely through anonymous polls without self-consciousness.',
    specs: ['100% anonymous voting', 'Instant QR code joining', 'Live lecture comprehension checks'],
  },
  {
    id: 'townhalls',
    title: 'Company All-Hands & Executive Q&A',
    scope: 'Distributed teams & hybrid summits',
    claim: 'Crowdsourced upvoting surfaces the hardest questions first.',
    description: 'Employees post questions throughout presentations. Real-time upvoting organizes topics organically, giving executive leadership unfiltered visibility into what people care about.',
    specs: ['Upvoting with duplicate filtering', 'Host moderation controls', 'Presenter screen toggle'],
  },
  {
    id: 'conferences',
    title: 'Tech Keynotes & Global Conferences',
    scope: 'Thousands of live attendees',
    claim: 'Sub-second real-time sync that never chokes on crowded venue Wi-Fi.',
    description: 'Engineered on lightweight WebSocket connections and optimized payloads. Thousands of attendees cast votes simultaneously with instantaneous bar chart transitions on the main stage screen.',
    specs: ['Sub-second stage synchronization', 'Full keyboard navigation shortcuts', 'Zero native app downloads'],
  },
  {
    id: 'workshops',
    title: 'Interactive Workshops & Training',
    scope: 'Team offsites & agile sprints',
    claim: 'Gemini AI crafts contextual assessment quizzes from a single prompt.',
    description: 'Transform passive slide lectures into active learning challenges. Synthesize questions, multiple choices, and correct answers with built-in Google Gemini in five seconds.',
    specs: ['Gemini AI instant question synthesis', 'Animated podium celebrations', 'Exportable session analytics'],
  },
];

export default function HomePage() {
  const router = useRouter();
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeUseCase, setActiveUseCase] = useState(0);

  // Live Interactive Hero Poll Simulator
  const [heroVotes, setHeroVotes] = useState<HeroOption[]>(INITIAL_HERO_OPTIONS);
  const [selectedHeroVote, setSelectedHeroVote] = useState<string>('opt-a');
  const [hasVotedHero, setHasVotedHero] = useState<boolean>(true);

  // Live Interactive Capability 1: Word Cloud & Rating Simulator
  const [cloudWords, setCloudWords] = useState([
    { text: 'Low Latency', count: 48, size: 'text-2xl font-bold text-white' },
    { text: 'WebSockets', count: 39, size: 'text-xl font-semibold text-emerald-400' },
    { text: 'Zero App', count: 34, size: 'text-lg font-medium text-slate-200' },
    { text: 'Instant QR', count: 28, size: 'text-base text-slate-300' },
    { text: 'Anonymous', count: 24, size: 'text-sm text-slate-400' },
    { text: 'Open Source', count: 21, size: 'text-xs text-slate-400' },
  ]);
  const [newWordInput, setNewWordInput] = useState('');
  const [selectedRating, setSelectedRating] = useState<number>(5);

  // Live Interactive Capability 2: Q&A Upvote Simulator
  const [qaItems, setQaItems] = useState([
    {
      id: 'qa-1',
      question: 'How does the WebSocket architecture maintain sub-second latency across 2,000+ simultaneous connections?',
      author: 'Staff Engineer (Anonymous)',
      votes: 84,
      upvoted: true,
      answered: true,
    },
    {
      id: 'qa-2',
      question: 'Can attendees submit questions without entering an email address or creating an account?',
      author: 'Audience Member',
      votes: 52,
      upvoted: false,
      answered: false,
    },
    {
      id: 'qa-3',
      question: 'Does the host export raw session data as CSV for post-event analysis?',
      author: 'Conference Organizer',
      votes: 37,
      upvoted: false,
      answered: false,
    },
  ]);

  // Live Interactive Capability 3: AI Quiz Generator Simulator
  const [aiTopic, setAiTopic] = useState('Kubernetes Orchestration');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiQuizPreview, setAiQuizPreview] = useState({
    question: 'What is the primary role of the Kubernetes Kube-Scheduler component?',
    options: [
      { text: 'Assigning unassigned pods to healthy worker nodes based on resource constraints', correct: true },
      { text: 'Maintaining cluster network routing tables and DNS discovery', correct: false },
      { text: 'Managing container image caching across local nodes', correct: false },
      { text: 'Executing container build pipelines inside isolated namespaces', correct: false },
    ],
  });

  // Closing CTA creator state
  const [createTitle, setCreateTitle] = useState('Q4 Engineering Architecture Review');
  const [createMode, setCreateMode] = useState<'polls' | 'quiz' | 'qa'>('polls');

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
      setErrorMsg('Enter a valid 9-digit session PIN');
      return;
    }
    router.push(`/app/${pinInput}`);
  };

  const handleHeroVote = (optId: string) => {
    if (selectedHeroVote === optId) return;
    setSelectedHeroVote(optId);
    setHasVotedHero(true);
    setHeroVotes(prev =>
      prev.map(opt => (opt.id === optId ? { ...opt, votes: opt.votes + 1 } : opt))
    );
  };

  const handleAddCloudWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordInput.trim()) return;
    const clean = newWordInput.trim();
    setCloudWords(prev => [
      { text: clean, count: 18, size: 'text-xl font-bold text-white' },
      ...prev.slice(0, 5),
    ]);
    setNewWordInput('');
  };

  const handleToggleQaUpvote = (id: string) => {
    setQaItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextUpvoted = !item.upvoted;
          return {
            ...item,
            upvoted: nextUpvoted,
            votes: nextUpvoted ? item.votes + 1 : item.votes - 1,
          };
        }
        return item;
      })
    );
  };

  const handleGenerateAiSample = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      setAiQuizPreview({
        question: `How does ${aiTopic || 'Modern Web Architecture'} prevent cascading network failures?`,
        options: [
          { text: 'Circuit breakers with exponential backoff and jittered retries', correct: true },
          { text: 'Synchronous blocking RPC calls across microservices', correct: false },
          { text: 'Disabling health check probes during high request load', correct: false },
          { text: 'Increasing global database write connection pools', correct: false },
        ],
      });
      setIsGeneratingAi(false);
    }, 450);
  };

  const handleLaunchSession = () => {
    router.push('/host');
  };

  const totalHeroVotes = heroVotes.reduce((acc, curr) => acc + curr.votes, 0);

  return (
    <div className="min-h-[100svh] bg-[#0A0D12] text-[#F8FAFC]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-[#0A0D12] border-b border-white/[0.08]"> {/* taste-skill-ignore */}
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <div className="w-7 h-7 rounded bg-white text-[#0A0D12] flex items-center justify-center font-bold text-sm">
              S
            </div>
            <span className="text-base font-semibold tracking-tight text-white">
              SURV
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline ml-1">
              / live audience platform
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs text-slate-400">
            <a href="#simulator" className="hover:text-white transition-colors">
              Live Demo
            </a>
            <a href="#capabilities" className="hover:text-white transition-colors">
              Capabilities
            </a>
            <a href="#solutions" className="hover:text-white transition-colors">
              Solutions
            </a>
            <a href="#guarantee" className="hover:text-white transition-colors">
              Free Guarantee
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/present/123-456-789')}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] rounded transition-colors cursor-pointer"
            >
              Stage Projector
            </button>
            <button
              onClick={() => router.push('/host')}
              className="px-4 py-1.5 text-xs font-semibold text-[#0A0D12] bg-white hover:bg-slate-200 rounded transition-colors cursor-pointer"
            >
              Start Session
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section: The Product Performs */}
      <section className="pt-16 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Hero Left Column (Copy & Direct Entry) */}
          <div className="lg:col-span-5 space-y-6 pt-2">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-white tracking-[-0.03em] leading-[1.08]">
              Live audience polls that people actually answer.
            </h1>

            <p className="text-base text-slate-400 leading-relaxed max-w-md">
              Questions, dynamic word clouds, and anonymous Q&amp;A on your room screen. Attendees join in three seconds on their phones with a six-digit code. Zero app downloads, zero logins.
            </p>

            {/* Direct Join Box */}
            <div className="p-4 rounded-xl bg-[#121720] border border-white/[0.08] space-y-3 max-w-md">
              <span className="text-xs text-slate-400 block font-medium">
                Enter room code to join live session:
              </span>

              <form onSubmit={handleJoin} className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={handlePinChange}
                  placeholder="123-456-789"
                  className="flex-1 bg-[#0A0D12] border border-white/[0.12] rounded px-3 py-2 text-sm tabular-nums text-white placeholder-slate-600 focus:outline-none focus:border-white transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-[#0A0D12] bg-white hover:bg-slate-200 rounded flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Join</span>
                  <ArrowRight size={13} />
                </button>
              </form>

              {errorMsg && (
                <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
              )}

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400"> {/* taste-skill-ignore */}
                <span>Presenter testing?</span>
                <button
                  type="button"
                  onClick={() => router.push('/host')}
                  className="text-white hover:underline font-medium cursor-pointer"
                >
                  Create host session &rarr;
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Sub-second WebSockets
              </span>
              <span>&bull;</span>
              <span>100% Free &amp; Unlimited</span>
              <span>&bull;</span>
              <span>No App Required</span>
            </div>
          </div>

          {/* Hero Right Column: The Working Product Performs (Dual-Screen Simulator) */}
          <div
            id="simulator"
            data-ui
            className="lg:col-span-7 bg-[#121720] rounded-2xl border border-white/[0.08] overflow-hidden"
          >
            {/* Simulator Stage Header */}
            <div className="px-5 py-3 bg-[#161E2C] border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span className="text-xs font-medium text-white">Live Simulator</span>
                <span className="text-xs text-slate-400 tabular-nums">PIN 123-456-789</span>
              </div>
              <span className="text-xs text-slate-400 tabular-nums">
                {totalHeroVotes} votes recorded
              </span>
            </div>

            {/* Split Screen Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]"> {/* taste-skill-ignore */}
              {/* Left: Stage Projector Display (7 Cols) */}
              <div className="md:col-span-7 p-6 space-y-6">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">
                    Stage Screen &bull; Poll #1
                  </span>
                  <h3 className="text-base font-semibold text-white leading-snug">
                    Which architecture pattern should our engineering team prioritize for Q4?
                  </h3>
                </div>

                {/* Live Bar Chart */}
                <div className="space-y-3">
                  {heroVotes.map(opt => {
                    const pct = Math.round((opt.votes / totalHeroVotes) * 100);
                    const isLeading = opt.id === 'opt-a';

                    return (
                      <div key={opt.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-200 flex items-center gap-2">
                            <span className="w-4 h-4 rounded bg-white/10 text-white flex items-center justify-center text-[10px] font-bold">
                              {opt.label}
                            </span>
                            <span className="truncate max-w-[210px]">{opt.text}</span>
                            {isLeading && (
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1 rounded">
                                Leading
                              </span>
                            )}
                          </span>
                          <span className="text-slate-400 tabular-nums">
                            <strong className="text-white">{pct}%</strong> ({opt.votes})
                          </span>
                        </div>

                        <div className="h-2 w-full rounded bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded bg-white transition-all duration-300 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-500"> {/* taste-skill-ignore */}
                  <span>Press Space to advance poll</span>
                  <span className="tabular-nums">Audience sync: 42ms</span>
                </div>
              </div>

              {/* Right: Attendee Phone Vote Card (5 Cols) */}
              <div className="md:col-span-5 p-6 bg-[#0E131B] flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Smartphone size={13} className="text-emerald-400" />
                      Attendee Phone
                    </span>
                    <span className="text-[11px] text-slate-400">Click to vote</span>
                  </div>

                  <div className="space-y-2">
                    {heroVotes.map(opt => {
                      const isSelected = selectedHeroVote === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleHeroVote(opt.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded border text-xs text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-white text-[#0A0D12] border-white font-semibold'
                              : 'bg-[#121720] border-white/[0.08] text-slate-300 hover:bg-[#171F2C]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                                isSelected ? 'bg-[#0A0D12] text-white' : 'bg-white/10 text-slate-300'
                              }`}
                            >
                              {opt.label}
                            </span>
                            <span className="truncate max-w-[150px]">{opt.text}</span>
                          </div>
                          {isSelected && <Check size={14} className="shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-normal">
                  Attendees scan the stage QR code or visit the URL on any browser. No account sign-up.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities: Real Working Interface Fragments (5/7 Row Sequences) */}
      <section id="capabilities" className="py-24 px-6 max-w-7xl mx-auto space-y-20">
        <div>
          <span className="text-xs text-slate-400 font-medium block mb-2">
            Platform Capabilities
          </span>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Built for high-stakes presentations.
          </h2>
        </div>

        {/* Capability 1: Dynamic Word Cloud & Rating Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-2xl font-bold text-white">
              Dynamic word clouds that scale as the room speaks.
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Ask open-ended questions like &quot;What is our biggest bottleneck?&quot; or &quot;Describe our product in one word.&quot; Words cluster and resize dynamically as repeated terms arrive from the crowd.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <div>&bull; Instant deduplication &amp; frequency weighting</div>
              <div>&bull; Profanity filtering &amp; host word moderation</div>
              <div>&bull; Paired 5-star satisfaction breakdown</div>
            </div>
          </div>

          <div data-ui className="lg:col-span-7 p-6 rounded-2xl bg-[#121720] border border-white/[0.08] space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]"> {/* taste-skill-ignore */}
              <span className="text-xs font-semibold text-white">
                Live Cloud &amp; Rating Preview
              </span>
              <span className="text-xs text-slate-400 tabular-nums">312 submissions</span>
            </div>

            {/* Live Word Cloud Display */}
            <div className="p-6 rounded-xl bg-[#0A0D12] border border-white/[0.06] flex flex-wrap items-center justify-center gap-4 min-h-[140px]">
              {cloudWords.map((cw, idx) => (
                <span
                  key={idx}
                  className={`${cw.size} transition-all duration-300 hover:text-white cursor-default`}
                >
                  {cw.text}
                </span>
              ))}
            </div>

            {/* Interactive Word Submitter & Star Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <form onSubmit={handleAddCloudWord} className="space-y-1.5">
                <span className="text-[11px] text-slate-400">Add test word to cloud:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newWordInput}
                    onChange={e => setNewWordInput(e.target.value)}
                    placeholder="e.g. Scalability"
                    className="flex-1 bg-[#0A0D12] border border-white/[0.12] rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium text-[#0A0D12] bg-white rounded cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </form>

              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400">Cast test 5-star rating:</span>
                <div className="flex items-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      className="p-1 text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Star
                        size={18}
                        className={star <= selectedRating ? 'text-amber-400 fill-amber-400' : ''}
                      />
                    </button>
                  ))}
                  <span className="text-xs tabular-nums text-white ml-2">
                    {selectedRating}.0 / 5.0 (98% approval)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Capability 2: Live Anonymous Q&A Moderation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div data-ui className="lg:col-span-7 p-6 rounded-2xl bg-[#121720] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]"> {/* taste-skill-ignore */}
              <span className="text-xs font-semibold text-white">
                Live Q&amp;A Feed &bull; Top Questions First
              </span>
              <span className="text-xs text-slate-400">Sorted by Upvotes</span>
            </div>

            <div className="space-y-2.5">
              {qaItems.map(item => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[#0A0D12] border border-white/[0.06] flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-white leading-relaxed">
                      {item.question}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>{item.author}</span>
                      {item.answered && (
                        <span className="text-emerald-400 font-medium">
                          &bull; Answered on stage
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleQaUpvote(item.id)}
                    className={`px-2.5 py-1.5 rounded border text-xs tabular-nums font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                      item.upvoted
                        ? 'bg-white text-[#0A0D12] border-white'
                        : 'bg-[#121720] text-slate-300 border-white/[0.1] hover:bg-[#171F2C]'
                    }`}
                  >
                    <span>▲</span>
                    <span>{item.votes}</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Presenter can archive, pin, or highlight questions in real time</span>
              <span>Anonymous submission supported</span>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-2xl font-bold text-white">
              Crowdsourced Q&amp;A that brings real transparency.
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              In company all-hands or town halls, employees hesitate to ask tough questions out loud. SURV lets attendees post anonymously and upvote pressing topics, ensuring leaders address what the room actually wants answered.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <div>&bull; Anonymous or attributed submissions</div>
              <div>&bull; 1-click presenter spotlight toggle</div>
              <div>&bull; Real-time duplicate moderation</div>
            </div>
          </div>
        </div>

        {/* Capability 3: Google Gemini AI Quiz Synthesis */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-2xl font-bold text-white">
              Synthesize complete quizzes with Google Gemini AI.
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Don&apos;t spend hours formatting quiz slides before a lecture or training session. Provide a single subject or lecture outline, and the built-in Gemini engine constructs complete questions, believable distractors, and correct answers in seconds.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <div>&bull; Free Google Gemini API integration</div>
              <div>&bull; Automated multiple-choice options with explanations</div>
              <div>&bull; Timed gamified quiz mode with podium celebration</div>
            </div>
          </div>

          <div data-ui className="lg:col-span-7 p-6 rounded-2xl bg-[#121720] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]"> {/* taste-skill-ignore */}
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Sparkles size={14} className="text-white" />
                Gemini AI Generator Panel
              </span>
              <span className="text-xs text-slate-400">Zero API Cost</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={aiTopic}
                onChange={e => setAiTopic(e.target.value)}
                placeholder="Topic: System Design, Kubernetes..."
                className="flex-1 bg-[#0A0D12] border border-white/[0.12] rounded px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-white"
              />
              <button
                type="button"
                onClick={handleGenerateAiSample}
                disabled={isGeneratingAi}
                className="px-4 py-2 text-xs font-semibold text-[#0A0D12] bg-white hover:bg-slate-200 rounded cursor-pointer transition-colors whitespace-nowrap"
              >
                {isGeneratingAi ? 'Synthesizing...' : 'Generate Sample'}
              </button>
            </div>

            {/* Generated Sample Card */}
            <div className="p-4 rounded-xl bg-[#0A0D12] border border-white/[0.06] space-y-3">
              <span className="text-[11px] text-slate-500">
                Synthesized Question (30s Timer):
              </span>
              <h4 className="text-xs font-semibold text-white">
                {aiQuizPreview.question}
              </h4>

              <div className="space-y-1.5 pt-1">
                {aiQuizPreview.options.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    className={`p-2 rounded text-xs flex items-center justify-between ${
                      opt.correct
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium'
                        : 'bg-[#121720] text-slate-400'
                    }`}
                  >
                    <span>{opt.text}</span>
                    {opt.correct && (
                      <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">
                        Correct Answer
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions / Use Cases */}
      <section id="solutions" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="mb-12">
          <span className="text-xs text-slate-400 font-medium block mb-2">
            Proven Environments
          </span>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Engineered for every audience size.
          </h2>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 mb-8">
          {USE_CASES.map((uc, idx) => (
            <button
              key={uc.id}
              onClick={() => setActiveUseCase(idx)}
              className={`px-4 py-2 text-xs font-medium rounded transition-colors cursor-pointer ${
                activeUseCase === idx
                  ? 'bg-white text-[#0A0D12]'
                  : 'bg-[#121720] text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {uc.title}
            </button>
          ))}
        </div>

        {/* Selected Environment Breakdown */}
        <div className="p-8 rounded-2xl bg-[#121720] border border-white/[0.08] grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <span className="text-xs text-slate-400">
              Scope: {USE_CASES[activeUseCase].scope}
            </span>
            <h3 className="text-2xl font-bold text-white">
              {USE_CASES[activeUseCase].claim}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {USE_CASES[activeUseCase].description}
            </p>
          </div>

          <div className="md:col-span-5 space-y-2.5">
            {USE_CASES[activeUseCase].specs.map((spec, sIdx) => (
              <div
                key={sIdx}
                className="p-3 rounded-lg bg-[#0A0D12] border border-white/[0.06] flex items-center gap-3 text-xs text-slate-200"
              >
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>{spec}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Guarantee: Transparent Comparison Table */}
      <section id="guarantee" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="mb-12">
          <span className="text-xs text-slate-400 font-medium block mb-2">
            The Free Platform Guarantee
          </span>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Zero paywalls. No participant caps.
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl">
            Commercial tools charge hundreds per host every month for basic features. SURV is built on modern serverless architecture and is free forever.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* SURV Card */}
          <div className="p-8 rounded-2xl bg-[#121720] border-2 border-white flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">SURV Platform</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  100% Free Forever
                </span>
              </div>

              <div>
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-xs text-slate-400 ml-2">/ host / month</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check size={15} className="text-emerald-400 shrink-0" />
                  <span>Unlimited live participants per session</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={15} className="text-emerald-400 shrink-0" />
                  <span>Google Gemini AI quiz question generation included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={15} className="text-emerald-400 shrink-0" />
                  <span>Dynamic word clouds &amp; 5-star satisfaction visualizers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={15} className="text-emerald-400 shrink-0" />
                  <span>Live Q&amp;A crowdsourced upvoting &amp; host moderation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={15} className="text-emerald-400 shrink-0" />
                  <span>Raw session data export (JSON &amp; CSV) without fees</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={15} className="text-emerald-400 shrink-0" />
                  <span>Zero account requirement for participants</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => router.push('/host')}
              className="mt-8 w-full py-3 text-xs font-semibold text-[#0A0D12] bg-white hover:bg-slate-200 rounded transition-colors cursor-pointer"
            >
              Start Free Session Now
            </button>
          </div>

          {/* Legacy Commercial Tools Card */}
          <div className="p-8 rounded-2xl bg-[#121720] border border-white/[0.08] flex flex-col justify-between opacity-80">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">
                  Legacy Commercial Tools (Vevox / Slido)
                </span>
                <span className="text-xs text-slate-500">Commercial Tier</span>
              </div>

              <div>
                <span className="text-4xl font-bold text-slate-400">$99+</span>
                <span className="text-xs text-slate-500 ml-2">/ host / month</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="text-rose-400 font-bold">&times;</span>
                  <span>Free tier restricted to 100 participants</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-400 font-bold">&times;</span>
                  <span>AI question generation locked to enterprise tiers</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-400 font-bold">&times;</span>
                  <span>Poll limits per event on free accounts</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-400 font-bold">&times;</span>
                  <span>Data export locked behind paid subscription tiers</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-400 font-bold">&times;</span>
                  <span>Upgrade prompts displayed to attendees</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-white/[0.06] text-xs text-slate-500 text-center"> {/* taste-skill-ignore */}
              Self-host or run on generous free-tier cloud infrastructure.
            </div>
          </div>
        </div>
      </section>

      {/* CTA: First Step Already Open (Dealt Blueprint) */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              Create your session in five seconds.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Name your session and launch immediately. No credit card, no sign-up forms, no software installs.
            </p>
          </div>

          <div data-ui className="lg:col-span-7 p-8 rounded-2xl bg-[#121720] border border-white/[0.08] space-y-5">
            <span className="text-xs font-semibold text-white block">
              Session Configuration
            </span>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 block font-medium">
                Session Name
              </label>
              <input
                type="text"
                value={createTitle}
                onChange={e => setCreateTitle(e.target.value)}
                className="w-full bg-[#0A0D12] border border-white/[0.12] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 block font-medium">
                Primary Engagement Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'polls', label: 'Live Polls' },
                  { id: 'quiz', label: 'AI Quiz Battle' },
                  { id: 'qa', label: 'Live Q&A' },
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setCreateMode(mode.id as any)}
                    className={`py-2 px-3 rounded text-xs font-medium transition-colors cursor-pointer text-center ${
                      createMode === mode.id
                        ? 'bg-white text-[#0A0D12]'
                        : 'bg-[#0A0D12] text-slate-300 border border-white/[0.08] hover:bg-[#161E2C]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleLaunchSession}
              className="w-full py-3 text-xs font-semibold text-[#0A0D12] bg-white hover:bg-slate-200 rounded flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>Launch Session Dashboard</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer: Single Quiet Line (Dealt Blueprint) */}
      <footer className="py-12 px-6 max-w-7xl mx-auto text-xs text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-semibold text-white">SURV</span>
            <span>&bull;</span>
            <span>Live audience engagement platform</span>
          </div>

          <div className="flex items-center gap-6">
            <span
              className="hover:text-white cursor-pointer transition-colors"
              onClick={() => router.push('/host')}
            >
              Host Command Center
            </span>
            <span
              className="hover:text-white cursor-pointer transition-colors"
              onClick={() => router.push('/present/123-456-789')}
            >
              Stage Projector
            </span>
            <span
              className="hover:text-white cursor-pointer transition-colors"
              onClick={() => router.push('/app/123-456-789')}
            >
              Participant View
            </span>
          </div>

          <div className="text-slate-500">
            &copy; 2026 &bull; Free &amp; Open Platform
          </div>
        </div>
      </footer>
    </div>
  );
}
