import { LocalizedText } from '../../config/site';

export type AcademyPhase = 'endgame' | 'middlegame' | 'opening';

export type MasteryLevel = 'unseen' | 'seen' | 'practiced' | 'solid' | 'mastered';

export interface SlideQuiz {
  question: LocalizedText;
  options: LocalizedText[];
  correctIndex: number;
  explanation: LocalizedText;
}

export interface SlideExercise {
  prompt: LocalizedText;
  fen: string;
  solutionSan: string;
  hint: LocalizedText;
}

export interface AcademySlide {
  id: string;
  title: LocalizedText;
  fen: string;
  body: LocalizedText;
  keyIdea: LocalizedText;
  highlights?: string[];
  demoMovesSan?: string[];
  quiz?: SlideQuiz;
  exercise?: SlideExercise;
}

export interface AcademyWeekModule {
  weekNumber: number;
  phase: AcademyPhase;
  title: LocalizedText;
  summary: LocalizedText;
  keyTakeaways: LocalizedText[];
  slides: AcademySlide[];
}

export interface TacticalPuzzle {
  id: string;
  motif: 'pin' | 'fork' | 'skewer' | 'back_rank' | 'discovered_attack' | 'mate_in_1' | 'mate_in_2' | 'deflection';
  rating: number;
  fen: string;
  solutionSan: string[];
  title: LocalizedText;
  hint: LocalizedText;
}
