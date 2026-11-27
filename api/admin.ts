import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, verifyBearerUser } from './_lib/supabaseAdmin';
import {
  ensureLocalProfile,
  localAwardXpIdempotent,
  localGenerateNextRound,
  localStore,
} from './_lib/localStore';
import { normalizeName } from '../src/lib/normalize';
import { cleanString, isValidEmail, safeJsonBody } from './_lib/validation';
import { computeStandings, generateSwissPairings, GameResult, SwissGameRecord, SwissPlayer } from '../src/lib/swiss';
import { DEFAULT_XP_REWARDS, PassportActivityType, XpRewardsConfig } from '../src/lib/passport';

function clampXp(n: unknown, fallback: number): number {
  const num = Number(n);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(500, Math.round(num)));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await verifyBearerUser(req.headers.authorization as string | undefined);
  if (!user || (user.role !== 'board' && user.role !== 'admin')) {
    return res.status(403).json({ error: 'Board or admin access required' });
  }

  const admin = getSupabaseAdmin();

  try {
    if (req.method === 'GET') {
      if (!admin) {
        const profiles = Array.from(localStore.profileMeta.values()).map((p) => ({
          id: p.userId,
          display_name: p.displayName,
          email: p.email,
        }));
        return res.status(200).json({
          members: localStore.members,
          tournaments: localStore.tournaments,
          registrations: localStore.registrations,
          tournamentPlayers: localStore.tournamentPlayers,
          rounds: localStore.rounds,
          games: localStore.games,
          membershipApplications: localStore.membershipApplications,
          applications: localStore.applications,
          contactMessages: localStore.contactMessages,
          settings: localStore.settings,
          events: localStore.events,
          clubs: localStore.clubs,
          profiles,
          xpTransactions: localStore.xpTransactions,
          attendanceRecords: localStore.attendanceRecords,
          studySummary: [
            { week_number: 1, learners_count: 14, solid_count: 9 },
            { week_number: 2, learners_count: 11, solid_count: 6 },
            { week_number: 3, learners_count: 8, solid_count: 4 },
            { week_number: 4, learners_count: 6, solid_count: 3 },
          ],
        });
      }

      const [
        { data: members },
        { data: tournaments },
        { data: registrations },
        { data: tournamentPlayers },
        { data: rounds },
        { data: games },
        { data: membershipApplications },
        { data: applications },
        { data: contactMessages },
        { data: studySummary },
        { data: events },
        { data: clubs },
        { data: profiles },
        { data: xpTransactions },
        { data: attendanceRecords },
        { data: settingsRows },
      ] = await Promise.all([
        admin.from('members').select('*').order('full_name'),
        admin.from('tournaments').select('*').order('event_date', { ascending: false }),
        admin.from('registrations').select('*').order('created_at', { ascending: false }),
        admin.from('tournament_players').select('*').order('created_at', { ascending: false }),
        admin.from('rounds').select('*').order('round_number', { ascending: true }),
        admin.from('games').select('*').order('board', { ascending: true }),
        admin.from('membership_applications').select('*').order('created_at', { ascending: false }),
        admin.from('applications').select('*').order('created_at', { ascending: false }),
        admin.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(50),
        admin.from('study_class_summary').select('*'),
        admin.from('events').select('*').order('event_date', { ascending: false }),
        admin.from('clubs').select('*').order('points', { ascending: false }),
        admin.from('profiles').select('id, display_name, role').order('display_name'),
        admin.from('xp_transactions').select('*').order('created_at', { ascending: false }).limit(100),
        admin.from('attendance_records').select('*').order('session_date', { ascending: false }).limit(100),
        admin.from('settings').select('key, value'),
      ]);

      const settingsMap: Record<string, unknown> = {};
      for (const s of settingsRows ?? []) settingsMap[s.key] = s.value;

      return res.status(200).json({
        members: members ?? [],
        tournaments: tournaments ?? [],
        registrations: registrations ?? [],
        tournamentPlayers: tournamentPlayers ?? [],
        rounds: rounds ?? [],
        games: games ?? [],
        membershipApplications: membershipApplications ?? [],
        applications: applications ?? [],
        contactMessages: contactMessages ?? [],
        studySummary: studySummary ?? [],
        events: events ?? [],
        clubs: clubs ?? [],
        profiles: profiles ?? [],
        xpTransactions: (xpTransactions ?? []).map((x) => ({
          id: x.id,
          userId: x.user_id,
          sourceKey: x.source_key,
          activityType: x.activity_type,
          xpDelta: x.xp_delta,
          description: x.description,
          status: x.status,
          createdAt: x.created_at,
        })),
        attendanceRecords: (attendanceRecords ?? []).map((a) => ({
          id: a.id,
          userId: a.user_id,
          memberId: a.member_id,
          sessionDate: a.session_date,
          sessionType: a.session_type,
          notes: a.notes,
          createdAt: a.created_at,
        })),
        settings: {
          mondayAssignmentWeek: (settingsMap.monday_assignment as { weekNumber?: number } | undefined)?.weekNumber ?? 1,
          xpRewards: { ...DEFAULT_XP_REWARDS, ...((settingsMap.xp_rewards as Record<string, number>) ?? {}) },
        },
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = safeJsonBody(req.body);
    const action = cleanString(body.action, 60);

    // -------------------------------------------------------------------------
    // LOCAL PREVIEW MODE ACTIONS
    // -------------------------------------------------------------------------
    if (!admin) {
      if (action === 'add_member') {
        const fullName = cleanString(body.fullName, 120);
        const identifier = cleanString(body.identifier, 60);
        const email = cleanString(body.email, 160);
        const phone = cleanString(body.phone, 40);
        const department = cleanString(body.department, 120);
        const feesPaid = body.feesPaid === true;
        localStore.members.push({
          id: `m-${Date.now()}`,
          full_name: fullName,
          name_key: normalizeName(fullName),
          identifier,
          email,
          phone,
          department,
          status: 'active',
          fees_paid: feesPaid,
          season: '2026/27',
          created_at: new Date().toISOString(),
        });
        if (isValidEmail(email)) {
          ensureLocalProfile(`preview-${email.toLowerCase()}`, email, fullName);
        }
        return res.status(200).json({ ok: true });
      }

      if (action === 'toggle_fee') {
        const m = localStore.members.find((x) => x.id === body.memberId);
        if (m) m.fees_paid = !m.fees_paid;
        return res.status(200).json({ ok: true });
      }

      if (action === 'approve_membership') {
        const app = localStore.membershipApplications.find((a) => a.id === body.applicationId);
        if (app) {
          app.status = 'approved';
          localStore.members.push({
            id: `m-${Date.now()}`,
            full_name: app.full_name,
            name_key: app.name_key,
            identifier: app.identifier,
            email: app.email,
            phone: app.phone || '',
            department: app.department,
            faculty: app.faculty || app.department,
            status: 'active',
            fees_paid: true,
            season: '2026/27',
            chessElo: app.chessElo ?? null,
            preferredPiece: app.preferredPiece || 'p',
            created_at: new Date().toISOString(),
          });
          if (isValidEmail(app.email)) {
            const p = ensureLocalProfile(`preview-${app.email.toLowerCase()}`, app.email, app.full_name);
            if (app.chessElo) p.chessElo = app.chessElo;
            if (app.preferredPiece) p.preferredPiece = app.preferredPiece;
            if (app.faculty || app.department) p.faculty = app.faculty || app.department;
          }
        }
        return res.status(200).json({ ok: true });
      }

      if (action === 'provision_member_accounts') {
        let provisionedCount = 0;
        for (const m of localStore.members) {
          if (m.status !== 'active' || !isValidEmail(m.email)) continue;
          const key = `preview-${m.email.toLowerCase()}`;
          const existed = localStore.profileMeta.has(key);
          ensureLocalProfile(key, m.email, m.full_name);
          if (!existed) provisionedCount += 1;
        }
        return res.status(200).json({ ok: true, provisionedCount });
      }

      if (action === 'reject_membership') {
        const app = localStore.membershipApplications.find((a) => a.id === body.applicationId);
        if (app) app.status = 'rejected';
        return res.status(200).json({ ok: true });
      }

      if (action === 'promote_registration') {
        const reg = localStore.registrations.find((r) => r.id === body.registrationId);
        if (reg) {
          reg.status = 'confirmed';
          const existsTp = localStore.tournamentPlayers.some(
            (tp) => tp.tournament_id === reg.tournament_id && tp.registration_id === reg.id
          );
          if (!existsTp) {
            const matchedMember = reg.member_id ? localStore.members.find((m) => m.id === reg.member_id) : undefined;
            localStore.tournamentPlayers.unshift({
              id: `tp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              tournament_id: reg.tournament_id,
              registration_id: reg.id,
              user_id: matchedMember?.email ? `preview-${matchedMember.email.toLowerCase()}` : null,
              member_id: reg.member_id,
              full_name: reg.full_name,
              email: matchedMember?.email || (reg.contact.includes('@') ? reg.contact : ''),
              phone: matchedMember?.phone || (!reg.contact.includes('@') ? reg.contact : ''),
              identifier: reg.identifier,
              faculty: matchedMember?.faculty || matchedMember?.department || '',
              category: reg.category,
              chess_elo: matchedMember?.chessElo ?? null,
              preferred_piece: matchedMember?.preferredPiece || 'p',
              created_at: new Date().toISOString(),
            });
          }
        }
        return res.status(200).json({ ok: true });
      }

      if (action === 'generate_round') {
        const tournamentId = cleanString(body.tournamentId, 80) || localStore.tournaments[0].id;
        const category = body.category === 'women' ? 'women' : 'open';
        const result = localGenerateNextRound(tournamentId, category);
        return res.status(200).json({ ok: true, ...result });
      }

      if (action === 'set_game_result') {
        const g = localStore.games.find((x) => x.id === body.gameId);
        if (g) g.result = cleanString(body.result, 20) as GameResult;
        return res.status(200).json({ ok: true });
      }

      if (action === 'toggle_tournament_open') {
        const t = localStore.tournaments.find((x) => x.id === body.tournamentId);
        if (t) t.is_open = !t.is_open;
        return res.status(200).json({ ok: true });
      }

      if (action === 'update_assignment') {
        const week = Number(body.weekNumber) || 1;
        localStore.settings.mondayAssignmentWeek = Math.min(8, Math.max(1, week));
        return res.status(200).json({ ok: true });
      }

      if (action === 'update_xp_config') {
        const next: XpRewardsConfig = {
          session: clampXp(body.session, localStore.settings.xpRewards.session),
          puzzles_5: clampXp(body.puzzles_5, localStore.settings.xpRewards.puzzles_5),
          tournament: clampXp(body.tournament, localStore.settings.xpRewards.tournament),
          organize_event: clampXp(body.organize_event, localStore.settings.xpRewards.organize_event),
          academy_week: clampXp(body.academy_week, localStore.settings.xpRewards.academy_week),
          tournament_win: clampXp(body.tournament_win, localStore.settings.xpRewards.tournament_win),
        };
        localStore.settings.xpRewards = next;
        return res.status(200).json({ ok: true });
      }

      if (action === 'record_attendance') {
        const targetUserId = cleanString(body.userId, 120);
        const sessionDate = cleanString(body.sessionDate, 20) || new Date().toISOString().slice(0, 10);
        const sessionType = (
          ['monday_training', 'thursday_play', 'event_helper', 'special'].includes(cleanString(body.sessionType, 30))
            ? cleanString(body.sessionType, 30)
            : 'monday_training'
        ) as 'monday_training' | 'thursday_play' | 'event_helper' | 'special';
        const notes = cleanString(body.notes, 200);
        if (!targetUserId) return res.status(400).json({ error: 'Target user required' });

        const dup = localStore.attendanceRecords.find(
          (a) => a.userId === targetUserId && a.sessionDate === sessionDate && a.sessionType === sessionType
        );
        if (dup) return res.status(409).json({ error: 'Attendance already logged for this session' });

        localStore.attendanceRecords.unshift({
          id: `att-${Date.now()}`,
          userId: targetUserId,
          memberId: null,
          sessionDate,
          sessionType,
          notes,
          createdAt: new Date().toISOString(),
        });

        const rewards = localStore.settings.xpRewards;
        const isHelper = sessionType === 'event_helper';
        const xpDelta = isHelper ? rewards.organize_event : rewards.session;
        localAwardXpIdempotent({
          userId: targetUserId,
          sourceKey: `session:${sessionDate}:${sessionType}`,
          activityType: isHelper ? 'event_organization' : 'training_session',
          xpDelta,
          description: notes || `${sessionType.replace('_', ' ')} (${sessionDate})`,
        });

        localStore.notifications.unshift({
          id: `notif-${Date.now()}`,
          userId: targetUserId,
          title: {
            fr: `+${xpDelta} XP vérifiés`,
            en: `+${xpDelta} Verified House XP`,
            ar: `+${xpDelta} نقطة خبرة موثقة`,
          },
          body: {
            fr: `Présence validée (${sessionDate}).`,
            en: `Verified attendance logged for ${sessionDate}.`,
            ar: `تم توثيق حضورك بتاريخ ${sessionDate}.`,
          },
          type: 'xp',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
        return res.status(200).json({ ok: true });
      }

      if (action === 'award_xp') {
        const targetUserId = cleanString(body.userId, 120);
        const activityType = (cleanString(body.activityType, 40) || 'tournament_participation') as PassportActivityType;
        const sourceKey = cleanString(body.sourceKey, 120) || `manual:${Date.now()}`;
        const description = cleanString(body.description, 200) || 'Verified club activity';
        const rewards = localStore.settings.xpRewards;
        const defaultDelta =
          activityType === 'tournament_win'
            ? rewards.tournament_win
            : activityType === 'tournament_participation'
            ? rewards.tournament
            : activityType === 'event_organization'
            ? rewards.organize_event
            : activityType === 'training_session'
            ? rewards.session
            : clampXp(body.xpDelta, 15);

        if (!targetUserId) return res.status(400).json({ error: 'Target user required' });
        const result = localAwardXpIdempotent({
          userId: targetUserId,
          sourceKey,
          activityType,
          xpDelta: body.xpDelta !== undefined && activityType === 'admin_adjustment' ? clampXp(body.xpDelta, 15) : defaultDelta,
          description,
        });
        if (!result.awarded) return res.status(409).json({ error: 'Duplicate source key for this user' });
        return res.status(200).json({ ok: true });
      }

      if (action === 'revoke_xp') {
        const tx = localStore.xpTransactions.find((x) => x.id === body.transactionId);
        if (tx) tx.status = 'revoked';
        return res.status(200).json({ ok: true });
      }

      if (action === 'upsert_event') {
        const titleEn = cleanString(body.titleEn, 160);
        const titleFr = cleanString(body.titleFr, 160) || titleEn;
        const dateIso = cleanString(body.dateIso, 40) || new Date().toISOString();
        const locationText = cleanString(body.location, 140) || 'FST Béni Mellal';
        const summaryText = cleanString(body.summary, 300);
        if (!titleEn) return res.status(400).json({ error: 'Title required' });

        localStore.events.unshift({
          id: `ev-${Date.now()}`,
          slug: `${titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
          type: 'milestone',
          dateIso,
          isPast: Date.parse(dateIso) < Date.now(),
          title: { fr: titleFr, en: titleEn, ar: titleEn },
          summary: { fr: summaryText, en: summaryText, ar: summaryText },
          details: { fr: summaryText, en: summaryText, ar: summaryText },
          location: { fr: locationText, en: locationText, ar: locationText },
          imageSlot: 'gallery-01',
        });
        return res.status(200).json({ ok: true });
      }

      if (action === 'update_club_points') {
        const club = localStore.clubs.find((c) => c.id === body.clubId);
        if (club) {
          club.points = Math.max(0, Math.round(Number(body.points) || 0));
          club.editionsPlayed = Math.max(0, Math.round(Number(body.editionsPlayed) || club.editionsPlayed));
        }
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    // -------------------------------------------------------------------------
    // SUPABASE PRODUCTION MODE ACTIONS
    // -------------------------------------------------------------------------
    if (action === 'add_member') {
      const fullName = cleanString(body.fullName, 120);
      const identifier = cleanString(body.identifier, 60);
      const email = cleanString(body.email, 160);
      const phone = cleanString(body.phone, 40);
      const department = cleanString(body.department, 120);
      const { data: inserted, error } = await admin
        .from('members')
        .insert({
          full_name: fullName,
          identifier,
          email,
          phone,
          department,
          fees_paid: body.feesPaid === true,
          status: 'active',
          season: '2026/27',
        })
        .select('id')
        .single();
      if (error) return res.status(400).json({ error: 'Could not add member' });

      if (isValidEmail(email) && inserted?.id) {
        try {
          const { data: createdAuth } = await admin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { full_name: fullName, member_id: inserted.id, phone },
          });
          if (createdAuth?.user?.id) {
            await admin.from('profiles').upsert({
              id: createdAuth.user.id,
              display_name: fullName,
              phone,
              member_id: inserted.id,
              role: 'member',
            });
          }
        } catch {
          // Non-blocking: user can still log in via Google and auto-link by email
        }
      }
      return res.status(200).json({ ok: true });
    }

    if (action === 'toggle_fee') {
      const { data: m } = await admin.from('members').select('fees_paid').eq('id', body.memberId).maybeSingle();
      if (m) {
        await admin.from('members').update({ fees_paid: !m.fees_paid }).eq('id', body.memberId);
      }
      return res.status(200).json({ ok: true });
    }

    if (action === 'approve_membership') {
      const { data: app } = await admin
        .from('membership_applications')
        .select('*')
        .eq('id', body.applicationId)
        .maybeSingle();
      if (app) {
        const { data: inserted } = await admin
          .from('members')
          .insert({
            full_name: app.full_name,
            identifier: app.identifier,
            email: app.email,
            phone: app.phone || '',
            department: app.department,
            faculty: app.faculty || app.department || '',
            chess_elo: app.chess_elo ?? null,
            preferred_piece: app.preferred_piece || 'p',
            status: 'active',
            fees_paid: true,
            season: '2026/27',
          })
          .select('id')
          .single();
        await admin.from('membership_applications').update({ status: 'approved' }).eq('id', app.id);

        if (isValidEmail(app.email || '') && inserted?.id) {
          try {
            const { data: createdAuth } = await admin.auth.admin.createUser({
              email: app.email,
              email_confirm: true,
              user_metadata: {
                full_name: app.full_name,
                member_id: inserted.id,
                phone: app.phone || '',
                faculty: app.faculty || app.department || '',
                chess_elo: app.chess_elo ?? undefined,
                preferred_piece: app.preferred_piece || 'p',
              },
            });
            if (createdAuth?.user?.id) {
              await admin.from('profiles').upsert({
                id: createdAuth.user.id,
                display_name: app.full_name,
                phone: app.phone || '',
                faculty: app.faculty || app.department || '',
                chess_elo: app.chess_elo ?? null,
                preferred_piece: app.preferred_piece || 'p',
                member_id: inserted.id,
                role: 'member',
              });
            }
          } catch {
            // Non-blocking
          }
        }
      }
      return res.status(200).json({ ok: true });
    }

    if (action === 'provision_member_accounts') {
      const [{ data: activeMembers }, { data: authUsersData }] = await Promise.all([
        admin.from('members').select('id, full_name, email, phone, department, faculty, chess_elo, preferred_piece').eq('status', 'active'),
        admin.auth.admin.listUsers({ perPage: 1000 }),
      ]);

      const existingByEmail = new Map<string, string>();
      for (const u of authUsersData?.users ?? []) {
        if (u.email) existingByEmail.set(u.email.toLowerCase(), u.id);
      }

      let provisionedCount = 0;
      let linkedCount = 0;
      for (const m of activeMembers ?? []) {
        if (!m.email || !isValidEmail(m.email)) continue;
        const emailLower = m.email.toLowerCase();
        let authUserId = existingByEmail.get(emailLower);

        if (!authUserId) {
          const { data: created } = await admin.auth.admin.createUser({
            email: m.email,
            email_confirm: true,
            user_metadata: {
              full_name: m.full_name,
              member_id: m.id,
              phone: m.phone || '',
              faculty: m.faculty || m.department || '',
              chess_elo: m.chess_elo ?? undefined,
              preferred_piece: m.preferred_piece || 'p',
            },
          });
          if (created?.user?.id) {
            authUserId = created.user.id;
            existingByEmail.set(emailLower, authUserId);
            provisionedCount += 1;
          }
        }

        if (authUserId) {
          await admin.from('profiles').upsert({
            id: authUserId,
            display_name: m.full_name,
            phone: m.phone || '',
            faculty: m.faculty || m.department || '',
            chess_elo: m.chess_elo ?? null,
            preferred_piece: m.preferred_piece || 'p',
            member_id: m.id,
          });
          linkedCount += 1;
        }
      }

      return res.status(200).json({ ok: true, provisionedCount, linkedCount });
    }

    if (action === 'reject_membership') {
      await admin.from('membership_applications').update({ status: 'rejected' }).eq('id', body.applicationId);
      return res.status(200).json({ ok: true });
    }

    if (action === 'promote_registration') {
      const { data: regRow } = await admin
        .from('registrations')
        .update({ status: 'confirmed' })
        .eq('id', body.registrationId)
        .select('*')
        .maybeSingle();

      if (regRow) {
        const { data: existingTp } = await admin
          .from('tournament_players')
          .select('id')
          .eq('tournament_id', regRow.tournament_id)
          .eq('registration_id', regRow.id)
          .maybeSingle();

        if (!existingTp) {
          const { data: memberRow } = regRow.member_id
            ? await admin.from('members').select('email, phone, faculty, chess_elo, preferred_piece').eq('id', regRow.member_id).maybeSingle()
            : { data: null };
          await admin.from('tournament_players').insert({
            tournament_id: regRow.tournament_id,
            registration_id: regRow.id,
            member_id: regRow.member_id,
            full_name: regRow.full_name,
            email: memberRow?.email || (regRow.contact?.includes('@') ? regRow.contact : ''),
            phone: memberRow?.phone || (!regRow.contact?.includes('@') ? regRow.contact : ''),
            identifier: regRow.identifier || '',
            faculty: memberRow?.faculty || '',
            category: regRow.category,
            chess_elo: memberRow?.chess_elo ?? null,
            preferred_piece: memberRow?.preferred_piece || 'p',
          });
        }
      }
      return res.status(200).json({ ok: true });
    }

    if (action === 'generate_round') {
      const tournamentId = cleanString(body.tournamentId, 80);
      const category = body.category === 'women' ? 'women' : 'open';

      const { data: regs } = await admin
        .from('registrations')
        .select('id, full_name, category')
        .eq('tournament_id', tournamentId)
        .eq('status', 'confirmed')
        .eq('category', category);

      const { data: existingRounds } = await admin
        .from('rounds')
        .select('id, round_number')
        .eq('tournament_id', tournamentId)
        .eq('category', category)
        .order('round_number', { ascending: true });

      const nextRoundNumber = (existingRounds?.length ?? 0) + 1;
      const { data: prevGames } = await admin.from('games').select('*').eq('tournament_id', tournamentId);

      const roundNumById = new Map((existingRounds ?? []).map((r) => [r.id, r.round_number]));
      const players: SwissPlayer[] = (regs ?? []).map((r, idx) => ({
        id: r.id,
        name: r.full_name,
        category: r.category,
        seedOrder: idx + 1,
      }));
      const swissHistory: SwissGameRecord[] = (prevGames ?? [])
        .filter((g) => roundNumById.has(g.round_id))
        .map((g) => ({
          roundNumber: roundNumById.get(g.round_id)!,
          board: g.board,
          whiteId: g.white_registration_id,
          blackId: g.black_registration_id,
          result: g.result,
        }));

      const pairings = generateSwissPairings(players, swissHistory, category);
      const { data: newRound, error: rdErr } = await admin
        .from('rounds')
        .insert({
          tournament_id: tournamentId,
          round_number: nextRoundNumber,
          category,
          is_published: true,
        })
        .select()
        .single();

      if (rdErr || !newRound) return res.status(400).json({ error: 'Could not create round' });

      if (pairings.length > 0) {
        await admin.from('games').insert(
          pairings.map((p) => ({
            round_id: newRound.id,
            tournament_id: tournamentId,
            board: p.board,
            white_registration_id: p.whiteId,
            black_registration_id: p.blackId,
            result: p.blackId === null ? 'bye' : 'pending',
          }))
        );
      }

      const standings = computeStandings(players, swissHistory, category);
      return res.status(200).json({ ok: true, round: newRound, standings });
    }

    if (action === 'set_game_result') {
      await admin.from('games').update({ result: cleanString(body.result, 20) }).eq('id', body.gameId);
      return res.status(200).json({ ok: true });
    }

    if (action === 'toggle_tournament_open') {
      const { data: t } = await admin.from('tournaments').select('is_open').eq('id', body.tournamentId).maybeSingle();
      if (t) {
        await admin.from('tournaments').update({ is_open: !t.is_open }).eq('id', body.tournamentId);
      }
      return res.status(200).json({ ok: true });
    }

    if (action === 'update_assignment') {
      const week = Math.min(8, Math.max(1, Number(body.weekNumber) || 1));
      await admin.from('settings').upsert({ key: 'monday_assignment', value: { weekNumber: week }, is_public: true });
      return res.status(200).json({ ok: true });
    }

    if (action === 'update_xp_config') {
      const next: XpRewardsConfig = {
        session: clampXp(body.session, DEFAULT_XP_REWARDS.session),
        puzzles_5: clampXp(body.puzzles_5, DEFAULT_XP_REWARDS.puzzles_5),
        tournament: clampXp(body.tournament, DEFAULT_XP_REWARDS.tournament),
        organize_event: clampXp(body.organize_event, DEFAULT_XP_REWARDS.organize_event),
        academy_week: clampXp(body.academy_week, DEFAULT_XP_REWARDS.academy_week),
        tournament_win: clampXp(body.tournament_win, DEFAULT_XP_REWARDS.tournament_win),
      };
      await admin.from('settings').upsert({ key: 'xp_rewards', value: next, is_public: true });
      return res.status(200).json({ ok: true });
    }

    if (action === 'record_attendance') {
      const targetUserId = cleanString(body.userId, 120);
      const sessionDate = cleanString(body.sessionDate, 20) || new Date().toISOString().slice(0, 10);
      const sessionType = cleanString(body.sessionType, 30) || 'monday_training';
      const notes = cleanString(body.notes, 200);
      if (!targetUserId) return res.status(400).json({ error: 'Target user required' });

      const { error: attErr } = await admin.from('attendance_records').insert({
        user_id: targetUserId,
        session_date: sessionDate,
        session_type: sessionType,
        notes,
        verified_by: user.id,
      });
      if (attErr) return res.status(409).json({ error: 'Attendance already recorded or invalid' });

      const { data: settingsRow } = await admin.from('settings').select('value').eq('key', 'xp_rewards').maybeSingle();
      const rewards = { ...DEFAULT_XP_REWARDS, ...((settingsRow?.value as Record<string, number>) ?? {}) };
      const isHelper = sessionType === 'event_helper';
      const xpDelta = isHelper ? rewards.organize_event : rewards.session;

      await admin.from('xp_transactions').insert({
        user_id: targetUserId,
        source_key: `session:${sessionDate}:${sessionType}`,
        activity_type: isHelper ? 'event_organization' : 'training_session',
        xp_delta: xpDelta,
        description: notes || `${sessionType.replace('_', ' ')} (${sessionDate})`,
        verified_by: user.id,
        status: 'verified',
      });

      await admin.from('user_notifications').insert({
        user_id: targetUserId,
        title: { fr: `+${xpDelta} XP vérifiés`, en: `+${xpDelta} Verified House XP`, ar: `+${xpDelta} نقطة خبرة موثقة` },
        body: { fr: `Présence validée (${sessionDate}).`, en: `Verified attendance logged for ${sessionDate}.`, ar: `تم توثيق حضورك بتاريخ ${sessionDate}.` },
        type: 'xp',
      });
      return res.status(200).json({ ok: true });
    }

    if (action === 'award_xp') {
      const targetUserId = cleanString(body.userId, 120);
      const activityType = (cleanString(body.activityType, 40) || 'tournament_participation') as PassportActivityType;
      const sourceKey = cleanString(body.sourceKey, 120) || `manual:${Date.now()}`;
      const description = cleanString(body.description, 200) || 'Verified club activity';
      if (!targetUserId) return res.status(400).json({ error: 'Target user required' });

      const { data: settingsRow } = await admin.from('settings').select('value').eq('key', 'xp_rewards').maybeSingle();
      const rewards = { ...DEFAULT_XP_REWARDS, ...((settingsRow?.value as Record<string, number>) ?? {}) };
      const defaultDelta =
        activityType === 'tournament_win'
          ? rewards.tournament_win
          : activityType === 'tournament_participation'
          ? rewards.tournament
          : activityType === 'event_organization'
          ? rewards.organize_event
          : activityType === 'training_session'
          ? rewards.session
          : clampXp(body.xpDelta, 15);

      const xpDelta = activityType === 'admin_adjustment' ? clampXp(body.xpDelta, 15) : defaultDelta;
      const { error: xpErr } = await admin.from('xp_transactions').insert({
        user_id: targetUserId,
        source_key: sourceKey,
        activity_type: activityType,
        xp_delta: xpDelta,
        description,
        verified_by: user.id,
        status: 'verified',
      });
      if (xpErr) return res.status(409).json({ error: 'Duplicate XP entry for source key' });
      return res.status(200).json({ ok: true });
    }

    if (action === 'revoke_xp') {
      await admin.from('xp_transactions').update({ status: 'revoked' }).eq('id', body.transactionId);
      return res.status(200).json({ ok: true });
    }

    if (action === 'upsert_event') {
      const titleEn = cleanString(body.titleEn, 160);
      const titleFr = cleanString(body.titleFr, 160) || titleEn;
      const dateIso = cleanString(body.dateIso, 40) || new Date().toISOString();
      const locationText = cleanString(body.location, 140) || 'FST Béni Mellal';
      const summaryText = cleanString(body.summary, 300);
      if (!titleEn) return res.status(400).json({ error: 'Title required' });

      await admin.from('events').insert({
        slug: `${titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        event_type: 'milestone',
        event_date: dateIso,
        is_past: Date.parse(dateIso) < Date.now(),
        title: { fr: titleFr, en: titleEn, ar: titleEn },
        summary: { fr: summaryText, en: summaryText, ar: summaryText },
        location: { fr: locationText, en: locationText, ar: locationText },
        image_slot: 'gallery-01',
        is_published: true,
      });
      return res.status(200).json({ ok: true });
    }

    if (action === 'update_club_points') {
      await admin
        .from('clubs')
        .update({
          points: Math.max(0, Math.round(Number(body.points) || 0)),
          editions_played: Math.max(0, Math.round(Number(body.editionsPlayed) || 0)),
        })
        .eq('id', body.clubId);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch {
    return res.status(500).json({ error: 'Admin action failed' });
  }
}
