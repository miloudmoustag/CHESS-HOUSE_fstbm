import React, { useMemo, useState } from 'react';
import { Move } from 'chess.js';
import { CheckCircle2, HelpCircle, SkipForward } from 'lucide-react';
import { TACTICAL_PUZZLES } from '../../data/academy/puzzles';
import { TacticalPuzzle } from '../../data/academy/types';
import { useStudy } from '../../context/StudyContext';
import { useI18n } from '../../i18n';
import { ChessBoard } from '../chess/ChessBoard';

interface TacticsTrainerProps {
  onFocusPosition: (fen: string) => void;
}

const MOTIFS: ('all' | TacticalPuzzle['motif'])[] = [
  'all',
  'mate_in_1',
  'back_rank',
  'fork',
  'pin',
  'skewer',
  'discovered_attack',
  'deflection',
  'mate_in_2',
];

export const TacticsTrainer: React.FC<TacticsTrainerProps> = ({ onFocusPosition }) => {
  const { pick } = useI18n();
  const { state, markPuzzleSolved, recordMissedItem } = useStudy();

  const [motif, setMotif] = useState<'all' | TacticalPuzzle['motif']>('all');
  const [index, setIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [firstTry, setFirstTry] = useState(true);
  const [status, setStatus] = useState<'solving' | 'solved' | 'wrong'>('solving');
  const [boardFen, setBoardFen] = useState<string>(TACTICAL_PUZZLES[0].fen);

  const filtered = useMemo(
    () => TACTICAL_PUZZLES.filter((p) => motif === 'all' || p.motif === motif),
    [motif]
  );

  const puzzle = filtered[index % filtered.length] ?? TACTICAL_PUZZLES[0];

  const selectPuzzle = (nextIdx: number) => {
    const target = filtered[nextIdx % filtered.length];
    setIndex(nextIdx % filtered.length);
    setBoardFen(target.fen);
    setShowHint(false);
    setFirstTry(true);
    setStatus('solving');
    onFocusPosition(target.fen);
  };

  const handleMove = (move: Move, newFen: string) => {
    if (status === 'solved') return;
    const expected = puzzle.solutionSan[0].replace(/[+#]/g, '');
    const played = move.san.replace(/[+#]/g, '');

    if (played === expected) {
      setBoardFen(newFen);
      setStatus('solved');
      markPuzzleSolved(puzzle.id, puzzle.motif, firstTry);
    } else {
      setFirstTry(false);
      setStatus('wrong');
      recordMissedItem({
        id: `puzzle-${puzzle.id}`,
        fen: puzzle.fen,
        solutionSan: puzzle.solutionSan[0],
        prompt: `${pick(puzzle.title)} (${puzzle.motif})`,
        category: 'tactical_oversight',
        square: move.to,
        playedSan: move.san,
        source: 'puzzle',
      });
      setTimeout(() => {
        setBoardFen(puzzle.fen);
        setStatus('solving');
      }, 650);
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5 sm:p-7 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-mono-tabular text-[var(--accent-gold)]">
            {filtered.length} puzzles · Solved: {state.puzzlesSolved.length} / {TACTICAL_PUZZLES.length}
          </p>
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">{pick(puzzle.title)}</h2>
        </div>

        <select
          value={motif}
          onChange={(e) => {
            const m = e.target.value as typeof motif;
            setMotif(m);
            const list = TACTICAL_PUZZLES.filter((p) => m === 'all' || p.motif === m);
            setIndex(0);
            if (list[0]) {
              setBoardFen(list[0].fen);
              setStatus('solving');
            }
          }}
          className="px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-xs font-semibold"
        >
          {MOTIFS.map((m) => (
            <option key={m} value={m}>
              {m.replace(/_/g, ' ').toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6">
          <ChessBoard
            fen={boardFen}
            onMove={handleMove}
            orientation={puzzle.fen.split(' ')[1] === 'b' ? 'b' : 'w'}
            ariaLabel={pick(puzzle.title)}
          />
        </div>

        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 rounded-lg bg-[var(--bg-subtle)] space-y-2 text-sm">
            <div className="flex items-center justify-between text-xs font-mono-tabular text-[var(--text-muted)]">
              <span>Motif: {puzzle.motif.replace(/_/g, ' ')}</span>
              <span>Rating: {puzzle.rating}</span>
            </div>
            <p className="font-medium text-[var(--text-primary)]">
              {puzzle.fen.split(' ')[1] === 'b' ? 'Black to move' : 'White to move'} — find the strongest tactical strike.
            </p>
          </div>

          {showHint && (
            <div className="p-3.5 rounded-lg bg-[var(--accent-gold-bg)] border border-[var(--accent-gold)] text-xs text-[var(--text-primary)]">
              {pick(puzzle.hint)}
            </div>
          )}

          {status === 'solved' && (
            <div className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--accent-primary)] text-sm font-semibold text-[var(--accent-primary)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Solved ({puzzle.solutionSan[0]})!
            </div>
          )}
          {status === 'wrong' && (
            <div className="p-3 rounded-lg border border-[var(--danger)] text-xs font-semibold text-[var(--danger)]">
              Not quite — saved to your Spaced Repetition review queue. Try again!
            </div>
          )}

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--border-strong)] text-xs font-semibold hover:bg-[var(--bg-subtle)]"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Hint
            </button>
            <button
              type="button"
              onClick={() => selectPuzzle(index + 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold hover:bg-[var(--accent-primary-hover)]"
            >
              Next Puzzle
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
