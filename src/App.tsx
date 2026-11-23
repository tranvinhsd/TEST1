import { useCallback, useEffect, useState } from 'react';
import { ActiveQuiz } from './components/ActiveQuiz';
import { DeckCatalog } from './components/DeckCatalog';
import { HistoryView } from './components/HistoryView';
import { QuizBuilder } from './components/QuizBuilder';
import { QuizResults } from './components/QuizResults';
import { TopBar } from './components/TopBar';
import { AppView, QuizAttempt, QuizConfig, QuizDeck, QuizQuestion } from './types/quiz';
import {
  loadAttempts,
  loadConfig,
  loadDecks,
  saveAttempts,
  saveConfig,
  saveDecks,
} from './utils/storage';

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function prepareQuestions(
  rawQuestions: QuizQuestion[],
  shuffleQuestions: boolean,
  shuffleOptions: boolean
): QuizQuestion[] {
  const base = shuffleQuestions ? shuffleArray(rawQuestions) : [...rawQuestions];

  if (!shuffleOptions) return base;

  return base.map((q) => {
    const indexed = q.options.map((text, idx) => ({
      text,
      isCorrect: idx === q.correctIndex,
    }));
    const mixed = shuffleArray(indexed);
    const nextCorrectIndex = mixed.findIndex((item) => item.isCorrect);
    return {
      ...q,
      options: mixed.map((item) => item.text) as [string, string, string, string],
      correctIndex: nextCorrectIndex >= 0 ? nextCorrectIndex : 0,
    };
  });
}

export default function App() {
  const [decks, setDecks] = useState<QuizDeck[]>(() => loadDecks());
  const [config, setConfig] = useState<QuizConfig>(() => loadConfig());
  const [attempts, setAttempts] = useState<QuizAttempt[]>(() => loadAttempts());

  const [selectedDeckId, setSelectedDeckId] = useState<string>(() => {
    const initialDecks = loadDecks();
    return initialDecks[0]?.id ?? '';
  });

  const [view, setView] = useState<AppView>('catalog');
  const [editingDeck, setEditingDeck] = useState<QuizDeck | null>(null);
  const [activeDeck, setActiveDeck] = useState<QuizDeck | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [sessionKey, setSessionKey] = useState(0);
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    saveDecks(decks);
  }, [decks]);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  useEffect(() => {
    saveAttempts(attempts);
  }, [attempts]);

  const handleSelectDeck = useCallback(
    (deckId: string) => {
      setSelectedDeckId(deckId);
      const found = decks.find((d) => d.id === deckId);
      if (found) {
        setConfig((prev) => ({
          ...prev,
          secondsPerQuestion: found.defaultTimeSec || prev.secondsPerQuestion,
        }));
      }
    },
    [decks]
  );

  const exitBrowserFullscreen = useCallback(() => {
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const startQuizSession = useCallback(
    (deck: QuizDeck, customSubset?: QuizQuestion[]) => {
      const source = customSubset ?? deck.questions;
      if (source.length === 0) return;
      const prepared = prepareQuestions(
        source,
        config.shuffleQuestions,
        config.shuffleOptions
      );
      setActiveDeck(deck);
      setActiveQuestions(prepared);
      setSessionKey((k) => k + 1);
      setView('active');
      if (typeof document !== 'undefined' && !document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    },
    [config.shuffleQuestions, config.shuffleOptions]
  );

  const handleQuickStart = useCallback(() => {
    const target = decks.find((d) => d.id === selectedDeckId) ?? decks[0];
    if (target) {
      startQuizSession(target);
    }
  }, [decks, selectedDeckId, startQuizSession]);

  const handleCompleteQuiz = useCallback(
    (attempt: QuizAttempt) => {
      exitBrowserFullscreen();
      setAttempts((prev) => [attempt, ...prev].slice(0, 50));
      setLatestAttempt(attempt);
      setView('results');
    },
    [exitBrowserFullscreen]
  );

  const handleSaveDeck = useCallback((saved: QuizDeck) => {
    setDecks((prev) => {
      const exists = prev.some((d) => d.id === saved.id);
      if (exists) {
        return prev.map((d) => (d.id === saved.id ? saved : d));
      }
      return [saved, ...prev];
    });
    setSelectedDeckId(saved.id);
    setConfig((prev) => ({ ...prev, secondsPerQuestion: saved.defaultTimeSec }));
    setEditingDeck(null);
    setView('catalog');
  }, []);

  const handleDeleteDeck = useCallback(
    (deckId: string) => {
      setDecks((prev) => {
        const next = prev.filter((d) => d.id !== deckId);
        if (selectedDeckId === deckId) {
          setSelectedDeckId(next[0]?.id ?? '');
        }
        return next;
      });
    },
    [selectedDeckId]
  );

  const handleRetryAll = useCallback(() => {
    if (!latestAttempt) return;
    const deck =
      decks.find((d) => d.id === latestAttempt.deckId) ?? activeDeck;
    if (deck) {
      startQuizSession(deck);
    }
  }, [latestAttempt, decks, activeDeck, startQuizSession]);

  const handleRetryWrong = useCallback(() => {
    if (!latestAttempt) return;
    const deck =
      decks.find((d) => d.id === latestAttempt.deckId) ?? activeDeck;
    const wrongIds = new Set(
      latestAttempt.records
        .filter((r) => r.status !== 'correct')
        .map((r) => r.questionId)
    );
    if (deck) {
      const subset = deck.questions.filter((q) => wrongIds.has(q.id));
      if (subset.length > 0) {
        startQuizSession(deck, subset);
        return;
      }
    }
    // Fallback using recorded snapshot questions if deck was modified
    const fallbackSubset: QuizQuestion[] = latestAttempt.records
      .filter((r) => r.status !== 'correct')
      .map((r) => ({
        id: r.questionId,
        prompt: r.prompt,
        options: r.options,
        correctIndex: r.correctIndex,
        explanation: r.explanation,
        customTimeSec: r.timeLimitSec,
      }));
    if (fallbackSubset.length > 0) {
      const fallbackDeck: QuizDeck = {
        id: latestAttempt.deckId,
        title: latestAttempt.deckTitle,
        category: latestAttempt.category,
        description: '',
        defaultTimeSec: latestAttempt.secondsPerQuestionConfig,
        updatedAt: new Date().toISOString().slice(0, 10),
        questions: fallbackSubset,
      };
      startQuizSession(fallbackDeck, fallbackSubset);
    }
  }, [latestAttempt, decks, activeDeck, startQuizSession]);

  const handleNavigate = useCallback((nextView: AppView) => {
    if (nextView === 'builder') {
      setEditingDeck(null);
    }
    setView(nextView);
  }, []);

  const isActiveView = view === 'active';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {!isActiveView && (
        <TopBar
          currentView={view}
          onNavigate={handleNavigate}
          onQuickStart={handleQuickStart}
          isQuizRunning={false}
        />
      )}

      <div className="flex-1 flex flex-col">
        {view === 'catalog' && (
          <DeckCatalog
            decks={decks}
            selectedDeckId={selectedDeckId}
            config={config}
            onSelectDeck={handleSelectDeck}
            onChangeConfig={setConfig}
            onStartQuiz={(deck) => startQuizSession(deck)}
            onEditDeck={(deck) => {
              setEditingDeck(deck);
              setView('builder');
            }}
            onCreateNewDeck={() => {
              setEditingDeck(null);
              setView('builder');
            }}
            onDeleteDeck={handleDeleteDeck}
          />
        )}

        {view === 'builder' && (
          <QuizBuilder
            initialDeck={editingDeck}
            onSaveDeck={handleSaveDeck}
            onCancel={() => {
              setEditingDeck(null);
              setView('catalog');
            }}
          />
        )}

        {isActiveView && activeDeck && (
          <ActiveQuiz
            key={sessionKey}
            deck={activeDeck}
            questions={activeQuestions}
            config={config}
            onComplete={handleCompleteQuiz}
            onCancel={() => {
              exitBrowserFullscreen();
              setView('catalog');
            }}
          />
        )}

        {view === 'results' && latestAttempt && (
          <QuizResults
            attempt={latestAttempt}
            onRetryAll={handleRetryAll}
            onRetryWrong={handleRetryWrong}
            onBackToCatalog={() => setView('catalog')}
          />
        )}

        {view === 'history' && (
          <HistoryView
            attempts={attempts}
            onInspectAttempt={(attempt) => {
              setLatestAttempt(attempt);
              setView('results');
            }}
            onClearHistory={() => setAttempts([])}
            onGoToCatalog={() => setView('catalog')}
          />
        )}
      </div>

      {!isActiveView && (
        <footer className="border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <span>TrắcNghiệm Tempo — Luyện tập & kiểm tra trắc nghiệm có giới hạn thời gian từng câu</span>
            <span>Dữ liệu bộ đề và lịch sử được lưu cục bộ trên trình duyệt</span>
          </div>
        </footer>
      )}
    </div>
  );
}
