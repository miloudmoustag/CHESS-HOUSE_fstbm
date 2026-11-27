import React from 'react';
import { SITE_CONFIG } from '../config/site';
import { useI18n } from '../i18n';

export const PrivacyPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
        {t.legal.privacyTitle}
      </h1>
      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          {SITE_CONFIG.clubName} (FST Béni Mellal, {SITE_CONFIG.universityName.en}) collects only the data strictly
          needed to verify student club membership, manage tournament pairings, respond to enquiries, and save study
          progress.
        </p>
        <p>
          Public pages never expose student IDs, emails, phone numbers, or the member directory. Only explicit opt-in
          display names appear on the Hall of Fame roll, and verified tournament pairings show player names for the event.
        </p>
        <p>
          In accordance with Moroccan Law 09-08 on the protection of personal data, you may request access, correction, or
          deletion of your club records at any time by writing to{' '}
          <a href={`mailto:${SITE_CONFIG.publicEmail}`} className="text-[var(--accent-primary)] hover:underline">
            {SITE_CONFIG.publicEmail}
          </a>
          .
        </p>
      </div>
    </div>
  );
};
