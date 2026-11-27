import React, { useState } from 'react';
import { INITIAL_NEWS } from '../data/clubContent';
import { useI18n } from '../i18n';

export const NewsPage: React.FC = () => {
  const { t, pick } = useI18n();
  const [expandedId, setExpandedId] = useState<string | null>(INITIAL_NEWS[0]?.id ?? null);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      <div className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">{t.news.title}</h1>
        <p className="text-base text-[var(--text-secondary)]">{t.news.subtitle}</p>
      </div>

      <div className="space-y-5">
        {INITIAL_NEWS.map((post) => {
          const isOpen = expandedId === post.id;
          return (
            <article
              key={post.id}
              className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 space-y-3"
            >
              <p className="text-xs font-mono-tabular text-[var(--accent-gold)]">{post.dateIso}</p>
              <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">{pick(post.title)}</h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{pick(post.excerpt)}</p>
              {isOpen && (
                <p className="text-sm text-[var(--text-primary)] leading-relaxed pt-3 border-t border-[var(--border-hairline)]">
                  {pick(post.body)}
                </p>
              )}
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : post.id)}
                className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
              >
                {isOpen ? t.common.close : t.common.viewDetails}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
};
