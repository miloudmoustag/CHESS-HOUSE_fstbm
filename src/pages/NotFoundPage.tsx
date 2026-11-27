import React from 'react';
import { Link } from 'react-router-dom';
import { ChessPieceSvg } from '../components/chess/ChessPieceSvg';
import { useI18n } from '../i18n';

export const NotFoundPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-strong)] p-3">
        <ChessPieceSvg type="n" color="b" />
      </div>
      <p className="text-xs font-mono-tabular uppercase tracking-widest text-[var(--accent-gold)]">
        {t.notFound.subtitle}
      </p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">{t.notFound.title}</h1>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{t.notFound.body}</p>
      <div>
        <Link
          to="/"
          className="btn-piece-slide inline-flex items-center px-5 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-semibold hover:bg-[var(--accent-primary-hover)]"
        >
          {t.common.backHome}
        </Link>
      </div>
    </div>
  );
};
