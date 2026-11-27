import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';
import { localGetTournamentStandings, localStore } from './_lib/localStore';
import { computeStandings, SwissGameRecord, SwissPlayer } from '../src/lib/swiss';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const slugOrId = typeof req.query.tournament === 'string' ? req.query.tournament : 'internal-rapid-nov-2026';
  const category = req.query.category === 'women' ? 'women' : req.query.category === 'open' ? 'open' : undefined;

  try {
    const admin = getSupabaseAdmin();
    if (!admin) {
      const t = localStore.tournaments.find((x) => x.id === slugOrId || x.slug === slugOrId) ?? localStore.tournaments[0];
      const rounds = localStore.rounds.filter(
        (rd) => rd.tournament_id === t.id && rd.is_published && (!category || rd.category === category)
      );
      const regMap = new Map(localStore.registrations.map((r) => [r.id, r.full_name]));
      const roundsWithGames = rounds.map((rd) => ({
        ...rd,
        games: localStore.games
          .filter((g) => g.round_id === rd.id)
          .sort((a, b) => a.board - b.board)
          .map((g) => ({
            ...g,
            whiteName: regMap.get(g.white_registration_id) ?? 'Player',
            blackName: g.black_registration_id ? regMap.get(g.black_registration_id) ?? 'Player' : 'BYE',
          })),
      }));

      const standingsOpen = localGetTournamentStandings(t.id, 'open', false);
      const standingsWomen = localGetTournamentStandings(t.id, 'women', false);

      return res.status(200).json({
        tournamentId: t.id,
        rounds: roundsWithGames,
        standings: {
          open: standingsOpen,
          women: standingsWomen,
        },
      });
    }

    const { data: tRow } = await admin
      .from('tournaments')
      .select('id')
      .or(`slug.eq.${slugOrId},id.eq.${/^[0-9a-f-]{36}$/i.test(slugOrId) ? slugOrId : '00000000-0000-0000-0000-000000000000'}`)
      .maybeSingle();

    if (!tRow?.id) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const { data: regs } = await admin
      .from('registrations')
      .select('id, full_name, category')
      .eq('tournament_id', tRow.id)
      .eq('status', 'confirmed');

    const { data: rounds } = await admin
      .from('rounds')
      .select('*')
      .eq('tournament_id', tRow.id)
      .eq('is_published', true)
      .order('round_number', { ascending: true });

    const { data: games } = await admin
      .from('games')
      .select('*')
      .eq('tournament_id', tRow.id);

    const regMap = new Map((regs ?? []).map((r) => [r.id, r]));
    const roundMap = new Map((rounds ?? []).map((rd) => [rd.id, rd]));

    const publishedGames: SwissGameRecord[] = (games ?? [])
      .filter((g) => roundMap.has(g.round_id))
      .map((g) => ({
        roundNumber: roundMap.get(g.round_id)!.round_number,
        board: g.board,
        whiteId: g.white_registration_id,
        blackId: g.black_registration_id,
        result: g.result,
      }));

    const players: SwissPlayer[] = (regs ?? []).map((r, idx) => ({
      id: r.id,
      name: r.full_name,
      category: r.category,
      seedOrder: idx + 1,
    }));

    const roundsWithGames = (rounds ?? [])
      .filter((rd) => !category || rd.category === category)
      .map((rd) => ({
        ...rd,
        games: (games ?? [])
          .filter((g) => g.round_id === rd.id)
          .sort((a, b) => a.board - b.board)
          .map((g) => ({
            ...g,
            whiteName: regMap.get(g.white_registration_id)?.full_name ?? 'Player',
            blackName: g.black_registration_id ? regMap.get(g.black_registration_id)?.full_name ?? 'Player' : 'BYE',
          })),
      }));

    return res.status(200).json({
      tournamentId: tRow.id,
      rounds: roundsWithGames,
      standings: {
        open: computeStandings(players, publishedGames, 'open'),
        women: computeStandings(players, publishedGames, 'women'),
      },
    });
  } catch {
    return res.status(500).json({ error: 'Unable to load standings' });
  }
}
