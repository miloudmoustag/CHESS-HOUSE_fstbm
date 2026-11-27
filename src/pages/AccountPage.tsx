import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Award, Flame, LogOut, Shield, Sparkles } from 'lucide-react';
import type { PieceSymbol } from 'chess.js';
import { useAuth, type UserRole } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';
import { useI18n } from '../i18n';
import {
  ChessSignupShell,
  type FacultyCode,
  FacultySelector,
  formatFacultyValue,
  GoogleLogoSvg,
  PIECE_RANK_MAP,
  pieceFromElo,
  PieceSelectBadge,
} from '../components/chess/ChessSignupShell';

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 rounded-md border border-[#C6AF8B] dark:border-[#4A4238] bg-white dark:bg-[#1B1916] text-[#262421] dark:text-[#F2F0E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#538D4E]';

const PREVIEW_ROSTER_ACCOUNTS: { role: UserRole; email: string; name: string; badge: string }[] = [
  { role: 'admin', email: 'miloudmoustage@gmail.com', name: 'Miloud Moustage', badge: 'Board Admin · FST Paid' },
  { role: 'member', email: 'douae.example@usms.ac.ma', name: 'Douae Bouuda', badge: 'FST · Paid' },
  { role: 'member', email: 'ayoub.example@usms.ac.ma', name: 'Ayoub Elataoui', badge: 'FST · Paid' },
  { role: 'member', email: 'salma.example@usms.ac.ma', name: 'Salma Benali', badge: 'FST · Fee Pending' },
  { role: 'member', email: 'yassine.example@usms.ac.ma', name: 'Yassine Amrani', badge: 'ENSA · Paid' },
  { role: 'member', email: 'student@fstbm.ma', name: 'FST Student', badge: 'Demo (No Faculty)' },
];

export const AccountPage: React.FC = () => {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawNext = searchParams.get('next') || '';
  const safeNext = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/my-chess-house';
  const {
    user,
    isSupabaseReady,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    sendMagicLink,
    signOut,
    updateLeaderboardOptIn,
    previewSignInAs,
  } = useAuth();
  const { state, justMigrated } = useStudy();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [faculty, setFaculty] = useState<FacultyCode | ''>('');
  const [studyPlace, setStudyPlace] = useState('');
  const [chessElo, setChessElo] = useState('');
  const [preferredPiece, setPreferredPiece] = useState<PieceSymbol>('p');
  const [manualPiece, setManualPiece] = useState(false);
  const [showPreviewGooglePicker, setShowPreviewGooglePicker] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
    setNotice('');
    const formattedFaculty = formatFacultyValue(faculty, studyPlace);
    if (mode === 'signup' && (!formattedFaculty || (faculty === 'OTHER' && !studyPlace.trim()))) {
      setError(t.common.requiredField);
      return;
    }
    setBusy(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const res =
        mode === 'signin'
          ? await signInWithPassword(email.trim(), password, { faculty: formattedFaculty || undefined })
          : await signUpWithPassword(email.trim(), password, fullName, {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              phone: phone.trim(),
              faculty: formattedFaculty,
              chessElo: chessElo.trim() ? Number(chessElo) : null,
              preferredPiece,
            });
      if (res.error) setError(res.error);
      else if (mode === 'signup') {
        setNotice('Account created. Check your inbox if email confirmation is required, or jump to My Chess House.');
      } else if (rawNext) {
        navigate(safeNext);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleContinue = async () => {
    setError('');
    setNotice('');
    const formattedFaculty = formatFacultyValue(faculty, studyPlace);
    if (!isSupabaseReady) {
      setShowPreviewGooglePicker((prev) => !prev);
      return;
    }
    setBusy(true);
    try {
      const res = await signInWithGoogle({ faculty: formattedFaculty || undefined });
      if (res.error) setError(res.error);
    } finally {
      setBusy(false);
    }
  };

  const handlePreviewGooglePick = (role: UserRole, pickEmail: string, name: string) => {
    const formattedFaculty = formatFacultyValue(faculty, studyPlace);
    previewSignInAs(role, pickEmail, name, formattedFaculty || undefined);
    navigate(safeNext);
  };

  const handleMagicLink = async () => {
    setError('');
    setNotice('');
    if (!email.trim()) {
      setError('Enter your email first.');
      return;
    }
    setBusy(true);
    try {
      const res = await sendMagicLink(email.trim());
      if (res.error) setError(res.error);
      else setNotice('Sign-in link sent. Check your inbox.');
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <ChessSignupShell>
        <div className="space-y-5">
          {/* Switcher */}
          <div className="grid grid-cols-2 border border-[#C6AF8B] dark:border-[#4A4238] rounded-md overflow-hidden bg-[#EEDFC6] dark:bg-[#1B1916]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
                setNotice('');
              }}
              className={`py-2 text-xs font-semibold transition-colors ${
                mode === 'signin'
                  ? 'bg-[#262421] text-[#FAF5E8] dark:bg-[#538D4E] dark:text-white'
                  : 'text-[#574E44] dark:text-[#BFB8AC]'
              }`}
            >
              {t.account.signInTitle}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
                setNotice('');
              }}
              className={`py-2 text-xs font-semibold transition-colors ${
                mode === 'signup'
                  ? 'bg-[#262421] text-[#FAF5E8] dark:bg-[#538D4E] dark:text-white'
                  : 'text-[#574E44] dark:text-[#BFB8AC]'
              }`}
            >
              {t.account.signUpTitle}
            </button>
          </div>

          {/* Headline */}
          <div className="space-y-1.5">
            <h1 className="font-display text-3xl sm:text-[32px] font-bold tracking-tight text-[#262421] dark:text-[#F2F0E6]">
              {mode === 'signup' ? t.join.boardHeadline : t.account.signInTitle}
            </h1>
            <p className="text-sm text-[#574E44] dark:text-[#BFB8AC] leading-relaxed">
              {mode === 'signup' ? t.account.createAccountBoardSubtitle : t.account.signInBoardSubtitle}
            </p>
          </div>

          {/* Continue with Google Button */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleGoogleContinue}
              disabled={busy}
              className="w-full py-2.5 px-4 rounded-md bg-white dark:bg-[#1B1916] border border-[#C6AF8B] dark:border-[#4A4238] text-[#262421] dark:text-[#F2F0E6] text-sm font-semibold flex items-center justify-center gap-2.5 hover:bg-[#F5EFE2] dark:hover:bg-[#322C24] transition-colors shadow-xs"
            >
              <GoogleLogoSvg className="w-4 h-4 shrink-0" />
              <span>{t.account.continueWithGoogle}</span>
            </button>

            {showPreviewGooglePicker && !isSupabaseReady && (
              <div className="p-3.5 rounded-md border border-[#C6AF8B] dark:border-[#4A4238] bg-white/90 dark:bg-[#1B1916] space-y-2.5">
                <p className="text-xs font-semibold text-[#574E44] dark:text-[#BFB8AC]">
                  Choose a Google account (preview roster auto-links existing club members):
                </p>
                <div className="space-y-1.5">
                  {PREVIEW_ROSTER_ACCOUNTS.map((acct) => (
                    <button
                      key={acct.email}
                      type="button"
                      onClick={() => handlePreviewGooglePick(acct.role, acct.email, acct.name)}
                      className="w-full px-3 py-2 rounded border border-[#E2D4BC] dark:border-[#3A332B] hover:bg-[#FAF5E8] dark:hover:bg-[#2A2621] flex items-center justify-between text-left text-xs transition-colors"
                    >
                      <span>
                        <strong className="block text-[#262421] dark:text-[#F2F0E6]">{acct.name}</strong>
                        <span className="text-[#6B5F52] dark:text-[#A8A095]">{acct.email}</span>
                      </span>
                      <span className="font-mono-tabular text-[11px] font-semibold text-[#538D4E] dark:text-[#7FB979] shrink-0">
                        {acct.badge}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="Or any Google email..."
                    className="flex-1 px-2.5 py-1.5 rounded border border-[#C6AF8B] dark:border-[#4A4238] bg-white dark:bg-[#24211D] text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!customGoogleEmail.trim()) return;
                      const em = customGoogleEmail.trim();
                      const role: UserRole =
                        em.toLowerCase().includes('miloud') || em.toLowerCase().includes('board') ? 'admin' : 'member';
                      handlePreviewGooglePick(role, em, em.split('@')[0] || 'Student');
                    }}
                    className="px-3 py-1.5 rounded bg-[#538D4E] text-white text-xs font-semibold whitespace-nowrap shrink-0"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center py-0.5">
            <div className="flex-grow border-t border-[#D6C5A9] dark:border-[#413A32]" />
            <span className="shrink mx-3 text-xs text-[#6B5F52] dark:text-[#A8A095]">{t.account.orWithEmail}</span>
            <div className="flex-grow border-t border-[#D6C5A9] dark:border-[#413A32]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="acc-fname" className="block text-sm font-semibold mb-1.5">
                      {t.join.firstNameLabel}
                    </label>
                    <input
                      id="acc-fname"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label htmlFor="acc-lname" className="block text-sm font-semibold mb-1.5">
                      {t.join.lastNameLabel}
                    </label>
                    <input
                      id="acc-lname"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="acc-phone" className="block text-sm font-semibold mb-1.5">
                    {t.join.phoneLabel}
                  </label>
                  <input
                    id="acc-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06XXXXXXXX"
                    className={INPUT_CLASS}
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="acc-email" className="block text-sm font-semibold mb-1.5">
                {t.account.emailLabel}
              </label>
              <input
                id="acc-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="acc-pass" className="block text-sm font-semibold mb-1.5">
                {t.account.passwordLabel}
              </label>
              <input
                id="acc-pass"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              requireOtherDetail={mode === 'signup'}
              inputId="acc-study-place"
            />

            {mode === 'signup' && (
              <div>
                <label htmlFor="acc-elo" className="block text-sm font-semibold mb-1.5">
                  {t.join.chessEloLabel}
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    id="acc-elo"
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
            )}

            {error && <p className="text-xs font-medium text-[var(--danger)]">{error}</p>}
            {notice && <p className="text-xs font-medium text-[#538D4E] dark:text-[#7FB979]">{notice}</p>}

            <button
              type="submit"
              disabled={busy}
              className="btn-piece-slide w-full py-3 rounded-md bg-[#538D4E] hover:bg-[#467A42] text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {mode === 'signup' ? t.join.playYourMoveBtn : t.account.signInBtn}
            </button>
          </form>

          <button
            type="button"
            onClick={handleMagicLink}
            disabled={busy}
            className="w-full py-2 rounded-md border border-[#C6AF8B] dark:border-[#4A4238] text-xs font-semibold text-[#262421] dark:text-[#F2F0E6] hover:bg-[#EFE2CB] dark:hover:bg-[#322C24] transition-colors"
          >
            {t.account.magicLinkBtn}
          </button>

          <p className="text-xs text-[#6B5F52] dark:text-[#A8A095] leading-relaxed">
            {t.account.alreadyMemberLinkedNote}{' '}
            <Link to="/join" className="underline font-medium text-[#538D4E] dark:text-[#7FB979]">
              {t.nav.join}
            </Link>
          </p>
        </div>
      </ChessSignupShell>
    );
  }

  const completedWeeks = Object.values(state.weeks).filter(
    (w) => w.mastery === 'solid' || w.mastery === 'mastered'
  ).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      {justMigrated && (
        <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--accent-primary)] text-sm flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
          <span>{t.account.migratedToast}</span>
        </div>
      )}

      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono-tabular uppercase text-[var(--accent-gold)]">{user.role}</p>
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">{user.displayName}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/my-chess-house"
            className="btn-piece-slide inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t.nav.myChessHouse}
          </Link>
          {(user.role === 'board' || user.role === 'admin') && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--chess-charcoal)] text-[#EEEED2] dark:bg-[var(--accent-gold)] dark:text-[#1B1A17] text-xs font-semibold"
            >
              <Shield className="w-3.5 h-3.5" />
              {t.nav.admin}
            </Link>
          )}
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--border-strong)] text-xs font-semibold hover:bg-[var(--bg-subtle)]"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t.account.signOutBtn}
          </button>
        </div>
      </div>

      {/* Study Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5">
          <div className="text-2xl font-bold font-mono-tabular text-[var(--accent-primary)]">{state.rating}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Study Rating</div>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5">
          <div className="text-2xl font-bold font-mono-tabular text-[var(--accent-gold)] flex items-center gap-1.5">
            <Flame className="w-5 h-5" />
            {state.streakDays}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Day Streak</div>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5">
          <div className="text-2xl font-bold font-mono-tabular text-[var(--text-primary)]">{completedWeeks} / 8</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Weeks Solid+</div>
        </div>
        <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5">
          <div className="text-2xl font-bold font-mono-tabular text-[var(--text-primary)]">
            {state.puzzlesSolved.length}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Puzzles Solved</div>
        </div>
      </div>

      {/* Badges + Privacy Opt-In */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[var(--accent-gold)]" />
          <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">Badges & Privacy</h2>
        </div>

        {state.badges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {state.badges.map((b) => (
              <span
                key={b}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent-gold-bg)] border border-[var(--accent-gold)] text-xs font-semibold text-[var(--text-primary)]"
              >
                {b.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Complete lessons and tactical puzzles to earn club badges.</p>
        )}

        <label className="flex items-center gap-3 pt-3 border-t border-[var(--border-hairline)] cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={user.showOnLeaderboard}
            onChange={(e) => updateLeaderboardOptIn(e.target.checked)}
            className="rounded"
          />
          <span>{t.account.leaderboardOptIn}</span>
        </label>
      </div>
    </div>
  );
};
