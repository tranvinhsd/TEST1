import { Eye, Trash2 } from 'lucide-react';
import { QuizAttempt } from '../types/quiz';
import { formatDurationMs } from '../utils/storage';

interface HistoryViewProps {
  attempts: QuizAttempt[];
  onInspectAttempt: (attempt: QuizAttempt) => void;
  onClearHistory: () => void;
  onGoToCatalog: () => void;
}

export function HistoryView({
  attempts,
  onInspectAttempt,
  onClearHistory,
  onGoToCatalog,
}: HistoryViewProps) {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Lịch sử các lần kiểm tra
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Theo dõi điểm số, số câu đúng, số câu hết giờ và thời gian hoàn thành qua từng lượt làm bài.
          </p>
        </div>

        {attempts.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Xóa toàn bộ lịch sử</span>
          </button>
        )}
      </div>

      {attempts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Chưa có lịch sử làm bài nào
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
            Hoàn thành một bài kiểm tra trắc nghiệm để lưu kết quả và xem lại chi tiết đáp án tại đây.
          </p>
          <button
            type="button"
            onClick={onGoToCatalog}
            className="mt-5 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors cursor-pointer"
          >
            Chọn bộ đề ngay
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-5">Bộ đề & Thời điểm</th>
                  <th className="py-3.5 px-4">Giới hạn</th>
                  <th className="py-3.5 px-4">Đúng / Tổng</th>
                  <th className="py-3.5 px-4">Hết giờ</th>
                  <th className="py-3.5 px-4">Điểm</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-5 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-900">{attempt.deckTitle}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {attempt.category} · {new Date(attempt.completedAt).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      {attempt.secondsPerQuestionConfig}s/câu
                    </td>
                    <td className="py-4 px-4 font-mono text-sm text-slate-900 tabular-nums whitespace-nowrap">
                      {attempt.correctCount}/{attempt.totalQuestions}{' '}
                      <span className="text-xs text-slate-500">({attempt.accuracyPercent}%)</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-sm text-amber-700 tabular-nums whitespace-nowrap">
                      {attempt.timeoutCount} câu
                    </td>
                    <td className="py-4 px-4 font-mono text-sm font-semibold text-sky-700 tabular-nums whitespace-nowrap">
                      {attempt.score10.toFixed(1)}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      {formatDurationMs(attempt.totalTimeMs)}
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onInspectAttempt(attempt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Xem bài</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
