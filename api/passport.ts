import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, verifyBearerUser } from './_lib/supabaseAdmin';
import {
  ensureLocalProfile,
  localAwardXpIdempotent,
  localStore,
} from './_lib/localStore';
import { cleanString, safeJsonBody } from './_lib/validation';
import { normalizeName } from '../src/lib/normalize';
import {
  AttendanceRecord,
  computePassportLevel,
  DEFAULT_XP_REWARDS,
  evaluateMissions,
  evaluatePassportBadges,
  getDailyChallengePuzzle,
  getPeriodKeys,
  PassportMetrics,
  XpRewardsConfig,
  XpTransactionRecord,
} from '../src/lib/passport';

function parseXpRewards(val: unknown): XpRewardsConfig {
  if (!val || typeof val !== 'object') return { ...DEFAULT_XP_REWARDS };
  const obj = val as Record<string, unknown>;
  return {
    session: typeof obj.session === 'number' ? obj.session : DEFAULT_XP_REWARDS.session,
    puzzles_5: typeof obj.puzzles_5 === 'number' ? obj.puzzles_5 : DEFAULT_XP_REWARDS.puzzles_5,
    tournament: typeof obj.tournament === 'number' ? obj.tournament : DEFAULT_XP_REWARDS.tournament,
    organize_event: typeof obj.organize_event === 'number' ? obj.organize_event : DEFAULT_XP_REWARDS.organize_event,
    academy_week: typeof obj.academy_week === 'number' ? obj.academy_week : DEFAULT_XP_REWARDS.academy_week,
    tournament_win: typeof obj.tournament_win === 'number' ? obj.tournament_win : DEFAULT_XP_REWARDS.tournament_win,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyBearerUser(req.headers.authorization as string | undefined);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const admin = getSupabaseAdmin();
  const todayIso = new Date().toISOString().slice(0, 10);
  const periods = getPeriodKeys(new Date());

  try {
    // -------------------------------------------------------------------------
    // LOCAL PREVIEW MODE PARITY
    // -------------------------------------------------------------------------
    if (!admin) {
      const profile = ensureLocalProfile(user.id, user.email || '', user.email?.split('@')[0]);
      const rewards = localStore.settings.xpRewards;

      const buildLocalPayload = () => {
        const nameKey = normalizeName(profile.displayName);
        const matchedMember =
          localStore.members.find(
            (m) =>
              (user.email && m.email.toLowerCase() === user.email.toLowerCase()) ||
              (nameKey.length >= 3 && m.name_key === nameKey)
          ) ?? null;

        const membershipStatus = matchedMember
          ? matchedMember.fees_paid
            ? 'active_paid'
            : 'active_unpaid'
          : localStore.membershipApplications.some(
              (a) =>
                a.status === 'pending' &&
                ((user.email && a.email.toLowerCase() === user.email.toLowerCase()) || a.name_key === nameKey)
            )
          ? 'pending_application'
          : 'not_registered';

        const xpTransactions = localStore.xpTransactions
          .filter((x) => x.userId === user.id)
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

        const verifiedTx = xpTransactions.filter((x) => x.status === 'verified');
        const xpTotal = verifiedTx.reduce((sum, tx) => sum + tx.xpDelta, 0);
        const level = computePassportLevel(xpTotal);

        const attendanceRecords = localStore.attendanceRecords
          .filter((a) => a.userId === user.id)
          .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

        const registrations = localStore.registrations
          .filter(
            (r) =>
              (matchedMember && r.member_id === matchedMember.id) ||
              (nameKey.length >= 3 && r.name_key === nameKey) ||
              (user.email && r.contact.toLowerCase() === user.email.toLowerCase())
          )
          .map((r) => {
            const tourn = localStore.tournaments.find((t) => t.id === r.tournament_id);
            return {
              id: r.id,
              tournamentId: r.tournament_id,
              tournamentName: tourn?.name ?? { fr: 'Tournoi', en: 'Tournament', ar: 'بطولة' },
              eventDate: tourn?.event_date ?? '',
              category: r.category,
              status: r.status,
              createdAt: r.created_at,
            };
          });

        const regIds = new Set(registrations.map((r) => r.id));
        const regNameMap = new Map(localStore.registrations.map((r) => [r.id, r.full_name]));
        const matchHistory = localStore.games
          .filter((g) => regIds.has(g.white_registration_id) || (g.black_registration_id && regIds.has(g.black_registration_id)))
          .map((g) => {
            const isWhite = regIds.has(g.white_registration_id);
            const opponentName = isWhite
              ? g.black_registration_id
                ? regNameMap.get(g.black_registration_id) ?? 'Opponent'
                : 'BYE'
              : regNameMap.get(g.white_registration_id) ?? 'Opponent';
            const tourn = localStore.tournaments.find((t) => t.id === g.tournament_id);
            return {
              id: g.id,
              tournamentName: tourn?.name ?? { fr: 'Tournoi', en: 'Tournament', ar: 'بطولة' },
              roundNumber: g.round_number,
              board: g.board,
              color: isWhite ? 'white' : 'black',
              opponentName,
              result: g.result,
            };
          });

        const tournamentsParticipated =
          verifiedTx.filter((t) => t.activityType === 'tournament_participation').length +
          registrations.filter((r) => r.status === 'confirmed').length;
        const tournamentsWon = verifiedTx.filter((t) => t.activityType === 'tournament_win').length;
        const eventsHelped =
          attendanceRecords.filter((a) => a.sessionType === 'event_helper').length +
          verifiedTx.filter((t) => t.activityType === 'event_organization').length;

        const weeklyStart = periods.weekly;
        const weeklyTrainingDone = attendanceRecords.some((a) => {
          const pk = getPeriodKeys(new Date(a.sessionDate + 'T12:00:00Z')).weekly;
          return pk === weeklyStart;
        });

        const metrics: PassportMetrics = {
          attendanceCount: attendanceRecords.filter((a) => a.sessionType !== 'event_helper').length,
          puzzlesSolvedCount: profile.puzzlesSolvedCount,
          tournamentsParticipated,
          tournamentsWon,
          xpTotal,
          eventsHelped,
          academyWeeksSolid: profile.academyWeeksSolid.length,
          dailyPuzzlesCount: profile.dailyPuzzlesDate === todayIso ? profile.dailyPuzzlesCount : 0,
          weeklyTrainingDone,
          weeklyLessonDone: profile.lessonDoneDate === todayIso || profile.academyWeeksSolid.length > 0,
        };

        const storedBadges = localStore.badgesByUser.get(user.id) ?? {};
        const badges = evaluatePassportBadges(metrics, storedBadges);
        // Persist newly unlocked badges locally
        for (const b of badges) {
          if (b.unlocked && !storedBadges[b.key]) {
            storedBadges[b.key] = new Date().toISOString();
          }
        }
        localStore.badgesByUser.set(user.id, storedBadges);

        const claimedPairs = new Set(
          localStore.missionClaims.filter((c) => c.userId === user.id).map((c) => `${c.missionKey}:${c.periodKey}`)
        );
        const missions = evaluateMissions(metrics, claimedPairs, rewards);

        const notifications = localStore.notifications
          .filter((n) => n.userId === user.id)
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

        const certificates = [
          {
            key: 'endgames_track',
            title: { fr: 'Certificat Finales (Semaines 1–3)', en: 'Endgames Track (Weeks 1–3)', ar: 'شهادة النهايات (الأسابيع 1–3)' },
            eligible: [1, 2, 3].every((w) => profile.academyWeeksSolid.includes(w)),
          },
          {
            key: 'academy_graduate',
            title: { fr: 'Diplôme Académie Chess House (8 semaines)', en: 'Chess House Academy Graduate (8 Weeks)', ar: 'شهادة تخرج أكاديمية بيت الشطرنج' },
            eligible: profile.academyWeeksSolid.length >= 8,
          },
        ];

        const upcomingEvents = localStore.events
          .filter((ev) => !ev.isPast)
          .sort((a, b) => Date.parse(a.dateIso) - Date.parse(b.dateIso));

        return {
          profile: {
            displayName: profile.displayName,
            email: user.email || profile.email,
            role: user.role,
            phone: profile.phone || matchedMember?.phone || '',
            faculty: profile.faculty || matchedMember?.faculty || matchedMember?.department || '',
            chessElo: profile.chessElo ?? matchedMember?.chessElo ?? null,
            preferredPiece: profile.preferredPiece || matchedMember?.preferredPiece || 'p',
            language: profile.language,
            showOnLeaderboard: profile.showOnLeaderboard,
            bio: profile.bio,
            favoriteOpening: profile.favoriteOpening,
          },
          membership: {
            status: membershipStatus,
            department: matchedMember?.department ?? '',
            identifier: matchedMember?.identifier ?? '',
            season: matchedMember?.season ?? '2026/27',
            feesPaid: matchedMember?.fees_paid ?? false,
          },
          xpTotal,
          level,
          xpRewards: rewards,
          xpTransactions,
          badges,
          attendanceRecords,
          registrations,
          matchHistory,
          missions,
          notifications,
          certificates,
          upcomingEvents,
          studyStats: {
            rating: profile.rating,
            puzzlesSolvedCount: profile.puzzlesSolvedCount,
            academyWeeksSolid: profile.academyWeeksSolid,
          },
          isPreviewMode: true,
        };
      };

      if (req.method === 'GET') {
        return res.status(200).json(buildLocalPayload());
      }

      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const body = safeJsonBody(req.body);
      const action = cleanString(body.action, 60);

      if (action === 'update_profile') {
        const displayName = cleanString(body.displayName, 80);
        const language = body.language === 'en' || body.language === 'ar' ? body.language : 'fr';
        const bio = cleanString(body.bio, 240);
        const favoriteOpening = cleanString(body.favoriteOpening, 100);
        const phone = cleanString(body.phone, 40);
        const faculty = cleanString(body.faculty, 140);
        const rawElo =
          body.chessElo !== undefined && body.chessElo !== '' && body.chessElo !== null ? Number(body.chessElo) : NaN;
        const chessElo = Number.isFinite(rawElo) && rawElo >= 100 && rawElo <= 3200 ? Math.round(rawElo) : null;
        const rawPiece = cleanString(body.preferredPiece, 4).toLowerCase();
        if (displayName.length >= 2) profile.displayName = displayName;
        if (body.language !== undefined) profile.language = language;
        if (body.showOnLeaderboard !== undefined) profile.showOnLeaderboard = Boolean(body.showOnLeaderboard);
        if (body.bio !== undefined) profile.bio = bio;
        if (body.favoriteOpening !== undefined) profile.favoriteOpening = favoriteOpening;
        if (body.phone !== undefined) profile.phone = phone;
        if (body.faculty !== undefined) profile.faculty = faculty;
        if (body.chessElo !== undefined) profile.chessElo = chessElo;
        if (['p', 'n', 'b', 'r', 'q', 'k'].includes(rawPiece)) profile.preferredPiece = rawPiece;
        return res.status(200).json({ ok: true, passport: buildLocalPayload() });
      }

      if (action === 'solve_daily_challenge') {
        const moveSan = cleanString(body.moveSan, 20);
        const puzzle = getDailyChallengePuzzle(todayIso);
        if (moveSan !== puzzle.solutionSan[0]) {
          return res.status(400).json({ error: 'Incorrect tactical move' });
        }
        if (profile.dailyPuzzlesDate !== todayIso) {
          profile.dailyPuzzlesDate = todayIso;
          profile.dailyPuzzlesCount = 0;
        }
        const sourceKey = `daily_challenge:${todayIso}`;
        const existingTx = localStore.xpTransactions.find(
          (x) => x.userId === user.id && x.sourceKey === sourceKey && x.status === 'verified'
        );
        if (!existingTx) {
          profile.puzzlesSolvedCount += 1;
          profile.dailyPuzzlesCount += 1;
        }
        const award = localAwardXpIdempotent({
          userId: user.id,
          sourceKey,
          activityType: 'puzzles_batch',
          xpDelta: rewards.puzzles_5,
          description: `Daily Challenge solved (${todayIso}: ${puzzle.title.en})`,
        });
        return res.status(200).json({ ok: true, awarded: award.awarded, passport: buildLocalPayload() });
      }

      if (action === 'sync_study_activity') {
        const puzzlesCount = Math.max(0, Math.min(500, Number(body.puzzlesSolvedCount) || 0));
        const solidWeeks = Array.isArray(body.solidWeeks)
          ? body.solidWeeks.map(Number).filter((w) => w >= 1 && w <= 8)
          : [];
        const rating = Math.max(400, Math.min(2800, Number(body.rating) || profile.rating));
        const dailyPuzzlesToday = Math.max(0, Math.min(100, Number(body.dailyPuzzlesToday) || 0));
        const lessonDoneToday = Boolean(body.lessonDoneToday);

        profile.rating = rating;
        profile.puzzlesSolvedCount = Math.max(profile.puzzlesSolvedCount, puzzlesCount);
        profile.academyWeeksSolid = Array.from(new Set([...profile.academyWeeksSolid, ...solidWeeks]));
        if (dailyPuzzlesToday > 0) {
          profile.dailyPuzzlesDate = todayIso;
          profile.dailyPuzzlesCount = Math.max(profile.dailyPuzzlesCount, dailyPuzzlesToday);
        }
        if (lessonDoneToday) {
          profile.lessonDoneDate = todayIso;
        }

        // Award idempotent XP per completed Academy week (25 XP)
        for (const w of profile.academyWeeksSolid) {
          localAwardXpIdempotent({
            userId: user.id,
            sourceKey: `academy:week_${w}`,
            activityType: 'academy_week',
            xpDelta: rewards.academy_week,
            description: `Completed Academy Week ${w} (Solid+)`,
          });
        }

        // Award idempotent XP per 5-puzzle milestone batch (15 XP)
        const batches = Math.floor(profile.puzzlesSolvedCount / 5);
        for (let b = 1; b <= batches; b++) {
          localAwardXpIdempotent({
            userId: user.id,
            sourceKey: `puzzles:batch_${b}`,
            activityType: 'puzzles_batch',
            xpDelta: rewards.puzzles_5,
            description: `Solved ${b * 5} Academy tactical puzzles`,
          });
        }

        return res.status(200).json({ ok: true, passport: buildLocalPayload() });
      }

      if (action === 'claim_mission') {
        const missionKey = cleanString(body.missionKey, 80);
        const payload = buildLocalPayload();
        const mission = payload.missions.find((m) => m.key === missionKey);
        if (!mission) return res.status(404).json({ error: 'Mission not found' });
        if (mission.claimed) return res.status(409).json({ error: 'Mission already claimed' });
        if (!mission.canClaim) return res.status(400).json({ error: 'Mission criteria not yet met' });

        localStore.missionClaims.push({
          id: `mc-${Date.now()}`,
          userId: user.id,
          missionKey: mission.key,
          periodKey: mission.periodKey,
          xpAwarded: mission.xpReward,
          claimedAt: new Date().toISOString(),
        });
        localAwardXpIdempotent({
          userId: user.id,
          sourceKey: `mission:${mission.key}:${mission.periodKey}`,
          activityType: 'mission_bonus',
          xpDelta: mission.xpReward,
          description: `Mission completed: ${mission.title.en} (${mission.periodKey})`,
        });

        return res.status(200).json({ ok: true, passport: buildLocalPayload() });
      }

      if (action === 'mark_notifications_read') {
        for (const n of localStore.notifications) {
          if (n.userId === user.id) n.isRead = true;
        }
        return res.status(200).json({ ok: true, passport: buildLocalPayload() });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    // -------------------------------------------------------------------------
    // SUPABASE PRODUCTION MODE
    // -------------------------------------------------------------------------
    const fetchSupabasePassport = async () => {
      const [
        { data: profileRow },
        { data: xpRows },
        { data: attendanceRows },
        { data: badgeRows },
        { data: claimRows },
        { data: notifRows },
        { data: studyRows },
        { data: puzzleRows },
        { data: settingsRows },
        { data: upcomingEvRows },
      ] = await Promise.all([
        admin.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        admin.from('xp_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        admin.from('attendance_records').select('*').eq('user_id', user.id).order('session_date', { ascending: false }),
        admin.from('badges').select('*').eq('user_id', user.id),
        admin.from('mission_claims').select('*').eq('user_id', user.id),
        admin.from('user_notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
        admin.from('study_progress').select('*').eq('user_id', user.id),
        admin.from('puzzle_attempts').select('id, puzzle_id, solved, created_at').eq('user_id', user.id).eq('solved', true),
        admin.from('settings').select('key, value').eq('key', 'xp_rewards').maybeSingle(),
        admin.from('events').select('*').eq('is_published', true).eq('is_past', false).order('event_date', { ascending: true }),
      ]);

      const rewards = parseXpRewards(settingsRows?.value);
      const displayName = profileRow?.display_name || user.email?.split('@')[0] || 'Member';
      const nameKey = normalizeName(displayName);

      // Lookup linked member by member_id, email, or normalized name
      let memberRow = null;
      if (profileRow?.member_id) {
        const { data } = await admin.from('members').select('*').eq('id', profileRow.member_id).maybeSingle();
        memberRow = data;
      }
      if (!memberRow && user.email) {
        const { data } = await admin.from('members').select('*').ilike('email', user.email).maybeSingle();
        memberRow = data;
      }
      if (!memberRow && nameKey.length >= 3) {
        const { data } = await admin.from('members').select('*').eq('name_key', nameKey).maybeSingle();
        memberRow = data;
      }

      if (memberRow && profileRow && !profileRow.member_id) {
        await admin.from('profiles').update({ member_id: memberRow.id }).eq('id', user.id);
      }

      let membershipStatus: 'active_paid' | 'active_unpaid' | 'pending_application' | 'not_registered' = 'not_registered';
      if (memberRow) {
        membershipStatus = memberRow.fees_paid ? 'active_paid' : 'active_unpaid';
      } else if (user.email) {
        const { data: appRow } = await admin
          .from('membership_applications')
          .select('id')
          .ilike('email', user.email)
          .eq('status', 'pending')
          .maybeSingle();
        if (appRow) membershipStatus = 'pending_application';
      }

      // User's tournament registrations
      const { data: regRows } = await admin
        .from('registrations')
        .select('id, tournament_id, category, status, created_at, full_name, tournaments(name, event_date)')
        .or(
          [
            memberRow?.id ? `member_id.eq.${memberRow.id}` : '',
            nameKey.length >= 3 ? `name_key.eq.${nameKey}` : '',
          ]
            .filter(Boolean)
            .join(',') || 'id.eq.00000000-0000-0000-0000-000000000000'
        )
        .order('created_at', { ascending: false });

      const registrations = (regRows ?? []).map((r) => {
        const tRel = Array.isArray(r.tournaments) ? r.tournaments[0] : r.tournaments;
        return {
          id: r.id,
          tournamentId: r.tournament_id,
          tournamentName: tRel?.name ?? { fr: 'Tournoi', en: 'Tournament', ar: 'بطولة' },
          eventDate: tRel?.event_date ?? '',
          category: r.category,
          status: r.status,
          createdAt: r.created_at,
        };
      });

      const regIds = registrations.map((r) => r.id);
      let matchHistory: {
        id: string;
        tournamentName: unknown;
        roundNumber: number;
        board: number;
        color: string;
        opponentName: string;
        result: string;
      }[] = [];

      if (regIds.length > 0) {
        const { data: gameRows } = await admin
          .from('games')
          .select('id, board, result, white_registration_id, black_registration_id, rounds(round_number), tournaments(name)')
          .or(`white_registration_id.in.(${regIds.join(',')}),black_registration_id.in.(${regIds.join(',')})`)
          .order('created_at', { ascending: false })
          .limit(30);

        const allPlayerIds = new Set<string>();
        for (const g of gameRows ?? []) {
          allPlayerIds.add(g.white_registration_id);
          if (g.black_registration_id) allPlayerIds.add(g.black_registration_id);
        }
        const { data: playerNames } =
          allPlayerIds.size > 0
            ? await admin.from('registrations').select('id, full_name').in('id', Array.from(allPlayerIds))
            : { data: [] };
        const pMap = new Map((playerNames ?? []).map((p) => [p.id, p.full_name]));
        const myRegSet = new Set(regIds);

        matchHistory = (gameRows ?? []).map((g) => {
          const isWhite = myRegSet.has(g.white_registration_id);
          const oppId = isWhite ? g.black_registration_id : g.white_registration_id;
          const rdRel = Array.isArray(g.rounds) ? g.rounds[0] : g.rounds;
          const tRel = Array.isArray(g.tournaments) ? g.tournaments[0] : g.tournaments;
          return {
            id: g.id,
            tournamentName: tRel?.name ?? { fr: 'Tournoi', en: 'Tournament', ar: 'بطولة' },
            roundNumber: rdRel?.round_number ?? 1,
            board: g.board,
            color: isWhite ? 'white' : 'black',
            opponentName: oppId ? pMap.get(oppId) ?? 'Opponent' : 'BYE',
            result: g.result,
          };
        });
      }

      const xpTransactions: XpTransactionRecord[] = (xpRows ?? []).map((x) => ({
        id: x.id,
        userId: x.user_id,
        sourceKey: x.source_key,
        activityType: x.activity_type,
        xpDelta: x.xp_delta,
        description: x.description,
        status: x.status,
        createdAt: x.created_at,
      }));

      const verifiedTx = xpTransactions.filter((x) => x.status === 'verified');
      const xpTotal = verifiedTx.reduce((s, x) => s + x.xpDelta, 0);
      const level = computePassportLevel(xpTotal);

      const attendanceRecords: AttendanceRecord[] = (attendanceRows ?? []).map((a) => ({
        id: a.id,
        userId: a.user_id,
        memberId: a.member_id,
        sessionDate: a.session_date,
        sessionType: a.session_type,
        notes: a.notes,
        createdAt: a.created_at,
      }));

      const academyWeeksSolid = (studyRows ?? [])
        .filter((s) => s.mastery === 'solid' || s.mastery === 'mastered')
        .map((s) => s.week_number);

      const distinctSolvedPuzzles = new Set((puzzleRows ?? []).map((p) => p.puzzle_id));
      const dailyPuzzlesCount = new Set(
        (puzzleRows ?? [])
          .filter((p) => String(p.created_at).slice(0, 10) === todayIso)
          .map((p) => p.puzzle_id)
      ).size;

      const weeklyTrainingDone = attendanceRecords.some(
        (a) => getPeriodKeys(new Date(a.sessionDate + 'T12:00:00Z')).weekly === periods.weekly
      );
      const weeklyLessonDone =
        (studyRows ?? []).some((s) => String(s.updated_at).slice(0, 10) === todayIso) || academyWeeksSolid.length > 0;

      const metrics: PassportMetrics = {
        attendanceCount: attendanceRecords.filter((a) => a.sessionType !== 'event_helper').length,
        puzzlesSolvedCount: distinctSolvedPuzzles.size,
        tournamentsParticipated:
          verifiedTx.filter((t) => t.activityType === 'tournament_participation').length +
          registrations.filter((r) => r.status === 'confirmed').length,
        tournamentsWon: verifiedTx.filter((t) => t.activityType === 'tournament_win').length,
        xpTotal,
        eventsHelped:
          attendanceRecords.filter((a) => a.sessionType === 'event_helper').length +
          verifiedTx.filter((t) => t.activityType === 'event_organization').length,
        academyWeeksSolid: academyWeeksSolid.length,
        dailyPuzzlesCount,
        weeklyTrainingDone,
        weeklyLessonDone,
      };

      const storedAwardDates: Record<string, string> = {};
      for (const b of badgeRows ?? []) storedAwardDates[b.badge_key] = b.awarded_at;
      const badges = evaluatePassportBadges(metrics, storedAwardDates);

      // Sync newly earned passport badges in DB
      const toInsertBadges = badges
        .filter((b) => b.unlocked && !storedAwardDates[b.key])
        .map((b) => ({ user_id: user.id, badge_key: b.key }));
      if (toInsertBadges.length > 0) {
        await admin.from('badges').upsert(toInsertBadges, { onConflict: 'user_id,badge_key' });
      }

      const claimedPairs = new Set((claimRows ?? []).map((c) => `${c.mission_key}:${c.period_key}`));
      const missions = evaluateMissions(metrics, claimedPairs, rewards);

      return {
        profile: {
          displayName,
          email: user.email || '',
          role: user.role,
          phone: profileRow?.phone || memberRow?.phone || '',
          faculty: profileRow?.faculty || memberRow?.faculty || memberRow?.department || '',
          chessElo: profileRow?.chess_elo ?? memberRow?.chess_elo ?? null,
          preferredPiece: profileRow?.preferred_piece || memberRow?.preferred_piece || 'p',
          language: profileRow?.language || 'fr',
          showOnLeaderboard: Boolean(profileRow?.show_on_leaderboard),
          bio: profileRow?.bio || '',
          favoriteOpening: profileRow?.favorite_opening || '',
        },
        membership: {
          status: membershipStatus,
          department: memberRow?.department ?? '',
          identifier: memberRow?.identifier ?? '',
          season: memberRow?.season ?? '2026/27',
          feesPaid: Boolean(memberRow?.fees_paid),
        },
        xpTotal,
        level,
        xpRewards: rewards,
        xpTransactions,
        badges,
        attendanceRecords,
        registrations,
        matchHistory,
        missions,
        notifications: (notifRows ?? []).map((n) => ({
          id: n.id,
          userId: n.user_id,
          title: n.title,
          body: n.body,
          type: n.type,
          isRead: n.is_read,
          createdAt: n.created_at,
        })),
        certificates: [
          {
            key: 'endgames_track',
            title: { fr: 'Certificat Finales (Semaines 1–3)', en: 'Endgames Track (Weeks 1–3)', ar: 'شهادة النهايات (الأسابيع 1–3)' },
            eligible: [1, 2, 3].every((w) => academyWeeksSolid.includes(w)),
          },
          {
            key: 'academy_graduate',
            title: { fr: 'Diplôme Académie Chess House (8 semaines)', en: 'Chess House Academy Graduate (8 Weeks)', ar: 'شهادة تخرج أكاديمية بيت الشطرنج' },
            eligible: academyWeeksSolid.length >= 8,
          },
        ],
        upcomingEvents: (upcomingEvRows ?? []).map((ev) => ({
          id: ev.id,
          slug: ev.slug,
          type: ev.event_type,
          dateIso: ev.event_date,
          isPast: Boolean(ev.is_past),
          title: ev.title,
          summary: ev.summary,
          details: ev.summary,
          location: ev.location,
          imageSlot: ev.image_slot || 'gallery-01',
        })),
        studyStats: {
          rating: 900 + academyWeeksSolid.length * 40 + distinctSolvedPuzzles.size * 8,
          puzzlesSolvedCount: distinctSolvedPuzzles.size,
          academyWeeksSolid,
        },
        isPreviewMode: false,
      };
    };

    if (req.method === 'GET') {
      return res.status(200).json(await fetchSupabasePassport());
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = safeJsonBody(req.body);
    const action = cleanString(body.action, 60);

    if (action === 'update_profile') {
      const displayName = cleanString(body.displayName, 80);
      const language = body.language === 'en' || body.language === 'ar' ? body.language : 'fr';
      const bio = cleanString(body.bio, 240);
      const favoriteOpening = cleanString(body.favoriteOpening, 100);
      const phone = cleanString(body.phone, 40);
      const faculty = cleanString(body.faculty, 140);
      const rawElo =
        body.chessElo !== undefined && body.chessElo !== '' && body.chessElo !== null ? Number(body.chessElo) : NaN;
      const chessElo = Number.isFinite(rawElo) && rawElo >= 100 && rawElo <= 3200 ? Math.round(rawElo) : null;
      const rawPiece = cleanString(body.preferredPiece, 4).toLowerCase();

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (displayName.length >= 2) updates.display_name = displayName;
      if (body.language !== undefined) updates.language = language;
      if (body.showOnLeaderboard !== undefined) updates.show_on_leaderboard = Boolean(body.showOnLeaderboard);
      if (body.bio !== undefined) updates.bio = bio;
      if (body.favoriteOpening !== undefined) updates.favorite_opening = favoriteOpening;
      if (body.phone !== undefined) updates.phone = phone;
      if (body.faculty !== undefined) updates.faculty = faculty;
      if (body.chessElo !== undefined) updates.chess_elo = chessElo;
      if (['p', 'n', 'b', 'r', 'q', 'k'].includes(rawPiece)) updates.preferred_piece = rawPiece;

      await admin.from('profiles').update(updates).eq('id', user.id);
      return res.status(200).json({ ok: true, passport: await fetchSupabasePassport() });
    }

    if (action === 'solve_daily_challenge') {
      const moveSan = cleanString(body.moveSan, 20);
      const puzzle = getDailyChallengePuzzle(todayIso);
      if (moveSan !== puzzle.solutionSan[0]) {
        return res.status(400).json({ error: 'Incorrect tactical move' });
      }
      const { data: settingsRow } = await admin.from('settings').select('value').eq('key', 'xp_rewards').maybeSingle();
      const rewards = parseXpRewards(settingsRow?.value);

      await admin.from('puzzle_attempts').insert({
        user_id: user.id,
        puzzle_id: puzzle.id,
        motif: puzzle.motif,
        solved: true,
      });

      const sourceKey = `daily_challenge:${todayIso}`;
      const { error: xpErr } = await admin.from('xp_transactions').insert({
        user_id: user.id,
        source_key: sourceKey,
        activity_type: 'puzzles_batch',
        xp_delta: rewards.puzzles_5,
        description: `Daily Challenge solved (${todayIso}: ${puzzle.title.en})`,
        status: 'verified',
      });

      return res.status(200).json({ ok: true, awarded: !xpErr, passport: await fetchSupabasePassport() });
    }

    if (action === 'sync_study_activity') {
      const [{ data: studyRows }, { data: puzzleRows }, { data: settingsRow }] = await Promise.all([
        admin.from('study_progress').select('week_number, mastery').eq('user_id', user.id),
        admin.from('puzzle_attempts').select('puzzle_id').eq('user_id', user.id).eq('solved', true),
        admin.from('settings').select('value').eq('key', 'xp_rewards').maybeSingle(),
      ]);
      const rewards = parseXpRewards(settingsRow?.value);

      const solidWeeks = (studyRows ?? [])
        .filter((s) => s.mastery === 'solid' || s.mastery === 'mastered')
        .map((s) => s.week_number);
      for (const w of solidWeeks) {
        await admin.from('xp_transactions').insert({
          user_id: user.id,
          source_key: `academy:week_${w}`,
          activity_type: 'academy_week',
          xp_delta: rewards.academy_week,
          description: `Completed Academy Week ${w} (Solid+)`,
          status: 'verified',
        });
      }

      const distinctPuzzles = new Set((puzzleRows ?? []).map((p) => p.puzzle_id)).size;
      const batches = Math.floor(distinctPuzzles / 5);
      for (let b = 1; b <= batches; b++) {
        await admin.from('xp_transactions').insert({
          user_id: user.id,
          source_key: `puzzles:batch_${b}`,
          activity_type: 'puzzles_batch',
          xp_delta: rewards.puzzles_5,
          description: `Solved ${b * 5} Academy tactical puzzles`,
          status: 'verified',
        });
      }

      return res.status(200).json({ ok: true, passport: await fetchSupabasePassport() });
    }

    if (action === 'claim_mission') {
      const missionKey = cleanString(body.missionKey, 80);
      const passport = await fetchSupabasePassport();
      const mission = passport.missions.find((m) => m.key === missionKey);
      if (!mission) return res.status(404).json({ error: 'Mission not found' });
      if (mission.claimed) return res.status(409).json({ error: 'Mission already claimed' });
      if (!mission.canClaim) return res.status(400).json({ error: 'Mission criteria not yet met' });

      const { error: claimErr } = await admin.from('mission_claims').insert({
        user_id: user.id,
        mission_key: mission.key,
        period_key: mission.periodKey,
        xp_awarded: mission.xpReward,
      });
      if (claimErr) return res.status(409).json({ error: 'Already claimed for this period' });

      await admin.from('xp_transactions').insert({
        user_id: user.id,
        source_key: `mission:${mission.key}:${mission.periodKey}`,
        activity_type: 'mission_bonus',
        xp_delta: mission.xpReward,
        description: `Mission completed: ${mission.title.en} (${mission.periodKey})`,
        status: 'verified',
      });

      return res.status(200).json({ ok: true, passport: await fetchSupabasePassport() });
    }

    if (action === 'mark_notifications_read') {
      await admin.from('user_notifications').update({ is_read: true }).eq('user_id', user.id);
      return res.status(200).json({ ok: true, passport: await fetchSupabasePassport() });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch {
    return res.status(500).json({ error: 'Passport request failed' });
  }
}
