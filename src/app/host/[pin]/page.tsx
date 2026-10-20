'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  getRoomByPin,
  getPollsForRoom,
  createPoll,
  updatePoll,
  deletePoll,
  getResponsesForPoll,
  resetPollResponses,
  getQAQuestions,
  updateQAQuestion,
  deleteQAQuestion,
  getSurveysForRoom,
  getSurveyResponses,
  updateRoom,
  subscribeToRealtime,
} from '@/lib/store';
import { Room, Poll, PollResponse, QAQuestion, Survey, PollType } from '@/types';
import BarChartVisualizer from '@/components/BarChartVisualizer';
import WordCloudVisualizer from '@/components/WordCloudVisualizer';
import RatingVisualizer from '@/components/RatingVisualizer';
import QRCodeModal from '@/components/QRCodeModal';
import AIGeneratorModal from '@/components/AIGeneratorModal';
import {
  Radio,
  Plus,
  Play,
  RotateCcw,
  Trash2,
  Lock,
  LockOpen,
  Eye,
  EyeOff,
  CheckCircle,
  Pin,
  QrCode,
  Monitor,
  Smartphone,
  Download,
  Settings,
  ArrowLeft,
  Search,
  Users,
  CheckCircle2,
  Award,
  Sparkles,
} from 'lucide-react';

interface HostRoomPageProps {
  params: Promise<{ pin: string }>;
}

function HostRoomContent({ params }: HostRoomPageProps) {
  const unwrappedParams = use(params);
  const rawPin = unwrappedParams.pin;
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [responses, setResponses] = useState<PollResponse[]>([]);
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [activeTab, setActiveTab] = useState<'polls' | 'qa' | 'surveys' | 'settings'>('polls');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const [showAIGeneratorModal, setShowAIGeneratorModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Poll Form State
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollType, setNewPollType] = useState<PollType>('multiple_choice');
  const [newPollOptions, setNewPollOptions] = useState<Array<{ text: string; isCorrect: boolean }>>([
    { text: 'Option 1', isCorrect: false },
    { text: 'Option 2', isCorrect: false },
  ]);
  const [newPollTimer, setNewPollTimer] = useState<number | ''>('');

  const loadData = (pin: string) => {
    const targetRoom = getRoomByPin(pin);
    if (!targetRoom) {
      setLoading(false);
      return;
    }

    setRoom(targetRoom);
    const roomPolls = getPollsForRoom(targetRoom.id);
    setPolls(roomPolls);

    // Pick active poll or first poll
    const currentActive = roomPolls.find(p => p.id === targetRoom.activePollId) || roomPolls[0] || null;
    setSelectedPoll(prev => (prev ? roomPolls.find(p => p.id === prev.id) || currentActive : currentActive));

    if (currentActive) {
      setResponses(getResponsesForPoll(currentActive.id));
    }

    setQuestions(getQAQuestions(targetRoom.id));
    setSurveys(getSurveysForRoom(targetRoom.id));
    setLoading(false);
  };

  useEffect(() => {
    loadData(rawPin);

    const unsubscribe = subscribeToRealtime(event => {
      loadData(rawPin);
    });

    return () => unsubscribe();
  }, [rawPin]);

  useEffect(() => {
    if (selectedPoll) {
      setResponses(getResponsesForPoll(selectedPoll.id));
    }
  }, [selectedPoll]);

  // Activate / Launch poll on audience screens
  const handleLaunchPoll = (poll: Poll) => {
    if (!room) return;
    updateRoom(room.id, { activePollId: poll.id });
    setSelectedPoll(poll);
    setResponses(getResponsesForPoll(poll.id));
  };

  const handleToggleVoting = () => {
    if (!selectedPoll) return;
    const updated = updatePoll(selectedPoll.id, { isOpen: !selectedPoll.isOpen });
    if (updated) setSelectedPoll(updated);
  };

  const handleToggleShowResults = () => {
    if (!selectedPoll) return;
    const updated = updatePoll(selectedPoll.id, { showResults: !selectedPoll.showResults });
    if (updated) setSelectedPoll(updated);
  };

  const handleToggleShowCorrect = () => {
    if (!selectedPoll) return;
    const updated = updatePoll(selectedPoll.id, { showCorrect: !selectedPoll.showCorrect });
    if (updated) setSelectedPoll(updated);
  };

  const handleResetResponses = () => {
    if (!selectedPoll) return;
    if (confirm('Reset all participant votes for this poll?')) {
      resetPollResponses(selectedPoll.id);
      setResponses([]);
    }
  };

  const handleDeletePoll = (pollId: string) => {
    if (confirm('Are you sure you want to delete this poll?')) {
      deletePoll(pollId);
      const remaining = polls.filter(p => p.id !== pollId);
      setPolls(remaining);
      if (selectedPoll?.id === pollId) {
        setSelectedPoll(remaining[0] || null);
      }
    }
  };

  // Add Option to New Poll modal
  const handleAddOption = () => {
    setNewPollOptions([...newPollOptions, { text: `Option ${newPollOptions.length + 1}`, isCorrect: false }]);
  };

  const handleOptionChange = (idx: number, text: string) => {
    const updated = [...newPollOptions];
    updated[idx].text = text;
    setNewPollOptions(updated);
  };

  const handleOptionCorrectToggle = (idx: number) => {
    const updated = newPollOptions.map((opt, i) => ({
      ...opt,
      isCorrect: i === idx ? !opt.isCorrect : false, // single correct
    }));
    setNewPollOptions(updated);
  };

  const handleRemoveOption = (idx: number) => {
    if (newPollOptions.length <= 2) return;
    setNewPollOptions(newPollOptions.filter((_, i) => i !== idx));
  };

  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPollTitle.trim() || !room) return;

    const formattedOptions = (newPollType === 'multiple_choice' || newPollType === 'quiz')
      ? newPollOptions.map((opt, i) => ({
          id: 'opt-' + Date.now() + '-' + i,
          text: opt.text.trim(),
          isCorrect: opt.isCorrect,
        }))
      : [];

    const created = createPoll({
      roomId: room.id,
      title: newPollTitle.trim(),
      type: newPollType,
      options: formattedOptions,
      isOpen: true,
      showResults: true,
      showCorrect: newPollType === 'quiz',
      timeLimit: typeof newPollTimer === 'number' ? newPollTimer : null,
    });

    const updatedList = [...polls, created];
    setPolls(updatedList);
    setSelectedPoll(created);
    updateRoom(room.id, { activePollId: created.id });

    // Reset modal
    setNewPollTitle('');
    setNewPollOptions([
      { text: 'Option 1', isCorrect: false },
      { text: 'Option 2', isCorrect: false },
    ]);
    setNewPollTimer('');
    setShowCreatePollModal(false);
  };

  const handleAIGeneratedQuestions = (
    generatedQuestions: Array<{
      title: string;
      type: PollType;
      options: Array<{ text: string; isCorrect: boolean }>;
      timeLimit?: number;
    }>
  ) => {
    if (!room) return;
    let firstCreated: Poll | null = null;
    const colors = ['#10B981', '#06B6D4', '#F59E0B', '#3B82F6', '#EC4899', '#14B8A6'];

    generatedQuestions.forEach((q, idx) => {
      const created = createPoll({
        roomId: room.id,
        title: q.title,
        type: q.type,
        options: q.options.map((opt, oIdx) => ({
          id: `opt-${Date.now()}-${idx}-${oIdx}`,
          text: opt.text,
          isCorrect: opt.isCorrect,
          color: colors[oIdx % colors.length],
        })),
        isOpen: true,
        showResults: true,
        showCorrect: q.type === 'quiz',
        timeLimit: typeof q.timeLimit === 'number' ? q.timeLimit : null,
      });

      if (idx === 0) {
        firstCreated = created;
      }
    });

    loadData(room.pin);
    if (firstCreated) {
      setSelectedPoll(firstCreated);
      updateRoom(room.id, { activePollId: (firstCreated as Poll).id });
    }
  };

  // Export Data to JSON
  const handleExportData = () => {
    if (!room) return;
    const exportPayload = {
      room,
      polls: polls.map(p => ({
        ...p,
        responses: getResponsesForPoll(p.id),
      })),
      qa: questions,
      surveys: surveys.map(s => ({
        ...s,
        responses: getSurveyResponses(s.id),
      })),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `surv-session-${room.pin}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading session...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
          <h2>Session Not Found</h2>
          <button onClick={() => router.push('/host')} className="glow-btn" style={{ marginTop: '16px' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] flex flex-col bg-[#07090E] text-slate-100">
      {/* Top Header */}
      <header className="sticky top-0 z-40 px-6 sm:px-8 py-3.5 border-b border-white/10 bg-[#07090E] flex items-center justify-between gap-4"> {/* taste-skill-ignore */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/host')}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title="Back to Sessions"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-extrabold text-white truncate max-w-xs sm:max-w-md">
                {room.title}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Live</span>
              </span>
            </div>
            <span className="text-xs tabular-nums font-semibold text-emerald-400">
              PIN: {room.pin}
            </span>
          </div>
        </div>

        {/* Quick Launch & Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.open(`/present/${room.pin}`, '_blank')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Monitor size={14} className="text-cyan-400" />
            <span className="hidden sm:inline">Presenter Screen</span>
          </button>

          <button
            onClick={() => window.open(`/app/${room.pin}`, '_blank')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Smartphone size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">Participant App</span>
          </button>

          <button
            onClick={() => setShowQRModal(true)}
            className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors cursor-pointer"
            title="Show Join QR Code"
          >
            <QrCode size={16} />
          </button>

          <button
            onClick={handleExportData}
            className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors cursor-pointer"
            title="Export Session Data"
          >
            <Download size={16} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 sm:px-8 py-2.5 bg-slate-950/60 border-b border-white/10 flex items-center gap-2 overflow-x-auto"> {/* taste-skill-ignore */}
        {[
          { id: 'polls', label: `Polls (${polls.length})` },
          { id: 'qa', label: `Audience Q&A (${questions.length})` },
          { id: 'surveys', label: `Surveys (${surveys.length})` },
          { id: 'settings', label: 'Room Settings' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-[#0A0D12]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Workspace */}
      <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
        {/* TAB: POLLS */}
        {activeTab === 'polls' && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
            {/* Left Column: Polls List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setShowCreatePollModal(true)}
                  className="glow-btn"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                >
                  <Plus size={16} /> Create New Poll
                </button>

                <button
                  type="button"
                  onClick={() => setShowAIGeneratorModal(true)}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#161E2C',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                  className="hover:bg-[#1D2738] transition-colors"
                >
                  <Sparkles size={16} className="text-emerald-400" /> Generate with Gemini AI
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {polls.map((p, idx) => {
                  const isSelected = selectedPoll?.id === p.id;
                  const isActiveOnScreen = room.activePollId === p.id;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPoll(p)}
                      className="glass-panel"
                      style={{
                        padding: '14px',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)' }}>
                          #{idx + 1} • {p.type.toUpperCase().replace('_', ' ')}
                        </span>
                        {isActiveOnScreen && (
                          <span className="badge badge-live" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                            <span className="badge-pulse" /> Presenting
                          </span>
                        )}
                      </div>

                      <strong style={{ fontSize: '0.9rem', color: '#FFFFFF', lineHeight: 1.3 }}>
                        {p.title}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Selected Poll Inspector & Controls */}
            {selectedPoll ? (
              <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Poll Header & Controls Toolbar */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', marginBottom: '8px' }}>
                      {selectedPoll.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                      {selectedPoll.title}
                    </h2>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Launch / Push to Projector */}
                    <button
                      onClick={() => handleLaunchPoll(selectedPoll)}
                      className={room.activePollId === selectedPoll.id ? 'secondary-btn' : 'glow-btn'}
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.85rem',
                        borderColor: room.activePollId === selectedPoll.id ? 'var(--success)' : undefined,
                        color: room.activePollId === selectedPoll.id ? 'var(--success)' : undefined,
                      }}
                    >
                      <Play size={14} />
                      {room.activePollId === selectedPoll.id ? 'Active on Screen' : 'Launch to Screen'}
                    </button>

                    {/* Open/Close Voting */}
                    <button
                      onClick={handleToggleVoting}
                      className="secondary-btn"
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.85rem',
                        color: selectedPoll.isOpen ? 'var(--danger)' : 'var(--success)',
                      }}
                    >
                      {selectedPoll.isOpen ? <Lock size={14} /> : <LockOpen size={14} />}
                      {selectedPoll.isOpen ? 'Close Voting' : 'Open Voting'}
                    </button>

                    {/* Reveal Results */}
                    <button
                      onClick={handleToggleShowResults}
                      className="secondary-btn"
                      style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                    >
                      {selectedPoll.showResults ? <EyeOff size={14} /> : <Eye size={14} />}
                      {selectedPoll.showResults ? 'Hide Results' : 'Show Results'}
                    </button>

                    {/* Show Correct Answer (if quiz or MCQ) */}
                    {(selectedPoll.type === 'quiz' || selectedPoll.type === 'multiple_choice') && (
                      <button
                        onClick={handleToggleShowCorrect}
                        className="secondary-btn"
                        style={{
                          padding: '8px 14px',
                          fontSize: '0.85rem',
                          color: selectedPoll.showCorrect ? 'var(--success)' : 'var(--text-main)',
                        }}
                      >
                        <CheckCircle size={14} />
                        {selectedPoll.showCorrect ? 'Hide Correct' : 'Show Correct'}
                      </button>
                    )}

                    {/* Reset responses */}
                    <button
                      onClick={handleResetResponses}
                      className="secondary-btn"
                      style={{ padding: '8px 12px' }}
                      title="Reset Responses"
                    >
                      <RotateCcw size={15} />
                    </button>

                    {/* Delete Poll */}
                    <button
                      onClick={() => handleDeletePoll(selectedPoll.id)}
                      className="secondary-btn"
                      style={{ padding: '8px 12px', color: 'var(--danger)' }}
                      title="Delete Poll"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Live Visualization Preview */}
                <div style={{
                  padding: '24px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      LIVE RESULTS MONITOR ({responses.length} VOTES)
                    </span>
                    <span style={{ fontSize: '0.8rem', color: selectedPoll.showResults ? 'var(--success)' : 'var(--text-dim)' }}>
                      {selectedPoll.showResults ? 'Visible on Projector & Mobile' : 'Hidden from Attendees'}
                    </span>
                  </div>

                  {selectedPoll.type === 'multiple_choice' || selectedPoll.type === 'quiz' ? (
                    <BarChartVisualizer poll={selectedPoll} responses={responses} />
                  ) : selectedPoll.type === 'word_cloud' ? (
                    <WordCloudVisualizer responses={responses} />
                  ) : selectedPoll.type === 'rating' ? (
                    <RatingVisualizer responses={responses} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {responses.map(r => (
                        <div key={r.id} style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-sm)' }}>
                          &quot;{String(r.value)}&quot;
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Select a poll from the left or create a new one to begin.
              </div>
            )}
          </div>
        )}

        {/* TAB: AUDIENCE Q&A MODERATION */}
        {activeTab === 'qa' && (
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF' }}>Live Q&A Moderation Queue</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Pin questions to feature them on the projector screen, mark answered, or dismiss.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {questions.map(q => (
                <div
                  key={q.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: q.isPinned ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${q.isPinned ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    gap: '16px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{q.authorName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        • {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {q.isPinned && (
                        <span className="badge" style={{ background: 'var(--primary)', color: '#FFFFFF', fontSize: '0.65rem' }}>
                          PINNED ON PROJECTOR
                        </span>
                      )}
                      {q.isAnswered && (
                        <span className="badge" style={{ background: 'var(--success)', color: '#FFFFFF', fontSize: '0.65rem' }}>
                          ANSWERED
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '1rem', color: '#FFFFFF' }}>{q.text}</p>
                    <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                      ▲ {q.upvotes} upvotes
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => updateQAQuestion(q.id, { isPinned: !q.isPinned })}
                      className="secondary-btn"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        color: q.isPinned ? 'var(--primary)' : 'var(--text-muted)',
                      }}
                    >
                      <Pin size={14} /> {q.isPinned ? 'Unpin' : 'Pin to Screen'}
                    </button>

                    <button
                      onClick={() => updateQAQuestion(q.id, { isAnswered: !q.isAnswered })}
                      className="secondary-btn"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        color: q.isAnswered ? 'var(--success)' : 'var(--text-muted)',
                      }}
                    >
                      <CheckCircle size={14} /> {q.isAnswered ? 'Unmark' : 'Mark Answered'}
                    </button>

                    <button
                      onClick={() => deleteQAQuestion(q.id)}
                      className="secondary-btn"
                      style={{ padding: '6px 10px', color: 'var(--danger)' }}
                      title="Dismiss Question"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: SURVEYS */}
        {activeTab === 'surveys' && (
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF' }}>Self-Paced Surveys</h2>
            {surveys.map(survey => {
              const responsesList = getSurveyResponses(survey.id);
              return (
                <div key={survey.id} style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.15rem', color: '#FFFFFF' }}>{survey.title}</h3>
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                      {responsesList.length} Submissions
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>{survey.description}</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {survey.questions.map((q, idx) => (
                      <div key={q.id} style={{ padding: '10px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF' }}>{idx + 1}. {q.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB: ROOM SETTINGS */}
        {activeTab === 'settings' && (
          <div className="glass-panel" style={{ padding: '28px', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF' }}>Room Settings</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Room Title</label>
              <input
                type="text"
                value={room.title}
                onChange={e => {
                  const updated = updateRoom(room.id, { title: e.target.value });
                  if (updated) setRoom(updated);
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-light)',
                  color: '#FFFFFF',
                }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={room.allowAnonymousQA}
                onChange={e => {
                  const updated = updateRoom(room.id, { allowAnonymousQA: e.target.checked });
                  if (updated) setRoom(updated);
                }}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: '0.9rem', color: '#FFFFFF' }}>Allow attendees to post Q&A anonymously</span>
            </label>
          </div>
        )}
      </main>

      {/* Create Poll Modal */}
      {showCreatePollModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <form
            onSubmit={handleCreatePollSubmit}
            className="glass-panel"
            style={{ width: '100%', maxWidth: '520px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '18px' }}
          >
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF' }}>Create New Poll</h2>

            {/* Poll Type Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Poll Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'multiple_choice', label: 'Multiple Choice' },
                  { id: 'word_cloud', label: 'Word Cloud' },
                  { id: 'rating', label: 'Rating (1-5)' },
                  { id: 'quiz', label: 'Quiz Battle' },
                  { id: 'open_text', label: 'Open Text' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setNewPollType(t.id as PollType)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: newPollType === t.id ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${newPollType === t.id ? 'var(--primary)' : 'var(--border-subtle)'}`,
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Question or Prompt</label>
              <input
                type="text"
                required
                value={newPollTitle}
                onChange={e => setNewPollTitle(e.target.value)}
                placeholder="e.g. Which initiative should we prioritize?"
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-light)',
                  color: '#FFFFFF',
                  fontSize: '0.95rem',
                }}
              />
            </div>

            {/* Options list for MCQ and Quiz */}
            {(newPollType === 'multiple_choice' || newPollType === 'quiz') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Choices {newPollType === 'quiz' && '(Select checkmark for correct answer)'}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 600 }}
                  >
                    + Add Choice
                  </button>
                </div>

                {newPollOptions.map((opt, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {newPollType === 'quiz' && (
                      <button
                        type="button"
                        onClick={() => handleOptionCorrectToggle(idx)}
                        style={{
                          padding: '6px',
                          color: opt.isCorrect ? 'var(--success)' : 'var(--text-dim)',
                        }}
                        title={opt.isCorrect ? 'Correct Option' : 'Mark as Correct'}
                      >
                        <CheckCircle2 size={20} />
                      </button>
                    )}

                    <input
                      type="text"
                      required
                      value={opt.text}
                      onChange={e => handleOptionChange(idx, e.target.value)}
                      placeholder={`Choice ${idx + 1}`}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-light)',
                        color: '#FFFFFF',
                        fontSize: '0.9rem',
                      }}
                    />

                    {newPollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        style={{ color: 'var(--text-dim)', padding: '6px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowCreatePollModal(false)}
                className="secondary-btn"
                style={{ padding: '10px 18px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="glow-btn"
                style={{ padding: '10px 22px' }}
              >
                Create & Launch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        pin={room.pin}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title={room.title}
      />

      {/* AI Quiz & Poll Generator Modal */}
      <AIGeneratorModal
        isOpen={showAIGeneratorModal}
        onClose={() => setShowAIGeneratorModal(false)}
        onQuestionsGenerated={handleAIGeneratedQuestions}
      />
    </div>
  );
}

export default function HostRoomPage(props: HostRoomPageProps) {
  return (
    <React.Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading session...</div>}>
      <HostRoomContent {...props} />
    </React.Suspense>
  );
}

