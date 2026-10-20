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
import { BarChart2, MessageSquare, ClipboardList, User, ArrowLeft, CheckCircle2, Star, Send, Sparkles, Radio } from 'lucide-react';

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
      <div className="min-h-[100svh] bg-[#283E34] p-2 sm:p-4 text-[#181F1C]">
        <div className="bg-[#E6E5DC] rounded-2xl sm:rounded-3xl min-h-[calc(100svh-1rem)] sm:min-h-[calc(100svh-2rem)] flex flex-col items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#DFDDD3] border border-[#D0CEC4] mx-auto flex items-center justify-center text-[#2D4A3E]">
              <Radio size={20} />
            </div>
            <p className="text-sm font-medium text-[#5F665E]">Connecting to session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-[100svh] bg-[#283E34] p-2 sm:p-4 text-[#181F1C]">
        <div className="bg-[#E6E5DC] rounded-2xl sm:rounded-3xl min-h-[calc(100svh-1rem)] sm:min-h-[calc(100svh-2rem)] flex flex-col justify-between overflow-hidden">
          <header className="px-6 py-5 border-b border-[#D5D4CB]/60 flex items-center justify-between"> {/* taste-skill-ignore */}
            <div
              className="flex items-center gap-2 cursor-pointer bg-[#DFDDD3] px-3 py-1.5 rounded-lg border border-[#D0CEC4]"
              onClick={() => router.push('/')}
            >
              <div className="w-5 h-5 rounded bg-[#181F1C] text-[#E6E5DC] flex items-center justify-center">
                <Sparkles size={12} />
              </div>
              <span className="text-base font-semibold tracking-tight text-[#181F1C]">
                surv<span className="text-[#2D4A3E]">.</span>
              </span>
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-[#181F1C] mb-2">Session Not Found</h2>
            <p className="text-sm text-[#5F665E] leading-relaxed mb-6">
              We could not locate any active session with PIN <strong className="text-[#181F1C] font-semibold">{rawPin}</strong>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/app')}
                className="px-4 py-2 text-xs font-semibold text-[#181F1C] bg-white hover:bg-[#F5F4EE] rounded-lg border border-[#D0CEC4] transition-colors cursor-pointer"
              >
                Try Another PIN
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg transition-colors cursor-pointer"
              >
                Return to Home
              </button>
            </div>
          </main>

          <footer className="py-4 text-center text-xs text-[#5F665E]">
            surv. &bull; Live audience engagement
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-[#283E34] p-2 sm:p-4 text-[#181F1C]">
      <div className="bg-[#E6E5DC] rounded-2xl sm:rounded-3xl min-h-[calc(100svh-1rem)] sm:min-h-[calc(100svh-2rem)] flex flex-col justify-between overflow-hidden">
        {/* Top Header */}
        <header className="px-4 sm:px-8 py-3.5 border-b border-[#D5D4CB]/60 flex items-center justify-between gap-3 bg-[#E6E5DC]"> {/* taste-skill-ignore */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => router.push('/')}
              className="p-1.5 text-[#5F665E] hover:text-[#181F1C] rounded-lg hover:bg-[#DFDDD3] transition-colors cursor-pointer"
              title="Leave session"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-[#181F1C] truncate max-w-[170px] sm:max-w-xs">
                {room.title}
              </h1>
              <span className="text-xs tabular-nums text-[#5F665E]">
                PIN: <strong className="text-[#2D4A3E]">{room.pin}</strong>
              </span>
            </div>
          </div>

          {/* Participant Name Badge */}
          <button
            onClick={() => setIsEditingName(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F5F4EE] border border-[#D0CEC4] text-xs font-medium text-[#181F1C] transition-colors cursor-pointer"
            title="Change your display name"
          >
            <User size={13} className="text-[#2D4A3E]" />
            <span className="max-w-[100px] truncate">
              {participantName}
            </span>
          </button>
        </header>

        {/* Name Edit Modal */}
        {isEditingName && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <form
              onSubmit={handleSaveName}
              className="w-full max-w-sm p-6 rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] space-y-4"
            >
              <h3 className="text-base font-semibold text-[#181F1C]">Your Display Name</h3>
              <input
                type="text"
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                placeholder="Enter your name"
                maxLength={24}
                autoFocus
                className="w-full bg-[#EBEAE3] border border-[#D0CEC4] rounded-lg px-3.5 py-2.5 text-sm text-[#181F1C] focus:outline-none focus:border-[#2D4A3E] transition-colors"
              />
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#181F1C] bg-white hover:bg-[#F5F4EE] rounded-lg border border-[#D0CEC4] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg transition-colors cursor-pointer"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Selector */}
        <div className="px-4 sm:px-8 pt-4 pb-2 max-w-2xl mx-auto w-full">
          <div className="inline-flex w-full bg-[#DFDDD3] p-1 rounded-xl border border-[#D0CEC4]">
            <button
              onClick={() => setActiveTab('polls')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'polls'
                  ? 'bg-[#2D4A3E] text-white'
                  : 'text-[#5F665E] hover:text-[#181F1C]'
              }`}
            >
              <BarChart2 size={14} />
              <span>Live Polls</span>
              {activePoll && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#c6f19d]" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('qa')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'qa'
                  ? 'bg-[#2D4A3E] text-white'
                  : 'text-[#5F665E] hover:text-[#181F1C]'
              }`}
            >
              <MessageSquare size={14} />
              <span>Q&amp;A ({questions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('surveys')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'surveys'
                  ? 'bg-[#2D4A3E] text-white'
                  : 'text-[#5F665E] hover:text-[#181F1C]'
              }`}
            >
              <ClipboardList size={14} />
              <span>Surveys ({surveys.length})</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 px-4 sm:px-8 py-4 max-w-2xl mx-auto w-full">
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
                <div className="p-12 text-center rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#EBEAE3] border border-[#D0CEC4] mx-auto flex items-center justify-center text-[#2D4A3E]">
                    <BarChart2 size={24} />
                  </div>
                  <h3 className="text-base font-semibold text-[#181F1C]">
                    Waiting for Live Poll
                  </h3>
                  <p className="text-xs text-[#5F665E] max-w-xs mx-auto leading-relaxed">
                    The presenter hasn&apos;t opened a live poll right now. As soon as one is activated on stage, it will appear here automatically.
                  </p>
                  <div className="pt-2 text-[11px] text-[#2D4A3E] font-medium flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    <span>Connected &bull; listening for presenter updates</span>
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
            <div className="space-y-4">
              {surveys.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] text-[#5F665E] space-y-2">
                  <ClipboardList size={28} className="mx-auto text-[#8C9188]" />
                  <p className="text-xs font-medium">No surveys published in this session yet.</p>
                </div>
              ) : (
                surveys.map(survey => {
                  const isSubmitted = surveySubmitted[survey.id];
                  const currentResponses = surveyAnswers[survey.id] || {};

                  return (
                    <div
                      key={survey.id}
                      className="p-6 rounded-2xl bg-[#DFDDD3] border border-[#D0CEC4] space-y-4"
                    >
                      <div>
                        <h3 className="text-base font-semibold text-[#181F1C]">
                          {survey.title}
                        </h3>
                        {survey.description && (
                          <p className="text-xs text-[#5F665E] mt-0.5">{survey.description}</p>
                        )}
                      </div>

                      {isSubmitted ? (
                        <div className="p-6 rounded-xl bg-white border border-[#D0CEC4] text-center space-y-1.5">
                          <CheckCircle2 size={32} className="mx-auto text-[#2D4A3E]" />
                          <h4 className="text-sm font-semibold text-[#181F1C]">Responses recorded!</h4>
                          <p className="text-xs text-[#5F665E]">Thank you for submitting your feedback.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {survey.questions.map((q, idx) => (
                            <div key={q.id} className="space-y-2">
                              <label className="text-xs font-semibold text-[#181F1C] block">
                                {idx + 1}. {q.title}
                              </label>

                              {/* RATING */}
                              {q.type === 'rating' && (
                                <div className="flex gap-2">
                                  {[1, 2, 3, 4, 5].map(star => {
                                    const isActive = (currentResponses[q.id] || 0) >= star;
                                    return (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleSurveyAnswerChange(survey.id, q.id, star)}
                                        className={`p-2.5 rounded-lg border transition-colors ${
                                          isActive
                                            ? 'bg-amber-100 border-amber-400 text-amber-600'
                                            : 'bg-white border-[#D0CEC4] text-[#8C9188]'
                                        }`}
                                      >
                                        <Star size={20} className={isActive ? 'fill-amber-500' : ''} />
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* CHOICE */}
                              {q.type === 'choice' && (
                                <div className="space-y-1.5">
                                  {q.options?.map(opt => (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => handleSurveyAnswerChange(survey.id, q.id, opt)}
                                      className={`w-full p-3 rounded-lg border text-left text-xs font-medium transition-colors cursor-pointer ${
                                        currentResponses[q.id] === opt
                                          ? 'bg-[#2D4A3E] text-white border-[#2D4A3E]'
                                          : 'bg-white text-[#181F1C] border-[#D0CEC4] hover:bg-[#F5F4EE]'
                                      }`}
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
                                  placeholder="Write your comments here..."
                                  rows={3}
                                  className="w-full bg-white border border-[#D0CEC4] rounded-lg p-3 text-xs text-[#181F1C] focus:outline-none focus:border-[#2D4A3E] transition-colors resize-none"
                                />
                              )}
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => handleSurveySubmit(survey)}
                            className="w-full py-3 text-xs font-semibold text-white bg-[#2D4A3E] hover:bg-[#233B31] rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Send size={14} />
                            <span>Submit Survey Answers</span>
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

        {/* Footer */}
        <footer className="py-4 px-6 border-t border-[#D5D4CB]/60 text-xs text-[#5F665E] text-center"> {/* taste-skill-ignore */}
          <span>surv. participant &bull; Real-time synchronized</span>
        </footer>
      </div>
    </div>
  );
}

export default function ParticipantPage(props: ParticipantPageProps) {
  return (
    <React.Suspense fallback={<div className="min-h-[100svh] flex items-center justify-center text-[#5F665E]">Connecting to session...</div>}>
      <ParticipantContent {...props} />
    </React.Suspense>
  );
}
