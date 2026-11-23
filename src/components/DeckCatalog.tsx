import { useState } from 'react';
import { Clock, Edit3, Play, Plus, Shuffle, Trash2, Volume2, VolumeX } from 'lucide-react';
import { DeckCategory, QuizConfig, QuizDeck } from '../types/quiz';

interface DeckCatalogProps {
  decks: QuizDeck[];
  selectedDeckId: string;
  config: QuizConfig;
  onSelectDeck: (deckId: string) => void;
  onChangeConfig: (next: QuizConfig) => void;
  onStartQuiz: (deck: QuizDeck) => void;
  onEditDeck: (deck: QuizDeck) => void;
  onCreateNewDeck: () => void;
  onDeleteDeck: (deckId: string) => void;
}

const CATEGORIES: ('Tất cả' | DeckCategory)[] = [
  'Tất cả',
  'Công nghệ',
  'Khoa học',
  'Ngoại ngữ',
  'Xã hội',
  'Tự tạo',
];

const TIME_PRESETS = [5, 10, 15, 20, 30, 45, 60];

export function DeckCatalog({
  decks,
  selectedDeckId,
  config,
  onSelectDeck,
  onChangeConfig,
  onStartQuiz,
  onEditDeck,
  onCreateNewDeck,
  onDeleteDeck,
}: DeckCatalogProps) {
  const [categoryFilter, setCategoryFilter] = useState<'Tất cả' | DeckCategory>('Tất cả');

  const filteredDecks =
    categoryFilter === 'Tất cả'
      ? decks
      : decks.filter((d) => d.category === categoryFilter);

  const selectedDeck = decks.find((d) => d.id === selectedDeckId) ?? decks[0];

  const handleSelectDeck = (deck: QuizDeck) => {
    onSelectDeck(deck.id);
  };

  const estimatedTotalSeconds = selectedDeck
    ? selectedDeck.questions.reduce((acc, q) => {
        const sec =
          config.usePerQuestionTime && q.customTimeSec
            ? q.customTimeSec
            : config.secondsPerQuestion;
        return acc + sec;
      }, 0)
    : 0;

  const formatMinutes = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    if (mins === 0) return `${rem} giây`;
    if (rem === 0) return `${mins} phút`;
    return `${mins} phút ${rem} giây`;
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Kiểm tra trắc nghiệm với bộ đếm giờ tự động chuyển câu
          </h1>
          <p className="mt-2 text-base text-slate-600 leading-relaxed">
            Chọn bộ câu hỏi và thiết lập thời gian giới hạn cho mỗi câu. Khi đồng hồ đếm về 0, hệ thống tự động ghi nhận trạng thái và chuyển sang câu tiếp theo.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateNewDeck}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-sky-600" aria-hidden="true" />
          <span>Tạo bộ đề mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Zone: Deck Library */}
        <section className="lg:col-span-7 xl:col-span-8 space-y-5" aria-label="Danh sách bộ đề">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Lọc theo chủ đề"
              className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full"
            >
              {CATEGORIES.map((cat) => {
                const active = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
              {filteredDecks.length} bộ đề khả dụng
            </span>
          </div>

          {filteredDecks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <p className="text-base font-semibold text-slate-900">
                Chưa có bộ đề nào trong mục "{categoryFilter}"
              </p>
              <p className="mt-1.5 text-sm text-slate-600">
                Bạn có thể tự soạn bộ câu hỏi mới hoặc chọn chủ đề khác.
              </p>
              <button
                type="button"
                onClick={onCreateNewDeck}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Soạn bộ đề mới</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDecks.map((deck) => {
                const isSelected = selectedDeck?.id === deck.id;
                return (
                  <article
                    key={deck.id}
                    onClick={() => handleSelectDeck(deck)}
                    className={`group relative bg-white rounded-xl p-5 border transition-colors cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-sky-600 ring-1 ring-sky-600 bg-sky-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-slate-700 truncate">{deck.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums whitespace-nowrap">
                            {deck.questions.length} câu hỏi
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums whitespace-nowrap">
                            {deck.defaultTimeSec}s/câu
                          </span>
                        </div>
                        {isSelected && (
                          <span className="text-xs font-semibold text-sky-700 whitespace-nowrap shrink-0">
                            Đang chọn
                          </span>
                        )}
                      </div>

                      <h2 className="mt-2.5 font-display text-lg font-semibold text-slate-900 leading-snug">
                        {deck.title}
                      </h2>

                      <p className="mt-1.5 text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {deck.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditDeck(deck);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Chỉnh sửa câu hỏi"
                        >
                          <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Sửa đề</span>
                        </button>

                        {!deck.isBuiltIn && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteDeck(deck.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Xóa bộ đề"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Xóa</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDeck(deck.id);
                          onStartQuiz(deck);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800 hover:bg-sky-50 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Làm bài ngay</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Zone: Precision Timer & Auto-Advance Settings */}
        <aside className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200 rounded-xl p-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Cài đặt thời gian & chuyển câu
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[260px]">
                Đề đang chọn: {selectedDeck?.title ?? 'Chưa chọn'}
              </p>
            </div>
            <Clock className="w-5 h-5 text-sky-600 shrink-0" aria-hidden="true" />
          </div>

          <div className="mt-5 space-y-6">
            {/* Time per question slider + numeric input */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label
                  htmlFor="seconds-slider"
                  className="text-sm font-medium text-slate-800"
                >
                  Thời gian mỗi câu hỏi
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={3}
                    max={180}
                    value={config.secondsPerQuestion}
                    onChange={(e) => {
                      const val = Math.max(3, Math.min(180, Number(e.target.value) || 3));
                      onChangeConfig({ ...config, secondsPerQuestion: val });
                    }}
                    aria-label="Số giây mỗi câu hỏi"
                    className="w-16 px-2 py-1 text-right font-mono text-sm font-semibold text-sky-700 bg-slate-50 border border-slate-200 rounded-md tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                  <span className="text-xs font-medium text-slate-600">giây</span>
                </div>
              </div>

              <input
                id="seconds-slider"
                type="range"
                min={3}
                max={90}
                step={1}
                value={Math.min(90, config.secondsPerQuestion)}
                onChange={(e) =>
                  onChangeConfig({ ...config, secondsPerQuestion: Number(e.target.value) })
                }
                className="w-full accent-sky-600 cursor-pointer"
              />

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {TIME_PRESETS.map((sec) => {
                  const active = config.secondsPerQuestion === sec;
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() =>
                        onChangeConfig({ ...config, secondsPerQuestion: sec })
                      }
                      className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md border transition-colors tabular-nums cursor-pointer ${
                        active
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {sec}s
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auto-advance mode selection */}
            <div className="pt-4 border-t border-slate-100">
              <span className="block text-sm font-medium text-slate-800 mb-2.5">
                Cơ chế tự động chuyển câu
              </span>
              <div className="space-y-2">
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    config.feedbackMode === 'exam'
                      ? 'border-sky-600 bg-sky-50/40'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="feedbackMode"
                    checked={config.feedbackMode === 'exam'}
                    onChange={() => onChangeConfig({ ...config, feedbackMode: 'exam' })}
                    className="mt-0.5 accent-sky-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      Chế độ Kiểm tra chuẩn
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Hết thời gian cài đặt sẽ tự động chuyển sang câu tiếp theo. Xem toàn bộ đáp án sau khi hoàn thành.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    config.feedbackMode === 'instant'
                      ? 'border-sky-600 bg-sky-50/40'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="feedbackMode"
                    checked={config.feedbackMode === 'instant'}
                    onChange={() => onChangeConfig({ ...config, feedbackMode: 'instant' })}
                    className="mt-0.5 accent-sky-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      Chế độ Phản hồi tức thì
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Hiện đúng/sai ngay khi chọn và tự chuyển sau{' '}
                      <span className="font-mono tabular-nums">
                        {(config.autoAdvanceDelayMs / 1000).toFixed(1)}s
                      </span>{' '}
                      (hoặc tự chuyển ngay khi hết giờ).
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Toggles */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-sm text-slate-700 flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  <span>Xáo trộn thứ tự câu hỏi</span>
                </span>
                <input
                  type="checkbox"
                  checked={config.shuffleQuestions}
                  onChange={(e) =>
                    onChangeConfig({ ...config, shuffleQuestions: e.target.checked })
                  }
                  className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-sm text-slate-700 flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  <span>Xáo trộn thứ tự đáp án A, B, C, D</span>
                </span>
                <input
                  type="checkbox"
                  checked={config.shuffleOptions}
                  onChange={(e) =>
                    onChangeConfig({ ...config, shuffleOptions: e.target.checked })
                  }
                  className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-sm text-slate-700 flex items-center gap-2">
                  {config.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  )}
                  <span>Âm thanh đếm ngược 3 giây cuối</span>
                </span>
                <input
                  type="checkbox"
                  checked={config.soundEnabled}
                  onChange={(e) =>
                    onChangeConfig({ ...config, soundEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-sm text-slate-700">
                  Cho phép tạm dừng khi làm bài
                </span>
                <input
                  type="checkbox"
                  checked={config.allowPause}
                  onChange={(e) =>
                    onChangeConfig({ ...config, allowPause: e.target.checked })
                  }
                  className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-sm text-slate-700">
                  Dùng thời gian riêng từng câu (nếu có)
                </span>
                <input
                  type="checkbox"
                  checked={config.usePerQuestionTime}
                  onChange={(e) =>
                    onChangeConfig({ ...config, usePerQuestionTime: e.target.checked })
                  }
                  className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Session summary & Start CTA */}
            {selectedDeck && (
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-3 tabular-nums">
                  <span>{selectedDeck.questions.length} câu hỏi</span>
                  <span>Tổng tối đa: {formatMinutes(estimatedTotalSeconds)}</span>
                </div>
                <button
                  type="button"
                  disabled={selectedDeck.questions.length === 0}
                  onClick={() => onStartQuiz(selectedDeck)}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4" aria-hidden="true" />
                  <span>Bắt đầu kiểm tra</span>
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
