import React, { useEffect, useState } from 'react';
import { CalendarPlus, MapPin } from 'lucide-react';
import { CLUB_EVENTS, ClubEventItem } from '../data/clubContent';
import { useI18n } from '../i18n';
import { ClubImage } from '../components/common/ClubImage';
import { AccessibleModal } from '../components/common/AccessibleModal';
import { downloadIcsFile } from '../lib/ics';

export const EventsPage: React.FC = () => {
  const { t, pick } = useI18n();
  const [events, setEvents] = useState<ClubEventItem[]>(CLUB_EVENTS);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [selected, setSelected] = useState<ClubEventItem | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.events) && data.events.length > 0) {
          setEvents(data.events);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const filtered = events.filter((ev) => {
    const past = ev.isPast || Date.parse(ev.dateIso) < Date.now();
    if (filter === 'upcoming') return !past;
    if (filter === 'past') return past;
    return true;
  });

  const handleDownloadIcs = (ev: ClubEventItem) => {
    downloadIcsFile(
      {
        uid: ev.id,
        title: pick(ev.title),
        description: pick(ev.details || ev.summary),
        location: pick(ev.location),
        startIso: ev.dateIso,
        endIso: ev.endIso,
      },
      ev.slug
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <header className="space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">{t.events.title}</h1>
          <p className="text-base text-[var(--text-secondary)]">{t.events.subtitle}</p>
        </header>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)] self-start">
          {(['all', 'upcoming', 'past'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === f
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {f === 'all' ? t.events.filterAll : f === 'upcoming' ? t.events.filterUpcoming : t.events.filterPast}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((ev) => {
          const past = ev.isPast || Date.parse(ev.dateIso) < Date.now();
          return (
            <article
              key={ev.id}
              className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl overflow-hidden flex flex-col"
            >
              <ClubImage slotId={ev.imageSlot} className="w-full aspect-[3/2] object-cover" />
              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-xs text-[var(--text-muted)] font-mono-tabular">
                    {ev.dateIso.slice(0, 10)} · {past ? t.events.filterPast : t.events.filterUpcoming}
                  </div>
                  <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">{pick(ev.title)}</h2>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{pick(ev.summary)}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--border-hairline)]">
                  <button
                    type="button"
                    onClick={() => setSelected(ev)}
                    className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                  >
                    {t.common.viewDetails} →
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadIcs(ev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    {t.common.addToCalendar}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <AccessibleModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? pick(selected.title) : ''}
      >
        {selected && (
          <div className="space-y-4 text-sm text-[var(--text-secondary)]">
            <div className="font-mono-tabular text-xs text-[var(--accent-gold)]">
              {selected.dateIso.slice(0, 10)}
            </div>
            <p className="leading-relaxed">{pick(selected.details || selected.summary)}</p>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{pick(selected.location)}</span>
            </div>
            <button
              type="button"
              onClick={() => handleDownloadIcs(selected)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold"
            >
              <CalendarPlus className="w-4 h-4" />
              {t.common.addToCalendar}
            </button>
          </div>
        )}
      </AccessibleModal>
    </div>
  );
};
