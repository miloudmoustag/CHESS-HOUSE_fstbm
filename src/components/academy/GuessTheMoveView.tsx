import React, { useState } from 'react';
import { Chess, Move } from 'chess.js';
import { RotateCcw, Sparkles } from 'lucide-react';
import { FAMOUS_OPERA_GAME } from '../../data/academy/drills';
import { useI18n } from '../../i18n';
import { ChessBoard } from '../chess/ChessBoard';

export const GuessTheMoveView: React.FC = () => {
  const { pick } = useI18n();
  const [moveIndex, setMoveIndex] = useState(0);
  const [fen, setFen] = useState(new Chess().fen());
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<string>('');

  const moves = FAMOUS_OPERA_GAME.moves;
  const finished = moveIndex >= moves.length;
  const currentTarget = moves[moveIndex];

  const handlePlayerMove = (move: Move, newFen: string) => {
    if (finished || !currentTarget) return;
    setAttempts((a) => a + 1);
    const expected = currentTarget.san.replace(/[+#!]/g, '');
    const played = move.san.replace(/[+#!]/g, '');

    if (played === expected) {
      setScore((s) => s + 10);
      setFeedback(`Spot on! ${pick(currentTarget.caption)}`);
      const chess = new Chess(newFen);
      let nextIdx = moveIndex + 1;
      // Auto-play Black's reply so the user guesses White's master moves
      if (nextIdx < moves.length && chess.turn() === 'b') {
        chess.move(moves[nextIdx].san);
        nextIdx++;
      }
      setFen(chess.fen());
      setMoveIndex(nextIdx);
    } else {
      setFeedback(`Master played ${currentTarget.san}. Try playing ${currentTarget.san}!`);
      // Reset to position before user's attempt
      setFen(fen);
    }
  };

  const reset = () => {
    setFen(new Chess().fen());
    setMoveIndex(0);
    setScore(0);
    setAttempts(0);
    setFeedback('');
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5 sm:p-7 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono-tabular text-[var(--accent-gold)]">
            Score: {score} pts · Accuracy clues: {attempts}
          </p>
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">{pick(FAMOUS_OPERA_GAME.title)}</h2>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--border-strong)] text-xs font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6">
          <ChessBoard fen={fen} onMove={handlePlayerMove} allowedColor="w" ariaLabel="Guess the Move board" />
        </div>

        <div className="lg:col-span-6 space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Play White&apos;s moves like Paul Morphy. Every exact move scores +10 points and advances Black&apos;s reply
            automatically.
          </p>

          {feedback && (
            <div className="p-4 rounded-lg bg-[var(--accent-gold-bg)] border border-[var(--accent-gold)] text-sm text-[var(--text-primary)]">
              {feedback}
            </div>
          )}

          {finished && (
            <div className="p-5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--accent-primary)] flex items-center gap-3 text-sm font-semibold">
              <Sparkles className="w-5 h-5 text-[var(--accent-gold)]" />
              Checkmate! Final Score: {score} pts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
