import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return res.status(200).json({ ok: true, mode: 'preview', timestamp: new Date().toISOString() });
    }

    const { error } = await admin.from('tournaments').select('id').limit(1);
    if (error) {
      return res.status(500).json({ ok: false });
    }

    return res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
  } catch {
    return res.status(500).json({ ok: false });
  }
}
