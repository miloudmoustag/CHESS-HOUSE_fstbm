import React, { useEffect, useState } from 'react';
import { Globe, ShieldCheck, Trophy, Users } from 'lucide-react';
import { INITIAL_LEAGUE_CLUBS, LeagueClubRow } from '../data/clubContent';
import { SITE_CONFIG } from '../config/site';
import { useI18n } from '../i18n';
import { TurnstileWidget } from '../components/common/TurnstileWidget';
import { ClubImage } from '../components/common/ClubImage';

export const LeaguePage: React.FC = () => {
  const { t } = useI18n();
  const [clubs, setClubs] = useState<LeagueClubRow[]>(INITIAL_LEAGUE_CLUBS);
  const [stats, setStats] = useState(SITE_CONFIG.stats);
  const [clubName, setClubName] = useState('');
  const [university, setUniversity] = useState('');
  const [captain, setCaptain] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (Array.isArray(data.clubs) && data.clubs.length > 0) {
          setClubs(data.clubs);
        }
        if (data.settings) {
          setStats((prev) => ({
            ...prev,
            clubsReached: data.settings.clubsReached ?? prev.clubsReached,
            iuccUniversities: data.settings.iuccUniversities ?? prev.iuccUniversities,
            iuccStudents: data.settings.iuccStudents ?? prev.iuccStudents,
          }));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!clubName.trim() || !university.trim() || !captain.trim() || !email.trim() || !consent) {
      setError(t.common.requiredField);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'interuni_club',
          organisation: `${clubName.trim()} — ${university.trim()}`,
          contactName: captain.trim(),
          email: email.trim(),
          details: `Inter-University League Team Application (${university.trim()})`,
          consent,
          turnstileToken,
          website: honeypot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.common.errorGeneric);
        return;
      }
      setSubmitted(true);
    } catch {
      setError(t.common.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
            {t.league.platformLabel}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
            {t.league.title}
          </h1>
          <p className="text-base text-[var(--text-secondary)] leading-relaxed">{t.league.subtitle}</p>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-4">
              <div className="text-2xl font-bold font-mono-tabular text-[var(--accent-primary)]">
                {stats.clubsReached}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{t.home.statClubs}</div>
            </div>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-4">
              <div className="text-2xl font-bold font-mono-tabular text-[var(--accent-primary)]">
                {stats.iuccUniversities}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Universities (IUCC)</div>
            </div>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-4">
              <div className="text-2xl font-bold font-mono-tabular text-[var(--accent-primary)]">
                {stats.iuccStudents}+
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{t.home.statStudents}</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <ClubImage slotId="event-iucc" className="rounded-xl w-full" aspectClass="aspect-[3/2]" />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[var(--accent-gold)]" />
              <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
                {t.league.clubsBoardTitle}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-strong)] text-xs uppercase text-[var(--text-muted)]">
                    <th className="py-2 px-3 text-start">#</th>
                    <th className="py-2 px-3 text-start">{t.league.clubNameLabel}</th>
                    <th className="py-2 px-3 text-start">{t.league.universityLabel}</th>
                    <th className="py-2 px-3 text-end font-mono-tabular">{t.tournaments.pointsCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {clubs.map((row, idx) => (
                    <tr key={row.id} className="border-b border-[var(--border-hairline)]">
                      <td className="py-2.5 px-3 font-mono-tabular font-semibold">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-[var(--text-primary)]">{row.clubName}</td>
                      <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                        {row.university} · <span className="text-xs text-[var(--text-muted)]">{row.city}</span>
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono-tabular font-bold text-[var(--accent-primary)]">
                        {row.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[var(--accent-primary)]" />
              <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
                {t.league.rulesTitle}
              </h2>
            </div>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)] list-disc ps-5">
              {t.league.rulesList.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">
              {t.league.registerClubTitle}
            </h2>
          </div>

          {submitted ? (
            <div className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--accent-primary)] text-sm text-[var(--text-primary)] flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[var(--accent-primary)] shrink-0 mt-0.5" />
              <span>{t.league.clubSubmitted}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t.league.clubNameLabel} *</label>
                <input
                  type="text"
                  required
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.league.universityLabel} *</label>
                <input
                  type="text"
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.league.captainLabel} *</label>
                <input
                  type="text"
                  required
                  value={captain}
                  onChange={(e) => setCaptain(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.league.emailLabel} *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-sm"
                />
              </div>
              <label className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="mt-0.5 rounded"
                />
                <span>{t.common.consentLabel}</span>
              </label>

              <TurnstileWidget onToken={setTurnstileToken} honeypot={honeypot} onHoneypotChange={setHoneypot} />

              {error && <p role="alert" className="text-xs text-[var(--danger)]">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="btn-piece-slide w-full py-3 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-semibold hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
              >
                {submitting ? t.common.loading : t.league.submitClub}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
