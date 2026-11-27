import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { Chess } from 'chess.js';
import { useI18n } from '../i18n';
import { CurriculumView } from '../components/academy/CurriculumView';
import { TacticsTrainer } from '../components/academy/TacticsTrainer';
import { PracticeLab } from '../components/academy/PracticeLab';
import { GameReviewPanel } from '../components/academy/GameReviewPanel';
import { SpacedRepetitionView } from '../components/academy/SpacedRepetitionView';
import { DailyPlanView } from '../components/academy/DailyPlanView';
import { GuessTheMoveView } from '../components/academy/GuessTheMoveView';
import { GlossaryView } from '../components/academy/GlossaryView';
import { AICoachPanel } from '../components/academy/AICoachPanel';

type AcademyTab = 'curriculum' | 'tactics' | 'practice' | 'review' | 'srs' | 'daily' | 'guess' | 'glossary';

export const AcademyPage: React.FC = () => {
  const { t } = useI18n();
  const [tab, setTab] = useState<AcademyTab>('curriculum');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [mondayWeek, setMondayWeek] = useState(1);

  // Coach state synchronized with active board position
  const [coachFen, setCoachFen] = useState<string>(new Chess().fen());
  const [coachQuestion, setCoachQuestion] = useState('');
  const [coachBestMove, setCoachBestMove] = useState<string | null | undefined>(undefined);
  const [coachCategory, setCoachCategory] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const w = data?.settings?.mondayAssignmentWeek;
        if (typeof w === 'number' && w >= 1 && w <= 8) {
          setMondayWeek(w);
        }
      })
      .catch(() => {});
  }, []);

  const tabs: { id: AcademyTab; label: string }[] = [
    { id: 'curriculum', label: t.academy.tabs.curriculum },
    { id: 'tactics', label: t.academy.tabs.tactics },
    { id: 'practice', label: t.academy.tabs.practice },
    { id: 'review', label: t.academy.tabs.review },
    { id: 'srs', label: t.academy.tabs.srs },
    { id: 'daily', label: t.academy.tabs.daily },
    { id: 'guess', label: t.academy.tabs.guess },
    { id: 'glossary', label: t.academy.tabs.glossary },
  ];

  const jumpToWeek = (weekNumber: number) => {
    setSelectedWeek(weekNumber);
    setTab('curriculum');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header + Today's Monday Session Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
            {t.academy.backwardsNote}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">{t.academy.title}</h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">{t.academy.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => jumpToWeek(mondayWeek)}
          className="text-start bg-[var(--bg-surface)] border border-[var(--accent-gold)] rounded-xl px-5 py-4 flex items-center gap-3.5 hover:bg-[var(--accent-gold-bg)] transition-colors shrink-0"
        >
          <Calendar className="w-5 h-5 text-[var(--accent-gold)] shrink-0" />
          <div>
            <div className="text-xs font-mono-tabular uppercase text-[var(--accent-gold)]">
              {t.academy.todaySession}
            </div>
            <div className="text-sm font-bold text-[var(--text-primary)]">
              Week {mondayWeek} · Monday Training
            </div>
          </div>
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-[var(--border-hairline)]">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              tab === item.id
                ? 'bg-[var(--chess-charcoal)] text-[#EEEED2] dark:bg-[var(--accent-primary)] dark:text-white'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-hairline)] hover:text-[var(--text-primary)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Active Study Tool */}
      {tab === 'curriculum' && (
        <CurriculumView
          selectedWeek={selectedWeek}
          onSelectWeek={setSelectedWeek}
          mondayWeek={mondayWeek}
          onFocusPosition={(fen) => {
            setCoachFen(fen);
            setCoachBestMove(undefined);
            setCoachCategory(undefined);
          }}
        />
      )}

      {tab === 'tactics' && (
        <TacticsTrainer
          onFocusPosition={(fen) => {
            setCoachFen(fen);
            setCoachBestMove(undefined);
          }}
        />
      )}

      {tab === 'practice' && (
        <PracticeLab
          onFocusPosition={(fen) => {
            setCoachFen(fen);
            setCoachBestMove(undefined);
          }}
        />
      )}

      {tab === 'review' && (
        <GameReviewPanel
          onExplainMistake={({ fen, bestMoveSan, category, question }) => {
            setCoachFen(fen);
            setCoachBestMove(bestMoveSan);
            setCoachCategory(category);
            setCoachQuestion(question);
          }}
          onJumpToWeek={jumpToWeek}
        />
      )}

      {tab === 'srs' && <SpacedRepetitionView />}
      {tab === 'daily' && <DailyPlanView onNavigateTab={(next) => setTab(next)} />}
      {tab === 'guess' && <GuessTheMoveView />}
      {tab === 'glossary' && <GlossaryView onJumpToWeek={jumpToWeek} />}

      {/* Persistent AI Coach Companion */}
      <AICoachPanel
        fen={coachFen}
        initialQuestion={coachQuestion}
        bestMoveSanOverride={coachBestMove}
        mistakeCategory={coachCategory}
      />
    </div>
  );
};
