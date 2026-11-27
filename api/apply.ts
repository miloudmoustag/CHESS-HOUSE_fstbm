import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';
import { verifyTurnstileToken } from './_lib/turnstile';
import { checkIpRateLimit, getClientIp } from './_lib/rateLimit';
import { cleanString, isHoneypotTriggered, isValidEmail, safeJsonBody } from './_lib/validation';
import { normalizeId, normalizeName } from '../src/lib/normalize';
import { localStore } from './_lib/localStore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req.headers);
  if (!checkIpRateLimit(`apply:${ip}`, 8, 60_000)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  }

  const body = safeJsonBody(req.body);
  if (isHoneypotTriggered(body)) {
    return res.status(400).json({ error: 'Invalid submission' });
  }

  const turnstileOk = await verifyTurnstileToken(cleanString(body.turnstileToken, 2048), ip);
  if (!turnstileOk) {
    return res.status(403).json({ error: 'Verification failed' });
  }

  const type = cleanString(body.type, 40);
  const consent = body.consent === true;
  if (!consent) {
    return res.status(400).json({ error: 'Consent is required' });
  }

  try {
    const admin = getSupabaseAdmin();

    if (type === 'membership') {
      const firstName = cleanString(body.firstName, 60);
      const lastName = cleanString(body.lastName, 60);
      const fullName = cleanString(body.fullName, 120) || `${firstName} ${lastName}`.trim();
      const identifier = cleanString(body.identifier, 60);
      const email = cleanString(body.email, 160);
      const phone = cleanString(body.phone, 40);
      const faculty = cleanString(body.faculty, 140);
      const department = cleanString(body.department, 120) || faculty;
      const level = cleanString(body.level, 40) || 'beginner';
      const rawElo = body.chessElo !== undefined && body.chessElo !== '' && body.chessElo !== null ? Number(body.chessElo) : NaN;
      const chessElo = Number.isFinite(rawElo) && rawElo >= 100 && rawElo <= 3200 ? Math.round(rawElo) : null;
      const rawPiece = cleanString(body.preferredPiece, 4).toLowerCase();
      const preferredPiece = ['p', 'n', 'b', 'r', 'q', 'k'].includes(rawPiece) ? rawPiece : 'p';

      if (fullName.length < 3 || identifier.length < 3 || !isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid application details' });
      }

      const nameKey = normalizeName(fullName);
      const normId = normalizeId(identifier);

      if (!admin) {
        const dup = localStore.membershipApplications.find(
          (a) => a.name_key === nameKey && normalizeId(a.identifier) === normId && a.status !== 'rejected'
        );
        if (dup) {
          return res.status(200).json({ status: 'duplicate' });
        }
        localStore.membershipApplications.push({
          id: `app-${Date.now()}`,
          full_name: fullName,
          name_key: nameKey,
          identifier,
          email,
          phone,
          department,
          faculty,
          level,
          chessElo,
          preferredPiece,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
        return res.status(200).json({ status: 'pending' });
      }

      const { data: existing } = await admin
        .from('membership_applications')
        .select('id, identifier, status')
        .eq('name_key', nameKey)
        .neq('status', 'rejected');

      if (existing && existing.some((row) => normalizeId(row.identifier) === normId)) {
        return res.status(200).json({ status: 'duplicate' });
      }

      const { error } = await admin.from('membership_applications').insert({
        full_name: fullName,
        identifier,
        email,
        phone,
        department,
        faculty,
        level,
        chess_elo: chessElo,
        preferred_piece: preferredPiece,
        consent: true,
        status: 'pending',
      });

      if (error) {
        return res.status(500).json({ error: 'Could not submit application' });
      }
      return res.status(200).json({ status: 'pending' });
    }

    if (type === 'partner' || type === 'interuni_club') {
      const organisation = cleanString(body.organisation, 140);
      const contactName = cleanString(body.contactName, 120);
      const email = cleanString(body.email, 160);
      const details = cleanString(body.details, 1200);
      const extra = cleanString(body.extra, 120);

      if (organisation.length < 2 || contactName.length < 2 || !isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid enquiry details' });
      }

      const payload = { details, extra };

      if (!admin) {
        localStore.applications.push({
          id: `enq-${Date.now()}`,
          type,
          organisation,
          contact_name: contactName,
          email,
          payload,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
        return res.status(200).json({ status: 'received' });
      }

      const { error } = await admin.from('applications').insert({
        type,
        organisation,
        contact_name: contactName,
        email,
        payload,
        status: 'pending',
      });

      if (error) {
        return res.status(500).json({ error: 'Could not save enquiry' });
      }
      return res.status(200).json({ status: 'received' });
    }

    return res.status(400).json({ error: 'Unsupported application type' });
  } catch {
    return res.status(500).json({ error: 'Submission failed' });
  }
}
