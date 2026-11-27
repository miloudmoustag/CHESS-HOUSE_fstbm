import React from 'react';
import type { PieceSymbol } from 'chess.js';

export const PIECE_RANK_MAP: { piece: PieceSymbol; label: { fr: string; en: string; ar: string }; minElo: number }[] = [
  { piece: 'p', label: { fr: 'Pion', en: 'Pawn', ar: 'بيدق' }, minElo: 0 },
  { piece: 'n', label: { fr: 'Cavalier', en: 'Knight', ar: 'حصان' }, minElo: 1000 },
  { piece: 'b', label: { fr: 'Fou', en: 'Bishop', ar: 'فيل' }, minElo: 1300 },
  { piece: 'r', label: { fr: 'Tour', en: 'Rook', ar: 'قلعة' }, minElo: 1600 },
  { piece: 'q', label: { fr: 'Dame', en: 'Queen', ar: 'وزيرة' }, minElo: 1900 },
  { piece: 'k', label: { fr: 'Roi', en: 'King', ar: 'ملك' }, minElo: 2200 },
];

export function pieceFromElo(eloRaw: string | number | null | undefined): PieceSymbol {
  const num = Number(eloRaw);
  if (!Number.isFinite(num) || num <= 0) return 'p';
  if (num >= 2200) return 'k';
  if (num >= 1900) return 'q';
  if (num >= 1600) return 'r';
  if (num >= 1300) return 'b';
  if (num >= 1000) return 'n';
  return 'p';
}

export function levelFromPieceAndElo(
  piece: PieceSymbol,
  eloRaw?: string | number | null
): 'beginner' | 'intermediate' | 'advanced' {
  const num = Number(eloRaw);
  if (Number.isFinite(num) && num >= 1600) return 'advanced';
  if (Number.isFinite(num) && num >= 1000) return 'intermediate';
  if (piece === 'r' || piece === 'q' || piece === 'k') return 'advanced';
  if (piece === 'n' || piece === 'b') return 'intermediate';
  return 'beginner';
}

const BoardPieceGlyph: React.FC<{ piece: PieceSymbol }> = ({ piece }) => {
  const fill = '#1B1917';
  const accent = '#F0D9B5';
  return (
    <svg viewBox="0 0 45 45" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true" focusable="false">
      {piece === 'p' && (
        <path
          d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
          fill={fill}
        />
      )}
      {piece === 'r' && (
        <g fill={fill}>
          <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5l-3 3H14l-3-3z" />
          <path d="M14 17h17v12.5H14z" />
          <path d="M12.5 32l1.5-2.5h17l1.5 2.5z" />
        </g>
      )}
      {piece === 'n' && (
        <g fill={fill}>
          <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
          <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" />
          <circle cx="15" cy="15.5" r="1.1" fill={accent} />
        </g>
      )}
      {piece === 'b' && (
        <g fill={fill}>
          <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z" />
          <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
          <circle cx="22.5" cy="8" r="2.5" />
          <path d="M20 18h5M22.5 15.5v5" stroke={accent} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}
      {piece === 'q' && (
        <g fill={fill}>
          <circle cx="6" cy="12" r="2.3" />
          <circle cx="14" cy="9" r="2.3" />
          <circle cx="22.5" cy="8" r="2.3" />
          <circle cx="31" cy="9" r="2.3" />
          <circle cx="39" cy="12" r="2.3" />
          <path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26z" />
          <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" />
        </g>
      )}
      {piece === 'k' && (
        <g fill={fill}>
          <path d="M22.5 11.63V6M20 8h5" stroke={fill} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" />
          <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z" />
        </g>
      )}
    </svg>
  );
};

const BACK_RANK: PieceSymbol[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
const PAWN_RANK: PieceSymbol[] = ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'];

export const ChessBoardCardHeader: React.FC = () => {
  return (
    <div className="chessboard-ltr w-full overflow-hidden rounded-t-xl border-b border-[#B58863]/40" aria-hidden="true">
      <div className="grid grid-cols-8">
        {BACK_RANK.map((piece, idx) => {
          const isLight = idx % 2 === 0;
          return (
            <div
              key={`r1-${idx}`}
              className={`aspect-square flex items-center justify-center ${
                isLight ? 'bg-[#F0D9B5]' : 'bg-[#B58863]'
              }`}
            >
              <BoardPieceGlyph piece={piece} />
            </div>
          );
        })}
        {PAWN_RANK.map((piece, idx) => {
          const isLight = idx % 2 === 1;
          return (
            <div
              key={`r2-${idx}`}
              className={`aspect-square flex items-center justify-center ${
                isLight ? 'bg-[#F0D9B5]' : 'bg-[#B58863]'
              }`}
            >
              <BoardPieceGlyph piece={piece} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ChessSignupShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#3B2616] dark:bg-[#191511] py-8 sm:py-12 px-4 sm:px-6 flex items-start justify-center">
      <div className="w-full max-w-xl rounded-xl overflow-hidden bg-[#FAF5E8] dark:bg-[#24211D] text-[#262421] dark:text-[#F2F0E6] border border-[#C6AF8B] dark:border-[#413A32] shadow-xl">
        <ChessBoardCardHeader />
        <div className="p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
};

export const GoogleLogoSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
    />
  </svg>
);

export const PieceSelectBadge: React.FC<{
  piece: PieceSymbol;
  label: string;
  onCycle?: () => void;
}> = ({ piece, label, onCycle }) => {
  return (
    <button
      type="button"
      onClick={onCycle}
      title={label}
      className="h-[42px] px-3.5 rounded-md border border-[#C6AF8B] dark:border-[#4A4238] bg-[#E8D5B5] dark:bg-[#322C24] text-[#262421] dark:text-[#F2F0E6] inline-flex items-center justify-center gap-2 text-xs font-semibold hover:bg-[#DFC7A0] dark:hover:bg-[#3D352C] transition-colors whitespace-nowrap shrink-0"
    >
      <span className="w-5 h-5 inline-flex items-center justify-center">
        <BoardPieceGlyph piece={piece} />
      </span>
      <span>{label}</span>
    </button>
  );
};

export const FACULTY_CODES = ['FST', 'FP', 'EST', 'ENSA', 'ENSG', 'ENS', 'OTHER'] as const;
export type FacultyCode = (typeof FACULTY_CODES)[number];

export function formatFacultyValue(faculty: FacultyCode | '', studyPlace: string): string {
  const cleanPlace = studyPlace.trim();
  if (!faculty && !cleanPlace) return '';
  if (faculty === 'OTHER') {
    return cleanPlace || 'Other';
  }
  if (!faculty) return cleanPlace;
  return cleanPlace ? `${faculty} — ${cleanPlace}` : faculty;
}

export const FacultySelector: React.FC<{
  faculty: FacultyCode | '';
  onFacultyChange: (next: FacultyCode) => void;
  studyPlace: string;
  onStudyPlaceChange: (next: string) => void;
  facultyLabel: string;
  othersLabel: string;
  studyPlaceLabel: string;
  studyPlacePlaceholder: string;
  studyPlaceOtherPlaceholder: string;
  requireOtherDetail?: boolean;
  inputId?: string;
}> = ({
  faculty,
  onFacultyChange,
  studyPlace,
  onStudyPlaceChange,
  facultyLabel,
  othersLabel,
  studyPlaceLabel,
  studyPlacePlaceholder,
  studyPlaceOtherPlaceholder,
  requireOtherDetail = false,
  inputId = 'faculty-study-input',
}) => {
  return (
    <div className="space-y-2.5">
      <div>
        <span className="block text-sm font-semibold mb-1.5">{facultyLabel}</span>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={facultyLabel}>
          {FACULTY_CODES.map((code) => {
            const active = faculty === code;
            const displayLabel = code === 'OTHER' ? othersLabel : code;
            return (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onFacultyChange(code)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#538D4E] text-white border-[#538D4E]'
                    : 'bg-white dark:bg-[#1B1916] text-[#262421] dark:text-[#F2F0E6] border-[#C6AF8B] dark:border-[#4A4238] hover:bg-[#EFE2CB] dark:hover:bg-[#322C24]'
                }`}
              >
                {displayLabel}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor={inputId} className="block text-xs font-semibold text-[#574E44] dark:text-[#BFB8AC] mb-1">
          {studyPlaceLabel}
          {faculty === 'OTHER' && requireOtherDetail ? ' *' : ''}
        </label>
        <input
          id={inputId}
          type="text"
          required={faculty === 'OTHER' && requireOtherDetail}
          value={studyPlace}
          onChange={(e) => onStudyPlaceChange(e.target.value)}
          placeholder={faculty === 'OTHER' ? studyPlaceOtherPlaceholder : studyPlacePlaceholder}
          className="w-full px-3.5 py-2.5 rounded-md border border-[#C6AF8B] dark:border-[#4A4238] bg-white dark:bg-[#1B1916] text-[#262421] dark:text-[#F2F0E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#538D4E]"
        />
      </div>
    </div>
  );
};

