import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  CalendarPlus,
  Check,
  Download,
  Lock,
  Printer,
  RefreshCw,
  Shield,
  Trophy,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { computeStandings, GameResult, SwissGameRecord, SwissPlayer } from '../lib/swiss';
import {
  AttendanceRecord,
  DEFAULT_XP_REWARDS,
  PassportActivityType,
  XpRewardsConfig,
  XpTransactionRecord,
} from '../lib/passport';
import type { ClubEventItem, LeagueClubRow } from '../data/clubContent';

interface MemberRow {
  id: string;
  full_name: string;
  identifier: string;
  email: string;
  department: string;
  fees_paid: boolean;
  status: string;
}

interface RegistrationRow {
  id: string;
  tournament_id: string;
  full_name: string;
  identifier: string;
  contact: string;
  category: 'open' | 'women';
  status: string;
  created_at: string;
}

interface TournamentPlayerRow {
  id: string;
  tournament_id: string;
  full_name: string;
  email: string;
  phone: string;
  identifier: string;
  faculty: string;
  category: 'open' | 'women';
  chess_elo: number | null;
  preferred_piece: string;
  created_at: string;
}

interface TournamentRow {
  id: string;
  slug: string;
  name: { fr: string; en: string; ar: string };
  capacity: number;
  is_open: boolean;
}

interface RoundRow {
  id: string;
  tournament_id: string;
  round_number: number;
  category: 'open' | 'women';
}

interface GameRow {
  id: string;
  round_id: string;
  tournament_id: string;
  board: number;
  white_registration_id: string;
  black_registration_id: string | null;
  result: GameResult;
}

interface MembershipAppRow {
  id: string;
  full_name: string;
  identifier: string;
  email: string;
  department: string;
  level: string;
  status: string;
}

interface GeneralAppRow {
  id: string;
  type: string;
  organisation: string;
  contact_name: string;
  email: string;
  payload: { details?: string };
}

interface ContactMsgRow {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

interface StudySummaryRow {
  week_number: number;
  learners_count: number;
  solid_count: number;
}

interface AdminProfileRow {
  id: string;
  display_name: string;
  email?: string;
  role?: string;
}

type AdminTab = 'overview' | 'members' | 'applications' | 'swiss' | 'passport' | 'content';

export const AdminPage: React.FC = () => {
  const { t, pick } = useI18n();
  const { user } = useAuth();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [tournamentPlayers, setTournamentPlayers] = useState<TournamentPlayerRow[]>([]);
  const [rounds, setRounds] = useState<RoundRow[]>([]);
  const [games, setGames] = useState<GameRow[]>([]);
  const [membershipApps, setMembershipApps] = useState<MembershipAppRow[]>([]);
  const [applications, setApplications] = useState<GeneralAppRow[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMsgRow[]>([]);
  const [studySummary, setStudySummary] = useState<StudySummaryRow[]>([]);

  // Passport & Dynamic Content states
  const [profiles, setProfiles] = useState<AdminProfileRow[]>([]);
  const [xpTransactions, setXpTransactions] = useState<XpTransactionRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [xpRewards, setXpRewards] = useState<XpRewardsConfig>(DEFAULT_XP_REWARDS);
  const [events, setEvents] = useState<ClubEventItem[]>([]);
  const [clubs, setClubs] = useState<LeagueClubRow[]>([]);

  // Forms & UI filters
  const [memberSearch, setMemberSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newId, setNewId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newPaid, setNewPaid] = useState(true);
  const [mondayWeek, setMondayWeek] = useState(1);
  const [swissCategory, setSwissCategory] = useState<'open' | 'women'>('open');
  const [busy, setBusy] = useState(false);

  // Attendance form state
  const [attUserId, setAttUserId] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attType, setAttType] = useState<'monday_training' | 'thursday_play' | 'event_helper' | 'special'>('monday_training');
  const [attNotes, setAttNotes] = useState('');

  // Direct XP Award form state
  const [xpUserId, setXpUserId] = useState('');
  const [xpActivityType, setXpActivityType] = useState<PassportActivityType>('tournament_participation');
  const [xpSourceKey, setXpSourceKey] = useState('');
  const [xpDeltaCustom, setXpDeltaCustom] = useState(15);
  const [xpDescription, setXpDescription] = useState('');

  // Event upsert form state
  const [evTitleEn, setEvTitleEn] = useState('');
  const [evTitleFr, setEvTitleFr] = useState('');
  const [evDateIso, setEvDateIso] = useState('2026-12-10T14:00:00+01:00');
  const [evLocation, setEvLocation] = useState('FST Béni Mellal');
  const [evSummary, setEvSummary] = useState('');

  // League inline points draft
  const [clubDrafts, setClubDrafts] = useState<Record<string, { points: number; editionsPlayed: number }>>({});

  const isAuthorized = Boolean(user && (user.role === 'board' || user.role === 'admin'));

  const loadData = useCallback(async () => {
    if (!user || !isAuthorized) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin', {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      if (!res.ok) {
        setError('Unable to load admin workspace.');
        return;
      }
      const data = await res.json();
      setMembers(data.members ?? []);
      setTournaments(data.tournaments ?? []);
      setRegistrations(data.registrations ?? []);
      setTournamentPlayers(data.tournamentPlayers ?? []);
      setRounds(data.rounds ?? []);
      setGames(data.games ?? []);
      setMembershipApps(data.membershipApplications ?? []);
      setApplications(data.applications ?? []);
      setContactMessages(data.contactMessages ?? []);
      setStudySummary(data.studySummary ?? []);

      const loadedProfiles: AdminProfileRow[] = data.profiles ?? [];
      setProfiles(loadedProfiles);
      if (loadedProfiles.length > 0) {
        setAttUserId((prev) => prev || loadedProfiles[0].id);
        setXpUserId((prev) => prev || loadedProfiles[0].id);
      }

      setXpTransactions(data.xpTransactions ?? []);
      setAttendanceRecords(data.attendanceRecords ?? []);
      if (data.settings?.xpRewards) {
        setXpRewards({ ...DEFAULT_XP_REWARDS, ...data.settings.xpRewards });
      }
      if (typeof data.settings?.mondayAssignmentWeek === 'number') {
        setMondayWeek(data.settings.mondayAssignmentWeek);
      }

      setEvents(data.events ?? []);
      const loadedClubs: LeagueClubRow[] = (data.clubs ?? []).map(
        (c: Record<string, unknown>) => ({
          id: String(c.id),
          clubName: String(c.clubName ?? c.club_name ?? ''),
          university: String(c.university ?? ''),
          city: String(c.city ?? ''),
          points: Number(c.points ?? 0),
          editionsPlayed: Number(c.editionsPlayed ?? c.editions_played ?? 0),
        })
      );
      setClubs(loadedClubs);
      const nextDrafts: Record<string, { points: number; editionsPlayed: number }> = {};
      for (const c of loadedClubs) {
        nextDrafts[c.id] = { points: c.points, editionsPlayed: c.editionsPlayed };
      }
      setClubDrafts(nextDrafts);
    } catch {
      setError('Network error loading admin data.');
    } finally {
      setLoading(false);
    }
  }, [user, isAuthorized]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const postAction = async (payload: Record<string, unknown>, successLabel?: string) => {
    if (!user) return;
    setBusy(true);
    setError('');
    setActionMsg('');
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Action could not be completed.');
        return;
      }
      if (successLabel) setActionMsg(successLabel);
      await loadData();
    } finally {
      setBusy(false);
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const startIdx = lines[0]?.toLowerCase().includes('full_name') ? 1 : 0;
    for (let i = startIdx; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (!cols[0]) continue;
      await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify({
          action: 'add_member',
          fullName: cols[0],
          identifier: cols[1] || '',
          email: cols[2] || '',
          department: cols[4] || '',
          feesPaid: (cols[5] || '').toLowerCase() === 'true',
        }),
      });
    }
    await loadData();
    e.target.value = '';
  };

  const exportCsv = (filename: string, rows: string[][]) => {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeTournament = tournaments[0];
  const regMap = useMemo(() => new Map(registrations.map((r) => [r.id, r])), [registrations]);
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p.display_name])), [profiles]);

  const categoryRounds = useMemo(
    () =>
      rounds
        .filter((r) => (!activeTournament || r.tournament_id === activeTournament.id) && r.category === swissCategory)
        .sort((a, b) => a.round_number - b.round_number),
    [rounds, activeTournament, swissCategory]
  );

  const swissStandings = useMemo(() => {
    const confirmed = registrations.filter(
      (r) => (!activeTournament || r.tournament_id === activeTournament.id) && r.status === 'confirmed'
    );
    const players: SwissPlayer[] = confirmed.map((r, idx) => ({
      id: r.id,
      name: r.full_name,
      category: r.category,
      seedOrder: idx + 1,
    }));
    const roundNumMap = new Map(categoryRounds.map((r) => [r.id, r.round_number]));
    const history: SwissGameRecord[] = games
      .filter((g) => roundNumMap.has(g.round_id))
      .map((g) => ({
        roundNumber: roundNumMap.get(g.round_id)!,
        board: g.board,
        whiteId: g.white_registration_id,
        blackId: g.black_registration_id,
        result: g.result,
      }));
    return computeStandings(players, history, swissCategory);
  }, [registrations, activeTournament, categoryRounds, games, swissCategory]);

  if (!isAuthorized) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <Lock className="w-10 h-10 text-[var(--accent-gold)] mx-auto" />
        <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">{t.admin.restrictedTitle}</h1>
        <p className="text-sm text-[var(--text-secondary)]">{t.admin.restrictedBody}</p>
        <Link
          to="/account"
          className="inline-flex px-5 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-semibold"
        >
          {t.nav.account} →
        </Link>
      </div>
    );
  }

  const filteredMembers = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.identifier.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const pendingMembershipApps = membershipApps.filter((a) => a.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2.5">
          <Shield className="w-6 h-6 text-[var(--accent-gold)]" />
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">{t.admin.title}</h1>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--border-strong)] text-xs font-semibold whitespace-nowrap"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border-hairline)] pb-3 no-print">
        {(
          [
            { id: 'overview', label: 'Overview & Analytics' },
            { id: 'members', label: `Members (${members.length})` },
            { id: 'applications', label: `Applications (${pendingMembershipApps.length})` },
            { id: 'swiss', label: 'Tournament & Swiss' },
            { id: 'passport', label: 'Passport & Attendance' },
            { id: 'content', label: 'Events & League' },
          ] as { id: AdminTab; label: string }[]
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              setError('');
              setActionMsg('');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 ${
              tab === item.id
                ? 'bg-[var(--chess-charcoal)] text-[#EEEED2] dark:bg-[var(--accent-primary)] dark:text-white'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-hairline)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-[var(--danger)]">
          {error}
        </p>
      )}
      {actionMsg && (
        <p role="status" className="text-sm font-medium text-[var(--accent-primary)]">
          {actionMsg}
        </p>
      )}

      {/* Tab 1: Overview & Analytics */}
      {tab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5">
              <div className="text-2xl font-bold font-mono-tabular text-[var(--accent-primary)]">{members.length}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Active Members</div>
            </div>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5">
              <div className="text-2xl font-bold font-mono-tabular text-[var(--accent-gold)]">
                {pendingMembershipApps.length}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Pending Membership Apps</div>
            </div>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5">
              <div className="text-2xl font-bold font-mono-tabular text-[var(--text-primary)]">
                {registrations.filter((r) => r.status === 'confirmed').length} / {activeTournament?.capacity ?? 20}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Confirmed Tournament Boards</div>
            </div>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-5">
              <div className="text-2xl font-bold font-mono-tabular text-[var(--text-primary)]">
                {xpTransactions.filter((x) => x.status === 'verified').length}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Verified Passport Awards</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
              <h2 className="font-display text-xl font-bold">Monday Training Assignment</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Highlights the active week inside the Academy for all Monday students.
              </p>
              <div className="flex items-center gap-3">
                <select
                  value={mondayWeek}
                  onChange={(e) => setMondayWeek(Number(e.target.value))}
                  className="px-3.5 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
                    <option key={w} value={w}>
                      Week {w}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => postAction({ action: 'update_assignment', weekNumber: mondayWeek }, 'Monday week updated.')}
                  className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold"
                >
                  {t.common.save}
                </button>
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
              <h2 className="font-display text-xl font-bold">Study Cohort Analytics</h2>
              <div className="space-y-2.5">
                {studySummary.map((row) => (
                  <div key={row.week_number} className="space-y-1 text-xs">
                    <div className="flex justify-between font-mono-tabular">
                      <span>Week {row.week_number}</span>
                      <span>
                        {row.solid_count} solid / {row.learners_count} learners
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent-primary)]"
                        style={{
                          width: `${row.learners_count ? Math.round((row.solid_count / row.learners_count) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Latest Contact Messages */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
            <h2 className="font-display text-xl font-bold">Recent Contact Messages</h2>
            {contactMessages.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">No messages yet.</p>
            ) : (
              <div className="space-y-3">
                {contactMessages.map((msg) => (
                  <div key={msg.id} className="p-4 rounded-lg bg-[var(--bg-subtle)] text-xs space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span>
                        {msg.full_name} ({msg.email}) — {msg.subject}
                      </span>
                      <span className="font-mono-tabular text-[var(--text-muted)]">
                        {msg.created_at.slice(0, 10)}
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)]">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Members */}
      {tab === 'members' && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[var(--accent-primary)]" />
              Add Member / Import CSV
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <input
                type="text"
                placeholder="Full name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-xs"
              />
              <input
                type="text"
                placeholder="Student ID"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-xs"
              />
              <input
                type="email"
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-xs"
              />
              <input
                type="text"
                placeholder="Department"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-xs"
              />
              <button
                type="button"
                disabled={busy || !newName.trim()}
                onClick={async () => {
                  await postAction(
                    {
                      action: 'add_member',
                      fullName: newName,
                      identifier: newId,
                      email: newEmail,
                      department: newDept,
                      feesPaid: newPaid,
                    },
                    'Member added.'
                  );
                  setNewName('');
                  setNewId('');
                  setNewEmail('');
                  setNewDept('');
                }}
                className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold disabled:opacity-50"
              >
                Add Member
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-hairline)]">
              <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <input type="checkbox" checked={newPaid} onChange={(e) => setNewPaid(e.target.checked)} />
                Fees paid for 2026/27
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    postAction(
                      { action: 'provision_member_accounts' },
                      'Accounts provisioned & linked for active students with email (ready for Google sign-in).'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--chess-charcoal)] text-[#EEEED2] dark:bg-[var(--accent-gold)] dark:text-[#1B1A17] text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Pre-Create Student Accounts
                </button>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-xs font-semibold cursor-pointer hover:bg-[var(--bg-subtle)]">
                  <Upload className="w-3.5 h-3.5" />
                  Import CSV
                  <input type="file" accept=".csv" onChange={handleCsvImport} className="sr-only" />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    exportCsv('chess-house-members.csv', [
                      ['full_name', 'identifier', 'email', 'department', 'fees_paid'],
                      ...members.map((m) => [m.full_name, m.identifier, m.email, m.department, String(m.fees_paid)]),
                    ])
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-xs font-semibold hover:bg-[var(--bg-subtle)]"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
            <input
              type="search"
              placeholder="Search members by name or ID..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full max-w-sm px-3.5 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] text-sm"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-strong)] text-xs uppercase text-[var(--text-muted)]">
                    <th className="py-2 px-3 text-start">Name</th>
                    <th className="py-2 px-3 text-start">ID</th>
                    <th className="py-2 px-3 text-start">Dept</th>
                    <th className="py-2 px-3 text-end">Fees Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="border-b border-[var(--border-hairline)]">
                      <td className="py-2.5 px-3 font-medium">{m.full_name}</td>
                      <td className="py-2.5 px-3 font-mono-tabular">{m.identifier}</td>
                      <td className="py-2.5 px-3 text-[var(--text-secondary)]">{m.department}</td>
                      <td className="py-2.5 px-3 text-end">
                        <button
                          type="button"
                          onClick={() => postAction({ action: 'toggle_fee', memberId: m.id })}
                          className={`px-2.5 py-1 rounded text-xs font-semibold ${
                            m.fees_paid
                              ? 'bg-[var(--accent-primary)] text-white'
                              : 'bg-[var(--bg-subtle)] text-[var(--danger)] border border-[var(--danger)]'
                          }`}
                        >
                          {m.fees_paid ? 'Paid' : 'Unpaid'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Applications */}
      {tab === 'applications' && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
            <h2 className="font-display text-xl font-bold">Membership Applications</h2>
            {membershipApps.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">No applications submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {membershipApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl bg-[var(--bg-subtle)] flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm"
                  >
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">
                        {app.full_name}{' '}
                        <span className="font-mono-tabular text-[var(--text-muted)]">({app.identifier})</span>
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {app.email} · {app.department} · {app.level} · Status: <strong>{app.status}</strong>
                      </div>
                    </div>
                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => postAction({ action: 'approve_membership', applicationId: app.id }, 'Approved.')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => postAction({ action: 'reject_membership', applicationId: app.id }, 'Rejected.')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--danger)] text-[var(--danger)] text-xs font-semibold"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
            <h2 className="font-display text-xl font-bold">Partner & Inter-University Enquiries</h2>
            {applications.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">No partner or league enquiries yet.</p>
            ) : (
              <div className="space-y-3">
                {applications.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl bg-[var(--bg-subtle)] text-xs space-y-1">
                    <div className="font-bold">
                      [{a.type}] {a.organisation} — {a.contact_name} ({a.email})
                    </div>
                    <p className="text-[var(--text-secondary)]">{a.payload?.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Tournament Registrations & 9-Round Swiss Runner */}
      {tab === 'swiss' && (
        <div className="space-y-8">
          {activeTournament && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 flex flex-wrap items-center justify-between gap-4 no-print">
              <div>
                <h2 className="font-display text-xl font-bold">{pick(activeTournament.name)}</h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Registration status: <strong>{activeTournament.is_open ? 'OPEN' : 'CLOSED'}</strong>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => postAction({ action: 'toggle_tournament_open', tournamentId: activeTournament.id })}
                  className="px-3.5 py-2 rounded-lg border border-[var(--border-strong)] text-xs font-semibold"
                >
                  {activeTournament.is_open ? 'Close Registration' : 'Reopen Registration'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    exportCsv('tournament-registrations.csv', [
                      ['full_name', 'identifier', 'category', 'status'],
                      ...registrations.map((r) => [r.full_name, r.identifier, r.category, r.status]),
                    ])
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--border-strong)] text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Confirmed CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--chess-charcoal)] text-[#EEEED2] text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Sheet
                </button>
              </div>
            </div>
          )}

          {/* Swiss Pairing Runner */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="flex border border-[var(--border-hairline)] rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSwissCategory('open')}
                  className={`px-3 py-1.5 text-xs font-semibold ${
                    swissCategory === 'open' ? 'bg-[var(--chess-charcoal)] text-[#EEEED2]' : ''
                  }`}
                >
                  {t.common.categoryOpen}
                </button>
                <button
                  type="button"
                  onClick={() => setSwissCategory('women')}
                  className={`px-3 py-1.5 text-xs font-semibold ${
                    swissCategory === 'women' ? 'bg-[var(--chess-charcoal)] text-[#EEEED2]' : ''
                  }`}
                >
                  {t.common.categoryWomen}
                </button>
              </div>

              <button
                type="button"
                disabled={busy || !activeTournament || categoryRounds.length >= 9}
                onClick={() =>
                  activeTournament &&
                  postAction({
                    action: 'generate_round',
                    tournamentId: activeTournament.id,
                    category: swissCategory,
                  })
                }
                className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold disabled:opacity-50"
              >
                Generate Round {categoryRounds.length + 1} / 9
              </button>
            </div>

            {categoryRounds.map((rd) => {
              const roundGames = games.filter((g) => g.round_id === rd.id).sort((a, b) => a.board - b.board);
              return (
                <div key={rd.id} className="space-y-2 border-t border-[var(--border-hairline)] pt-4">
                  <h3 className="font-display text-lg font-bold">
                    Round {rd.round_number} ({rd.category.toUpperCase()})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border-strong)] text-xs uppercase text-[var(--text-muted)]">
                          <th className="py-2 px-3 text-start">Board</th>
                          <th className="py-2 px-3 text-start">White</th>
                          <th className="py-2 px-3 text-start">Black</th>
                          <th className="py-2 px-3 text-end">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roundGames.map((g) => (
                          <tr key={g.id} className="border-b border-[var(--border-hairline)]">
                            <td className="py-2 px-3 font-mono-tabular">{g.board}</td>
                            <td className="py-2 px-3 font-medium">
                              {regMap.get(g.white_registration_id)?.full_name ?? 'Player'}
                            </td>
                            <td className="py-2 px-3 font-medium">
                              {g.black_registration_id ? regMap.get(g.black_registration_id)?.full_name ?? 'Player' : 'BYE'}
                            </td>
                            <td className="py-2 px-3 text-end">
                              <select
                                value={g.result}
                                onChange={(e) =>
                                  postAction({ action: 'set_game_result', gameId: g.id, result: e.target.value })
                                }
                                className="px-2 py-1 rounded border border-[var(--border-strong)] bg-[var(--bg-page)] text-xs font-mono-tabular"
                              >
                                <option value="pending">pending</option>
                                <option value="1-0">1-0</option>
                                <option value="1/2-1/2">1/2-1/2</option>
                                <option value="0-1">0-1</option>
                                <option value="bye">bye</option>
                                <option value="forfeit-white">forfeit-white</option>
                                <option value="forfeit-black">forfeit-black</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* Current Standings Preview */}
            {swissStandings.length > 0 && (
              <div className="pt-4 border-t border-[var(--border-hairline)] space-y-2">
                <h3 className="font-display text-lg font-bold">Standings ({swissCategory.toUpperCase()})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-strong)] text-xs uppercase text-[var(--text-muted)]">
                        <th className="py-2 px-3 text-start">#</th>
                        <th className="py-2 px-3 text-start">Player</th>
                        <th className="py-2 px-3 text-end font-mono-tabular">Pts</th>
                        <th className="py-2 px-3 text-end font-mono-tabular">BH</th>
                        <th className="py-2 px-3 text-end font-mono-tabular">SB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {swissStandings.map((s) => (
                        <tr key={s.playerId} className="border-b border-[var(--border-hairline)]">
                          <td className="py-2 px-3 font-mono-tabular">{s.rank}</td>
                          <td className="py-2 px-3 font-medium">{s.name}</td>
                          <td className="py-2 px-3 text-end font-mono-tabular font-bold">{s.points}</td>
                          <td className="py-2 px-3 text-end font-mono-tabular">{s.buchholz}</td>
                          <td className="py-2 px-3 text-end font-mono-tabular">{s.sonnebornBerger}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Dedicated Tournament Players Table (tournament_players) */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4 no-print">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold">
                  Tournament Players ({tournamentPlayers.length})
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Verified FST &amp; paid players stored in the dedicated <code>tournament_players</code> table.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  exportCsv('tournament-players.csv', [
                    ['full_name', 'email', 'phone', 'identifier', 'faculty', 'category', 'chess_elo', 'created_at'],
                    ...tournamentPlayers.map((tp) => [
                      tp.full_name,
                      tp.email,
                      tp.phone,
                      tp.identifier,
                      tp.faculty,
                      tp.category,
                      tp.chess_elo !== null ? String(tp.chess_elo) : '',
                      tp.created_at,
                    ]),
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--border-strong)] text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Export Players CSV
              </button>
            </div>
            {tournamentPlayers.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">No verified players recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-strong)] text-xs uppercase text-[var(--text-muted)]">
                      <th className="py-2 px-3 text-start">Player</th>
                      <th className="py-2 px-3 text-start">Faculty</th>
                      <th className="py-2 px-3 text-start">Contact</th>
                      <th className="py-2 px-3 text-start">Category</th>
                      <th className="py-2 px-3 text-end font-mono-tabular">Elo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournamentPlayers.map((tp) => (
                      <tr key={tp.id} className="border-b border-[var(--border-hairline)]">
                        <td className="py-2 px-3">
                          <div className="font-semibold text-[var(--text-primary)]">{tp.full_name}</div>
                          {tp.identifier && (
                            <div className="text-[11px] font-mono-tabular text-[var(--text-muted)]">{tp.identifier}</div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-[var(--text-secondary)]">{tp.faculty || '—'}</td>
                        <td className="py-2 px-3 text-[var(--text-secondary)]">
                          <div>{tp.email || '—'}</div>
                          {tp.phone && <div className="text-[11px] font-mono-tabular">{tp.phone}</div>}
                        </td>
                        <td className="py-2 px-3 uppercase font-mono-tabular">{tp.category}</td>
                        <td className="py-2 px-3 text-end font-mono-tabular">{tp.chess_elo ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending & Unpaid Tournament Registrations Promotion */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4 no-print">
            <h3 className="font-display text-xl font-bold">Registrations Queue ({registrations.length})</h3>
            <div className="space-y-2.5">
              {registrations.map((reg) => (
                <div
                  key={reg.id}
                  className="p-3.5 rounded-lg bg-[var(--bg-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div>
                    <span className="font-bold">{reg.full_name}</span>{' '}
                    <span className="font-mono-tabular text-[var(--text-muted)]">
                      ({reg.category} · {reg.status})
                    </span>
                  </div>
                  {reg.status !== 'confirmed' && (
                    <button
                      type="button"
                      onClick={() => postAction({ action: 'promote_registration', registrationId: reg.id })}
                      className="px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold"
                    >
                      Promote to Confirmed
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Chess House Passport, Attendance & XP Config */}
      {tab === 'passport' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Record Verified Attendance */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Award className="w-5 h-5 text-[var(--accent-gold)]" />
                Log Verified Attendance
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Logs session attendance and awards verified House XP automatically once per session date and type.
              </p>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium mb-1">Member Account</label>
                  <select
                    value={attUserId}
                    onChange={(e) => setAttUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)]"
                  >
                    {profiles.length === 0 && <option value="">No user accounts yet</option>}
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name} {p.email ? `(${p.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium mb-1">Session Date</label>
                    <input
                      type="date"
                      value={attDate}
                      onChange={(e) => setAttDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Session Type</label>
                    <select
                      value={attType}
                      onChange={(e) =>
                        setAttType(
                          e.target.value as 'monday_training' | 'thursday_play' | 'event_helper' | 'special'
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)]"
                    >
                      <option value="monday_training">Monday Training (+{xpRewards.session} XP)</option>
                      <option value="thursday_play">Thursday Open Play (+{xpRewards.session} XP)</option>
                      <option value="event_helper">Event Organizer / Helper (+{xpRewards.organize_event} XP)</option>
                      <option value="special">Special Workshop (+{xpRewards.session} XP)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-1">Session Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Week 2 Rook Endgames"
                    value={attNotes}
                    onChange={(e) => setAttNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)]"
                  />
                </div>
                <button
                  type="button"
                  disabled={busy || !attUserId}
                  onClick={async () => {
                    await postAction(
                      {
                        action: 'record_attendance',
                        userId: attUserId,
                        sessionDate: attDate,
                        sessionType: attType,
                        notes: attNotes,
                      },
                      'Attendance verified and House XP awarded.'
                    );
                    setAttNotes('');
                  }}
                  className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-semibold disabled:opacity-50"
                >
                  Log Verified Attendance
                </button>
              </div>
            </div>

            {/* Direct Verified Award */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
              <h2 className="font-display text-xl font-bold">Issue Tournament / Contribution XP</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Award verified XP for tournament participation, wins, or corrections with unique source keys.
              </p>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium mb-1">Member Account</label>
                  <select
                    value={xpUserId}
                    onChange={(e) => setXpUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)]"
                  >
                    {profiles.length === 0 && <option value="">No user accounts yet</option>}
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name} {p.email ? `(${p.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium mb-1">Activity Type</label>
                    <select
                      value={xpActivityType}
                      onChange={(e) => setXpActivityType(e.target.value as PassportActivityType)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)]"
                    >
                      <option value="tournament_participation">Tournament Play (+{xpRewards.tournament} XP)</option>
                      <option value="tournament_win">Tournament Win (+{xpRewards.tournament_win} XP)</option>
                      <option value="event_organization">Organize Event (+{xpRewards.organize_event} XP)</option>
                      <option value="training_session">Training Session (+{xpRewards.session} XP)</option>
                      <option value="admin_adjustment">Custom Adjustment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Source Key (Anti-duplicate)</label>
                    <input
                      type="text"
                      placeholder="e.g. tournament:nov-2026"
                      value={xpSourceKey}
                      onChange={(e) => setXpSourceKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] font-mono-tabular"
                    />
                  </div>
                </div>
                {xpActivityType === 'admin_adjustment' && (
                  <div>
                    <label className="block font-medium mb-1">Custom XP Delta</label>
                    <input
                      type="number"
                      min={0}
                      max={500}
                      value={xpDeltaCustom}
                      onChange={(e) => setXpDeltaCustom(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] font-mono-tabular"
                    />
                  </div>
                )}
                <div>
                  <label className="block font-medium mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Internal Rapid November 2026"
                    value={xpDescription}
                    onChange={(e) => setXpDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)]"
                  />
                </div>
                <button
                  type="button"
                  disabled={busy || !xpUserId}
                  onClick={async () => {
                    await postAction(
                      {
                        action: 'award_xp',
                        userId: xpUserId,
                        activityType: xpActivityType,
                        sourceKey: xpSourceKey.trim() || `${xpActivityType}:${Date.now()}`,
                        xpDelta: xpDeltaCustom,
                        description: xpDescription.trim() || 'Verified club activity',
                      },
                      'Verified XP transaction recorded.'
                    );
                    setXpSourceKey('');
                    setXpDescription('');
                  }}
                  className="px-4 py-2 rounded-lg bg-[var(--chess-charcoal)] text-[#EEEED2] dark:bg-[var(--accent-gold)] dark:text-[#1B1A17] font-semibold disabled:opacity-50"
                >
                  Issue Verified XP
                </button>
              </div>
            </div>
          </div>

          {/* Configurable XP Rewards Schedule */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold">Configurable Passport XP Schedule</h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Adjust House XP values per verified activity (strictly separate from chess rating).
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => postAction({ action: 'update_xp_config', ...xpRewards }, 'XP reward schedule updated.')}
                className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold"
              >
                {t.common.save}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              {(
                [
                  { key: 'session', label: 'Training Session' },
                  { key: 'puzzles_5', label: '5 Puzzles Solved' },
                  { key: 'tournament', label: 'Tournament Play' },
                  { key: 'organize_event', label: 'Organize Event' },
                  { key: 'academy_week', label: 'Academy Week' },
                  { key: 'tournament_win', label: 'Tournament Win' },
                ] as { key: keyof XpRewardsConfig; label: string }[]
              ).map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <label className="block text-[var(--text-secondary)]">{label}</label>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={xpRewards[key]}
                    onChange={(e) => setXpRewards((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] font-mono-tabular font-bold"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Auditable XP Ledger & Recent Attendance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
              <h2 className="font-display text-xl font-bold">XP Transactions Ledger ({xpTransactions.length})</h2>
              {xpTransactions.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No XP transactions recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-strong)] text-[var(--text-muted)] uppercase">
                        <th className="py-2 px-2 text-start">Member</th>
                        <th className="py-2 px-2 text-start">Description</th>
                        <th className="py-2 px-2 text-end font-mono-tabular">XP</th>
                        <th className="py-2 px-2 text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {xpTransactions.slice(0, 25).map((tx) => (
                        <tr key={tx.id} className="border-b border-[var(--border-hairline)]">
                          <td className="py-2 px-2 font-medium">{profileMap.get(tx.userId) ?? tx.userId}</td>
                          <td className="py-2 px-2 text-[var(--text-secondary)]">
                            <div>{tx.description}</div>
                            <div className="font-mono-tabular text-[11px] text-[var(--text-muted)]">{tx.sourceKey}</div>
                          </td>
                          <td
                            className={`py-2 px-2 text-end font-mono-tabular font-bold ${
                              tx.status === 'revoked' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--accent-primary)]'
                            }`}
                          >
                            +{tx.xpDelta}
                          </td>
                          <td className="py-2 px-2 text-end">
                            {tx.status === 'verified' ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => postAction({ action: 'revoke_xp', transactionId: tx.id }, 'XP revoked.')}
                                className="px-2 py-1 rounded border border-[var(--danger)] text-[var(--danger)] text-[11px] font-semibold"
                              >
                                Revoke
                              </button>
                            ) : (
                              <span className="text-[11px] text-[var(--text-muted)]">Revoked</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
              <h2 className="font-display text-xl font-bold">Recent Attendance ({attendanceRecords.length})</h2>
              {attendanceRecords.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No attendance records logged yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-strong)] text-[var(--text-muted)] uppercase">
                        <th className="py-2 px-2 text-start">Date</th>
                        <th className="py-2 px-2 text-start">Member</th>
                        <th className="py-2 px-2 text-start">Session</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.slice(0, 25).map((a) => (
                        <tr key={a.id} className="border-b border-[var(--border-hairline)]">
                          <td className="py-2 px-2 font-mono-tabular">{a.sessionDate}</td>
                          <td className="py-2 px-2 font-medium">{profileMap.get(a.userId) ?? a.userId}</td>
                          <td className="py-2 px-2 text-[var(--text-secondary)]">
                            {a.sessionType.replace(/_/g, ' ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Dynamic Events & Inter-University League Standings */}
      {tab === 'content' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-[var(--accent-primary)]" />
                Publish Club Event ({events.length})
              </h2>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium mb-1">Title (English) *</label>
                  <input
                    type="text"
                    value={evTitleEn}
                    onChange={(e) => setEvTitleEn(e.target.value)}
                    placeholder="e.g. Simultaneous Exhibition with Guest Master"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)]"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Title (French)</label>
                  <input
                    type="text"
                    value={evTitleFr}
                    onChange={(e) => setEvTitleFr(e.target.value)}
                    placeholder="e.g. Simultanée avec Maître invité"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium mb-1">Date / Time ISO</label>
                    <input
                      type="text"
                      value={evDateIso}
                      onChange={(e) => setEvDateIso(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)] font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Location</label>
                    <input
                      type="text"
                      value={evLocation}
                      onChange={(e) => setEvLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-1">Summary</label>
                  <textarea
                    rows={3}
                    value={evSummary}
                    onChange={(e) => setEvSummary(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-page)]"
                  />
                </div>
                <button
                  type="button"
                  disabled={busy || !evTitleEn.trim()}
                  onClick={async () => {
                    await postAction(
                      {
                        action: 'upsert_event',
                        titleEn: evTitleEn,
                        titleFr: evTitleFr || evTitleEn,
                        dateIso: evDateIso,
                        location: evLocation,
                        summary: evSummary,
                      },
                      'Event published to homepage feed and /events.'
                    );
                    setEvTitleEn('');
                    setEvTitleFr('');
                    setEvSummary('');
                  }}
                  className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white font-semibold disabled:opacity-50"
                >
                  Publish Event
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-xl p-6 space-y-4">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[var(--accent-gold)]" />
                Inter-University League Table
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Updates live league standings displayed on `/league`.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-strong)] text-[var(--text-muted)] uppercase">
                      <th className="py-2 px-2 text-start">Club</th>
                      <th className="py-2 px-2 text-end">Editions</th>
                      <th className="py-2 px-2 text-end">Points</th>
                      <th className="py-2 px-2 text-end">Save</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubs.map((c) => {
                      const draft = clubDrafts[c.id] ?? { points: c.points, editionsPlayed: c.editionsPlayed };
                      return (
                        <tr key={c.id} className="border-b border-[var(--border-hairline)]">
                          <td className="py-2 px-2">
                            <div className="font-semibold text-[var(--text-primary)]">{c.clubName}</div>
                            <div className="text-[11px] text-[var(--text-muted)]">{c.university}</div>
                          </td>
                          <td className="py-2 px-2 text-end">
                            <input
                              type="number"
                              min={0}
                              value={draft.editionsPlayed}
                              onChange={(e) =>
                                setClubDrafts((prev) => ({
                                  ...prev,
                                  [c.id]: { ...draft, editionsPlayed: Number(e.target.value) || 0 },
                                }))
                              }
                              className="w-16 px-2 py-1 rounded border border-[var(--border-strong)] bg-[var(--bg-page)] text-end font-mono-tabular"
                            />
                          </td>
                          <td className="py-2 px-2 text-end">
                            <input
                              type="number"
                              min={0}
                              value={draft.points}
                              onChange={(e) =>
                                setClubDrafts((prev) => ({
                                  ...prev,
                                  [c.id]: { ...draft, points: Number(e.target.value) || 0 },
                                }))
                              }
                              className="w-20 px-2 py-1 rounded border border-[var(--border-strong)] bg-[var(--bg-page)] text-end font-mono-tabular"
                            />
                          </td>
                          <td className="py-2 px-2 text-end">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                postAction(
                                  {
                                    action: 'update_club_points',
                                    clubId: c.id,
                                    points: draft.points,
                                    editionsPlayed: draft.editionsPlayed,
                                  },
                                  `Updated ${c.clubName}.`
                                )
                              }
                              className="px-2.5 py-1 rounded bg-[var(--accent-primary)] text-white font-semibold"
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
