import React, { useEffect, useState } from 'react';
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import { SITE_CONFIG } from '../config/site';
import { useI18n } from '../i18n';
import { TurnstileWidget } from '../components/common/TurnstileWidget';

export const ContactPage: React.FC = () => {
  const { t, pick } = useI18n();
  const [showPersonal, setShowPersonal] = useState(SITE_CONFIG.showPersonalContact);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (typeof data?.settings?.showPersonalContact === 'boolean') {
          setShowPersonal(data.settings.showPersonalContact);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || !email.trim() || !subject.trim() || !message.trim() || !consent) {
      setError(t.common.requiredField);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      <div className="max-w-2xl space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">{t.contact.title}</h1>
        <p className="text-base text-[var(--text-secondary)]">{t.contact.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-[var(--accent-primary)] mt-1 shrink-0" />
              <div>
                <div className="font-semibold text-[var(--text-primary)]">Email</div>
                <a href={`mailto:${SITE_CONFIG.publicEmail}`} className="text-[var(--accent-primary)] hover:underline">
                  {SITE_CONFIG.publicEmail}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ExternalLink className="w-4 h-4 text-[var(--accent-primary)] mt-1 shrink-0" />
              <div>
                <div className="font-semibold text-[var(--text-primary)]">Instagram</div>
                <a
                  href={SITE_CONFIG.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-primary)] hover:underline"
                >
                  {SITE_CONFIG.instagramHandle}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[var(--accent-primary)] mt-1 shrink-0" />
              <div>
                <div className="font-semibold text-[var(--text-primary)]">{pick(SITE_CONFIG.facultyName)}</div>
                <p className="text-xs text-[var(--text-muted)]">{pick(SITE_CONFIG.universityName)}</p>
                <a
                  href={SITE_CONFIG.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-1 text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                >
                  Google Maps →
                </a>
              </div>
            </div>

            {showPersonal && (
              <div className="pt-3 border-t border-[var(--border-hairline)] flex items-start gap-3">
                <Phone className="w-4 h-4 text-[var(--accent-gold)] mt-1 shrink-0" />
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">{SITE_CONFIG.personalContact.name}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{SITE_CONFIG.personalContact.email}</div>
                  <div className="text-xs font-mono-tabular text-[var(--text-secondary)]">
                    {SITE_CONFIG.personalContact.phone}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8">
          {sent ? (
            <p className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--accent-primary)] text-sm">
              {t.contact.sentMsg}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t.tournaments.fullNameLabel} *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
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
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t.contact.subjectLabel} *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t.contact.messageLabel} *</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
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
                {submitting ? t.common.loading : t.contact.sendBtn}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
