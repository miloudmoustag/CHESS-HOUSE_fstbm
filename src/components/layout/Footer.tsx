import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_CONFIG } from '../../config/site';
import { CLUB_LOGOS } from '../../data/images';
import { useI18n } from '../../i18n';

export const Footer: React.FC = () => {
  const { t, pick } = useI18n();

  return (
    <footer className="bg-[var(--bg-surface)] border-t border-[var(--border-hairline)] mt-16 pb-20 md:pb-8 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={CLUB_LOGOS.club.src}
                alt={pick(CLUB_LOGOS.club.alt)}
                width={44}
                height={44}
                className="w-11 h-11 rounded-md border border-[var(--border-hairline)]"
              />
              <img
                src={CLUB_LOGOS.fst.src}
                alt={pick(CLUB_LOGOS.fst.alt)}
                width={44}
                height={44}
                className="w-11 h-11 rounded-md border border-[var(--border-hairline)]"
              />
            </div>
            <p className="font-display text-lg font-bold text-[var(--text-primary)]">{SITE_CONFIG.clubVariantName}</p>
            <p className="text-xs text-[var(--text-secondary)]">{t.footer.founded}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link to="/about" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{t.nav.about}</Link>
            <Link to="/tournaments" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{t.nav.tournaments}</Link>
            <Link to="/academy" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{t.nav.academy}</Link>
            <Link to="/events" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{t.nav.events}</Link>
            <Link to="/my-chess-house" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{t.nav.myChessHouse}</Link>
            <Link to="/league" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{t.nav.league}</Link>
            <Link to="/partners" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{t.nav.partners}</Link>
            <Link to="/documents" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{t.nav.documents}</Link>
            <Link to="/privacy" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{t.nav.privacy}</Link>
            <Link to="/legal" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{t.nav.legal}</Link>
          </div>

          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">{pick(SITE_CONFIG.facultyName)}</p>
            <p>
              <a href={`mailto:${SITE_CONFIG.publicEmail}`} className="hover:underline">
                {SITE_CONFIG.publicEmail}
              </a>
            </p>
            <p>
              <a
                href={SITE_CONFIG.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Instagram {SITE_CONFIG.instagramHandle}
              </a>
            </p>
            {SITE_CONFIG.showPersonalContact && (
              <p className="text-xs text-[var(--text-muted)]">
                {SITE_CONFIG.personalContact.name} · {SITE_CONFIG.personalContact.email} · {SITE_CONFIG.personalContact.phone}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          <span>{t.footer.rights}</span>
          <span>{pick(SITE_CONFIG.cityCountry)}</span>
        </div>
      </div>
    </footer>
  );
};
