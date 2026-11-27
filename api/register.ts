import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, verifyBearerUser } from './_lib/supabaseAdmin';
import { verifyTurnstileToken } from './_lib/turnstile';
import { checkIpRateLimit, getClientIp } from './_lib/rateLimit';
import { cleanString, isHoneypotTriggered, safeJsonBody } from './_lib/validation';
import { localRegisterAuthenticatedPlayer } from './_lib/localStore';
import { normalizeName } from '../src/lib/normalize';
import { isFstFaculty } from '../src/lib/tournamentEligibility';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req.headers);
  if (!checkIpRateLimit(`register:${ip}`, 15, 60_000)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  }

  const body = safeJsonBody(req.body);
  if (isHoneypotTriggered(body)) {
    return res.status(400).json({ status: 'invalid' });
  }

  const turnstileOk = await verifyTurnstileToken(cleanString(body.turnstileToken, 2048), ip);
  if (!turnstileOk) {
    return res.status(403).json({ error: 'Verification failed' });
  }

  const authUser = await verifyBearerUser(req.headers.authorization as string | undefined);
  if (!authUser) {
    return res.status(401).json({ status: 'auth_required', error: 'Sign in required' });
  }

  const tournamentId = cleanString(body.tournamentId, 100);
  const category = cleanString(body.category, 16) === 'women' ? 'women' : 'open';
  const submittedFaculty = cleanString(body.faculty, 140);

  if (!tournamentId) {
    return res.status(400).json({ status: 'invalid' });
  }

  try {
    const admin = getSupabaseAdmin();
    if (!admin) {
      const result = localRegisterAuthenticatedPlayer({
        userId: authUser.id,
        email: authUser.email || '',
        tournamentId,
        category,
        facultyInput: submittedFaculty,
      });
      return res.status(200).json(result);
    }

    // Resolve tournament by UUID or slug
    const tournamentQuery = /^[0-9a-f-]{36}$/i.test(tournamentId)
      ? admin
          .from('tournaments')
          .select('id, slug, name, venue, event_date, end_date, capacity, deadline, is_open, status')
          .eq('id', tournamentId)
          .maybeSingle()
      : admin
          .from('tournaments')
          .select('id, slug, name, venue, event_date, end_date, capacity, deadline, is_open, status')
          .eq('slug', tournamentId)
          .maybeSingle();

    const { data: tRow } = await tournamentQuery;
    if (!tRow?.id) {
      return res.status(400).json({ status: 'invalid' });
    }

    if (
      !tRow.is_open ||
      tRow.status === 'completed' ||
      tRow.status === 'cancelled' ||
      Date.now() > Date.parse(tRow.deadline)
    ) {
      return res.status(200).json({ status: 'closed' });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('id, display_name, phone, faculty, chess_elo, preferred_piece, member_id')
      .eq('id', authUser.id)
      .maybeSingle();

    const displayName = cleanString(profile?.display_name || authUser.email?.split('@')[0] || 'Member', 120);
    const nameKey = normalizeName(displayName);

    // Match club member record
    let matchedMember: {
      id: string;
      full_name: string;
      email: string;
      phone: string;
      identifier: string;
      faculty: string;
      fees_paid: boolean;
      chess_elo: number | null;
      preferred_piece: string;
    } | null = null;

    if (profile?.member_id) {
      const { data: mById } = await admin
        .from('members')
        .select('id, full_name, email, phone, identifier, faculty, fees_paid, chess_elo, preferred_piece')
        .eq('id', profile.member_id)
        .eq('status', 'active')
        .maybeSingle();
      matchedMember = mById ?? null;
    }

    if (!matchedMember && authUser.email) {
      const { data: mByEmail } = await admin
        .from('members')
        .select('id, full_name, email, phone, identifier, faculty, fees_paid, chess_elo, preferred_piece')
        .ilike('email', authUser.email.trim())
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      matchedMember = mByEmail ?? null;
    }

    if (!matchedMember && nameKey.length >= 3) {
      const { data: mByName } = await admin
        .from('members')
        .select('id, full_name, email, phone, identifier, faculty, fees_paid, chess_elo, preferred_piece')
        .eq('name_key', nameKey)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      matchedMember = mByName ?? null;
    }

    // Link member_id on profile if newly matched
    if (matchedMember && !profile?.member_id) {
      await admin
        .from('profiles')
        .upsert({ id: authUser.id, display_name: displayName, member_id: matchedMember.id });
    }

    // Persist newly submitted faculty back to profile (and member if blank)
    if (submittedFaculty) {
      await admin
        .from('profiles')
        .upsert({ id: authUser.id, display_name: displayName, faculty: submittedFaculty });
      if (matchedMember && !matchedMember.faculty) {
        await admin.from('members').update({ faculty: submittedFaculty }).eq('id', matchedMember.id);
      }
    }

    const effectiveFaculty =
      submittedFaculty || cleanString(profile?.faculty, 140) || cleanString(matchedMember?.faculty, 140);

    if (!effectiveFaculty) {
      return res.status(200).json({ status: 'missing_faculty' });
    }

    // Step 1: Check whether registration / club fees are paid
    if (!matchedMember || matchedMember.fees_paid !== true) {
      return res.status(200).json({
        status: 'fee_unpaid',
        faculty: effectiveFaculty,
      });
    }

    // Step 2: Check whether player is an FST student
    if (!isFstFaculty(effectiveFaculty)) {
      return res.status(200).json({
        status: 'not_fst',
        faculty: effectiveFaculty,
      });
    }

    const finalFullName = cleanString(matchedMember.full_name || displayName, 120);
    const finalNameKey = normalizeName(finalFullName);
    const finalEmail = cleanString(authUser.email || matchedMember.email || '', 160);
    const finalPhone = cleanString(profile?.phone || matchedMember.phone || '', 40);
    const finalIdentifier = cleanString(matchedMember.identifier || '', 60);
    const finalElo = profile?.chess_elo ?? matchedMember.chess_elo ?? null;
    const finalPiece = cleanString(profile?.preferred_piece || matchedMember.preferred_piece || 'p', 4) || 'p';

    // Check existing entry
    const [{ data: existingTp }, { data: existingReg }, { count: reservedCount }] = await Promise.all([
      admin
        .from('tournament_players')
        .select('id, registration_id')
        .eq('tournament_id', tRow.id)
        .eq('user_id', authUser.id)
        .maybeSingle(),
      admin
        .from('registrations')
        .select('id, status')
        .eq('tournament_id', tRow.id)
        .eq('name_key', finalNameKey)
        .neq('status', 'cancelled')
        .maybeSingle(),
      admin
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', tRow.id)
        .in('status', ['confirmed', 'member_unpaid']),
    ]);

    const currentReserved = reservedCount ?? 0;

    if (existingTp || existingReg) {
      if (!existingTp && existingReg) {
        await admin.from('tournament_players').insert({
          tournament_id: tRow.id,
          registration_id: existingReg.id,
          user_id: authUser.id,
          member_id: matchedMember.id,
          full_name: finalFullName,
          email: finalEmail,
          phone: finalPhone,
          identifier: finalIdentifier,
          faculty: effectiveFaculty,
          category,
          chess_elo: finalElo,
          preferred_piece: finalPiece,
        });
      }
      return res.status(200).json({
        status: 'already_registered',
        registration_id: existingReg?.id ?? existingTp?.registration_id,
        tournament_player_id: existingTp?.id,
        seats_left: Math.max(0, tRow.capacity - currentReserved),
        venue: tRow.venue,
        event_date: tRow.event_date,
        tournament_name: tRow.name,
        faculty: effectiveFaculty,
      });
    }

    if (currentReserved >= tRow.capacity) {
      return res.status(200).json({ status: 'full' });
    }

    const { data: insertedReg, error: regErr } = await admin
      .from('registrations')
      .insert({
        tournament_id: tRow.id,
        member_id: matchedMember.id,
        full_name: finalFullName,
        identifier: finalIdentifier,
        contact: finalEmail || finalPhone,
        category,
        status: 'confirmed',
        consent: true,
      })
      .select('id')
      .single();

    if (regErr || !insertedReg) {
      return res.status(500).json({ error: 'Registration could not be completed' });
    }

    const { data: insertedTp } = await admin
      .from('tournament_players')
      .insert({
        tournament_id: tRow.id,
        registration_id: insertedReg.id,
        user_id: authUser.id,
        member_id: matchedMember.id,
        full_name: finalFullName,
        email: finalEmail,
        phone: finalPhone,
        identifier: finalIdentifier,
        faculty: effectiveFaculty,
        category,
        chess_elo: finalElo,
        preferred_piece: finalPiece,
      })
      .select('id')
      .single();

    return res.status(200).json({
      status: 'confirmed',
      registration_id: insertedReg.id,
      tournament_player_id: insertedTp?.id,
      seats_left: Math.max(0, tRow.capacity - (currentReserved + 1)),
      venue: tRow.venue,
      event_date: tRow.event_date,
      tournament_name: tRow.name,
      faculty: effectiveFaculty,
    });
  } catch {
    return res.status(500).json({ error: 'Registration could not be completed' });
  }
}
