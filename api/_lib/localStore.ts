import { CLUB_EVENTS, ClubEventItem, INITIAL_LEAGUE_CLUBS, LeagueClubRow } from '../../src/data/clubContent';
import { normalizeId, normalizeName, trigramSimilarity } from '../../src/lib/normalize';
import {
  AttendanceRecord,
  DEFAULT_XP_REWARDS,
  PassportActivityType,
  XpRewardsConfig,
  XpTransactionRecord,
} from '../../src/lib/passport';
import { computeStandings, GameResult, generateSwissPairings, SwissGameRecord, SwissPlayer } from '../../src/lib/swiss';
import { isFstFaculty } from '../../src/lib/tournamentEligibility';

export interface LocalMember {
  id: string;
  full_name: string;
  name_key: string;
  identifier: string;
  email: string;
  phone: string;
  department: string;
  status: 'active' | 'pending' | 'alumni';
  fees_paid: boolean;
  season: string;
  faculty?: string;
  chessElo?: number | null;
  preferredPiece?: string;
  created_at: string;
}

export interface LocalTournament {
  id: string;
  slug: string;
  type: 'in_person' | 'online_interuni';
  name: { fr: string; en: string; ar: string };
  event_date: string;
  venue: { fr: string; en: string; ar: string };
  capacity: number;
  deadline: string;
  is_open: boolean;
  rounds: number;
  time_control: string;
  categories: ('open' | 'women')[];
  fee: number | null;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface LocalRegistration {
  id: string;
  tournament_id: string;
  member_id: string | null;
  full_name: string;
  name_key: string;
  identifier: string;
  contact: string;
  category: 'open' | 'women';
  status: 'confirmed' | 'member_unpaid' | 'pending_not_member' | 'cancelled';
  consent: boolean;
  created_at: string;
}

export interface LocalTournamentPlayer {
  id: string;
  tournament_id: string;
  registration_id: string | null;
  user_id: string | null;
  member_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  identifier: string;
  faculty: string;
  category: 'open' | 'women';
  chess_elo: number | null;
  preferred_piece: string;
  created_at: string;
}

export interface LocalRound {
  id: string;
  tournament_id: string;
  round_number: number;
  category: 'open' | 'women';
  is_published: boolean;
}

export interface LocalGame {
  id: string;
  round_id: string;
  tournament_id: string;
  round_number: number;
  category: 'open' | 'women';
  board: number;
  white_registration_id: string;
  black_registration_id: string | null;
  result: GameResult;
}

export interface LocalMembershipApplication {
  id: string;
  full_name: string;
  name_key: string;
  identifier: string;
  email: string;
  phone?: string;
  department: string;
  faculty?: string;
  level: string;
  chessElo?: number | null;
  preferredPiece?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface LocalEnquiry {
  id: string;
  type: 'partner' | 'interuni_club';
  organisation: string;
  contact_name: string;
  email: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface LocalContactMessage {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

export interface LocalProfileMeta {
  userId: string;
  email: string;
  displayName: string;
  phone?: string;
  faculty?: string;
  chessElo?: number | null;
  preferredPiece?: string;
  language: 'fr' | 'en' | 'ar';
  showOnLeaderboard: boolean;
  bio: string;
  favoriteOpening: string;
  rating: number;
  academyWeeksSolid: number[];
  puzzlesSolvedCount: number;
  dailyPuzzlesDate: string;
  dailyPuzzlesCount: number;
  lessonDoneDate: string;
}

export interface LocalMissionClaim {
  id: string;
  userId: string;
  missionKey: string;
  periodKey: string;
  xpAwarded: number;
  claimedAt: string;
}

export interface LocalNotification {
  id: string;
  userId: string;
  title: { fr: string; en: string; ar: string };
  body: { fr: string; en: string; ar: string };
  type: 'xp' | 'badge' | 'tournament' | 'membership' | 'info';
  isRead: boolean;
  createdAt: string;
}

const initialMembers: LocalMember[] = [
  {
    id: 'm-1',
    full_name: 'Miloud Moustage',
    name_key: normalizeName('Miloud Moustage'),
    identifier: 'CNE2025001',
    email: 'miloudmoustage@gmail.com',
    phone: '0634262883',
    department: 'Génie Informatique',
    faculty: 'FST — Génie Informatique',
    status: 'active',
    fees_paid: true,
    season: '2026/27',
    created_at: '2025-10-18T12:00:00Z',
  },
  {
    id: 'm-2',
    full_name: 'Douae Bouuda',
    name_key: normalizeName('Douae Bouuda'),
    identifier: 'CNE2025002',
    email: 'douae.example@usms.ac.ma',
    phone: '0600000002',
    department: 'Biologie & Chimie',
    faculty: 'FST — Biologie & Chimie',
    status: 'active',
    fees_paid: true,
    season: '2026/27',
    created_at: '2025-10-18T12:00:00Z',
  },
  {
    id: 'm-3',
    full_name: 'Ayoub Elataoui',
    name_key: normalizeName('Ayoub Elataoui'),
    identifier: 'CNE2025003',
    email: 'ayoub.example@usms.ac.ma',
    phone: '0600000003',
    department: 'Mathématiques Appliquées',
    faculty: 'FST — Mathématiques Appliquées',
    status: 'active',
    fees_paid: true,
    season: '2026/27',
    created_at: '2025-10-18T12:00:00Z',
  },
  {
    id: 'm-4',
    full_name: 'Khalid Elmouhi',
    name_key: normalizeName('Khalid Elmouhi'),
    identifier: 'CNE2025004',
    email: 'khalid.example@usms.ac.ma',
    phone: '0600000004',
    department: 'Physique',
    faculty: 'FST — Physique',
    status: 'active',
    fees_paid: true,
    season: '2026/27',
    created_at: '2025-10-18T12:00:00Z',
  },
  {
    id: 'm-5',
    full_name: 'Salma Benali',
    name_key: normalizeName('Salma Benali'),
    identifier: 'CNE2025005',
    email: 'salma.example@usms.ac.ma',
    phone: '0600000005',
    department: 'MIP',
    faculty: 'FST — MIP',
    status: 'active',
    fees_paid: false,
    season: '2026/27',
    created_at: '2025-10-18T12:00:00Z',
  },
  {
    id: 'm-6',
    full_name: 'Yassine Amrani',
    name_key: normalizeName('Yassine Amrani'),
    identifier: 'CNE2025006',
    email: 'yassine.example@usms.ac.ma',
    phone: '0600000006',
    department: 'Génie Logiciel',
    faculty: 'ENSA — Génie Logiciel',
    status: 'active',
    fees_paid: true,
    season: '2026/27',
    created_at: '2025-10-18T12:00:00Z',
  },
];

const seededTournament: LocalTournament = {
  id: 't-nov-2026',
  slug: 'internal-rapid-nov-2026',
  type: 'in_person',
  name: {
    fr: 'Tournoi Interne — Novembre 2026',
    en: 'Internal Tournament — November 2026',
    ar: 'البطولة الداخلية — نونبر 2026',
  },
  event_date: '2026-11-30T12:00:00+01:00',
  venue: {
    fr: 'Cour du Bloc A, FST Béni Mellal',
    en: 'Block A Courtyard, FST Béni Mellal',
    ar: 'ساحة البلوك A، كلية العلوم والتقنيات ببني ملال',
  },
  capacity: 20,
  deadline: '2026-11-29T18:00:00+01:00',
  is_open: true,
  rounds: 9,
  time_control: '5+2',
  categories: ['open', 'women'],
  fee: null,
  status: 'upcoming',
};

export const localStore = {
  members: [...initialMembers],
  tournaments: [seededTournament],
  events: [...CLUB_EVENTS] as ClubEventItem[],
  clubs: [...INITIAL_LEAGUE_CLUBS] as LeagueClubRow[],
  registrations: [
    {
      id: 'reg-seed-1',
      tournament_id: 't-nov-2026',
      member_id: 'm-1',
      full_name: 'Miloud Moustage',
      name_key: normalizeName('Miloud Moustage'),
      identifier: 'CNE2025001',
      contact: 'miloudmoustage@gmail.com',
      category: 'open',
      status: 'confirmed',
      consent: true,
      created_at: '2026-11-16T10:00:00Z',
    },
    {
      id: 'reg-seed-2',
      tournament_id: 't-nov-2026',
      member_id: 'm-2',
      full_name: 'Douae Bouuda',
      name_key: normalizeName('Douae Bouuda'),
      identifier: 'CNE2025002',
      contact: 'douae.example@usms.ac.ma',
      category: 'women',
      status: 'confirmed',
      consent: true,
      created_at: '2026-11-16T10:05:00Z',
    },
  ] as LocalRegistration[],
  tournamentPlayers: [
    {
      id: 'tp-seed-1',
      tournament_id: 't-nov-2026',
      registration_id: 'reg-seed-1',
      user_id: 'preview-miloudmoustage@gmail.com',
      member_id: 'm-1',
      full_name: 'Miloud Moustage',
      email: 'miloudmoustage@gmail.com',
      phone: '0634262883',
      identifier: 'CNE2025001',
      faculty: 'FST — Génie Informatique',
      category: 'open',
      chess_elo: 1280,
      preferred_piece: 'k',
      created_at: '2026-11-16T10:00:00Z',
    },
    {
      id: 'tp-seed-2',
      tournament_id: 't-nov-2026',
      registration_id: 'reg-seed-2',
      user_id: 'preview-douae.example@usms.ac.ma',
      member_id: 'm-2',
      full_name: 'Douae Bouuda',
      email: 'douae.example@usms.ac.ma',
      phone: '0600000002',
      identifier: 'CNE2025002',
      faculty: 'FST — Biologie & Chimie',
      category: 'women',
      chess_elo: null,
      preferred_piece: 'q',
      created_at: '2026-11-16T10:05:00Z',
    },
  ] as LocalTournamentPlayer[],
  rounds: [] as LocalRound[],
  games: [] as LocalGame[],
  membershipApplications: [] as LocalMembershipApplication[],
  applications: [] as LocalEnquiry[],
  contactMessages: [] as LocalContactMessage[],
  coachUsage: new Map<string, number>(),
  xpTransactions: [
    {
      id: 'xp-demo-1',
      userId: 'preview-board@chesshouse.ma',
      sourceKey: 'session:2026-11-23:monday_training',
      activityType: 'training_session',
      xpDelta: 20,
      description: 'Monday Beginner Training — Bloc A',
      status: 'verified',
      createdAt: '2026-11-23T14:00:00Z',
    },
    {
      id: 'xp-demo-2',
      userId: 'preview-board@chesshouse.ma',
      sourceKey: 'event_helper:ev-cinema-oct-2026',
      activityType: 'event_organization',
      xpDelta: 40,
      description: 'Chess Cinema event organization',
      status: 'verified',
      createdAt: '2026-10-30T20:00:00Z',
    },
    {
      id: 'xp-demo-3',
      userId: 'preview-student@fstbm.ma',
      sourceKey: 'session:2026-11-23:monday_training',
      activityType: 'training_session',
      xpDelta: 20,
      description: 'Monday Beginner Training — Bloc A',
      status: 'verified',
      createdAt: '2026-11-23T14:00:00Z',
    },
  ] as XpTransactionRecord[],
  attendanceRecords: [
    {
      id: 'att-demo-1',
      userId: 'preview-board@chesshouse.ma',
      memberId: 'm-1',
      sessionDate: '2026-11-23',
      sessionType: 'monday_training',
      notes: 'Week 1 Backwards Curriculum',
      createdAt: '2026-11-23T14:00:00Z',
    },
    {
      id: 'att-demo-2',
      userId: 'preview-board@chesshouse.ma',
      memberId: 'm-1',
      sessionDate: '2026-10-30',
      sessionType: 'event_helper',
      notes: 'Chess Cinema Halloween',
      createdAt: '2026-10-30T20:00:00Z',
    },
    {
      id: 'att-demo-3',
      userId: 'preview-student@fstbm.ma',
      memberId: null,
      sessionDate: '2026-11-23',
      sessionType: 'monday_training',
      notes: 'Week 1 Backwards Curriculum',
      createdAt: '2026-11-23T14:00:00Z',
    },
  ] as AttendanceRecord[],
  missionClaims: [] as LocalMissionClaim[],
  badgesByUser: new Map<string, Record<string, string>>(),
  notifications: [
    {
      id: 'notif-demo-1',
      userId: 'preview-student@fstbm.ma',
      title: {
        fr: 'Bienvenue dans Mon Espace Chess House',
        en: 'Welcome to My Chess House',
        ar: 'مرحباً بك في فضاء بيت الشطرنج',
      },
      body: {
        fr: 'Votre Passeport est actif. Complétez vos missions quotidiennes ou participez à la séance du lundi pour gagner des XP.',
        en: 'Your Passport is active. Complete daily missions or attend Monday training to earn verified House XP.',
        ar: 'جوازك نشط الآن. أكمل المهام اليومية أو احضر حصة الإثنين لكسب نقاط الخبرة.',
      },
      type: 'info',
      isRead: false,
      createdAt: '2026-11-25T10:00:00Z',
    },
  ] as LocalNotification[],
  profileMeta: new Map<string, LocalProfileMeta>([
    [
      'preview-board@chesshouse.ma',
      {
        userId: 'preview-board@chesshouse.ma',
        email: 'board@chesshouse.ma',
        displayName: 'Miloud Moustage',
        language: 'fr',
        showOnLeaderboard: true,
        bio: 'President of Chess House Club — FST Béni Mellal.',
        favoriteOpening: 'Ruy Lopez / King & Pawn Endgames',
        rating: 1280,
        academyWeeksSolid: [1, 2, 3],
        puzzlesSolvedCount: 15,
        dailyPuzzlesDate: '',
        dailyPuzzlesCount: 0,
        lessonDoneDate: '',
      },
    ],
    [
      'preview-student@fstbm.ma',
      {
        userId: 'preview-student@fstbm.ma',
        email: 'student@fstbm.ma',
        displayName: 'FST Student',
        language: 'fr',
        showOnLeaderboard: true,
        bio: 'Learning backwards from Week 1 endgames.',
        favoriteOpening: 'Italian Game',
        rating: 940,
        academyWeeksSolid: [1],
        puzzlesSolvedCount: 5,
        dailyPuzzlesDate: '',
        dailyPuzzlesCount: 0,
        lessonDoneDate: '',
      },
    ],
  ]),
  settings: {
    clubsReached: 24,
    iuccUniversities: 22,
    iuccStudents: 220,
    weeklySessions: 2,
    mondayAssignmentWeek: 1,
    mondayAssignmentNote: {
      fr: 'Semaine 1 : Mats élémentaires & Activité du Roi',
      en: 'Week 1: Basic Checkmates & King Activity',
      ar: 'الأسبوع 1: الكش مات الأساسي ونشاط الملك',
    },
    showPersonalContact: false,
    entryFee: null as number | null,
    announcementBanner: { enabled: false, text: { fr: '', en: '', ar: '' } },
    xpRewards: { ...DEFAULT_XP_REWARDS } as XpRewardsConfig,
  },
};

export function ensureLocalProfile(userId: string, email: string, displayName?: string): LocalProfileMeta {
  const existing = localStore.profileMeta.get(userId);
  if (existing) return existing;
  const matchedMember = email
    ? localStore.members.find((m) => m.email && m.email.toLowerCase() === email.toLowerCase())
    : undefined;
  const created: LocalProfileMeta = {
    userId,
    email,
    displayName: matchedMember?.full_name || displayName || email.split('@')[0] || 'Member',
    phone: matchedMember?.phone || '',
    faculty: matchedMember?.faculty || '',
    chessElo: matchedMember?.chessElo ?? null,
    preferredPiece: matchedMember?.preferredPiece || 'p',
    language: 'fr',
    showOnLeaderboard: Boolean(matchedMember),
    bio: matchedMember ? `${matchedMember.department} — ${matchedMember.faculty || 'FST Béni Mellal'}` : '',
    favoriteOpening: '',
    rating: matchedMember?.chessElo && matchedMember.chessElo >= 400 ? matchedMember.chessElo : 900,
    academyWeeksSolid: [],
    puzzlesSolvedCount: 0,
    dailyPuzzlesDate: '',
    dailyPuzzlesCount: 0,
    lessonDoneDate: '',
  };
  localStore.profileMeta.set(userId, created);
  return created;
}

export function localAwardXpIdempotent(params: {
  userId: string;
  sourceKey: string;
  activityType: PassportActivityType;
  xpDelta: number;
  description: string;
}): { awarded: boolean; record?: XpTransactionRecord } {
  const exists = localStore.xpTransactions.find(
    (x) => x.userId === params.userId && x.sourceKey === params.sourceKey && x.status === 'verified'
  );
  if (exists) return { awarded: false };
  const record: XpTransactionRecord = {
    id: `xp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: params.userId,
    sourceKey: params.sourceKey,
    activityType: params.activityType,
    xpDelta: params.xpDelta,
    description: params.description,
    status: 'verified',
    createdAt: new Date().toISOString(),
  };
  localStore.xpTransactions.unshift(record);
  return { awarded: true, record };
}

export function localRegisterPlayer(params: {
  tournamentId: string;
  fullName: string;
  identifier: string;
  contact: string;
  category: 'open' | 'women';
  consent: boolean;
}) {
  const nameKey = normalizeName(params.fullName);
  const idNorm = normalizeId(params.identifier);

  if (!params.consent || nameKey.length < 3 || (params.category !== 'open' && params.category !== 'women')) {
    return { status: 'invalid' as const };
  }

  const tournament = localStore.tournaments.find((t) => t.id === params.tournamentId || t.slug === params.tournamentId);
  if (!tournament) return { status: 'invalid' as const };

  if (
    !tournament.is_open ||
    tournament.status === 'completed' ||
    tournament.status === 'cancelled' ||
    Date.now() > Date.parse(tournament.deadline)
  ) {
    return { status: 'closed' as const };
  }

  const existing = localStore.registrations.find(
    (r) => r.tournament_id === tournament.id && r.name_key === nameKey && r.status !== 'cancelled'
  );
  if (existing) {
    return { status: 'already_registered' as const, registration_id: existing.id };
  }

  const reservedCount = localStore.registrations.filter(
    (r) => r.tournament_id === tournament.id && (r.status === 'confirmed' || r.status === 'member_unpaid')
  ).length;

  if (reservedCount >= tournament.capacity) {
    return { status: 'full' as const };
  }

  let matchedMember: LocalMember | null = null;
  let bestScore = 0;
  for (const m of localStore.members) {
    if (m.status !== 'active') continue;
    const sim = m.name_key === nameKey ? 1 : trigramSimilarity(m.full_name, params.fullName);
    if (sim >= 0.6 && sim > bestScore) {
      bestScore = sim;
      matchedMember = m;
    }
  }

  if (matchedMember && matchedMember.identifier.trim().length > 0) {
    if (normalizeId(matchedMember.identifier) !== idNorm) {
      matchedMember = null;
    }
  }

  const status: LocalRegistration['status'] = matchedMember
    ? matchedMember.fees_paid
      ? 'confirmed'
      : 'member_unpaid'
    : 'pending_not_member';

  const reg: LocalRegistration = {
    id: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    tournament_id: tournament.id,
    member_id: matchedMember?.id ?? null,
    full_name: params.fullName.trim(),
    name_key: nameKey,
    identifier: params.identifier.trim(),
    contact: params.contact.trim(),
    category: params.category,
    status,
    consent: params.consent,
    created_at: new Date().toISOString(),
  };

  localStore.registrations.push(reg);

  const newReserved = reservedCount + (status === 'confirmed' || status === 'member_unpaid' ? 1 : 0);
  return {
    status,
    registration_id: reg.id,
    seats_left: Math.max(0, tournament.capacity - newReserved),
  };
}

export function localRegisterAuthenticatedPlayer(params: {
  userId: string;
  email: string;
  tournamentId: string;
  category: 'open' | 'women';
  facultyInput?: string;
}) {
  const tournament = localStore.tournaments.find((t) => t.id === params.tournamentId || t.slug === params.tournamentId);
  if (!tournament) return { status: 'invalid' as const };

  if (
    !tournament.is_open ||
    tournament.status === 'completed' ||
    tournament.status === 'cancelled' ||
    Date.now() > Date.parse(tournament.deadline)
  ) {
    return { status: 'closed' as const };
  }

  const profile = ensureLocalProfile(params.userId, params.email);
  const emailLower = (params.email || profile.email || '').toLowerCase();
  const matchedMember =
    localStore.members.find(
      (m) => m.status === 'active' && m.email && emailLower && m.email.toLowerCase() === emailLower
    ) ??
    localStore.members.find(
      (m) => m.status === 'active' && profile.displayName && m.name_key === normalizeName(profile.displayName)
    ) ??
    null;

  const cleanSubmittedFaculty = (params.facultyInput || '').trim();
  if (cleanSubmittedFaculty) {
    profile.faculty = cleanSubmittedFaculty;
    if (matchedMember && !matchedMember.faculty) {
      matchedMember.faculty = cleanSubmittedFaculty;
    }
  }

  const effectiveFaculty = (profile.faculty || matchedMember?.faculty || '').trim();
  if (!effectiveFaculty) {
    return { status: 'missing_faculty' as const };
  }

  if (!matchedMember || !matchedMember.fees_paid) {
    return {
      status: 'fee_unpaid' as const,
      faculty: effectiveFaculty,
    };
  }

  if (!isFstFaculty(effectiveFaculty)) {
    return {
      status: 'not_fst' as const,
      faculty: effectiveFaculty,
    };
  }

  const nameKey = normalizeName(profile.displayName || matchedMember.full_name);
  const existingTp = localStore.tournamentPlayers.find(
    (tp) => tp.tournament_id === tournament.id && (tp.user_id === params.userId || (matchedMember && tp.member_id === matchedMember.id))
  );
  const existingReg = localStore.registrations.find(
    (r) =>
      r.tournament_id === tournament.id &&
      r.status !== 'cancelled' &&
      ((matchedMember && r.member_id === matchedMember.id) || (nameKey && r.name_key === nameKey))
  );

  const reservedCount = localStore.registrations.filter(
    (r) => r.tournament_id === tournament.id && (r.status === 'confirmed' || r.status === 'member_unpaid')
  ).length;

  if (existingTp || existingReg) {
    let ensuredTp = existingTp;
    if (!ensuredTp && existingReg) {
      ensuredTp = {
        id: `tp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tournament_id: tournament.id,
        registration_id: existingReg.id,
        user_id: params.userId,
        member_id: matchedMember.id,
        full_name: profile.displayName || matchedMember.full_name,
        email: params.email || matchedMember.email,
        phone: profile.phone || matchedMember.phone || '',
        identifier: matchedMember.identifier || '',
        faculty: effectiveFaculty,
        category: existingReg.category,
        chess_elo: profile.chessElo ?? matchedMember.chessElo ?? null,
        preferred_piece: profile.preferredPiece || matchedMember.preferredPiece || 'p',
        created_at: new Date().toISOString(),
      };
      localStore.tournamentPlayers.unshift(ensuredTp);
    }
    return {
      status: 'already_registered' as const,
      registration_id: existingReg?.id ?? ensuredTp?.registration_id ?? undefined,
      tournament_player_id: ensuredTp?.id,
      seats_left: Math.max(0, tournament.capacity - reservedCount),
      venue: tournament.venue,
      event_date: tournament.event_date,
      tournament_name: tournament.name,
      faculty: effectiveFaculty,
    };
  }

  if (reservedCount >= tournament.capacity) {
    return { status: 'full' as const };
  }

  const fullName = (profile.displayName || matchedMember.full_name).trim();
  const reg: LocalRegistration = {
    id: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    tournament_id: tournament.id,
    member_id: matchedMember.id,
    full_name: fullName,
    name_key: normalizeName(fullName),
    identifier: matchedMember.identifier || '',
    contact: params.email || matchedMember.email || profile.phone || matchedMember.phone || '',
    category: params.category,
    status: 'confirmed',
    consent: true,
    created_at: new Date().toISOString(),
  };
  localStore.registrations.push(reg);

  const tp: LocalTournamentPlayer = {
    id: `tp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    tournament_id: tournament.id,
    registration_id: reg.id,
    user_id: params.userId,
    member_id: matchedMember.id,
    full_name: fullName,
    email: params.email || matchedMember.email || '',
    phone: profile.phone || matchedMember.phone || '',
    identifier: matchedMember.identifier || '',
    faculty: effectiveFaculty,
    category: params.category,
    chess_elo: profile.chessElo ?? matchedMember.chessElo ?? null,
    preferred_piece: profile.preferredPiece || matchedMember.preferredPiece || 'p',
    created_at: new Date().toISOString(),
  };
  localStore.tournamentPlayers.unshift(tp);

  const newReserved = reservedCount + 1;
  return {
    status: 'confirmed' as const,
    registration_id: reg.id,
    tournament_player_id: tp.id,
    seats_left: Math.max(0, tournament.capacity - newReserved),
    venue: tournament.venue,
    event_date: tournament.event_date,
    tournament_name: tournament.name,
    faculty: effectiveFaculty,
    player: tp,
  };
}

export function localGetTournamentStandings(tournamentId: string, category?: 'open' | 'women', includeUnpublished = false) {
  const confirmedRegs = localStore.registrations.filter(
    (r) => r.tournament_id === tournamentId && r.status === 'confirmed'
  );
  const players: SwissPlayer[] = confirmedRegs.map((r, idx) => ({
    id: r.id,
    name: r.full_name,
    category: r.category,
    seedOrder: idx + 1,
  }));

  const publishedRoundIds = new Set(
    localStore.rounds
      .filter((rd) => rd.tournament_id === tournamentId && (includeUnpublished || rd.is_published))
      .map((rd) => rd.id)
  );

  const games: SwissGameRecord[] = localStore.games
    .filter((g) => g.tournament_id === tournamentId && publishedRoundIds.has(g.round_id))
    .map((g) => ({
      roundNumber: g.round_number,
      board: g.board,
      whiteId: g.white_registration_id,
      blackId: g.black_registration_id,
      result: g.result,
    }));

  return computeStandings(players, games, category);
}

export function localGenerateNextRound(tournamentId: string, category: 'open' | 'women') {
  const confirmedRegs = localStore.registrations.filter(
    (r) => r.tournament_id === tournamentId && r.status === 'confirmed' && r.category === category
  );
  const existingRounds = localStore.rounds.filter(
    (rd) => rd.tournament_id === tournamentId && rd.category === category
  );
  const nextRoundNumber = existingRounds.length + 1;

  const players: SwissPlayer[] = confirmedRegs.map((r, idx) => ({
    id: r.id,
    name: r.full_name,
    category: r.category,
    seedOrder: idx + 1,
  }));

  const prevGames: SwissGameRecord[] = localStore.games
    .filter((g) => g.tournament_id === tournamentId && g.category === category)
    .map((g) => ({
      roundNumber: g.round_number,
      board: g.board,
      whiteId: g.white_registration_id,
      blackId: g.black_registration_id,
      result: g.result,
    }));

  const pairings = generateSwissPairings(players, prevGames, category);
  const round: LocalRound = {
    id: `rd-${Date.now()}-${category}`,
    tournament_id: tournamentId,
    round_number: nextRoundNumber,
    category,
    is_published: true,
  };
  localStore.rounds.push(round);

  const createdGames: LocalGame[] = pairings.map((p) => ({
    id: `gm-${Date.now()}-${p.board}-${Math.random().toString(36).slice(2, 5)}`,
    round_id: round.id,
    tournament_id: tournamentId,
    round_number: nextRoundNumber,
    category,
    board: p.board,
    white_registration_id: p.whiteId,
    black_registration_id: p.blackId,
    result: p.blackId === null ? 'bye' : 'pending',
  }));
  localStore.games.push(...createdGames);

  return { round, games: createdGames };
}
