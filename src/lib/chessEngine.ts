import { Chess, Move, PieceSymbol, Color } from 'chess.js';

export type BotStrength = 'beginner' | 'club' | 'strong';

export interface EngineEvalResult {
  bestMoveSan: string | null;
  bestMoveUci: string | null;
  scoreCp: number; // from White's perspective (+ = White better, - = Black better)
  mateIn: number | null;
  endgameVerdict?: 'winning' | 'drawing' | 'losing';
}

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-square tables from White's perspective (rank 8 at index 0 -> rank 1 at index 7)
const PAWN_PST = [
  0, 0, 0, 0, 0, 0, 0, 0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5, 5, 10, 27, 27, 10, 5, 5,
  0, 0, 0, 24, 24, 0, 0, 0,
  5, -5, -10, 0, 0, -10, -5, 5,
  5, 10, 10, -20, -20, 10, 10, 5,
  0, 0, 0, 0, 0, 0, 0, 0,
];

const KNIGHT_PST = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20, 0, 0, 0, 0, -20, -40,
  -30, 0, 10, 15, 15, 10, 0, -30,
  -30, 5, 15, 20, 20, 15, 5, -30,
  -30, 0, 15, 20, 20, 15, 0, -30,
  -30, 5, 10, 15, 15, 10, 5, -30,
  -40, -20, 0, 5, 5, 0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50,
];

const BISHOP_PST = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 10, 10, 5, 0, -10,
  -10, 5, 5, 10, 10, 5, 5, -10,
  -10, 0, 10, 10, 10, 10, 0, -10,
  -10, 10, 10, 10, 10, 10, 10, -10,
  -10, 5, 0, 0, 0, 0, 5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20,
];

const ROOK_PST = [
  0, 0, 0, 0, 0, 0, 0, 0,
  5, 10, 10, 10, 10, 10, 10, 5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  0, 0, 0, 5, 5, 0, 0, 0,
];

const QUEEN_PST = [
  -20, -10, -10, -5, -5, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 5, 5, 5, 0, -10,
  -5, 0, 5, 5, 5, 5, 0, -5,
  0, 0, 5, 5, 5, 5, 0, -5,
  -10, 5, 5, 5, 5, 5, 0, -10,
  -10, 0, 5, 0, 0, 0, 0, -10,
  -20, -10, -10, -5, -5, -10, -10, -20,
];

const KING_MID_PST = [
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10,
  20, 20, 0, 0, 0, 0, 20, 20,
  20, 30, 10, 0, 0, 10, 30, 20,
];

const KING_END_PST = [
  -50, -40, -30, -20, -20, -30, -40, -50,
  -30, -20, -10, 0, 0, -10, -20, -30,
  -30, -10, 20, 30, 30, 20, -10, -30,
  -30, -10, 30, 40, 40, 30, -10, -30,
  -30, -10, 30, 40, 40, 30, -10, -30,
  -30, -10, 20, 30, 30, 20, -10, -30,
  -30, -30, 0, 0, 0, 0, -30, -30,
  -50, -30, -30, -30, -30, -30, -30, -50,
];

function getPstValue(type: PieceSymbol, color: Color, row: number, col: number, isEndgame: boolean): number {
  const r = color === 'w' ? row : 7 - row;
  const idx = r * 8 + col;
  switch (type) {
    case 'p':
      return PAWN_PST[idx];
    case 'n':
      return KNIGHT_PST[idx];
    case 'b':
      return BISHOP_PST[idx];
    case 'r':
      return ROOK_PST[idx];
    case 'q':
      return QUEEN_PST[idx];
    case 'k':
      return isEndgame ? KING_END_PST[idx] : KING_MID_PST[idx];
  }
}

export function evaluateBoard(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -99999 : 99999;
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
    return 0;
  }

  const board = chess.board();
  let nonKingMaterial = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type !== 'k') {
        nonKingMaterial += PIECE_VALUES[piece.type];
      }
    }
  }
  const isEndgame = nonKingMaterial <= 2600;

  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const val = PIECE_VALUES[piece.type] + getPstValue(piece.type, piece.color, r, c, isEndgame);
      score += piece.color === 'w' ? val : -val;
    }
  }
  return score;
}

function orderMoves(moves: Move[]): Move[] {
  return moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if (a.captured) scoreA += 10 * PIECE_VALUES[a.captured] - PIECE_VALUES[a.piece];
    if (b.captured) scoreB += 10 * PIECE_VALUES[b.captured] - PIECE_VALUES[b.piece];
    if (a.promotion) scoreA += PIECE_VALUES[a.promotion];
    if (b.promotion) scoreB += PIECE_VALUES[b.promotion];
    if (a.san.includes('+')) scoreA += 45;
    if (b.san.includes('+')) scoreB += 45;
    return scoreB - scoreA;
  });
}

function quiescence(chess: Chess, alpha: number, beta: number, maximizing: boolean, depth = 0): number {
  const standPat = evaluateBoard(chess);
  if (depth >= 2 || chess.isGameOver()) return standPat;

  if (maximizing) {
    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;
    const captures = orderMoves(chess.moves({ verbose: true }).filter((m) => m.captured || m.promotion));
    for (const move of captures) {
      chess.move(move);
      const score = quiescence(chess, alpha, beta, false, depth + 1);
      chess.undo();
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  } else {
    if (standPat <= alpha) return alpha;
    if (beta > standPat) beta = standPat;
    const captures = orderMoves(chess.moves({ verbose: true }).filter((m) => m.captured || m.promotion));
    for (const move of captures) {
      chess.move(move);
      const score = quiescence(chess, alpha, beta, true, depth + 1);
      chess.undo();
      if (score <= alpha) return alpha;
      if (score < beta) beta = score;
    }
    return beta;
  }
}

function alphaBeta(chess: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number {
  if (chess.isGameOver()) return evaluateBoard(chess);
  if (depth === 0) return quiescence(chess, alpha, beta, maximizing);

  const moves = orderMoves(chess.moves({ verbose: true }));
  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const val = alphaBeta(chess, depth - 1, alpha, beta, false);
      chess.undo();
      if (val > best) best = val;
      if (val > alpha) alpha = val;
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      chess.move(move);
      const val = alphaBeta(chess, depth - 1, alpha, beta, true);
      chess.undo();
      if (val < best) best = val;
      if (val < beta) beta = val;
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function classifyEndgameOutcome(chess: Chess, viewerColor: Color, scoreCp: number): 'winning' | 'drawing' | 'losing' {
  const perspectiveCp = viewerColor === 'w' ? scoreCp : -scoreCp;
  if (chess.isDraw() || chess.isInsufficientMaterial() || chess.isStalemate()) return 'drawing';
  if (perspectiveCp >= 160) return 'winning';
  if (perspectiveCp <= -160) return 'losing';
  return 'drawing';
}

export function analyzePosition(fen: string, depth = 3, strength: BotStrength = 'strong'): EngineEvalResult {
  const chess = new Chess(fen);
  const moves = orderMoves(chess.moves({ verbose: true }));
  if (moves.length === 0) {
    const scoreCp = evaluateBoard(chess);
    return {
      bestMoveSan: null,
      bestMoveUci: null,
      scoreCp,
      mateIn: chess.isCheckmate() ? 0 : null,
      endgameVerdict: classifyEndgameOutcome(chess, chess.turn(), scoreCp),
    };
  }

  // Beginner strength plays mostly reasonable moves with slight randomness
  if (strength === 'beginner' && moves.length > 1) {
    const scored = moves.map((m) => {
      chess.move(m);
      const s = evaluateBoard(chess);
      chess.undo();
      return { m, s };
    });
    const isWhite = chess.turn() === 'w';
    scored.sort((a, b) => (isWhite ? b.s - a.s : a.s - b.s));
    const pool = scored.slice(0, Math.min(3, scored.length));
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return {
      bestMoveSan: pick.m.san,
      bestMoveUci: `${pick.m.from}${pick.m.to}${pick.m.promotion ?? ''}`,
      scoreCp: pick.s,
      mateIn: null,
      endgameVerdict: classifyEndgameOutcome(chess, chess.turn(), pick.s),
    };
  }

  const effectiveDepth = strength === 'club' ? Math.min(2, depth) : depth;
  const maximizing = chess.turn() === 'w';
  let bestMove = moves[0];
  let bestScore = maximizing ? -Infinity : Infinity;

  for (const move of moves) {
    chess.move(move);
    const val = alphaBeta(chess, effectiveDepth - 1, -Infinity, Infinity, !maximizing);
    chess.undo();
    if (maximizing ? val > bestScore : val < bestScore) {
      bestScore = val;
      bestMove = move;
    }
  }

  const mateIn = Math.abs(bestScore) > 90000 ? Math.max(1, Math.ceil(effectiveDepth / 2)) : null;

  return {
    bestMoveSan: bestMove.san,
    bestMoveUci: `${bestMove.from}${bestMove.to}${bestMove.promotion ?? ''}`,
    scoreCp: bestScore,
    mateIn,
    endgameVerdict: classifyEndgameOutcome(chess, chess.turn(), bestScore),
  };
}
