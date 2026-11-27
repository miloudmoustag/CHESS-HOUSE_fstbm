import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ChessPieceSvg } from './ChessPieceSvg';

interface PawnToQueenTrackProps {
  step: 1 | 2 | 3; // 1 = Details, 2 = Check, 3 = Confirmed (Promoted!)
  labels: [string, string, string];
}

export const PawnToQueenTrack: React.FC<PawnToQueenTrackProps> = ({ step, labels }) => {
  useEffect(() => {
    if (step === 3 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      confetti({
        particleCount: 48,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#769656', '#C9A24B', '#EEEED2'],
      });
    }
  }, [step]);

  return (
    <div className="mb-6" aria-label="Registration progress">
      <div className="grid grid-cols-3 gap-2 items-center">
        {([1, 2, 3] as const).map((idx) => {
          const isReached = step >= idx;
          const isCurrent = step === idx;
          const isPromoted = idx === 3 && step === 3;

          return (
            <div key={idx} className="flex flex-col items-center text-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-transform duration-200 ${
                  isPromoted
                    ? 'bg-[var(--accent-gold)] border-[var(--accent-gold)] scale-110'
                    : isReached
                    ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]'
                    : 'bg-[var(--bg-subtle)] border-[var(--border-hairline)]'
                }`}
              >
                {isCurrent || isPromoted ? (
                  <ChessPieceSvg type={isPromoted ? 'q' : 'p'} color="w" className="w-7 h-7" />
                ) : (
                  <span
                    className={`text-xs font-mono-tabular font-semibold ${
                      isReached ? 'text-white' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {idx}
                  </span>
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  isReached ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                }`}
              >
                {labels[idx - 1]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
