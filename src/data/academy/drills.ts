import { LocalizedText } from '../../config/site';

export interface PracticeDrill {
  id: string;
  category: 'endgame' | 'tactics' | 'middlegame' | 'opening';
  isEndgameTablebase?: boolean;
  title: LocalizedText;
  objective: LocalizedText;
  fen: string;
  targetOutcome: 'win' | 'draw' | 'hold';
  playerColor: 'w' | 'b';
}

export const PRACTICE_DRILLS: PracticeDrill[] = [
  {
    id: 'drill-kq-k',
    category: 'endgame',
    isEndgameTablebase: true,
    title: { fr: 'Finale Dame + Roi contre Roi', en: 'Queen + King vs King', ar: 'نهاية الوزيرة والملك ضد الملك' },
    objective: { fr: 'Matez le Roi noir en évitant le pat.', en: 'Checkmate the lone King without stalemate.', ar: 'نفّذ كش مات دون الوقوع في الخنق.' },
    fen: '8/8/8/4k3/8/8/3Q4/4K3 w - - 0 1',
    targetOutcome: 'win',
    playerColor: 'w',
  },
  {
    id: 'drill-kr-k',
    category: 'endgame',
    isEndgameTablebase: true,
    title: { fr: 'Finale Tour + Roi contre Roi', en: 'Rook + King vs King', ar: 'نهاية القلعة والملك ضد الملك' },
    objective: { fr: 'Rétrécissez la boîte et matez au bord.', en: 'Shrink the box and checkmate on the edge.', ar: 'ضيّق المساحة ونفّذ المات على الحافة.' },
    fen: '8/8/4k3/8/8/4K3/8/R7 w - - 0 1',
    targetOutcome: 'win',
    playerColor: 'w',
  },
  {
    id: 'drill-opposition',
    category: 'endgame',
    isEndgameTablebase: true,
    title: { fr: 'Roi + Pion : Gagner avec l’opposition', en: 'King + Pawn: Win with Opposition', ar: 'ملك وبيدق: الفوز بالتقابل' },
    objective: { fr: 'Amenez le pion à dame grâce aux cases clés.', en: 'Promote the pawn using key squares and opposition.', ar: 'رقّ البيدق باستخدام المربعات الحاسمة والتقابل.' },
    fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
    targetOutcome: 'win',
    playerColor: 'w',
  },
  {
    id: 'drill-lucena',
    category: 'endgame',
    isEndgameTablebase: true,
    title: { fr: 'Position de Lucena', en: 'The Lucena Bridge', ar: 'جسر لوسينا' },
    objective: { fr: 'Construisez le pont pour promouvoir le pion d7.', en: 'Build the Rook bridge to promote the d7 pawn.', ar: 'ابنِ الجسر بالقلعة لترقية البيدق d7.' },
    fen: '3K4/3P1k2/8/8/8/8/4R3/2r5 w - - 0 1',
    targetOutcome: 'win',
    playerColor: 'w',
  },
  {
    id: 'drill-philidor',
    category: 'endgame',
    isEndgameTablebase: true,
    title: { fr: 'Défense de Philidor', en: 'Philidor Draw Defence', ar: 'دفاع فيليدور للتعادل' },
    objective: { fr: 'Annulez avec un pion de moins grâce à la 3e rangée.', en: 'Hold the draw down a pawn using the 6th-rank barrier.', ar: 'حافظ على التعادل ببيدق أقل عبر الصف السادس.' },
    fen: '4k3/8/R7/4P3/4K3/8/8/4r3 b - - 0 1',
    targetOutcome: 'draw',
    playerColor: 'b',
  },
  {
    id: 'drill-outpost',
    category: 'middlegame',
    title: { fr: 'Pression sur colonne semi-ouverte', en: 'Half-Open File Pressure', ar: 'الضغط على العمود نصف المفتوح' },
    objective: { fr: 'Prenez l’initiative avec vos pièces lourdes.', en: 'Take the initiative along open lines.', ar: 'امسك بزمام المبادرة عبر الخطوط المفتوحة.' },
    fen: 'r2q1rk1/pp2bppp/2p5/3pP3/3P4/2N2N2/PP3PPP/R2Q1RK1 w - - 0 1',
    targetOutcome: 'win',
    playerColor: 'w',
  },
  {
    id: 'drill-italian',
    category: 'opening',
    title: { fr: 'Milieu issu de l’Italienne', en: 'Italian Game Transition', ar: 'الانتقال من الافتتاحية الإيطالية' },
    objective: { fr: 'Ouvrez le centre au bon moment.', en: 'Break in the center with d4 and active piece play.', ar: 'افتح المركز في التوقيت المناسب.' },
    fen: 'r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2PP1N2/PP3PPP/RNBQ1RK1 w - - 0 7',
    targetOutcome: 'win',
    playerColor: 'w',
  },
  {
    id: 'drill-mate-2',
    category: 'tactics',
    title: { fr: 'Attaque directe sur le Roi', en: 'Direct King Attack', ar: 'هجوم مباشر على الملك' },
    objective: { fr: 'Convertissez l’avantage matériel et attaquez.', en: 'Convert your active pieces into a mating attack.', ar: 'حوّل تفوقك إلى هجوم مات.' },
    fen: 'r1bq1rk1/ppp2ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w - - 0 6',
    targetOutcome: 'win',
    playerColor: 'w',
  },
];

export interface ClassicGameMove {
  san: string;
  caption: LocalizedText;
}

export const FAMOUS_OPERA_GAME: {
  title: LocalizedText;
  moves: ClassicGameMove[];
} = {
  title: {
    fr: 'Paul Morphy — L’Opéra de Paris (1858)',
    en: 'Paul Morphy — The Opera Game (Paris, 1858)',
    ar: 'بول مورفي — مباراة الأوبرا الشهيرة (باريس 1858)',
  },
  moves: [
    { san: 'e4', caption: { fr: '1.e4 — Contrôle du centre.', en: '1.e4 — Claiming the center.', ar: '1.e4 — السيطرة على المركز.' } },
    { san: 'e5', caption: { fr: '1...e5 — Symétrie centrale.', en: '1...e5 — Central reply.', ar: '1...e5 — رد مركزي.' } },
    { san: 'Nf3', caption: { fr: '2.Cf3 — Développement et attaque.', en: '2.Nf3 — Develop with tempo.', ar: '2.Nf3 — نشر مع تهديد.' } },
    { san: 'd6', caption: { fr: '2...d6 — Défense Philidor.', en: '2...d6 — Philidor Defence.', ar: '2...d6 — دفاع فيليدور.' } },
    { san: 'd4', caption: { fr: '3.d4 — Ouverture immédiate du centre.', en: '3.d4 — Opening the center.', ar: '3.d4 — فتح المركز فوراً.' } },
    { san: 'Bg4', caption: { fr: '3...Fg4 — Clouage sur f3.', en: '3...Bg4 — Pinning the Knight.', ar: '3...Bg4 — تثبيت الحصان.' } },
    { san: 'dxe5', caption: { fr: '4.dxe5 — Gain d’espace.', en: '4.dxe5 — Opening files.', ar: '4.dxe5 — فتح الأعمدة.' } },
    { san: 'Bxf3', caption: { fr: '4...Fxf3 — Échange forcé.', en: '4...Bxf3 — Trading the Knight.', ar: '4...Bxf3 — استبدال الحصان.' } },
    { san: 'Qxf3', caption: { fr: '5.Dxf3 — La Dame reste active.', en: '5.Qxf3 — Recapturing actively.', ar: '5.Qxf3 — استعادة نشطة.' } },
    { san: 'dxe5', caption: { fr: '5...dxe5 — Égalité matérielle.', en: '5...dxe5 — Material level.', ar: '5...dxe5 — توازن مادي.' } },
    { san: 'Bc4', caption: { fr: '6.Fc4 — Menace directe sur f7 !', en: '6.Bc4 — Threatening mate on f7!', ar: '6.Bc4 — تهديد مباشر على f7!' } },
    { san: 'Nf6', caption: { fr: '6...Cf6 — Pare le mat.', en: '6...Nf6 — Blocking f7.', ar: '6...Nf6 — سد التهديد.' } },
    { san: 'Qb3', caption: { fr: '7.Db3 — Double attaque sur f7 et b7.', en: '7.Qb3 — Double attack on f7 and b7.', ar: '7.Qb3 — هجوم مزدوج على f7 و b7.' } },
    { san: 'Qe7', caption: { fr: '7...De7 — Protège f7 mais bloque le Fou.', en: '7...Qe7 — Defends f7, blocks f8 Bishop.', ar: '7...Qe7 — يحمي f7 لكنه يغلق الفيل.' } },
    { san: 'Nc3', caption: { fr: '8.Cc3 — Développement rapide !', en: '8.Nc3 — Rapid development!', ar: '8.Nc3 — نشر سريع للقطع!' } },
    { san: 'c6', caption: { fr: '8...c6 — Protège b7.', en: '8...c6 — Defends b7.', ar: '8...c6 — حماية b7.' } },
    { san: 'Bg5', caption: { fr: '9.Fg5 — Toutes les pièces légères sont sorties.', en: '9.Bg5 — Every minor piece is active.', ar: '9.Bg5 — كل القطع الخفيفة في اللعب.' } },
    { san: 'b5', caption: { fr: '9...b5 — Chasse le Fou.', en: '9...b5 — Attacking the Bishop.', ar: '9...b5 — مطاردة الفيل.' } },
    { san: 'Nxb5', caption: { fr: '10.Cxb5! — Sacrifice pour ouvrir le Roi.', en: '10.Nxb5! — Sacrificing to open lines.', ar: '10.Nxb5! — تضحية لفتح الخطوط.' } },
    { san: 'cxb5', caption: { fr: '10...cxb5', en: '10...cxb5', ar: '10...cxb5' } },
    { san: 'Bxb5+', caption: { fr: '11.Fxb5+ — Échec !', en: '11.Bxb5+ — Check!', ar: '11.Bxb5+ — كش!' } },
    { san: 'Nbd7', caption: { fr: '11...Cbd7', en: '11...Nbd7', ar: '11...Nbd7' } },
    { san: 'O-O-O', caption: { fr: '12.O-O-O — La Tour entre en jeu.', en: '12.O-O-O — Bringing the Rook with tempo.', ar: '12.O-O-O — إدخال القلعة في الهجوم.' } },
    { san: 'Rd8', caption: { fr: '12...Td8', en: '12...Rd8', ar: '12...Rd8' } },
    { san: 'Rxd7', caption: { fr: '13.Txd7! — Sacrifice d’échange !', en: '13.Rxd7! — Exchange sacrifice!', ar: '13.Rxd7! — تضحية رائعة بالقلعة!' } },
    { san: 'Rxd7', caption: { fr: '13...Txd7', en: '13...Rxd7', ar: '13...Rxd7' } },
    { san: 'Rd1', caption: { fr: '14.Td1 — Clouage fatal sur d7.', en: '14.Rd1 — Fatal pin on d7.', ar: '14.Rd1 — تثبيت قاتل على d7.' } },
    { san: 'Qe6', caption: { fr: '14...De6', en: '14...Qe6', ar: '14...Qe6' } },
    { san: 'Bxd7+', caption: { fr: '15.Fxd7+', en: '15.Bxd7+', ar: '15.Bxd7+' } },
    { san: 'Nxd7', caption: { fr: '15...Cxd7', en: '15...Nxd7', ar: '15...Nxd7' } },
    { san: 'Qb8+', caption: { fr: '16.Db8+!! — Sacrifice de Dame !', en: '16.Qb8+!! — Queen sacrifice!', ar: '16.Qb8+!! — تضحية بالوزيرة!' } },
    { san: 'Nxb8', caption: { fr: '16...Cxb8', en: '16...Nxb8', ar: '16...Nxb8' } },
    { san: 'Rd8#', caption: { fr: '17.Td8# — Échec et mat !', en: '17.Rd8# — Checkmate!', ar: '17.Rd8# — كش مات!' } },
  ],
};

export interface GlossaryEntry {
  term: LocalizedText;
  weekRef: number;
  definition: LocalizedText;
}

export const CHESS_GLOSSARY: GlossaryEntry[] = [
  {
    term: { fr: 'Opposition', en: 'Opposition', ar: 'التقابل (Opposition)' },
    weekRef: 2,
    definition: {
      fr: 'Face-à-face des deux Rois séparés par une case : celui qui n’a pas à jouer contraint l’autre à céder le passage.',
      en: 'Two Kings facing each other one square apart; the player NOT to move forces the opponent’s King aside.',
      ar: 'تواجه الملكين بفاصل مربع واحد؛ من ليس عليه الدور يجبر الملك الآخر على التراجع.',
    },
  },
  {
    term: { fr: 'Zugzwang', en: 'Zugzwang', ar: 'الزوغزوانغ (الإلزام الضار)' },
    weekRef: 2,
    definition: {
      fr: 'Situation où tout coup légal détériore la position de celui qui doit jouer.',
      en: 'A position where every legal move worsens the position of the player to move.',
      ar: 'وضعية يُجبر فيها اللاعب على تحريك قطعة رغم أن كل النقلة القانونية تضر بموقفه.',
    },
  },
  {
    term: { fr: 'Pont de Lucena', en: 'Lucena Bridge', ar: 'جسر لوسينا' },
    weekRef: 3,
    definition: {
      fr: 'Technique gagnante en finale de Tours consistant à interposer sa Tour sur la 4e/5e rangée pour bloquer les échecs adverses.',
      en: 'Winning Rook endgame manoeuvre using the Rook on the 4th/5th rank to shield the King from vertical checks.',
      ar: 'مناورة في نهايات القلاع لوضع القلعة في الصف الرابع كدرع يحمي الملك من الكشات.',
    },
  },
  {
    term: { fr: 'Avant-poste (Outpost)', en: 'Outpost', ar: 'النقطة المتقدمة (Outpost)' },
    weekRef: 5,
    definition: {
      fr: 'Case dans le camp adverse protégée par un pion et impossible à attaquer par les pions ennemis.',
      en: 'A square in or near the enemy camp guarded by a pawn and immune to enemy pawn attacks.',
      ar: 'مربع متقدم محمي ببيدق ولا يمكن طرد القطعة منه ببيادق الخصم.',
    },
  },
  {
    term: { fr: 'Clouage (Pin)', en: 'Pin', ar: 'التثبيت (Pin)' },
    weekRef: 4,
    definition: {
      fr: 'Attaque sur une pièce qui ne peut bouger sans exposer une pièce plus précieuse derrière elle.',
      en: 'An attack on a piece that cannot move without exposing a more valuable piece behind it.',
      ar: 'هجوم على قطعة لا تستطيع التحرك دون كشف قطعة أثمن خلفها.',
    },
  },
  {
    term: { fr: 'Enfilade (Skewer)', en: 'Skewer', ar: 'السيخ (Skewer)' },
    weekRef: 4,
    definition: {
      fr: 'Attaque sur une pièce majeure qui, en s’écartant, laisse une autre pièce sans défense derrière elle.',
      en: 'An attack on a high-value piece that must move, exposing a piece behind it to capture.',
      ar: 'هجوم على قطعة ثمينة تضطر للهرب فتكشف قطعة خلفها للأخذ.',
    },
  },
  {
    term: { fr: 'Fourchette (Fork)', en: 'Fork', ar: 'الشوكة (Fork)' },
    weekRef: 4,
    definition: {
      fr: 'Une seule pièce attaque simultanément deux cibles adverses ou plus.',
      en: 'A single piece attacks two or more enemy targets at the same time.',
      ar: 'مهاجمة قطعتين أو أكثر للخصم في وقت واحد بقطعة واحدة.',
    },
  },
  {
    term: { fr: 'Tempo', en: 'Tempo', ar: 'الإيقاع / التوقيت (Tempo)' },
    weekRef: 7,
    definition: {
      fr: 'Un temps (un coup) gagné ou perdu dans la course au développement ou à l’attaque.',
      en: 'A single move or unit of time gained or lost in development or initiative.',
      ar: 'وحدة زمنية (نقلة واحدة) يتم ربحها أو خسارتها في النشر أو المبادرة.',
    },
  },
];
