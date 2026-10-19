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
  Unlock,
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
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05070A' }}>
        <Sparkles size={40} color="var(--secondary)" style={{ animation: 'pulse-ring 1.5s infinite' }} />
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05070A' }}>
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
          <h2 style={{ color: '#FFFFFF', marginBottom: '8px' }}>Session Not Found</h2>
          <button onClick={() => router.push('/')} className="glow-btn">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex',
      flexDirection: 'column',
      background: '#070A10',
      color: '#FFFFFF',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top Projector Banner: Joining Instructions */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 36px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: '#0D121B',
        zIndex: 30,
      }}>
        {/* Left: Branding & Room Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => router.push(`/host/${room.pin}`)}
            style={{ color: 'var(--text-dim)', padding: '6px' }}
            title="Open Host Controls"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
              {room.title}
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Interactive Presenter Mode
            </span>
          </div>
        </div>

        {/* Center: Prominent Join Instructions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '8px 24px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Join at <strong style={{ color: '#FFFFFF' }}>surv.app</strong>
          </span>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-light)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 600 }}>PIN:</span>
            <span style={{
              fontSize: '1.4rem',
              fontWeight: 900,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.08em',
              color: '#FFFFFF',
            }}>
              {room.pin}
            </span>
          </div>

          <button
            onClick={() => setShowQRModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(6, 182, 212, 0.15)',
              color: 'var(--secondary)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginLeft: '4px',
            }}
          >
            <QrCode size={15} /> Show QR
          </button>
        </div>

        {/* Right: Attendee Counter & Fullscreen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--success)',
            fontSize: '0.85rem',
            fontWeight: 700,
          }}>
            <span className="badge-pulse" />
            <Users size={16} />
            <span>{responses.length > 0 ? `${responses.length} Voted` : `${room.participantCount} Live`}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-muted)',
            }}
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </header>

      {/* Main Stage */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 60px 100px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
      }}>
        {activePoll ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Poll Status Pill & Poll Progress */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge" style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--primary)',
                  fontSize: '0.85rem',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}>
                  Poll {currentPollIndex + 1} of {polls.length}
                </span>

                {activePoll.isOpen ? (
                  <span className="badge badge-live" style={{ fontSize: '0.85rem' }}>
                    <span className="badge-pulse" /> Live Voting Active
                  </span>
                ) : (
                  <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', fontSize: '0.85rem' }}>
                    <Lock size={13} /> Voting Closed
                  </span>
                )}
              </div>

              {activePoll.type === 'quiz' && (
                <button
                  onClick={() => setShowQuizLeaderboard(!showQuizLeaderboard)}
                  className="secondary-btn"
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.85rem',
                    background: showQuizLeaderboard ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: showQuizLeaderboard ? 'var(--warning)' : 'var(--border-light)',
                    color: showQuizLeaderboard ? 'var(--warning)' : '#FFFFFF',
                  }}
                >
                  <Award size={16} /> {showQuizLeaderboard ? 'Show Quiz Options' : 'Show Podium Leaderboard'}
                </button>
              )}
            </div>

            {/* Question Heading */}
            <h2 style={{
              fontSize: 'clamp(1.8rem, 3.8vw, 3rem)',
              fontWeight: 800,
              color: '#FFFFFF',
              textAlign: 'center',
              lineHeight: 1.25,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            }}>
              {activePoll.title}
            </h2>

            {/* Dynamic Visualization Arena */}
            <div style={{ width: '100%', maxWidth: '960px', margin: '0 auto' }}>
              {showQuizLeaderboard && activePoll.type === 'quiz' ? (
                <QuizLeaderboard poll={activePoll} responses={responses} />
              ) : activePoll.type === 'multiple_choice' || activePoll.type === 'quiz' ? (
                <BarChartVisualizer poll={activePoll} responses={responses} />
              ) : activePoll.type === 'word_cloud' ? (
                <WordCloudVisualizer responses={responses} />
              ) : activePoll.type === 'rating' ? (
                <RatingVisualizer responses={responses} />
              ) : (
                /* Open feedback answers stream */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {responses.map((resp, i) => (
                    <div
                      key={resp.id}
                      className="glass-panel"
                      style={{
                        padding: '18px',
                        fontSize: '1rem',
                        lineHeight: 1.5,
                        background: 'rgba(255, 255, 255, 0.03)',
                        animation: `fadeIn 0.3s ease-out backwards ${i * 0.05}s`,
                      }}
                    >
                      &quot;{String(resp.value)}&quot;
                    </div>
                  ))}
                  {responses.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                      Waiting for open responses from the audience...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Welcome Splash Stage when no poll is active */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '24px',
            maxWidth: '680px',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              background: '#121720',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={40} color="#FFFFFF" />
            </div>

            <h2 style={{ fontSize: '2.8rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Welcome to the Live Session
            </h2>

            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Grab your phone or open a browser tab to participate in interactive polls, ask questions, and share your voice in real time.
            </p>

            <button
              onClick={() => setShowQRModal(true)}
              className="glow-btn"
              style={{ padding: '16px 32px', fontSize: '1.1rem', marginTop: '12px' }}
            >
              <QrCode size={22} /> Display Fullscreen Join QR Code
            </button>
          </div>
        )}
      </main>

      {/* Featured Pinned Question Ticker at Bottom */}
      {pinnedQA && (
        <aside style={{
          position: 'fixed',
          bottom: '84px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '850px',
          background: '#161E2C',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '16px 24px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          zIndex: 40,
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Pin size={18} color="#FFFFFF" />
          </div>

          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.8)' }}>
              FEATURED AUDIENCE QUESTION • {pinnedQA.authorName} ({pinnedQA.upvotes} UPVOTES)
            </span>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
              &quot;{pinnedQA.text}&quot;
            </p>
          </div>
        </aside>
      )}

      {/* Floating Presenter Control Dock (Auto-hides on idle) */}
      <footer style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(18, 24, 38, 0.92)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 'var(--radius-full)',
        padding: '8px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 50,
        boxShadow: 'var(--shadow-lg)',
        opacity: controlsVisible ? 1 : 0.15,
        transition: 'opacity 0.3s ease',
      }}>
        {/* Previous Poll */}
        <button
          onClick={handlePrevPoll}
          style={{ padding: '8px', borderRadius: '50%', color: 'var(--text-main)', background: 'rgba(255, 255, 255, 0.05)' }}
          title="Previous Poll (Left Arrow)"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Voting Toggle */}
        {activePoll && (
          <button
            onClick={toggleVotingOpen}
            className="secondary-btn"
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem',
              color: activePoll.isOpen ? 'var(--danger)' : 'var(--success)',
              borderColor: activePoll.isOpen ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
            }}
            title="Toggle Voting (C)"
          >
            {activePoll.isOpen ? <Lock size={15} /> : <Unlock size={15} />}
            {activePoll.isOpen ? 'Close Voting' : 'Open Voting'}
          </button>
        )}

        {/* Results Toggle */}
        {activePoll && (
          <button
            onClick={toggleResultsReveal}
            className="secondary-btn"
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            title="Reveal / Hide Results (R)"
          >
            {activePoll.showResults ? <EyeOff size={15} /> : <Eye size={15} />}
            {activePoll.showResults ? 'Hide Results' : 'Show Results'}
          </button>
        )}

        {/* Show Correct Answer (If quiz or MCQ) */}
        {activePoll && (activePoll.type === 'quiz' || activePoll.type === 'multiple_choice') && (
          <button
            onClick={toggleShowCorrect}
            className="secondary-btn"
            style={{
              padding: '6px 14px',
              fontSize: '0.85rem',
              color: activePoll.showCorrect ? 'var(--success)' : 'var(--text-main)',
            }}
          >
            <CheckCircle size={15} />
            {activePoll.showCorrect ? 'Hide Correct' : 'Show Correct'}
          </button>
        )}

        {/* Next Poll */}
        <button
          onClick={handleNextPoll}
          style={{ padding: '8px', borderRadius: '50%', color: 'var(--text-main)', background: 'rgba(255, 255, 255, 0.05)' }}
          title="Next Poll (Right Arrow / Space)"
        >
          <ChevronRight size={20} />
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
    <React.Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05070A', color: 'var(--text-muted)' }}>Loading presentation...</div>}>
      <PresenterContent {...props} />
    </React.Suspense>
  );
}

