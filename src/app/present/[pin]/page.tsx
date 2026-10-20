'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getRoomByPin,
  getPollsForRoom,
  getResponsesForPoll,
  getQAQuestions,
  updatePoll,
  updateRoom,
  subscribeToRealtime,
} from '@/lib/store';
import { Room, Poll, PollResponse, QAQuestion } from '@/types';
import BarChartVisualizer from '@/components/BarChartVisualizer';
import WordCloudVisualizer from '@/components/WordCloudVisualizer';
import RatingVisualizer from '@/components/RatingVisualizer';
import QuizLeaderboard from '@/components/QuizLeaderboard';
import QRCodeModal from '@/components/QRCodeModal';
import {
  QrCode,
  Users,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  CheckCircle,
  Pin,
  Sparkles,
  ArrowLeft,
  Award,
} from 'lucide-react';

interface PresenterPageProps {
  params: Promise<{ pin: string }>;
}

function PresenterContent({ params }: PresenterPageProps) {
  const unwrappedParams = use(params);
  const rawPin = unwrappedParams.pin;
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [responses, setResponses] = useState<PollResponse[]>([]);
  const [pinnedQA, setPinnedQA] = useState<QAQuestion | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQuizLeaderboard, setShowQuizLeaderboard] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auto-hide controls timer
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMouseMove = () => {
      setControlsVisible(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 4000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Keyboard navigation shortcuts (Space, Arrow keys, C, R, F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNextPoll();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPoll();
      } else if (e.key.toLowerCase() === 'c' && activePoll) {
        toggleVotingOpen();
      } else if (e.key.toLowerCase() === 'r' && activePoll) {
        toggleResultsReveal();
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePoll, polls]);

  const loadData = (pin: string) => {
    const targetRoom = getRoomByPin(pin);
    if (!targetRoom) {
      setLoading(false);
      return;
    }

    setRoom(targetRoom);
    const roomPolls = getPollsForRoom(targetRoom.id);
    setPolls(roomPolls);

    const active = roomPolls.find(p => p.id === targetRoom.activePollId) || null;
    setActivePoll(active);

    if (active) {
      setResponses(getResponsesForPoll(active.id));
    } else {
      setResponses([]);
    }

    const qaList = getQAQuestions(targetRoom.id);
    const pinned = qaList.find(q => q.isPinned && !q.isAnswered) || null;
    setPinnedQA(pinned);

    setLoading(false);
  };

  useEffect(() => {
    loadData(rawPin);

    const unsubscribe = subscribeToRealtime(event => {
      loadData(rawPin);
    });

    return () => unsubscribe();
  }, [rawPin]);

  const currentPollIndex = activePoll ? polls.findIndex(p => p.id === activePoll.id) : -1;

  const handleNextPoll = () => {
    if (!room || polls.length === 0) return;
    const nextIdx = currentPollIndex + 1 < polls.length ? currentPollIndex + 1 : 0;
    const nextPoll = polls[nextIdx];
    updateRoom(room.id, { activePollId: nextPoll.id });
    setActivePoll(nextPoll);
    setResponses(getResponsesForPoll(nextPoll.id));
    setShowQuizLeaderboard(false);
  };

  const handlePrevPoll = () => {
    if (!room || polls.length === 0) return;
    const prevIdx = currentPollIndex - 1 >= 0 ? currentPollIndex - 1 : polls.length - 1;
    const prevPoll = polls[prevIdx];
    updateRoom(room.id, { activePollId: prevPoll.id });
    setActivePoll(prevPoll);
    setResponses(getResponsesForPoll(prevPoll.id));
    setShowQuizLeaderboard(false);
  };

  const toggleVotingOpen = () => {
    if (!activePoll) return;
    const updated = updatePoll(activePoll.id, { isOpen: !activePoll.isOpen });
    if (updated) setActivePoll(updated);
  };

  const toggleResultsReveal = () => {
    if (!activePoll) return;
    const updated = updatePoll(activePoll.id, { showResults: !activePoll.showResults });
    if (updated) setActivePoll(updated);
  };

  const toggleShowCorrect = () => {
    if (!activePoll) return;
    const updated = updatePoll(activePoll.id, { showCorrect: !activePoll.showCorrect });
    if (updated) setActivePoll(updated);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100svh] bg-[#15261F] text-[#E6E5DC] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Sparkles className="w-8 h-8 text-[#c6f19d] mx-auto animate-spin" />
          <p className="text-sm font-medium text-[#E6E5DC]/70">Initializing stage screen...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-[100svh] bg-[#283E34] p-4 text-[#181F1C] flex items-center justify-center">
        <div className="w-full max-w-md p-8 rounded-2xl bg-[#E6E5DC] text-center space-y-4">
          <h2 className="text-2xl font-semibold text-[#181F1C]">Session Not Found</h2>
          <p className="text-sm text-[#5F665E]">
            We could not find an active stage screen for PIN <strong className="text-[#181F1C]">{rawPin}</strong>.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={() => router.push('/present')}
              className="px-4 py-2 text-xs font-semibold text-[#181F1C] bg-white border border-[#D0CEC4] rounded-lg transition-colors cursor-pointer"
            >
              Stage Directory
            </button>
            <button
              onClick={() => router.push('/host')}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg transition-colors cursor-pointer"
            >
              Host Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] flex flex-col bg-[#15261F] text-[#E6E5DC] relative overflow-hidden select-none">
      {/* Top Projector Banner: Joining Instructions */}
      <header className="px-6 sm:px-12 py-4 border-b border-[#2D4A3E] bg-[#1D3228] flex items-center justify-between gap-4 z-30"> {/* taste-skill-ignore */}
        {/* Left: Host Link & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/host/${room.pin}`)}
            className="p-2 text-[#E6E5DC]/60 hover:text-white rounded-lg hover:bg-[#233B31] transition-colors cursor-pointer"
            title="Open Host Controls"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#E6E5DC] leading-snug">
              {room.title}
            </h1>
            <span className="text-xs text-[#c6f19d] font-medium">
              Live Stage Screen
            </span>
          </div>
        </div>

        {/* Center: Prominent Join Instructions */}
        <div className="flex items-center gap-3 bg-[#15261F] border border-[#2D4A3E] px-5 py-2 rounded-full">
          <span className="text-xs sm:text-sm text-[#E6E5DC]/80 font-medium">
            Join at <strong className="text-white">surv.app</strong>
          </span>
          <span className="w-1 h-1 rounded-full bg-[#c6f19d]" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#c6f19d] font-semibold">PIN:</span>
            <span className="text-base sm:text-xl font-bold tabular-nums text-white">
              {room.pin}
            </span>
          </div>

          <button
            onClick={() => setShowQRModal(true)}
            className="ml-2 px-3 py-1 rounded-full bg-[#233B31] hover:bg-[#2D4A3E] text-[#c6f19d] border border-[#2D4A3E] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <QrCode size={13} />
            <span>Show QR</span>
          </button>
        </div>

        {/* Right: Attendee Counter & Fullscreen */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#15261F] border border-[#2D4A3E] text-xs font-semibold text-[#c6f19d]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <Users size={14} />
            <span className="tabular-nums">
              {responses.length > 0 ? `${responses.length} voted` : `${room.participantCount} live`}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-[#E6E5DC]/60 hover:text-white bg-[#15261F] hover:bg-[#233B31] border border-[#2D4A3E] transition-colors cursor-pointer"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* Main Stage Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 pb-28 max-w-6xl mx-auto w-full">
        {activePoll ? (
          <div className="w-full space-y-6">
            {/* Poll Status Pill & Index */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#233B31] text-[#c6f19d] border border-[#2D4A3E] tabular-nums">
                  Poll {currentPollIndex + 1} of {polls.length}
                </span>

                {activePoll.isOpen ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Live voting open</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-rose-300 bg-rose-950/60 border border-rose-800/40">
                    <Lock size={12} />
                    <span>Voting concluded</span>
                  </span>
                )}
              </div>

              {activePoll.type === 'quiz' && (
                <button
                  onClick={() => setShowQuizLeaderboard(!showQuizLeaderboard)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#13231d] bg-[#c6f19d] hover:bg-[#b5e886] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Award size={15} />
                  <span>{showQuizLeaderboard ? 'Show Options' : 'Show Podium Leaderboard'}</span>
                </button>
              )}
            </div>

            {/* Question Heading */}
            <h2 className="text-3xl sm:text-5xl font-bold text-center text-[#E6E5DC] leading-tight max-w-4xl mx-auto">
              {activePoll.title}
            </h2>

            {/* Dynamic Visualizer Arena */}
            <div className="w-full max-w-4xl mx-auto pt-4">
              {showQuizLeaderboard && activePoll.type === 'quiz' ? (
                <QuizLeaderboard poll={activePoll} responses={responses} />
              ) : activePoll.type === 'multiple_choice' || activePoll.type === 'quiz' ? (
                <BarChartVisualizer poll={activePoll} responses={responses} />
              ) : activePoll.type === 'word_cloud' ? (
                <WordCloudVisualizer responses={responses} />
              ) : activePoll.type === 'rating' ? (
                <RatingVisualizer responses={responses} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {responses.map(resp => (
                    <div
                      key={resp.id}
                      className="p-4 rounded-xl bg-[#1D3228] border border-[#2D4A3E] text-sm text-[#E6E5DC] leading-relaxed"
                    >
                      &quot;{String(resp.value)}&quot;
                    </div>
                  ))}
                  {responses.length === 0 && (
                    <div className="col-span-full py-16 text-center text-xs text-[#E6E5DC]/50">
                      Waiting for audience feedback to stream in...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Welcome Splash Stage when no poll is active */
          <div className="flex flex-col items-center text-center space-y-6 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#1D3228] border border-[#2D4A3E] flex items-center justify-center text-[#c6f19d]">
              <Sparkles size={32} />
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#E6E5DC]">
              Welcome to the Session
            </h2>

            <p className="text-base text-[#E6E5DC]/70 leading-relaxed">
              Grab your phone or laptop and navigate to <strong className="text-white">surv.app</strong> with PIN <strong className="text-[#c6f19d] tabular-nums">{room.pin}</strong> to participate in live polls and interactive Q&amp;A.
            </p>

            <button
              onClick={() => setShowQRModal(true)}
              className="px-6 py-3.5 text-sm font-semibold text-[#13231d] bg-[#c6f19d] hover:bg-[#b5e886] rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
            >
              <QrCode size={18} />
              <span>Display Fullscreen Join QR Code</span>
            </button>
          </div>
        )}
      </main>

      {/* Featured Pinned Question Ticker at Bottom */}
      {pinnedQA && (
        <aside className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-[#1D3228] border border-[#2D4A3E] p-4 rounded-2xl flex items-center gap-3.5 z-40">
          <div className="w-9 h-9 rounded-full bg-[#233B31] flex items-center justify-center shrink-0 text-[#c6f19d]">
            <Pin size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold text-[#c6f19d] block">
              Featured Audience Question &bull; {pinnedQA.authorName} ({pinnedQA.upvotes} upvotes)
            </span>
            <p className="text-sm font-bold text-white truncate">
              &quot;{pinnedQA.text}&quot;
            </p>
          </div>
        </aside>
      )}

      {/* Floating Presenter Control Dock (Auto-hides on idle) */}
      <footer
        className={`fixed bottom-5 left-1/2 -translate-x-1/2 bg-[#1D3228] border border-[#2D4A3E] rounded-full px-4 py-2 flex items-center gap-2.5 z-50 transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-20 hover:opacity-100'
        }`}
      >
        {/* Previous Poll */}
        <button
          onClick={handlePrevPoll}
          className="p-2 rounded-full text-[#E6E5DC]/70 hover:text-white bg-[#15261F] hover:bg-[#233B31] transition-colors cursor-pointer"
          title="Previous Poll (Left Arrow)"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Voting Toggle */}
        {activePoll && (
          <button
            onClick={toggleVotingOpen}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activePoll.isOpen
                ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
            }`}
            title="Toggle Voting (C)"
          >
            {activePoll.isOpen ? <Lock size={13} /> : <LockOpen size={13} />}
            <span>{activePoll.isOpen ? 'Close Voting' : 'Open Voting'}</span>
          </button>
        )}

        {/* Results Toggle */}
        {activePoll && (
          <button
            onClick={toggleResultsReveal}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#E6E5DC] bg-[#15261F] hover:bg-[#233B31] border border-[#2D4A3E] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reveal / Hide Results (R)"
          >
            {activePoll.showResults ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{activePoll.showResults ? 'Hide Results' : 'Show Results'}</span>
          </button>
        )}

        {/* Show Correct Answer (If quiz or MCQ) */}
        {activePoll && (activePoll.type === 'quiz' || activePoll.type === 'multiple_choice') && (
          <button
            onClick={toggleShowCorrect}
            className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#E6E5DC] bg-[#15261F] hover:bg-[#233B31] border border-[#2D4A3E] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle size={13} />
            <span>{activePoll.showCorrect ? 'Hide Correct' : 'Show Correct'}</span>
          </button>
        )}

        {/* Next Poll */}
        <button
          onClick={handleNextPoll}
          className="p-2 rounded-full text-[#E6E5DC]/70 hover:text-white bg-[#15261F] hover:bg-[#233B31] transition-colors cursor-pointer"
          title="Next Poll (Right Arrow / Space)"
        >
          <ChevronRight size={18} />
        </button>
      </footer>

      {/* QR Code Modal */}
      <QRCodeModal
        pin={room.pin}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title={room.title}
      />
    </div>
  );
}

export default function PresenterPage(props: PresenterPageProps) {
  return (
    <React.Suspense fallback={<div className="min-h-[100svh] bg-[#15261F] text-[#E6E5DC] flex items-center justify-center">Loading presentation...</div>}>
      <PresenterContent {...props} />
    </React.Suspense>
  );
}
