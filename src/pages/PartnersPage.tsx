import React, { useState } from 'react';
import { Check, Download, Handshake } from 'lucide-react';
import { PARTNER_TIERS } from '../data/clubContent';
import { SITE_CONFIG } from '../config/site';
import { useI18n } from '../i18n';
import { ClubImage } from '../components/common/ClubImage';
import { TurnstileWidget } from '../components/common/TurnstileWidget';

export const PartnersPage: React.FC = () => {
  const { t, locale, pick } = useI18n();
  const [organisation, setOrganisation] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [details, setDetails] = useState('');
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!organisation.trim() || !contactName.trim() || !email.trim() || !consent) {
      setError(t.common.requiredField);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'partner',
          organisation: organisation.trim(),
          contactName: contactName.trim(),
          email: email.trim(),
          details: details.trim(),
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
      setSent(true);
    } catch {
      setError(t.common.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-14">
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="max-w-2xl space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
            {t.partners.title}
          </h1>
          <p className="text-base text-[var(--text-secondary)] leading-relaxed">{t.partners.subtitle}</p>
        </div>
        <a
          href="/docs/dossier-sponsoring-fr.pdf"
          download
          className="btn-piece-slide inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[var(--chess-charcoal)] text-[#EEEED2] dark:bg-[var(--accent-gold)] dark:text-[#1B1A17] text-sm font-semibold whitespace-nowrap self-start"
        >
          <Download className="w-4 h-4" />
          {t.partners.dossierBtn}
        </a>
      </section>

      {/* Why Partner & Audience Reach */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 space-y-4">
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">{t.partners.whyTitle}</h2>
          <ul className="space-y-3">
            {t.partners.whyPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                <Check className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5 bg-[var(--chess-charcoal)] text-[#EEEED2] rounded-xl p-6 sm:p-8 space-y-4">
          <h2 className="font-display text-2xl font-bold">{t.partners.reachTitle}</h2>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <div className="text-3xl font-bold font-mono-tabular text-[#C9A24B]">
                {SITE_CONFIG.stats.clubsReached}
              </div>
              <div className="text-xs text-[#C8C4B8] mt-1">{t.home.statClubs}</div>
            </div>
            <div>
              <div className="text-3xl font-bold font-mono-tabular text-[#C9A24B]">
                {SITE_CONFIG.stats.iuccStudents}+
              </div>
              <div className="text-xs text-[#C8C4B8] mt-1">{t.home.statStudents}</div>
            </div>
            <div>
              <div className="text-3xl font-bold font-mono-tabular text-[#C9A24B]">~50–60</div>
              <div className="text-xs text-[#C8C4B8] mt-1">Thursday open-play turnout</div>
            </div>
            <div>
              <div className="text-3xl font-bold font-mono-tabular text-[#C9A24B]">15+</div>
              <div className="text-xs text-[#C8C4B8] mt-1">Campus & regional events</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="space-y-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">{t.partners.tiersTitle}</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">{t.partners.tiersNote}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PARTNER_TIERS.map((tier) => (
            <div
              key={tier.id}
              className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 flex flex-col justify-between gap-4"
            >
              <div>
                <p className="text-xs font-mono-tabular text-[var(--accent-gold)]">{pick(tier.contribution)}</p>
                <h3 className="font-display text-xl font-bold text-[var(--text-primary)] mt-1">{pick(tier.name)}</h3>
                <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                  {tier.benefits[locale].map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Partner Placeholder Logo Grid + Form */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-4">
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Partner Slots</h2>
          <div className="grid grid-cols-2 gap-4">
            {(['partner-01', 'partner-02', 'partner-03', 'partner-04'] as const).map((slot) => (
              <ClubImage key={slot} slotId={slot} aspectClass="aspect-[2/1]" className="rounded-lg" />
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Handshake className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">{t.partners.formTitle}</h2>
          </div>

          {sent ? (
            <p className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--accent-primary)] text-sm">
              {t.partners.enquirySent}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t.partners.orgLabel} *</label>
                  <input
                    type="text"
                    required
                    value={organisation}
                    onChange={(e) => setOrganisation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.tournaments.fullNameLabel} *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-sm"
                  />
                </div>
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
              <div>
                <label className="block text-sm font-medium mb-1">{t.contact.messageLabel}</label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
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
                className="btn-piece-slide px-6 py-3 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-semibold hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
              >
                {submitting ? t.common.loading : t.partners.submitEnquiry}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
