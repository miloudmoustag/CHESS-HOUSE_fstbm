import React from 'react';
import { Award, CheckCircle2, Circle, Flame } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useI18n } from '../../i18n';

interface DailyPlanViewProps {
  onNavigateTab: (tab: 'curriculum' | 'srs' | 'practice') => void;
}

export const DailyPlanView: React.FC<DailyPlanViewProps> = ({ onNavigateTab }) => {
  const { t } = useI18n();
  const { state } = useStudy();

  const steps = [
    {
      id: 'review',
      done: state.dailyDone.reviewDone,
      title: '1. Review Mistakes (3 min)',
      desc: 'Clear your due SM-2 spaced repetition cards.',
      tab: 'srs' as const,
    },
    {
      id: 'lesson',
      done: state.dailyDone.lessonDone,
      title: '2. Backwards Lesson Slide (4 min)',
      desc: 'Study one endgame or middlegame slide & solve its quiz.',
      tab: 'curriculum' as const,
    },
    {
      id: 'drill',
      done: state.dailyDone.drillDone,
      title: '3. Practice Lab Drill (3 min)',
      desc: 'Convert a winning King+Pawn or Rook endgame vs the engine.',
      tab: 'practice' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5">
          <div className="text-2xl font-bold font-mono-tabular text-[var(--accent-gold)] flex items-center gap-2">
            <Flame className="w-5 h-5" />
            {state.streakDays} days
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Study Streak</div>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5">
          <div className="text-2xl font-bold font-mono-tabular text-[var(--accent-primary)]">{state.rating}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Academy Rating</div>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5">
          <div className="text-2xl font-bold font-mono-tabular text-[var(--text-primary)] flex items-center gap-2">
            <Award className="w-5 h-5 text-[var(--accent-gold)]" />
            {state.badges.length}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Badges Earned</div>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">{t.academy.tabs.daily}</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Ten focused minutes every day builds sharper endgame vision and fewer tactical blunders.
        </p>

        <div className="space-y-3 pt-2">
          {steps.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-hairline)]"
            >
              <div className="flex items-start gap-3">
                {s.done ? (
                  <CheckCircle2 className="w-5 h-5 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-[var(--text-muted)] shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-sm text-[var(--text-primary)]">{s.title}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{s.desc}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab(s.tab)}
                className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold hover:bg-[var(--accent-primary-hover)]"
              >
                Open →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
