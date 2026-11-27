import fs from 'fs';
import path from 'path';
import { Chess } from 'chess.js';
import { TACTICAL_PUZZLES, verifyPuzzleMoves } from '../src/data/academy/puzzles';

let failures = 0;

// 1. Validate all 108+ tactical puzzles
if (TACTICAL_PUZZLES.length < 100) {
  console.error(`Expected at least 100 puzzles, got ${TACTICAL_PUZZLES.length}`);
  failures++;
}

for (const puzzle of TACTICAL_PUZZLES) {
  if (!verifyPuzzleMoves(puzzle.fen, puzzle.solutionSan)) {
    console.error(`Invalid puzzle ${puzzle.id}: FEN="${puzzle.fen}" moves=${JSON.stringify(puzzle.solutionSan)}`);
    failures++;
  }
}

// 2. Validate all 8 week JSON modules and every exercise inside them
const weeksDir = path.join(process.cwd(), 'src', 'data', 'academy', 'weeks');
let totalExercises = 0;
let totalSlides = 0;

for (let w = 1; w <= 8; w++) {
  const filePath = path.join(weeksDir, `week${w}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  for (const slide of data.slides) {
    totalSlides++;
    try {
      new Chess(slide.fen);
    } catch {
      console.error(`Invalid slide FEN in week${w} (${slide.id}): ${slide.fen}`);
      failures++;
    }
    if (slide.demoMovesSan) {
      if (!verifyPuzzleMoves(slide.fen, slide.demoMovesSan)) {
        console.error(`Invalid demoMovesSan in week${w} (${slide.id})`);
        failures++;
      }
    }
    if (slide.exercise) {
      totalExercises++;
      if (!verifyPuzzleMoves(slide.exercise.fen, [slide.exercise.solutionSan])) {
        console.error(
          `Invalid exercise in week${w} (${slide.id}): FEN="${slide.exercise.fen}" SAN="${slide.exercise.solutionSan}"`
        );
        failures++;
      }
    }
  }
}

if (failures > 0) {
  console.error(`Validation failed with ${failures} error(s).`);
  process.exit(1);
}

console.log(
  `Validated ${TACTICAL_PUZZLES.length} tactical puzzles, ${totalSlides} slides, and ${totalExercises} week exercises with chess.js.`
);
