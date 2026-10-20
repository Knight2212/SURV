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
  ArrowLeft,
  Users,
  CheckCircle2,
  Sparkles,
  BarChart2,
  MessageSquare,
  ClipboardList,
  Settings,
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
    if (!room) return;
    if (confirm('Delete this question permanently?')) {
      deletePoll(pollId);
      const remaining = getPollsForRoom(room.id);
      setPolls(remaining);
      setSelectedPoll(remaining[0] || null);
      if (room.activePollId === pollId) {
        updateRoom(room.id, { activePollId: remaining[0]?.id || null });
      }
    }
  };

  const handleAddOption = () => {
    if (newPollOptions.length >= 8) return;
    setNewPollOptions([...newPollOptions, { text: `Option ${newPollOptions.length + 1}`, isCorrect: false }]);
  };

  const handleRemoveOption = (idx: number) => {
    if (newPollOptions.length <= 2) return;
    setNewPollOptions(newPollOptions.filter((_, i) => i !== idx));
  };

  const handleOptionChange = (idx: number, text: string) => {
    setNewPollOptions(newPollOptions.map((opt, i) => (i === idx ? { ...opt, text } : opt)));
  };

  const handleOptionCorrectToggle = (idx: number) => {
    setNewPollOptions(
      newPollOptions.map((opt, i) => ({
        ...opt,
        isCorrect: i === idx ? !opt.isCorrect : false,
      }))
    );
  };

  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !newPollTitle.trim()) return;

    const colors = ['#2D4A3E', '#EA580C', '#22C55E', '#0EA5E9', '#D97706'];
    const created = createPoll({
      roomId: room.id,
      title: newPollTitle.trim(),
      type: newPollType,
      options: newPollOptions.map((opt, i) => ({
        id: `opt-${Date.now()}-${i}`,
        text: opt.text.trim() || `Option ${i + 1}`,
        isCorrect: opt.isCorrect,
        color: colors[i % colors.length],
      })),
      isOpen: true,
      showResults: true,
      showCorrect: newPollType === 'quiz',
      timeLimit: typeof newPollTimer === 'number' ? newPollTimer : null,
    });

    loadData(room.pin);
    setSelectedPoll(created);
    updateRoom(room.id, { activePollId: created.id });

    // Reset Form
    setNewPollTitle('');
    setNewPollType('multiple_choice');
    setNewPollOptions([
      { text: 'Option 1', isCorrect: false },
      { text: 'Option 2', isCorrect: false },
    ]);
    setShowCreatePollModal(false);
  };

  const handleAIGeneratedQuestions = (
    questionsList: Array<{
      title: string;
      type: PollType;
      options: Array<{ text: string; isCorrect: boolean }>;
      timeLimit?: number;
    }>
  ) => {
    if (!room) return;
    const colors = ['#2D4A3E', '#EA580C', '#22C55E', '#0EA5E9', '#D97706'];
    let firstCreated: Poll | null = null;

    questionsList.forEach((q, idx) => {
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
      <div className="min-h-[100svh] bg-[#283E34] p-4 text-[#181F1C] flex items-center justify-center">
        <div className="p-8 rounded-2xl bg-[#E6E5DC] text-center space-y-2">
          <p className="text-sm font-medium text-[#5F665E]">Loading session command center...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-[100svh] bg-[#283E34] p-4 text-[#181F1C] flex items-center justify-center">
        <div className="p-8 rounded-2xl bg-[#E6E5DC] text-center space-y-4 max-w-sm">
          <h2 className="text-2xl font-semibold text-[#181F1C]">Session Not Found</h2>
          <p className="text-sm text-[#5F665E]">Could not locate session with PIN {rawPin}.</p>
          <button
            onClick={() => router.push('/host')}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg cursor-pointer transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-[#283E34] p-2 sm:p-4 text-[#181F1C]">
      <div className="bg-[#E6E5DC] rounded-2xl sm:rounded-3xl min-h-[calc(100svh-1rem)] sm:min-h-[calc(100svh-2rem)] flex flex-col justify-between overflow-hidden">
        {/* Top Header */}
        <header className="px-6 sm:px-10 py-4 border-b border-[#D5D4CB]/60 flex items-center justify-between gap-4 bg-[#E6E5DC]"> {/* taste-skill-ignore */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/host')}
              className="p-2 text-[#5F665E] hover:text-[#181F1C] rounded-lg hover:bg-[#DFDDD3] transition-colors cursor-pointer"
              title="Back to Sessions"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-[#181F1C] truncate max-w-xs sm:max-w-md">
                  {room.title}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>Live</span>
                </span>
              </div>
              <span className="text-xs tabular-nums text-[#5F665E]">
                PIN: <strong className="text-[#2D4A3E]">{room.pin}</strong>
              </span>
            </div>
          </div>

          {/* Quick Launch & Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(`/present/${room.pin}`, '_blank')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Monitor size={14} />
              <span className="hidden sm:inline">Presenter Screen</span>
            </button>

            <button
              onClick={() => window.open(`/app/${room.pin}`, '_blank')}
              className="px-3.5 py-2 text-xs font-semibold text-[#181F1C] bg-white hover:bg-[#F5F4EE] border border-[#D0CEC4] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Smartphone size={14} />
              <span className="hidden sm:inline">Participant App</span>
            </button>

            <button
              onClick={() => setShowQRModal(true)}
              className="p-2 text-[#181F1C] bg-white hover:bg-[#F5F4EE] border border-[#D0CEC4] rounded-lg transition-colors cursor-pointer"
              title="Show Join QR Code"
            >
              <QrCode size={16} />
            </button>

            <button
              onClick={handleExportData}
              className="p-2 text-[#181F1C] bg-white hover:bg-[#F5F4EE] border border-[#D0CEC4] rounded-lg transition-colors cursor-pointer"
              title="Export Session Data"
            >
              <Download size={16} />
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="px-6 sm:px-10 py-2.5 bg-[#DFDDD3] border-b border-[#D0CEC4] flex items-center gap-2 overflow-x-auto"> {/* taste-skill-ignore */}
          {[
            { id: 'polls', label: `Polls (${polls.length})`, icon: BarChart2 },
            { id: 'qa', label: `Audience Q&A (${questions.length})`, icon: MessageSquare },
            { id: 'surveys', label: `Surveys (${surveys.length})`, icon: ClipboardList },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#2D4A3E] text-white'
                  : 'text-[#5F665E] hover:text-[#181F1C]'
              }`}
            >
              <tab.icon size={13} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Main Workspace */}
        <main className="flex-1 p-6 sm:px-10 sm:py-6 max-w-7xl mx-auto w-full">
          {/* TAB: POLLS */}
          {activeTab === 'polls' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Polls List */}
              <div className="lg:col-span-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                  <button
                    onClick={() => setShowCreatePollModal(true)}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus size={15} />
                    <span>Create New Poll</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAIGeneratorModal(true)}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-[#181F1C] bg-white hover:bg-[#F5F4EE] border border-[#D0CEC4] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Sparkles size={14} className="text-[#EA580C]" />
                    <span>Generate with AI</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {polls.map((p, idx) => {
                    const isSelected = selectedPoll?.id === p.id;
                    const isActiveOnScreen = room.activePollId === p.id;

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPoll(p)}
                        className={`p-3.5 rounded-xl border transition-colors cursor-pointer text-left space-y-1.5 ${
                          isSelected
                            ? 'bg-white border-[#2D4A3E]'
                            : 'bg-[#DFDDD3] border-[#D0CEC4] hover:bg-[#D7D5CB]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-[#5F665E]">
                            #{idx + 1} &bull; {p.type.replace('_', ' ')}
                          </span>
                          {isActiveOnScreen && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              <span>On Stage</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-[#181F1C] leading-snug line-clamp-2">
                          {p.title}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Selected Poll Inspector */}
              <div className="lg:col-span-8">
                {selectedPoll ? (
                  <div className="p-6 rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] space-y-6">
                    {/* Header and Controls Toolbar */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <span className="text-xs font-medium text-[#5F665E] block">
                          Format: {selectedPoll.type.replace('_', ' ')}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-[#181F1C] mt-0.5">
                          {selectedPoll.title}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Launch / Active on screen */}
                        <button
                          onClick={() => handleLaunchPoll(selectedPoll)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            room.activePollId === selectedPoll.id
                              ? 'bg-emerald-800 text-white'
                              : 'bg-[#2D4A3E] text-white hover:bg-[#233B31]'
                          }`}
                        >
                          <Play size={13} />
                          <span>{room.activePollId === selectedPoll.id ? 'Active on Screen' : 'Launch to Screen'}</span>
                        </button>

                        {/* Open/Close Voting */}
                        <button
                          onClick={handleToggleVoting}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                            selectedPoll.isOpen
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {selectedPoll.isOpen ? <Lock size={13} /> : <LockOpen size={13} />}
                          <span>{selectedPoll.isOpen ? 'Close Voting' : 'Open Voting'}</span>
                        </button>

                        {/* Reveal Results */}
                        <button
                          onClick={handleToggleShowResults}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#181F1C] bg-white hover:bg-[#F5F4EE] border border-[#D0CEC4] flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {selectedPoll.showResults ? <EyeOff size={13} /> : <Eye size={13} />}
                          <span>{selectedPoll.showResults ? 'Hide Results' : 'Show Results'}</span>
                        </button>

                        {/* Show Correct Answer (if quiz or MCQ) */}
                        {(selectedPoll.type === 'quiz' || selectedPoll.type === 'multiple_choice') && (
                          <button
                            onClick={handleToggleShowCorrect}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#181F1C] bg-white hover:bg-[#F5F4EE] border border-[#D0CEC4] flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <CheckCircle size={13} />
                            <span>{selectedPoll.showCorrect ? 'Hide Correct' : 'Show Correct'}</span>
                          </button>
                        )}

                        {/* Reset responses */}
                        <button
                          onClick={handleResetResponses}
                          className="p-1.5 rounded-lg text-[#5F665E] hover:text-[#181F1C] bg-white border border-[#D0CEC4] cursor-pointer"
                          title="Reset responses"
                        >
                          <RotateCcw size={14} />
                        </button>

                        {/* Delete poll */}
                        <button
                          onClick={() => handleDeletePoll(selectedPoll.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 bg-white border border-[#D0CEC4] cursor-pointer"
                          title="Delete poll"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Results Monitor Preview */}
                    <div className="p-6 rounded-xl bg-white border border-[#D0CEC4] space-y-4">
                      <div className="flex items-center justify-between text-xs text-[#5F665E] border-b border-[#D0CEC4] pb-2.5"> {/* taste-skill-ignore */}
                        <span className="font-semibold text-[#181F1C] tabular-nums">
                          Live Results Monitor ({responses.length} votes recorded)
                        </span>
                        <span>{selectedPoll.showResults ? 'Visible on Stage' : 'Hidden on Stage'}</span>
                      </div>

                      {selectedPoll.type === 'multiple_choice' || selectedPoll.type === 'quiz' ? (
                        <BarChartVisualizer poll={selectedPoll} responses={responses} />
                      ) : selectedPoll.type === 'word_cloud' ? (
                        <WordCloudVisualizer responses={responses} />
                      ) : selectedPoll.type === 'rating' ? (
                        <RatingVisualizer responses={responses} />
                      ) : (
                        <div className="space-y-2">
                          {responses.map(r => (
                            <div key={r.id} className="p-3 bg-[#EBEAE3] rounded-lg text-xs text-[#181F1C]">
                              &quot;{String(r.value)}&quot;
                            </div>
                          ))}
                          {responses.length === 0 && (
                            <p className="text-xs text-[#8C9188] text-center py-6">No open responses submitted yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-16 text-center rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] text-[#5F665E]">
                    <p className="text-sm">Select a poll from the left or create a new one to begin.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: AUDIENCE Q&A */}
          {activeTab === 'qa' && (
            <div className="p-6 rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#181F1C]">Live Q&amp;A Moderation Queue</h2>
                <p className="text-xs text-[#5F665E]">
                  Pin high-priority questions to highlight them on the main stage screen, mark answered, or dismiss.
                </p>
              </div>

              <div className="space-y-3">
                {questions.map(q => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-white border border-[#D0CEC4] flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-[#181F1C]">{q.authorName}</span>
                        <span className="text-[11px] text-[#8C9188] tabular-nums">
                          &bull; {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {q.isPinned && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2D4A3E] text-white">
                            Pinned on Stage
                          </span>
                        )}
                        {q.isAnswered && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Answered
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#181F1C] leading-snug">{q.text}</p>
                      <span className="text-xs text-[#2D4A3E] font-semibold mt-1 block tabular-nums">
                        ▲ {q.upvotes} upvotes
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQAQuestion(q.id, { isPinned: !q.isPinned })}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#EBEAE3] hover:bg-[#DFDDD3] text-[#181F1C] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Pin size={12} />
                        <span>{q.isPinned ? 'Unpin' : 'Pin to Screen'}</span>
                      </button>

                      <button
                        onClick={() => updateQAQuestion(q.id, { isAnswered: !q.isAnswered })}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#EBEAE3] hover:bg-[#DFDDD3] text-[#181F1C] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <CheckCircle size={12} />
                        <span>{q.isAnswered ? 'Unmark' : 'Mark Answered'}</span>
                      </button>

                      <button
                        onClick={() => deleteQAQuestion(q.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 bg-[#EBEAE3] cursor-pointer"
                        title="Dismiss question"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                {questions.length === 0 && (
                  <div className="text-center py-12 text-xs text-[#5F665E]">
                    No audience questions submitted yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: SURVEYS */}
          {activeTab === 'surveys' && (
            <div className="p-6 rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] space-y-4">
              <h2 className="text-xl font-bold text-[#181F1C]">Self-Paced Surveys</h2>
              {surveys.map(survey => {
                const responsesList = getSurveyResponses(survey.id);
                return (
                  <div key={survey.id} className="p-4 rounded-xl bg-white border border-[#D0CEC4] space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#181F1C]">{survey.title}</h3>
                      <span className="text-xs font-semibold text-[#2D4A3E] bg-emerald-50 px-2 py-0.5 rounded tabular-nums">
                        {responsesList.length} submissions
                      </span>
                    </div>
                    {survey.description && (
                      <p className="text-xs text-[#5F665E]">{survey.description}</p>
                    )}
                    <div className="pt-2 space-y-1">
                      {survey.questions.map((q, idx) => (
                        <div key={q.id} className="p-2 bg-[#EBEAE3] rounded text-xs text-[#181F1C]">
                          {idx + 1}. {q.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {surveys.length === 0 && (
                <p className="text-xs text-[#5F665E] text-center py-8">No surveys created in this session.</p>
              )}
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="p-6 rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] max-w-lg space-y-4">
              <h2 className="text-xl font-bold text-[#181F1C]">Session Settings</h2>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#5F665E] block">Session Title</label>
                <input
                  type="text"
                  value={room.title}
                  onChange={e => {
                    const updated = updateRoom(room.id, { title: e.target.value });
                    if (updated) setRoom(updated);
                  }}
                  className="w-full bg-[#EBEAE3] border border-[#D0CEC4] rounded-lg px-3 py-2 text-sm text-[#181F1C] focus:outline-none focus:border-[#2D4A3E] transition-colors"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={room.allowAnonymousQA}
                  onChange={e => {
                    const updated = updateRoom(room.id, { allowAnonymousQA: e.target.checked });
                    if (updated) setRoom(updated);
                  }}
                  className="w-4 h-4 rounded text-[#2D4A3E] focus:ring-[#2D4A3E] cursor-pointer"
                />
                <span className="text-xs text-[#181F1C] font-medium">Allow attendees to post Q&amp;A anonymously</span>
              </label>
            </div>
          )}
        </main>

        {/* Create Poll Modal */}
        {showCreatePollModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <form
              onSubmit={handleCreatePollSubmit}
              className="w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] space-y-4"
            >
              <h2 className="text-lg font-bold text-[#181F1C]">Create New Poll</h2>

              {/* Poll Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#5F665E] block">Question Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'multiple_choice', label: 'Multiple Choice' },
                    { id: 'word_cloud', label: 'Word Cloud' },
                    { id: 'rating', label: 'Rating (1-5)' },
                    { id: 'quiz', label: 'Quiz Battle' },
                    { id: 'open_text', label: 'Open Feedback' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewPollType(t.id as PollType)}
                      className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center ${
                        newPollType === t.id
                          ? 'bg-[#2D4A3E] text-white'
                          : 'bg-white text-[#181F1C] border border-[#D0CEC4] hover:bg-[#F5F4EE]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#5F665E] block">Question Prompt</label>
                <input
                  type="text"
                  required
                  value={newPollTitle}
                  onChange={e => setNewPollTitle(e.target.value)}
                  placeholder="e.g. Which initiative should we prioritize this quarter?"
                  className="w-full bg-[#EBEAE3] border border-[#D0CEC4] rounded-lg px-3.5 py-2.5 text-sm text-[#181F1C] focus:outline-none focus:border-[#2D4A3E] transition-colors"
                />
              </div>

              {/* Options list for MCQ and Quiz */}
              {(newPollType === 'multiple_choice' || newPollType === 'quiz') && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#5F665E]">
                      Choices {newPollType === 'quiz' && '(Select checkmark for correct answer)'}
                    </label>
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-xs font-semibold text-[#2D4A3E] hover:underline cursor-pointer"
                    >
                      + Add Choice
                    </button>
                  </div>

                  {newPollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {newPollType === 'quiz' && (
                        <button
                          type="button"
                          onClick={() => handleOptionCorrectToggle(idx)}
                          className={`p-1.5 rounded cursor-pointer ${
                            opt.isCorrect ? 'text-emerald-700' : 'text-[#8C9188]'
                          }`}
                          title={opt.isCorrect ? 'Correct Option' : 'Mark as Correct'}
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}

                      <input
                        type="text"
                        required
                        value={opt.text}
                        onChange={e => handleOptionChange(idx, e.target.value)}
                        placeholder={`Choice ${idx + 1}`}
                        className="flex-1 bg-[#EBEAE3] border border-[#D0CEC4] rounded-lg px-3 py-2 text-xs text-[#181F1C] focus:outline-none focus:border-[#2D4A3E] transition-colors"
                      />

                      {newPollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-1.5 text-[#8C9188] hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreatePollModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#181F1C] bg-white hover:bg-[#F5F4EE] rounded-lg border border-[#D0CEC4] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg cursor-pointer transition-colors"
                >
                  Create &amp; Launch
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

        {/* Footer */}
        <footer className="py-4 px-6 border-t border-[#D5D4CB]/60 text-xs text-[#5F665E] text-center"> {/* taste-skill-ignore */}
          <span>surv. host command center &bull; Real-time session management</span>
        </footer>
      </div>
    </div>
  );
}

export default function HostRoomPage(props: HostRoomPageProps) {
  return (
    <React.Suspense fallback={<div className="min-h-[100svh] flex items-center justify-center text-[#5F665E]">Loading session command center...</div>}>
      <HostRoomContent {...props} />
    </React.Suspense>
  );
}
