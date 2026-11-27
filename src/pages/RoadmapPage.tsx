import React, { useEffect, useRef, useState } from 'react';
import { SITE_CONFIG } from '../config/site';
import { useI18n } from '../i18n';
import { ChessPieceSvg } from '../components/chess/ChessPieceSvg';

export const RoadmapPage: React.FC = () => {
  const { t, pick } = useI18n();
  const [activeStop, setActiveStop] = useState(2); // Highlighted next step (Nov championship)
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current) return;
      const items = containerRef.current.querySelectorAll<HTMLElement>('[data-roadmap-step]');
      let bestIdx = 0;
      let bestDist = Infinity;
      const midY = window.innerHeight * 0.42;
      items.forEach((el, idx) => {
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height / 2 - midY);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });
      setActiveStop(bestIdx);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const statusLabel = (s: 'completed' | 'active' | 'next' | 'upcoming') => {
    if (s === 'completed') return t.roadmap.statusCompleted;
    if (s === 'active') return t.roadmap.statusActive;
    if (s === 'next') return t.roadmap.statusNext;
    return t.roadmap.statusUpcoming;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">{t.roadmap.title}</h1>
        <p className="text-base text-[var(--text-secondary)]">{t.roadmap.subtitle}</p>
      </header>

      <div ref={containerRef} className="relative space-y-6">
        {SITE_CONFIG.roadmap2026_27.map((step, idx) => {
          const isKnightHere = activeStop === idx;
          const isLightSquare = idx % 2 === 0;
          const isNext = step.status === 'next';

          return (
            <div
              key={step.id}
              data-roadmap-step
              onClick={() => setActiveStop(idx)}
              className="flex items-stretch gap-4 sm:gap-6 cursor-pointer"
            >
              {/* Chessboard Square Column */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  style={{
                    backgroundColor: isKnightHere
                      ? '#C9A24B'
                      : isLightSquare
                      ? 'var(--bg-board-light)'
                      : 'var(--bg-board-dark)',
                  }}
                  className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center transition-transform duration-200 ${
                    isKnightHere ? 'border-[var(--chess-charcoal)] scale-105' : 'border-[var(--border-strong)]'
                  } ${isNext && !isKnightHere ? 'ring-2 ring-[#C9A24B]' : ''}`}
                >
                  {isKnightHere ? (
                    <ChessPieceSvg type="n" color="w" className="w-9 h-9" />
                  ) : (
                    <span
                      className={`text-sm font-mono-tabular font-bold ${
                        isLightSquare ? 'text-[#262421]' : 'text-[#EEEED2]'
                      }`}
                    >
                      {`e${idx + 1}`}
                    </span>
                  )}
                </div>
                {idx < SITE_CONFIG.roadmap2026_27.length - 1 && (
                  <div className="w-0.5 flex-1 bg-[var(--border-strong)] my-1 min-h-[24px]" />
                )}
              </div>

              {/* Event Card */}
              <div
                className={`flex-1 rounded-xl p-5 border transition-colors ${
                  isKnightHere
                    ? 'bg-[var(--bg-surface)] border-[var(--accent-gold)] shadow-sm'
                    : 'bg-[var(--bg-surface)] border-[var(--border-hairline)]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)] mb-1">
                  <span className="font-mono-tabular font-semibold text-[var(--accent-primary)]">
                    {pick(step.period)}
                  </span>
                  <span>{statusLabel(step.status)}</span>
                </div>
                <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">{pick(step.title)}</h2>
                <p className="mt-1.5 text-sm text-[var(--text-secondary)] leading-relaxed">{pick(step.description)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
