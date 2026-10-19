'use client';

import { Room, Poll, PollResponse, QAQuestion, Survey, SurveyResponse, RealtimeEvent } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY_PREFIX = 'surv_vevox_';
const BROADCAST_CHANNEL_NAME = 'surv_sync_channel';

// Initial preloaded demo session to ensure a delightful first-run experience
const DEFAULT_DEMO_ROOM: Room = {
  id: 'room-demo-101',
  pin: '123-456-789',
  title: 'Global Tech Summit 2026: Future of AI & Innovation',
  description: 'Welcome to our interactive live session! Participate via polls, submit questions, and test your knowledge.',
  status: 'active',
  activePollId: 'poll-mcq-1',
  activeSurveyId: 'survey-feedback-1',
  allowAnonymousQA: true,
  requireParticipantName: false,
  participantCount: 42,
  createdAt: new Date().toISOString(),
};

const DEFAULT_DEMO_POLLS: Poll[] = [
  {
    id: 'poll-mcq-1',
    roomId: 'room-demo-101',
    title: 'Which AI breakthrough will have the biggest societal impact by 2030?',
    type: 'multiple_choice',
    options: [
      { id: 'opt-1', text: 'Autonomous Agents & Personal AI Assistants', color: '#6366F1' },
      { id: 'opt-2', text: 'AI-driven Drug Discovery & Healthcare', color: '#10B981' },
      { id: 'opt-3', text: 'Humanoid Robotics in Everyday Logistics', color: '#06B6D4' },
      { id: 'opt-4', text: 'Quantum-AI Computing Hybrids', color: '#F59E0B' },
      { id: 'opt-5', text: 'Synthetic Media & Creative Generation', color: '#EC4899' },
    ],
    isOpen: true,
    showResults: true,
    showCorrect: false,
    order: 0,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'poll-wordcloud-2',
    roomId: 'room-demo-101',
    title: 'In ONE word, how would you describe the current pace of tech innovation?',
    type: 'word_cloud',
    options: [],
    isOpen: true,
    showResults: true,
    order: 1,
    createdAt: new Date(Date.now() - 3000000).toISOString(),
  },
  {
    id: 'poll-rating-3',
    roomId: 'room-demo-101',
    title: 'How prepared does your team feel for adopting autonomous agentic workflows?',
    type: 'rating',
    options: [],
    isOpen: true,
    showResults: true,
    order: 2,
    createdAt: new Date(Date.now() - 2400000).toISOString(),
  },
  {
    id: 'poll-quiz-4',
    roomId: 'room-demo-101',
    title: 'Speed Quiz: What is the primary difference between Generative AI and Agentic AI?',
    type: 'quiz',
    options: [
      { id: 'quiz-opt-1', text: 'Agentic AI acts autonomously with goal-directed reasoning & tools', isCorrect: true, color: '#10B981' },
      { id: 'quiz-opt-2', text: 'Agentic AI only summarizes text files', isCorrect: false, color: '#EF4444' },
      { id: 'quiz-opt-3', text: 'There is zero technical difference', isCorrect: false, color: '#64748B' },
      { id: 'quiz-opt-4', text: 'Agentic AI cannot access external databases', isCorrect: false, color: '#F59E0B' },
    ],
    isOpen: true,
    showResults: true,
    showCorrect: true,
    timeLimit: 30,
    order: 3,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'poll-open-5',
    roomId: 'room-demo-101',
    title: 'What burning challenge should keynote speakers address in today’s townhall?',
    type: 'open_text',
    options: [],
    isOpen: true,
    showResults: true,
    order: 4,
    createdAt: new Date(Date.now() - 1200000).toISOString(),
  },
];

const DEFAULT_DEMO_RESPONSES: PollResponse[] = [
  // Responses for MCQ-1
  { id: 'r1', pollId: 'poll-mcq-1', roomId: 'room-demo-101', participantId: 'p1', value: 'opt-1', createdAt: new Date().toISOString() },
  { id: 'r2', pollId: 'poll-mcq-1', roomId: 'room-demo-101', participantId: 'p2', value: 'opt-1', createdAt: new Date().toISOString() },
  { id: 'r3', pollId: 'poll-mcq-1', roomId: 'room-demo-101', participantId: 'p3', value: 'opt-1', createdAt: new Date().toISOString() },
  { id: 'r4', pollId: 'poll-mcq-1', roomId: 'room-demo-101', participantId: 'p4', value: 'opt-2', createdAt: new Date().toISOString() },
  { id: 'r5', pollId: 'poll-mcq-1', roomId: 'room-demo-101', participantId: 'p5', value: 'opt-2', createdAt: new Date().toISOString() },
  { id: 'r6', pollId: 'poll-mcq-1', roomId: 'room-demo-101', participantId: 'p6', value: 'opt-3', createdAt: new Date().toISOString() },
  { id: 'r7', pollId: 'poll-mcq-1', roomId: 'room-demo-101', participantId: 'p7', value: 'opt-4', createdAt: new Date().toISOString() },

  // Word Cloud responses
  { id: 'r8', pollId: 'poll-wordcloud-2', roomId: 'room-demo-101', participantId: 'p1', value: 'Exponential', createdAt: new Date().toISOString() },
  { id: 'r9', pollId: 'poll-wordcloud-2', roomId: 'room-demo-101', participantId: 'p2', value: 'Exponential', createdAt: new Date().toISOString() },
  { id: 'r10', pollId: 'poll-wordcloud-2', roomId: 'room-demo-101', participantId: 'p3', value: 'Exponential', createdAt: new Date().toISOString() },
  { id: 'r11', pollId: 'poll-wordcloud-2', roomId: 'room-demo-101', participantId: 'p4', value: 'Exhilarating', createdAt: new Date().toISOString() },
  { id: 'r12', pollId: 'poll-wordcloud-2', roomId: 'room-demo-101', participantId: 'p5', value: 'Exhilarating', createdAt: new Date().toISOString() },
  { id: 'r13', pollId: 'poll-wordcloud-2', roomId: 'room-demo-101', participantId: 'p6', value: 'Overwhelming', createdAt: new Date().toISOString() },
  { id: 'r14', pollId: 'poll-wordcloud-2', roomId: 'room-demo-101', participantId: 'p7', value: 'Inspiring', createdAt: new Date().toISOString() },
  { id: 'r15', pollId: 'poll-wordcloud-2', roomId: 'room-demo-101', participantId: 'p8', value: 'Transformative', createdAt: new Date().toISOString() },
  { id: 'r16', pollId: 'poll-wordcloud-2', roomId: 'room-demo-101', participantId: 'p9', value: 'Transformative', createdAt: new Date().toISOString() },
  { id: 'r17', pollId: 'poll-wordcloud-2', roomId: 'room-demo-101', participantId: 'p10', value: 'Relentless', createdAt: new Date().toISOString() },

  // Rating responses (1 to 5)
  { id: 'r18', pollId: 'poll-rating-3', roomId: 'room-demo-101', participantId: 'p1', value: 4, createdAt: new Date().toISOString() },
  { id: 'r19', pollId: 'poll-rating-3', roomId: 'room-demo-101', participantId: 'p2', value: 5, createdAt: new Date().toISOString() },
  { id: 'r20', pollId: 'poll-rating-3', roomId: 'room-demo-101', participantId: 'p3', value: 4, createdAt: new Date().toISOString() },
  { id: 'r21', pollId: 'poll-rating-3', roomId: 'room-demo-101', participantId: 'p4', value: 3, createdAt: new Date().toISOString() },
  { id: 'r22', pollId: 'poll-rating-3', roomId: 'room-demo-101', participantId: 'p5', value: 4, createdAt: new Date().toISOString() },

  // Quiz responses
  { id: 'r23', pollId: 'poll-quiz-4', roomId: 'room-demo-101', participantId: 'p1', participantName: 'Alex Rivera', value: 'quiz-opt-1', createdAt: new Date().toISOString() },
  { id: 'r24', pollId: 'poll-quiz-4', roomId: 'room-demo-101', participantId: 'p2', participantName: 'Sarah Jenkins', value: 'quiz-opt-1', createdAt: new Date().toISOString() },
  { id: 'r25', pollId: 'poll-quiz-4', roomId: 'room-demo-101', participantId: 'p3', participantName: 'Dr. Marcus Chen', value: 'quiz-opt-1', createdAt: new Date().toISOString() },
  { id: 'r26', pollId: 'poll-quiz-4', roomId: 'room-demo-101', participantId: 'p4', participantName: 'Elena Rostova', value: 'quiz-opt-2', createdAt: new Date().toISOString() },
];

const DEFAULT_DEMO_QA: QAQuestion[] = [
  {
    id: 'qa-1',
    roomId: 'room-demo-101',
    participantId: 'p-guest-1',
    authorName: 'Dr. Aris Thorne',
    isAnonymous: false,
    text: 'How will agentic security guardrails prevent hallucinated API executions in enterprise deployment?',
    upvotes: 28,
    upvotedBy: ['p1', 'p2', 'p3'],
    isAnswered: false,
    isPinned: true,
    createdAt: new Date(Date.now() - 1500000).toISOString(),
  },
  {
    id: 'qa-2',
    roomId: 'room-demo-101',
    participantId: 'p-guest-2',
    authorName: 'Anonymous',
    isAnonymous: true,
    text: 'Can small engineering teams achieve real ROI with autonomous coding agents without multi-million dollar infra?',
    upvotes: 19,
    upvotedBy: ['p4', 'p5'],
    isAnswered: false,
    isPinned: false,
    createdAt: new Date(Date.now() - 1200000).toISOString(),
  },
  {
    id: 'qa-3',
    roomId: 'room-demo-101',
    participantId: 'p-guest-3',
    authorName: 'Devon Lee',
    isAnonymous: false,
    text: 'Are there slides or live benchmarks comparing open-weights reasoning models vs frontier cloud models?',
    upvotes: 12,
    upvotedBy: ['p6'],
    isAnswered: true,
    isPinned: false,
    createdAt: new Date(Date.now() - 800000).toISOString(),
  },
];

const DEFAULT_DEMO_SURVEY: Survey = {
  id: 'survey-feedback-1',
  roomId: 'room-demo-101',
  title: 'Summit Feedback & Future Topic Requests',
  description: 'Help us shape upcoming quarterly sessions by sharing your quick thoughts.',
  isOpen: true,
  questions: [
    {
      id: 'sq-1',
      title: 'Overall satisfaction with this interactive keynote session',
      type: 'rating',
      required: true,
    },
    {
      id: 'sq-2',
      title: 'Which deep-dive workshop would you attend next month?',
      type: 'choice',
      options: ['Building Multi-Agent Workflows', 'Local LLM Fine-Tuning & Quantization', 'Enterprise AGI Governance', 'Full-stack AI App Architecture'],
      required: true,
    },
    {
      id: 'sq-3',
      title: 'Any suggestions or shoutouts for the presentation team?',
      type: 'open_text',
      required: false,
    },
  ],
  createdAt: new Date(Date.now() - 7200000).toISOString(),
};

// Singleton broadcast channel
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
}

// Memory fallback cache for SSR and speed
const memoryStore = {
  rooms: new Map<string, Room>(),
  polls: new Map<string, Poll[]>(),
  responses: new Map<string, PollResponse[]>(),
  qa: new Map<string, QAQuestion[]>(),
  surveys: new Map<string, Survey[]>(),
  surveyResponses: new Map<string, SurveyResponse[]>(),
};

// Helpers to read/write local storage safely
function readLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (err) {
    console.error('Local read error:', err);
    return defaultValue;
  }
}

function writeLocal<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (err) {
    console.error('Local write error:', err);
  }
}

// Ensure demo data is seeded
export function initializeStore(): void {
  if (typeof window === 'undefined') return;

  const existingRooms = readLocal<Room[]>('rooms', []);
  if (!existingRooms.some(r => r.pin === DEFAULT_DEMO_ROOM.pin)) {
    existingRooms.push(DEFAULT_DEMO_ROOM);
    writeLocal('rooms', existingRooms);

    // Seed demo polls
    const existingPolls = readLocal<Poll[]>('polls', []);
    writeLocal('polls', [...existingPolls, ...DEFAULT_DEMO_POLLS]);

    // Seed demo responses
    const existingResponses = readLocal<PollResponse[]>('responses', []);
    writeLocal('responses', [...existingResponses, ...DEFAULT_DEMO_RESPONSES]);

    // Seed demo QA
    const existingQA = readLocal<QAQuestion[]>('qa', []);
    writeLocal('qa', [...existingQA, ...DEFAULT_DEMO_QA]);

    // Seed demo Survey
    const existingSurveys = readLocal<Survey[]>('surveys', []);
    writeLocal('surveys', [...existingSurveys, DEFAULT_DEMO_SURVEY]);
  }
}

// Broadcast event to other windows/tabs and Supabase
export function emitRealtimeEvent(event: RealtimeEvent): void {
  if (typeof window !== 'undefined') {
    broadcastChannel?.postMessage(event);

    // Also dispatch window custom event for same-tab reactive listeners
    window.dispatchEvent(new CustomEvent('surv_realtime_event', { detail: event }));
  }

  // If Supabase is connected, broadcast over Supabase Realtime channel
  if (isSupabaseConfigured && supabase) {
    const roomChannel = supabase.channel('room-global');
    roomChannel.send({
      type: 'broadcast',
      event: event.type,
      payload: event,
    }).catch(err => console.warn('Supabase broadcast failed:', err));
  }
}

// Subscribe to real-time events across windows & remote Supabase
export function subscribeToRealtime(callback: (event: RealtimeEvent) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleBroadcast = (e: MessageEvent) => {
    if (e.data && e.data.type) {
      callback(e.data as RealtimeEvent);
    }
  };

  const handleCustomEvent = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail && detail.type) {
      callback(detail as RealtimeEvent);
    }
  };

  broadcastChannel?.addEventListener('message', handleBroadcast);
  window.addEventListener('surv_realtime_event', handleCustomEvent);

  // Supabase listener if available
  let supabaseSub: any = null;
  if (isSupabaseConfigured && supabase) {
    supabaseSub = supabase
      .channel('room-global')
      .on('broadcast', { event: '*' }, ({ payload }) => {
        if (payload) callback(payload as RealtimeEvent);
      })
      .subscribe();
  }

  return () => {
    broadcastChannel?.removeEventListener('message', handleBroadcast);
    window.removeEventListener('surv_realtime_event', handleCustomEvent);
    if (supabaseSub) {
      supabase?.removeChannel(supabaseSub);
    }
  };
}

// ----------------- ROOM API -----------------

export function getRooms(): Room[] {
  initializeStore();
  return readLocal<Room[]>('rooms', [DEFAULT_DEMO_ROOM]);
}

export function getRoomByPin(pin: string): Room | null {
  initializeStore();
  const rooms = getRooms();
  const cleanPin = pin.replace(/\s+/g, '-').trim().toLowerCase();
  return (
    rooms.find(r => r.pin.replace(/\s+/g, '-').trim().toLowerCase() === cleanPin) ||
    rooms.find(r => r.pin.replace(/[^0-9]/g, '') === cleanPin.replace(/[^0-9]/g, '')) ||
    null
  );
}

export function createRoom(data: { title: string; description?: string; customPin?: string }): Room {
  initializeStore();
  const rooms = getRooms();
  const randomPin = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
  const pin = data.customPin || randomPin;

  const newRoom: Room = {
    id: 'room-' + Date.now(),
    pin,
    title: data.title,
    description: data.description || '',
    status: 'active',
    activePollId: null,
    allowAnonymousQA: true,
    requireParticipantName: false,
    participantCount: 1,
    createdAt: new Date().toISOString(),
  };

  const updatedRooms = [newRoom, ...rooms];
  writeLocal('rooms', updatedRooms);
  emitRealtimeEvent({ type: 'ROOM_UPDATED', room: newRoom });
  return newRoom;
}

export function updateRoom(roomId: string, updates: Partial<Room>): Room | null {
  const rooms = getRooms();
  const index = rooms.findIndex(r => r.id === roomId);
  if (index === -1) return null;

  const updated = { ...rooms[index], ...updates };
  rooms[index] = updated;
  writeLocal('rooms', rooms);
  emitRealtimeEvent({ type: 'ROOM_UPDATED', room: updated });
  return updated;
}

// ----------------- POLLS API -----------------

export function getPollsForRoom(roomId: string): Poll[] {
  initializeStore();
  const allPolls = readLocal<Poll[]>('polls', DEFAULT_DEMO_POLLS);
  return allPolls
    .filter(p => p.roomId === roomId)
    .sort((a, b) => a.order - b.order);
}

export function getPollById(pollId: string): Poll | null {
  initializeStore();
  const allPolls = readLocal<Poll[]>('polls', DEFAULT_DEMO_POLLS);
  return allPolls.find(p => p.id === pollId) || null;
}

export function createPoll(pollData: Omit<Poll, 'id' | 'createdAt' | 'order'>): Poll {
  initializeStore();
  const allPolls = readLocal<Poll[]>('polls', DEFAULT_DEMO_POLLS);
  const roomPolls = allPolls.filter(p => p.roomId === pollData.roomId);

  const newPoll: Poll = {
    ...pollData,
    id: 'poll-' + Date.now(),
    order: roomPolls.length,
    createdAt: new Date().toISOString(),
  };

  const updatedPolls = [...allPolls, newPoll];
  writeLocal('polls', updatedPolls);
  emitRealtimeEvent({ type: 'POLL_CREATED', poll: newPoll });
  return newPoll;
}

export function updatePoll(pollId: string, updates: Partial<Poll>): Poll | null {
  const allPolls = readLocal<Poll[]>('polls', DEFAULT_DEMO_POLLS);
  const idx = allPolls.findIndex(p => p.id === pollId);
  if (idx === -1) return null;

  const updated = { ...allPolls[idx], ...updates };
  allPolls[idx] = updated;
  writeLocal('polls', allPolls);
  emitRealtimeEvent({ type: 'POLL_STATE_CHANGED', poll: updated });
  return updated;
}

export function deletePoll(pollId: string): void {
  const allPolls = readLocal<Poll[]>('polls', DEFAULT_DEMO_POLLS);
  const filtered = allPolls.filter(p => p.id !== pollId);
  writeLocal('polls', filtered);
  emitRealtimeEvent({ type: 'POLL_DELETED', pollId });
}

// ----------------- RESPONSES API -----------------

export function getResponsesForPoll(pollId: string): PollResponse[] {
  initializeStore();
  const allResponses = readLocal<PollResponse[]>('responses', DEFAULT_DEMO_RESPONSES);
  return allResponses.filter(r => r.pollId === pollId);
}

export function submitPollResponse(data: {
  pollId: string;
  roomId: string;
  participantId: string;
  participantName?: string;
  value: string | string[] | number;
}): PollResponse {
  initializeStore();
  const allResponses = readLocal<PollResponse[]>('responses', DEFAULT_DEMO_RESPONSES);

  // For single-choice or rating, update existing response from same participant
  const existingIdx = allResponses.findIndex(
    r => r.pollId === data.pollId && r.participantId === data.participantId
  );

  const response: PollResponse = {
    id: existingIdx !== -1 ? allResponses[existingIdx].id : 'resp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    pollId: data.pollId,
    roomId: data.roomId,
    participantId: data.participantId,
    participantName: data.participantName || 'Participant',
    value: data.value,
    createdAt: new Date().toISOString(),
  };

  let updatedList: PollResponse[];
  if (existingIdx !== -1) {
    updatedList = [...allResponses];
    updatedList[existingIdx] = response;
  } else {
    updatedList = [...allResponses, response];
  }

  writeLocal('responses', updatedList);
  emitRealtimeEvent({ type: 'RESPONSE_SUBMITTED', response });
  return response;
}

export function resetPollResponses(pollId: string): void {
  const allResponses = readLocal<PollResponse[]>('responses', DEFAULT_DEMO_RESPONSES);
  const remaining = allResponses.filter(r => r.pollId !== pollId);
  writeLocal('responses', remaining);
  emitRealtimeEvent({ type: 'POLL_RESET', pollId });
}

// ----------------- Q&A API -----------------

export function getQAQuestions(roomId: string): QAQuestion[] {
  initializeStore();
  const allQA = readLocal<QAQuestion[]>('qa', DEFAULT_DEMO_QA);
  return allQA
    .filter(q => q.roomId === roomId)
    .sort((a, b) => {
      // Pinned first, then upvotes descending, then timestamp descending
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (b.upvotes !== a.upvotes) return b.upvotes - a.upvotes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

export function addQAQuestion(data: {
  roomId: string;
  participantId: string;
  authorName?: string;
  isAnonymous?: boolean;
  text: string;
}): QAQuestion {
  initializeStore();
  const allQA = readLocal<QAQuestion[]>('qa', DEFAULT_DEMO_QA);

  const question: QAQuestion = {
    id: 'qa-' + Date.now(),
    roomId: data.roomId,
    participantId: data.participantId,
    authorName: data.isAnonymous ? 'Anonymous' : (data.authorName?.trim() || 'Attendee'),
    isAnonymous: !!data.isAnonymous,
    text: data.text.trim(),
    upvotes: 1,
    upvotedBy: [data.participantId],
    isAnswered: false,
    isPinned: false,
    createdAt: new Date().toISOString(),
  };

  const updated = [question, ...allQA];
  writeLocal('qa', updated);
  emitRealtimeEvent({ type: 'QA_ADDED', question });
  return question;
}

export function toggleUpvoteQA(questionId: string, participantId: string): QAQuestion | null {
  const allQA = readLocal<QAQuestion[]>('qa', DEFAULT_DEMO_QA);
  const idx = allQA.findIndex(q => q.id === questionId);
  if (idx === -1) return null;

  const q = allQA[idx];
  const hasUpvoted = q.upvotedBy.includes(participantId);

  const newUpvotedBy = hasUpvoted
    ? q.upvotedBy.filter(id => id !== participantId)
    : [...q.upvotedBy, participantId];

  const updated: QAQuestion = {
    ...q,
    upvotes: newUpvotedBy.length,
    upvotedBy: newUpvotedBy,
  };

  allQA[idx] = updated;
  writeLocal('qa', allQA);
  emitRealtimeEvent({
    type: 'QA_UPVOTED',
    questionId: updated.id,
    upvotes: updated.upvotes,
    upvotedBy: updated.upvotedBy,
  });
  return updated;
}

export function updateQAQuestion(questionId: string, updates: Partial<QAQuestion>): QAQuestion | null {
  const allQA = readLocal<QAQuestion[]>('qa', DEFAULT_DEMO_QA);
  const idx = allQA.findIndex(q => q.id === questionId);
  if (idx === -1) return null;

  const updated = { ...allQA[idx], ...updates };
  allQA[idx] = updated;
  writeLocal('qa', allQA);
  emitRealtimeEvent({ type: 'QA_UPDATED', question: updated });
  return updated;
}

export function deleteQAQuestion(questionId: string): void {
  const allQA = readLocal<QAQuestion[]>('qa', DEFAULT_DEMO_QA);
  const filtered = allQA.filter(q => q.id !== questionId);
  writeLocal('qa', filtered);
  emitRealtimeEvent({ type: 'QA_DELETED', questionId });
}

// ----------------- SURVEYS API -----------------

export function getSurveysForRoom(roomId: string): Survey[] {
  initializeStore();
  const allSurveys = readLocal<Survey[]>('surveys', [DEFAULT_DEMO_SURVEY]);
  return allSurveys.filter(s => s.roomId === roomId);
}

export function submitSurveyResponse(data: {
  surveyId: string;
  roomId: string;
  participantId: string;
  participantName?: string;
  answers: Record<string, string | number>;
}): SurveyResponse {
  initializeStore();
  const allResponses = readLocal<SurveyResponse[]>('survey_responses', []);

  const response: SurveyResponse = {
    id: 'sresp-' + Date.now(),
    surveyId: data.surveyId,
    roomId: data.roomId,
    participantId: data.participantId,
    participantName: data.participantName || 'Participant',
    answers: data.answers,
    submittedAt: new Date().toISOString(),
  };

  writeLocal('survey_responses', [...allResponses, response]);
  emitRealtimeEvent({ type: 'SURVEY_RESPONSE_SUBMITTED', response });
  return response;
}

export function getSurveyResponses(surveyId: string): SurveyResponse[] {
  initializeStore();
  const allResponses = readLocal<SurveyResponse[]>('survey_responses', []);
  return allResponses.filter(r => r.surveyId === surveyId);
}
