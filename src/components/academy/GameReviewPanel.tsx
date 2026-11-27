import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { Activity, Bot, Search } from 'lucide-react';
import { GameReviewResult, MistakeCategory, reviewPgnGame } from '../../lib/mistakeAnalyzer';
import { useStudy } from '../../context/StudyContext';
import { useI18n } from '../../i18n';
import { ChessBoard } from '../chess/ChessBoard';

interface GameReviewPanelProps {
  onExplainMistake: (params: { fen: string; bestMoveSan: string | null; category: string; question: string }) => void;
  onJumpToWeek: (weekNumber: number) => void;
}

const SAMPLE_PGN = `1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Nc3 Nxe4 8. O-O Nxc3 9. bxc3 Bxc3 10. Qb3 Bxa1 11. Bxf7+ Kf8 12. Bg5 Ne7 13. Ne5 Bxd4 14. Bg6 d5 15. Qf3+ Bf5 16. Bxf5 Bxe5 17. Be6+ Ke8 18. Qf7#`;

const CATEGORY_WEEK_MAP: Record<MistakeCategory, { label: string; week: number }> = {
  blunder_hanging: { label: 'Hanging Pieces', week: 4 },
  tactical_oversight: { label: 'Tactics', week: 4 },
  king_safety: { label: 'King Safety', week: 6 },
  endgame_technique: { label: 'Endgames', week: 1 },
  opening_development: { label: 'Openings', week: 7 },
};

export const GameReviewPanel: React.FC<GameReviewPanelProps> = ({ onExplainMistake, onJumpToWeek }) => {
  const { t } = useI18n();
  const { recordMissedItem } = useStudy();
  const [pgnText, setPgnText] = useState(SAMPLE_PGN);
  const [review, setReview] = useState<GameReviewResult | null>(null);
  const [selectedPlyIdx, setSelectedPlyIdx] = useState(0);
  const [error, setError] = useState('');

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = reviewPgnGame(pgnText, 40);
      setReview(res);
      setSelectedPlyIdx(Math.max(0, res.moves.length - 1));
      for (const m of res.criticalMoments.slice(0, 3)) {
        recordMissedItem({
          id: `pgn-${m.ply}-${m.san}`,
          fen: m.fenBefore,
          solutionSan: m.bestMoveSan ?? m.san,
          prompt: `Critical moment on move ${m.moveNumber} (${m.san} played; best ${m.bestMoveSan ?? '?'})`,
          category: m.category ?? 'tactical_oversight',
          square: m.to,
          playedSan: m.san,
          cpLoss: m.cpLoss,
          source: 'mistake',
        });
      }
    } catch {
      setError('Invalid PGN — please check move notation and try again.');
    }
  };

  const activeMove = review?.moves[selectedPlyIdx] ?? null;

  // Compute radar SVG polygon points for 5 mistake categories
  const radarAxes: MistakeCategory[] = [
    'blunder_hanging',
    'tactical_oversight',
    'king_safety',
    'endgame_technique',
    'opening_development',
  ];
  const cx = 110;
  const cy = 110;
  const maxR = 72;
  const radarPoints = radarAxes
    .map((cat, idx) => {
      const angle = (Math.PI * 2 * idx) / 5 - Math.PI / 2;
      const count = review?.categoryCounts[cat] ?? 0;
      const strengthRatio = Math.max(0.2, 1 - Math.min(4, count) * 0.2);
      const r = maxR * strengthRatio;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    })
    .join(' ');

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5 sm:p-7 space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">{t.academy.tabs.review}</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Paste any PGN to calculate move accuracy, square mistake heatmap, 5-category profile, and AI explanations.
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="space-y-3">
        <textarea
          rows={3}
          value={pgnText}
          onChange={(e) => setPgnText(e.target.value)}
          placeholder="1. e4 e5 2. Nf3 Nc6 ..."
          className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] font-mono-tabular text-xs"
        />
        {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold hover:bg-[var(--accent-primary-hover)]"
        >
          <Search className="w-4 h-4" />
          Analyze Game
        </button>
      </form>

      {review && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4 border-t border-[var(--border-hairline)]">
          <div className="lg:col-span-5 space-y-3">
            <ChessBoard
              fen={activeMove ? activeMove.fenBefore : new Chess().fen()}
              interactive={false}
              heatmap={review.heatmap}
              lastMove={activeMove ? { from: activeMove.from, to: activeMove.to } : null}
            />
            {activeMove && (
              <div className="p-3 rounded-lg bg-[var(--bg-subtle)] text-xs flex items-center justify-between gap-2">
                <span>
                  Move {activeMove.moveNumber}: <strong>{activeMove.san}</strong> · Best:{' '}
                  <strong>{activeMove.bestMoveSan ?? '-'}</strong> ({activeMove.classification})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onExplainMistake({
                      fen: activeMove.fenBefore,
                      bestMoveSan: activeMove.bestMoveSan,
                      category: activeMove.category ?? 'tactical_oversight',
                      question: `Why was ${activeMove.san} inaccurate and why is ${activeMove.bestMoveSan} better here?`,
                    })
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--accent-primary)] text-white font-semibold shrink-0"
                >
                  <Bot className="w-3 h-3" />
                  {t.academy.coachExplainMistake}
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)]">
                <div className="text-xs text-[var(--text-muted)]">White Accuracy</div>
                <div className="text-2xl font-bold font-mono-tabular text-[var(--accent-primary)]">
                  {review.whiteAccuracy}%
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-subtle)]">
                <div className="text-xs text-[var(--text-muted)]">Black Accuracy</div>
                <div className="text-2xl font-bold font-mono-tabular text-[var(--accent-gold)]">
                  {review.blackAccuracy}%
                </div>
              </div>
            </div>

            {/* 5-Axis Weakness Radar & Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-[var(--bg-page)] border border-[var(--border-hairline)] rounded-xl p-4">
              <svg viewBox="0 0 220 220" className="w-44 h-44 mx-auto" aria-label="5-category mistake profile">
                <circle cx={cx} cy={cy} r={maxR} fill="none" stroke="var(--border-strong)" strokeWidth="1" />
                <circle cx={cx} cy={cy} r={maxR * 0.5} fill="none" stroke="var(--border-hairline)" strokeWidth="1" />
                <polygon points={radarPoints} fill="rgba(118, 150, 86, 0.3)" stroke="var(--accent-primary)" strokeWidth="2" />
              </svg>

              <div className="space-y-2 text-xs">
                <div className="font-semibold flex items-center gap-1.5 text-[var(--text-primary)]">
                  <Activity className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  Weakness Radar
                </div>
                {radarAxes.map((cat) => (
                  <div key={cat} className="flex items-center justify-between gap-2">
                    <span>
                      {CATEGORY_WEEK_MAP[cat].label}: <strong>{review.categoryCounts[cat]}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => onJumpToWeek(CATEGORY_WEEK_MAP[cat].week)}
                      className="text-[var(--accent-primary)] font-semibold hover:underline"
                    >
                      Week {CATEGORY_WEEK_MAP[cat].week} →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Moments */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-[var(--text-muted)]">Critical Moments</h3>
              <div className="flex flex-wrap gap-2">
                {review.criticalMoments.map((m) => {
                  const idx = review.moves.findIndex((x) => x.ply === m.ply);
                  return (
                    <button
                      key={m.ply}
                      type="button"
                      onClick={() => setSelectedPlyIdx(idx)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono-tabular ${
                        selectedPlyIdx === idx
                          ? 'bg-[var(--chess-charcoal)] text-[#EEEED2] border-[var(--accent-gold)]'
                          : 'bg-[var(--bg-page)] border-[var(--border-hairline)]'
                      }`}
                    >
                      {m.moveNumber}. {m.san} (-{m.cpLoss}cp)
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
