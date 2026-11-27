import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_CONFIG } from '../config/site';
import { useI18n } from '../i18n';
import { ChessPieceSvg } from '../components/chess/ChessPieceSvg';

export const ActivitiesPage: React.FC = () => {
  const { t, pick } = useI18n();

  const days = [
    { key: 'mon', label: { fr: 'Lundi', en: 'Monday', ar: 'الإثنين' }, session: SITE_CONFIG.weeklySessions[0], piece: 'n' as const },
    { key: 'tue', label: { fr: 'Mardi', en: 'Tuesday', ar: 'الثلاثاء' }, session: null, piece: null },
    { key: 'wed', label: { fr: 'Mercredi', en: 'Wednesday', ar: 'الأربعاء' }, session: null, piece: null },
    { key: 'thu', label: { fr: 'Jeudi', en: 'Thursday', ar: 'الخميس' }, session: SITE_CONFIG.weeklySessions[1], piece: 'r' as const },
    { key: 'fri', label: { fr: 'Vendredi', en: 'Friday', ar: 'الجمعة' }, session: null, piece: null },
    { key: 'sat', label: { fr: 'Samedi / Soir', en: 'Weekend / Online', ar: 'نهاية الأسبوع' }, session: SITE_CONFIG.weeklySessions[2], piece: 'q' as const },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      <header className="space-y-2 max-w-2xl">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">{t.activities.title}</h1>
        <p className="text-base text-[var(--text-secondary)]">{t.activities.subtitle}</p>
      </header>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">{t.activities.calendarTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {days.map((d, idx) => {
            const isActive = Boolean(d.session);
            return (
              <div
                key={d.key}
                className={`rounded-xl p-5 border transition-colors ${
                  isActive
                    ? 'bg-[var(--bg-surface)] border-[var(--accent-primary)]'
                    : 'bg-[var(--bg-subtle)]/60 border-[var(--border-hairline)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-display text-lg font-bold text-[var(--text-primary)]">{pick(d.label)}</span>
                  {d.piece ? (
                    <div className="w-8 h-8">
                      <ChessPieceSvg type={d.piece} color={idx % 2 === 0 ? 'w' : 'b'} />
                    </div>
                  ) : (
                    <span className="text-xs font-mono-tabular text-[var(--text-muted)]">·</span>
                  )}
                </div>
                {d.session ? (
                  <div className="space-y-1.5 text-sm">
                    <div className="font-mono-tabular text-xs font-semibold text-[var(--accent-gold)]">
                      {d.session.time}
                    </div>
                    <p className="text-[var(--text-primary)] font-medium">{pick(d.session.focus)}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {pick(d.session.room)} · {d.session.attendance}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-muted)]">—</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-3">
          <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">{t.activities.trainingTitle}</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{t.activities.trainingBody}</p>
          <Link to="/academy" className="inline-block text-sm font-semibold text-[var(--accent-primary)] hover:underline">
            {t.home.ctaLearn} →
          </Link>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-3">
          <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">{t.activities.onlineTitle}</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{t.activities.onlineBody}</p>
          <Link to="/league" className="inline-block text-sm font-semibold text-[var(--accent-primary)] hover:underline">
            {t.nav.league} →
          </Link>
        </div>
      </section>
    </div>
  );
};
