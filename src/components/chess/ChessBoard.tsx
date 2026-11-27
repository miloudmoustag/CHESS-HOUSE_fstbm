import React, { useMemo, useRef, useState } from 'react';
import { Chess, Color, Move, PieceSymbol, Square } from 'chess.js';
import { ChessPieceSvg } from './ChessPieceSvg';
import { useI18n } from '../../i18n';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

let audioCtx: AudioContext | null = null;
function playMoveTone(isCapture: boolean) {
  try {
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    if (!audioCtx) audioCtx = new AudioCtor();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isCapture ? 240 : 175, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, audioCtx.currentTime + 0.065);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.075);
  } catch {
    // ignore audio restrictions
  }
}

export interface ChessBoardProps {
  fen: string;
  onMove?: (move: Move, newFen: string) => void;
  interactive?: boolean;
  orientation?: 'w' | 'b';
  allowedColor?: Color | 'both';
  highlightSquares?: string[];
  heatmap?: Record<string, number>;
  lastMove?: { from: string; to: string } | null;
  ariaLabel?: string;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  onMove,
  interactive = true,
  orientation = 'w',
  allowedColor = 'both',
  highlightSquares = [],
  heatmap = {},
  lastMove = null,
  ariaLabel = 'Chess board',
}) => {
  const { soundEnabled } = useI18n();
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [focusedSquare, setFocusedSquare] = useState<Square>('e2');
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');
  const boardRef = useRef<HTMLDivElement>(null);

  const chess = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  const legalTargets = useMemo(() => {
    if (!selectedSquare || !interactive) return new Set<string>();
    const moves = chess.moves({ square: selectedSquare, verbose: true });
    return new Set(moves.map((m) => m.to));
  }, [chess, selectedSquare, interactive]);

  const displayRanks = orientation === 'w' ? RANKS : [...RANKS].reverse();
  const displayFiles = orientation === 'w' ? FILES : [...FILES].reverse();

  const canControlTurn =
    interactive &&
    (allowedColor === 'both' || chess.turn() === allowedColor) &&
    !chess.isGameOver();

  const tryMove = (from: Square, to: Square, promotion?: PieceSymbol) => {
    if (!canControlTurn) return false;
    const moves = chess.moves({ square: from, verbose: true });
    const candidates = moves.filter((m) => m.to === to);
    if (candidates.length === 0) return false;

    if (candidates.some((m) => m.promotion) && !promotion) {
      setPendingPromotion({ from, to });
      return true;
    }

    const clone = new Chess(fen);
    const move = clone.move({ from, to, promotion: promotion ?? 'q' });
    if (!move) return false;

    if (soundEnabled) {
      playMoveTone(Boolean(move.captured));
    }
    setSelectedSquare(null);
    setPendingPromotion(null);
    setAnnouncement(`${move.color === 'w' ? 'White' : 'Black'} played ${move.san}`);
    onMove?.(move, clone.fen());
    return true;
  };

  const handleSquareClick = (sq: Square) => {
    setFocusedSquare(sq);
    if (!canControlTurn) return;

    if (selectedSquare === sq) {
      setSelectedSquare(null);
      return;
    }

    if (selectedSquare && legalTargets.has(sq)) {
      tryMove(selectedSquare, sq);
      return;
    }

    const piece = chess.get(sq);
    if (piece && piece.color === chess.turn() && (allowedColor === 'both' || piece.color === allowedColor)) {
      setSelectedSquare(sq);
    } else {
      setSelectedSquare(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, sq: Square) => {
    const fileIdx = displayFiles.indexOf(sq[0] as (typeof FILES)[number]);
    const rankIdx = displayRanks.indexOf(sq[1] as (typeof RANKS)[number]);
    let nextFile = fileIdx;
    let nextRank = rankIdx;

    if (e.key === 'ArrowRight') nextFile = Math.min(7, fileIdx + 1);
    else if (e.key === 'ArrowLeft') nextFile = Math.max(0, fileIdx - 1);
    else if (e.key === 'ArrowDown') nextRank = Math.min(7, rankIdx + 1);
    else if (e.key === 'ArrowUp') nextRank = Math.max(0, rankIdx - 1);
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSquareClick(sq);
      return;
    } else if (e.key === 'Escape') {
      setSelectedSquare(null);
      setPendingPromotion(null);
      return;
    } else {
      return;
    }

    e.preventDefault();
    const targetSq = `${displayFiles[nextFile]}${displayRanks[nextRank]}` as Square;
    setFocusedSquare(targetSq);
    const btn = boardRef.current?.querySelector<HTMLButtonElement>(`[data-square="${targetSq}"]`);
    btn?.focus();
  };

  const handleDragStart = (e: React.DragEvent, sq: Square) => {
    if (!canControlTurn) {
      e.preventDefault();
      return;
    }
    const piece = chess.get(sq);
    if (!piece || piece.color !== chess.turn()) {
      e.preventDefault();
      return;
    }
    setSelectedSquare(sq);
    e.dataTransfer.setData('text/plain', sq);
  };

  const handleDrop = (e: React.DragEvent, toSq: Square) => {
    e.preventDefault();
    const fromSq = e.dataTransfer.getData('text/plain') as Square;
    if (fromSq) {
      tryMove(fromSq, toSq);
    }
  };

  const inCheckColor = chess.inCheck() ? chess.turn() : null;

  return (
    <div className="chessboard-ltr relative select-none w-full max-w-[480px] mx-auto">
      <div
        ref={boardRef}
        role="grid"
        aria-label={ariaLabel}
        className="grid grid-cols-8 aspect-square w-full overflow-hidden rounded-lg border-2 border-[var(--chess-charcoal)] shadow-sm"
      >
        {displayRanks.map((rank, rIdx) =>
          displayFiles.map((file, fIdx) => {
            const sq = `${file}${rank}` as Square;
            const piece = chess.get(sq);
            const isLight = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0;
            const isSelected = selectedSquare === sq;
            const isLegalTarget = legalTargets.has(sq);
            const isLast = lastMove?.from === sq || lastMove?.to === sq;
            const isHighlighted = highlightSquares.includes(sq);
            const isKingInCheck = piece?.type === 'k' && piece.color === inCheckColor;
            const heatCount = heatmap[sq] ?? 0;

            let bgStyle: React.CSSProperties = {
              backgroundColor: isLight ? 'var(--bg-board-light)' : 'var(--bg-board-dark)',
            };
            if (isSelected) {
              bgStyle = { backgroundColor: '#C9A24B' };
            } else if (isLast) {
              bgStyle = { backgroundColor: isLight ? '#F5F580' : '#BACB44' };
            } else if (isKingInCheck) {
              bgStyle = { backgroundColor: '#D64545' };
            }

            return (
              <button
                key={sq}
                type="button"
                data-square={sq}
                tabIndex={focusedSquare === sq ? 0 : -1}
                onClick={() => handleSquareClick(sq)}
                onKeyDown={(e) => handleKeyDown(e, sq)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, sq)}
                aria-label={`${sq}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ' empty'}`}
                style={bgStyle}
                className={`relative flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#C9A24B] ${
                  isHighlighted ? 'ring-2 ring-inset ring-[#C9A24B]' : ''
                }`}
              >
                {/* Rank coordinate on left column */}
                {fIdx === 0 && (
                  <span
                    aria-hidden="true"
                    className={`absolute top-0.5 left-1 text-[10px] font-mono-tabular font-semibold leading-none ${
                      isLight ? 'text-[#5b7740]' : 'text-[#EEEED2]'
                    }`}
                  >
                    {rank}
                  </span>
                )}
                {/* File coordinate on bottom row */}
                {rIdx === 7 && (
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-0.5 right-1 text-[10px] font-mono-tabular font-semibold leading-none ${
                      isLight ? 'text-[#5b7740]' : 'text-[#EEEED2]'
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* Heatmap overlay for Mistake Analyzer */}
                {heatCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundColor: `rgba(214, 69, 69, ${Math.min(0.6, 0.2 + heatCount * 0.14)})`,
                    }}
                  />
                )}

                {/* Piece */}
                {piece && (
                  <div
                    draggable={canControlTurn && piece.color === chess.turn()}
                    onDragStart={(e) => handleDragStart(e, sq)}
                    className="w-[84%] h-[84%] z-10 cursor-pointer transition-transform duration-150 hover:scale-105"
                  >
                    <ChessPieceSvg type={piece.type} color={piece.color} />
                  </div>
                )}

                {/* Legal move dot / capture ring */}
                {isLegalTarget && !piece && (
                  <span
                    aria-hidden="true"
                    className="w-[28%] h-[28%] rounded-full bg-black/25 z-10 pointer-events-none"
                  />
                )}
                {isLegalTarget && piece && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-1 rounded-full border-[3px] border-black/30 z-10 pointer-events-none"
                  />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Screen reader live move announcements */}
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>

      {/* Promotion Modal */}
      {pendingPromotion && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose promotion piece"
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 rounded-lg"
        >
          <div className="bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border-strong)] shadow-lg flex items-center gap-2">
            {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => tryMove(pendingPromotion.from, pendingPromotion.to, p)}
                className="w-12 h-12 p-1 rounded hover:bg-[var(--accent-gold-bg)] border border-[var(--border-hairline)]"
                aria-label={`Promote to ${p}`}
              >
                <ChessPieceSvg type={p} color={chess.turn()} />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPendingPromotion(null)}
              className="px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
