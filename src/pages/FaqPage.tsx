import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { INITIAL_FAQ } from '../data/clubContent';
import { useI18n } from '../i18n';

export const FaqPage: React.FC = () => {
  const { t, pick } = useI18n();
  const [openId, setOpenId] = useState<string | null>(INITIAL_FAQ[0]?.id ?? null);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">{t.faq.title}</h1>
        <p className="text-base text-[var(--text-secondary)]">{t.faq.subtitle}</p>
      </div>

      <div className="space-y-3">
        {INITIAL_FAQ.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl overflow-hidden"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="w-full px-6 py-4 text-start flex items-center justify-between gap-4 hover:bg-[var(--bg-subtle)]/50"
              >
                <span className="font-display text-lg font-bold text-[var(--text-primary)]">
                  {pick(item.question)}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-[var(--text-muted)] shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-5 text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-hairline)] pt-4">
                  {pick(item.answer)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
