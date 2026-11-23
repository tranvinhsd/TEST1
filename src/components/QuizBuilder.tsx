import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  FileText,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { DeckCategory, QuizDeck, QuizQuestion } from '../types/quiz';

interface QuizBuilderProps {
  initialDeck?: QuizDeck | null;
  onSaveDeck: (deck: QuizDeck) => void;
  onCancel: () => void;
}

const CATEGORIES: DeckCategory[] = ['Tự tạo', 'Công nghệ', 'Khoa học', 'Ngoại ngữ', 'Xã hội'];
const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

function createEmptyQuestion(): QuizQuestion {
  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    prompt: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: '',
  };
}

function parseBulkText(raw: string): QuizQuestion[] {
  const blocks = raw
    .trim()
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  const parsed: QuizQuestion[] = [];
  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 5) continue;

    const promptLine = lines[0].replace(/^(Câu\s*\d+[:.]?\s*|\d+[.)]\s*)/i, '').trim();
    const options: string[] = [];
    let correctIndex = 0;
    let explanation = '';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^(Đáp án|Answer|Key)\s*[:\-]/i.test(line)) {
        const match = line.match(/([A-D1-4])/i);
        if (match) {
          const token = match[1].toUpperCase();
          const idx = ['A', 'B', 'C', 'D'].indexOf(token);
          if (idx >= 0) correctIndex = idx;
          else {
            const numIdx = Number(token) - 1;
            if (numIdx >= 0 && numIdx <= 3) correctIndex = numIdx;
          }
        }
      } else if (/^(Giải thích|Explanation)\s*[:\-]/i.test(line)) {
        explanation = line.replace(/^(Giải thích|Explanation)\s*[:\-]\s*/i, '').trim();
      } else if (options.length < 4) {
        const isMarkedCorrect = line.startsWith('*');
        const cleaned = line
          .replace(/^\*?\s*[A-D][.)]\s*/i, '')
          .replace(/^\*\s*/, '')
          .trim();
        if (isMarkedCorrect) {
          correctIndex = options.length;
        }
        options.push(cleaned);
      }
    }

    if (promptLine && options.length === 4 && options.every(Boolean)) {
      parsed.push({
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        prompt: promptLine,
        options: [options[0], options[1], options[2], options[3]],
        correctIndex,
        explanation,
      });
    }
  }
  return parsed;
}

export function QuizBuilder({ initialDeck, onSaveDeck, onCancel }: QuizBuilderProps) {
  const isEditing = Boolean(initialDeck);

  const [title, setTitle] = useState(initialDeck?.title ?? '');
  const [category, setCategory] = useState<DeckCategory>(initialDeck?.category ?? 'Tự tạo');
  const [description, setDescription] = useState(initialDeck?.description ?? '');
  const [defaultTimeSec, setDefaultTimeSec] = useState(initialDeck?.defaultTimeSec ?? 15);
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initialDeck && initialDeck.questions.length > 0
      ? initialDeck.questions
      : [createEmptyQuestion(), createEmptyQuestion()]
  );

  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateQuestion = (idx: number, patch: Partial<QuizQuestion>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const nextOptions: [string, string, string, string] = [...q.options] as [
          string,
          string,
          string,
          string,
        ];
        nextOptions[optIdx] = value;
        return { ...q, options: nextOptions };
      })
    );
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleImportBulk = () => {
    const imported = parseBulkText(bulkText);
    if (imported.length === 0) {
      setErrorMessage(
        'Không nhận diện được câu hỏi hợp lệ. Mỗi câu cần 1 dòng tiêu đề, 4 dòng đáp án A-D và 1 dòng trống ngăn cách.'
      );
      return;
    }
    setErrorMessage(null);
    const nonEmptyExisting = questions.filter(
      (q) => q.prompt.trim() !== '' || q.options.some((o) => o.trim() !== '')
    );
    setQuestions([...nonEmptyExisting, ...imported]);
    setBulkText('');
    setShowBulkImport(false);
  };

  const handleSave = () => {
    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tên bộ đề kiểm tra.');
      return;
    }

    const validQuestions = questions.filter(
      (q) => q.prompt.trim() !== '' && q.options.every((o) => o.trim() !== '')
    );

    if (validQuestions.length === 0) {
      setErrorMessage('Cần ít nhất 1 câu hỏi có đầy đủ nội dung và 4 đáp án.');
      return;
    }

    setErrorMessage(null);

    const savedDeck: QuizDeck = {
      id: initialDeck?.id ?? `deck-custom-${Date.now()}`,
      title: title.trim(),
      category,
      description:
        description.trim() || `Bộ đề trắc nghiệm gồm ${validQuestions.length} câu hỏi.`,
      defaultTimeSec: Math.max(3, Math.min(180, defaultTimeSec)),
      isBuiltIn: initialDeck?.isBuiltIn ?? false,
      updatedAt: new Date().toISOString().slice(0, 10),
      questions: validQuestions.map((q) => ({
        ...q,
        prompt: q.prompt.trim(),
        options: q.options.map((o) => o.trim()) as [string, string, string, string],
        explanation: q.explanation?.trim() || undefined,
      })),
    };

    onSaveDeck(savedDeck);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Quay lại bộ đề</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowBulkImport((s) => !s)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-sky-600" aria-hidden="true" />
            <span>{showBulkImport ? 'Đóng nhập nhanh' : 'Nhập nhanh từ văn bản'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            <span>{isEditing ? 'Lưu thay đổi' : 'Lưu bộ đề'}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm font-medium"
        >
          {errorMessage}
        </div>
      )}

      {/* Bulk Text Import Box */}
      {showBulkImport && (
        <section className="mb-8 bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Nhập nhanh nhiều câu hỏi từ văn bản
          </h2>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Ngăn cách giữa các câu bằng 1 dòng trống. Đánh dấu dấu <code className="font-mono bg-slate-100 px-1 rounded">*</code> trước đáp án đúng hoặc thêm dòng <code className="font-mono bg-slate-100 px-1 rounded">Đáp án: B</code>.
          </p>

          <textarea
            rows={7}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`Câu 1: Thủ đô của Việt Nam là thành phố nào?\nA. TP. Hồ Chí Minh\n*B. Hà Nội\nC. Đà Nẵng\nD. Huế\nGiải thích: Hà Nội là thủ đô của nước CHXHCN Việt Nam.\n\nCâu 2: 2 + 2 * 3 bằng bao nhiêu?\nA. 12\nB. 8\nC. 10\nD. 6\nĐáp án: B`}
            className="mt-3 w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-600"
          />

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowBulkImport(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleImportBulk}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg cursor-pointer"
            >
              Phân tích & thêm vào danh sách
            </button>
          </div>
        </section>
      )}

      {/* Deck Metadata */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <h1 className="font-display text-xl font-bold text-slate-900 mb-5">
          {isEditing ? 'Chỉnh sửa bộ đề trắc nghiệm' : 'Soạn bộ đề trắc nghiệm mới'}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-6">
            <label htmlFor="deck-title" className="block text-sm font-medium text-slate-700 mb-1.5">
              Tên bộ đề
            </label>
            <input
              id="deck-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Ôn tập Hóa học lớp 12 - Chương Este"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="deck-category" className="block text-sm font-medium text-slate-700 mb-1.5">
              Chủ đề
            </label>
            <select
              id="deck-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as DeckCategory)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-600"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="deck-time" className="block text-sm font-medium text-slate-700 mb-1.5">
              Thời gian mặc định (giây)
            </label>
            <input
              id="deck-time"
              type="number"
              min={3}
              max={180}
              value={defaultTimeSec}
              onChange={(e) => setDefaultTimeSec(Number(e.target.value) || 15)}
              className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>

          <div className="md:col-span-12">
            <label htmlFor="deck-desc" className="block text-sm font-medium text-slate-700 mb-1.5">
              Mô tả ngắn
            </label>
            <input
              id="deck-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mục tiêu kiểm tra hoặc ghi chú cho người làm bài..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>
        </div>
      </section>

      {/* Questions List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-900 tabular-nums">
            Danh sách câu hỏi ({questions.length})
          </h2>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Thêm câu hỏi</span>
          </button>
        </div>

        {questions.map((q, qIdx) => (
          <article
            key={q.id}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                Câu {String(qIdx + 1).padStart(2, '0')}
              </span>

              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                  <span>Thời gian riêng (giây):</span>
                  <input
                    type="number"
                    min={3}
                    max={180}
                    placeholder={`${defaultTimeSec}`}
                    value={q.customTimeSec ?? ''}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      updateQuestion(qIdx, {
                        customTimeSec: val === '' ? undefined : Math.max(3, Math.min(180, Number(val) || 3)),
                      });
                    }}
                    className="w-16 px-2 py-1 text-right font-mono text-xs border border-slate-200 rounded-md tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </label>

                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Xóa câu</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Nội dung câu hỏi
              </label>
              <textarea
                rows={2}
                value={q.prompt}
                onChange={(e) => updateQuestion(qIdx, { prompt: e.target.value })}
                placeholder="Nhập câu hỏi trắc nghiệm..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.options.map((opt, optIdx) => {
                const isCorrect = q.correctIndex === optIdx;
                return (
                  <div
                    key={optIdx}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border ${
                      isCorrect ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => updateQuestion(qIdx, { correctIndex: optIdx })}
                      title="Đặt làm đáp án đúng"
                      aria-label={`Đặt đáp án ${OPTION_LETTERS[optIdx]} là đúng`}
                      className={`w-8 h-8 rounded-md font-mono text-xs font-semibold flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        isCorrect
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isCorrect ? <Check className="w-4 h-4" /> : OPTION_LETTERS[optIdx]}
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                      placeholder={`Phương án ${OPTION_LETTERS[optIdx]}...`}
                      className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Giải thích đáp án (không bắt buộc)
              </label>
              <input
                type="text"
                value={q.explanation ?? ''}
                onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                placeholder="Lý do đáp án đúng để hiển thị khi xem lại kết quả..."
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>
          </article>
        ))}

        <div className="pt-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleAddQuestion}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            <Plus className="w-4 h-4 text-sky-600" aria-hidden="true" />
            <span>Thêm câu hỏi mới</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg cursor-pointer"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            <span>{isEditing ? 'Lưu bộ đề' : 'Hoàn tất & Lưu'}</span>
          </button>
        </div>
      </section>
    </main>
  );
}
