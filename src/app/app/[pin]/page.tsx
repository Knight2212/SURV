'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  getRoomByPin,
  getPollsForRoom,
  getResponsesForPoll,
  submitPollResponse,
  getQAQuestions,
  addQAQuestion,
  toggleUpvoteQA,
  getSurveysForRoom,
  submitSurveyResponse,
  getSurveyResponses,
  subscribeToRealtime,
} from '@/lib/store';
import { Room, Poll, PollResponse, QAQuestion, Survey } from '@/types';
import ActivePollCard from '@/components/ActivePollCard';
import LiveQAFeed from '@/components/LiveQAFeed';
import { Radio, BarChart2, MessageSquare, ClipboardList, User, ArrowLeft, CheckCircle2, Star, Sparkles, Send } from 'lucide-react';

interface ParticipantPageProps {
  params: Promise<{ pin: string }>;
}

function ParticipantContent({ params }: ParticipantPageProps) {
  const unwrappedParams = use(params);
  const rawPin = unwrappedParams.pin;
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'polls' | 'qa' | 'surveys'>('polls');

  // Participant state
  const [participantId, setParticipantId] = useState('');
  const [participantName, setParticipantName] = useState('Attendee');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Polls & responses
  const [polls, setPolls] = useState<Poll[]>([]);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [activePollResponses, setActivePollResponses] = useState<PollResponse[]>([]);

  // Q&A
  const [questions, setQuestions] = useState<QAQuestion[]>([]);

  // Surveys
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, Record<string, any>>>({});
  const [surveySubmitted, setSurveySubmitted] = useState<Record<string, boolean>>({});

  // Initialize participant and load session
  useEffect(() => {
    // Generate or retrieve persistent participant ID
    let pid = localStorage.getItem('surv_participant_id');
    if (!pid) {
      pid = 'p-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('surv_participant_id', pid);
    }
    setParticipantId(pid);

    const savedName = localStorage.getItem('surv_participant_name') || 'Guest ' + pid.slice(-3);
    setParticipantName(savedName);
    setTempName(savedName);

    const targetRoom = getRoomByPin(rawPin);
    if (!targetRoom) {
      setLoading(false);
      return;
    }

    setRoom(targetRoom);
    refreshData(targetRoom.id, targetRoom.activePollId);
    setLoading(false);

    // Subscribe to real-time events
    const unsubscribe = subscribeToRealtime(event => {
      if (targetRoom) {
        if (event.type === 'ROOM_UPDATED' && event.room.id === targetRoom.id) {
          setRoom(event.room);
          refreshData(targetRoom.id, event.room.activePollId);
        } else if (event.type === 'ACTIVE_POLL_CHANGED') {
          refreshData(targetRoom.id, event.pollId);
        } else if (event.type === 'POLL_STATE_CHANGED' || event.type === 'POLL_RESET') {
          refreshData(targetRoom.id, targetRoom.activePollId);
        } else if (event.type === 'RESPONSE_SUBMITTED') {
          if (targetRoom.activePollId && event.response.pollId === targetRoom.activePollId) {
            setActivePollResponses(getResponsesForPoll(targetRoom.activePollId));
          }
        } else if (
          event.type === 'QA_ADDED' ||
          event.type === 'QA_UPVOTED' ||
          event.type === 'QA_UPDATED' ||
          event.type === 'QA_DELETED'
        ) {
          setQuestions(getQAQuestions(targetRoom.id));
        } else if (event.type === 'SURVEY_STATE_CHANGED') {
          setSurveys(getSurveysForRoom(targetRoom.id));
        }
      }
    });

    return () => unsubscribe();
  }, [rawPin]);

  const refreshData = (roomId: string, currentActivePollId: string | null) => {
    const roomPolls = getPollsForRoom(roomId);
    setPolls(roomPolls);

    const active = roomPolls.find(p => p.id === currentActivePollId) || null;
    setActivePoll(active);

    if (active) {
      setActivePollResponses(getResponsesForPoll(active.id));
    } else {
      setActivePollResponses([]);
    }

    setQuestions(getQAQuestions(roomId));
    const roomSurveys = getSurveysForRoom(roomId);
    setSurveys(roomSurveys);

    // Check existing survey submissions
    const submittedMap: Record<string, boolean> = {};
    roomSurveys.forEach(s => {
      const resp = getSurveyResponses(s.id);
      if (resp.some(r => r.participantId === participantId)) {
        submittedMap[s.id] = true;
      }
    });
    setSurveySubmitted(submittedMap);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    setParticipantName(tempName.trim());
    localStorage.setItem('surv_participant_name', tempName.trim());
    setIsEditingName(false);
  };

  const handleVote = (value: string | string[] | number) => {
    if (!activePoll || !room) return;
    submitPollResponse({
      pollId: activePoll.id,
      roomId: room.id,
      participantId,
      participantName,
      value,
    });
    setActivePollResponses(getResponsesForPoll(activePoll.id));
  };

  const handleUpvote = (questionId: string) => {
    toggleUpvoteQA(questionId, participantId);
    if (room) setQuestions(getQAQuestions(room.id));
  };

  const handleAskQuestion = (text: string, isAnon: boolean) => {
    if (!room) return;
    addQAQuestion({
      roomId: room.id,
      participantId,
      authorName: isAnon ? 'Anonymous' : participantName,
      isAnonymous: isAnon,
      text,
    });
    setQuestions(getQAQuestions(room.id));
  };

  const handleSurveyAnswerChange = (surveyId: string, qId: string, val: any) => {
    setSurveyAnswers(prev => ({
      ...prev,
      [surveyId]: {
        ...(prev[surveyId] || {}),
        [qId]: val,
      },
    }));
  };

  const handleSurveySubmit = (survey: Survey) => {
    if (!room) return;
    const answers = surveyAnswers[survey.id] || {};
    submitSurveyResponse({
      surveyId: survey.id,
      roomId: room.id,
      participantId,
      participantName,
      answers,
    });
    setSurveySubmitted(prev => ({ ...prev, [survey.id]: true }));
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Radio size={36} color="var(--primary)" style={{ animation: 'pulse-ring 1.5s infinite' }} />
          <p style={{ marginTop: '14px', color: 'var(--text-muted)' }}>Connecting to session...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="glass-panel" style={{ maxWidth: '420px', padding: '36px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.4rem', color: '#FFFFFF', marginBottom: '8px' }}>Session Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            We could not locate any active session with PIN <strong>{rawPin}</strong>.
          </p>
          <button onClick={() => router.push('/')} className="glow-btn" style={{ width: '100%', justifyContent: 'center' }}>
            <ArrowLeft size={16} /> Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#07090E] text-slate-100">
      {/* Top Header */}
      <header className="sticky top-0 z-40 px-4 sm:px-6 py-3.5 border-b border-white/10 bg-[#07090E]/90 backdrop-blur-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => router.push('/')}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title="Leave session"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-white truncate max-w-[180px] sm:max-w-xs">
              {room.title}
            </h1>
            <span className="text-xs font-mono font-semibold text-cyan-400">
              PIN: {room.pin}
            </span>
          </div>
        </div>

        {/* Participant Name Badge */}
        <button
          onClick={() => setIsEditingName(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
          title="Change your display name"
        >
          <User size={13} className="text-indigo-400" />
          <span className="max-w-[90px] sm:max-w-[120px] truncate">
            {participantName}
          </span>
        </button>
      </header>

      {/* Name Edit Modal */}
      {isEditingName && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <form
            onSubmit={handleSaveName}
            className="glass-panel"
            style={{ width: '100%', maxWidth: '340px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <h3 style={{ fontSize: '1.1rem', color: '#FFFFFF', fontWeight: 700 }}>Your Display Name</h3>
            <input
              type="text"
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              placeholder="Enter your name"
              maxLength={24}
              autoFocus
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-light)',
                color: '#FFFFFF',
                fontSize: '0.95rem',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="secondary-btn"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="glow-btn"
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              >
                Save Name
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '20px 16px 80px', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
        {/* TAB 1: POLLS */}
        {activeTab === 'polls' && (
          <div>
            {activePoll ? (
              <ActivePollCard
                poll={activePoll}
                responses={activePollResponses}
                currentParticipantId={participantId}
                participantName={participantName}
                onSubmitVote={handleVote}
              />
            ) : (
              <div
                className="glass-panel"
                style={{
                  padding: '50px 24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                }}>
                  <BarChart2 size={32} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
                    Waiting for Poll
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: '340px' }}>
                    The host hasn&apos;t opened a live poll right now. As soon as one is launched, it will automatically appear here!
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--success)' }}>
                  <span className="badge-pulse" /> Connected to live room
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Q&A */}
        {activeTab === 'qa' && (
          <LiveQAFeed
            questions={questions}
            currentParticipantId={participantId}
            allowAnonymous={room.allowAnonymousQA}
            onUpvote={handleUpvote}
            onSubmitQuestion={handleAskQuestion}
          />
        )}

        {/* TAB 3: SURVEYS */}
        {activeTab === 'surveys' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {surveys.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ClipboardList size={32} style={{ marginBottom: '10px', opacity: 0.6 }} />
                <p>No active surveys in this session right now.</p>
              </div>
            ) : (
              surveys.map(survey => {
                const isSubmitted = surveySubmitted[survey.id];
                const currentResponses = surveyAnswers[survey.id] || {};

                return (
                  <div
                    key={survey.id}
                    className="glass-panel"
                    style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}
                  >
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
                        {survey.title}
                      </h3>
                      {survey.description && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{survey.description}</p>
                      )}
                    </div>

                    {isSubmitted ? (
                      <div style={{
                        padding: '24px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <CheckCircle2 size={36} color="var(--success)" />
                        <h4 style={{ color: '#FFFFFF', fontSize: '1.05rem', fontWeight: 700 }}>Thank you for your feedback!</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your responses have been recorded by the presenter.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {survey.questions.map((q, idx) => (
                          <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#FFFFFF' }}>
                              {idx + 1}. {q.title}
                            </label>

                            {/* RATING */}
                            {q.type === 'rating' && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {[1, 2, 3, 4, 5].map(star => {
                                  const isActive = (currentResponses[q.id] || 0) >= star;
                                  return (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => handleSurveyAnswerChange(survey.id, q.id, star)}
                                      style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.05)' }}
                                    >
                                      <Star size={24} fill={isActive ? 'var(--warning)' : 'transparent'} stroke={isActive ? 'var(--warning)' : 'var(--text-dim)'} />
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* CHOICE */}
                            {q.type === 'choice' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {q.options?.map(opt => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleSurveyAnswerChange(survey.id, q.id, opt)}
                                    style={{
                                      padding: '10px 14px',
                                      borderRadius: 'var(--radius-sm)',
                                      background: currentResponses[q.id] === opt ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                                      border: `1px solid ${currentResponses[q.id] === opt ? 'var(--primary)' : 'var(--border-subtle)'}`,
                                      color: '#FFFFFF',
                                      textAlign: 'left',
                                      fontSize: '0.9rem',
                                    }}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* OPEN TEXT */}
                            {q.type === 'open_text' && (
                              <textarea
                                value={currentResponses[q.id] || ''}
                                onChange={e => handleSurveyAnswerChange(survey.id, q.id, e.target.value)}
                                placeholder="Write your comments..."
                                rows={3}
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'var(--bg-input)',
                                  border: '1px solid var(--border-light)',
                                  color: '#FFFFFF',
                                  fontSize: '0.9rem',
                                  resize: 'none',
                                }}
                              />
                            )}
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleSurveySubmit(survey)}
                          className="glow-btn"
                          style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}
                        >
                          <Send size={16} /> Submit Survey Responses
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Bottom Sticky Tab Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 max-w-lg mx-auto bg-[#07090E]/95 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around py-2.5 px-4">
        <button
          onClick={() => setActiveTab('polls')}
          className={`flex flex-col items-center gap-1 relative transition-colors cursor-pointer ${
            activeTab === 'polls' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 size={20} />
          <span className="text-[11px]">Polls</span>
          {activePoll && (
            <span className="absolute -top-0.5 right-1 w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('qa')}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'qa' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare size={20} />
          <span className="text-[11px]">Q&A ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('surveys')}
          className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'surveys' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardList size={20} />
          <span className="text-[11px]">Surveys</span>
        </button>
      </nav>
    </div>
  );
}

export default function ParticipantPage(props: ParticipantPageProps) {
  return (
    <React.Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Connecting to session...</div>}>
      <ParticipantContent {...props} />
    </React.Suspense>
  );
}

