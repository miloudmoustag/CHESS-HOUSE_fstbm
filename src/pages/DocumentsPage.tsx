import React from 'react';
import { Download, FileText } from 'lucide-react';
import { CLUB_DOCUMENTS } from '../data/docs';
import { useI18n } from '../i18n';

export const DocumentsPage: React.FC = () => {
  const { t, pick } = useI18n();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      <div className="max-w-2xl space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
          {t.documents.title}
        </h1>
        <p className="text-base text-[var(--text-secondary)]">{t.documents.subtitle}</p>
        <p className="text-xs text-[var(--text-muted)] pt-1">{t.documents.placeholderNote}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CLUB_DOCUMENTS.map((doc) => (
          <div
            key={doc.id}
            className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-tabular text-[var(--accent-gold)]">
                <span>{doc.languageLabel}</span>
                <span>{doc.updatedAt}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <FileText className="w-5 h-5 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">{pick(doc.title)}</h2>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{pick(doc.description)}</p>
            </div>

            <div>
              <a
                href={doc.filePath}
                download
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-strong)] text-xs font-semibold hover:bg-[var(--bg-subtle)]"
              >
                <Download className="w-3.5 h-3.5" />
                {t.common.downloadPdf}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
