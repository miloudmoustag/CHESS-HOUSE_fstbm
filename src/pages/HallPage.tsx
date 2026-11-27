import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Shield } from 'lucide-react';
import { SITE_CONFIG } from '../config/site';
import { useI18n } from '../i18n';
import { supabase } from '../lib/supabase';
import { computePassportLevel } from '../lib/passport';
import { ChessPieceSvg } from '../components/chess/ChessPieceSvg';

interface LeaderboardEntry {
  id: string;
  displayName: string;
  xpTotal: number;
  badgesCount: number;
  levelTitle: { fr: string; en: string; ar: string };
}

interface HallConfigSummary {
  nextTournamentName?: { fr: string; en: string; ar: string };
  nextTournamentDate?: string;
  nextTournamentVenue?: { fr: string; en: string; ar: string };
  nextTournamentRounds?: number;
  clubsReached: number;
  iuccUniversities: number;
  iuccStudents: number;
}

export const HallPage: React.FC = () => {
  const { t, pick, locale } = useI18n();
  const [members, setMembers] = useState<LeaderboardEntry[]>([]);
  const [summary, setSummary] = useState<HallConfigSummary>({
    clubsReached: SITE_CONFIG.stats.clubsReached,
    iuccUniversities: SITE_CONFIG.stats.iuccUniversities,
    iuccStudents: SITE_CONFIG.stats.iuccStudents,
  });

  useEffect(() => {
    let active = true;

    async function loadHallData() {
      try {
        const res = await fetch('/api/config');
        if (res.ok && active) {
          const data = await res.json();
          setSummary({
            nextTournamentName: data.nextTournament?.name,
            nextTournamentDate: data.nextTournament?.event_date,
            nextTournamentVenue: data.nextTournament?.venue,
            nextTournamentRounds: data.nextTournament?.rounds,
            clubsReached: data.settings?.clubsReached ?? SITE_CONFIG.stats.clubsReached,
            iuccUniversities: data.settings?.iuccUniversities ?? SITE_CONFIG.stats.iuccUniversities,
            iuccStudents: data.settings?.iuccStudents ?? SITE_CONFIG.stats.iuccStudents,
          });
          if (Array.isArray(data.featuredPlayers) && data.featuredPlayers.length > 0) {
            setMembers(
              data.featuredPlayers
                .filter((p: { source?: string }) => p.source === 'passport')
                .map(
                  (p: {
                    id: string;
                    displayName: string;
                    xpTotal: number;
                    badgesCount: number;
                    levelTitle: { fr: string; en: string; ar: string };
                  }) => ({
                    id: p.id,
                    displayName: p.displayName,
                    xpTotal: p.xpTotal,
                    badgesCount: p.badgesCount,
                    levelTitle: p.levelTitle,
                  })
                )
            );
          }
        }
      } catch {
        // ignore network errors
      }

      if (supabase) {
        const { data } = await supabase
          .from('passport_public_leaderboard')
          .select('user_id, display_name, xp_total, badges_count')
          .order('xp_total', { ascending: false })
          .limit(20);
        if (active && data && data.length > 0) {
          setMembers(
            data.map((row) => {
              const xp = Number(row.xp_total) || 0;
              return {
                id: row.user_id,
                displayName: row.display_name,
                xpTotal: xp,
                badgesCount: Number(row.badges_count) || 0,
                levelTitle: computePassportLevel(xp).title,
              };
            })
          );
        }
      }
    }

    loadHallData();
    return () => {
      active = false;
    };
  }, []);

  const nextTournamentDateLabel = (() => {
    const iso = summary.nextTournamentDate ?? SITE_CONFIG.nextTournament.eventDate;
    const loc = locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-GB';
    try {
      return new Intl.DateTimeFormat(loc, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
    } catch {
      return iso.slice(0, 10);
    }
  })();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">
      <div className="max-w-2xl space-y-3">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">{t.hall.title}</h1>
        <p className="text-base text-[var(--text-secondary)]">{t.hall.subtitle}</p>
      </div>

      {/* Club Honors */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-gold-bg)] p-2">
            <ChessPieceSvg type="k" color="w" />
          </div>
          <p className="text-xs font-mono-tabular text-[var(--accent-gold)]">2025 / 2026</p>
          <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">Founding Board Honour</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Oussama Idlil, Miloud Moustage & Mohamed Farsaoui — launched Chess House Club on 18 October 2025.
          </p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-gold-bg)] p-2">
            <ChessPieceSvg type="q" color="b" />
          </div>
          <p className="text-xs font-mono-tabular text-[var(--accent-gold)]">
            IUCC · {summary.clubsReached} CLUBS
          </p>
          <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">Inter-University Squad</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Represented FST Béni Mellal across {summary.iuccUniversities} universities and {summary.iuccStudents}+
            student competitors online.
          </p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-gold-bg)] p-2">
            <ChessPieceSvg type="n" color="w" />
          </div>
          <p className="text-xs font-mono-tabular text-[var(--accent-gold)]">{nextTournamentDateLabel}</p>
          <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
            {summary.nextTournamentName ? pick(summary.nextTournamentName) : 'Internal Rapid Podium'}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Open & Women Champions will be enshrined here after Round{' '}
            {summary.nextTournamentRounds ?? SITE_CONFIG.nextTournament.rounds} at{' '}
            {summary.nextTournamentVenue
              ? pick(summary.nextTournamentVenue)
              : pick(SITE_CONFIG.nextTournament.venue)}
            .
          </p>
        </div>
      </section>

      {/* Opt-in Chess House Passport & Club Roll */}
      <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-[var(--accent-gold)]" />
            <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
              {t.myHouse.passportTitle} · {t.hall.title}
            </h2>
          </div>
          <Link to="/my-chess-house" className="text-xs font-semibold text-[var(--accent-primary)] hover:underline">
            {t.nav.myChessHouse} →
          </Link>
        </div>

        <p className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
          <span>
            {t.hall.optInNote} {t.myHouse.xpSeparationNote}
          </span>
        </p>

        {members.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-2">
            Only members who explicitly opt in from My Chess House or Account settings are displayed publicly here.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m, i) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)]"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-tabular font-bold text-[var(--accent-gold)]">#{i + 1}</span>
                    <span className="font-semibold text-sm text-[var(--text-primary)] truncate">{m.displayName}</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-mono-tabular">
                    {pick(m.levelTitle)} · {m.badgesCount} badges
                  </div>
                </div>
                <span className="font-mono-tabular text-xs font-bold text-[var(--accent-primary)] shrink-0">
                  {m.xpTotal} XP
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
