import React, { useEffect, useState } from 'react';
import { Chess, Move } from 'chess.js';
import { RotateCcw, Play, Square } from 'lucide-react';
import { ChessBoard } from './ChessBoard';
import { analyzePosition } from '../../lib/chessEngine';
import { FAMOUS_OPERA_GAME } from '../../data/academy/drills';
import { useI18n } from '../../i18n';

export const HeroChessBoard: React.FC = () => {
  const { t, pick } = useI18n();
  const [fen, setFen] = useState<string>(() => new Chess().fen());
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [caption, setCaption] = useState<string>('');
  const [statusText, setStatusText] = useState<string>('');

  // Auto-play classic Opera Game when requested
  useEffect(() => {
    if (!demoRunning) return;
    if (demoIndex >= FAMOUS_OPERA_GAME.moves.length) {
      setDemoRunning(false);
      return;
    }

    const timer = window.setTimeout(() => {
      const chess = new Chess();
      for (let i = 0; i <= demoIndex; i++) {
        const moveObj = chess.move(FAMOUS_OPERA_GAME.moves[i].san);
        if (i === demoIndex && moveObj) {
          setLastMove({ from: moveObj.from, to: moveObj.to });
        }
      }
      setFen(chess.fen());
      setCaption(pick(FAMOUS_OPERA_GAME.moves[demoIndex].caption));
      setDemoIndex((idx) => idx + 1);
    }, 950);

    return () => window.clearTimeout(timer);
  }, [demoRunning, demoIndex, pick]);

  const handlePlayerMove = (move: Move, newFen: string) => {
    setDemoRunning(false);
    setCaption('');
    setFen(newFen);
    setLastMove({ from: move.from, to: move.to });

    const game = new Chess(newFen);
    if (game.isCheckmate()) {
      setStatusText('1-0 · Checkmate!');
      return;
    }
    if (game.isDraw()) {
      setStatusText('1/2-1/2 · Draw');
      return;
    }

    // Engine replies smoothly at beginner level
    window.setTimeout(() => {
      const reply = analyzePosition(newFen, 2, 'beginner');
      if (reply.bestMoveSan) {
        const afterEngine = new Chess(newFen);
        const engMove = afterEngine.move(reply.bestMoveSan);
        if (engMove) {
          setFen(afterEngine.fen());
          setLastMove({ from: engMove.from, to: engMove.to });
          if (afterEngine.isCheckmate()) setStatusText('0-1 · Checkmate');
          else if (afterEngine.isDraw()) setStatusText('1/2-1/2 · Draw');
        }
      }
    }, 240);
  };

  const resetBoard = () => {
    setDemoRunning(false);
    setDemoIndex(0);
    setCaption('');
    setStatusText('');
    setLastMove(null);
    setFen(new Chess().fen());
  };

  const toggleClassicGame = () => {
    if (demoRunning) {
      setDemoRunning(false);
      return;
    }
    setStatusText('');
    setFen(new Chess().fen());
    setLastMove(null);
    setDemoIndex(0);
    setCaption(pick(FAMOUS_OPERA_GAME.title));
    setDemoRunning(true);
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{t.home.heroBoardTitle}</h2>
          <p className="text-xs text-[var(--text-muted)]">{t.home.heroBoardHint}</p>
        </div>
        {statusText && (
          <span className="text-xs font-mono-tabular font-semibold text-[var(--accent-gold)]">{statusText}</span>
        )}
      </div>

      <ChessBoard
        fen={fen}
        onMove={handlePlayerMove}
        interactive={!demoRunning}
        allowedColor="w"
        lastMove={lastMove}
        ariaLabel={t.home.heroBoardTitle}
      />

      {caption && (
        <p className="mt-3 text-xs font-medium text-[var(--text-secondary)] min-h-[1.25rem] text-center">
          {caption}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={resetBoard}
          className="btn-piece-slide inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t.home.heroReset}
        </button>

        <button
          type="button"
          onClick={toggleClassicGame}
          className="btn-piece-slide inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] whitespace-nowrap shrink-0"
        >
          {demoRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {demoRunning ? t.home.heroStopDemo : t.home.heroClassicGame}
        </button>
      </div>
    </div>
  );
};
