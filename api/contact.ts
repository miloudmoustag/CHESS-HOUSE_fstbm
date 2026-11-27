import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';
import { verifyTurnstileToken } from './_lib/turnstile';
import { checkIpRateLimit, getClientIp } from './_lib/rateLimit';
import { cleanString, isHoneypotTriggered, isValidEmail, safeJsonBody } from './_lib/validation';
import { localStore } from './_lib/localStore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req.headers);
  if (!checkIpRateLimit(`contact:${ip}`, 6, 60_000)) {
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

  const fullName = cleanString(body.fullName, 120);
  const email = cleanString(body.email, 160);
  const subject = cleanString(body.subject, 160);
  const message = cleanString(body.message, 2000);
  const consent = body.consent === true;

  if (fullName.length < 2 || !isValidEmail(email) || subject.length < 2 || message.length < 5 || !consent) {
    return res.status(400).json({ error: 'Please complete all required fields' });
  }

  try {
    const admin = getSupabaseAdmin();
    if (!admin) {
      localStore.contactMessages.push({
        id: `msg-${Date.now()}`,
        full_name: fullName,
        email,
        subject,
        message,
        created_at: new Date().toISOString(),
      });
      return res.status(200).json({ status: 'sent' });
    }

    const { error } = await admin.from('contact_messages').insert({
      full_name: fullName,
      email,
      subject,
      message,
      consent: true,
    });

    if (error) {
      return res.status(500).json({ error: 'Could not send message' });
    }
    return res.status(200).json({ status: 'sent' });
  } catch {
    return res.status(500).json({ error: 'Could not send message' });
  }
}
