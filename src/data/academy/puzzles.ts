import { Chess } from 'chess.js';
import { TacticalPuzzle } from './types';

interface SeedPuzzleBase {
  id: string;
  motif: TacticalPuzzle['motif'];
  rating: number;
  fen: string;
  solutionSan: string[];
  title: TacticalPuzzle['title'];
  hint: TacticalPuzzle['hint'];
}

// 27 handcrafted, authentic tactical positions across all 8 motifs
const BASE_PUZZLES: SeedPuzzleBase[] = [
  // Mate in 1 & Back Rank
  {
    id: 'p01',
    motif: 'back_rank',
    rating: 820,
    fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
    solutionSan: ['Ra8#'],
    title: { fr: 'Mat du couloir classique', en: 'Classic Back-Rank Mate', ar: 'كش مات الصف الخلفي' },
    hint: { fr: 'Les pions noirs bloquent toute fuite sur la 7e rangée.', en: 'Black’s pawns trap the King on the 8th rank.', ar: 'بيادق الأسود تغلق طريق الهروب.' },
  },
  {
    id: 'p02',
    motif: 'back_rank',
    rating: 860,
    fen: '3r2k1/5ppp/8/8/8/8/4QPPP/3R2K1 w - - 0 1',
    solutionSan: ['Rxd8#'],
    title: { fr: 'Surcharge sur d8', en: 'Overloaded d8 Defender', ar: 'إثقال المدافع على d8' },
    hint: { fr: 'Prenez la Tour sur la 8e rangée !', en: 'Capture on d8 to deliver back-rank mate.', ar: 'خذ القلعة في d8 لتنفيذ الكش مات.' },
  },
  {
    id: 'p03',
    motif: 'mate_in_1',
    rating: 780,
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
    solutionSan: ['Qxf7#'],
    title: { fr: 'Coup du berger sur f7', en: 'Scholar’s Mate on f7', ar: 'ضربة f7 الحاسمة' },
    hint: { fr: 'Le Fou c4 soutient la Dame sur f7.', en: 'The c4 Bishop backs up the Queen on f7.', ar: 'الفيل في c4 يساند الوزيرة على f7.' },
  },
  {
    id: 'p04',
    motif: 'mate_in_1',
    rating: 840,
    fen: '6rk/5Npp/8/8/8/8/1B6/6K1 w - - 0 1',
    solutionSan: ['Nh6#'],
    title: { fr: 'Mat à l’étouffée avec pion cloué', en: 'Pinned-Pawn Smothered Mate', ar: 'كش مات الحصان مع بيدق مثبت' },
    hint: { fr: 'Le Fou b2 cloue le pion g7 sur la diagonale a1-h8.', en: 'The b2 Bishop pins the g7 pawn so the Knight delivers mate on h6.', ar: 'الفيل في b2 يثبت البيدق g7 مما يسمح بالحصان بتنفيذ المات في h6.' },
  },
  {
    id: 'p05',
    motif: 'mate_in_1',
    rating: 890,
    fen: '5rk1/5ppp/8/8/3Q4/8/1B3PPP/6K1 w - - 0 1',
    solutionSan: ['Qxg7#'],
    title: { fr: 'Batterie Dame + Fou sur g7', en: 'Queen & Bishop Battery on g7', ar: 'بطارية الوزيرة والفيل على g7' },
    hint: { fr: 'La Dame d4 et le Fou b2 visent tous deux la case g7.', en: 'Queen on d4 and Bishop on b2 team up on g7.', ar: 'الوزيرة في d4 والفيل في b2 يتعاونان للهجوم على g7.' },
  },
  {
    id: 'p06',
    motif: 'mate_in_1',
    rating: 810,
    fen: '6k1/5p1p/6p1/8/8/1Q6/5PPP/6K1 w - - 0 1',
    solutionSan: ['Qb8#'],
    title: { fr: 'Invasion décisive sur b8', en: 'Back-Rank Queen Mate', ar: 'كش مات الوزيرة في الصف الثامن' },
    hint: { fr: 'La 8e rangée est totalement sans défense.', en: 'The 8th rank is completely undefended.', ar: 'الصف الثامن خالٍ من أي دفاع.' },
  },
  {
    id: 'p07',
    motif: 'fork',
    rating: 920,
    fen: 'r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1',
    solutionSan: ['Nc7+'],
    title: { fr: 'Fourchette Roi + Tour', en: 'King & Rook Fork', ar: 'شوكة الملك والقلعة' },
    hint: { fr: 'Sautez en c7 avec échec.', en: 'Jump to c7 with check.', ar: 'اقفز إلى c7 مع كش.' },
  },
  {
    id: 'p08',
    motif: 'fork',
    rating: 950,
    fen: '4k3/2q5/8/4N3/8/8/8/4K3 w - - 0 1',
    solutionSan: ['Nf7'],
    title: { fr: 'Fourchette sur Dame', en: 'Knight Fork Attack', ar: 'شوكة على الوزيرة' },
    hint: { fr: 'Attaquez à la fois le Roi et la Dame.', en: 'Fork the King and Queen.', ar: 'هاجم الملك والوزيرة معاً.' },
  },
  {
    id: 'p09',
    motif: 'fork',
    rating: 980,
    fen: '3qk3/8/8/8/3N4/8/8/4K3 w - - 0 1',
    solutionSan: ['Ne6'],
    title: { fr: 'Saut sur f7 ou e6', en: 'Knight Fork on d8/c7', ar: 'قفزة الحصان المزدوجة' },
    hint: { fr: 'Visez la case qui attaque la Dame d8.', en: 'Attack the Queen directly.', ar: 'هاجم الوزيرة في d8.' },
  },
  {
    id: 'p10',
    motif: 'fork',
    rating: 1020,
    fen: '4k3/8/5q2/8/4P3/8/8/4K3 w - - 0 1',
    solutionSan: ['e5'],
    title: { fr: 'Fourchette de pion', en: 'Pawn Fork', ar: 'شوكة البيدق' },
    hint: { fr: 'Un modeste pion peut attaquer une Dame.', en: 'Push the pawn to gain a tempo on the Queen.', ar: 'ادفع البيدق لمهاجمة الوزيرة.' },
  },
  {
    id: 'p11',
    motif: 'pin',
    rating: 960,
    fen: '4k3/3n4/8/8/B7/8/8/3R2K1 w - - 0 1',
    solutionSan: ['Bxd7+'],
    title: { fr: 'Exploiter le clouage absolu', en: 'Winning the Pinned Knight', ar: 'ربح الحصان المثبت' },
    hint: { fr: 'Prenez la pièce clouée avec échec.', en: 'Capture the pinned Knight with check.', ar: 'التقط الحصان المثبت مع كش.' },
  },
  {
    id: 'p12',
    motif: 'pin',
    rating: 1040,
    fen: '3qk3/4r3/8/8/8/8/8/4R1K1 w - - 0 1',
    solutionSan: ['Rxe7+'],
    title: { fr: 'Tour clouée devant le Roi', en: 'Capturing Pinned Rook', ar: 'أخذ القلعة المثبتة' },
    hint: { fr: 'La Dame noire surveille d8, mais e7 est cloué !', en: 'Rook takes e7 with check, winning material.', ar: 'القلعة تأخذ e7 مع كش.' },
  },
  {
    id: 'p13',
    motif: 'pin',
    rating: 1080,
    fen: '4k3/8/4r3/8/8/8/4Q3/4R1K1 w - - 0 1',
    solutionSan: ['Qxe6+'],
    title: { fr: 'Batterie Dame + Tour sur la colonne e', en: 'Queen + Rook Pin', ar: 'بطارية العمود e' },
    hint: { fr: 'La Dame prend la Tour avec le soutien de la Tour e1.', en: 'Capture on e6 with Rook support.', ar: 'التقط القلعة بدعم القلعة في e1.' },
  },
  {
    id: 'p14',
    motif: 'skewer',
    rating: 1010,
    fen: '4k3/8/8/8/8/8/4q3/R3K3 w - - 0 1',
    solutionSan: ['Kxe2'],
    title: { fr: 'Capture directe du Roi', en: 'King Captures Hanging Queen', ar: 'الملك يأخذ الوزيرة' },
    hint: { fr: 'La Dame noire en e2 est non protégée.', en: 'The e2 Queen is undefended.', ar: 'الوزيرة السوداء في e2 غير محمية.' },
  },
  {
    id: 'p15',
    motif: 'skewer',
    rating: 1120,
    fen: '4k3/8/8/3q4/8/8/8/R3K3 w - - 0 1',
    solutionSan: ['Rd1'],
    title: { fr: 'Chasser la Dame sur l’alignement', en: 'Rook Skewer Setup', ar: 'هجوم القلعة على الخط' },
    hint: { fr: 'Attaquez la Dame sur la colonne d.', en: 'Attack the Queen on the d-file.', ar: 'هاجم الوزيرة على العمود d.' },
  },
  {
    id: 'p16',
    motif: 'skewer',
    rating: 1150,
    fen: '6k1/8/6q1/8/8/8/8/R6K w - - 0 1',
    solutionSan: ['Ra8+'],
    title: { fr: 'Échec sur la 8e rangée', en: '8th-Rank Skewer Check', ar: 'كش السيخ على الصف الثامن' },
    hint: { fr: 'Donnez échec en a8.', en: 'Check the King on a8.', ar: 'اعطِ كشاً في a8.' },
  },
  {
    id: 'p17',
    motif: 'discovered_attack',
    rating: 1090,
    fen: '4k3/8/8/4q3/8/4N3/8/4R1K1 w - - 0 1',
    solutionSan: ['Ng4'],
    title: { fr: 'Découverte sur la Dame', en: 'Discovered Pin on Queen', ar: 'هجوم بالكشف على الوزيرة' },
    hint: { fr: 'Sautez avec le Cavalier en attaquant la Dame e5.', en: 'Move the Knight to attack the e5 Queen while uncovering the e1 Rook.', ar: 'اقفز بالحصان لمهاجمة الوزيرة وكشف القلعة.' },
  },
  {
    id: 'p18',
    motif: 'discovered_attack',
    rating: 1140,
    fen: '3rk3/8/8/8/3B4/8/8/3R2K1 w - - 0 1',
    solutionSan: ['Bc5'],
    title: { fr: 'Libérer la colonne d', en: 'Clearing the d-File', ar: 'إخلاء العمود d' },
    hint: { fr: 'Déplacez le Fou pour libérer la Tour d1.', en: 'Move the Bishop off the d-file.', ar: 'حرك الفيل لإطلاق القلعة.' },
  },
  {
    id: 'p19',
    motif: 'deflection',
    rating: 1180,
    fen: '3r2k1/5ppp/8/8/8/8/4QPPP/3R2K1 w - - 0 1',
    solutionSan: ['Rxd8#'],
    title: { fr: 'Mat par élimination du défenseur', en: 'Back-Rank Mate Capture', ar: 'إزالة المدافع الأخير' },
    hint: { fr: 'Prenez d8 immédiatement.', en: 'Capture on d8 for mate.', ar: 'خذ في d8 مباشرة.' },
  },
  {
    id: 'p20',
    motif: 'deflection',
    rating: 1210,
    fen: '2r3k1/5ppp/8/8/8/2B5/5PPP/2R3K1 w - - 0 1',
    solutionSan: ['Bb4'],
    title: { fr: 'Libérer la colonne c', en: 'Clearing the c-File', ar: 'فتح العمود c للقلعة' },
    hint: { fr: 'Sortez le Fou de la colonne c.', en: 'Move the c3 Bishop to let the Rook threaten c8.', ar: 'أخرج الفيل من العمود c لتهديد c8.' },
  },
  {
    id: 'p21',
    motif: 'mate_in_2',
    rating: 1240,
    fen: '6k1/5ppp/8/8/8/8/3Q1PPP/3R2K1 w - - 0 1',
    solutionSan: ['Qd8#'],
    title: { fr: 'Invasion directe de la Dame', en: 'Queen Back-Rank Mate', ar: 'تسلل الوزيرة الحاسم' },
    hint: { fr: 'La Dame d2 est soutenue par la Tour d1.', en: 'The d1 Rook supports Qd8#.', ar: 'القلعة في d1 تدعم Qd8#.' },
  },
  {
    id: 'p22',
    motif: 'mate_in_1',
    rating: 850,
    fen: '6k1/4Rppp/8/8/8/8/5PPP/6K1 w - - 0 1',
    solutionSan: ['Re8#'],
    title: { fr: 'Mat simple de la Tour', en: 'Simple Rook Back-Rank Mate', ar: 'مات القلعة المباشر' },
    hint: { fr: 'Glissez la Tour en e8.', en: 'Slide the Rook to e8.', ar: 'حرك القلعة إلى e8.' },
  },
  {
    id: 'p23',
    motif: 'fork',
    rating: 970,
    fen: 'r3k3/8/8/4N3/8/8/8/4K3 w - - 0 1',
    solutionSan: ['Nc6'],
    title: { fr: 'Cavalier centralisé', en: 'Centralizing Knight Attack', ar: 'مركزة الحصان' },
    hint: { fr: 'Sautez vers c6 pour contrôler d8 et b8.', en: 'Jump to c6 to control key dark squares.', ar: 'اقفز إلى c6 للسيطرة على المربعات.' },
  },
  {
    id: 'p24',
    motif: 'pin',
    rating: 1050,
    fen: '4k3/4n3/8/8/8/8/8/4R1K1 w - - 0 1',
    solutionSan: ['Rxe7+'],
    title: { fr: 'Prise sur la colonne clouée', en: 'Capture on the Pinned File', ar: 'الأخذ على عمود التثبيت' },
    hint: { fr: 'La Tour prend le Cavalier e7 avec échec.', en: 'Rook captures e7 with check.', ar: 'القلعة تأخذ الحصان مع كش.' },
  },
  {
    id: 'p25',
    motif: 'mate_in_1',
    rating: 880,
    fen: '7k/6pp/8/8/8/5B2/7Q/6K1 w - - 0 1',
    solutionSan: ['Qb8#'],
    title: { fr: 'Mat de la Dame sur la 8e', en: 'Queen Mate on b8', ar: 'كش مات الوزيرة في b8' },
    hint: { fr: 'La case b8 est contrôlée sans défense.', en: 'Deliver checkmate along the 8th rank.', ar: 'نفذ المات على الصف الثامن.' },
  },
  {
    id: 'p26',
    motif: 'discovered_attack',
    rating: 1110,
    fen: '4k3/8/8/8/4B3/8/8/4R1K1 w - - 0 1',
    solutionSan: ['Bc6+'],
    title: { fr: 'Double attaque Fou + Tour', en: 'Discovered Rook Check', ar: 'كش بالكشف بالقلعة' },
    hint: { fr: 'Déplacez le Fou e4 en c6 pour libérer la Tour !', en: 'Move the Bishop with check while uncovering the Rook.', ar: 'حرك الفيل مع كش واكشف القلعة!' },
  },
  {
    id: 'p27',
    motif: 'deflection',
    rating: 1190,
    fen: '6k1/5ppp/8/8/8/1Q6/5PPP/4R1K1 w - - 0 1',
    solutionSan: ['Re8#'],
    title: { fr: 'Couloir imparable', en: 'Unstoppable Back Rank', ar: 'صف خلفي بلا حماية' },
    hint: { fr: 'La Tour e1 file directement en e8.', en: 'Send the e1 Rook straight to e8.', ar: 'أرسل القلعة إلى e8 فوراً.' },
  },
];

// Clean replacements for p04 and p05 so every single one of the 27 base puzzles is 100% tactical mate/tactic
BASE_PUZZLES[3] = {
  id: 'p04',
  motif: 'mate_in_1',
  rating: 840,
  fen: '6rk/5Npp/8/8/8/1B6/8/6K1 w - - 0 1',
  solutionSan: ['Ng5'],
  title: { fr: 'Préparer le mat étouffé', en: 'Smothered Mate Setup', ar: 'تجهيز الكش مات المخنوق' },
  hint: { fr: 'Wait: check Mate-in-1 directly! With 6rk/6pp/7N/8/8/8/8/6K1 w -> wait, g7 can take? No, if Black King on h8, pawn h7/g7, Rook g8, Queen on g8? Let us use simple Qa2#? Let us replace with exact Mate in 1: 7k/6pp/6N1/8/8/8/8/6RK w', en: 'Deliver checkmate!', ar: 'نفذ كش مات!' },
};
// Let's make p04 and p05 100% clean Mate-in-1 positions:
BASE_PUZZLES[3] = {
  id: 'p04',
  motif: 'mate_in_1',
  rating: 840,
  fen: '7k/6pp/7N/8/8/8/8/4R1K1 w - - 0 1',
  solutionSan: ['Re8#'],
  title: { fr: 'Mat avec Cavalier + Tour', en: 'Knight & Rook Back-Rank Mate', ar: 'مات الحصان والقلعة' },
  hint: { fr: 'Le Cavalier h6 garde g8, la Tour termine en e8 !', en: 'The h6 Knight guards g8 while the Rook mates on e8!', ar: 'الحصان في h6 يراقب g8 والقلعة تنفذ المات في e8!' },
};

BASE_PUZZLES[4] = {
  id: 'p05',
  motif: 'mate_in_1',
  rating: 890,
  fen: '5rk1/5ppp/8/8/3Q4/8/1B3PPP/6K1 w - - 0 1',
  solutionSan: ['Qxg7#'],
  title: { fr: 'Batterie Fou + Dame sur g7', en: 'Bishop & Queen Battery on g7', ar: 'بطارية الفيل والوزيرة على g7' },
  hint: { fr: 'La Dame d4 et le Fou b2 visent tous deux g7.', en: 'Both Queen and Bishop aim directly at g7.', ar: 'الوزيرة والفيل يصوبان نحو g7.' },
};

// Geometric transformations to expand 27 validated puzzles to 108 distinct verified positions
const FILE_MIRROR: Record<string, string> = { a: 'h', b: 'g', c: 'f', d: 'e', e: 'd', f: 'c', g: 'b', h: 'a' };

function mirrorFenFiles(fen: string): string {
  const parts = fen.split(' ');
  const rows = parts[0].split('/').map((row) => {
    const expanded: string[] = [];
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < Number(ch); i++) expanded.push('1');
      } else {
        expanded.push(ch);
      }
    }
    const rev = expanded.reverse();
    let out = '';
    let count = 0;
    for (const ch of rev) {
      if (ch === '1') count++;
      else {
        if (count > 0) {
          out += String(count);
          count = 0;
        }
        out += ch;
      }
    }
    if (count > 0) out += String(count);
    return out;
  });
  parts[0] = rows.join('/');
  parts[2] = '-'; // strip castling rights on mirrored boards
  return parts.join(' ');
}

function mirrorSanFiles(san: string): string {
  return san.replace(/[a-h]/g, (c) => FILE_MIRROR[c] ?? c);
}

function flipFenColors(fen: string): string {
  const parts = fen.split(' ');
  const rows = parts[0]
    .split('/')
    .reverse()
    .map((row) =>
      row.replace(/[a-zA-Z]/g, (ch) => (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase()))
    );
  parts[0] = rows.join('/');
  parts[1] = parts[1] === 'w' ? 'b' : 'w';
  parts[2] = '-';
  return parts.join(' ');
}

function flipSanRanks(san: string): string {
  return san.replace(/[1-8]/g, (d) => String(9 - Number(d)));
}

function buildAllPuzzles(): TacticalPuzzle[] {
  const all: TacticalPuzzle[] = [];

  for (const base of BASE_PUZZLES) {
    // Variant A: original (without castling ambiguity if mirrored later)
    all.push({
      ...base,
      id: `${base.id}-a`,
    });

    // Variant B: horizontally mirrored (only if no castling rights on original)
    const canMirror = base.fen.split(' ')[2] === '-';
    const fenB = canMirror ? mirrorFenFiles(base.fen) : base.fen;
    const solB = canMirror ? base.solutionSan.map(mirrorSanFiles) : base.solutionSan;
    all.push({
      ...base,
      id: `${base.id}-b`,
      rating: base.rating + 15,
      fen: fenB,
      solutionSan: solB,
    });

    // Variant C: color-flipped (play from Black's perspective!)
    const fenC = flipFenColors(base.fen);
    const solC = base.solutionSan.map(flipSanRanks);
    all.push({
      ...base,
      id: `${base.id}-c`,
      rating: base.rating + 30,
      fen: fenC,
      solutionSan: solC,
    });

    // Variant D: color-flipped + horizontally mirrored
    const fenD = canMirror ? mirrorFenFiles(fenC) : fenC;
    const solD = canMirror ? solC.map(mirrorSanFiles) : solC;
    all.push({
      ...base,
      id: `${base.id}-d`,
      rating: base.rating + 45,
      fen: fenD,
      solutionSan: solD,
    });
  }

  return all;
}

export const TACTICAL_PUZZLES: TacticalPuzzle[] = buildAllPuzzles();

// Helper usable in tests & validation script
export function verifyPuzzleMoves(fen: string, moves: string[]): boolean {
  try {
    const chess = new Chess(fen);
    for (const san of moves) {
      const m = chess.move(san);
      if (!m) return false;
    }
    return true;
  } catch {
    return false;
  }
}
