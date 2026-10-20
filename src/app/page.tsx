'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Monitor,
  Check,
  Smartphone,
  Sparkles,
  MessageSquare,
  BarChart3,
  Star,
  Users,
  Radio,
  Menu,
} from 'lucide-react';
import { initializeStore, createRoom } from '@/lib/store';

// Live interactive hero poll options
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

  // Live Interactive Capability 1: Word Cloud & Rating Simulator
  const [cloudWords, setCloudWords] = useState([
    { text: 'Low Latency', count: 48, size: 'text-2xl font-semibold text-[#181F1C]' },
    { text: 'WebSockets', count: 39, size: 'text-xl font-medium text-[#2D4A3E]' },
    { text: 'Zero App', count: 34, size: 'text-lg font-medium text-[#5F665E]' },
    { text: 'Instant QR', count: 28, size: 'text-base text-[#8C9188]' },
    { text: 'Anonymous', count: 24, size: 'text-sm text-[#8C9188]' },
    { text: 'Open Source', count: 21, size: 'text-xs text-[#5F665E]' },
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
    setHeroVotes(prev =>
      prev.map(opt => (opt.id === optId ? { ...opt, votes: opt.votes + 1 } : opt))
    );
  };

  const handleAddCloudWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordInput.trim()) return;
    const clean = newWordInput.trim();
    setCloudWords(prev => [
      { text: clean, count: 18, size: 'text-xl font-semibold text-[#181F1C]' },
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
    const tType = createMode === 'quiz' ? 'quiz' : createMode === 'qa' ? 'townhall' : 'blank';
    const newRoom = createRoom({
      title: createTitle.trim() || 'Interactive Keynote Session',
      template: tType,
    });
    router.push(`/host/${newRoom.pin}`);
  };

  const totalHeroVotes = heroVotes.reduce((acc, curr) => acc + curr.votes, 0);

  return (
    <div className="min-h-[100svh] bg-[#283E34] p-2 sm:p-4 text-[#181F1C]">
      {/* Outer framing container matching the fintech template */}
      <div className="bg-[#E6E5DC] rounded-2xl sm:rounded-3xl min-h-[calc(100svh-1rem)] sm:min-h-[calc(100svh-2rem)] flex flex-col justify-between overflow-hidden">
        
        {/* Top Navbar */}
        <header className="px-6 sm:px-10 py-5 flex items-center justify-between border-b border-[#D5D4CB]/60"> {/* taste-skill-ignore */}
          {/* Logo Group */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center gap-2 cursor-pointer bg-[#DFDDD3] hover:bg-[#D7D5CB] px-3 py-1.5 rounded-lg border border-[#D0CEC4] transition-colors"
              onClick={() => router.push('/')}
            >
              <div className="w-5 h-5 rounded bg-[#181F1C] text-[#E6E5DC] flex items-center justify-center">
                <Sparkles size={12} />
              </div>
              <span className="text-base font-semibold tracking-tight text-[#181F1C]">
                surv<span className="text-[#2D4A3E]">.</span>
              </span>
            </div>

            <button
              onClick={() => router.push('/host')}
              className="w-8 h-8 rounded-lg bg-[#2D4A3E] text-white flex items-center justify-center hover:bg-[#233B31] transition-colors cursor-pointer"
              title="Host Controls"
            >
              <Menu size={16} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#5F665E]">
            <a href="#simulator" className="hover:text-[#181F1C] transition-colors">
              Live Showcase
            </a>
            <a href="#capabilities" className="hover:text-[#181F1C] transition-colors">
              Capabilities
            </a>
            <a href="#solutions" className="hover:text-[#181F1C] transition-colors">
              Solutions
            </a>
            <a href="#guarantee" className="hover:text-[#181F1C] transition-colors">
              Free Platform
            </a>
          </nav>

          {/* Navbar Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/present')}
              className="px-4 py-2 text-sm font-medium text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg transition-colors cursor-pointer"
            >
              Stage Screen
            </button>
            <button
              onClick={() => router.push('/host')}
              className="px-4 py-2 text-sm font-medium text-[#181F1C] bg-white hover:bg-[#F5F4EE] rounded-lg border border-[#D0CEC4] transition-colors cursor-pointer"
            >
              Start Session
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-14 pb-16 px-6 max-w-5xl mx-auto text-center">
          {/* Trust Badge with Orange Checkbox from Template */}
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#181F1C] mb-6">
            <span className="text-[#5F665E]">Trusted by</span>
            <span className="w-4 h-4 rounded bg-[#EA580C] text-white flex items-center justify-center">
              <Check size={11} strokeWidth={3} />
            </span>
            <span className="font-semibold text-[#181F1C]">4,000+ interactive sessions</span>
          </div>

          {/* Editorial Headline with Two-Tone Muted Phrase */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-[-0.035em] leading-[1.06] text-[#181F1C] mb-6">
            Engage the room <br />
            <span className="text-[#8C9188]">in a single</span> keynote
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#5F665E] max-w-xl mx-auto leading-relaxed mb-8">
            Reconcile questions, live word clouds, and instant attendee polls from one calm workspace. Zero app downloads, zero logins.
          </p>

          {/* Action Button Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <button
              onClick={() => router.push('/host')}
              className="px-6 py-3.5 text-sm font-medium text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg cursor-pointer transition-colors"
            >
              Start free session
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('join-box');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 text-sm font-medium text-[#181F1C] bg-white hover:bg-[#F5F4EE] rounded-lg border border-[#D0CEC4] cursor-pointer transition-colors"
            >
              Join with PIN
            </button>
          </div>

          {/* Direct PIN Input Inset */}
          <div id="join-box" className="max-w-md mx-auto p-2 rounded-xl bg-[#DFDDD3] border border-[#D0CEC4] space-y-2">
            <form onSubmit={handleJoin} className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={pinInput}
                onChange={handlePinChange}
                placeholder="Enter 9-digit PIN (123-456-789)"
                className="flex-1 bg-[#EBEAE3] border border-[#D0CEC4] rounded-lg px-3 py-2 text-sm tabular-nums text-[#181F1C] placeholder-[#8C9188] focus:outline-none focus:border-[#2D4A3E] transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Join</span>
                <ArrowRight size={13} />
              </button>
            </form>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
            )}
          </div>
        </section>

        {/* Live Simulator: The Product Performs (Satin Device & Dual-Screen Layout) */}
        <section id="simulator" className="py-8 px-6 max-w-6xl mx-auto w-full">
          {/* Circuit Board Header with Satin Node */}
          <div className="relative mb-6 flex flex-col items-center">
            {/* Ambient Satin Center Node from Template */}
            <div className="w-24 h-24 rounded-3xl bg-[#DFDDD3] border border-[#D0CEC4] flex items-center justify-center relative z-10">
              <div className="text-[#181F1C]"><Sparkles size={28} /></div>
              <div className="absolute -bottom-3 px-3 py-0.5 rounded-full bg-white border border-[#D0CEC4] text-[11px] font-medium text-[#181F1C] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                <span>Auto-sync &bull; live</span>
              </div>
            </div>
          </div>

          {/* Dual-Screen Working Simulator */}
          <div
            data-ui
            className="rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] overflow-hidden"
          >
            {/* Simulator Header */}
            <div className="px-6 py-3.5 bg-[#D7D5CB] border-b border-[#D0CEC4] flex items-center justify-between"> {/* taste-skill-ignore */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#181F1C]">
                  Live Stage Projection
                </span>
                <span className="text-xs text-[#5F665E] tabular-nums">
                  PIN: 123-456-789
                </span>
              </div>
              <span className="text-xs text-[#5F665E] tabular-nums font-medium">
                {totalHeroVotes} votes recorded
              </span>
            </div>

            {/* Split Screen Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#D0CEC4]"> {/* taste-skill-ignore */}
              {/* Left: Stage Projector (7 Cols) */}
              <div className="md:col-span-7 p-6 sm:p-8 space-y-6 bg-[#E6E5DC]">
                <div>
                  <span className="text-xs font-medium text-[#5F665E] block mb-1">
                    Question 1 of 4 &bull; Active Poll
                  </span>
                  <h3 className="text-lg font-semibold text-[#181F1C] leading-snug">
                    Which architecture pattern should our engineering team prioritize for Q4?
                  </h3>
                </div>

                {/* Animated Poll Bars */}
                <div className="space-y-3">
                  {heroVotes.map(opt => {
                    const pct = Math.round((opt.votes / totalHeroVotes) * 100);
                    const isLeading = opt.id === 'opt-a';

                    return (
                      <div key={opt.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-[#181F1C] flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-white border border-[#D0CEC4] text-[#181F1C] flex items-center justify-center text-[10px] font-bold">
                              {opt.label}
                            </span>
                            <span className="truncate max-w-[220px]">{opt.text}</span>
                            {isLeading && (
                              <span className="text-[10px] text-[#2D4A3E] bg-[#2D4A3E]/10 px-1.5 py-0.5 rounded font-semibold">
                                Leading
                              </span>
                            )}
                          </span>
                          <span className="text-[#5F665E] tabular-nums">
                            <strong className="text-[#181F1C]">{pct}%</strong> ({opt.votes})
                          </span>
                        </div>

                        <div className="h-2.5 w-full rounded bg-[#D7D5CB] overflow-hidden">
                          <div
                            className="h-full rounded bg-[#2D4A3E] transition-[width] duration-300 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-[#D0CEC4] flex items-center justify-between text-xs text-[#5F665E]"> {/* taste-skill-ignore */}
                  <span>Press Space to advance poll</span>
                  <span className="tabular-nums font-medium">WebSocket sync: 42ms</span>
                </div>
              </div>

              {/* Right: Attendee Phone Vote Card (5 Cols) */}
              <div className="md:col-span-5 p-6 sm:p-8 bg-[#DFDDD3] flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#181F1C] flex items-center gap-1.5">
                      <Smartphone size={14} className="text-[#2D4A3E]" />
                      Attendee Phone Screen
                    </span>
                    <span className="text-[11px] text-[#5F665E]">Click to vote</span>
                  </div>

                  <div className="space-y-2">
                    {heroVotes.map(opt => {
                      const isSelected = selectedHeroVote === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleHeroVote(opt.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border text-xs text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-white text-[#181F1C] border-[#2D4A3E] font-semibold'
                              : 'bg-[#E6E5DC] border-[#D0CEC4] text-[#181F1C] hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                                isSelected ? 'bg-[#2D4A3E] text-white' : 'bg-[#D7D5CB] text-[#5F665E]'
                              }`}
                            >
                              {opt.label}
                            </span>
                            <span className="truncate max-w-[170px]">{opt.text}</span>
                          </div>
                          {isSelected && <Check size={14} className="text-[#2D4A3E] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-[11px] text-[#5F665E] leading-normal">
                  Attendees scan the room QR code or enter the URL in any browser. No account sign-up required.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities (5/7 Row Sequence in Calm Fintech Aesthetic) */}
        <section id="capabilities" className="py-24 px-6 max-w-6xl mx-auto space-y-20">
          <div>
            <span className="text-xs text-[#5F665E] font-medium block mb-2">
              Platform Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#181F1C] tracking-tight">
              Calm, resilient audience engagement.
            </h2>
          </div>

          {/* Capability 1: Dynamic Word Cloud & Rating Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-2xl font-semibold text-[#181F1C]">
                Dynamic word clouds that scale as the room speaks.
              </h3>
              <p className="text-sm text-[#5F665E] leading-relaxed">
                Ask open-ended questions like &quot;What is our biggest bottleneck?&quot; Words cluster and resize dynamically as repeated terms arrive from the crowd.
              </p>
              <div className="pt-2 text-xs text-[#5F665E] space-y-1">
                <div>&bull; Instant deduplication &amp; frequency weighting</div>
                <div>&bull; Profanity filtering &amp; host word moderation</div>
                <div>&bull; Paired 5-star satisfaction breakdown</div>
              </div>
            </div>

            <div data-ui className="lg:col-span-7 p-6 rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#D0CEC4]"> {/* taste-skill-ignore */}
                <span className="text-xs font-semibold text-[#181F1C]">
                  Live Cloud &amp; Rating Preview
                </span>
                <span className="text-xs text-[#5F665E] tabular-nums">312 submissions</span>
              </div>

              {/* Word Cloud Surface */}
              <div className="p-6 rounded-xl bg-white border border-[#D0CEC4] flex flex-wrap items-center justify-center gap-4 min-h-[140px]">
                {cloudWords.map((cw, idx) => (
                  <span
                    key={idx}
                    className={`${cw.size} transition-colors duration-200 hover:text-[#2D4A3E] cursor-default`}
                  >
                    {cw.text}
                  </span>
                ))}
              </div>

              {/* Submitter & Star Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <form onSubmit={handleAddCloudWord} className="space-y-1.5">
                  <span className="text-[11px] text-[#5F665E] font-medium">Add test word to cloud:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newWordInput}
                      onChange={e => setNewWordInput(e.target.value)}
                      placeholder="e.g. Scalability"
                      className="flex-1 bg-[#E6E5DC] border border-[#D0CEC4] rounded-lg px-2.5 py-1.5 text-xs text-[#181F1C] placeholder-[#8C9188] focus:outline-none focus:border-[#2D4A3E]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2D4A3E] rounded-lg cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </form>

                <div className="space-y-1.5">
                  <span className="text-[11px] text-[#5F665E] font-medium">Cast test 5-star rating:</span>
                  <div className="flex items-center gap-1.5 py-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSelectedRating(star)}
                        className="p-1 text-[#D0CEC4] hover:text-[#EA580C] transition-colors cursor-pointer"
                      >
                        <Star
                          size={18}
                          className={star <= selectedRating ? 'text-[#EA580C] fill-[#EA580C]' : ''}
                        />
                      </button>
                    ))}
                    <span className="text-xs tabular-nums text-[#181F1C] font-semibold ml-2">
                      {selectedRating}.0 / 5.0 (98% approval)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 2: Live Anonymous Q&A Moderation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div data-ui className="lg:col-span-7 p-6 rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#D0CEC4]"> {/* taste-skill-ignore */}
                <span className="text-xs font-semibold text-[#181F1C]">
                  Live Q&amp;A Feed &bull; Top Questions First
                </span>
                <span className="text-xs text-[#5F665E]">Sorted by Upvotes</span>
              </div>

              <div className="space-y-2.5">
                {qaItems.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-white border border-[#D0CEC4] flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-[#181F1C] leading-relaxed">
                        {item.question}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-[#5F665E]">
                        <span>{item.author}</span>
                        {item.answered && (
                          <span className="text-[#2D4A3E] font-semibold">
                            &bull; Answered on stage
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleQaUpvote(item.id)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs tabular-nums font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                        item.upvoted
                          ? 'bg-[#2D4A3E] text-white border-[#2D4A3E]'
                          : 'bg-[#E6E5DC] text-[#181F1C] border-[#D0CEC4] hover:bg-white'
                      }`}
                    >
                      <span>▲</span>
                      <span>{item.votes}</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-[#5F665E]">
                <span>Presenter can pin, archive, or highlight questions</span>
                <span>Anonymous submission supported</span>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-2xl font-semibold text-[#181F1C]">
                Crowdsourced Q&amp;A that brings real transparency.
              </h3>
              <p className="text-sm text-[#5F665E] leading-relaxed">
                In company all-hands or town halls, employees hesitate to ask tough questions out loud. SURV lets attendees post anonymously and upvote pressing topics, ensuring leaders address what the room actually wants answered.
              </p>
              <div className="pt-2 text-xs text-[#5F665E] space-y-1">
                <div>&bull; Anonymous or attributed submissions</div>
                <div>&bull; 1-click presenter spotlight toggle</div>
                <div>&bull; Real-time duplicate moderation</div>
              </div>
            </div>
          </div>

          {/* Capability 3: Google Gemini AI Quiz Synthesis */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-2xl font-semibold text-[#181F1C]">
                Synthesize complete quizzes with Google Gemini AI.
              </h3>
              <p className="text-sm text-[#5F665E] leading-relaxed">
                Don&apos;t spend hours formatting quiz slides before a lecture or training session. Provide a single subject or lecture outline, and the built-in Gemini engine constructs complete questions, believable distractors, and correct answers in seconds.
              </p>
              <div className="pt-2 text-xs text-[#5F665E] space-y-1">
                <div>&bull; Free Google Gemini API integration</div>
                <div>&bull; Automated multiple-choice options with explanations</div>
                <div>&bull; Timed gamified quiz mode with podium celebration</div>
              </div>
            </div>

            <div data-ui className="lg:col-span-7 p-6 rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#D0CEC4]"> {/* taste-skill-ignore */}
                <span className="text-xs font-semibold text-[#181F1C] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#EA580C]" />
                  Gemini AI Generator Panel
                </span>
                <span className="text-xs text-[#5F665E]">Zero API Cost</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  placeholder="Topic: System Design, Kubernetes..."
                  className="flex-1 bg-[#E6E5DC] border border-[#D0CEC4] rounded-lg px-3 py-2 text-xs text-[#181F1C] placeholder-[#8C9188] focus:outline-none focus:border-[#2D4A3E]"
                />
                <button
                  type="button"
                  onClick={handleGenerateAiSample}
                  disabled={isGeneratingAi}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg cursor-pointer transition-colors whitespace-nowrap"
                >
                  {isGeneratingAi ? 'Synthesizing...' : 'Generate Sample'}
                </button>
              </div>

              {/* Generated Sample Card */}
              <div className="p-4 rounded-xl bg-white border border-[#D0CEC4] space-y-3">
                <span className="text-[11px] text-[#5F665E]">
                  Synthesized Question (30s Timer):
                </span>
                <h4 className="text-xs font-semibold text-[#181F1C]">
                  {aiQuizPreview.question}
                </h4>

                <div className="space-y-1.5 pt-1">
                  {aiQuizPreview.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-2 rounded-lg text-xs flex items-center justify-between ${
                        opt.correct
                          ? 'bg-[#2D4A3E]/10 border border-[#2D4A3E]/30 text-[#2D4A3E] font-semibold'
                          : 'bg-[#E6E5DC] text-[#5F665E]'
                      }`}
                    >
                      <span>{opt.text}</span>
                      {opt.correct && (
                        <span className="text-[10px] bg-[#2D4A3E] text-white px-1.5 py-0.5 rounded font-semibold">
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

        {/* Solutions & Use Cases */}
        <section id="solutions" className="py-24 px-6 max-w-6xl mx-auto">
          <div className="mb-12">
            <span className="text-xs text-[#5F665E] font-medium block mb-2">
              Proven Environments
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#181F1C] tracking-tight">
              Engineered for every audience size.
            </h2>
          </div>

          {/* Tab Selection */}
          <div className="flex flex-wrap gap-2 mb-8">
            {USE_CASES.map((uc, idx) => (
              <button
                key={uc.id}
                onClick={() => setActiveUseCase(idx)}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeUseCase === idx
                    ? 'bg-[#2D4A3E] text-white font-semibold'
                    : 'bg-[#DFDDD3] text-[#5F665E] hover:text-[#181F1C] border border-[#D0CEC4]'
                }`}
              >
                {uc.title}
              </button>
            ))}
          </div>

          {/* Selected Environment Breakdown */}
          <div className="p-8 rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-4">
              <span className="text-xs text-[#5F665E]">
                Scope: {USE_CASES[activeUseCase].scope}
              </span>
              <h3 className="text-2xl font-semibold text-[#181F1C]">
                {USE_CASES[activeUseCase].claim}
              </h3>
              <p className="text-sm text-[#5F665E] leading-relaxed">
                {USE_CASES[activeUseCase].description}
              </p>
            </div>

            <div className="md:col-span-5 space-y-2.5">
              {USE_CASES[activeUseCase].specs.map((spec, sIdx) => (
                <div
                  key={sIdx}
                  className="p-3 rounded-lg bg-white border border-[#D0CEC4] flex items-center gap-3 text-xs text-[#181F1C] font-medium"
                >
                  <Check size={14} className="text-[#2D4A3E] shrink-0" />
                  <span>{spec}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Free Guarantee Comparison */}
        <section id="guarantee" className="py-24 px-6 max-w-6xl mx-auto">
          <div className="mb-12">
            <span className="text-xs text-[#5F665E] font-medium block mb-2">
              The Free Platform Guarantee
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#181F1C] tracking-tight">
              Zero paywalls. No participant caps.
            </h2>
            <p className="text-sm text-[#5F665E] mt-2 max-w-xl">
              Commercial tools charge hundreds per host every month for basic features. SURV is built on modern serverless architecture and is free forever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* SURV Card */}
            <div className="p-8 rounded-2xl bg-white border-2 border-[#2D4A3E] flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#181F1C]">SURV Platform</span>
                  <span className="text-xs font-semibold text-[#2D4A3E] bg-[#2D4A3E]/10 px-2 py-0.5 rounded">
                    100% Free Forever
                  </span>
                </div>

                <div>
                  <span className="text-4xl font-bold text-[#181F1C]">$0</span>
                  <span className="text-xs text-[#5F665E] ml-2">/ host / month</span>
                </div>

                <ul className="space-y-3 text-xs text-[#181F1C]">
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-[#2D4A3E] shrink-0" />
                    <span>Unlimited live participants per session</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-[#2D4A3E] shrink-0" />
                    <span>Google Gemini AI quiz question generation included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-[#2D4A3E] shrink-0" />
                    <span>Dynamic word clouds &amp; 5-star satisfaction visualizers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-[#2D4A3E] shrink-0" />
                    <span>Live Q&amp;A crowdsourced upvoting &amp; host moderation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-[#2D4A3E] shrink-0" />
                    <span>Raw session data export (JSON &amp; CSV) without fees</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-[#2D4A3E] shrink-0" />
                    <span>Zero account requirement for participants</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => router.push('/host')}
                className="mt-8 w-full py-3 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg transition-colors cursor-pointer"
              >
                Start Free Session Now
              </button>
            </div>

            {/* Legacy Commercial Tools Card */}
            <div className="p-8 rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] flex flex-col justify-between opacity-85">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#181F1C]">
                    Legacy Commercial Tools (Vevox / Slido)
                  </span>
                  <span className="text-xs text-[#5F665E]">Commercial Tier</span>
                </div>

                <div>
                  <span className="text-4xl font-bold text-[#5F665E]">$99+</span>
                  <span className="text-xs text-[#5F665E] ml-2">/ host / month</span>
                </div>

                <ul className="space-y-3 text-xs text-[#5F665E]">
                  <li className="flex items-center gap-2">
                    <span className="text-rose-600 font-bold">&times;</span>
                    <span>Free tier restricted to 100 participants</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-rose-600 font-bold">&times;</span>
                    <span>AI question generation locked to enterprise tiers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-rose-600 font-bold">&times;</span>
                    <span>Poll limits per event on free accounts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-rose-600 font-bold">&times;</span>
                    <span>Data export locked behind paid subscription tiers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-rose-600 font-bold">&times;</span>
                    <span>Upgrade prompts displayed to attendees</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-[#D0CEC4] text-xs text-[#5F665E] text-center"> {/* taste-skill-ignore */}
                Self-host or run on generous free-tier cloud infrastructure.
              </div>
            </div>
          </div>
        </section>

        {/* CTA: First Step Already Open */}
        <section className="py-24 px-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <h2 className="text-3xl sm:text-4xl font-semibold text-[#181F1C] tracking-tight leading-tight">
                Create your session in five seconds.
              </h2>
              <p className="text-sm text-[#5F665E] leading-relaxed">
                Name your session and launch immediately. No credit card, no sign-up forms, no software installs.
              </p>
            </div>

            <div data-ui className="lg:col-span-7 p-8 rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] space-y-5">
              <span className="text-xs font-semibold text-[#181F1C] block">
                Session Configuration
              </span>

              <div className="space-y-2">
                <label className="text-xs text-[#5F665E] block font-medium">
                  Session Name
                </label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={e => setCreateTitle(e.target.value)}
                  className="w-full bg-[#E6E5DC] border border-[#D0CEC4] rounded-lg px-3 py-2 text-sm text-[#181F1C] focus:outline-none focus:border-[#2D4A3E] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[#5F665E] block font-medium">
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
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center ${
                        createMode === mode.id
                          ? 'bg-[#2D4A3E] text-white'
                          : 'bg-[#E6E5DC] text-[#181F1C] border border-[#D0CEC4] hover:bg-white'
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
                className="w-full py-3 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Launch Session Dashboard</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Footer: Single Quiet Line */}
        <footer className="py-8 px-6 sm:px-10 border-t border-[#D5D4CB]/60 text-xs text-[#5F665E]"> {/* taste-skill-ignore */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#181F1C]">surv.</span>
              <span>&bull;</span>
              <span>The calm audience engagement platform</span>
            </div>

            <div className="flex items-center gap-6">
              <span
                className="hover:text-[#181F1C] cursor-pointer transition-colors"
                onClick={() => router.push('/host')}
              >
                Host Command Center
              </span>
              <span
                className="hover:text-[#181F1C] cursor-pointer transition-colors"
                onClick={() => router.push('/present')}
              >
                Stage Screen
              </span>
              <span
                className="hover:text-[#181F1C] cursor-pointer transition-colors"
                onClick={() => router.push('/app')}
              >
                Participant View
              </span>
            </div>

            <div>
              &copy; 2026 &bull; Free &amp; Open Architecture
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
