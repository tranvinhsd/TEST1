import { DEFAULT_DECKS } from '../data/defaultDecks';
import { QuizAttempt, QuizConfig, QuizDeck } from '../types/quiz';

const DECKS_STORAGE_KEY = 'tn_tempo_decks_v1';
const ATTEMPTS_STORAGE_KEY = 'tn_tempo_attempts_v1';
const CONFIG_STORAGE_KEY = 'tn_tempo_config_v1';

export const DEFAULT_CONFIG: QuizConfig = {
  secondsPerQuestion: 15,
  usePerQuestionTime: false,
  feedbackMode: 'exam',
  autoAdvanceDelayMs: 1200,
  shuffleQuestions: false,
  shuffleOptions: false,
  soundEnabled: true,
  allowPause: true,
};

const REMOVED_SAMPLE_IDS = new Set([
  'deck-web-js',
  'deck-science-nature',
  'deck-english-grammar',
  'deck-vn-history-geo',
]);

export function loadDecks(): QuizDeck[] {
  try {
    const raw = localStorage.getItem(DECKS_STORAGE_KEY);
    if (!raw) return DEFAULT_DECKS;
    const parsed = JSON.parse(raw) as QuizDeck[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_DECKS;

    const customOrCurrent = parsed.filter(
      (d) => !REMOVED_SAMPLE_IDS.has(d.id) && d.id !== 'deck-khtn6'
    );
    const existingKhtn6 = parsed.find((d) => d.id === 'deck-khtn6');
    const khtn6Deck = existingKhtn6 ?? DEFAULT_DECKS[0];

    return [khtn6Deck, ...customOrCurrent];
  } catch {
    return DEFAULT_DECKS;
  }
}

export function saveDecks(decks: QuizDeck[]): void {
  try {
    localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(decks));
  } catch {
    // Storage quota exceeded or unavailable
  }
}

export function loadAttempts(): QuizAttempt[] {
  try {
    const raw = localStorage.getItem(ATTEMPTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QuizAttempt[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAttempts(attempts: QuizAttempt[]): void {
  try {
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts));
  } catch {
    // Storage quota exceeded or unavailable
  }
}

export function loadConfig(): QuizConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: QuizConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Storage quota exceeded or unavailable
  }
}

export function formatDurationMs(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatSecondsDisplay(sec: number): string {
  const clamped = Math.max(0, Math.ceil(sec));
  const mins = Math.floor(clamped / 60);
  const rem = clamped % 60;
  if (mins > 0) {
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  }
  return `00:${String(rem).padStart(2, '0')}`;
}
