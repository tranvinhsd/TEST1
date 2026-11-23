export type DeckCategory = 'Công nghệ' | 'Khoa học' | 'Ngoại ngữ' | 'Xã hội' | 'Tự tạo';

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation?: string;
  customTimeSec?: number;
}

export interface QuizDeck {
  id: string;
  title: string;
  category: DeckCategory;
  description: string;
  defaultTimeSec: number;
  isBuiltIn?: boolean;
  updatedAt: string;
  questions: QuizQuestion[];
}

export type FeedbackMode = 'exam' | 'instant';

export interface QuizConfig {
  secondsPerQuestion: number;
  usePerQuestionTime: boolean;
  feedbackMode: FeedbackMode;
  autoAdvanceDelayMs: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  soundEnabled: boolean;
  allowPause: boolean;
}

export type AnswerStatus = 'correct' | 'incorrect' | 'timeout';

export interface AnswerRecord {
  questionId: string;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  selectedIndex: number | null;
  status: AnswerStatus;
  timeLimitSec: number;
  timeSpentMs: number;
  explanation?: string;
}

export interface QuizAttempt {
  id: string;
  deckId: string;
  deckTitle: string;
  category: DeckCategory;
  completedAt: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  timeoutCount: number;
  score10: number;
  accuracyPercent: number;
  totalTimeMs: number;
  secondsPerQuestionConfig: number;
  records: AnswerRecord[];
}

export type AppView = 'catalog' | 'builder' | 'history' | 'active' | 'results';
