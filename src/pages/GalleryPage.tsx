import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { GalleryEntry, INITIAL_GALLERY } from '../data/clubContent';
import { useI18n } from '../i18n';
import { ClubImage } from '../components/common/ClubImage';

export const GalleryPage: React.FC = () => {
  const { t, pick } = useI18n();
  const [filter, setFilter] = useState<'all' | GalleryEntry['category']>('all');
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const items = INITIAL_GALLERY.filter((item) => filter === 'all' || item.category === filter);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null);
      else if (e.key === 'ArrowRight') setLightboxIdx((i) => (i === null ? null : (i + 1) % items.length));
      else if (e.key === 'ArrowLeft') setLightboxIdx((i) => (i === null ? null : (i - 1 + items.length) % items.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx, items.length]);

  const categories: { id: 'all' | GalleryEntry['category']; label: string }[] = [
    { id: 'all', label: t.gallery.filterAll },
    { id: 'sessions', label: 'Sessions' },
    { id: 'tournaments', label: 'Tournaments' },
    { id: 'events', label: 'Events' },
    { id: 'board', label: 'Board' },
  ];

  const activeItem = lightboxIdx !== null ? items[lightboxIdx] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">{t.gallery.title}</h1>
          <p className="text-base text-[var(--text-secondary)]">{t.gallery.subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setFilter(cat.id);
                setLightboxIdx(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filter === cat.id
                  ? 'bg-[var(--chess-charcoal)] text-[#EEEED2] border-[var(--chess-charcoal)] dark:bg-[var(--accent-primary)] dark:border-[var(--accent-primary)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-hairline)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map((entry, idx) => {
          const isFlipped = flippedId === entry.id;
          return (
            <div
              key={entry.id}
              className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl overflow-hidden flex flex-col justify-between"
            >
              <button
                type="button"
                onClick={() => setLightboxIdx(idx)}
                className="block w-full text-start focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]"
              >
                <ClubImage slotId={entry.imageSlot} aspectClass="aspect-[3/2]" className="rounded-none" />
              </button>

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono-tabular">
                  <span>{entry.dateLabel}</span>
                  <button
                    type="button"
                    onClick={() => setFlippedId(isFlipped ? null : entry.id)}
                    className="text-[var(--accent-primary)] font-sans font-semibold hover:underline"
                  >
                    {isFlipped ? t.common.close : t.common.viewDetails}
                  </button>
                </div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{pick(entry.caption)}</p>
                {isFlipped && (
                  <p className="text-xs text-[var(--text-secondary)] pt-1 border-t border-[var(--border-hairline)]">
                    Chess House Club Archive · FST Béni Mellal ({entry.category})
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={pick(activeItem.caption)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxIdx(null);
          }}
        >
          <div className="relative max-w-4xl w-full bg-[var(--bg-surface)] rounded-xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-mono-tabular text-[var(--text-muted)]">{activeItem.dateLabel}</p>
                <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">{pick(activeItem.caption)}</h2>
              </div>
              <button
                type="button"
                onClick={() => setLightboxIdx(null)}
                aria-label={t.common.close}
                className="p-2 rounded-lg hover:bg-[var(--bg-subtle)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ClubImage slotId={activeItem.imageSlot} aspectClass="aspect-[3/2]" className="w-full" />

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setLightboxIdx((i) => (i === null ? 0 : (i - 1 + items.length) % items.length))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-xs font-semibold"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <span className="text-xs font-mono-tabular text-[var(--text-muted)]">
                {(lightboxIdx ?? 0) + 1} / {items.length}
              </span>
              <button
                type="button"
                onClick={() => setLightboxIdx((i) => (i === null ? 0 : (i + 1) % items.length))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-xs font-semibold"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
