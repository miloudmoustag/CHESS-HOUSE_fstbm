import React, { useState } from 'react';
import { Move } from 'chess.js';
import { CheckCircle2, Eye, Layers } from 'lucide-react';
import { isCardDue } from '../../lib/srs';
import { useStudy } from '../../context/StudyContext';
import { useI18n } from '../../i18n';
import { ChessBoard } from '../chess/ChessBoard';

export const SpacedRepetitionView: React.FC = () => {
  const { t } = useI18n();
  const { state, reviewSrsCard } = useStudy();
  const [reveal, setReveal] = useState(false);
  const [boardFen, setBoardFen] = useState<string | null>(null);
  const [matchMsg, setMatchMsg] = useState<'none' | 'correct' | 'wrong'>('none');

  const dueCards = state.srsCards.filter((c) => isCardDue(c));
  const card = dueCards[0] ?? state.srsCards[0] ?? null;

  if (!card) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-8 text-center space-y-3">
        <Layers className="w-8 h-8 text-[var(--accent-primary)] mx-auto" />
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">{t.academy.tabs.srs}</h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          Your review deck is empty! Any missed quiz, board exercise, tactical puzzle, or PGN blunder is automatically
          scheduled here at 1, 3, 7, and 21+ day SM-2 intervals.
        </p>
      </div>
    );
  }

  const activeFen = boardFen ?? card.fen;

  const handleMove = (move: Move, newFen: string) => {
    const cleanTarget = card.solutionSan.replace(/[+#]/g, '').toLowerCase();
    const cleanPlayed = move.san.replace(/[+#]/g, '').toLowerCase();
    if (cleanPlayed === cleanTarget) {
      setBoardFen(newFen);
      setMatchMsg('correct');
      setReveal(true);
    } else {
      setMatchMsg('wrong');
      setTimeout(() => setBoardFen(card.fen), 600);
    }
  };

  const submitRating = (quality: 1 | 3 | 4 | 5) => {
    reviewSrsCard(card.id, quality);
    setReveal(false);
    setBoardFen(null);
    setMatchMsg('none');
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5 sm:p-7 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-mono-tabular text-[var(--accent-gold)]">
            Due today: {dueCards.length} · Total cards: {state.srsCards.length}
          </p>
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">{t.academy.tabs.srs}</h2>
        </div>
        <span className="text-xs font-mono-tabular text-[var(--text-muted)]">
          Interval: {card.intervalDays}d · Reps: {card.repetitions}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6">
          <ChessBoard
            fen={activeFen}
            onMove={handleMove}
            orientation={card.fen.split(' ')[1] === 'b' ? 'b' : 'w'}
            ariaLabel={card.prompt}
          />
        </div>

        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 rounded-lg bg-[var(--bg-subtle)] space-y-2">
            <p className="text-xs uppercase font-mono-tabular text-[var(--accent-gold)]">
              {card.source} · {card.category.replace(/_/g, ' ')}
            </p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{card.prompt}</p>
          </div>

          {matchMsg === 'correct' && (
            <p className="text-xs font-semibold text-[var(--accent-primary)] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Exact move played! Rate how easy it felt below.
            </p>
          )}
          {matchMsg === 'wrong' && (
            <p className="text-xs font-semibold text-[var(--danger)]">
              Try again or reveal the solution below.
            </p>
          )}

          {reveal ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[var(--accent-gold-bg)] border border-[var(--accent-gold)] text-sm">
                Solution: <strong className="font-mono-tabular">{card.solutionSan}</strong>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => submitRating(1)}
                  className="py-2 rounded-lg border border-[var(--danger)] text-xs font-semibold text-[var(--danger)]"
                >
                  Again (1d)
                </button>
                <button
                  type="button"
                  onClick={() => submitRating(3)}
                  className="py-2 rounded-lg border border-[var(--border-strong)] text-xs font-semibold"
                >
                  Hard
                </button>
                <button
                  type="button"
                  onClick={() => submitRating(4)}
                  className="py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold"
                >
                  Good
                </button>
                <button
                  type="button"
                  onClick={() => submitRating(5)}
                  className="py-2 rounded-lg bg-[var(--chess-charcoal)] text-[#EEEED2] text-xs font-semibold"
                >
                  Easy
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setReveal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border-strong)] text-xs font-semibold hover:bg-[var(--bg-subtle)]"
            >
              <Eye className="w-4 h-4" />
              Show Answer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
