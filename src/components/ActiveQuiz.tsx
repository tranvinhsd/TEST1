                    aria-checked={isSelected}
                    disabled={isLocked}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full min-w-0 text-left p-[clamp(0.6rem,1.35vw,1.35rem)] min-h-[clamp(3.75rem,9vh,7.5rem)] rounded-2xl border-2 transition-colors flex items-center justify-between gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500 ${
                      isLocked ? 'cursor-default' : 'cursor-pointer'
                    } ${containerClasses}`}
                  >
                    <div className="flex flex-1 items-center gap-[clamp(0.45rem,1vw,1rem)] min-w-0">
                      <span
                        className={`w-[clamp(2rem,3.5vw,3.75rem)] h-[clamp(2rem,3.5vw,3.75rem)] rounded-xl border-2 text-[clamp(0.95rem,1.7vw,1.6rem)] font-mono font-bold flex items-center justify-center shrink-0 transition-colors ${letterClasses}`}
                      >
                        {OPTION_LETTERS[idx]}
                      </span>
                      <span
                        className={`flex-1 min-w-0 font-semibold leading-snug break-words whitespace-pre-wrap ${getOptionFontClass(optionText)}`}
                      >
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
              <div className="px-[clamp(0.75rem,1.5vw,1.5rem)] py-[clamp(0.6rem,1vh,1rem)] bg-white border-2 border-slate-200 rounded-xl text-[clamp(0.9rem,1.35vw,1.35rem)] text-slate-800 leading-relaxed break-words">
                <span className="font-bold text-slate-950">Giải thích: </span>
                {currentQuestion.explanation}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Bottom Progress Dots & Navigation Actions */}
      <footer className="w-full pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
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
