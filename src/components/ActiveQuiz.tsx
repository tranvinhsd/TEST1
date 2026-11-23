import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flag,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
  XCircle,
} from 'lucide-react';
import { AnswerRecord, QuizAttempt, QuizConfig, QuizDeck, QuizQuestion } from '../types/quiz';
import {
  playAutoAdvanceSound,
  playCompleteSound,
  playSelectSound,
  playTickSound,
  playTimeoutSound,
} from '../utils/sound';

interface ActiveQuizProps {
  deck: QuizDeck;
  questions: QuizQuestion[];
  config: QuizConfig;
  onComplete: (attempt: QuizAttempt) => void;
  onCancel: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export function ActiveQuiz({
  deck,
  questions,
  config,
  onComplete,
  onCancel,
}: ActiveQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(config.soundEnabled);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [transitionNotice, setTransitionNotice] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState<boolean>(() =>
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false
  );

  const currentQuestion = questions[currentIndex];
  const timeLimitSec = useMemo(() => {
    if (!currentQuestion) return config.secondsPerQuestion;
    return config.usePerQuestionTime && currentQuestion.customTimeSec
      ? currentQuestion.customTimeSec
      : config.secondsPerQuestion;
  }, [currentQuestion, config.usePerQuestionTime, config.secondsPerQuestion]);

  const timeLimitMs = timeLimitSec * 1000;
  const [remainingMs, setRemainingMs] = useState(timeLimitMs);

  const lastFrameRef = useRef<number | null>(null);
  const remainingRef = useRef<number>(timeLimitMs);
  const lastSecondBeepRef = useRef<number | null>(null);
  const advanceLockRef = useRef<boolean>(false);
  const recordsRef = useRef<AnswerRecord[]>([]);
  const selectedRef = useRef<number | null>(null);
  const instantTimeoutRef = useRef<number | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsBrowserFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleBrowserFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  useEffect(() => {
    selectedRef.current = selectedIndex;
  }, [selectedIndex]);

  const finalizeQuiz = useCallback(
    (finalRecords: AnswerRecord[]) => {
      const correctCount = finalRecords.filter((r) => r.status === 'correct').length;
      const incorrectCount = finalRecords.filter((r) => r.status === 'incorrect').length;
      const timeoutCount = finalRecords.filter((r) => r.status === 'timeout').length;
      const totalQuestions = questions.length;
      const accuracyPercent =
        totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
      const score10 =
        totalQuestions > 0
          ? Math.round(((correctCount / totalQuestions) * 10) * 100) / 100
          : 0;
      const totalTimeMs = finalRecords.reduce((sum, r) => sum + r.timeSpentMs, 0);

      playCompleteSound(soundEnabled);

      const attempt: QuizAttempt = {
        id: `attempt-${Date.now()}`,
        deckId: deck.id,
        deckTitle: deck.title,
        category: deck.category,
        completedAt: new Date().toISOString(),
        totalQuestions,
        correctCount,
        incorrectCount,
        timeoutCount,
        score10,
        accuracyPercent,
        totalTimeMs,
        secondsPerQuestionConfig: config.secondsPerQuestion,
        records: finalRecords,
      };
      onComplete(attempt);
    },
    [questions.length, soundEnabled, deck, config.secondsPerQuestion, onComplete]
  );

  const commitAndAdvance = useCallback(
    (reason: 'timeout' | 'manual' | 'instant', explicitSelected?: number | null) => {
      if (advanceLockRef.current || !currentQuestion) return;
      advanceLockRef.current = true;
      setIsLocked(true);

      if (instantTimeoutRef.current !== null) {
        window.clearTimeout(instantTimeoutRef.current);
        instantTimeoutRef.current = null;
      }

      const chosen =
        explicitSelected !== undefined ? explicitSelected : selectedRef.current;
      const elapsedMs = Math.min(
        timeLimitMs,
        Math.max(100, Math.round(timeLimitMs - remainingRef.current))
      );

      let status: AnswerRecord['status'] = 'timeout';
      if (chosen !== null) {
        status = chosen === currentQuestion.correctIndex ? 'correct' : 'incorrect';
      } else {
        status = 'timeout';
      }

      const record: AnswerRecord = {
        questionId: currentQuestion.id,
        prompt: currentQuestion.prompt,
        options: currentQuestion.options,
        correctIndex: currentQuestion.correctIndex,
        selectedIndex: chosen,
        status,
        timeLimitSec,
        timeSpentMs: reason === 'timeout' ? timeLimitMs : elapsedMs,
        explanation: currentQuestion.explanation,
      };

      const nextRecords = [...recordsRef.current, record];
      setRecords(nextRecords);
      recordsRef.current = nextRecords;

      if (reason === 'timeout') {
        playTimeoutSound(soundEnabled);
        setTransitionNotice(
          chosen === null
            ? 'Hết thời gian — Tự động chuyển câu tiếp theo...'
            : 'Hết giờ — Đã ghi nhận đáp án và chuyển câu...'
        );
      } else {
        playAutoAdvanceSound(soundEnabled);
        setTransitionNotice(null);
      }

      const delayMs = reason === 'timeout' ? 500 : 120;
      transitionTimeoutRef.current = window.setTimeout(() => {
        setTransitionNotice(null);
        if (currentIndex + 1 < questions.length) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          finalizeQuiz(nextRecords);
        }
      }, delayMs);
    },
    [
      currentQuestion,
      currentIndex,
      questions.length,
      timeLimitMs,
      timeLimitSec,
      soundEnabled,
      finalizeQuiz,
    ]
  );

  // Reset per-question timer state whenever currentIndex changes
  useEffect(() => {
    advanceLockRef.current = false;
    setIsLocked(false);
    setSelectedIndex(null);
    selectedRef.current = null;
    setTransitionNotice(null);
    remainingRef.current = timeLimitMs;
    setRemainingMs(timeLimitMs);
    lastSecondBeepRef.current = null;
    lastFrameRef.current = performance.now();

    return () => {
      if (instantTimeoutRef.current !== null) {
        window.clearTimeout(instantTimeoutRef.current);
        instantTimeoutRef.current = null;
      }
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
    };
  }, [currentIndex, timeLimitMs]);

  // High-precision countdown loop
  useEffect(() => {
    if (isPaused || isLocked || !currentQuestion) {
      lastFrameRef.current = null;
      return;
    }

    let rafId = 0;
    lastFrameRef.current = performance.now();

    const tick = (now: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = now;
      }
      const delta = now - lastFrameRef.current;
      lastFrameRef.current = now;

      const nextRemaining = Math.max(0, remainingRef.current - delta);
      remainingRef.current = nextRemaining;
      setRemainingMs(nextRemaining);

      const secLeft = Math.ceil(nextRemaining / 1000);
      if (
        secLeft > 0 &&
        secLeft <= 3 &&
        lastSecondBeepRef.current !== secLeft
      ) {
        lastSecondBeepRef.current = secLeft;
        playTickSound(soundEnabled);
      }

      if (nextRemaining <= 0) {
        commitAndAdvance('timeout');
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isPaused, isLocked, currentQuestion, soundEnabled, commitAndAdvance]);

  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      if (isLocked || isPaused || advanceLockRef.current) return;

      playSelectSound(soundEnabled);
      setSelectedIndex(optionIndex);
      selectedRef.current = optionIndex;

      if (config.feedbackMode === 'instant') {
        setIsLocked(true);
        instantTimeoutRef.current = window.setTimeout(() => {
          commitAndAdvance('instant', optionIndex);
        }, config.autoAdvanceDelayMs);
      }
    },
    [
      isLocked,
      isPaused,
      soundEnabled,
      config.feedbackMode,
      config.autoAdvanceDelayMs,
      commitAndAdvance,
    ]
  );

  const handleFinishEarly = useCallback(() => {
    if (advanceLockRef.current) return;
    if (instantTimeoutRef.current !== null) {
      window.clearTimeout(instantTimeoutRef.current);
      instantTimeoutRef.current = null;
    }
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }

    const finalRecords = [...recordsRef.current];
    if (currentQuestion) {
      const chosen = selectedRef.current;
      const elapsedMs = Math.min(
        timeLimitMs,
        Math.max(100, Math.round(timeLimitMs - remainingRef.current))
      );
      finalRecords.push({
        questionId: currentQuestion.id,
        prompt: currentQuestion.prompt,
        options: currentQuestion.options,
        correctIndex: currentQuestion.correctIndex,
        selectedIndex: chosen,
        status:
          chosen === null
            ? 'timeout'
            : chosen === currentQuestion.correctIndex
              ? 'correct'
              : 'incorrect',
        timeLimitSec,
        timeSpentMs: elapsedMs,
        explanation: currentQuestion.explanation,
      });
    }

    for (let i = currentIndex + 1; i < questions.length; i++) {
      const q = questions[i];
      const qLimit =
        config.usePerQuestionTime && q.customTimeSec
          ? q.customTimeSec
          : config.secondsPerQuestion;
      finalRecords.push({
        questionId: q.id,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        selectedIndex: null,
        status: 'timeout',
        timeLimitSec: qLimit,
        timeSpentMs: 0,
        explanation: q.explanation,
      });
    }

    finalizeQuiz(finalRecords);
  }, [
    currentQuestion,
    currentIndex,
    questions,
    timeLimitMs,
    timeLimitSec,
    config.usePerQuestionTime,
    config.secondsPerQuestion,
    finalizeQuiz,
  ]);

  // Keyboard shortcuts: 1-4 / A-D, Enter, Space
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === '1' || key === 'a') handleSelectOption(0);
      else if (key === '2' || key === 'b') handleSelectOption(1);
      else if (key === '3' || key === 'c') handleSelectOption(2);
      else if (key === '4' || key === 'd') handleSelectOption(3);
      else if (key === 'enter' && !isPaused) {
        e.preventDefault();
        commitAndAdvance('manual');
      } else if (key === ' ' && config.allowPause && !isLocked) {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSelectOption, commitAndAdvance, isPaused, config.allowPause, isLocked]);

  if (!currentQuestion) {
    return null;
  }

  const secondsLeft = Math.ceil(remainingMs / 1000);
  const progressFraction = timeLimitMs > 0 ? Math.max(0, Math.min(1, remainingMs / timeLimitMs)) : 0;

  const isCritical = secondsLeft <= 3;
  const isWarning = !isCritical && secondsLeft <= 5;

  const timerStatusText = isPaused
    ? 'Đã tạm dừng'
    : isCritical
      ? 'Sắp hết giờ!'
      : isWarning
        ? 'Còn ít thời gian'
        : 'Đang đếm ngược';

  const barColorClass = isPaused
    ? 'bg-slate-400'
    : isCritical
      ? 'bg-rose-600'
      : isWarning
        ? 'bg-amber-500'
        : 'bg-sky-600';

  const timerColorClass = isPaused
    ? 'text-slate-500'
    : isCritical
      ? 'text-rose-600'
      : isWarning
        ? 'text-amber-600'
        : 'text-slate-900';

  const showInstantFeedback = config.feedbackMode === 'instant' && selectedIndex !== null;

  return (
    <main className="min-h-screen w-full bg-slate-50 flex flex-col justify-between px-5 sm:px-10 lg:px-14 xl:px-20 py-5 sm:py-7">
      {/* Top Full-Width Header & Progress Bar (High Legibility at 7m on 55" TV) */}
      <header className="w-full space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tabular-nums">
              Câu {String(currentIndex + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
            </span>
            <span className="text-base sm:text-xl lg:text-2xl font-medium text-slate-600">
              {deck.title}
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {/* Giant TV-readable countdown timer */}
            <div className="flex items-center gap-3 sm:gap-4 bg-white border border-slate-200 rounded-xl px-4 sm:px-6 py-2 sm:py-2.5">
              <span
                className={`inline-flex items-center gap-2 text-base sm:text-xl lg:text-2xl font-semibold whitespace-nowrap ${
                  isCritical
                    ? 'text-rose-700'
                    : isWarning
                      ? 'text-amber-700'
                      : 'text-slate-600'
                }`}
              >
                {(isCritical || isWarning) && !isPaused && (
                  <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
                )}
                <span>{timerStatusText}</span>
              </span>

              <span
                className={`font-mono text-3xl sm:text-5xl lg:text-6xl font-bold tabular-nums leading-none ${timerColorClass}`}
                aria-live="polite"
              >
                {String(secondsLeft).padStart(2, '0')}s
              </span>
            </div>

            {/* Compact Presentation Utility Controls */}
            <div className="flex items-center gap-2">
              {config.allowPause && (
                <button
                  type="button"
                  onClick={() => setIsPaused((p) => !p)}
                  disabled={isLocked}
                  title={isPaused ? 'Tiếp tục (Space)' : 'Tạm dừng (Space)'}
                  aria-label={isPaused ? 'Tiếp tục làm bài' : 'Tạm dừng'}
                  className="p-3 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 text-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => setSoundEnabled((s) => !s)}
                title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                className="p-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={toggleBrowserFullscreen}
                title={isBrowserFullscreen ? 'Thoát toàn màn hình' : 'Phóng toàn màn hình TV'}
                aria-label={isBrowserFullscreen ? 'Thoát toàn màn hình' : 'Phóng toàn màn hình'}
                className="p-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                {isBrowserFullscreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </button>

              <button
                type="button"
                onClick={onCancel}
                title="Thoát phiên kiểm tra"
                aria-label="Thoát phiên kiểm tra"
                className="p-3 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-700 hover:text-rose-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Thick high-visibility progress bar */}
        <div
          className="h-4 sm:h-5 w-full bg-slate-200 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={timeLimitSec}
          aria-valuenow={secondsLeft}
          aria-label="Thời gian còn lại của câu hỏi"
        >
          <div
            className={`h-full w-full origin-left transition-colors duration-150 ${barColorClass}`}
            style={{ transform: `scaleX(${progressFraction})` }}
          />
        </div>

        {transitionNotice && (
          <div
            role="status"
            className="px-6 py-3.5 bg-amber-50 border-2 border-amber-300 text-amber-950 rounded-xl text-xl sm:text-2xl font-bold flex items-center gap-3"
          >
            <Clock className="w-7 h-7 text-amber-600 shrink-0" aria-hidden="true" />
            <span>{transitionNotice}</span>
          </div>
        )}
      </header>

      {/* Center Stage: Full-Screen Question & 2x2 Large Options */}
      <section
        className="flex-1 flex flex-col justify-center py-6 sm:py-8 w-full"
        aria-label="Nội dung câu hỏi"
      >
        {isPaused ? (
          <div className="bg-white border-2 border-slate-200 rounded-2xl py-20 px-8 text-center space-y-6">
            <Pause className="w-16 h-16 text-slate-400 mx-auto" aria-hidden="true" />
            <div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-900">
                Bài kiểm tra đang tạm dừng
              </h2>
              <p className="mt-3 text-xl sm:text-2xl text-slate-600">
                Thời gian còn lại:{' '}
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {secondsLeft} giây
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="inline-flex items-center gap-3 px-8 py-4 text-xl sm:text-2xl font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors cursor-pointer"
            >
              <Play className="w-6 h-6" aria-hidden="true" />
              <span>Tiếp tục làm bài</span>
            </button>
          </div>
        ) : (
          <div className="w-full space-y-6 sm:space-y-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 lg:p-12">
              <h1 className="font-display text-[clamp(1.75rem,3.3vw,3.4rem)] font-bold text-slate-900 leading-[1.24] tracking-tight text-balance">
                {currentQuestion.prompt}
              </h1>
            </div>

            <div
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
              role="radiogroup"
              aria-label="Các phương án trả lời"
            >
              {currentQuestion.options.map((optionText, idx) => {
                const isSelected = selectedIndex === idx;
                const isCorrectOption = idx === currentQuestion.correctIndex;

                let containerClasses =
                  'border-slate-300 bg-white hover:border-sky-500 hover:bg-slate-50 text-slate-900';
                let letterClasses = 'bg-slate-100 text-slate-800 border-slate-300';
                let statusLabel: string | null = null;
                let StatusIcon: typeof CheckCircle2 | null = null;

                if (showInstantFeedback) {
                  if (isCorrectOption) {
                    containerClasses = 'border-emerald-600 bg-emerald-50 text-emerald-950';
                    letterClasses = 'bg-emerald-600 text-white border-emerald-600';
                    statusLabel = 'Đúng';
                    StatusIcon = CheckCircle2;
                  } else if (isSelected) {
                    containerClasses = 'border-rose-600 bg-rose-50 text-rose-950';
                    letterClasses = 'bg-rose-600 text-white border-rose-600';
                    statusLabel = 'Sai';
                    StatusIcon = XCircle;
                  } else {
                    containerClasses = 'border-slate-200 bg-slate-100/70 text-slate-500';
                  }
                } else if (isSelected) {
                  containerClasses = 'border-sky-600 bg-sky-50 text-slate-950 ring-2 ring-sky-600';
                  letterClasses = 'bg-sky-600 text-white border-sky-600';
                  statusLabel = 'Đã chọn';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isLocked}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-5 sm:p-7 lg:p-8 min-h-[104px] sm:min-h-[128px] rounded-2xl border-2 transition-colors flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500 ${
                      isLocked ? 'cursor-default' : 'cursor-pointer'
                    } ${containerClasses}`}
                  >
                    <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                      <span
                        className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl border-2 text-2xl sm:text-3xl font-mono font-bold flex items-center justify-center shrink-0 transition-colors ${letterClasses}`}
                      >
                        {OPTION_LETTERS[idx]}
                      </span>
                      <span className="text-[clamp(1.3rem,2.1vw,2.2rem)] font-semibold leading-snug break-words">
                        {optionText}
                      </span>
                    </div>

                    {statusLabel && (
                      <span
                        className={`inline-flex items-center gap-2 text-lg sm:text-xl font-bold whitespace-nowrap shrink-0 ${
                          showInstantFeedback
                            ? isCorrectOption
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                            : 'text-sky-700'
                        }`}
                      >
                        {StatusIcon && <StatusIcon className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />}
                        <span>{statusLabel}</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {showInstantFeedback && currentQuestion.explanation && (
              <div className="px-6 py-4 bg-white border-2 border-slate-200 rounded-xl text-lg sm:text-2xl text-slate-800 leading-relaxed">
                <span className="font-bold text-slate-950">Giải thích: </span>
                {currentQuestion.explanation}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Bottom Progress Dots & Navigation Actions */}
      <footer className="w-full pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {questions.map((q, idx) => {
            const pastRecord = records[idx];
            const isCurrent = idx === currentIndex;

            let pillStyle = 'bg-slate-200 text-slate-600';
            if (isCurrent) {
              pillStyle = 'bg-sky-600 text-white font-bold';
            } else if (pastRecord) {
              if (config.feedbackMode === 'instant') {
                pillStyle =
                  pastRecord.status === 'correct'
                    ? 'bg-emerald-600 text-white'
                    : pastRecord.status === 'incorrect'
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-500 text-white';
              } else {
                pillStyle =
                  pastRecord.selectedIndex !== null
                    ? 'bg-slate-700 text-white'
                    : 'bg-amber-500 text-white';
              }
            }

            return (
              <span
                key={q.id}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-mono text-sm sm:text-base flex items-center justify-center tabular-nums ${pillStyle}`}
              >
                {idx + 1}
              </span>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={handleFinishEarly}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-3 text-base sm:text-lg font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <Flag className="w-5 h-5 text-sky-600" aria-hidden="true" />
            <span>Nộp bài sớm</span>
          </button>

          <button
            type="button"
            onClick={() => commitAndAdvance('manual')}
            className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 text-lg sm:text-xl font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <span>
              {currentIndex + 1 < questions.length ? 'Câu tiếp theo' : 'Hoàn thành'}
            </span>
            <ArrowRight className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </main>
  );
}
