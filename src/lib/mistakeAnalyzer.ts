import { Chess } from 'chess.js';
import { analyzePosition, evaluateBoard } from './chessEngine';

export type MistakeCategory =
  | 'blunder_hanging'
  | 'tactical_oversight'
  | 'king_safety'
  | 'endgame_technique'
  | 'opening_development';

export interface AnalyzedMove {
  ply: number;
  moveNumber: number;
  color: 'w' | 'b';
  san: string;
  from: string;
  to: string;
  fenBefore: string;
  fenAfter: string;
  bestMoveSan: string | null;
  evalBeforeCp: number;
  evalAfterCp: number;
  cpLoss: number;
  classification: 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  category?: MistakeCategory;
}

export interface GameReviewResult {
  moves: AnalyzedMove[];
  whiteAccuracy: number;
  blackAccuracy: number;
  categoryCounts: Record<MistakeCategory, number>;
  heatmap: Record<string, number>;
  criticalMoments: AnalyzedMove[];
}

export function classifyMistakeCategory(
  fenBefore: string,
  moveSan: string,
  ply: number,
  cpLoss: number
): MistakeCategory {
  const chess = new Chess(fenBefore);
  const board = chess.board();
  let pieceCount = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && board[r][c]!.type !== 'p' && board[r][c]!.type !== 'k') {
        pieceCount++;
      }
    }
  }

  if (pieceCount <= 4) return 'endgame_technique';
  if (ply <= 14 && !moveSan.includes('x')) return 'opening_development';
  if (moveSan.includes('K') || moveSan.includes('f') || moveSan.includes('g') || moveSan.includes('h')) {
    if (ply <= 28) return 'king_safety';
  }
  if (cpLoss >= 280) return 'blunder_hanging';
  return 'tactical_oversight';
}

export function computeAccuracyFromCpLosses(losses: number[]): number {
  if (losses.length === 0) return 100;
  const avgLoss = losses.reduce((sum, x) => sum + Math.min(x, 600), 0) / losses.length;
  const acc = Math.max(10, Math.min(100, Math.round(103.1668 * Math.exp(-0.004 * avgLoss))));
  return acc;
}

export function reviewPgnGame(pgn: string, maxPlies = 40): GameReviewResult {
  const loader = new Chess();
  loader.loadPgn(pgn);
  const history = loader.history({ verbose: true }).slice(0, maxPlies);

  const replay = new Chess();
  const analyzed: AnalyzedMove[] = [];
  const categoryCounts: Record<MistakeCategory, number> = {
    blunder_hanging: 0,
    tactical_oversight: 0,
    king_safety: 0,
    endgame_technique: 0,
    opening_development: 0,
  };
  const heatmap: Record<string, number> = {};
  const whiteLosses: number[] = [];
  const blackLosses: number[] = [];

  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    const fenBefore = replay.fen();
    const color = replay.turn();
    const engineBest = analyzePosition(fenBefore, 1, 'strong');
    const evalBeforeCp = engineBest.scoreCp;

    replay.move(move);
    const fenAfter = replay.fen();
    const evalAfterRaw = evaluateBoard(replay);

    // Centipawn loss from the mover's perspective
    const rawDiff = color === 'w' ? evalBeforeCp - evalAfterRaw : evalAfterRaw - evalBeforeCp;
    const cpLoss = Math.max(0, Math.round(rawDiff));

    if (color === 'w') whiteLosses.push(cpLoss);
    else blackLosses.push(cpLoss);

    let classification: AnalyzedMove['classification'] = 'best';
    let category: MistakeCategory | undefined;

    if (cpLoss >= 250) {
      classification = 'blunder';
    } else if (cpLoss >= 110) {
      classification = 'mistake';
    } else if (cpLoss >= 55) {
      classification = 'inaccuracy';
    } else if (cpLoss >= 20) {
      classification = 'good';
    }

    if (classification === 'mistake' || classification === 'blunder' || classification === 'inaccuracy') {
      category = classifyMistakeCategory(fenBefore, move.san, i + 1, cpLoss);
      if (classification !== 'inaccuracy') {
        categoryCounts[category] += 1;
        heatmap[move.to] = (heatmap[move.to] ?? 0) + 1;
      }
    }

    analyzed.push({
      ply: i + 1,
      moveNumber: Math.floor(i / 2) + 1,
      color,
      san: move.san,
      from: move.from,
      to: move.to,
      fenBefore,
      fenAfter,
      bestMoveSan: engineBest.bestMoveSan,
      evalBeforeCp,
      evalAfterCp: evalAfterRaw,
      cpLoss,
      classification,
      category,
    });
  }

  const criticalMoments = analyzed
    .filter((m) => m.classification === 'blunder' || m.classification === 'mistake')
    .sort((a, b) => b.cpLoss - a.cpLoss)
    .slice(0, 6);

  return {
    moves: analyzed,
    whiteAccuracy: computeAccuracyFromCpLosses(whiteLosses),
    blackAccuracy: computeAccuracyFromCpLosses(blackLosses),
    categoryCounts,
    heatmap,
    criticalMoments,
  };
}
