/**
 * Lightweight, zero-dependency client-side PDF generator for weekly cheat-sheets and certificates.
 */
function escapePdfText(text: string): string {
  // Normalize accented Latin chars to ASCII-safe Latin-1 for Type1 Helvetica compatibility
  const ascii = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ');
  return ascii.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPdfBlob(title: string, subtitle: string, lines: string[], footer: string): Blob {
  let y = 760;
  let stream = '';
  // Decorative border rectangle
  stream += '0.46 0.59 0.34 RG 2 w 36 36 523 770 re S\n';
  stream += '0.79 0.64 0.29 RG 1 w 44 44 507 754 re S\n';

  stream += `BT\n0.15 0.14 0.13 rg\n/F2 20 Tf\n60 ${y} Td\n(${escapePdfText(title)}) Tj\n`;
  y -= 26;
  stream += `/F1 12 Tf\n0.46 0.59 0.34 rg\n0 -26 Td\n(${escapePdfText(subtitle)}) Tj\n`;
  y -= 24;
  stream += `/F1 11 Tf\n0.15 0.14 0.13 rg\n0 -24 Td\n`;

  for (const rawLine of lines) {
    // Simple wrap at ~82 chars
    const words = rawLine.split(' ');
    let current = '';
    for (const w of words) {
      if ((current + ' ' + w).trim().length > 80) {
        if (y < 80) break;
        stream += `(${escapePdfText(current.trim())}) Tj\n0 -16 Td\n`;
        y -= 16;
        current = w;
      } else {
        current = (current + ' ' + w).trim();
      }
    }
    if (current && y >= 80) {
      stream += `(${escapePdfText(current)}) Tj\n0 -18 Td\n`;
      y -= 18;
    }
  }

  stream += `ET\nBT\n/F1 9 Tf\n0.45 0.43 0.40 rg\n60 62 Td\n(${escapePdfText(footer)}) Tj\nET\n`;

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

export function downloadCheatSheetPdf(params: {
  weekNumber: number;
  weekTitle: string;
  phase: string;
  keyTakeaways: string[];
}): void {
  const blob = buildPdfBlob(
    `Chess House Academy - Week ${params.weekNumber}`,
    `${params.phase}: ${params.weekTitle}`,
    [
      'Weekly Study Cheat-Sheet (FST Beni Mellal - Chess House Club)',
      '',
      ...params.keyTakeaways.map((t, i) => `${i + 1}. ${t}`),
      '',
      'Remember our backwards method: Endgames first, then Middlegame, then Opening.',
    ],
    'Chess House Club | Faculte des Sciences et Techniques de Beni Mellal (USMS) | Chesshouse58@gmail.com'
  );
  triggerDownload(blob, `chess-house-week-${params.weekNumber}-cheatsheet.pdf`);
}

export function downloadCertificatePdf(params: {
  learnerName: string;
  levelTitle: string;
  dateIso: string;
}): void {
  const blob = buildPdfBlob(
    'CERTIFICATE OF COMPLETION',
    'Chess House Club — FST Beni Mellal (USMS)',
    [
      'This certifies that',
      '',
      `   ${params.learnerName}`,
      '',
      `has completed the structured curriculum track:`,
      `   ${params.levelTitle}`,
      '',
      `Issued on ${params.dateIso.slice(0, 10)} by Chess House Club (Founded 18 October 2025).`,
      'President: Miloud Moustage | Official Club Academy Record',
    ],
    'Chess House Club FST Beni Mellal | @chess_house_fstbm'
  );
  triggerDownload(blob, `chess-house-certificate-${params.dateIso.slice(0, 10)}.pdf`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
