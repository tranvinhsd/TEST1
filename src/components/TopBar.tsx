import { AppView } from '../types/quiz';

interface TopBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onQuickStart: () => void;
  isQuizRunning: boolean;
}

export function TopBar({ currentView, onNavigate, onQuickStart, isQuizRunning }: TopBarProps) {
  const navItems: { id: AppView; label: string }[] = [
    { id: 'catalog', label: 'Bộ đề' },
    { id: 'builder', label: 'Soạn đề' },
    { id: 'history', label: 'Lịch sử' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => !isQuizRunning && onNavigate('catalog')}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-md"
        >
          TrắcNghiệm Tempo
        </button>

        {!isQuizRunning ? (
          <nav aria-label="Điều hướng chính" className="flex items-center gap-6 overflow-x-auto">
            {navItems.map((item) => {
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                    active
                      ? 'text-sky-700 border-sky-600'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        ) : (
          <div className="text-sm font-medium text-slate-600 whitespace-nowrap shrink-0">
            Phiên làm bài đang diễn ra
          </div>
        )}

        <div className="flex items-center shrink-0">
          {!isQuizRunning ? (
            <button
              type="button"
              onClick={onQuickStart}
              className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-600 cursor-pointer"
            >
              Bắt đầu ngay
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 cursor-pointer"
            >
              Thoát bài thi
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
