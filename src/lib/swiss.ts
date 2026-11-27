export type GameResult = '1-0' | '0-1' | '1/2-1/2' | 'bye' | 'forfeit-white' | 'forfeit-black' | 'pending';

export interface SwissPlayer {
  id: string;
  name: string;
  category: 'open' | 'women';
  rating?: number;
  seedOrder?: number;
}

export interface SwissGameRecord {
  roundNumber: number;
  board: number;
  whiteId: string;
  blackId: string | null; // null indicates a BYE
  result: GameResult;
}

export interface SwissStanding {
  playerId: string;
  name: string;
  category: 'open' | 'women';
  points: number;
  wins: number;
  draws: number;
  losses: number;
  buchholz: number;
  sonnebornBerger: number;
  opponents: string[];
  hadBye: boolean;
  colorHistory: ('W' | 'B')[];
  rank: number;
}

export interface ProposedPairing {
  board: number;
  whiteId: string;
  blackId: string | null; // null = BYE
}

function playerPointsFromGame(g: SwissGameRecord, playerId: string): number {
  if (g.result === 'pending') return 0;
  if (g.whiteId === playerId) {
    if (g.result === 'bye' || g.result === '1-0' || g.result === 'forfeit-black') return 1;
    if (g.result === '1/2-1/2') return 0.5;
    return 0;
  }
  if (g.blackId === playerId) {
    if (g.result === '0-1' || g.result === 'forfeit-white') return 1;
    if (g.result === '1/2-1/2') return 0.5;
    return 0;
  }
  return 0;
}

export function computeStandings(
  players: SwissPlayer[],
  games: SwissGameRecord[],
  category?: 'open' | 'women'
): SwissStanding[] {
  const filteredPlayers = category ? players.filter((p) => p.category === category) : players;
  const playerSet = new Set(filteredPlayers.map((p) => p.id));

  const map = new Map<string, SwissStanding>();
  for (const p of filteredPlayers) {
    map.set(p.id, {
      playerId: p.id,
      name: p.name,
      category: p.category,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      buchholz: 0,
      sonnebornBerger: 0,
      opponents: [],
      hadBye: false,
      colorHistory: [],
      rank: 0,
    });
  }

  for (const g of games) {
    if (!playerSet.has(g.whiteId)) continue;
    if (g.blackId && !playerSet.has(g.blackId)) continue;

    const w = map.get(g.whiteId)!;
    if (!g.blackId || g.result === 'bye') {
      if (g.result === 'bye') {
        w.points += 1;
        w.wins += 1;
        w.hadBye = true;
      }
      continue;
    }

    const b = map.get(g.blackId)!;
    w.opponents.push(g.blackId);
    b.opponents.push(g.whiteId);
    w.colorHistory.push('W');
    b.colorHistory.push('B');

    if (g.result === '1-0' || g.result === 'forfeit-black') {
      w.points += 1;
      w.wins += 1;
      b.losses += 1;
    } else if (g.result === '0-1' || g.result === 'forfeit-white') {
      b.points += 1;
      b.wins += 1;
      w.losses += 1;
    } else if (g.result === '1/2-1/2') {
      w.points += 0.5;
      b.points += 0.5;
      w.draws += 1;
      b.draws += 1;
    }
  }

  // Buchholz & Sonneborn-Berger
  for (const s of map.values()) {
    let bh = 0;
    let sb = 0;
    for (const g of games) {
      if (g.result === 'pending' || !g.blackId || g.result === 'bye') continue;
      if (g.whiteId === s.playerId) {
        const opp = map.get(g.blackId);
        if (!opp) continue;
        bh += opp.points;
        const myScore = playerPointsFromGame(g, s.playerId);
        sb += myScore * opp.points;
      } else if (g.blackId === s.playerId) {
        const opp = map.get(g.whiteId);
        if (!opp) continue;
        bh += opp.points;
        const myScore = playerPointsFromGame(g, s.playerId);
        sb += myScore * opp.points;
      }
    }
    s.buchholz = Number(bh.toFixed(2));
    s.sonnebornBerger = Number(sb.toFixed(2));
  }

  const sorted = Array.from(map.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
    if (b.sonnebornBerger !== a.sonnebornBerger) return b.sonnebornBerger - a.sonnebornBerger;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.name.localeCompare(b.name);
  });

  sorted.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return sorted;
}

function colorBalance(history: ('W' | 'B')[]): number {
  let balance = 0;
  for (const c of history) balance += c === 'W' ? 1 : -1;
  return balance;
}

function chooseColors(a: SwissStanding, b: SwissStanding): [string, string] {
  const balA = colorBalance(a.colorHistory);
  const balB = colorBalance(b.colorHistory);
  const lastA = a.colorHistory[a.colorHistory.length - 1];
  const lastB = b.colorHistory[b.colorHistory.length - 1];

  // Prefer giving White to the player with lower White balance
  if (balA < balB) return [a.playerId, b.playerId];
  if (balB < balA) return [b.playerId, a.playerId];

  // Alternate from previous round if balances are equal
  if (lastA === 'B' && lastB !== 'B') return [a.playerId, b.playerId];
  if (lastB === 'B' && lastA !== 'B') return [b.playerId, a.playerId];

  // Default: higher-ranked player gets White on odd rounds, Black on even
  return a.colorHistory.length % 2 === 0 ? [a.playerId, b.playerId] : [b.playerId, a.playerId];
}

/**
 * Generates Swiss pairings for the next round:
 * - No repeat opponents when avoidable (backtracking within score brackets / across pool)
 * - Fair colour alternation & balance
 * - Lowest-ranked player who hasn't had a bye gets the bye when odd
 */
export function generateSwissPairings(
  players: SwissPlayer[],
  previousGames: SwissGameRecord[],
  category?: 'open' | 'women'
): ProposedPairing[] {
  const standings = computeStandings(players, previousGames, category);
  if (standings.length === 0) return [];

  // Re-sort by points, then rating/seed for initial round 1 fairness
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const ordered = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const ra = playerMap.get(a.playerId)?.rating ?? 1200;
    const rb = playerMap.get(b.playerId)?.rating ?? 1200;
    if (rb !== ra) return rb - ra;
    return (playerMap.get(a.playerId)?.seedOrder ?? 999) - (playerMap.get(b.playerId)?.seedOrder ?? 999);
  });

  const playedSet = new Set<string>();
  for (const s of ordered) {
    for (const opp of s.opponents) {
      playedSet.add(`${s.playerId}::${opp}`);
    }
  }

  let byePlayer: SwissStanding | null = null;
  let pool = [...ordered];

  if (pool.length % 2 === 1) {
    // Pick lowest-ranked player who hasn't had a bye yet
    for (let i = pool.length - 1; i >= 0; i--) {
      if (!pool[i].hadBye) {
        byePlayer = pool[i];
        pool.splice(i, 1);
        break;
      }
    }
    if (!byePlayer) {
      byePlayer = pool.pop()!;
    }
  }

  // Recursive backtracking solver trying to avoid repeat pairings while keeping score groups close
  function solve(remaining: SwissStanding[], allowRematch: boolean): [SwissStanding, SwissStanding][] | null {
    if (remaining.length === 0) return [];
    const first = remaining[0];
    const rest = remaining.slice(1);

    // Split rest into same-score candidates first (Dutch-style top half vs bottom half)
    const sameScore = rest.filter((p) => p.points === first.points);
    const otherScore = rest.filter((p) => p.points !== first.points);

    const mid = Math.floor(sameScore.length / 2);
    const orderedCandidates = [
      ...sameScore.slice(mid),
      ...sameScore.slice(0, mid),
      ...otherScore,
    ];

    // Sort preferring non-rematches and opposite color preference
    const firstBal = colorBalance(first.colorHistory);
    orderedCandidates.sort((a, b) => {
      const aRepeat = playedSet.has(`${first.playerId}::${a.playerId}`) ? 1 : 0;
      const bRepeat = playedSet.has(`${first.playerId}::${b.playerId}`) ? 1 : 0;
      if (aRepeat !== bRepeat) return aRepeat - bRepeat;
      const aScoreDiff = Math.abs(first.points - a.points);
      const bScoreDiff = Math.abs(first.points - b.points);
      if (aScoreDiff !== bScoreDiff) return aScoreDiff - bScoreDiff;
      const aColorFit = Math.abs(firstBal + colorBalance(a.colorHistory));
      const bColorFit = Math.abs(firstBal + colorBalance(b.colorHistory));
      return aColorFit - bColorFit;
    });

    for (const candidate of orderedCandidates) {
      const isRepeat = playedSet.has(`${first.playerId}::${candidate.playerId}`);
      if (isRepeat && !allowRematch) continue;

      const nextRest = rest.filter((p) => p.playerId !== candidate.playerId);
      const sub = solve(nextRest, allowRematch);
      if (sub !== null) {
        return [[first, candidate], ...sub];
      }
    }
    return null;
  }

  let pairs = solve(pool, false);
  if (!pairs) {
    pairs = solve(pool, true) ?? [];
  }

  const pairings: ProposedPairing[] = pairs.map(([a, b], idx) => {
    const [whiteId, blackId] = chooseColors(a, b);
    return {
      board: idx + 1,
      whiteId,
      blackId,
    };
  });

  if (byePlayer) {
    pairings.push({
      board: pairings.length + 1,
      whiteId: byePlayer.playerId,
      blackId: null,
    });
  }

  return pairings;
}
