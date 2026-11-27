import React from 'react';
import { SITE_CONFIG } from '../config/site';
import { useI18n } from '../i18n';

export const LegalPage: React.FC = () => {
  const { t, pick } = useI18n();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">{t.legal.legalTitle}</h1>
      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          <strong>Publisher:</strong> {SITE_CONFIG.clubName} ({SITE_CONFIG.clubVariantName}), student cultural and
          sports club founded on 18 October 2025 at {pick(SITE_CONFIG.facultyName)}, {pick(SITE_CONFIG.universityName)}.
        </p>
        <p>
          <strong>Contact:</strong> {SITE_CONFIG.publicEmail} · {SITE_CONFIG.instagramHandle}
        </p>
        <p>
          <strong>Hosting & Infrastructure:</strong> Non-commercial student association platform hosted on Vercel and
          Supabase free tiers with Cloudflare Turnstile abuse protection.
        </p>
      </div>
    </div>
  );
};
