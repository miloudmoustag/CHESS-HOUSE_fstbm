import { LocalizedText } from '../config/site';
import { TACTICAL_PUZZLES } from '../data/academy/puzzles';
import type { TacticalPuzzle } from '../data/academy/types';

export interface XpRewardsConfig {
  session: number;
  puzzles_5: number;
  tournament: number;
  organize_event: number;
  academy_week: number;
  tournament_win: number;
}

export const DEFAULT_XP_REWARDS: XpRewardsConfig = {
  session: 20,
  puzzles_5: 15,
  tournament: 30,
  organize_event: 40,
  academy_week: 25,
  tournament_win: 50,
};

export type PassportActivityType =
  | 'training_session'
  | 'puzzles_batch'
  | 'tournament_participation'
  | 'event_organization'
  | 'academy_week'
  | 'tournament_win'
  | 'mission_bonus'
  | 'admin_adjustment';

export interface XpTransactionRecord {
  id: string;
  userId: string;
  sourceKey: string;
  activityType: PassportActivityType;
  xpDelta: number;
  description: string;
  status: 'verified' | 'revoked';
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  memberId?: string | null;
  sessionDate: string;
  sessionType: 'monday_training' | 'thursday_play' | 'event_helper' | 'special';
  notes: string;
  createdAt: string;
}

export interface PassportLevel {
  tier: number;
  key: string;
  piece: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  minXp: number;
  nextXp: number | null;
  title: LocalizedText;
}

export const PASSPORT_LEVELS: PassportLevel[] = [
  {
    tier: 1,
    key: 'novice_pawn',
    piece: 'p',
    minXp: 0,
    nextXp: 60,
    title: { fr: 'Pion Initié', en: 'Novice Pawn', ar: 'بيدق مبتدئ' },
  },
  {
    tier: 2,
    key: 'scholar_knight',
    piece: 'n',
    minXp: 60,
    nextXp: 150,
    title: { fr: 'Cavalier d’Étude', en: 'Scholar Knight', ar: 'حصان متعلم' },
  },
  {
    tier: 3,
    key: 'club_bishop',
    piece: 'b',
    minXp: 150,
    nextXp: 300,
    title: { fr: 'Fou du Club', en: 'Club Bishop', ar: 'فيل النادي' },
  },
  {
    tier: 4,
    key: 'castle_rook',
    piece: 'r',
    minXp: 300,
    nextXp: 500,
    title: { fr: 'Tour de la Maison', en: 'Castle Rook', ar: 'قلعة البيت' },
  },
  {
    tier: 5,
    key: 'house_queen',
    piece: 'q',
    minXp: 500,
    nextXp: 800,
    title: { fr: 'Dame de Chess House', en: 'House Queen', ar: 'وزيرة بيت الشطرنج' },
  },
  {
    tier: 6,
    key: 'house_legend',
    piece: 'k',
    minXp: 800,
    nextXp: null,
    title: { fr: 'Roi Souverain', en: 'Grand Sovereign', ar: 'ملك بيت الشطرنج' },
  },
];

export function computePassportLevel(xpTotal: number): PassportLevel & { progressPct: number } {
  const safeXp = Math.max(0, Math.floor(xpTotal));
  let current = PASSPORT_LEVELS[0];
  for (const lvl of PASSPORT_LEVELS) {
    if (safeXp >= lvl.minXp) current = lvl;
  }
  if (current.nextXp === null) {
    return { ...current, progressPct: 100 };
  }
  const span = Math.max(1, current.nextXp - current.minXp);
  const progressPct = Math.min(100, Math.max(0, Math.round(((safeXp - current.minXp) / span) * 100)));
  return { ...current, progressPct };
}

export interface PassportBadgeDef {
  key: string;
  piece: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  title: LocalizedText;
  description: LocalizedText;
  target: number;
  category: 'participation' | 'tactics' | 'competition' | 'community';
}

export const PASSPORT_BADGES: PassportBadgeDef[] = [
  {
    key: 'first_steps',
    piece: 'p',
    title: { fr: 'Premiers Pas', en: 'First Steps', ar: 'الخطوات الأولى' },
    description: {
      fr: 'Participer à votre première séance d’entraînement vérifiée.',
      en: 'Attend your first verified training session.',
      ar: 'حضور أول حصة تدريبية موثقة في النادي.',
    },
    target: 1,
    category: 'participation',
  },
  {
    key: 'tactician',
    piece: 'n',
    title: { fr: 'Tacticien', en: 'Tactician', ar: 'تكتيكي' },
    description: {
      fr: 'Résoudre 50 exercices tactiques dans l’Académie.',
      en: 'Solve 50 tactical puzzles in the Academy.',
      ar: 'حل 50 لغزاً تكتيكياً في الأكاديمية.',
    },
    target: 50,
    category: 'tactics',
  },
  {
    key: 'competitor',
    piece: 'r',
    title: { fr: 'Compétiteur', en: 'Competitor', ar: 'منافس' },
    description: {
      fr: 'Participer à 5 tournois du club ou inter-universitaires.',
      en: 'Participate in 5 club or inter-university tournaments.',
      ar: 'المشاركة في 5 بطولات داخلية أو جامعية.',
    },
    target: 5,
    category: 'competition',
  },
  {
    key: 'champion',
    piece: 'q',
    title: { fr: 'Champion', en: 'Champion', ar: 'بطل' },
    description: {
      fr: 'Remporter un tournoi interne vérifié du club.',
      en: 'Win a verified internal club tournament.',
      ar: 'الفوز ببطولة داخلية موثقة للنادي.',
    },
    target: 1,
    category: 'competition',
  },
  {
    key: 'house_legend',
    piece: 'k',
    title: { fr: 'Légende de la Maison', en: 'House Legend', ar: 'أسطورة البيت' },
    description: {
      fr: 'Atteindre 500 XP saisonniers sur votre Passeport.',
      en: 'Reach the 500 seasonal XP milestone on your Passport.',
      ar: 'بلوغ عتبة 500 نقطة خبرة موسمية في الجواز.',
    },
    target: 500,
    category: 'participation',
  },
  {
    key: 'community_builder',
    piece: 'b',
    title: { fr: 'Bâtisseur de Communauté', en: 'Community Builder', ar: 'باني المجتمع' },
    description: {
      fr: 'Contribuer à l’organisation d’événements ou à l’accueil des nouveaux membres.',
      en: 'Help organize club events or mentor new members.',
      ar: 'المساهمة في تنظيم فعاليات النادي أو تأطير الأعضاء الجدد.',
    },
    target: 1,
    category: 'community',
  },
];

export interface PassportMetrics {
  attendanceCount: number;
  puzzlesSolvedCount: number;
  tournamentsParticipated: number;
  tournamentsWon: number;
  xpTotal: number;
  eventsHelped: number;
  academyWeeksSolid: number;
  dailyPuzzlesCount: number;
  weeklyTrainingDone: boolean;
  weeklyLessonDone: boolean;
}

export interface EvaluatedBadge extends PassportBadgeDef {
  unlocked: boolean;
  progress: number;
  awardedAt: string | null;
}

export function evaluatePassportBadges(
  metrics: PassportMetrics,
  storedAwardDates: Record<string, string> = {}
): EvaluatedBadge[] {
  return PASSPORT_BADGES.map((badge) => {
    let progress = 0;
    if (badge.key === 'first_steps') progress = metrics.attendanceCount;
    else if (badge.key === 'tactician') progress = metrics.puzzlesSolvedCount;
    else if (badge.key === 'competitor') progress = metrics.tournamentsParticipated;
    else if (badge.key === 'champion') progress = metrics.tournamentsWon;
    else if (badge.key === 'house_legend') progress = metrics.xpTotal;
    else if (badge.key === 'community_builder') progress = metrics.eventsHelped;

    const unlocked = progress >= badge.target || Boolean(storedAwardDates[badge.key]);
    return {
      ...badge,
      progress: Math.min(badge.target, progress),
      unlocked,
      awardedAt: storedAwardDates[badge.key] ?? null,
    };
  });
}

export type MissionCadence = 'daily' | 'weekly' | 'seasonal';

export interface MissionDef {
  key: string;
  cadence: MissionCadence;
  title: LocalizedText;
  description: LocalizedText;
  target: number;
  rewardKey: keyof XpRewardsConfig | 'mission_small' | 'mission_medium';
}

export const PASSPORT_MISSIONS: MissionDef[] = [
  {
    key: 'daily_solve_5_puzzles',
    cadence: 'daily',
    title: { fr: 'Résoudre 5 exercices tactiques', en: 'Solve 5 chess puzzles', ar: 'حل 5 ألغاز شطرنج' },
    description: {
      fr: 'Complétez 5 problèmes validés dans l’Académie ou le Défi du jour.',
      en: 'Complete 5 verified tactical puzzles in the Academy or Daily Challenge.',
      ar: 'أكمل 5 ألغاز تكتيكية موثقة في الأكاديمية أو تحدي اليوم.',
    },
    target: 5,
    rewardKey: 'puzzles_5',
  },
  {
    key: 'daily_complete_lesson',
    cadence: 'daily',
    title: { fr: 'Terminer une leçon de l’Académie', en: 'Complete one Academy lesson', ar: 'إتمام درس واحد في الأكاديمية' },
    description: {
      fr: 'Validez une semaine ou une diapositive clé du programme à rebours.',
      en: 'Study and solve exercises in the backwards Academy curriculum.',
      ar: 'ادرس وأجب عن تمارين في منهج الأكاديمية العكسي.',
    },
    target: 1,
    rewardKey: 'mission_small',
  },
  {
    key: 'weekly_attend_training',
    cadence: 'weekly',
    title: { fr: 'Assister à une séance hebdomadaire', en: 'Attend one training session', ar: 'حضور حصة تدريبية واحدة' },
    description: {
      fr: 'Présence vérifiée le lundi (formation) ou le jeudi (jeu libre) avec le bureau.',
      en: 'Verified attendance on Monday training or Thursday open play.',
      ar: 'حضور موثق في حصة الإثنين أو الخميس لدى المكتب.',
    },
    target: 1,
    rewardKey: 'session',
  },
  {
    key: 'weekly_help_new_member',
    cadence: 'weekly',
    title: { fr: 'Aider à l’accueil ou l’organisation', en: 'Help a new member or event', ar: 'مساعدة عضو جديد أو دعم التنظيم' },
    description: {
      fr: 'Parrainer un étudiant débutant ou aider à préparer un événement du club (validé par le bureau).',
      en: 'Mentor a beginner or assist club logistics (verified by the board).',
      ar: 'مرافقة طالب مبتدئ أو المساعدة في تنظيم أنشطة النادي (بتوثيق المكتب).',
    },
    target: 1,
    rewardKey: 'organize_event',
  },
  {
    key: 'seasonal_tournament_play',
    cadence: 'seasonal',
    title: { fr: 'Participer à un tournoi du club', en: 'Participate in a tournament', ar: 'المشاركة في بطولة النادي' },
    description: {
      fr: 'Disputer un tournoi officiel Chess House ou inter-universitaire cette saison.',
      en: 'Play in an official Chess House or inter-university tournament this season.',
      ar: 'خوض بطولة رسمية للنادي أو بين الجامعات هذا الموسم.',
    },
    target: 1,
    rewardKey: 'tournament',
  },
  {
    key: 'seasonal_academy_track',
    cadence: 'seasonal',
    title: { fr: 'Valider 3 semaines de l’Académie', en: 'Complete 3 Academy weeks', ar: 'إتمام 3 أسابيع من الأكاديمية' },
    description: {
      fr: 'Atteindre le niveau Solide ou Maîtrisé sur 3 semaines (Endgames track).',
      en: 'Reach Solid or Mastered status across 3 Academy curriculum weeks.',
      ar: 'الوصول إلى مستوى متقن في 3 أسابيع من منهج النهايات.',
    },
    target: 3,
    rewardKey: 'academy_week',
  },
];

export function getPeriodKeys(now: Date = new Date()): Record<MissionCadence, string> {
  const daily = now.toISOString().slice(0, 10);
  // Compute ISO week key YYYY-Wxx
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const weekly = `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  return {
    daily,
    weekly,
    seasonal: '2026-S1',
  };
}

export interface EvaluatedMission extends MissionDef {
  periodKey: string;
  progress: number;
  xpReward: number;
  claimed: boolean;
  canClaim: boolean;
}

export function evaluateMissions(
  metrics: PassportMetrics,
  claimedPairs: Set<string>,
  rewards: XpRewardsConfig = DEFAULT_XP_REWARDS,
  now: Date = new Date()
): EvaluatedMission[] {
  const periods = getPeriodKeys(now);
  return PASSPORT_MISSIONS.map((m) => {
    const periodKey = periods[m.cadence];
    let progress = 0;
    if (m.key === 'daily_solve_5_puzzles') progress = metrics.dailyPuzzlesCount;
    else if (m.key === 'daily_complete_lesson') progress = metrics.weeklyLessonDone ? 1 : 0;
    else if (m.key === 'weekly_attend_training') progress = metrics.weeklyTrainingDone ? 1 : 0;
    else if (m.key === 'weekly_help_new_member') progress = metrics.eventsHelped > 0 ? 1 : 0;
    else if (m.key === 'seasonal_tournament_play') progress = metrics.tournamentsParticipated;
    else if (m.key === 'seasonal_academy_track') progress = metrics.academyWeeksSolid;

    const xpReward =
      m.rewardKey === 'mission_small'
        ? 10
        : m.rewardKey === 'mission_medium'
        ? 20
        : rewards[m.rewardKey] ?? 15;

    const claimed = claimedPairs.has(`${m.key}:${periodKey}`);
    const cappedProgress = Math.min(m.target, progress);
    return {
      ...m,
      periodKey,
      progress: cappedProgress,
      xpReward,
      claimed,
      canClaim: !claimed && cappedProgress >= m.target,
    };
  });
}

export function getDailyChallengePuzzle(dateIso: string = new Date().toISOString().slice(0, 10)): TacticalPuzzle {
  let hash = 0;
  for (let i = 0; i < dateIso.length; i++) {
    hash = (hash * 31 + dateIso.charCodeAt(i)) >>> 0;
  }
  const idx = hash % TACTICAL_PUZZLES.length;
  return TACTICAL_PUZZLES[idx];
}
