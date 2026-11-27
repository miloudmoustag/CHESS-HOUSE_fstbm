import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import type { PieceSymbol } from 'chess.js';
import { useI18n } from '../i18n';
import { PawnToQueenTrack } from '../components/chess/PawnToQueenTrack';
import { TurnstileWidget } from '../components/common/TurnstileWidget';
import {
  ChessSignupShell,
  type FacultyCode,
  FacultySelector,
  formatFacultyValue,
  levelFromPieceAndElo,
  PIECE_RANK_MAP,
  pieceFromElo,
  PieceSelectBadge,
} from '../components/chess/ChessSignupShell';

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 rounded-md border border-[#C6AF8B] dark:border-[#4A4238] bg-white dark:bg-[#1B1916] text-[#262421] dark:text-[#F2F0E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#538D4E]';

export const JoinPage: React.FC = () => {
  const { t, locale } = useI18n();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [faculty, setFaculty] = useState<FacultyCode | ''>('');
  const [studyPlace, setStudyPlace] = useState('');
  const [chessElo, setChessElo] = useState('');
  const [preferredPiece, setPreferredPiece] = useState<PieceSymbol>('p');
  const [manualPiece, setManualPiece] = useState(false);
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [resultStatus, setResultStatus] = useState<'pending' | 'duplicate' | null>(null);
  const [error, setError] = useState('');

  const handleEloChange = (val: string) => {
    setChessElo(val);
    if (!manualPiece) {
      setPreferredPiece(pieceFromElo(val));
    }
  };

  const handleCyclePiece = () => {
    setManualPiece(true);
    const idx = PIECE_RANK_MAP.findIndex((item) => item.piece === preferredPiece);
    const next = PIECE_RANK_MAP[(idx + 1) % PIECE_RANK_MAP.length];
    setPreferredPiece(next.piece);
  };

  const activePieceEntry = PIECE_RANK_MAP.find((item) => item.piece === preferredPiece) ?? PIECE_RANK_MAP[0];
  const pieceLabel = `${t.join.yourPieceLabel} (${activePieceEntry.label[locale]})`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const formattedFaculty = formatFacultyValue(faculty, studyPlace);
    if (
      firstName.trim().length < 2 ||
      lastName.trim().length < 2 ||
      identifier.trim().length < 3 ||
      !email.trim() ||
      !formattedFaculty ||
      (faculty === 'OTHER' && !studyPlace.trim()) ||
      !consent
    ) {
      setError(t.common.requiredField);
      return;
    }

    setSubmitting(true);
    setStep(2);
    try {
      const level = levelFromPieceAndElo(preferredPiece, chessElo);
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'membership',
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          fullName,
          phone: phone.trim(),
          identifier: identifier.trim(),
          email: email.trim(),
          faculty: formattedFaculty,
          department: formattedFaculty,
          level,
          chessElo: chessElo.trim() ? Number(chessElo) : null,
          preferredPiece,
          consent,
          turnstileToken,
          website: honeypot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.common.errorGeneric);
        setStep(1);
        return;
      }
      setStep(3);
      setResultStatus(data.status === 'duplicate' ? 'duplicate' : 'pending');
    } catch {
      setError(t.common.errorGeneric);
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ChessSignupShell>
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h1 className="font-display text-3xl sm:text-[32px] font-bold tracking-tight text-[#262421] dark:text-[#F2F0E6]">
            {t.join.boardHeadline}
          </h1>
          <p className="text-sm text-[#574E44] dark:text-[#BFB8AC] leading-relaxed">{t.join.boardSubtitle}</p>
          <p className="text-xs text-[#6B5F52] dark:text-[#A8A095] pt-0.5">
            <Link to="/account" className="underline font-medium text-[#538D4E] dark:text-[#7FB979] hover:opacity-80">
              {t.join.alreadyMemberPrompt} →
            </Link>
          </p>
        </div>

        <PawnToQueenTrack
          step={step}
          labels={[t.tournaments.stepDetails, t.tournaments.stepCheck, t.tournaments.stepConfirmed]}
        />

        {resultStatus ? (
          <div className="p-6 rounded-xl bg-white/80 dark:bg-[#1B1916] border border-[#538D4E] text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-[#538D4E] mx-auto" />
            <h2 className="font-display text-2xl font-bold text-[#262421] dark:text-[#F2F0E6]">{t.join.successTitle}</h2>
            <p className="text-sm text-[#574E44] dark:text-[#BFB8AC] leading-relaxed">
              {resultStatus === 'duplicate' ? t.join.duplicateBody : t.join.successBody}
            </p>
            <div className="pt-2">
              <Link
                to="/account"
                className="inline-flex px-5 py-2.5 rounded-md bg-[#538D4E] text-white text-xs font-semibold hover:bg-[#467A42]"
              >
                {t.account.signInTitle}
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="j-fname" className="block text-sm font-semibold mb-1.5">
                  {t.join.firstNameLabel}
                </label>
                <input
                  id="j-fname"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="j-lname" className="block text-sm font-semibold mb-1.5">
                  {t.join.lastNameLabel}
                </label>
                <input
                  id="j-lname"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="j-phone" className="block text-sm font-semibold mb-1.5">
                  {t.join.phoneLabel}
                </label>
                <input
                  id="j-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="06XXXXXXXX"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="j-id" className="block text-sm font-semibold mb-1.5">
                  {t.tournaments.identifierLabel} *
                </label>
                <input
                  id="j-id"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="CNE / Apogée"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div>
              <label htmlFor="j-email" className="block text-sm font-semibold mb-1.5">
                {t.league.emailLabel}
              </label>
              <input
                id="j-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <FacultySelector
              faculty={faculty}
              onFacultyChange={setFaculty}
              studyPlace={studyPlace}
              onStudyPlaceChange={setStudyPlace}
              facultyLabel={t.join.facultyLabel}
              othersLabel={t.join.facultyOthersLabel}
              studyPlaceLabel={t.join.studyPlaceLabel}
              studyPlacePlaceholder={t.join.studyPlacePlaceholder}
              studyPlaceOtherPlaceholder={t.join.studyPlaceOtherPlaceholder}
              requireOtherDetail
              inputId="j-study-place"
            />

            <div>
              <label htmlFor="j-elo" className="block text-sm font-semibold mb-1.5">
                {t.join.chessEloLabel}
              </label>
              <div className="flex items-center gap-2.5">
                <input
                  id="j-elo"
                  type="number"
                  min={100}
                  max={3200}
                  value={chessElo}
                  onChange={(e) => handleEloChange(e.target.value)}
                  placeholder={t.join.chessEloPlaceholder}
                  className={INPUT_CLASS}
                />
                <PieceSelectBadge piece={preferredPiece} label={pieceLabel} onCycle={handleCyclePiece} />
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-[#574E44] dark:text-[#BFB8AC] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
                className="mt-0.5 rounded"
              />
              <span>{t.common.consentLabel}</span>
            </label>

            <TurnstileWidget onToken={setTurnstileToken} honeypot={honeypot} onHoneypotChange={setHoneypot} />

            {error && (
              <p role="alert" className="text-xs font-medium text-[var(--danger)]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-piece-slide w-full py-3 rounded-md bg-[#538D4E] hover:bg-[#467A42] text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {submitting ? t.common.loading : t.join.playYourMoveBtn}
            </button>
          </form>
        )}
      </div>
    </ChessSignupShell>
  );
};
