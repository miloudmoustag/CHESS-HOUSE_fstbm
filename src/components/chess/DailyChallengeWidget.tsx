import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chess, Move } from 'chess.js';
import { CheckCircle2, HelpCircle, RotateCcw, Sparkles } from 'lucide-react';
import { ChessBoard } from './ChessBoard';
import { getDailyChallengePuzzle } from '../../lib/passport';
import type { TacticalPuzzle } from '../../data/academy/types';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';

interface DailyChallengeWidgetProps {
  puzzle?: {
    id: string;
    dateIso: string;
    motif: string;
    rating: number;
    fen: string;
    solutionSan: string[];
    title: { fr: string; en: string; ar: string };
    hint: { fr: string; en: string; ar: string };
  } | null;
}

export const DailyChallengeWidget: React.FC<DailyChallengeWidgetProps> = ({ puzzle: propPuzzle }) => {
  const { t, pick } = useI18n();
  const { user } = useAuth();
  const { markPuzzleSolved } = useStudy();

  const fallbackPuzzle: TacticalPuzzle = getDailyChallengePuzzle();
  const activePuzzle = propPuzzle ?? {
    ...fallbackPuzzle,
    dateIso: new Date().toISOString().slice(0, 10),
  };

  const [fen, setFen] = useState(activePuzzle.fen);
  const [solved, setSolved] = useState(false);
  const [wrongMsg, setWrongMsg] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [xpAwardedMsg, setXpAwardedMsg] = useState('');

  useEffect(() => {
    setFen(activePuzzle.fen);
    setSolved(false);
    setWrongMsg(false);
    setXpAwardedMsg('');
  }, [activePuzzle.fen, activePuzzle.id]);

  const sideToMove = (() => {
    try {
      return new Chess(activePuzzle.fen).turn();
    } catch {
      return 'w' as const;
    }
  })();

  const handleMove = async (move: Move, newFen: string) => {
    if (solved) return;
    const expected = activePuzzle.solutionSan[0];
    if (move.san === expected || move.san.replace(/[+#]/g, '') === expected.replace(/[+#]/g, '')) {
      setFen(newFen);
      setSolved(true);
      setWrongMsg(false);
      markPuzzleSolved(activePuzzle.id, activePuzzle.motif, true);

      if (user) {
        try {
          const res = await fetch('/api/passport', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.accessToken}`,
            },
            body: JSON.stringify({
              action: 'solve_daily_challenge',
              moveSan: expected,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.awarded) {
              setXpAwardedMsg(`+${data.passport?.xpRewards?.puzzles_5 ?? 15} House XP`);
            }
          }
        } catch {
          // offline safe
        }
      }
    } else {
      setWrongMsg(true);
      setFen(activePuzzle.fen);
    }
  };

  const resetPuzzle = () => {
    setFen(activePuzzle.fen);
    setSolved(false);
    setWrongMsg(false);
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div className="lg:col-span-5 max-w-[340px] mx-auto w-full">
        <ChessBoard
          fen={fen}
          onMove={handleMove}
          interactive={!solved}
          orientation={sideToMove}
          allowedColor={sideToMove}
          ariaLabel={pick(activePuzzle.title)}
        />
      </div>

      <div className="lg:col-span-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-mono-tabular uppercase tracking-wider text-[var(--accent-gold)]">
            {t.home.dailyChallengeTitle} · {activePuzzle.dateIso}
          </span>
          <span className="text-xs font-mono-tabular text-[var(--text-muted)]">
            {sideToMove === 'w' ? 'White to move' : 'Black to move'} · {activePuzzle.rating}
          </span>
        </div>

        <h3 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          {pick(activePuzzle.title)}
        </h3>

        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {t.home.dailyChallengeSubtitle}
        </p>

        {solved ? (
          <div className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--accent-primary)] flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5 text-[var(--text-primary)] font-semibold">
              <CheckCircle2 className="w-5 h-5 text-[var(--accent-primary)] shrink-0" />
              <span>{t.home.dailyChallengeSolved}</span>
            </div>
            {xpAwardedMsg && (
              <span className="font-mono-tabular text-xs font-bold text-[var(--accent-gold)] inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {xpAwardedMsg}
              </span>
            )}
          </div>
        ) : wrongMsg ? (
          <p className="text-xs font-medium text-[var(--danger)]">
            Not quite — look closely at checks, captures, and pins. Try again.
          </p>
        ) : null}

        {showHint && (
          <div className="p-3 rounded-lg bg-[var(--bg-subtle)] text-xs text-[var(--text-secondary)]">
            {pick(activePuzzle.hint)}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--border-strong)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {t.home.dailyChallengeHint}
          </button>

          <button
            type="button"
            onClick={resetPuzzle}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--border-hairline)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t.common.reset}
          </button>

          <Link
            to="/academy"
            className="btn-piece-slide inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold hover:bg-[var(--accent-primary-hover)]"
          >
            {t.academy.tabs.tactics} →
          </Link>
        </div>

        <p className="text-xs text-[var(--text-muted)]">{t.home.dailyChallengeXpNote}</p>
      </div>
    </div>
  );
};
