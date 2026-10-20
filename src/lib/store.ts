'use client';

import { Room, Poll, PollResponse, QAQuestion, Survey, SurveyResponse, RealtimeEvent } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY_PREFIX = 'surv_vevox_';
const BROADCAST_CHANNEL_NAME = 'surv_sync_channel';
const PURGE_KEY = 'surv_demo_purged_v2';

// Singleton broadcast channel
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
}

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

// Initialize store and purge any legacy demo data from localStorage
export function initializeStore(): void {
  if (typeof window === 'undefined') return;

  try {
    if (!localStorage.getItem(PURGE_KEY)) {
      // Clean out any legacy demo sessions & fake responses
      const existingRooms = readLocal<Room[]>('rooms', []);
      const cleanRooms = existingRooms.filter(r => !r.id.startsWith('room-demo-') && r.pin !== '123-456-789');
      writeLocal('rooms', cleanRooms);

      const existingPolls = readLocal<Poll[]>('polls', []);
      const cleanPolls = existingPolls.filter(p => !p.roomId.startsWith('room-demo-') && !p.id.startsWith('poll-mcq-') && !p.id.startsWith('poll-wordcloud-') && !p.id.startsWith('poll-rating-') && !p.id.startsWith('poll-quiz-') && !p.id.startsWith('poll-open-') && !p.id.startsWith('poll-ah-') && !p.id.startsWith('poll-trivia-'));
      writeLocal('polls', cleanPolls);

      const existingResponses = readLocal<PollResponse[]>('responses', []);
      const cleanResponses = existingResponses.filter(r => !r.roomId.startsWith('room-demo-'));
      writeLocal('responses', cleanResponses);

      const existingQA = readLocal<QAQuestion[]>('qa', []);
      const cleanQA = existingQA.filter(q => !q.roomId.startsWith('room-demo-'));
      writeLocal('qa', cleanQA);

      const existingSurveys = readLocal<Survey[]>('surveys', []);
      const cleanSurveys = existingSurveys.filter(s => !s.roomId.startsWith('room-demo-'));
      writeLocal('surveys', cleanSurveys);

      localStorage.setItem(PURGE_KEY, 'true');
    }
  } catch (e) {
    console.warn('Store cleanup warning:', e);
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
  return readLocal<Room[]>('rooms', []);
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

export function createRoom(data: {
  title: string;
  description?: string;
  customPin?: string;
  template?: 'blank' | 'townhall' | 'quiz' | 'workshop';
}): Room {
  initializeStore();
  const rooms = getRooms();
  const randomPin = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
  const pin = data.customPin || randomPin;
  const newRoomId = 'room-' + Date.now();

  const newRoom: Room = {
    id: newRoomId,
    pin,
    title: data.title,
    description: data.description || '',
    status: 'active',
    activePollId: null,
    allowAnonymousQA: true,
    requireParticipantName: false,
    participantCount: 0,
    createdAt: new Date().toISOString(),
  };

  // Seed template polls if requested (without any fake responses)
  if (data.template && data.template !== 'blank') {
    const templatePolls: Poll[] = [];
    if (data.template === 'townhall') {
      templatePolls.push(
        {
          id: `poll-${Date.now()}-1`,
          roomId: newRoomId,
          title: 'How satisfied are you with our current team direction & roadmap execution?',
          type: 'rating',
          options: [],
          isOpen: true,
          showResults: true,
          order: 0,
          createdAt: new Date().toISOString(),
        },
        {
          id: `poll-${Date.now()}-2`,
          roomId: newRoomId,
          title: 'In ONE word, what should our top priority be for next quarter?',
          type: 'word_cloud',
          options: [],
          isOpen: false,
          showResults: true,
          order: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: `poll-${Date.now()}-3`,
          roomId: newRoomId,
          title: 'Which initiative will drive the highest impact for our audience?',
          type: 'multiple_choice',
          options: [
            { id: 'opt-1', text: 'Core Reliability & Speed', color: '#2D4A3E' },
            { id: 'opt-2', text: 'Interactive Features & Usability', color: '#10B981' },
            { id: 'opt-3', text: 'Integrations & Open APIs', color: '#06B6D4' },
            { id: 'opt-4', text: 'Security & Enterprise Support', color: '#F59E0B' },
          ],
          isOpen: false,
          showResults: true,
          order: 2,
          createdAt: new Date().toISOString(),
        }
      );
    } else if (data.template === 'quiz') {
      templatePolls.push(
        {
          id: `poll-${Date.now()}-1`,
          roomId: newRoomId,
          title: 'Speed Trivia: In what year was JavaScript first released?',
          type: 'quiz',
          options: [
            { id: 'q-1', text: '1995 (in 10 days)', isCorrect: true, color: '#10B981' },
            { id: 'q-2', text: '1991', isCorrect: false, color: '#EF4444' },
            { id: 'q-3', text: '1998', isCorrect: false, color: '#64748B' },
            { id: 'q-4', text: '2001', isCorrect: false, color: '#F59E0B' },
          ],
          isOpen: true,
          showResults: true,
          showCorrect: true,
          timeLimit: 20,
          order: 0,
          createdAt: new Date().toISOString(),
        },
        {
          id: `poll-${Date.now()}-2`,
          roomId: newRoomId,
          title: 'Which protocol enables bidirectional real-time communication with lowest overhead?',
          type: 'quiz',
          options: [
            { id: 'q2-1', text: 'WebSockets (RFC 6455)', isCorrect: true, color: '#10B981' },
            { id: 'q2-2', text: 'HTTP Long-Polling', isCorrect: false, color: '#EF4444' },
            { id: 'q2-3', text: 'Periodic Fetch XMLHttp', isCorrect: false, color: '#F59E0B' },
          ],
          isOpen: false,
          showResults: true,
          showCorrect: true,
          timeLimit: 25,
          order: 1,
          createdAt: new Date().toISOString(),
        }
      );
    } else if (data.template === 'workshop') {
      templatePolls.push(
        {
          id: `poll-${Date.now()}-1`,
          roomId: newRoomId,
          title: 'Pre-Flight Check: How confident do you feel applying these concepts?',
          type: 'rating',
          options: [],
          isOpen: true,
          showResults: true,
          order: 0,
          createdAt: new Date().toISOString(),
        },
        {
          id: `poll-${Date.now()}-2`,
          roomId: newRoomId,
          title: 'What specific challenge or question are you hoping to solve today?',
          type: 'open_text',
          options: [],
          isOpen: false,
          showResults: true,
          order: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: `poll-${Date.now()}-3`,
          roomId: newRoomId,
          title: 'In ONE word, describe your top takeaway from today:',
          type: 'word_cloud',
          options: [],
          isOpen: false,
          showResults: true,
          order: 2,
          createdAt: new Date().toISOString(),
        }
      );
    }

    if (templatePolls.length > 0) {
      newRoom.activePollId = templatePolls[0].id;
      const existingPolls = readLocal<Poll[]>('polls', []);
      writeLocal('polls', [...existingPolls, ...templatePolls]);
    }
  }

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

export function deleteRoom(roomId: string): boolean {
  const rooms = getRooms();
  const filtered = rooms.filter(r => r.id !== roomId);
  writeLocal('rooms', filtered);

  // Clean up polls
  const polls = readLocal<Poll[]>('polls', []);
  const remainingPolls = polls.filter(p => p.roomId !== roomId);
  writeLocal('polls', remainingPolls);

  // Clean up responses
  const responses = readLocal<PollResponse[]>('responses', []);
  const remainingResponses = responses.filter(r => r.roomId !== roomId);
  writeLocal('responses', remainingResponses);

  // Clean up QA
  const qa = readLocal<QAQuestion[]>('qa', []);
  const remainingQA = qa.filter(q => q.roomId !== roomId);
  writeLocal('qa', remainingQA);

  // Clean up surveys
  const surveys = readLocal<Survey[]>('surveys', []);
  const remainingSurveys = surveys.filter(s => s.roomId !== roomId);
  writeLocal('surveys', remainingSurveys);

  emitRealtimeEvent({ type: 'ROOM_DELETED', roomId });
  return true;
}

export function duplicateRoom(roomId: string): Room | null {
  const rooms = getRooms();
  const room = rooms.find(r => r.id === roomId);
  if (!room) return null;

  const newId = 'room-' + Date.now();
  const randomPin = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;

  const newRoom: Room = {
    ...room,
    id: newId,
    pin: randomPin,
    title: `${room.title} (Copy)`,
    participantCount: 0,
    status: 'paused',
    activePollId: null,
    createdAt: new Date().toISOString(),
  };

  const updatedRooms = [newRoom, ...rooms];
  writeLocal('rooms', updatedRooms);

  // Duplicate polls for this room (without copying historical responses)
  const existingPolls = readLocal<Poll[]>('polls', []);
  const roomPolls = existingPolls.filter(p => p.roomId === roomId);
  const duplicatedPolls: Poll[] = roomPolls.map((poll, idx) => ({
    ...poll,
    id: `poll-dup-${Date.now()}-${idx}`,
    roomId: newId,
    isOpen: false,
    createdAt: new Date().toISOString(),
  }));

  if (duplicatedPolls.length > 0) {
    newRoom.activePollId = duplicatedPolls[0].id;
    writeLocal('polls', [...existingPolls, ...duplicatedPolls]);
  }

  emitRealtimeEvent({ type: 'ROOM_UPDATED', room: newRoom });
  return newRoom;
}

export function getDashboardMetrics() {
  initializeStore();
  const rooms = getRooms();
  const polls = readLocal<Poll[]>('polls', []);
  const responses = readLocal<PollResponse[]>('responses', []);
  const qa = readLocal<QAQuestion[]>('qa', []);

  const activeRooms = rooms.filter(r => r.status === 'active').length;
  const pausedRooms = rooms.filter(r => r.status === 'paused').length;
  const endedRooms = rooms.filter(r => r.status === 'ended').length;
  const totalParticipants = rooms.reduce((acc, r) => acc + (r.participantCount || 0), 0);

  return {
    totalRooms: rooms.length,
    activeRooms,
    pausedRooms,
    endedRooms,
    totalParticipants,
    totalPolls: polls.length,
    totalResponses: responses.length,
    totalQA: qa.length,
  };
}

export function exportRoomData(roomId: string) {
  const room = getRooms().find(r => r.id === roomId);
  if (!room) return null;

  const polls = getPollsForRoom(roomId);
  const pollsWithResponses = polls.map(p => ({
    ...p,
    responses: getResponsesForPoll(p.id),
  }));
  const qa = getQAQuestions(roomId);
  const surveys = getSurveysForRoom(roomId).map(s => ({
    ...s,
    responses: getSurveyResponses(s.id),
  }));

  return {
    room,
    polls: pollsWithResponses,
    qaQuestions: qa,
    surveys,
    exportedAt: new Date().toISOString(),
  };
}

// ----------------- POLLS API -----------------

export function getPollsForRoom(roomId: string): Poll[] {
  initializeStore();
  const allPolls = readLocal<Poll[]>('polls', []);
  return allPolls
    .filter(p => p.roomId === roomId)
    .sort((a, b) => a.order - b.order);
}

export function getPollById(pollId: string): Poll | null {
  initializeStore();
  const allPolls = readLocal<Poll[]>('polls', []);
  return allPolls.find(p => p.id === pollId) || null;
}

export function createPoll(pollData: Omit<Poll, 'id' | 'createdAt' | 'order'>): Poll {
  initializeStore();
  const allPolls = readLocal<Poll[]>('polls', []);
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
  const allPolls = readLocal<Poll[]>('polls', []);
  const idx = allPolls.findIndex(p => p.id === pollId);
  if (idx === -1) return null;

  const updated = { ...allPolls[idx], ...updates };
  allPolls[idx] = updated;
  writeLocal('polls', allPolls);
  emitRealtimeEvent({ type: 'POLL_STATE_CHANGED', poll: updated });
  return updated;
}

export function deletePoll(pollId: string): void {
  const allPolls = readLocal<Poll[]>('polls', []);
  const filtered = allPolls.filter(p => p.id !== pollId);
  writeLocal('polls', filtered);
  emitRealtimeEvent({ type: 'POLL_DELETED', pollId });
}

// ----------------- RESPONSES API -----------------

export function getResponsesForPoll(pollId: string): PollResponse[] {
  initializeStore();
  const allResponses = readLocal<PollResponse[]>('responses', []);
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
  const allResponses = readLocal<PollResponse[]>('responses', []);

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
  const allResponses = readLocal<PollResponse[]>('responses', []);
  const remaining = allResponses.filter(r => r.pollId !== pollId);
  writeLocal('responses', remaining);
  emitRealtimeEvent({ type: 'POLL_RESET', pollId });
}

// ----------------- Q&A API -----------------

export function getQAQuestions(roomId: string): QAQuestion[] {
  initializeStore();
  const allQA = readLocal<QAQuestion[]>('qa', []);
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
  const allQA = readLocal<QAQuestion[]>('qa', []);

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
  const allQA = readLocal<QAQuestion[]>('qa', []);
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
  const allQA = readLocal<QAQuestion[]>('qa', []);
  const idx = allQA.findIndex(q => q.id === questionId);
  if (idx === -1) return null;

  const updated = { ...allQA[idx], ...updates };
  allQA[idx] = updated;
  writeLocal('qa', allQA);
  emitRealtimeEvent({ type: 'QA_UPDATED', question: updated });
  return updated;
}

export function deleteQAQuestion(questionId: string): void {
  const allQA = readLocal<QAQuestion[]>('qa', []);
  const filtered = allQA.filter(q => q.id !== questionId);
  writeLocal('qa', filtered);
  emitRealtimeEvent({ type: 'QA_DELETED', questionId });
}

// ----------------- SURVEYS API -----------------

export function getSurveysForRoom(roomId: string): Survey[] {
  initializeStore();
  const allSurveys = readLocal<Survey[]>('surveys', []);
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

  const updated = [...allResponses, response];
  writeLocal('survey_responses', updated);
  emitRealtimeEvent({ type: 'SURVEY_RESPONSE_SUBMITTED', response });
  return response;
}

export function getSurveyResponses(surveyId: string): SurveyResponse[] {
  initializeStore();
  const allResponses = readLocal<SurveyResponse[]>('survey_responses', []);
  return allResponses.filter(r => r.surveyId === surveyId);
}
