/**
 * Determines whether a stored faculty/school string belongs to FST Béni Mellal (FST).
 * Accepts "FST", "FST — MIP", "FST Béni Mellal", "FSTBM", "Faculté des Sciences et Techniques",
 * while returning false for other institutions (FP, EST, ENSA, ENSG, ENS, ENCG, etc.).
 */
export function isFstFaculty(faculty: string | null | undefined): boolean {
  if (!faculty) return false;
  const normalized = faculty
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (!normalized) return false;

  if (/^fst(\b|[^a-z])/.test(normalized) || normalized === 'fstbm') {
    return true;
  }

  if (
    normalized.includes('faculte des sciences et techniques') ||
    normalized.includes('faculty of sciences and techniques')
  ) {
    return true;
  }

  return false;
}
