import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { AnswerStatus, QuizAttempt } from '../types/quiz';
import { formatDurationMs } from '../utils/storage';

interface QuizResultsProps {
  attempt: QuizAttempt;
  onRetryAll: () => void;
  onRetryWrong: () => void;
  onBackToCatalog: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export function QuizResults({
  attempt,
  onRetryAll,
  onRetryWrong,
  onBackToCatalog,
}: QuizResultsProps) {
  const [filter, setFilter] = useState<'all' | AnswerStatus>('all');

  const filteredRecords =
    filter === 'all'
      ? attempt.records
      : attempt.records.filter((r) => r.status === filter);

  const avgTimeSec =
    attempt.totalQuestions > 0
      ? (attempt.totalTimeMs / attempt.totalQuestions / 1000).toFixed(1)
      : '0.0';

  const wrongOrTimeoutCount = attempt.incorrectCount + attempt.timeoutCount;

  const statusMeta: Record<AnswerStatus, { label: string; colorClass: string; icon: typeof CheckCircle2 }> = {
    correct: {
      label: 'Trả lời đúng',
      colorClass: 'text-emerald-700',
      icon: CheckCircle2,
    },
    incorrect: {
      label: 'Trả lời sai',
      colorClass: 'text-rose-700',
      icon: XCircle,
    },
    timeout: {
      label: 'Hết thời gian',
      colorClass: 'text-amber-700',
      icon: Clock,
    },
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      <div className="mb-6">
        <button
          type="button"
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Quay lại danh sách bộ đề</span>
        </button>
      </div>

      {/* Score Summary Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{attempt.category}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                Cài đặt {attempt.secondsPerQuestionConfig}s/câu
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {new Date(attempt.completedAt).toLocaleString('vi-VN')}
              </span>
            </div>
            <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-slate-900">
              Kết quả: {attempt.deckTitle}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {wrongOrTimeoutCount > 0 && (
              <button
                type="button"
                onClick={onRetryWrong}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-amber-600" aria-hidden="true" />
                <span>Ôn lại {wrongOrTimeoutCount} câu chưa đúng</span>
              </button>
            )}
            <button
              type="button"
              onClick={onRetryAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Làm lại toàn bộ</span>
            </button>
          </div>
        </div>

        {/* 4-column tabular KPI row */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-xs font-medium text-slate-500">Điểm số (hệ 10)</div>
            <div className="mt-1 font-mono text-2xl font-bold text-sky-700 tabular-nums">
              {attempt.score10.toFixed(1)}
              <span className="text-sm font-normal text-slate-500"> / 10</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-xs font-medium text-slate-500">Số câu đúng</div>
            <div className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
              {attempt.correctCount}
              <span className="text-sm font-normal text-slate-500">
                {' '}
                / {attempt.totalQuestions} ({attempt.accuracyPercent}%)
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-xs font-medium text-slate-500">Câu hết giờ</div>
            <div className="mt-1 font-mono text-2xl font-bold text-amber-700 tabular-nums">
              {attempt.timeoutCount}
              <span className="text-sm font-normal text-slate-500"> câu</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-xs font-medium text-slate-500">Thời gian làm bài</div>
            <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {formatDurationMs(attempt.totalTimeMs)}
              <span className="text-xs font-sans font-normal text-slate-500 ml-1.5">
                ({avgTimeSec}s/câu)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Answer Review */}
      <section className="mt-8 space-y-4" aria-label="Chi tiết từng câu hỏi">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-xl font-semibold text-slate-900">
            Chi tiết đáp án & giải thích
          </h2>

          <div
            role="tablist"
            aria-label="Lọc kết quả câu hỏi"
            className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
          >
            {[
              { id: 'all' as const, label: `Tất cả (${attempt.totalQuestions})` },
              { id: 'correct' as const, label: `Đúng (${attempt.correctCount})` },
              { id: 'incorrect' as const, label: `Sai (${attempt.incorrectCount})` },
              { id: 'timeout' as const, label: `Hết giờ (${attempt.timeoutCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap tabular-nums cursor-pointer ${
                  filter === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-600">
            Không có câu hỏi nào thuộc nhóm trạng thái này.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((rec) => {
              const originalNumber =
                attempt.records.findIndex((r) => r.questionId === rec.questionId) + 1;
              const meta = statusMeta[rec.status];
              const StatusIcon = meta.icon;

              return (
                <article
                  key={`${rec.questionId}-${originalNumber}`}
                  className="bg-white border border-slate-200 rounded-xl p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-500 tabular-nums">
                      <span className="font-semibold text-slate-800">
                        Câu {String(originalNumber).padStart(2, '0')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Thời gian làm: {(rec.timeSpentMs / 1000).toFixed(1)}s /{' '}
                        {rec.timeLimitSec}s
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 font-semibold ${meta.colorClass}`}
                    >
                      <StatusIcon className="w-4 h-4" aria-hidden="true" />
                      <span>{meta.label}</span>
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-base sm:text-lg font-semibold text-slate-900">
                    {rec.prompt}
                  </h3>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {rec.options.map((opt, idx) => {
                      const isCorrect = idx === rec.correctIndex;
                      const isUserChoice = idx === rec.selectedIndex;

                      let boxStyle = 'border-slate-200 bg-white text-slate-700';
                      let tag: string | null = null;

                      if (isCorrect) {
                        boxStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-medium';
                        tag = isUserChoice ? 'Bạn chọn (Đúng)' : 'Đáp án đúng';
                      } else if (isUserChoice) {
                        boxStyle = 'border-rose-400 bg-rose-50/70 text-rose-950';
                        tag = 'Bạn đã chọn';
                      }

                      return (
                        <div
                          key={idx}
                          className={`px-3.5 py-2.5 rounded-lg border text-sm flex items-center justify-between gap-2 ${boxStyle}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono text-xs font-semibold shrink-0">
                              {OPTION_LETTERS[idx]}.
                            </span>
                            <span className="break-words">{opt}</span>
                          </div>
                          {tag && (
                            <span className="text-xs font-semibold whitespace-nowrap shrink-0">
                              {tag}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {rec.explanation && (
                    <p className="mt-4 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 leading-relaxed">
                      <span className="font-semibold text-slate-900">Giải thích: </span>
                      {rec.explanation}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
