import React, { useEffect, useState } from 'react';
import { ChessPieceSvg } from './ChessPieceSvg';

// Valid knight tour cycle across outer squares of a 3x3 grid
const KNIGHT_PATH = [0, 7, 2, 3, 8, 1, 6, 5];

export const KnightsTourLoader: React.FC<{ label?: string }> = ({ label }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % KNIGHT_PATH.length);
    }, 280);
    return () => window.clearInterval(id);
  }, []);

  const activeCell = KNIGHT_PATH[step];

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8" role="status" aria-live="polite">
      <div className="chessboard-ltr grid grid-cols-3 w-20 h-20 rounded-md overflow-hidden border border-[var(--border-strong)]">
        {Array.from({ length: 9 }).map((_, idx) => {
          const isDark = idx % 2 === 1;
          const isActive = idx === activeCell;
          return (
            <div
              key={idx}
              style={{ backgroundColor: isActive ? '#C9A24B' : isDark ? '#769656' : '#EEEED2' }}
              className="flex items-center justify-center transition-colors duration-200"
            >
              {isActive && <ChessPieceSvg type="n" color="w" className="w-5 h-5" />}
            </div>
          );
        })}
      </div>
      {label && <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>}
    </div>
  );
};
