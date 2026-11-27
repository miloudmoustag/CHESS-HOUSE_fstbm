import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const root = process.cwd();
const placeholdersDir = path.join(root, 'public', 'images', 'placeholders');
const assetsDir = path.join(root, 'public', 'assets');
const docsDir = path.join(root, 'public', 'docs');

fs.mkdirSync(placeholdersDir, { recursive: true });
fs.mkdirSync(assetsDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

// Minimal pure-Node PNG encoder (RGBA)
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createChessPng(size: number, bgHex: [number, number, number], fgHex: [number, number, number], accentHex: [number, number, number], maskable = false): Buffer {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const pad = maskable ? Math.floor(size * 0.15) : Math.floor(size * 0.08);
  const inner = size - pad * 2;
  const cell = Math.max(1, Math.floor(inner / 4));

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter none
    for (let x = 0; x < size; x++) {
      const idx = rowStart + 1 + x * 4;
      let r = bgHex[0], g = bgHex[1], b = bgHex[2];

      const inInner = x >= pad && x < pad + cell * 4 && y >= pad && y < pad + cell * 4;
      if (inInner) {
        const cx = Math.floor((x - pad) / cell);
        const cy = Math.floor((y - pad) / cell);
        const isDarkSquare = (cx + cy) % 2 === 1;
        if (isDarkSquare) {
          r = fgHex[0]; g = fgHex[1]; b = fgHex[2];
        } else {
          r = 238; g = 238; b = 210; // #EEEED2
        }
        // Center gold crown/emblem diamond
        const dx = Math.abs(x - size / 2);
        const dy = Math.abs(y - size / 2);
        if (dx + dy < inner * 0.24) {
          r = accentHex[0]; g = accentHex[1]; b = accentHex[2];
        }
      }

      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
      raw[idx + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))]);
}

// Write PNG icons and logos
fs.writeFileSync(path.join(root, 'public', 'pwa-192x192.png'), createChessPng(192, [38, 36, 33], [118, 150, 86], [201, 162, 75]));
fs.writeFileSync(path.join(root, 'public', 'pwa-512x512.png'), createChessPng(512, [38, 36, 33], [118, 150, 86], [201, 162, 75]));
fs.writeFileSync(path.join(root, 'public', 'pwa-maskable-512x512.png'), createChessPng(512, [38, 36, 33], [118, 150, 86], [201, 162, 75], true));
fs.writeFileSync(path.join(root, 'public', 'apple-touch-icon.png'), createChessPng(180, [38, 36, 33], [118, 150, 86], [201, 162, 75]));
fs.writeFileSync(path.join(assetsDir, 'club-logo.png'), createChessPng(192, [38, 36, 33], [118, 150, 86], [201, 162, 75]));
fs.writeFileSync(path.join(assetsDir, 'fst-logo.png'), createChessPng(192, [24, 52, 94], [46, 91, 158], [201, 162, 75]));

// Crisp SVG logos & favicon
const clubLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect width="120" height="120" rx="18" fill="#262421"/>
  <rect x="8" y="8" width="104" height="104" rx="12" fill="none" stroke="#C9A24B" stroke-width="2"/>
  <path d="M36 42L46 28L60 38L74 28L84 42L79 58H41L36 42Z" fill="#EEEED2"/>
  <rect x="39" y="61" width="42" height="6" rx="2" fill="#C9A24B"/>
  <rect x="35" y="70" width="50" height="7" rx="2" fill="#769656"/>
  <text x="60" y="92" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="11" fill="#EEEED2" letter-spacing="1">CHESS HOUSE</text>
  <text x="60" y="104" text-anchor="middle" font-family="sans-serif" font-weight="600" font-size="8" fill="#C9A24B" letter-spacing="1.5">FST · BM</text>
</svg>`;

const fstLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect width="120" height="120" rx="18" fill="#1B365D"/>
  <rect x="8" y="8" width="104" height="104" rx="12" fill="none" stroke="#C9A24B" stroke-width="2"/>
  <circle cx="60" cy="44" r="20" fill="none" stroke="#EEEED2" stroke-width="2.5"/>
  <path d="M48 44H72M60 32V56" stroke="#C9A24B" stroke-width="2.5" stroke-linecap="round"/>
  <text x="60" y="83" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="16" fill="#FFFFFF" letter-spacing="2">FST BM</text>
  <text x="60" y="98" text-anchor="middle" font-family="sans-serif" font-weight="600" font-size="7.5" fill="#C9A24B" letter-spacing="1">USMS · BÉNI MELLAL</text>
</svg>`;

fs.writeFileSync(path.join(root, 'public', 'icon.svg'), clubLogoSvg);
fs.writeFileSync(path.join(assetsDir, 'club-logo.svg'), clubLogoSvg);
fs.writeFileSync(path.join(assetsDir, 'fst-logo.svg'), fstLogoSvg);

// Placeholder SVGs
interface PlaceholderSpec {
  file: string;
  label: string;
  w: number;
  h: number;
  subtitle: string;
  accent?: string;
}

const placeholders: PlaceholderSpec[] = [
  { file: 'hero-club.svg', label: 'HERO CLUB SESSION', w: 1200, h: 800, subtitle: 'Monday & Thursday Sessions · FST Béni Mellal' },
  { file: 'og-cover.svg', label: 'OG SOCIAL COVER', w: 1200, h: 630, subtitle: 'Chess House Club · FST Béni Mellal' },
  { file: 'board-miloud.svg', label: 'BOARD PRESIDENT', w: 600, h: 750, subtitle: 'Miloud Moustage · 2026/27' },
  { file: 'board-douae.svg', label: 'BOARD VICE-PRESIDENT', w: 600, h: 750, subtitle: 'Douae Bouuda · 2026/27' },
  { file: 'board-ayoub.svg', label: 'BOARD SEC. GENERAL', w: 600, h: 750, subtitle: 'Ayoub Elataoui · 2026/27' },
  { file: 'board-khalid.svg', label: 'BOARD TREASURER', w: 600, h: 750, subtitle: 'Khalid Elmouhi · 2026/27' },
  { file: 'board-haitam.svg', label: 'BOARD EVENTS', w: 600, h: 750, subtitle: 'Haitam Daoud · 2026/27' },
  { file: 'board-youssef.svg', label: 'BOARD COMMUNICATION', w: 600, h: 750, subtitle: 'Youssef Hamdan · 2026/27' },
  { file: 'board-doha.svg', label: 'BOARD MEDIA', w: 600, h: 750, subtitle: 'Doha Douhabi · 2026/27' },
  { file: 'event-tournament-nov.svg', label: 'EVENT TOURNAMENT NOV 30', w: 1200, h: 800, subtitle: 'Block A Courtyard · 9 Rounds 5+2' },
  { file: 'event-cinema.svg', label: 'EVENT CHESS CINEMA', w: 1200, h: 800, subtitle: '30 October 2026 · Halloween Screening' },
  { file: 'event-halloween.svg', label: 'EVENT HALLOWEEN CHESS', w: 1200, h: 800, subtitle: 'University Chess Evening' },
  { file: 'event-iucc.svg', label: 'EVENT INTER-UNI ONLINE', w: 1200, h: 800, subtitle: '24 Clubs · 220+ Students' },
  { file: 'gallery-01.svg', label: 'GALLERY 01', w: 1200, h: 800, subtitle: 'Founding Session · October 2025' },
  { file: 'gallery-02.svg', label: 'GALLERY 02', w: 1200, h: 800, subtitle: 'Monday Beginner Training · Block A' },
  { file: 'gallery-03.svg', label: 'GALLERY 03', w: 1200, h: 800, subtitle: 'Thursday Open Play · Block C' },
  { file: 'gallery-04.svg', label: 'GALLERY 04', w: 1200, h: 800, subtitle: 'Inter-University Online League' },
  { file: 'gallery-05.svg', label: 'GALLERY 05', w: 1200, h: 800, subtitle: 'Chess Cinema Night · 30 Oct 2026' },
  { file: 'gallery-06.svg', label: 'GALLERY 06', w: 1200, h: 800, subtitle: 'Halloween Chess Gathering' },
  { file: 'gallery-07.svg', label: 'GALLERY 07', w: 1200, h: 800, subtitle: '2026/27 Board Election · 25 Sep' },
  { file: 'gallery-08.svg', label: 'GALLERY 08', w: 1200, h: 800, subtitle: 'Endgame Study Workshop' },
  { file: 'partner-01.svg', label: 'PARTNER SLOT 01', w: 600, h: 300, subtitle: 'Institutional Sponsor' },
  { file: 'partner-02.svg', label: 'PARTNER SLOT 02', w: 600, h: 300, subtitle: 'Academic Partner' },
  { file: 'partner-03.svg', label: 'PARTNER SLOT 03', w: 600, h: 300, subtitle: 'Community Supporter' },
  { file: 'partner-04.svg', label: 'PARTNER SLOT 04', w: 600, h: 300, subtitle: 'Equipment Partner' },
];

for (const spec of placeholders) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${spec.w} ${spec.h}" width="${spec.w}" height="${spec.h}">
  <defs>
    <pattern id="board" width="80" height="80" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="#2E2B27"/>
      <rect x="40" width="40" height="40" fill="#262421"/>
      <rect y="40" width="40" height="40" fill="#262421"/>
      <rect x="40" y="40" width="40" height="40" fill="#2E2B27"/>
    </pattern>
  </defs>
  <rect width="${spec.w}" height="${spec.h}" fill="url(#board)"/>
  <rect x="24" y="24" width="${spec.w - 48}" height="${spec.h - 48}" fill="none" stroke="#769656" stroke-width="2" stroke-opacity="0.6"/>
  <rect x="${spec.w / 2 - 220}" y="${spec.h / 2 - 72}" width="440" height="144" rx="8" fill="#262421" fill-opacity="0.92" stroke="#C9A24B" stroke-width="1.5"/>
  <text x="${spec.w / 2}" y="${spec.h / 2 - 18}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="24" fill="#EEEED2">${spec.label}</text>
  <text x="${spec.w / 2}" y="${spec.h / 2 + 12}" text-anchor="middle" font-family="monospace" font-size="16" fill="#C9A24B">${spec.w}x${spec.h}</text>
  <text x="${spec.w / 2}" y="${spec.h / 2 + 40}" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#B8B3A8">${spec.subtitle}</text>
</svg>`;
  fs.writeFileSync(path.join(placeholdersDir, spec.file), svg);
}

// Minimal valid PDF generator for placeholder documents
function makeMinimalPdf(title: string, bodyLines: string[]): Buffer {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  let content = `BT\n/F1 18 Tf\n50 760 Td\n(${esc(title)}) Tj\n/F1 11 Tf\n0 -28 Td\n`;
  for (const line of bodyLines) {
    content += `(${esc(line)}) Tj\n0 -18 Td\n`;
  }
  content += `ET\n`;

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}endstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += obj;
  }
  const xrefPos = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

const docs = [
  {
    file: 'reglement-interieur-fr.pdf',
    title: 'Chess House Club - Reglement Interieur (Placeholder)',
    lines: [
      'Faculte des Sciences et Techniques de Beni Mellal - USMS',
      'Fonde le 18 octobre 2025.',
      'Document de remplacement temporaire. Remplacez ce fichier dans /public/docs/',
      'par le reglement interieur officiel signe par le bureau 2026/27.',
    ],
  },
  {
    file: 'reglement-interieur-ar.pdf',
    title: 'Chess House Club - Reglement Interieur AR (Placeholder)',
    lines: [
      'Faculte des Sciences et Techniques de Beni Mellal - USMS',
      'Version arabe du reglement interieur (fichier temporaire).',
      'Remplacez /public/docs/reglement-interieur-ar.pdf par le PDF officiel en arabe.',
    ],
  },
  {
    file: 'presentation-club-fr.pdf',
    title: 'Chess House Club - Presentation Officielle (Placeholder)',
    lines: [
      'Club Chess House BM - FST Beni Mellal',
      'Seances hebdomadaires: Lundi et Jeudi 12h00-14h00.',
      'Formation debutants, tournois internes et ligue inter-universitaire.',
      'Remplacez /public/docs/presentation-club-fr.pdf par la brochure finale.',
    ],
  },
  {
    file: 'pv-election-2026.pdf',
    title: 'Proces-Verbal Election Bureau 2026/27 (Placeholder)',
    lines: [
      'Assemblee elective du 25 septembre 2026 (15 membres presents).',
      'President: Miloud Moustage | Vice-Presidente: Douae Bouuda',
      'Secretaire General: Ayoub Elataoui | Tresorier: Khalid Elmouhi',
      'Evenements: Haitam Daoud | Communication: Youssef Hamdan | Media: Doha Douhabi',
    ],
  },
  {
    file: 'dossier-sponsoring-fr.pdf',
    title: 'Chess House Club - Dossier de Sponsoring 2026/27 (Placeholder)',
    lines: [
      'Partenariats et mecenat etudiant - FST Beni Mellal (USMS)',
      'Portee: 24 clubs universitaires, 220+ etudiants lors des tournois en ligne.',
      'Contact officiel: Chesshouse58@gmail.com | @chess_house_fstbm',
      'Remplacez /public/docs/dossier-sponsoring-fr.pdf par votre dossier final.',
    ],
  },
];

for (const d of docs) {
  fs.writeFileSync(path.join(docsDir, d.file), makeMinimalPdf(d.title, d.lines));
}

fs.writeFileSync(
  path.join(root, 'public', 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: /sitemap.xml\n`
);

const routes = [
  '/',
  '/about',
  '/activities',
  '/roadmap',
  '/events',
  '/tournaments',
  '/league',
  '/join',
  '/academy',
  '/hall',
  '/gallery',
  '/news',
  '/partners',
  '/documents',
  '/faq',
  '/contact',
  '/privacy',
  '/legal',
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => `  <url><loc>${r}</loc></url>`).join('\n')}
</urlset>\n`;

fs.writeFileSync(path.join(root, 'public', 'sitemap.xml'), sitemap);

console.log('Generated all placeholder SVGs, PNG icons/logos, PDF docs, robots.txt, and sitemap.xml.');
