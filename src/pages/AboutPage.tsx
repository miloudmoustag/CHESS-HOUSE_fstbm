import React from 'react';
import { SITE_CONFIG } from '../config/site';
import { CLUB_LOGOS } from '../data/images';
import { useI18n } from '../i18n';
import { ClubImage } from '../components/common/ClubImage';
import { MoveListNav } from '../components/common/MoveListNav';

export const AboutPage: React.FC = () => {
  const { t, pick } = useI18n();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-[var(--border-hairline)] pb-8">
        <div className="space-y-2 max-w-2xl">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">{t.about.title}</h1>
          <p className="text-base text-[var(--text-secondary)]">{t.about.subtitle}</p>
        </div>
        <img
          src={CLUB_LOGOS.fst.src}
          alt={pick(CLUB_LOGOS.fst.alt)}
          width={64}
          height={64}
          className="w-16 h-16 rounded-lg border border-[var(--border-hairline)] shrink-0"
        />
      </header>

      <MoveListNav
        items={[
          { id: 'story', moveNumber: 1, label: t.about.storyTitle },
          { id: 'principles', moveNumber: 2, label: t.about.principlesTitle },
          { id: 'board', moveNumber: 3, label: t.about.boardTitle },
          { id: 'history', moveNumber: 4, label: t.about.historyTitle },
        ]}
      />

      <section id="story" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">{t.about.storyTitle}</h2>
            <p className="mt-2 text-[var(--text-secondary)] leading-relaxed">{t.about.storyBody}</p>
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">{t.about.missionTitle}</h3>
            <p className="mt-2 text-[var(--text-secondary)] leading-relaxed">{t.about.missionBody}</p>
          </div>
        </div>
        <div className="lg:col-span-5">
          <ClubImage
            slotId="hero-club"
            className="w-full aspect-[3/2] object-cover rounded-xl border border-[var(--border-hairline)]"
          />
        </div>
      </section>

      <section id="principles" className="space-y-6">
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">{t.about.principlesTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.about.principles.map((p, idx) => (
            <div
              key={p.title}
              className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-2"
            >
              <span className="text-xs font-mono-tabular font-semibold text-[var(--accent-gold)]">0{idx + 1}.</span>
              <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">{p.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="board" className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">{t.about.boardTitle}</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{t.about.boardSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SITE_CONFIG.board2026_27.map((member) => (
            <div
              key={member.id}
              className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl overflow-hidden flex flex-col"
            >
              <ClubImage slotId={member.imageSlot} className="w-full aspect-[4/5] object-cover" />
              <div className="p-4 space-y-1.5 flex-1">
                <p className="text-xs font-semibold text-[var(--accent-primary)]">{pick(member.role)}</p>
                <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">{member.name}</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{pick(member.bio)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="history"
        className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 space-y-4"
      >
        <div>
          <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">{t.about.historyTitle}</h2>
          <p className="text-sm text-[var(--text-secondary)]">{t.about.historySubtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {SITE_CONFIG.board2025_26.map((m) => (
            <div key={m.name} className="p-4 rounded-lg bg-[var(--bg-subtle)]">
              <div className="text-xs text-[var(--text-muted)]">{pick(m.role)}</div>
              <div className="font-semibold text-[var(--text-primary)] mt-0.5">{m.name}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
