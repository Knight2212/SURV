export type PollType =
  | 'multiple_choice'
  | 'word_cloud'
  | 'rating'
  | 'numeric'
  | 'open_text'
  | 'quiz';

export interface PollOption {
  id: string;
  text: string;
  isCorrect?: boolean;
  color?: string;
}

export interface Poll {
  id: string;
  roomId: string;
  title: string;
  type: PollType;
  options?: PollOption[];
  isOpen: boolean;
  showResults: boolean;
  showCorrect?: boolean;
  timeLimit?: number | null; // in seconds
  createdAt: string;
  order: number;
}

export interface PollResponse {
  id: string;
  pollId: string;
  roomId: string;
  participantId: string;
  participantName?: string;
  value: string | string[] | number; // option ID, array of IDs, text for word cloud, or number
  createdAt: string;
}

export interface QAQuestion {
  id: string;
  roomId: string;
  participantId: string;
  authorName: string;
  isAnonymous: boolean;
  text: string;
  upvotes: number;
  upvotedBy: string[];
  isAnswered: boolean;
  isPinned: boolean;
  createdAt: string;
}

export interface SurveyQuestion {
  id: string;
  title: string;
  type: 'rating' | 'open_text' | 'choice';
  options?: string[];
  required?: boolean;
}

export interface Survey {
  id: string;
  roomId: string;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  isOpen: boolean;
  createdAt: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  roomId: string;
  participantId: string;
  participantName?: string;
  answers: Record<string, string | number>;
  submittedAt: string;
}

export interface Room {
  id: string;
  pin: string; // e.g. "492-381-805"
  title: string;
  description?: string;
  status: 'active' | 'paused' | 'ended';
  activePollId: string | null;
  activeSurveyId?: string | null;
  allowAnonymousQA: boolean;
  requireParticipantName: boolean;
  participantCount: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  participantId: string;
  name: string;
  score: number;
  correctCount: number;
  totalTimeMs?: number;
}

export type RealtimeEvent =
  | { type: 'ROOM_UPDATED'; room: Room }
  | { type: 'ROOM_DELETED'; roomId: string }
  | { type: 'ACTIVE_POLL_CHANGED'; pollId: string | null }
  | { type: 'POLL_STATE_CHANGED'; poll: Poll }
  | { type: 'POLL_CREATED'; poll: Poll }
  | { type: 'POLL_DELETED'; pollId: string }
  | { type: 'POLL_RESET'; pollId: string }
  | { type: 'RESPONSE_SUBMITTED'; response: PollResponse }
  | { type: 'QA_ADDED'; question: QAQuestion }
  | { type: 'QA_UPVOTED'; questionId: string; upvotes: number; upvotedBy: string[] }
  | { type: 'QA_UPDATED'; question: QAQuestion }
  | { type: 'QA_DELETED'; questionId: string }
  | { type: 'SURVEY_STATE_CHANGED'; survey: Survey }
  | { type: 'SURVEY_RESPONSE_SUBMITTED'; response: SurveyResponse }
  | { type: 'PARTICIPANT_PING'; participantId: string; roomId: string };
