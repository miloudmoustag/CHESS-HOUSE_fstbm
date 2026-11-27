export interface SrsCard {
  id: string;
  fen: string;
  solutionSan: string;
  prompt: string;
  category: string;
  source: 'quiz' | 'drill' | 'mistake' | 'puzzle';
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  dueDate: string; // ISO date YYYY-MM-DD
  lastReviewed?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function addDaysIso(baseDate: Date, days: number): string {
  const d = new Date(baseDate.getTime() + days * DAY_MS);
  return d.toISOString().slice(0, 10);
}

/**
 * SM-2-inspired scheduler tuned to 1, 3, 7, 21+ day review cadence:
 * quality: 0-2 = fail (reset to 1 day), 3 = hard, 4 = good, 5 = easy.
 */
export function scheduleSrsCard(card: SrsCard, quality: 0 | 1 | 2 | 3 | 4 | 5, now = new Date()): SrsCard {
  let { intervalDays, easeFactor, repetitions } = card;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 3;
    } else if (repetitions === 2) {
      intervalDays = 7;
    } else if (repetitions === 3) {
      intervalDays = 21;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    repetitions += 1;
  }

  easeFactor = Math.max(1.3, Number((easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))).toFixed(2)));

  return {
    ...card,
    intervalDays,
    easeFactor,
    repetitions,
    dueDate: addDaysIso(now, intervalDays),
    lastReviewed: now.toISOString(),
  };
}

export function createSrsCard(params: {
  id: string;
  fen: string;
  solutionSan: string;
  prompt: string;
  category: string;
  source: SrsCard['source'];
  now?: Date;
}): SrsCard {
  const now = params.now ?? new Date();
  return {
    id: params.id,
    fen: params.fen,
    solutionSan: params.solutionSan,
    prompt: params.prompt,
    category: params.category,
    source: params.source,
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
    dueDate: addDaysIso(now, 1),
  };
}

export function isCardDue(card: SrsCard, today = new Date().toISOString().slice(0, 10)): boolean {
  return card.dueDate <= today;
}
