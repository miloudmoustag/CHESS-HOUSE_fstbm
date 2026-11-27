import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Award, BookOpen, Calendar, Clock, MapPin, Sparkles, Trophy, User, Users } from 'lucide-react';
import { SITE_CONFIG } from '../config/site';
import { CLUB_LOGOS } from '../data/images';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';
import { HeroChessBoard } from '../components/chess/HeroChessBoard';
import { ChessPieceSvg } from '../components/chess/ChessPieceSvg';
import { AnimatedCounter } from '../components/common/AnimatedCounter';
import { OpeningCurtain } from '../components/chess/OpeningCurtain';
import { DailyChallengeWidget } from '../components/chess/DailyChallengeWidget';

interface LiveConfigResponse {
  nextTournament?: {
    id: string;
    slug: string;
    name: { fr: string; en: string; ar: string };
    event_date: string;
    venue: { fr: string; en: string; ar: string };
    capacity: number;
    deadline: string;
    rounds: number;
    time_control: string;
    seatsLeft: number;
    confirmedCount: number;
  };
  dailyChallenge?: {
    id: string;
    dateIso: string;
    motif: string;
    rating: number;
    fen: string;
    solutionSan: string[];
    title: { fr: string; en: string; ar: string };
    hint: { fr: string; en: string; ar: string };
  };
  activityFeed?: {
    id: string;
    kind: string;
    dateIso: string;
    title: { fr: string; en: string; ar: string };
    detail: { fr: string; en: string; ar: string };
    link: string;
  }[];
  featuredPlayers?: {
    id: string;
    displayName: string;
    xpTotal: number;
    levelTitle: { fr: string; en: string; ar: string };
    badgesCount: number;
    source: string;
  }[];
  clubStats?: {
    activeMembersCount: number;
    confirmedRegistrationsCount: number;
    eventsCount: number;
    gamesPlayedCount: number;
    isPreviewMode?: boolean;
  };
  settings?: {
    clubsReached?: number;
    iuccUniversities?: number;
    iuccStudents?: number;
    weeklySessions?: number;
    mondayAssignmentWeek?: number;
  };
}

function useCountdown(targetIso: string) {
  const [text, setText] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = Date.parse(targetIso) - Date.now();
      if (diff <= 0) {
        setText('0d 0h');
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setText(`${d}d ${h}h ${m}m`);
    };
    update();
    const id = window.setInterval(update, 60000);
    return () => window.clearInterval(id);
  }, [targetIso]);
  return text;
}

function formatEventDate(iso: string, locale: 'fr' | 'en' | 'ar'): string {
  try {
    const dt = new Date(iso);
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dt);
  } catch {
    return iso.slice(0, 10);
  }
}

export const HomePage: React.FC = () => {
  const { t, pick, locale } = useI18n();
  const { user } = useAuth();
  const { state } = useStudy();
  const [liveConfig, setLiveConfig] = useState<LiveConfigResponse | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data) setLiveConfig(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const nextT = liveConfig?.nextTournament;
  const seatsLeft = nextT?.seatsLeft ?? SITE_CONFIG.nextTournament.capacity;
  const capacity = nextT?.capacity ?? SITE_CONFIG.nextTournament.capacity;
  const deadlineIso = nextT?.deadline ?? SITE_CONFIG.nextTournament.deadline;
  const eventDateIso = nextT?.event_date ?? SITE_CONFIG.nextTournament.eventDate;
  const roundsCount = nextT?.rounds ?? SITE_CONFIG.nextTournament.rounds;
  const timeControl = nextT?.time_control ?? SITE_CONFIG.nextTournament.timeControl;
  const countdown = useCountdown(deadlineIso);

  const clubsReached = liveConfig?.settings?.clubsReached ?? SITE_CONFIG.stats.clubsReached;
  const studentsReached = liveConfig?.settings?.iuccStudents ?? SITE_CONFIG.stats.iuccStudents;
  const mondayWeek = liveConfig?.settings?.mondayAssignmentWeek ?? 1;

  const completedWeeks = Object.values(state.weeks).filter(
    (w) => w.mastery === 'solid' || w.mastery === 'mastered'
  ).length;

  return (
    <>
      <OpeningCurtain />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-16">
        {/* Hero Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3">
              <img
                src={CLUB_LOGOS.fst.src}
                alt={pick(CLUB_LOGOS.fst.alt)}
                width={32}
                height={32}
                className="w-8 h-8 rounded object-cover border border-[var(--border-hairline)]"
              />
              <p className="text-xs font-medium text-[var(--text-secondary)]">{t.home.kicker}</p>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)] leading-tight text-balance">
              {t.home.headline}
            </h1>

            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl">
              {t.home.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/tournaments"
                className="btn-piece-slide inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-semibold hover:bg-[var(--accent-primary-hover)] whitespace-nowrap"
              >
                {t.home.ctaTournament}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
              {user ? (
                <Link
                  to="/my-chess-house"
                  className="btn-piece-slide inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-[var(--accent-gold)] bg-[var(--accent-gold-bg)] text-[var(--text-primary)] text-sm font-semibold whitespace-nowrap"
                >
                  <User className="w-4 h-4" />
                  {t.home.ctaMyHouse}
                </Link>
              ) : (
                <Link
                  to="/join"
                  className="btn-piece-slide inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm font-semibold hover:bg-[var(--bg-subtle)] whitespace-nowrap"
                >
                  {t.home.ctaJoin}
                </Link>
              )}
              <Link
                to="/academy"
                className="btn-piece-slide inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[var(--accent-primary)] hover:underline whitespace-nowrap"
              >
                {t.home.ctaLearn}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <HeroChessBoard />
          </div>
        </section>

        {/* Live Next Tournament Card (100% DB/Config Driven) */}
        <section
          aria-label={t.home.nextEventLabel}
          className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
                {t.home.nextEventLabel}
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                {nextT ? pick(nextT.name) : pick(SITE_CONFIG.nextTournament.name)}
              </h2>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--text-secondary)] pt-1">
                <span className="inline-flex items-center gap-1.5 font-mono-tabular">
                  <Calendar className="w-4 h-4 text-[var(--accent-primary)]" />
                  {formatEventDate(eventDateIso, locale)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[var(--accent-primary)]" />
                  {nextT ? pick(nextT.venue) : pick(SITE_CONFIG.nextTournament.venue)}
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono-tabular">
                  <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
                  {roundsCount} {t.common.roundsCount} · {timeControl}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 shrink-0">
              <div className="text-start">
                <div className="text-2xl font-bold font-mono-tabular text-[var(--accent-primary)]">
                  {seatsLeft} / {capacity}
                </div>
                <div className="text-xs text-[var(--text-muted)]">{t.common.seatsLeft}</div>
              </div>
              <div className="text-start">
                <div className="text-lg font-semibold font-mono-tabular text-[var(--text-primary)]">{countdown}</div>
                <div className="text-xs text-[var(--text-muted)]">{t.common.deadline}</div>
              </div>
              <Link
                to="/tournaments"
                className="btn-piece-slide px-5 py-2.5 rounded-lg bg-[var(--chess-charcoal)] text-[#EEEED2] dark:bg-[var(--accent-gold)] dark:text-[#1B1A17] text-sm font-semibold whitespace-nowrap"
              >
                {t.tournaments.makeYourMove}
              </Link>
            </div>
          </div>
        </section>

        {/* Interactive Daily Chess Challenge */}
        <section aria-label={t.home.dailyChallengeTitle} className="space-y-4">
          <DailyChallengeWidget puzzle={liveConfig?.dailyChallenge} />
        </section>

        {/* Live Club Activity Feed & Featured Players */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[var(--accent-primary)]" />
                <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                  {t.home.liveFeedTitle}
                </h2>
              </div>
              <Link to="/events" className="text-xs font-semibold text-[var(--accent-primary)] hover:underline whitespace-nowrap">
                {t.nav.events} →
              </Link>
            </div>

            <div className="divide-y divide-[var(--border-hairline)]">
              {(liveConfig?.activityFeed ?? []).slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  to={item.link}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 group"
                >
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                      {pick(item.title)}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">{pick(item.detail)}</div>
                  </div>
                  <span className="text-xs font-mono-tabular text-[var(--text-muted)] shrink-0">
                    {item.dateIso.slice(0, 10)}
                  </span>
                </Link>
              ))}
              {(!liveConfig?.activityFeed || liveConfig.activityFeed.length === 0) && (
                <p className="text-sm text-[var(--text-muted)]">{t.common.loading}</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[var(--accent-gold)]" />
                <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                  {t.home.featuredPlayersTitle}
                </h2>
              </div>
              <Link to="/hall" className="text-xs font-semibold text-[var(--accent-primary)] hover:underline whitespace-nowrap">
                {t.nav.hall} →
              </Link>
            </div>

            {liveConfig?.featuredPlayers && liveConfig.featuredPlayers.length > 0 ? (
              <div className="space-y-3">
                {liveConfig.featuredPlayers.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 py-2.5 border-b border-[var(--border-hairline)] last:border-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono-tabular text-xs font-bold text-[var(--accent-gold)] w-5">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-[var(--text-primary)]">{p.displayName}</div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {pick(p.levelTitle)} · {p.badgesCount} badges
                        </div>
                      </div>
                    </div>
                    <span className="font-mono-tabular text-xs font-bold text-[var(--accent-primary)]">
                      {p.xpTotal} XP
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 text-xs text-[var(--text-secondary)]">
                <p>{t.hall.optInNote}</p>
                <Link
                  to="/my-chess-house"
                  className="inline-flex items-center gap-1.5 font-semibold text-[var(--accent-primary)] hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {t.home.ctaMyHouse} →
                </Link>
              </div>
            )}

            <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">{t.myHouse.passportTitle}</span>
              <Link to="/my-chess-house" className="font-semibold text-[var(--accent-primary)] hover:underline">
                {t.myHouse.missionsTitle} →
              </Link>
            </div>
          </div>
        </section>

        {/* Weekly Rhythm Board */}
        <section className="space-y-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              {t.home.rhythmTitle}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)]">{t.home.rhythmSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SITE_CONFIG.weeklySessions.map((session, idx) => {
              const pieceTypes = ['n', 'r', 'q'] as const;
              return (
                <div
                  key={session.id}
                  className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 flex flex-col justify-between gap-4 hover:-translate-y-0.5 transition-transform"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono-tabular text-[var(--accent-gold)]">{session.time}</p>
                      <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mt-1">
                        {pick(session.day)}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-subtle)] p-1.5 border border-[var(--border-hairline)]">
                      <ChessPieceSvg type={pieceTypes[idx]} color={idx === 1 ? 'b' : 'w'} />
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{pick(session.focus)}</p>
                  <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>{pick(session.room)}</span>
                    <span className="inline-flex items-center gap-1 font-mono-tabular">
                      <Users className="w-3.5 h-3.5" />
                      {session.attendance}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Club Reach & Database Stats */}
        <section className="bg-[var(--chess-charcoal)] text-[#EEEED2] rounded-xl p-8 sm:p-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-2xl font-bold">{t.home.statsTitle}</h2>
            {liveConfig?.clubStats?.isPreviewMode && (
              <span className="text-xs font-mono-tabular text-[#C8C4B8]">{t.home.statPreviewLabel}</span>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-[#C9A24B]">
                <AnimatedCounter value={clubsReached} />
              </div>
              <div className="text-xs sm:text-sm text-[#C8C4B8] mt-1">{t.home.statClubs}</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-[#C9A24B]">
                <AnimatedCounter value={studentsReached} suffix="+" />
              </div>
              <div className="text-xs sm:text-sm text-[#C8C4B8] mt-1">{t.home.statStudents}</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-[#C9A24B]">
                <AnimatedCounter value={liveConfig?.clubStats?.activeMembersCount ?? SITE_CONFIG.stats.electedBoardPresent} />
              </div>
              <div className="text-xs sm:text-sm text-[#C8C4B8] mt-1">{t.home.statActiveMembers}</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-[#C9A24B]">
                <AnimatedCounter value={liveConfig?.clubStats?.eventsCount ?? 5} />
              </div>
              <div className="text-xs sm:text-sm text-[#C8C4B8] mt-1">{t.home.statEvents}</div>
            </div>
          </div>
        </section>

        {/* Roadmap & Academy Progress Highlight */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                {t.home.roadmapPreviewTitle}
              </h2>
              <Link to="/roadmap" className="text-xs font-semibold text-[var(--accent-primary)] hover:underline whitespace-nowrap">
                {t.home.roadmapPreviewLink}
              </Link>
            </div>
            <ol className="space-y-3">
              {SITE_CONFIG.roadmap2026_27.slice(0, 4).map((step, i) => (
                <li key={step.id} className="flex items-baseline gap-3 text-sm">
                  <span className="font-mono-tabular font-semibold text-[var(--accent-gold)] shrink-0">
                    {i + 1}.
                  </span>
                  <div>
                    <span className="font-semibold text-[var(--text-primary)]">{pick(step.title)}</span>
                    <span className="text-[var(--text-muted)] mx-2">·</span>
                    <span className="text-xs text-[var(--text-muted)]">{pick(step.period)}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs font-mono-tabular text-[var(--accent-gold)]">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {t.home.academySpotlightTitle}: Week {mondayWeek}
                </span>
                <span>{completedWeeks} / 8 solid</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                {t.home.academyPreviewTitle}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{t.home.academyPreviewBody}</p>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="p-3 rounded-lg bg-[var(--bg-subtle)]">
                  <div className="text-xs font-mono-tabular text-[var(--accent-gold)]">01–03</div>
                  <div className="text-xs font-semibold text-[var(--text-primary)] mt-1">Endgames</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-subtle)]">
                  <div className="text-xs font-mono-tabular text-[var(--accent-gold)]">04–06</div>
                  <div className="text-xs font-semibold text-[var(--text-primary)] mt-1">Middlegame</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-subtle)]">
                  <div className="text-xs font-mono-tabular text-[var(--accent-gold)]">07–08</div>
                  <div className="text-xs font-semibold text-[var(--text-primary)] mt-1">Openings</div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/academy"
                className="btn-piece-slide inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-semibold hover:bg-[var(--accent-primary-hover)]"
              >
                {t.home.ctaLearn}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
              <Link
                to="/league"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <Trophy className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                {t.nav.league}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};
