/**
 * Normalizes a person's full name identically to the PostgreSQL `normalize_name` function:
 * - Lowercases
 * - Strips Latin accents/diacritics (NFD)
 * - Normalizes Arabic letter variants (أ/إ/آ -> ا, ة -> ه, ى -> ي, removes tashkeel)
 * - Removes punctuation and extra whitespace
 * - Sorts tokens alphabetically so "Miloud Moustage" == "Moustage Miloud"
 */
export function normalizeName(raw: string): string {
  if (!raw) return '';
  let s = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Arabic diacritics (tashkeel & tatweel)
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // Normalize Arabic letter variants
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .toLowerCase();

  // Keep only alphanumeric (Latin/Arabic/digits) and spaces
  s = s.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
  if (!s) return '';

  const tokens = s.split(/\s+/).filter(Boolean).sort((a, b) => a.localeCompare(b, 'en'));
  return tokens.join(' ');
}

/**
 * Normalizes a student ID or Moroccan phone number for identifier comparison.
 * Strips spaces, hyphens, dots, and converts +212 / 00212 prefix to leading 0.
 */
export function normalizeId(raw: string | null | undefined): string {
  if (!raw) return '';
  let s = raw.trim().toLowerCase().replace(/[\s\-().+]/g, '');
  if (s.startsWith('00212')) {
    s = '0' + s.slice(5);
  } else if (s.startsWith('212') && s.length >= 12) {
    s = '0' + s.slice(3);
  }
  return s;
}

/**
 * Computes PostgreSQL pg_trgm-compatible trigram similarity in [0, 1].
 * Pads string with two leading spaces and one trailing space per pg_trgm spec.
 */
export function trigrams(str: string): Set<string> {
  const clean = str.trim();
  if (!clean) return new Set();
  const padded = `  ${clean} `;
  const set = new Set<string>();
  for (let i = 0; i <= padded.length - 3; i++) {
    set.add(padded.slice(i, i + 3));
  }
  return set;
}

export function trigramSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const ta = trigrams(na);
  const tb = trigrams(nb);
  let intersection = 0;
  for (const t of ta) {
    if (tb.has(t)) intersection++;
  }
  const union = ta.size + tb.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
