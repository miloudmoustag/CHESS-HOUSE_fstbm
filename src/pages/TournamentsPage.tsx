import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Download, LogIn, MapPin, Trophy, Users } from 'lucide-react';
import { SITE_CONFIG } from '../config/site';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { PawnToQueenTrack } from '../components/chess/PawnToQueenTrack';
import { TurnstileWidget } from '../components/common/TurnstileWidget';
import { AccessibleModal } from '../components/common/AccessibleModal';
import { ClubImage } from '../components/common/ClubImage';
import {
  type FacultyCode,
  FacultySelector,
  formatFacultyValue,
} from '../components/chess/ChessSignupShell';
import { downloadIcsFile } from '../lib/ics';
import { supabase } from '../lib/supabase';
import type { SwissStanding } from '../lib/swiss';

interface TournamentConfig {
  id: string;
  slug: string;
  name: { fr: string; en: string; ar: string };
  event_date: string;
  end_date?: string;
  deadline: string;
  venue: { fr: string; en: string; ar: string };
  rounds: number;
  time_control: string;
  capacity: number;
  is_open: boolean;
  entry_fee?: number | null;
  confirmedCount: number;
  seatsLeft: number;
}

interface RoundGameItem {
  id: string;
  board: number;
  whiteName: string;
  blackName: string;
  result: string;
}

interface RoundItem {
  id: string;
  round_number: number;
  category: 'open' | 'women';
  games: RoundGameItem[];
}

type RegisterStatus =
  | 'confirmed'
  | 'fee_unpaid'
  | 'member_unpaid'
  | 'not_fst'
  | 'auth_required'
  | 'pending_not_member'
  | 'already_registered'
  | 'closed'
  | 'full'
  | 'invalid';

export const TournamentsPage: React.FC = () => {
  const { t, pick, locale } = useI18n();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<TournamentConfig | null>(null);
  const [entryFee, setEntryFee] = useState<number | null>(SITE_CONFIG.entryFee);

  // Registration State ("I will be there" + inline missing faculty flow)
  const [category, setCategory] = useState<'open' | 'women'>('open');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [modalStatus, setModalStatus] = useState<RegisterStatus | null>(null);
  const [confirmedVenue, setConfirmedVenue] = useState<{ fr: string; en: string; ar: string } | null>(null);
  const [confirmedEventDate, setConfirmedEventDate] = useState<string | null>(null);

  // Missing faculty prompt state
  const [needsFaculty, setNeedsFaculty] = useState(false);
  const [faculty, setFaculty] = useState<FacultyCode | ''>('');
  const [studyPlace, setStudyPlace] = useState('');

  // Live Standings & Rounds State
  const [activeTab, setActiveTab] = useState<'rounds' | 'standings'>('standings');
  const [standingsCat, setStandingsCat] = useState<'open' | 'women'>('open');
  const [rounds, setRounds] = useState<RoundItem[]>([]);
  const [standingsOpen, setStandingsOpen] = useState<SwissStanding[]>([]);
  const [standingsWomen, setStandingsWomen] = useState<SwissStanding[]>([]);
  const [loadingStandings, setLoadingStandings] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) return;
      const data = await res.json();
      if (data.nextTournament) setTournament(data.nextTournament);
      if (typeof data.settings?.entryFee === 'number' || data.settings?.entryFee === null) {
        setEntryFee(data.settings.entryFee);
      }
    } catch {
      // fallback to SITE_CONFIG defaults
    }
  }, []);

  const loadStandings = useCallback(async (slug = 'internal-rapid-nov-2026') => {
    setLoadingStandings(true);
    try {
      const res = await fetch(`/api/standings?tournament=${encodeURIComponent(slug)}`);
      if (!res.ok) return;
      const data = await res.json();
      setRounds(data.rounds ?? []);
      setStandingsOpen(data.standings?.open ?? []);
      setStandingsWomen(data.standings?.women ?? []);
    } catch {
      // ignore offline
    } finally {
      setLoadingStandings(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    loadStandings();
  }, [loadConfig, loadStandings]);

  useEffect(() => {
    if (tournament?.slug && tournament.slug !== 'internal-rapid-nov-2026') {
      loadStandings(tournament.slug);
    }
  }, [tournament?.slug, loadStandings]);

  // Single Supabase Realtime subscription on games + rounds (unsubscribed cleanly on unmount)
  useEffect(() => {
    if (!supabase || !tournament?.id) return;
    const client = supabase;
    const channel = client
      .channel(`tournament-live-${tournament.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        loadStandings(tournament.slug);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, () => {
        loadStandings(tournament.slug);
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [tournament?.id, tournament?.slug, loadStandings]);

  const runRegistrationCheck = async (facultyOverride?: string) => {
    setFormError('');

    if (!user) {
      setModalStatus('auth_required');
      return;
    }

    setSubmitting(true);
    setStep(2);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify({
          tournamentId: tournament?.id ?? SITE_CONFIG.nextTournament.slug,
          category,
          faculty: facultyOverride ?? undefined,
          turnstileToken,
          website: honeypot,
        }),
      });
      const data = await res.json();

      if (data.status === 'missing_faculty') {
        setNeedsFaculty(true);
        setStep(1);
        return;
      }

      if (!res.ok && !data.status) {
        setFormError(data.error || t.common.errorGeneric);
        setStep(1);
        return;
      }

      setNeedsFaculty(false);
      const status = (data.status as RegisterStatus) || 'invalid';
      if (status === 'confirmed' || status === 'already_registered') {
        setStep(3);
        if (data.venue) setConfirmedVenue(data.venue);
        if (data.event_date) setConfirmedEventDate(data.event_date);
      } else {
        setStep(1);
      }
      setModalStatus(status);
      loadConfig();
      loadStandings(tournament?.slug ?? SITE_CONFIG.nextTournament.slug);
    } catch {
      setFormError(t.common.errorGeneric);
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFacultyAndContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedFaculty = formatFacultyValue(faculty, studyPlace);
    if (!formattedFaculty || (faculty === 'OTHER' && !studyPlace.trim())) {
      setFormError(t.common.requiredField);
      return;
    }
    await runRegistrationCheck(formattedFaculty);
  };

  const handleDownloadIcs = () => {
    downloadIcsFile(
      {
        uid: tournament?.slug ?? SITE_CONFIG.nextTournament.slug,
        title: tournament ? pick(tournament.name) : pick(SITE_CONFIG.nextTournament.name),
        description: `${SITE_CONFIG.clubName} — ${SITE_CONFIG.nextTournament.rounds} ${t.common.roundsCount}, ${SITE_CONFIG.nextTournament.timeControl}`,
        location: tournament ? pick(tournament.venue) : pick(SITE_CONFIG.nextTournament.venue),
        startIso: tournament?.event_date ?? SITE_CONFIG.nextTournament.eventDate,
        endIso: tournament?.end_date ?? SITE_CONFIG.nextTournament.endDate,
      },
      'chess-house-tournament-nov-2026.ics'
    );
  };

  const seatsLeft = tournament?.seatsLeft ?? SITE_CONFIG.nextTournament.capacity;
  const capacity = tournament?.capacity ?? SITE_CONFIG.nextTournament.capacity;
  const activeStandings = standingsCat === 'open' ? standingsOpen : standingsWomen;
  const visibleRounds = rounds.filter((r) => r.category === standingsCat);

  const displayVenue = confirmedVenue
    ? pick(confirmedVenue)
    : tournament
    ? pick(tournament.venue)
    : pick(SITE_CONFIG.nextTournament.venue);

  const displayDateLabel = (() => {
    const startIso = confirmedEventDate ?? tournament?.event_date ?? SITE_CONFIG.nextTournament.eventDate;
    const loc = locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-GB';
    try {
      return new Intl.DateTimeFormat(loc, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(startIso));
    } catch {
      return startIso;
    }
  })();

  const renderModalBody = () => {
    switch (modalStatus) {
      case 'confirmed':
      case 'already_registered':
        return (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {modalStatus === 'confirmed' ? t.tournaments.popups.confirmedBody : t.tournaments.popups.alreadyBody}
            </p>

            {/* Clear Venue & Date block ("show where tournament will be") */}
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-4 space-y-2.5 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[var(--accent-primary)] mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-[var(--text-muted)]">{t.tournaments.popups.whereLabel}</div>
                  <div className="font-semibold text-[var(--text-primary)]">{displayVenue}</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-[var(--accent-primary)] mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-[var(--text-muted)]">{t.tournaments.popups.whenLabel}</div>
                  <div className="font-semibold font-mono-tabular text-[var(--text-primary)]">{displayDateLabel}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-semibold hover:bg-[var(--accent-primary-hover)] whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                {t.common.addToCalendar}
              </button>
              <Link
                to="/my-chess-house"
                className="px-4 py-2 rounded-lg border border-[var(--border-strong)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] whitespace-nowrap"
              >
                {t.nav.myChessHouse} →
              </Link>
              <button
                type="button"
                onClick={() => setModalStatus(null)}
                className="px-4 py-2 rounded-lg border border-[var(--border-strong)] text-sm font-medium whitespace-nowrap"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        );
      case 'fee_unpaid':
      case 'member_unpaid':
        return (
          <div className="space-y-4">
            <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed">
              {t.tournaments.popups.feeUnpaidBody}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/contact"
                className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-semibold whitespace-nowrap"
              >
                {t.tournaments.popups.contactUs}
              </Link>
              <button
                type="button"
                onClick={() => setModalStatus(null)}
                className="px-4 py-2 rounded-lg border border-[var(--border-strong)] text-sm font-medium whitespace-nowrap"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        );
      case 'not_fst':
        return (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {t.tournaments.popups.notFstBody}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/events"
                className="px-4 py-2 rounded-lg bg-[var(--chess-charcoal)] text-[#EEEED2] dark:bg-[var(--accent-gold)] dark:text-[#1B1A17] text-sm font-semibold whitespace-nowrap"
              >
                {t.nav.events} →
              </Link>
              <button
                type="button"
                onClick={() => setModalStatus(null)}
                className="px-4 py-2 rounded-lg border border-[var(--border-strong)] text-sm font-medium whitespace-nowrap"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        );
      case 'auth_required':
        return (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {t.tournaments.popups.authRequiredBody}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/account?next=/tournaments"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-semibold hover:bg-[var(--accent-primary-hover)] whitespace-nowrap"
              >
                <LogIn className="w-4 h-4" />
                {t.tournaments.signInToRegister}
              </Link>
              <button
                type="button"
                onClick={() => setModalStatus(null)}
                className="px-4 py-2 rounded-lg border border-[var(--border-strong)] text-sm font-medium whitespace-nowrap"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        );
      case 'full':
        return (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {t.tournaments.popups.fullBody}
            </p>
            <button
              type="button"
              onClick={() => setModalStatus(null)}
              className="px-4 py-2 rounded-lg border border-[var(--border-strong)] text-sm font-medium"
            >
              {t.common.close}
            </button>
          </div>
        );
      case 'closed':
      default:
        return (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {t.tournaments.popups.closedBody}
            </p>
            <button
              type="button"
              onClick={() => setModalStatus(null)}
              className="px-4 py-2 rounded-lg border border-[var(--border-strong)] text-sm font-medium"
            >
              {t.common.close}
            </button>
          </div>
        );
    }
  };

  const modalTitle =
    modalStatus === 'confirmed'
      ? t.tournaments.popups.confirmedTitle
      : modalStatus === 'already_registered'
      ? t.tournaments.popups.alreadyTitle
      : modalStatus === 'fee_unpaid' || modalStatus === 'member_unpaid'
      ? t.tournaments.popups.feeUnpaidTitle
      : modalStatus === 'not_fst'
      ? t.tournaments.popups.notFstTitle
      : modalStatus === 'auth_required'
      ? t.tournaments.popups.authRequiredTitle
      : modalStatus === 'full'
      ? t.tournaments.popups.fullTitle
      : t.tournaments.popups.closedTitle;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-14">
      {/* Header & Tournament Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
              {t.common.membersOnly}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mt-1">
              {tournament ? pick(tournament.name) : pick(SITE_CONFIG.nextTournament.name)}
            </h1>
            <p className="mt-3 text-base text-[var(--text-secondary)] leading-relaxed">
              {t.tournaments.subtitle}
            </p>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-[var(--accent-primary)] mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold font-mono-tabular text-[var(--text-primary)]">
                    {(() => {
                      const startIso = tournament?.event_date ?? SITE_CONFIG.nextTournament.eventDate;
                      const loc = locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-GB';
                      try {
                        return new Intl.DateTimeFormat(loc, {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        }).format(new Date(startIso));
                      } catch {
                        return startIso.slice(0, 10);
                      }
                    })()}
                  </div>
                  <div className="text-xs font-mono-tabular text-[var(--text-muted)]">
                    {(() => {
                      const startIso = tournament?.event_date ?? SITE_CONFIG.nextTournament.eventDate;
                      const endIso = tournament?.end_date ?? SITE_CONFIG.nextTournament.endDate;
                      const loc = locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-GB';
                      try {
                        const fmt = new Intl.DateTimeFormat(loc, { hour: '2-digit', minute: '2-digit' });
                        return endIso
                          ? `${fmt.format(new Date(startIso))} – ${fmt.format(new Date(endIso))}`
                          : fmt.format(new Date(startIso));
                      } catch {
                        return startIso.slice(11, 16);
                      }
                    })()}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[var(--accent-primary)] mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {tournament ? pick(tournament.venue) : pick(SITE_CONFIG.nextTournament.venue)}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">{t.common.venue}</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[var(--accent-primary)] mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold font-mono-tabular text-[var(--text-primary)]">
                    {tournament?.rounds ?? SITE_CONFIG.nextTournament.rounds} {t.common.roundsCount} ·{' '}
                    {tournament?.time_control ?? SITE_CONFIG.nextTournament.timeControl}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">{t.common.timeControl}</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Users className="w-4 h-4 text-[var(--accent-primary)] mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold font-mono-tabular text-[var(--accent-primary)]">
                    {seatsLeft} / {capacity} {t.common.seatsLeft}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {capacity} {t.common.boardsCount} · {t.common.categoryOpen} & {t.common.categoryWomen}
                  </div>
                </div>
              </div>
            </div>

            {entryFee !== null && (
              <div className="pt-3 border-t border-[var(--border-hairline)] text-sm font-medium text-[var(--text-primary)]">
                Entry fee: {entryFee} MAD
              </div>
            )}

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-strong)] text-xs font-semibold hover:bg-[var(--bg-subtle)]"
              >
                <Download className="w-3.5 h-3.5" />
                {t.common.addToCalendar}
              </button>
            </div>
          </div>

          <ClubImage
            slotId="event-tournament-nov"
            className="w-full h-56 sm:h-64 rounded-xl"
            aspectClass="aspect-[3/2]"
          />
        </div>

        {/* One-Click "I will be there" Sign-up Card */}
        <div className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            {t.tournaments.signupTitle}
          </h2>

          <PawnToQueenTrack
            step={step}
            labels={[t.tournaments.stepDetails, t.tournaments.stepCheck, t.tournaments.stepConfirmed]}
          />

          {user && (
            <div className="text-xs text-[var(--text-secondary)] border-b border-[var(--border-hairline)] pb-3">
              <span>{t.tournaments.registeringAsLabel}: </span>
              <strong className="text-[var(--text-primary)]">{user.displayName}</strong>
              <span aria-hidden="true"> · </span>
              <span>{user.email}</span>
            </div>
          )}

          <div>
            <span className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              {t.tournaments.categoryLabel}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(['open', 'women'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
                    category === cat
                      ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                      : 'bg-[var(--bg-page)] text-[var(--text-secondary)] border-[var(--border-hairline)]'
                  }`}
                >
                  {cat === 'open' ? t.common.categoryOpen : t.common.categoryWomen}
                </button>
              ))}
            </div>
          </div>

          <TurnstileWidget
            onToken={setTurnstileToken}
            honeypot={honeypot}
            onHoneypotChange={setHoneypot}
          />

          {needsFaculty ? (
            <form onSubmit={handleFacultyAndContinue} className="space-y-4 pt-2 border-t border-[var(--border-hairline)]">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{t.tournaments.missingFacultyTitle}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {t.tournaments.missingFacultyBody}
                </p>
              </div>

              <FacultySelector
                faculty={faculty}
                onFacultyChange={setFaculty}
                studyPlace={studyPlace}
                onStudyPlaceChange={setStudyPlace}
                facultyLabel={t.join.facultyLabel}
                othersLabel={t.join.facultyOthersLabel}
                studyPlaceLabel={t.join.studyPlaceLabel}
                studyPlacePlaceholder={t.join.studyPlacePlaceholder}
                studyPlaceOtherPlaceholder={t.join.studyPlaceOtherPlaceholder}
                requireOtherDetail={true}
                inputId="tournament-faculty-study-input"
              />

              {formError && (
                <p role="alert" className="text-xs font-medium text-[var(--danger)]">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-piece-slide w-full py-3 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-semibold hover:bg-[var(--accent-primary-hover)] disabled:opacity-60 whitespace-nowrap"
              >
                {submitting ? t.tournaments.checkingMove : t.tournaments.saveAndContinueCheck}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              {formError && (
                <p role="alert" className="text-xs font-medium text-[var(--danger)]">
                  {formError}
                </p>
              )}

              <button
                type="button"
                onClick={() => runRegistrationCheck()}
                disabled={submitting}
                className="btn-piece-slide w-full py-3.5 px-5 rounded-lg bg-[var(--accent-primary)] text-white text-base font-semibold hover:bg-[var(--accent-primary-hover)] disabled:opacity-60 whitespace-nowrap"
              >
                {submitting ? t.tournaments.checkingMove : t.tournaments.iWillBeThere}
              </button>

              {!user && (
                <p className="text-xs text-[var(--text-muted)] text-center">
                  <Link to="/account?next=/tournaments" className="underline text-[var(--accent-primary)] font-medium">
                    {t.tournaments.signInToRegister}
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Live Pairings & Swiss Standings */}
      <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-[var(--accent-gold)]" />
            <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
              {t.tournaments.standingsTitle}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex border border-[var(--border-hairline)] rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setStandingsCat('open')}
                className={`px-3 py-1.5 text-xs font-semibold ${
                  standingsCat === 'open' ? 'bg-[var(--chess-charcoal)] text-[#EEEED2]' : 'text-[var(--text-secondary)]'
                }`}
              >
                {t.common.categoryOpen}
              </button>
              <button
                type="button"
                onClick={() => setStandingsCat('women')}
                className={`px-3 py-1.5 text-xs font-semibold ${
                  standingsCat === 'women' ? 'bg-[var(--chess-charcoal)] text-[#EEEED2]' : 'text-[var(--text-secondary)]'
                }`}
              >
                {t.common.categoryWomen}
              </button>
            </div>

            <div className="flex border border-[var(--border-hairline)] rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setActiveTab('standings')}
                className={`px-3 py-1.5 text-xs font-semibold ${
                  activeTab === 'standings' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)]'
                }`}
              >
                {t.tournaments.standingsTitle}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rounds')}
                className={`px-3 py-1.5 text-xs font-semibold ${
                  activeTab === 'rounds' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)]'
                }`}
              >
                {t.tournaments.roundsTitle}
              </button>
            </div>
          </div>
        </div>

        {loadingStandings ? (
          <p className="text-sm text-[var(--text-muted)]">{t.common.loading}</p>
        ) : activeTab === 'standings' ? (
          activeStandings.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4">{t.tournaments.noRoundsYet}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-strong)] text-xs uppercase text-[var(--text-muted)]">
                    <th className="py-2.5 px-3 text-start">{t.tournaments.rankCol}</th>
                    <th className="py-2.5 px-3 text-start">{t.tournaments.playerCol}</th>
                    <th className="py-2.5 px-3 text-end font-mono-tabular">{t.tournaments.pointsCol}</th>
                    <th className="py-2.5 px-3 text-end font-mono-tabular">{t.tournaments.buchholzCol}</th>
                    <th className="py-2.5 px-3 text-end font-mono-tabular">{t.tournaments.sbCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStandings.map((row) => (
                    <tr key={row.playerId} className="border-b border-[var(--border-hairline)]">
                      <td className="py-2.5 px-3 font-mono-tabular font-semibold">{row.rank}</td>
                      <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">{row.name}</td>
                      <td className="py-2.5 px-3 text-end font-mono-tabular font-bold text-[var(--accent-primary)]">
                        {row.points}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono-tabular text-[var(--text-secondary)]">
                        {row.buchholz}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono-tabular text-[var(--text-secondary)]">
                        {row.sonnebornBerger}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : visibleRounds.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-4">{t.tournaments.noRoundsYet}</p>
        ) : (
          <div className="space-y-6">
            {visibleRounds.map((rd) => (
              <div key={rd.id} className="space-y-2">
                <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  Round {rd.round_number}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-strong)] text-xs uppercase text-[var(--text-muted)]">
                        <th className="py-2 px-3 text-start">{t.tournaments.boardCol}</th>
                        <th className="py-2 px-3 text-start">{t.tournaments.whiteCol}</th>
                        <th className="py-2 px-3 text-start">{t.tournaments.blackCol}</th>
                        <th className="py-2 px-3 text-end">{t.tournaments.resultCol}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rd.games.map((g) => (
                        <tr key={g.id} className="border-b border-[var(--border-hairline)]">
                          <td className="py-2 px-3 font-mono-tabular">{g.board}</td>
                          <td className="py-2 px-3 font-medium">{g.whiteName}</td>
                          <td className="py-2 px-3 font-medium">{g.blackName}</td>
                          <td className="py-2 px-3 text-end font-mono-tabular font-semibold">{g.result}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <AccessibleModal open={modalStatus !== null} onClose={() => setModalStatus(null)} title={modalTitle}>
        {renderModalBody()}
      </AccessibleModal>
    </div>
  );
};
