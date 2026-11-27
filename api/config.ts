import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';
import { localGetTournamentStandings, localStore } from './_lib/localStore';
import { CLUB_EVENTS, INITIAL_NEWS, type ClubEventItem, type LeagueClubRow } from '../src/data/clubContent';
import { computePassportLevel, DEFAULT_XP_REWARDS, getDailyChallengePuzzle } from '../src/lib/passport';

export interface ActivityFeedItem {
  id: string;
  kind: 'tournament' | 'event' | 'news' | 'league' | 'academy';
  dateIso: string;
  title: { fr: string; en: string; ar: string };
  detail: { fr: string; en: string; ar: string };
  link: string;
}

export interface FeaturedPlayerItem {
  id: string;
  displayName: string;
  xpTotal: number;
  levelTitle: { fr: string; en: string; ar: string };
  badgesCount: number;
  source: 'passport' | 'tournament';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const todayIso = new Date().toISOString().slice(0, 10);
    const puzzle = getDailyChallengePuzzle(todayIso);
    const dailyChallenge = {
      id: puzzle.id,
      dateIso: todayIso,
      motif: puzzle.motif,
      rating: puzzle.rating,
      fen: puzzle.fen,
      solutionSan: puzzle.solutionSan,
      title: puzzle.title,
      hint: puzzle.hint,
    };

    const admin = getSupabaseAdmin();
    if (!admin) {
      const nextT = localStore.tournaments[0];
      const reserved = localStore.registrations.filter(
        (r) => r.tournament_id === nextT.id && (r.status === 'confirmed' || r.status === 'member_unpaid')
      ).length;

      const sortedClubs = [...localStore.clubs].sort((a, b) => b.points - a.points);
      const sortedEvents = [...localStore.events].sort(
        (a, b) => Date.parse(b.dateIso) - Date.parse(a.dateIso)
      );

      // Build activity feed from live local store records (no PII exposed)
      const activityFeed: ActivityFeedItem[] = [];
      activityFeed.push({
        id: `act-reg-${nextT.id}`,
        kind: 'tournament',
        dateIso: nextT.event_date,
        title: nextT.name,
        detail: {
          fr: `${reserved} / ${nextT.capacity} échiquiers réservés`,
          en: `${reserved} / ${nextT.capacity} boards reserved`,
          ar: `${reserved} / ${nextT.capacity} رقعة محجوزة`,
        },
        link: '/tournaments',
      });
      if (localStore.rounds.length > 0) {
        const latestRd = localStore.rounds[localStore.rounds.length - 1];
        activityFeed.push({
          id: `act-rd-${latestRd.id}`,
          kind: 'tournament',
          dateIso: todayIso,
          title: {
            fr: `Ronde ${latestRd.round_number} publiée (${latestRd.category})`,
            en: `Round ${latestRd.round_number} published (${latestRd.category})`,
            ar: `نشر الجولة ${latestRd.round_number}`,
          },
          detail: {
            fr: 'Appariements suisses et résultats en direct disponibles.',
            en: 'Swiss pairings and live standings available.',
            ar: 'التزويج السويسري والنتائج المباشرة متاحة.',
          },
          link: '/tournaments',
        });
      }
      for (const ev of sortedEvents.slice(0, 2)) {
        activityFeed.push({
          id: `act-ev-${ev.id}`,
          kind: 'event',
          dateIso: ev.dateIso,
          title: ev.title,
          detail: ev.summary,
          link: '/events',
        });
      }
      if (INITIAL_NEWS[0]) {
        activityFeed.push({
          id: `act-news-${INITIAL_NEWS[0].id}`,
          kind: 'news',
          dateIso: INITIAL_NEWS[0].dateIso,
          title: INITIAL_NEWS[0].title,
          detail: INITIAL_NEWS[0].excerpt,
          link: '/news',
        });
      }

      // Build featured players from opt-in preview profiles + Swiss standings
      const featuredPlayers: FeaturedPlayerItem[] = [];
      for (const prof of localStore.profileMeta.values()) {
        if (!prof.showOnLeaderboard) continue;
        const xpTotal = localStore.xpTransactions
          .filter((x) => x.userId === prof.userId && x.status === 'verified')
          .reduce((s, x) => s + x.xpDelta, 0);
        const lvl = computePassportLevel(xpTotal);
        featuredPlayers.push({
          id: prof.userId,
          displayName: prof.displayName,
          xpTotal,
          levelTitle: lvl.title,
          badgesCount: Object.keys(localStore.badgesByUser.get(prof.userId) ?? {}).length + (xpTotal >= 20 ? 1 : 0),
          source: 'passport',
        });
      }
      const openStandings = localGetTournamentStandings(nextT.id, 'open', false);
      if (openStandings.length > 0 && featuredPlayers.length < 4) {
        for (const s of openStandings.slice(0, 2)) {
          featuredPlayers.push({
            id: `tour-${s.playerId}`,
            displayName: s.name,
            xpTotal: Math.round(s.points * 10),
            levelTitle: { fr: 'Leader Tournoi', en: 'Tournament Leader', ar: 'متصدر البطولة' },
            badgesCount: 1,
            source: 'tournament',
          });
        }
      }

      return res.status(200).json({
        nextTournament: {
          ...nextT,
          confirmedCount: reserved,
          seatsLeft: Math.max(0, nextT.capacity - reserved),
        },
        tournaments: localStore.tournaments.map((t) => {
          const count = localStore.registrations.filter(
            (r) => r.tournament_id === t.id && (r.status === 'confirmed' || r.status === 'member_unpaid')
          ).length;
          return { ...t, confirmedCount: count, seatsLeft: Math.max(0, t.capacity - count) };
        }),
        events: sortedEvents,
        clubs: sortedClubs,
        dailyChallenge,
        activityFeed: activityFeed.slice(0, 6),
        featuredPlayers: featuredPlayers.sort((a, b) => b.xpTotal - a.xpTotal).slice(0, 4),
        clubStats: {
          activeMembersCount: localStore.members.filter((m) => m.status === 'active').length,
          confirmedRegistrationsCount: reserved,
          eventsCount: sortedEvents.length,
          gamesPlayedCount: localStore.games.filter((g) => g.result !== 'pending').length,
          tournamentsCount: localStore.tournaments.length,
          isPreviewMode: true,
        },
        settings: localStore.settings,
      });
    }

    // Supabase Production Mode
    const [
      { data: tournaments },
      { data: settingsRows },
      { data: eventsRows },
      { data: clubsRows },
      { data: newsRows },
      { data: leaderboardRows },
      { count: activeMembersCount },
      { count: gamesPlayedCount },
      { data: latestRounds },
    ] = await Promise.all([
      admin.from('tournaments').select('*').order('event_date', { ascending: true }),
      admin.from('settings').select('key, value').eq('is_public', true),
      admin.from('events').select('*').eq('is_published', true).order('event_date', { ascending: false }),
      admin.from('clubs').select('*').eq('is_published', true).order('points', { ascending: false }),
      admin.from('news_posts').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(3),
      admin.from('passport_public_leaderboard').select('*').limit(6),
      admin.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      admin.from('games').select('*', { count: 'exact', head: true }).neq('result', 'pending'),
      admin.from('rounds').select('id, round_number, category, created_at').eq('is_published', true).order('created_at', { ascending: false }).limit(2),
    ]);

    const settingsMap: Record<string, unknown> = {};
    for (const row of settingsRows ?? []) {
      settingsMap[row.key] = row.value;
    }

    const enriched = await Promise.all(
      (tournaments ?? []).map(async (t) => {
        const { count } = await admin
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', t.id)
          .in('status', ['confirmed', 'member_unpaid']);
        const used = count ?? 0;
        return {
          ...t,
          confirmedCount: used,
          seatsLeft: Math.max(0, (t.capacity ?? 20) - used),
        };
      })
    );

    const nextTournament =
      enriched.find((t) => t.status !== 'completed' && t.status !== 'cancelled') ?? enriched[0] ?? null;

    const events: ClubEventItem[] =
      (eventsRows ?? []).length > 0
        ? (eventsRows ?? []).map((ev) => ({
            id: ev.id,
            slug: ev.slug,
            type: (ev.event_type as ClubEventItem['type']) || 'milestone',
            dateIso: ev.event_date,
            isPast: Boolean(ev.is_past) || Date.parse(ev.event_date) < Date.now(),
            title: ev.title,
            summary: ev.summary,
            details: ev.summary,
            location: ev.location,
            imageSlot: ev.image_slot || 'gallery-01',
          }))
        : CLUB_EVENTS;

    const clubs: LeagueClubRow[] = (clubsRows ?? []).map((c) => ({
      id: c.id,
      clubName: c.club_name,
      university: c.university,
      city: c.city,
      points: c.points,
      editionsPlayed: c.editions_played,
    }));

    const activityFeed: ActivityFeedItem[] = [];
    if (nextTournament) {
      activityFeed.push({
        id: `act-t-${nextTournament.id}`,
        kind: 'tournament',
        dateIso: nextTournament.event_date,
        title: nextTournament.name,
        detail: {
          fr: `${nextTournament.confirmedCount} / ${nextTournament.capacity} échiquiers réservés`,
          en: `${nextTournament.confirmedCount} / ${nextTournament.capacity} boards reserved`,
          ar: `${nextTournament.confirmedCount} / ${nextTournament.capacity} رقعة محجوزة`,
        },
        link: '/tournaments',
      });
    }
    for (const rd of latestRounds ?? []) {
      activityFeed.push({
        id: `act-rd-${rd.id}`,
        kind: 'tournament',
        dateIso: rd.created_at,
        title: {
          fr: `Ronde ${rd.round_number} publiée (${rd.category})`,
          en: `Round ${rd.round_number} published (${rd.category})`,
          ar: `نشر الجولة ${rd.round_number}`,
        },
        detail: {
          fr: 'Appariements et résultats en direct.',
          en: 'Live Swiss pairings and standings.',
          ar: 'التزويج المباشر والنتائج.',
        },
        link: '/tournaments',
      });
    }
    for (const ev of events.slice(0, 2)) {
      activityFeed.push({
        id: `act-ev-${ev.id}`,
        kind: 'event',
        dateIso: ev.dateIso,
        title: ev.title,
        detail: ev.summary,
        link: '/events',
      });
    }
    for (const n of newsRows ?? []) {
      activityFeed.push({
        id: `act-n-${n.id}`,
        kind: 'news',
        dateIso: n.created_at,
        title: n.title,
        detail: n.excerpt,
        link: '/news',
      });
    }

    const featuredPlayers: FeaturedPlayerItem[] = (leaderboardRows ?? []).map((row) => {
      const lvl = computePassportLevel(Number(row.xp_total) || 0);
      return {
        id: row.user_id,
        displayName: row.display_name,
        xpTotal: Number(row.xp_total) || 0,
        levelTitle: lvl.title,
        badgesCount: Number(row.badges_count) || 0,
        source: 'passport',
      };
    });

    const xpRewards = {
      ...DEFAULT_XP_REWARDS,
      ...((settingsMap.xp_rewards as Record<string, number>) ?? {}),
    };

    return res.status(200).json({
      nextTournament,
      tournaments: enriched,
      events,
      clubs,
      dailyChallenge,
      activityFeed: activityFeed.slice(0, 6),
      featuredPlayers,
      clubStats: {
        activeMembersCount: activeMembersCount ?? 0,
        confirmedRegistrationsCount: nextTournament?.confirmedCount ?? 0,
        eventsCount: events.length,
        gamesPlayedCount: gamesPlayedCount ?? 0,
        tournamentsCount: enriched.length,
        isPreviewMode: false,
      },
      settings: {
        clubsReached: (settingsMap.club_stats as { clubsReached?: number } | undefined)?.clubsReached ?? 24,
        iuccUniversities: (settingsMap.club_stats as { iuccUniversities?: number } | undefined)?.iuccUniversities ?? 22,
        iuccStudents: (settingsMap.club_stats as { iuccStudents?: number } | undefined)?.iuccStudents ?? 220,
        weeklySessions: (settingsMap.club_stats as { weeklySessions?: number } | undefined)?.weeklySessions ?? 2,
        mondayAssignmentWeek: (settingsMap.monday_assignment as { weekNumber?: number } | undefined)?.weekNumber ?? 1,
        mondayAssignmentNote: (settingsMap.monday_assignment as { note?: unknown } | undefined)?.note ?? null,
        showPersonalContact:
          process.env.SHOW_PERSONAL_CONTACT === 'true' ||
          Boolean((settingsMap.show_personal_contact as { enabled?: boolean } | undefined)?.enabled),
        entryFee: (settingsMap.entry_fee as { amount?: number | null } | undefined)?.amount ?? null,
        announcementBanner: settingsMap.announcement_banner ?? { enabled: false },
        xpRewards,
      },
    });
  } catch {
    return res.status(500).json({ error: 'Unable to load configuration' });
  }
}
