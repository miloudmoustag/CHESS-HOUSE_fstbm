import React, { createContext, useContext, useEffect, useState } from 'react';
import { MasteryLevel } from '../data/academy/types';
import { MistakeCategory } from '../lib/mistakeAnalyzer';
import { createSrsCard, scheduleSrsCard, SrsCard } from '../lib/srs';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface WeekProgress {
  weekNumber: number;
  mastery: MasteryLevel;
  slidesViewed: string[];
  exercisesSolved: string[];
}

export interface RecordedMistake {
  id: string;
  category: MistakeCategory;
  square: string;
  fen: string;
  playedSan: string;
  bestSan: string;
  cpLoss: number;
  createdAt: string;
}

export interface StudyState {
  weeks: Record<number, WeekProgress>;
  srsCards: SrsCard[];
  mistakes: RecordedMistake[];
  puzzlesSolved: string[];
  drillsCompleted: string[];
  streakDays: number;
  lastStudyDate: string | null;
  rating: number;
  badges: string[];
  dailyDone: {
    date: string;
    reviewDone: boolean;
    lessonDone: boolean;
    drillDone: boolean;
  };
}

const STORAGE_KEY = 'ch_academy_state_v1';

function defaultStudyState(): StudyState {
  const today = new Date().toISOString().slice(0, 10);
  const weeks: Record<number, WeekProgress> = {};
  for (let w = 1; w <= 8; w++) {
    weeks[w] = { weekNumber: w, mastery: 'unseen', slidesViewed: [], exercisesSolved: [] };
  }
  return {
    weeks,
    srsCards: [],
    mistakes: [],
    puzzlesSolved: [],
    drillsCompleted: [],
    streakDays: 0,
    lastStudyDate: null,
    rating: 900,
    badges: [],
    dailyDone: { date: today, reviewDone: false, lessonDone: false, drillDone: false },
  };
}

function loadLocalStudy(): StudyState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStudyState();
    const parsed = JSON.parse(raw) as StudyState;
    const today = new Date().toISOString().slice(0, 10);
    if (parsed.dailyDone?.date !== today) {
      parsed.dailyDone = { date: today, reviewDone: false, lessonDone: false, drillDone: false };
    }
    return parsed;
  } catch {
    return defaultStudyState();
  }
}

interface StudyContextValue {
  state: StudyState;
  justMigrated: boolean;
  markSlideViewed: (weekNumber: number, slideId: string) => void;
  markExerciseSolved: (weekNumber: number, slideId: string, totalExercisesInWeek: number) => void;
  recordMissedItem: (params: {
    id: string;
    fen: string;
    solutionSan: string;
    prompt: string;
    category: MistakeCategory;
    square?: string;
    playedSan?: string;
    cpLoss?: number;
    source: SrsCard['source'];
  }) => void;
  reviewSrsCard: (cardId: string, quality: 0 | 1 | 2 | 3 | 4 | 5) => void;
  markPuzzleSolved: (puzzleId: string, motif: string, firstTry: boolean) => void;
  markDrillCompleted: (drillId: string, success: boolean) => void;
  unlockWeekViaPlacement: (weekNumber: number) => void;
}

const StudyContext = createContext<StudyContextValue | null>(null);

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<StudyState>(() => loadLocalStudy());
  const [justMigrated, setJustMigrated] = useState(false);

  // Persist to localStorage for offline / guest use
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota
    }
  }, [state]);

  // On login with real Supabase, migrate localStorage progress into Supabase
  useEffect(() => {
    if (!user || !supabase) return;
    let active = true;

    async function syncAndMigrate() {
      if (!supabase || !user) return;
      const local = loadLocalStudy();

      // Upsert any local progress weeks
      for (const w of Object.values(local.weeks)) {
        if (w.mastery !== 'unseen' || w.slidesViewed.length > 0) {
          await supabase.from('study_progress').upsert(
            {
              user_id: user.id,
              week_number: w.weekNumber,
              mastery: w.mastery,
              slides_viewed: w.slidesViewed,
              exercises_solved: w.exercisesSolved,
            },
            { onConflict: 'user_id,week_number' }
          );
        }
      }

      // Upsert local SRS cards
      for (const card of local.srsCards) {
        await supabase.from('srs_cards').upsert(
          {
            user_id: user.id,
            card_key: card.id,
            fen: card.fen,
            solution_san: card.solutionSan,
            prompt: card.prompt,
            category: card.category,
            source: card.source,
            interval_days: card.intervalDays,
            ease_factor: card.easeFactor,
            repetitions: card.repetitions,
            due_date: card.dueDate,
          },
          { onConflict: 'user_id,card_key' }
        );
      }

      // Fetch merged cloud rows
      const [{ data: cloudWeeks }, { data: cloudCards }] = await Promise.all([
        supabase.from('study_progress').select('*').eq('user_id', user.id),
        supabase.from('srs_cards').select('*').eq('user_id', user.id),
      ]);

      if (!active) return;

      setState((prev) => {
        const nextWeeks = { ...prev.weeks };
        for (const row of cloudWeeks ?? []) {
          nextWeeks[row.week_number] = {
            weekNumber: row.week_number,
            mastery: row.mastery,
            slidesViewed: Array.from(new Set([...(nextWeeks[row.week_number]?.slidesViewed ?? []), ...(row.slides_viewed ?? [])])),
            exercisesSolved: Array.from(new Set([...(nextWeeks[row.week_number]?.exercisesSolved ?? []), ...(row.exercises_solved ?? [])])),
          };
        }

        const mergedCardsMap = new Map<string, SrsCard>();
        for (const c of prev.srsCards) mergedCardsMap.set(c.id, c);
        for (const row of cloudCards ?? []) {
          if (!mergedCardsMap.has(row.card_key)) {
            mergedCardsMap.set(row.card_key, {
              id: row.card_key,
              fen: row.fen,
              solutionSan: row.solution_san,
              prompt: row.prompt,
              category: row.category,
              source: row.source,
              intervalDays: row.interval_days,
              easeFactor: Number(row.ease_factor),
              repetitions: row.repetitions,
              dueDate: row.due_date,
            });
          }
        }

        return {
          ...prev,
          weeks: nextWeeks,
          srsCards: Array.from(mergedCardsMap.values()),
        };
      });

      if (Object.values(local.weeks).some((w) => w.mastery !== 'unseen') || local.srsCards.length > 0) {
        setJustMigrated(true);
      }
    }

    syncAndMigrate();
    return () => {
      active = false;
    };
  }, [user]);

  const touchStreak = (prev: StudyState): Pick<StudyState, 'streakDays' | 'lastStudyDate'> => {
    const today = new Date().toISOString().slice(0, 10);
    if (prev.lastStudyDate === today) {
      return { streakDays: Math.max(1, prev.streakDays), lastStudyDate: today };
    }
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const streakDays = prev.lastStudyDate === yesterday ? prev.streakDays + 1 : 1;
    return { streakDays, lastStudyDate: today };
  };

  const awardBadges = (next: StudyState): string[] => {
    const b = new Set(next.badges);
    if (Object.values(next.weeks).some((w) => w.slidesViewed.length > 0)) b.add('first_lesson');
    if (next.weeks[3]?.mastery === 'solid' || next.weeks[3]?.mastery === 'mastered') b.add('endgame_graduate');
    if (next.puzzlesSolved.length >= 10) b.add('tactician_10');
    if (next.streakDays >= 3) b.add('streak_3');
    if (next.weeks[8]?.mastery === 'solid' || next.weeks[8]?.mastery === 'mastered') b.add('academy_complete');
    return Array.from(b);
  };

  const markSlideViewed = (weekNumber: number, slideId: string) => {
    setState((prev) => {
      const current = prev.weeks[weekNumber] ?? { weekNumber, mastery: 'unseen', slidesViewed: [], exercisesSolved: [] };
      const slidesViewed = current.slidesViewed.includes(slideId) ? current.slidesViewed : [...current.slidesViewed, slideId];
      const mastery: MasteryLevel = current.mastery === 'unseen' ? 'seen' : current.mastery;
      const streak = touchStreak(prev);
      const next: StudyState = {
        ...prev,
        ...streak,
        dailyDone: { ...prev.dailyDone, lessonDone: true },
        weeks: { ...prev.weeks, [weekNumber]: { ...current, slidesViewed, mastery } },
      };
      next.badges = awardBadges(next);

      if (user && supabase) {
        supabase.from('study_progress').upsert(
          {
            user_id: user.id,
            week_number: weekNumber,
            mastery,
            slides_viewed: slidesViewed,
            exercises_solved: current.exercisesSolved,
          },
          { onConflict: 'user_id,week_number' }
        );
      }
      return next;
    });
  };

  const markExerciseSolved = (weekNumber: number, slideId: string, totalExercisesInWeek: number) => {
    setState((prev) => {
      const current = prev.weeks[weekNumber] ?? { weekNumber, mastery: 'seen', slidesViewed: [], exercisesSolved: [] };
      const exercisesSolved = current.exercisesSolved.includes(slideId)
        ? current.exercisesSolved
        : [...current.exercisesSolved, slideId];
      const ratio = totalExercisesInWeek > 0 ? exercisesSolved.length / totalExercisesInWeek : 1;
      let mastery: MasteryLevel = 'practiced';
      if (ratio >= 1) mastery = 'mastered';
      else if (ratio >= 0.6) mastery = 'solid';

      const streak = touchStreak(prev);
      const next: StudyState = {
        ...prev,
        ...streak,
        rating: prev.rating + (current.exercisesSolved.includes(slideId) ? 0 : 12),
        dailyDone: { ...prev.dailyDone, lessonDone: true },
        weeks: { ...prev.weeks, [weekNumber]: { ...current, exercisesSolved, mastery } },
      };
      next.badges = awardBadges(next);

      if (user && supabase) {
        supabase.from('study_progress').upsert(
          {
            user_id: user.id,
            week_number: weekNumber,
            mastery,
            slides_viewed: current.slidesViewed,
            exercises_solved: exercisesSolved,
          },
          { onConflict: 'user_id,week_number' }
        );
      }
      return next;
    });
  };

  const recordMissedItem: StudyContextValue['recordMissedItem'] = (params) => {
    setState((prev) => {
      const exists = prev.srsCards.some((c) => c.id === params.id);
      const card = createSrsCard({
        id: params.id,
        fen: params.fen,
        solutionSan: params.solutionSan,
        prompt: params.prompt,
        category: params.category,
        source: params.source,
      });
      const srsCards = exists ? prev.srsCards : [...prev.srsCards, card];
      const mistake: RecordedMistake = {
        id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        category: params.category,
        square: params.square ?? 'e4',
        fen: params.fen,
        playedSan: params.playedSan ?? '',
        bestSan: params.solutionSan,
        cpLoss: params.cpLoss ?? 150,
        createdAt: new Date().toISOString(),
      };

      if (user && supabase) {
        supabase.from('srs_cards').upsert(
          {
            user_id: user.id,
            card_key: card.id,
            fen: card.fen,
            solution_san: card.solutionSan,
            prompt: card.prompt,
            category: card.category,
            source: card.source,
            interval_days: card.intervalDays,
            ease_factor: card.easeFactor,
            repetitions: card.repetitions,
            due_date: card.dueDate,
          },
          { onConflict: 'user_id,card_key' }
        );
        supabase.from('mistakes').insert({
          user_id: user.id,
          category: mistake.category,
          square: mistake.square,
          fen: mistake.fen,
          played_san: mistake.playedSan,
          best_san: mistake.bestSan,
          cp_loss: mistake.cpLoss,
        });
      }

      return {
        ...prev,
        srsCards,
        mistakes: [mistake, ...prev.mistakes].slice(0, 60),
      };
    });
  };

  const reviewSrsCard = (cardId: string, quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    setState((prev) => {
      const srsCards = prev.srsCards.map((c) => (c.id === cardId ? scheduleSrsCard(c, quality) : c));
      const updated = srsCards.find((c) => c.id === cardId);
      if (updated && user && supabase) {
        supabase
          .from('srs_cards')
          .update({
            interval_days: updated.intervalDays,
            ease_factor: updated.easeFactor,
            repetitions: updated.repetitions,
            due_date: updated.dueDate,
          })
          .eq('user_id', user.id)
          .eq('card_key', cardId);
      }
      const streak = touchStreak(prev);
      return {
        ...prev,
        ...streak,
        dailyDone: { ...prev.dailyDone, reviewDone: true },
        srsCards,
      };
    });
  };

  const markPuzzleSolved = (puzzleId: string, motif: string, firstTry: boolean) => {
    setState((prev) => {
      const already = prev.puzzlesSolved.includes(puzzleId);
      const puzzlesSolved = already ? prev.puzzlesSolved : [...prev.puzzlesSolved, puzzleId];
      const streak = touchStreak(prev);
      const next: StudyState = {
        ...prev,
        ...streak,
        rating: prev.rating + (already ? 0 : firstTry ? 14 : 6),
        puzzlesSolved,
      };
      next.badges = awardBadges(next);
      if (user && supabase) {
        supabase.from('puzzle_attempts').insert({
          user_id: user.id,
          puzzle_id: puzzleId,
          motif,
          solved: true,
        });
      }
      return next;
    });
  };

  const markDrillCompleted = (drillId: string, success: boolean) => {
    setState((prev) => {
      const drillsCompleted =
        success && !prev.drillsCompleted.includes(drillId) ? [...prev.drillsCompleted, drillId] : prev.drillsCompleted;
      const streak = touchStreak(prev);
      const next: StudyState = {
        ...prev,
        ...streak,
        rating: prev.rating + (success && !prev.drillsCompleted.includes(drillId) ? 18 : 0),
        dailyDone: { ...prev.dailyDone, drillDone: true },
        drillsCompleted,
      };
      next.badges = awardBadges(next);
      if (user && supabase) {
        supabase.from('drill_attempts').insert({
          user_id: user.id,
          drill_id: drillId,
          success,
          moves_count: 1,
        });
      }
      return next;
    });
  };

  const unlockWeekViaPlacement = (weekNumber: number) => {
    setState((prev) => {
      const nextWeeks = { ...prev.weeks };
      for (let w = 1; w < weekNumber; w++) {
        if (nextWeeks[w]?.mastery === 'unseen' || nextWeeks[w]?.mastery === 'seen' || nextWeeks[w]?.mastery === 'practiced') {
          nextWeeks[w] = { ...nextWeeks[w], mastery: 'solid' };
        }
      }
      return { ...prev, weeks: nextWeeks };
    });
  };

  return (
    <StudyContext.Provider
      value={{
        state,
        justMigrated,
        markSlideViewed,
        markExerciseSolved,
        recordMissedItem,
        reviewSrsCard,
        markPuzzleSolved,
        markDrillCompleted,
        unlockWeekViaPlacement,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export function useStudy(): StudyContextValue {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used inside StudyProvider');
  return ctx;
}
