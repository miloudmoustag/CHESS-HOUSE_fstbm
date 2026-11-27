import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Lock, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { analyzePosition } from '../../lib/chessEngine';

interface AICoachPanelProps {
  fen: string;
  initialQuestion?: string;
  mistakeCategory?: string;
  bestMoveSanOverride?: string | null;
  engineEvalOverride?: number;
}

export const AICoachPanel: React.FC<AICoachPanelProps> = ({
  fen,
  initialQuestion = '',
  mistakeCategory,
  bestMoveSanOverride,
  engineEvalOverride,
}) => {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [question, setQuestion] = useState(initialQuestion);
  const [socratic, setSocratic] = useState(true);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialQuestion) setQuestion(initialQuestion);
  }, [initialQuestion]);

  const askCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !question.trim()) return;
    setLoading(true);
    setError('');
    try {
      let evalCp = engineEvalOverride;
      let bestMoveSan = bestMoveSanOverride;
      if (evalCp === undefined || bestMoveSan === undefined) {
        const analysis = analyzePosition(fen, 2, 'strong');
        evalCp = analysis.scoreCp;
        bestMoveSan = analysis.bestMoveSan;
      }

      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify({
          fen,
          question: question.trim(),
          engineEvalCp: evalCp,
          bestMoveSan,
          mistakeCategory,
          socratic,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.common.errorGeneric);
        return;
      }
      setReply(data.reply || '');
    } catch {
      setError(t.common.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[var(--accent-primary)]" />
          <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">{t.academy.coachTitle}</h3>
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
          <input
            type="checkbox"
            checked={socratic}
            onChange={(e) => setSocratic(e.target.checked)}
            className="rounded"
          />
          <span>{t.academy.coachSocratic}</span>
        </label>
      </div>

      {!user ? (
        <div className="p-4 rounded-lg bg-[var(--bg-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-2">
            <Lock className="w-4 h-4 text-[var(--accent-gold)] shrink-0" />
            {t.academy.coachLoginNotice}
          </span>
          <Link to="/account" className="font-semibold text-[var(--accent-primary)] hover:underline">
            {t.nav.account} →
          </Link>
        </div>
      ) : (
        <form onSubmit={askCoach} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t.academy.coachPlaceholder}
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-sm"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold hover:bg-[var(--accent-primary-hover)] disabled:opacity-60 whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? t.common.loading : t.academy.coachAsk}
            </button>
          </div>
        </form>
      )}

      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}

      {reply && (
        <div className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
          {reply}
        </div>
      )}
    </section>
  );
};
