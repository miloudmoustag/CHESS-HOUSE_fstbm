import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Download,
  Flame,
  History,
  LogOut,
  Shield,
  Sparkles,
  Target,
  Trophy,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';
import { useI18n } from '../i18n';
import { Locale } from '../config/site';
import { ChessPieceSvg } from '../components/chess/ChessPieceSvg';
import { downloadCertificatePdf } from '../lib/pdfExport';
import type { EvaluatedBadge, EvaluatedMission, XpRewardsConfig } from '../lib/passport';
import type { ClubEventItem } from '../data/clubContent';

interface PassportPayload {
  profile: {
    displayName: string;
    email: string;
    role: string;
    faculty?: string;
    language: Locale;
    showOnLeaderboard: boolean;
    bio: string;
    favoriteOpening: string;
  };
  membership: {
    status: 'active_paid' | 'active_unpaid' | 'pending_application' | 'not_registered';
    department: string;
    identifier: string;
    season: string;
    feesPaid: boolean;
  };
  xpTotal: number;
  level: {
    tier: number;
    key: string;
    piece: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
    minXp: number;
    nextXp: number | null;
    progressPct: number;
    title: { fr: string; en: string; ar: string };
  };
  xpRewards: XpRewardsConfig;
  xpTransactions: {
    id: string;
    sourceKey: string;
    activityType: string;
    xpDelta: number;
    description: string;
    status: 'verified' | 'revoked';
    createdAt: string;
  }[];
  badges: EvaluatedBadge[];
  attendanceRecords: {
    id: string;
    sessionDate: string;
    sessionType: string;
    notes: string;
  }[];
  registrations: {
    id: string;
    tournamentId: string;
    tournamentName: { fr: string; en: string; ar: string };
    eventDate: string;
    category: string;
    status: string;
  }[];
  matchHistory: {
    id: string;
    tournamentName: { fr: string; en: string; ar: string };
    roundNumber: number;
    board: number;
    color: string;
    opponentName: string;
    result: string;
  }[];
  missions: EvaluatedMission[];
  notifications: {
    id: string;
    title: { fr: string; en: string; ar: string };
    body: { fr: string; en: string; ar: string };
    type: string;
    isRead: boolean;
    createdAt: string;
  }[];
  certificates: {
    key: string;
    title: { fr: string; en: string; ar: string };
    eligible: boolean;
  }[];
  upcomingEvents: ClubEventItem[];
  studyStats: {
    rating: number;
    puzzlesSolvedCount: number;
    academyWeeksSolid: number[];
  };
  isPreviewMode?: boolean;
}

type DashboardTab = 'overview' | 'passport' | 'history' | 'tournaments' | 'profile';

export const MyChessHousePage: React.FC = () => {
  const { t, pick, setLocale } = useI18n();
  const { user, signOut, updateLeaderboardOptIn, isSupabaseReady, previewSignInAs } = useAuth();
  const { state } = useStudy();

  const [tab, setTab] = useState<DashboardTab>('overview');
  const [missionFilter, setMissionFilter] = useState<'all' | 'daily' | 'weekly' | 'seasonal'>('all');
  const [passport, setPassport] = useState<PassportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');

  // Editable Profile fields
  const [displayName, setDisplayName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteOpening, setFavoriteOpening] = useState('');
  const [language, setLanguage] = useState<Locale>('fr');
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(false);

  const loadPassport = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // First sync local StudyContext achievements idempotently
      const solidWeeks = Object.values(state.weeks)
        .filter((w) => w.mastery === 'solid' || w.mastery === 'mastered')
        .map((w) => w.weekNumber);

      await fetch('/api/passport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify({
          action: 'sync_study_activity',
          puzzlesSolvedCount: state.puzzlesSolved.length,
          solidWeeks,
          rating: state.rating,
          dailyPuzzlesToday: state.dailyDone.lessonDone ? 1 : 0,
          lessonDoneToday: state.dailyDone.lessonDone,
        }),
      }).catch(() => null);

      const res = await fetch('/api/passport', {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as PassportPayload;
        setPassport(data);
        setDisplayName(data.profile.displayName);
        setFaculty(data.profile.faculty || '');
        setBio(data.profile.bio);
        setFavoriteOpening(data.profile.favoriteOpening);
        setLanguage(data.profile.language);
        setShowOnLeaderboard(data.profile.showOnLeaderboard);
      }
    } finally {
      setLoading(false);
    }
  }, [user, state.weeks, state.puzzlesSolved.length, state.rating, state.dailyDone.lessonDone]);

  useEffect(() => {
    loadPassport();
  }, [loadPassport]);

  const handleClaimMission = async (missionKey: string) => {
    if (!user) return;
    setBusyAction(true);
    try {
      const res = await fetch('/api/passport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify({ action: 'claim_mission', missionKey }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.passport) setPassport(data.passport);
      }
    } finally {
      setBusyAction(false);
    }
  };

  const handleMarkNotificationsRead = async () => {
    if (!user) return;
    const res = await fetch('/api/passport', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.accessToken}`,
      },
      body: JSON.stringify({ action: 'mark_notifications_read' }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.passport) setPassport(data.passport);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusyAction(true);
    setSaveNotice('');
    try {
      const res = await fetch('/api/passport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify({
          action: 'update_profile',
          displayName,
          faculty,
          bio,
          favoriteOpening,
          language,
          showOnLeaderboard,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.passport) setPassport(data.passport);
        setLocale(language);
        await updateLeaderboardOptIn(showOnLeaderboard);
        setSaveNotice('Saved');
      }
    } finally {
      setBusyAction(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-xl bg-[var(--accent-gold-bg)] p-3 border border-[var(--border-hairline)]">
          <ChessPieceSvg type="k" color="w" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">{t.myHouse.title}</h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{t.myHouse.signInPrompt}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/account"
            className="btn-piece-slide px-6 py-3 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-semibold hover:bg-[var(--accent-primary-hover)]"
          >
            {t.account.signInBtn} →
          </Link>
          {!isSupabaseReady && (
            <>
              <button
                type="button"
                onClick={() => previewSignInAs('member', 'student@fstbm.ma', 'FST Student')}
                className="px-4 py-3 rounded-lg border border-[var(--border-strong)] text-xs font-semibold hover:bg-[var(--bg-subtle)]"
              >
                Preview as Member
              </button>
              <button
                type="button"
                onClick={() => previewSignInAs('admin', 'board@chesshouse.ma', 'Miloud Moustage')}
                className="px-4 py-3 rounded-lg border border-[var(--accent-gold)] text-xs font-semibold hover:bg-[var(--accent-gold-bg)]"
              >
                Preview as Board Admin
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const completedWeeks = Object.values(state.weeks).filter(
    (w) => w.mastery === 'solid' || w.mastery === 'mastered'
  ).length;
  const unreadNotifs = (passport?.notifications ?? []).filter((n) => !n.isRead).length;
  const filteredMissions = (passport?.missions ?? []).filter(
    (m) => missionFilter === 'all' || m.cadence === missionFilter
  );

  // XP breakdown by activity for clean chart
  const xpByType = new Map<string, number>();
  for (const tx of passport?.xpTransactions ?? []) {
    if (tx.status !== 'verified') continue;
    xpByType.set(tx.activityType, (xpByType.get(tx.activityType) ?? 0) + tx.xpDelta);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Top Member Header */}
      <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-hairline)] p-2.5 shrink-0">
            <ChessPieceSvg type={passport?.level.piece ?? 'p'} color="w" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-[var(--accent-gold)]">
              <span>{passport ? pick(passport.level.title) : 'Passport'}</span>
              <span>·</span>
              <span>{t.myHouse.membershipStates[passport?.membership.status ?? 'not_registered']}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              {passport?.profile.displayName ?? user.displayName}
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              {user.email}
              {passport?.profile.faculty || passport?.membership.department
                ? ` · ${passport?.profile.faculty || passport?.membership.department}`
                : ''}
              {passport?.isPreviewMode ? ` · ${t.home.statPreviewLabel}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/tournaments"
            className="btn-piece-slide px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold whitespace-nowrap"
          >
            {t.home.ctaTournament}
          </Link>
          <Link
            to="/academy"
            className="px-4 py-2 rounded-lg border border-[var(--border-strong)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] whitespace-nowrap"
          >
            {t.nav.academy}
          </Link>
          {(user.role === 'board' || user.role === 'admin') && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--chess-charcoal)] text-[#EEEED2] dark:bg-[var(--accent-gold)] dark:text-[#1B1A17] text-xs font-semibold whitespace-nowrap"
            >
              <Shield className="w-3.5 h-3.5" />
              {t.nav.admin}
            </Link>
          )}
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--border-hairline)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t.account.signOutBtn}
          </button>
        </div>
      </section>

      {/* Primary KPI Grid — House XP strictly separated from Chess Study Rating */}
      <section className="space-y-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>{t.myHouse.houseXpLabel}</span>
              <Sparkles className="w-4 h-4 text-[var(--accent-gold)]" />
            </div>
            <div className="text-3xl font-bold font-mono-tabular text-[var(--accent-gold)] mt-2">
              {passport?.xpTotal ?? 0} <span className="text-sm font-semibold">XP</span>
            </div>
            {passport?.level.nextXp && (
              <div className="mt-3 space-y-1">
                <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent-gold)] transition-all"
                    style={{ width: `${passport.level.progressPct}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono-tabular text-[var(--text-muted)]">
                  {passport.xpTotal} / {passport.level.nextXp} XP
                </div>
              </div>
            )}
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>{t.myHouse.studyRatingLabel}</span>
              <Flame className="w-4 h-4 text-[var(--accent-primary)]" />
            </div>
            <div className="text-3xl font-bold font-mono-tabular text-[var(--accent-primary)] mt-2">
              {state.rating}
            </div>
            <div className="text-xs font-mono-tabular text-[var(--text-muted)] mt-2">
              {state.streakDays}d streak · {state.puzzlesSolved.length} puzzles
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>{t.myHouse.attendanceTitle}</span>
              <Calendar className="w-4 h-4 text-[var(--accent-primary)]" />
            </div>
            <div className="text-3xl font-bold font-mono-tabular text-[var(--text-primary)] mt-2">
              {passport?.attendanceRecords.length ?? 0}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-2">Verified campus sessions</div>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>{t.nav.academy}</span>
              <BookOpen className="w-4 h-4 text-[var(--accent-gold)]" />
            </div>
            <div className="text-3xl font-bold font-mono-tabular text-[var(--text-primary)] mt-2">
              {completedWeeks} / 8
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-2">
              {(passport?.badges.filter((b) => b.unlocked).length ?? 0)} / 6 Passport badges
            </div>
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)]">{t.myHouse.xpSeparationNote}</p>
      </section>

      {/* Dashboard Sub-Navigation */}
      <nav aria-label="My Chess House sections" className="flex flex-wrap gap-2 border-b border-[var(--border-hairline)] pb-3">
        {(
          [
            { id: 'overview', label: t.myHouse.missionsTitle, Icon: Target },
            { id: 'passport', label: t.myHouse.passportTitle, Icon: Award },
            { id: 'history', label: t.myHouse.attendanceTitle, Icon: History },
            { id: 'tournaments', label: t.myHouse.registrationsTitle, Icon: Trophy },
            {
              id: 'profile',
              label: `${t.myHouse.profileTitle}${unreadNotifs > 0 ? ` (${unreadNotifs})` : ''}`,
              Icon: User,
            },
          ] as { id: DashboardTab; label: string; Icon: React.ElementType }[]
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              tab === id
                ? 'bg-[var(--chess-charcoal)] text-[#EEEED2] dark:bg-[var(--accent-primary)] dark:text-white'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-hairline)] hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {loading && !passport ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 rounded-xl bg-[var(--bg-subtle)] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW, MISSIONS, PROGRESS CHARTS & UPCOMING */}
          {tab === 'overview' && (
            <div className="space-y-8">
              {/* Missions Section */}
              <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
                    {t.myHouse.missionsTitle}
                  </h2>
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)]">
                    {(['all', 'daily', 'weekly', 'seasonal'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setMissionFilter(f)}
                        className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                          missionFilter === f
                            ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                            : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {f === 'all'
                          ? t.events.filterAll
                          : f === 'daily'
                          ? t.myHouse.missionsDaily
                          : f === 'weekly'
                          ? t.myHouse.missionsWeekly
                          : t.myHouse.missionsSeasonal}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMissions.map((m) => {
                    const pct = Math.min(100, Math.round((m.progress / Math.max(1, m.target)) * 100));
                    return (
                      <div
                        key={m.key}
                        className="border border-[var(--border-hairline)] rounded-xl p-5 flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono-tabular">
                            <span className="uppercase text-[var(--accent-gold)]">
                              {m.cadence} · {m.periodKey}
                            </span>
                            <span className="font-bold text-[var(--accent-primary)]">+{m.xpReward} XP</span>
                          </div>
                          <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">{pick(m.title)}</h3>
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{pick(m.description)}</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-mono-tabular text-[var(--text-muted)]">
                            <span>Progress</span>
                            <span>
                              {m.progress} / {m.target}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                            <div
                              className="h-full bg-[var(--accent-primary)] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="pt-1 flex justify-end">
                            {m.claimed ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-primary)]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {t.myHouse.claimed}
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={!m.canClaim || busyAction}
                                onClick={() => handleClaimMission(m.key)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                  m.canClaim
                                    ? 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)]'
                                    : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] cursor-not-allowed'
                                }`}
                              >
                                {t.myHouse.claimXp} (+{m.xpReward} XP)
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Progress Charts & Upcoming Events */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <section className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-5">
                  <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
                    {t.myHouse.progressChartTitle}
                  </h2>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => {
                      const wp = state.weeks[w];
                      const pct =
                        wp?.mastery === 'mastered'
                          ? 100
                          : wp?.mastery === 'solid'
                          ? 75
                          : wp?.mastery === 'practiced'
                          ? 50
                          : wp?.mastery === 'seen'
                          ? 25
                          : 0;
                      const phase = w <= 3 ? 'Endgames' : w <= 6 ? 'Middlegame' : 'Openings';
                      return (
                        <div key={w} className="space-y-1 text-xs">
                          <div className="flex justify-between font-mono-tabular">
                            <span className="font-medium text-[var(--text-primary)]">
                              Week {w} · <span className="text-[var(--text-muted)]">{phase}</span>
                            </span>
                            <span className="text-[var(--text-secondary)]">
                              {t.academy.mastery[wp?.mastery ?? 'unseen']}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                            <div className="h-full bg-[var(--accent-primary)]" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-5">
                  <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">{t.events.filterUpcoming}</h2>
                  {(passport?.upcomingEvents ?? []).length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)]">No upcoming club events scheduled.</p>
                  ) : (
                    <div className="space-y-3">
                      {passport?.upcomingEvents.slice(0, 3).map((ev) => (
                        <div key={ev.id} className="border-b border-[var(--border-hairline)] pb-3 last:border-none last:pb-0">
                          <div className="text-xs font-mono-tabular text-[var(--accent-gold)]">
                            {ev.dateIso.slice(0, 10)}
                          </div>
                          <div className="font-semibold text-sm text-[var(--text-primary)] mt-0.5">{pick(ev.title)}</div>
                          <div className="text-xs text-[var(--text-secondary)] mt-0.5">{pick(ev.location)}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Certificates */}
                  <div className="pt-4 border-t border-[var(--border-hairline)] space-y-3">
                    <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
                      {t.myHouse.certificatesTitle}
                    </h3>
                    {(passport?.certificates ?? []).map((cert) => (
                      <div key={cert.key} className="flex items-center justify-between gap-2 text-xs">
                        <span className={cert.eligible ? 'font-medium text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
                          {pick(cert.title)}
                        </span>
                        {cert.eligible ? (
                          <button
                            type="button"
                            onClick={() =>
                              downloadCertificatePdf({
                                learnerName: passport?.profile.displayName || user.displayName,
                                levelTitle: pick(cert.title),
                                dateIso: new Date().toISOString(),
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--accent-primary)] text-white font-semibold"
                          >
                            <Download className="w-3 h-3" />
                            PDF
                          </button>
                        ) : (
                          <span className="font-mono-tabular text-[var(--text-muted)]">Locked</span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* TAB 2: PASSPORT & ACHIEVEMENT BADGES */}
          {tab === 'passport' && (
            <div className="space-y-8">
              <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
                    {t.myHouse.badgesTitle}
                  </h2>
                  <span className="text-xs font-mono-tabular text-[var(--text-muted)]">
                    {passport?.badges.filter((b) => b.unlocked).length ?? 0} / {passport?.badges.length ?? 6} unlocked
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(passport?.badges ?? []).map((badge) => (
                    <div
                      key={badge.key}
                      className={`rounded-xl border p-5 space-y-3 ${
                        badge.unlocked
                          ? 'border-[var(--accent-gold)] bg-[var(--accent-gold-bg)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-page)] opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] p-1.5">
                          <ChessPieceSvg type={badge.piece} color={badge.unlocked ? 'w' : 'b'} />
                        </div>
                        <span className="text-xs font-mono-tabular text-[var(--text-muted)]">
                          {badge.progress} / {badge.target}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-display text-base font-bold text-[var(--text-primary)]">{pick(badge.title)}</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                          {pick(badge.description)}
                        </p>
                      </div>
                      {badge.awardedAt && (
                        <div className="text-[11px] font-mono-tabular text-[var(--accent-gold)]">
                          Earned {badge.awardedAt.slice(0, 10)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Verified XP Schedule Reference */}
              {passport?.xpRewards && (
                <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
                  <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
                    Passport XP Activity Schedule
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    {[
                      { label: 'Training Session', xp: passport.xpRewards.session },
                      { label: '5 Puzzles Solved', xp: passport.xpRewards.puzzles_5 },
                      { label: 'Academy Week', xp: passport.xpRewards.academy_week },
                      { label: 'Tournament Play', xp: passport.xpRewards.tournament },
                      { label: 'Organize Event', xp: passport.xpRewards.organize_event },
                      { label: 'Tournament Win', xp: passport.xpRewards.tournament_win },
                    ].map((row) => (
                      <div key={row.label} className="border border-[var(--border-hairline)] rounded-lg p-3">
                        <div className="font-mono-tabular text-base font-bold text-[var(--accent-gold)]">+{row.xp} XP</div>
                        <div className="text-[var(--text-secondary)] mt-1">{row.label}</div>
                      </div>
                    ))}
                  </div>
                  {xpByType.size > 0 && (
                    <div className="pt-2 border-t border-[var(--border-hairline)] flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
                      {Array.from(xpByType.entries()).map(([type, pts]) => (
                        <span key={type} className="font-mono-tabular">
                          {type.replace(/_/g, ' ')}: <strong className="text-[var(--text-primary)]">{pts} XP</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}

          {/* TAB 3: ATTENDANCE HISTORY & XP LEDGER */}
          {tab === 'history' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <section className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
                <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
                  {t.myHouse.attendanceTitle}
                </h2>
                {(passport?.attendanceRecords ?? []).length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">{t.myHouse.attendanceEmpty}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border-strong)] text-[var(--text-muted)] uppercase">
                          <th className="py-2 px-2 text-start">Date</th>
                          <th className="py-2 px-2 text-start">Session</th>
                          <th className="py-2 px-2 text-start">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {passport?.attendanceRecords.map((a) => (
                          <tr key={a.id} className="border-b border-[var(--border-hairline)]">
                            <td className="py-2.5 px-2 font-mono-tabular">{a.sessionDate}</td>
                            <td className="py-2.5 px-2 font-medium">{a.sessionType.replace(/_/g, ' ')}</td>
                            <td className="py-2.5 px-2 text-[var(--text-secondary)]">{a.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
                <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">{t.myHouse.ledgerTitle}</h2>
                {(passport?.xpTransactions ?? []).length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">{t.myHouse.ledgerEmpty}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border-strong)] text-[var(--text-muted)] uppercase">
                          <th className="py-2 px-2 text-start">Date</th>
                          <th className="py-2 px-2 text-start">Activity</th>
                          <th className="py-2 px-2 text-start">Status</th>
                          <th className="py-2 px-2 text-end font-mono-tabular">XP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {passport?.xpTransactions.map((tx) => (
                          <tr key={tx.id} className="border-b border-[var(--border-hairline)]">
                            <td className="py-2.5 px-2 font-mono-tabular text-[var(--text-muted)]">
                              {tx.createdAt.slice(0, 10)}
                            </td>
                            <td className="py-2.5 px-2 font-medium text-[var(--text-primary)]">{tx.description}</td>
                            <td className="py-2.5 px-2 text-[var(--text-secondary)]">{tx.status}</td>
                            <td
                              className={`py-2.5 px-2 text-end font-mono-tabular font-bold ${
                                tx.status === 'revoked' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--accent-primary)]'
                              }`}
                            >
                              +{tx.xpDelta}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 4: TOURNAMENT REGISTRATIONS & MATCH HISTORY */}
          {tab === 'tournaments' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
                <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
                  {t.myHouse.registrationsTitle}
                </h2>
                {(passport?.registrations ?? []).length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-[var(--text-muted)]">{t.myHouse.registrationsEmpty}</p>
                    <Link
                      to="/tournaments"
                      className="inline-flex px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold"
                    >
                      {t.home.ctaTournament}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {passport?.registrations.map((reg) => (
                      <div
                        key={reg.id}
                        className="border border-[var(--border-hairline)] rounded-lg p-4 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-sm text-[var(--text-primary)]">{pick(reg.tournamentName)}</div>
                          <div className="font-mono-tabular text-[var(--text-muted)] mt-0.5">
                            {reg.eventDate ? reg.eventDate.slice(0, 10) : '—'} · {reg.category}
                          </div>
                        </div>
                        <span className="font-mono-tabular font-semibold text-[var(--accent-primary)]">{reg.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
                <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
                  {t.myHouse.matchesTitle}
                </h2>
                {(passport?.matchHistory ?? []).length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">{t.myHouse.matchesEmpty}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border-strong)] text-[var(--text-muted)] uppercase">
                          <th className="py-2 px-2 text-start">Rd</th>
                          <th className="py-2 px-2 text-start">Color</th>
                          <th className="py-2 px-2 text-start">Opponent</th>
                          <th className="py-2 px-2 text-end">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {passport?.matchHistory.map((m) => (
                          <tr key={m.id} className="border-b border-[var(--border-hairline)]">
                            <td className="py-2 px-2 font-mono-tabular">R{m.roundNumber} · B{m.board}</td>
                            <td className="py-2 px-2 uppercase font-mono-tabular">{m.color}</td>
                            <td className="py-2 px-2 font-medium">{m.opponentName}</td>
                            <td className="py-2 px-2 text-end font-mono-tabular font-bold">{m.result}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 5: PROFILE SETTINGS & NOTIFICATIONS */}
          {tab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <section className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
                <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
                  {t.myHouse.profileTitle}
                </h2>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                        {t.account.displayNameLabel}
                      </label>
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                        {t.myHouse.languageLabel}
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as Locale)}
                        className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-sm"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="ar">العربية</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                        {t.join.facultyLabel}
                      </label>
                      <input
                        type="text"
                        value={faculty}
                        onChange={(e) => setFaculty(e.target.value)}
                        placeholder="FST / FP / EST / ENSA / ENSG / ENS..."
                        className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                        {t.myHouse.openingLabel}
                      </label>
                      <input
                        type="text"
                        value={favoriteOpening}
                        onChange={(e) => setFavoriteOpening(e.target.value)}
                        placeholder="e.g. Italian Game / Lucena Rook Endgame"
                        className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                      {t.myHouse.bioLabel}
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-sm"
                    />
                  </div>

                  <label className="flex items-center gap-3 text-xs sm:text-sm text-[var(--text-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnLeaderboard}
                      onChange={(e) => setShowOnLeaderboard(e.target.checked)}
                      className="rounded"
                    />
                    <span>{t.account.leaderboardOptIn}</span>
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={busyAction}
                      className="btn-piece-slide px-5 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
                    >
                      {t.common.save}
                    </button>
                    {saveNotice && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-primary)]">
                        <Check className="w-3.5 h-3.5" />
                        {saveNotice}
                      </span>
                    )}
                  </div>
                </form>
              </section>

              <section className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[var(--accent-gold)]" />
                    <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
                      {t.myHouse.notificationsTitle}
                    </h2>
                  </div>
                  {unreadNotifs > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkNotificationsRead}
                      className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                    >
                      {t.myHouse.notificationsMarkRead}
                    </button>
                  )}
                </div>

                {(passport?.notifications ?? []).length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">No notifications yet.</p>
                ) : (
                  <div className="space-y-3">
                    {passport?.notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                          n.isRead
                            ? 'border-[var(--border-hairline)] bg-[var(--bg-page)]'
                            : 'border-[var(--accent-gold)] bg-[var(--accent-gold-bg)]'
                        }`}
                      >
                        <div className="flex justify-between gap-2 font-semibold text-[var(--text-primary)]">
                          <span>{pick(n.title)}</span>
                          <span className="font-mono-tabular text-[var(--text-muted)]">{n.createdAt.slice(0, 10)}</span>
                        </div>
                        <p className="text-[var(--text-secondary)] leading-relaxed">{pick(n.body)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
};
