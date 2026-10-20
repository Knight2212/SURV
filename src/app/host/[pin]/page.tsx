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
  addQAQuestion,
  updateQAQuestion,
  deleteQAQuestion,
  getSurveysForRoom,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  getSurveyResponses,
  updateRoom,
  subscribeToRealtime,
} from '@/lib/store';
import { Room, Poll, PollResponse, QAQuestion, Survey, SurveyQuestion, PollType } from '@/types';
import BarChartVisualizer from '@/components/BarChartVisualizer';
import WordCloudVisualizer from '@/components/WordCloudVisualizer';
import RatingVisualizer from '@/components/RatingVisualizer';
import QRCodeModal from '@/components/QRCodeModal';
import AIGeneratorModal from '@/components/AIGeneratorModal';
import ExportModal from '@/components/ExportModal';
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
  Send,
  Star,
  X,
  ChevronDown,
  ChevronUp,
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
  const [showCreateSurveyModal, setShowCreateSurveyModal] = useState(false);
  const [showHostQAModal, setShowHostQAModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [expandedSurveyId, setExpandedSurveyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // New Poll Form State
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollType, setNewPollType] = useState<PollType>('multiple_choice');
  const [newPollOptions, setNewPollOptions] = useState<Array<{ text: string; isCorrect: boolean }>>([
    { text: 'Option 1', isCorrect: false },
    { text: 'Option 2', isCorrect: false },
  ]);
  const [newPollTimer, setNewPollTimer] = useState<number | ''>('');

  // New Survey Form State
  const [newSurveyTitle, setNewSurveyTitle] = useState('');
  const [newSurveyDescription, setNewSurveyDescription] = useState('');
  const [newSurveyQuestions, setNewSurveyQuestions] = useState<SurveyQuestion[]>([
    { id: 'sq-1', title: "How would you rate today's session overall?", type: 'rating' },
    { id: 'sq-2', title: 'What was your biggest takeaway or key insight?', type: 'open_text' },
  ]);

  // Host Moderator Q&A State
  const [hostQAText, setHostQAText] = useState('');
  const [hostQAPin, setHostQAPin] = useState(true);

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
    const isAlreadyActive = room.activePollId === poll.id;
    const newActiveId = isAlreadyActive ? null : poll.id;
    const updatedRoom = updateRoom(room.id, { activePollId: newActiveId });
    if (updatedRoom) setRoom(updatedRoom);
    setSelectedPoll(poll);
    setResponses(getResponsesForPoll(poll.id));
  };

  const handleToggleVoting = () => {
    if (!selectedPoll) return;
    const updated = updatePoll(selectedPoll.id, { isOpen: !selectedPoll.isOpen });
    if (updated) {
      setSelectedPoll(updated);
      setPolls(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    }
  };

  const handleToggleShowResults = () => {
    if (!selectedPoll) return;
    const updated = updatePoll(selectedPoll.id, { showResults: !selectedPoll.showResults });
    if (updated) {
      setSelectedPoll(updated);
      setPolls(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    }
  };

  const handleToggleShowCorrect = () => {
    if (!selectedPoll) return;
    const updated = updatePoll(selectedPoll.id, { showCorrect: !selectedPoll.showCorrect });
    if (updated) {
      setSelectedPoll(updated);
      setPolls(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    }
  };

  const handleResetResponses = () => {
    if (!selectedPoll) return;
    if (confirm('Reset all participant votes for this poll?')) {
      resetPollResponses(selectedPoll.id);
      setResponses([]);
    }
  };

  // Survey Handlers
  const handleAddSurveyQuestion = () => {
    setNewSurveyQuestions([
      ...newSurveyQuestions,
      {
        id: 'sq-' + Date.now(),
        title: '',
        type: 'rating',
      },
    ]);
  };

  const handleRemoveSurveyQuestion = (idx: number) => {
    if (newSurveyQuestions.length <= 1) return;
    setNewSurveyQuestions(newSurveyQuestions.filter((_, i) => i !== idx));
  };

  const handleSurveyQuestionChange = (idx: number, field: keyof SurveyQuestion, value: any) => {
    setNewSurveyQuestions(
      newSurveyQuestions.map((q, i) => {
        if (i !== idx) return q;
        if (field === 'type' && value === 'choice' && (!q.options || q.options.length === 0)) {
          return { ...q, type: value, options: ['Option 1', 'Option 2'] };
        }
        return { ...q, [field]: value };
      })
    );
  };

  const handleSurveyOptionChange = (qIdx: number, optIdx: number, value: string) => {
    setNewSurveyQuestions(
      newSurveyQuestions.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...(q.options || [])];
        opts[optIdx] = value;
        return { ...q, options: opts };
      })
    );
  };

  const handleAddSurveyOption = (qIdx: number) => {
    setNewSurveyQuestions(
      newSurveyQuestions.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`];
        return { ...q, options: opts };
      })
    );
  };

  const handleCreateSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !newSurveyTitle.trim()) return;

    const validQuestions = newSurveyQuestions
      .filter(q => q.title.trim().length > 0)
      .map(q => ({
        ...q,
        title: q.title.trim(),
      }));

    if (validQuestions.length === 0) return;

    createSurvey({
      roomId: room.id,
      title: newSurveyTitle.trim(),
      description: newSurveyDescription.trim() || undefined,
      questions: validQuestions,
    });

    setSurveys(getSurveysForRoom(room.id));
    setShowCreateSurveyModal(false);
    setNewSurveyTitle('');
    setNewSurveyDescription('');
    setNewSurveyQuestions([
      { id: 'sq-1', title: "How would you rate today's session overall?", type: 'rating' },
      { id: 'sq-2', title: 'What was your biggest takeaway or key insight?', type: 'open_text' },
    ]);
  };

  const handleToggleSurveyOpen = (surveyId: string, currentOpen: boolean) => {
    updateSurvey(surveyId, { isOpen: !currentOpen });
    if (room) setSurveys(getSurveysForRoom(room.id));
  };

  const handleDeleteSurvey = (surveyId: string) => {
    if (!room) return;
    if (confirm('Delete this survey permanently?')) {
      deleteSurvey(surveyId);
      setSurveys(getSurveysForRoom(room.id));
    }
  };

  // Host Moderator Q&A Handler
  const handleCreateHostQASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !hostQAText.trim()) return;

    const created = addQAQuestion({
      roomId: room.id,
      participantId: 'host-moderator',
      authorName: 'Presenter (Host)',
      isAnonymous: false,
      text: hostQAText.trim(),
    });

    if (hostQAPin && created) {
      updateQAQuestion(created.id, { isPinned: true });
    }

    setQuestions(getQAQuestions(room.id));
    setHostQAText('');
    setShowHostQAModal(false);
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
              onClick={() => setShowExportModal(true)}
              className="px-3 py-2 text-xs font-semibold text-[#181F1C] bg-white hover:bg-[#F5F4EE] border border-[#D0CEC4] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export Session Data (Excel, CSV, JSON)"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export</span>
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
                          type="button"
                          onClick={() => handleLaunchPoll(selectedPoll)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            room.activePollId === selectedPoll.id
                              ? 'bg-[#15261F] text-[#c6f19d] border-2 border-[#c6f19d]'
                              : 'bg-[#2D4A3E] text-white hover:bg-[#233B31] border border-[#2D4A3E]'
                          }`}
                          title={room.activePollId === selectedPoll.id ? "Currently live on stage. Click to remove from screen" : "Broadcast this poll onto the main stage screen"}
                        >
                          <Play size={13} className={room.activePollId === selectedPoll.id ? "fill-[#c6f19d]" : ""} />
                          <span>{room.activePollId === selectedPoll.id ? 'Live on Screen' : 'Launch to Screen'}</span>
                        </button>

                        {/* Open/Close Voting */}
                        <button
                          type="button"
                          onClick={handleToggleVoting}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                            selectedPoll.isOpen
                              ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                              : 'bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-800'
                          }`}
                          title={selectedPoll.isOpen ? "Voting is live. Click to close" : "Voting is closed. Click to reopen"}
                        >
                          {selectedPoll.isOpen ? <Lock size={13} /> : <LockOpen size={13} />}
                          <span>{selectedPoll.isOpen ? 'Close Voting' : 'Open Voting'}</span>
                        </button>

                        {/* Reveal Results */}
                        <button
                          type="button"
                          onClick={handleToggleShowResults}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                            selectedPoll.showResults
                              ? 'bg-[#2D4A3E] text-[#c6f19d] border-[#2D4A3E]'
                              : 'bg-white text-[#5F665E] hover:text-[#181F1C] border-[#D0CEC4] hover:bg-[#F5F4EE]'
                          }`}
                          title={selectedPoll.showResults ? "Results visible on stage. Click to hide" : "Results hidden from audience. Click to show"}
                        >
                          {selectedPoll.showResults ? <Eye size={13} /> : <EyeOff size={13} />}
                          <span>{selectedPoll.showResults ? 'Hide Results' : 'Show Results'}</span>
                        </button>

                        {/* Show Correct Answer (if quiz or MCQ) */}
                        {(selectedPoll.type === 'quiz' || selectedPoll.type === 'multiple_choice') && (
                          <button
                            type="button"
                            onClick={handleToggleShowCorrect}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                              selectedPoll.showCorrect
                                ? 'bg-[#2D4A3E] text-[#c6f19d] border-[#2D4A3E]'
                                : 'bg-white text-[#5F665E] hover:text-[#181F1C] border-[#D0CEC4] hover:bg-[#F5F4EE]'
                            }`}
                            title={selectedPoll.showCorrect ? "Correct answer revealed. Click to hide" : "Correct answer hidden. Click to show"}
                          >
                            <CheckCircle size={13} />
                            <span>{selectedPoll.showCorrect ? 'Hide Correct' : 'Show Correct'}</span>
                          </button>
                        )}

                        {/* Reset responses */}
                        <button
                          type="button"
                          onClick={handleResetResponses}
                          className="p-2 rounded-xl text-[#5F665E] hover:text-[#181F1C] bg-white hover:bg-[#F5F4EE] border border-[#D0CEC4] cursor-pointer transition-colors"
                          title="Reset responses"
                        >
                          <RotateCcw size={14} />
                        </button>

                        {/* Delete poll */}
                        <button
                          type="button"
                          onClick={() => handleDeletePoll(selectedPoll.id)}
                          className="p-2 rounded-xl text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-[#D0CEC4] cursor-pointer transition-colors"
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
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-[#181F1C]">Live Q&amp;A Moderation Queue</h2>
                  <p className="text-xs text-[#5F665E]">
                    Pin high-priority questions to highlight them on the main stage screen, mark answered, or post moderator prompts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHostQAModal(true)}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus size={14} />
                  <span>Post Moderator Prompt</span>
                </button>
              </div>

              <div className="space-y-3">
                {questions.map(q => (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-colors ${
                      q.isPinned
                        ? 'bg-[#EAE8DF] border-[#2D4A3E]'
                        : 'bg-white border-[#D0CEC4]'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-[#181F1C]">{q.authorName}</span>
                        <span className="text-[11px] text-[#8C9188] tabular-nums">
                          &bull; {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {q.isPinned && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2D4A3E] text-[#c6f19d] flex items-center gap-1">
                            <Pin size={10} />
                            <span>Pinned on Stage</span>
                          </span>
                        )}
                        {q.isAnswered && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            <span>Answered</span>
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
                        type="button"
                        onClick={() => {
                          const updated = updateQAQuestion(q.id, { isPinned: !q.isPinned });
                          if (updated && room) setQuestions(getQAQuestions(room.id));
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border ${
                          q.isPinned
                            ? 'bg-[#2D4A3E] text-[#c6f19d] border-[#2D4A3E]'
                            : 'bg-[#EBEAE3] hover:bg-[#DFDDD3] text-[#181F1C] border-[#D0CEC4]'
                        }`}
                        title={q.isPinned ? "Click to unpin from stage" : "Pin to stage screen ticker"}
                      >
                        <Pin size={12} />
                        <span>{q.isPinned ? 'Unpin' : 'Pin to Screen'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = updateQAQuestion(q.id, { isAnswered: !q.isAnswered });
                          if (updated && room) setQuestions(getQAQuestions(room.id));
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border ${
                          q.isAnswered
                            ? 'bg-emerald-700 text-white border-emerald-800'
                            : 'bg-[#EBEAE3] hover:bg-[#DFDDD3] text-[#181F1C] border-[#D0CEC4]'
                        }`}
                        title={q.isAnswered ? "Click to unmark" : "Mark as answered"}
                      >
                        <CheckCircle size={12} />
                        <span>{q.isAnswered ? 'Answered' : 'Mark Answered'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          deleteQAQuestion(q.id);
                          if (room) setQuestions(getQAQuestions(room.id));
                        }}
                        className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 bg-[#EBEAE3] hover:bg-rose-50 border border-[#D0CEC4] cursor-pointer transition-colors"
                        title="Dismiss question"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                {questions.length === 0 && (
                  <div className="text-center py-12 text-[#5F665E] space-y-3">
                    <MessageSquare size={32} className="mx-auto text-[#8C9188]" />
                    <p className="text-xs">No audience questions submitted yet.</p>
                    <button
                      type="button"
                      onClick={() => setShowHostQAModal(true)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg cursor-pointer transition-colors"
                    >
                      Post Moderator Prompt
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: SURVEYS */}
          {activeTab === 'surveys' && (
            <div className="p-6 rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-[#181F1C]">Self-Paced Surveys</h2>
                  <p className="text-xs text-[#5F665E]">
                    Create and distribute multi-question feedback forms and evaluations to audience members.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateSurveyModal(true)}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus size={14} />
                  <span>Create New Survey</span>
                </button>
              </div>

              <div className="space-y-4">
                {surveys.map(survey => {
                  const responsesList = getSurveyResponses(survey.id);
                  const isExpanded = expandedSurveyId === survey.id;

                  return (
                    <div key={survey.id} className="p-5 rounded-2xl bg-white border border-[#D0CEC4] space-y-3">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-[#181F1C]">{survey.title}</h3>
                            <span className="text-xs font-semibold text-[#2D4A3E] bg-[#EBEAE3] px-2.5 py-0.5 rounded-full tabular-nums">
                              {survey.questions.length} question(s)
                            </span>
                            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full tabular-nums">
                              {responsesList.length} response(s)
                            </span>
                          </div>
                          {survey.description && (
                            <p className="text-xs text-[#5F665E]">{survey.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Toggle Open / Closed */}
                          <button
                            type="button"
                            onClick={() => handleToggleSurveyOpen(survey.id, survey.isOpen)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                              survey.isOpen
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                            }`}
                            title={survey.isOpen ? "Survey is accepting answers. Click to close" : "Survey is closed. Click to open"}
                          >
                            {survey.isOpen ? <Lock size={12} /> : <LockOpen size={12} />}
                            <span>{survey.isOpen ? 'Active (Close)' : 'Closed (Reopen)'}</span>
                          </button>

                          {/* View Submissions */}
                          <button
                            type="button"
                            onClick={() => setExpandedSurveyId(isExpanded ? null : survey.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                              isExpanded
                                ? 'bg-[#2D4A3E] text-white border-[#2D4A3E]'
                                : 'bg-[#EBEAE3] hover:bg-[#DFDDD3] text-[#181F1C] border-[#D0CEC4]'
                            }`}
                          >
                            <span>{isExpanded ? 'Hide Responses' : `View Responses (${responsesList.length})`}</span>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>

                          {/* Delete Survey */}
                          <button
                            type="button"
                            onClick={() => handleDeleteSurvey(survey.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 bg-[#EBEAE3] hover:bg-rose-50 border border-[#D0CEC4] cursor-pointer transition-colors"
                            title="Delete survey"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Question Summary */}
                      <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {survey.questions.map((q, idx) => (
                          <div key={q.id} className="p-2.5 bg-[#F5F4EE] rounded-xl border border-[#D0CEC4]/60 text-xs text-[#181F1C]">
                            <span className="font-semibold text-[#2D4A3E] block mb-0.5">Q{idx + 1} &bull; {q.type.replace('_', ' ')}</span>
                            <span className="line-clamp-2">{q.title}</span>
                          </div>
                        ))}
                      </div>

                      {/* Expanded Submissions Breakdown */}
                      {isExpanded && (
                        <div className="pt-3 space-y-3 bg-[#F5F4EE] p-4 rounded-xl">
                          <h4 className="text-xs font-bold text-[#181F1C]">
                            Participant Responses ({responsesList.length})
                          </h4>
                          {responsesList.length === 0 ? (
                            <p className="text-xs text-[#8C9188] italic py-2">No participants have submitted answers to this survey yet.</p>
                          ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {responsesList.map((resp, rIdx) => (
                                <div key={resp.id || rIdx} className="p-3 bg-[#EBEAE3] rounded-xl border border-[#D0CEC4] text-xs space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#5F665E]">
                                    <span>{resp.participantName || `Participant ${rIdx + 1}`}</span>
                                    <span>{new Date(resp.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <div className="space-y-1 pl-1">
                                    {survey.questions.map(q => (
                                      <div key={q.id} className="text-[#181F1C]">
                                        <span className="font-medium text-[#5F665E]">{q.title}: </span>
                                        <span className="font-semibold text-[#2D4A3E]">
                                          {resp.answers[q.id] !== undefined ? String(resp.answers[q.id]) : '—'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {surveys.length === 0 && (
                  <div className="text-center py-12 text-[#5F665E] space-y-3">
                    <ClipboardList size={32} className="mx-auto text-[#8C9188]" />
                    <p className="text-xs">No surveys created in this session yet.</p>
                    <button
                      type="button"
                      onClick={() => setShowCreateSurveyModal(true)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg cursor-pointer transition-colors"
                    >
                      Create Your First Survey
                    </button>
                  </div>
                )}
              </div>
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

        {/* Create Survey Modal */}
        {showCreateSurveyModal && (
          <div data-ui="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
            <div className="w-full max-w-xl max-h-[90svh] overflow-y-auto rounded-2xl bg-[#E6E5DC] border border-[#D0CEC4] p-6 space-y-5 text-[#181F1C]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#181F1C]">Create New Survey</h3>
                  <p className="text-xs text-[#5F665E]">Self-paced questionnaire distributed to attendees</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateSurveyModal(false)}
                  className="p-1.5 rounded-lg text-[#5F665E] hover:text-[#181F1C] bg-[#DFDDD3] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateSurveySubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#181F1C] block">Survey Title</label>
                  <input
                    type="text"
                    required
                    value={newSurveyTitle}
                    onChange={e => setNewSurveyTitle(e.target.value)}
                    placeholder="e.g. End-of-Session Feedback & Evaluation"
                    className="w-full bg-[#DFDDD3] border border-[#D0CEC4] rounded-lg px-3 py-2 text-xs text-[#181F1C] focus:outline-none focus:border-[#2D4A3E]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#181F1C] block">Description (Optional)</label>
                  <input
                    type="text"
                    value={newSurveyDescription}
                    onChange={e => setNewSurveyDescription(e.target.value)}
                    placeholder="e.g. Help us improve future events by sharing your thoughts"
                    className="w-full bg-[#DFDDD3] border border-[#D0CEC4] rounded-lg px-3 py-2 text-xs text-[#181F1C] focus:outline-none focus:border-[#2D4A3E]"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#181F1C]">
                      Survey Questions ({newSurveyQuestions.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSurveyQuestion}
                      className="text-xs font-semibold text-[#2D4A3E] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Add Question</span>
                    </button>
                  </div>

                  {newSurveyQuestions.map((q, qIdx) => (
                    <div key={q.id} className="p-3.5 rounded-xl bg-white border border-[#D0CEC4] space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#2D4A3E]">Question {qIdx + 1}</span>
                        {newSurveyQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSurveyQuestion(qIdx)}
                            className="text-xs text-rose-600 hover:text-rose-700 cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        required
                        value={q.title}
                        onChange={e => handleSurveyQuestionChange(qIdx, 'title', e.target.value)}
                        placeholder="Type question prompt..."
                        className="w-full bg-[#DFDDD3] border border-[#D0CEC4] rounded-lg px-3 py-1.5 text-xs text-[#181F1C] focus:outline-none focus:border-[#2D4A3E]"
                      />

                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-[#5F665E] font-medium">Format:</label>
                        <select
                          value={q.type}
                          onChange={e => handleSurveyQuestionChange(qIdx, 'type', e.target.value)}
                          className="bg-[#DFDDD3] border border-[#D0CEC4] rounded px-2 py-1 text-xs text-[#181F1C] focus:outline-none cursor-pointer"
                        >
                          <option value="rating">1–5 Star Rating</option>
                          <option value="open_text">Open Text Feedback</option>
                          <option value="choice">Multiple Choice</option>
                        </select>
                      </div>

                      {q.type === 'choice' && (
                        <div className="space-y-1.5 pt-1 pl-2 border-l-2 border-[#2D4A3E]/30">
                          <span className="text-[11px] font-semibold text-[#5F665E]">Options:</span>
                          {(q.options || []).map((opt, optIdx) => (
                            <input
                              key={optIdx}
                              type="text"
                              value={opt}
                              onChange={e => handleSurveyOptionChange(qIdx, optIdx, e.target.value)}
                              placeholder={`Choice ${optIdx + 1}`}
                              className="w-full bg-[#DFDDD3] border border-[#D0CEC4] rounded px-2.5 py-1 text-xs text-[#181F1C] focus:outline-none"
                            />
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddSurveyOption(qIdx)}
                            className="text-[11px] text-[#2D4A3E] font-semibold hover:underline cursor-pointer"
                          >
                            + Add Choice
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateSurveyModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#181F1C] bg-white hover:bg-[#F5F4EE] rounded-lg border border-[#D0CEC4] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg cursor-pointer transition-colors"
                  >
                    Publish Survey
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Host Moderator Q&A Prompt Modal */}
        {showHostQAModal && (
          <div data-ui="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
            <div className="w-full max-w-md rounded-2xl bg-[#E6E5DC] border border-[#D0CEC4] p-6 space-y-4 text-[#181F1C]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#181F1C]">Post Moderator Prompt</h3>
                  <p className="text-xs text-[#5F665E]">Add a question or discussion prompt to the live Q&amp;A feed</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHostQAModal(false)}
                  className="p-1.5 rounded-lg text-[#5F665E] hover:text-[#181F1C] bg-[#DFDDD3] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateHostQASubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#181F1C] block">Question or Discussion Prompt</label>
                  <textarea
                    required
                    rows={3}
                    value={hostQAText}
                    onChange={e => setHostQAText(e.target.value)}
                    placeholder="e.g. What questions do you have about today's presentation?"
                    className="w-full bg-[#DFDDD3] border border-[#D0CEC4] rounded-lg px-3 py-2 text-xs text-[#181F1C] focus:outline-none focus:border-[#2D4A3E]"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hostQAPin}
                    onChange={e => setHostQAPin(e.target.checked)}
                    className="rounded border-[#D0CEC4] text-[#2D4A3E] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-[#181F1C]">Pin immediately to main stage screen ticker</span>
                </label>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowHostQAModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#181F1C] bg-white hover:bg-[#F5F4EE] rounded-lg border border-[#D0CEC4] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg cursor-pointer transition-colors"
                  >
                    Post to Q&amp;A
                  </button>
                </div>
              </form>
            </div>
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

        {/* Session Data Export Modal (Excel, CSV, JSON) */}
        {showExportModal && room && (
          <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            data={{
              room,
              polls: polls.map(p => ({
                ...p,
                responses: getResponsesForPoll(p.id),
              })),
              qaQuestions: questions,
              surveys: surveys.map(s => ({
                ...s,
                responses: getSurveyResponses(s.id),
              })),
              exportedAt: new Date().toISOString(),
            }}
          />
        )}

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
