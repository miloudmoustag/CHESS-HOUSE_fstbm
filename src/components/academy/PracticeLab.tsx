import React, { useEffect, useRef, useState } from 'react';
import { Chess, Move } from 'chess.js';
import { Cpu, RotateCcw } from 'lucide-react';
import { PRACTICE_DRILLS, PracticeDrill } from '../../data/academy/drills';
import { BotStrength, EngineEvalResult, classifyEndgameOutcome } from '../../lib/chessEngine';
import { EngineWorkerResponse } from '../../workers/engine.worker';
import { useStudy } from '../../context/StudyContext';
import { useI18n } from '../../i18n';
import { ChessBoard } from '../chess/ChessBoard';

interface PracticeLabProps {
  onFocusPosition: (fen: string) => void;
}

export const PracticeLab: React.FC<PracticeLabProps> = ({ onFocusPosition }) => {
  const { t, pick } = useI18n();
  const { markDrillCompleted } = useStudy();
  const [selectedDrill, setSelectedDrill] = useState<PracticeDrill>(PRACTICE_DRILLS[0]);
  const [fen, setFen] = useState(PRACTICE_DRILLS[0].fen);
  const [strength, setStrength] = useState<BotStrength>('club');
  const [thinking, setThinking] = useState(false);
  const [evalScore, setEvalScore] = useState(0);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    const worker = new Worker(new URL('../../workers/engine.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    return () => {
      worker.terminate();
    };
  }, []);

  const runEngine = (targetFen: string, botStrength: BotStrength): Promise<EngineEvalResult | null> => {
    return new Promise((resolve) => {
      const worker = workerRef.current;
      if (!worker) {
        resolve(null);
        return;
      }
      const id = `req-${++reqIdRef.current}`;
      const handler = (ev: MessageEvent<EngineWorkerResponse>) => {
        if (ev.data.id !== id) return;
        worker.removeEventListener('message', handler);
        resolve(ev.data.result ?? null);
      };
      worker.addEventListener('message', handler);
      worker.postMessage({ id, fen: targetFen, depth: botStrength === 'strong' ? 3 : 2, strength: botStrength });
    });
  };

  const resetDrill = (drill: PracticeDrill) => {
    setSelectedDrill(drill);
    setFen(drill.fen);
    setEvalScore(0);
    setLastMove(null);
    onFocusPosition(drill.fen);
  };

  const handlePlayerMove = async (move: Move, newFen: string) => {
    setFen(newFen);
    setLastMove({ from: move.from, to: move.to });
    onFocusPosition(newFen);

    const chess = new Chess(newFen);
    if (chess.isGameOver()) {
      markDrillCompleted(selectedDrill.id, chess.isCheckmate() || selectedDrill.targetOutcome === 'draw');
      return;
    }

    setThinking(true);
    const result = await runEngine(newFen, strength);
    setThinking(false);
    if (!result || !result.bestMoveSan) return;

    setEvalScore(result.scoreCp);
    const nextChess = new Chess(newFen);
    const botMove = nextChess.move(result.bestMoveSan);
    if (botMove) {
      const afterFen = nextChess.fen();
      setFen(afterFen);
      setLastMove({ from: botMove.from, to: botMove.to });
      onFocusPosition(afterFen);
      if (nextChess.isGameOver()) {
        const won = nextChess.isCheckmate() && nextChess.turn() !== selectedDrill.playerColor;
        markDrillCompleted(selectedDrill.id, won || (selectedDrill.targetOutcome === 'draw' && nextChess.isDraw()));
      }
    }
  };

  const chess = new Chess(fen);
  const verdict = classifyEndgameOutcome(chess, selectedDrill.playerColor, evalScore);
  const verdictLabel =
    verdict === 'winning'
      ? t.academy.endgameWinning
      : verdict === 'drawing'
      ? t.academy.endgameDrawing
      : t.academy.endgameLosing;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5 sm:p-7 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono-tabular uppercase text-[var(--accent-gold)]">{selectedDrill.category}</p>
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">{pick(selectedDrill.title)}</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{pick(selectedDrill.objective)}</p>
        </div>

        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[var(--accent-primary)]" />
          <select
            value={strength}
            onChange={(e) => setStrength(e.target.value as BotStrength)}
            className="px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-xs font-semibold"
          >
            <option value="beginner">Bot: Beginner</option>
            <option value="club">Bot: Club</option>
            <option value="strong">Bot: Strong</option>
          </select>
          <button
            type="button"
            onClick={() => resetDrill(selectedDrill)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-[var(--border-strong)] text-xs font-semibold hover:bg-[var(--bg-subtle)]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t.common.reset}
          </button>
        </div>
      </div>

      {selectedDrill.isEndgameTablebase && (
        <div className="px-4 py-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)] flex items-center justify-between text-xs font-semibold">
          <span>Endgame Evaluation Readout:</span>
          <span className="font-mono-tabular text-[var(--accent-primary)]">{verdictLabel}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 space-y-2">
          <ChessBoard
            fen={fen}
            onMove={handlePlayerMove}
            orientation={selectedDrill.playerColor}
            allowedColor={thinking ? 'both' : selectedDrill.playerColor}
            lastMove={lastMove}
            ariaLabel={pick(selectedDrill.title)}
          />
          {thinking && <p className="text-xs text-center text-[var(--text-muted)]">Engine calculating...</p>}
        </div>

        <div className="lg:col-span-6 space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Select Drill ({PRACTICE_DRILLS.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRACTICE_DRILLS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => resetDrill(d)}
                className={`text-start p-3 rounded-lg border text-xs transition-colors ${
                  d.id === selectedDrill.id
                    ? 'bg-[var(--chess-charcoal)] text-[#EEEED2] border-[var(--accent-gold)]'
                    : 'bg-[var(--bg-page)] text-[var(--text-primary)] border-[var(--border-hairline)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="font-mono-tabular text-[10px] uppercase text-[var(--accent-gold)]">{d.category}</div>
                <div className="font-semibold mt-0.5">{pick(d.title)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
