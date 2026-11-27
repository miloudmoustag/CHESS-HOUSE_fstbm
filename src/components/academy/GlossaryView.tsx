import React from 'react';
import { BookOpen } from 'lucide-react';
import { CHESS_GLOSSARY } from '../../data/academy/drills';
import { useI18n } from '../../i18n';

interface GlossaryViewProps {
  onJumpToWeek: (weekNumber: number) => void;
}

export const GlossaryView: React.FC<GlossaryViewProps> = ({ onJumpToWeek }) => {
  const { t, pick } = useI18n();

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5 sm:p-7 space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-[var(--accent-primary)]" />
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">{t.academy.tabs.glossary}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CHESS_GLOSSARY.map((entry, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-hairline)] flex flex-col justify-between gap-3"
          >
            <div className="space-y-1.5">
              <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">{pick(entry.term)}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{pick(entry.definition)}</p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => onJumpToWeek(entry.weekRef)}
                className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
              >
                Study in Week {entry.weekRef} →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
