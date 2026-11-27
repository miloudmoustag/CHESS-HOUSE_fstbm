import React from 'react';

export interface MoveListItem {
  id: string;
  moveNumber: number;
  label: string;
}

export const MoveListNav: React.FC<{ items: MoveListItem[] }> = ({ items }) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      aria-label="Section index"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 px-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)] mb-8"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => scrollToSection(item.id)}
          className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors whitespace-nowrap shrink-0"
        >
          <span className="font-mono-tabular text-[var(--accent-gold)] me-1">{item.moveNumber}.</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
};
