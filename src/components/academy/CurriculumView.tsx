import React, { useEffect, useState } from 'react';
import { Chess, Move } from 'chess.js';
import { Award, CheckCircle2, ChevronLeft, ChevronRight, Download, Lock, Maximize2, Minimize2, Play, RotateCcw } from 'lucide-react';
import { AcademyWeekModule } from '../../data/academy/types';
import { useStudy } from '../../context/StudyContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { ChessBoard } from '../chess/ChessBoard';
import { downloadCertificatePdf, downloadCheatSheetPdf } from '../../lib/pdfExport';

interface CurriculumViewProps {
  selectedWeek: number;
  onSelectWeek: (w: number) => void;
  mondayWeek: number;
  onFocusPosition: (fen: string, promptQuestion?: string) => void;
}

const WEEK_PHASE_META: { week: number; phase: 'endgame' | 'middlegame' | 'opening' }[] = [
  { week: 1, phase: 'endgame' },
  { week: 2, phase: 'endgame' },
  { week: 3, phase: 'endgame' },
  { week: 4, phase: 'middlegame' },
  { week: 5, phase: 'middlegame' },
  { week: 6, phase: 'middlegame' },
  { week: 7, phase: 'opening' },
  { week: 8, phase: 'opening' },
];

async function loadWeekModule(weekNumber: number): Promise<AcademyWeekModule> {
  switch (weekNumber) {
    case 1:
      return (await import('../../data/academy/weeks/week1.json')).default as AcademyWeekModule;
    case 2:
      return (await import('../../data/academy/weeks/week2.json')).default as AcademyWeekModule;
    case 3:
      return (await import('../../data/academy/weeks/week3.json')).default as AcademyWeekModule;
    case 4:
      return (await import('../../data/academy/weeks/week4.json')).default as AcademyWeekModule;
    case 5:
      return (await import('../../data/academy/weeks/week5.json')).default as AcademyWeekModule;
    case 6:
      return (await import('../../data/academy/weeks/week6.json')).default as AcademyWeekModule;
    case 7:
      return (await import('../../data/academy/weeks/week7.json')).default as AcademyWeekModule;
    case 8:
    default:
      return (await import('../../data/academy/weeks/week8.json')).default as AcademyWeekModule;
  }
}

export const CurriculumView: React.FC<CurriculumViewProps> = ({
  selectedWeek,
  onSelectWeek,
  mondayWeek,
  onFocusPosition,
}) => {
  const { t, pick } = useI18n();
  const { user } = useAuth();
  const { state, markSlideViewed, markExerciseSolved, recordMissedItem, unlockWeekViaPlacement } = useStudy();

  const [weekData, setWeekData] = useState<AcademyWeekModule | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [boardFen, setBoardFen] = useState<string>(new Chess().fen());
  const [demoStep, setDemoStep] = useState(0);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const [exerciseFeedback, setExerciseFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [presentMode, setPresentMode] = useState(false);

  useEffect(() => {
    let active = true;
    loadWeekModule(selectedWeek).then((mod) => {
      if (!active) return;
      setWeekData(mod);
      setSlideIdx(0);
      setDemoStep(0);
      setQuizChoice(null);
      setExerciseFeedback('idle');
      if (mod.slides[0]) {
        setBoardFen(mod.slides[0].exercise?.fen ?? mod.slides[0].fen);
        markSlideViewed(selectedWeek, mod.slides[0].id);
        onFocusPosition(mod.slides[0].fen);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeek]);

  const currentSlide = weekData?.slides[slideIdx] ?? null;

  useEffect(() => {
    if (!currentSlide) return;
    setBoardFen(currentSlide.exercise?.fen ?? currentSlide.fen);
    setDemoStep(0);
    setQuizChoice(null);
    setExerciseFeedback('idle');
    markSlideViewed(selectedWeek, currentSlide.id);
    onFocusPosition(currentSlide.exercise?.fen ?? currentSlide.fen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideIdx]);

  const isWeekUnlocked = (w: number): boolean => {
    if (w === 1) return true;
    const prevMastery = state.weeks[w - 1]?.mastery;
    return prevMastery === 'solid' || prevMastery === 'mastered';
  };

  const handlePlayDemoStep = () => {
    if (!currentSlide?.demoMovesSan || currentSlide.demoMovesSan.length === 0) return;
    const nextStep = demoStep >= currentSlide.demoMovesSan.length ? 0 : demoStep + 1;
    const chess = new Chess(currentSlide.fen);
    for (let i = 0; i < nextStep; i++) {
      chess.move(currentSlide.demoMovesSan[i]);
    }
    setDemoStep(nextStep);
    setBoardFen(chess.fen());
  };

  const handleAnswerQuiz = (idx: number) => {
    if (!currentSlide?.quiz || !weekData) return;
    setQuizChoice(idx);
    const totalTasks = weekData.slides.filter((s) => s.exercise || s.quiz).length;
    if (idx === currentSlide.quiz.correctIndex) {
      markExerciseSolved(selectedWeek, currentSlide.id, totalTasks);
    } else {
      recordMissedItem({
        id: `quiz-${currentSlide.id}`,
        fen: currentSlide.fen,
        solutionSan: currentSlide.quiz.options[currentSlide.quiz.correctIndex].en,
        prompt: pick(currentSlide.quiz.question),
        category: weekData.phase === 'endgame' ? 'endgame_technique' : weekData.phase === 'opening' ? 'opening_development' : 'tactical_oversight',
        source: 'quiz',
      });
    }
  };

  const handleExerciseMove = (move: Move, newFen: string) => {
    if (!currentSlide?.exercise || !weekData) {
      setBoardFen(newFen);
      return;
    }
    const cleanTarget = currentSlide.exercise.solutionSan.replace(/[+#]/g, '');
    const cleanPlayed = move.san.replace(/[+#]/g, '');
    const totalTasks = weekData.slides.filter((s) => s.exercise || s.quiz).length;

    if (cleanPlayed === cleanTarget) {
      setBoardFen(newFen);
      setExerciseFeedback('correct');
      markExerciseSolved(selectedWeek, currentSlide.id, totalTasks);
    } else {
      setExerciseFeedback('wrong');
      recordMissedItem({
        id: `ex-${currentSlide.id}`,
        fen: currentSlide.exercise.fen,
        solutionSan: currentSlide.exercise.solutionSan,
        prompt: pick(currentSlide.exercise.prompt),
        category: weekData.phase === 'endgame' ? 'endgame_technique' : weekData.phase === 'opening' ? 'opening_development' : 'tactical_oversight',
        square: move.to,
        playedSan: move.san,
        source: 'drill',
      });
      setTimeout(() => {
        setBoardFen(currentSlide.exercise!.fen);
      }, 650);
    }
  };

  const weekMastery = state.weeks[selectedWeek]?.mastery ?? 'unseen';
  const canDownloadCertificate =
    state.weeks[3]?.mastery === 'solid' ||
    state.weeks[3]?.mastery === 'mastered' ||
    state.weeks[8]?.mastery === 'solid' ||
    state.weeks[8]?.mastery === 'mastered';

  return (
    <div className="space-y-6">
      {/* 8-Week Backwards Journey Map */}
      {!presentMode && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {WEEK_PHASE_META.map(({ week, phase }) => {
            const mastery = state.weeks[week]?.mastery ?? 'unseen';
            const unlocked = isWeekUnlocked(week);
            const isSelected = selectedWeek === week;
            const isMonday = mondayWeek === week;

            return (
              <div
                key={week}
                className={`rounded-xl border p-3 flex flex-col justify-between gap-2 transition-colors ${
                  isSelected
                    ? 'bg-[var(--chess-charcoal)] text-[#EEEED2] border-[var(--accent-gold)]'
                    : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-hairline)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => unlocked && onSelectWeek(week)}
                  disabled={!unlocked}
                  className="text-start space-y-1 disabled:opacity-60"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono-tabular">
                    <span className="text-[var(--accent-gold)] font-semibold">W{week}</span>
                    {unlocked ? (
                      <span className="capitalize">{t.academy.mastery[mastery]}</span>
                    ) : (
                      <Lock className="w-3 h-3" />
                    )}
                  </div>
                  <div className="text-xs font-semibold capitalize">{phase}</div>
                  {isMonday && (
                    <div className="text-[10px] font-semibold text-[var(--accent-primary)]">Monday focus</div>
                  )}
                </button>

                {!unlocked && (
                  <button
                    type="button"
                    onClick={() => {
                      unlockWeekViaPlacement(week);
                      onSelectWeek(week);
                    }}
                    className="text-[10px] font-semibold text-[var(--accent-primary)] hover:underline text-start"
                  >
                    Placement unlock
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Active Week Slide Viewer */}
      {weekData && currentSlide && (
        <div
          className={`bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5 sm:p-7 space-y-6 ${
            presentMode ? 'fixed inset-0 z-50 rounded-none overflow-y-auto' : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-hairline)]">
            <div>
              <p className="text-xs font-mono-tabular uppercase text-[var(--accent-gold)]">
                Week {weekData.weekNumber} · {weekData.phase} · {t.academy.mastery[weekMastery]}
              </p>
              <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">{pick(weekData.title)}</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  downloadCheatSheetPdf({
                    weekNumber: weekData.weekNumber,
                    weekTitle: weekData.title.en,
                    phase: weekData.phase.toUpperCase(),
                    keyTakeaways: weekData.keyTakeaways.map((k) => k.en),
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-xs font-semibold hover:bg-[var(--bg-subtle)]"
              >
                <Download className="w-3.5 h-3.5" />
                {t.academy.cheatSheetBtn}
              </button>

              {canDownloadCertificate && (
                <button
                  type="button"
                  onClick={() =>
                    downloadCertificatePdf({
                      learnerName: user?.displayName || 'Chess House Student',
                      levelTitle:
                        state.weeks[8]?.mastery === 'solid' || state.weeks[8]?.mastery === 'mastered'
                          ? '8-Week Backwards Academy Graduate'
                          : 'Endgames Foundation Certificate (Weeks 1-3)',
                      dateIso: new Date().toISOString(),
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-gold)] text-[#1B1A17] text-xs font-semibold"
                >
                  <Award className="w-3.5 h-3.5" />
                  {t.academy.certificateBtn}
                </button>
              )}

              <button
                type="button"
                onClick={() => setPresentMode((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-xs font-semibold hover:bg-[var(--bg-subtle)]"
              >
                {presentMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                Present
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-3">
              <ChessBoard
                fen={boardFen}
                onMove={handleExerciseMove}
                interactive={true}
                highlightSquares={currentSlide.highlights ?? []}
                ariaLabel={pick(currentSlide.title)}
              />

              <div className="flex flex-wrap items-center justify-center gap-2">
                {currentSlide.demoMovesSan && currentSlide.demoMovesSan.length > 0 && (
                  <button
                    type="button"
                    onClick={handlePlayDemoStep}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--chess-charcoal)] text-[#EEEED2] text-xs font-semibold"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Demo ({demoStep}/{currentSlide.demoMovesSan.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDemoStep(0);
                    setBoardFen(currentSlide.exercise?.fen ?? currentSlide.fen);
                    setExerciseFeedback('idle');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-strong)] text-xs font-semibold hover:bg-[var(--bg-subtle)]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t.common.reset}
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-5">
              <div>
                <p className="text-xs font-mono-tabular text-[var(--text-muted)]">
                  Slide {slideIdx + 1} / {weekData.slides.length}
                </p>
                <h3 className="font-display text-2xl font-bold text-[var(--text-primary)] mt-1">
                  {pick(currentSlide.title)}
                </h3>
                <p className="mt-3 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                  {pick(currentSlide.body)}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[var(--accent-gold-bg)] border border-[var(--accent-gold)] text-sm text-[var(--text-primary)]">
                <strong>Key Idea:</strong> {pick(currentSlide.keyIdea)}
              </div>

              {/* Interactive Quiz */}
              {currentSlide.quiz && (
                <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-hairline)] space-y-3">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{pick(currentSlide.quiz.question)}</p>
                  <div className="space-y-2">
                    {currentSlide.quiz.options.map((opt, idx) => {
                      const chosen = quizChoice === idx;
                      const isCorrect = idx === currentSlide.quiz!.correctIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAnswerQuiz(idx)}
                          className={`w-full text-start px-3.5 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
                            chosen
                              ? isCorrect
                                ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                                : 'bg-[var(--danger)] text-white border-[var(--danger)]'
                              : 'bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-hairline)] hover:border-[var(--border-strong)]'
                          }`}
                        >
                          {pick(opt)}
                        </button>
                      );
                    })}
                  </div>
                  {quizChoice !== null && (
                    <p className="text-xs text-[var(--text-secondary)] pt-1">{pick(currentSlide.quiz.explanation)}</p>
                  )}
                </div>
              )}

              {/* Interactive Board Exercise */}
              {currentSlide.exercise && (
                <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-hairline)] space-y-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    Board Exercise: {pick(currentSlide.exercise.prompt)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Hint: {pick(currentSlide.exercise.hint)}</p>
                  {exerciseFeedback === 'correct' && (
                    <p className="text-xs font-semibold text-[var(--accent-primary)] flex items-center gap-1.5 pt-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Solved ({currentSlide.exercise.solutionSan})!
                    </p>
                  )}
                  {exerciseFeedback === 'wrong' && (
                    <p className="text-xs font-semibold text-[var(--danger)] pt-1">
                      Not the best move — added to your daily SRS review queue. Try again!
                    </p>
                  )}
                </div>
              )}

              {/* Slide Navigation */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-hairline)]">
                <button
                  type="button"
                  disabled={slideIdx === 0}
                  onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border border-[var(--border-strong)] text-xs font-semibold disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>
                <button
                  type="button"
                  disabled={slideIdx >= weekData.slides.length - 1}
                  onClick={() => setSlideIdx((i) => Math.min(weekData.slides.length - 1, i + 1))}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
