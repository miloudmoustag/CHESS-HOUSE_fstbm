import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { getSupabaseAdmin, verifyBearerUser } from './_lib/supabaseAdmin';
import { cleanString, safeJsonBody } from './_lib/validation';
import { localStore } from './_lib/localStore';

const DAILY_LIMIT = 30;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyBearerUser(req.headers.authorization as string | undefined);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required to use the AI Coach.' });
  }

  const body = safeJsonBody(req.body);
  const fen = cleanString(body.fen, 140);
  const question = cleanString(body.question, 600);
  const bestMoveSan = cleanString(body.bestMoveSan, 20);
  const mistakeCategory = cleanString(body.mistakeCategory, 60);
  const socratic = body.socratic === true;
  const locale = cleanString(body.locale, 5) || 'fr';
  const engineEvalCp = typeof body.engineEvalCp === 'number' ? body.engineEvalCp : 0;

  if (!fen || !question) {
    return res.status(400).json({ error: 'Position FEN and question are required.' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const admin = getSupabaseAdmin();

  // DB-backed per-user daily rate limit
  if (!admin) {
    const key = `${user.id}:${today}`;
    const current = localStore.coachUsage.get(key) ?? 0;
    if (current >= DAILY_LIMIT) {
      return res.status(429).json({ error: `Daily limit of ${DAILY_LIMIT} coach requests reached.` });
    }
    localStore.coachUsage.set(key, current + 1);
  } else {
    const { data: usageRow } = await admin
      .from('coach_usage')
      .select('id, request_count')
      .eq('user_id', user.id)
      .eq('usage_date', today)
      .maybeSingle();

    if ((usageRow?.request_count ?? 0) >= DAILY_LIMIT) {
      return res.status(429).json({ error: `Daily limit of ${DAILY_LIMIT} coach requests reached.` });
    }

    if (usageRow?.id) {
      await admin
        .from('coach_usage')
        .update({ request_count: usageRow.request_count + 1 })
        .eq('id', usageRow.id);
    } else {
      await admin.from('coach_usage').insert({
        user_id: user.id,
        usage_date: today,
        request_count: 1,
      });
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not configured on the server.',
    });
  }

  const model = process.env.GEMINI_MODEL || 'gemini-4-hydrogen';
  const langLabel = locale === 'ar' ? 'Arabic (Modern Standard, clear chess terms)' : locale === 'en' ? 'English' : 'French';

  const systemInstruction = [
    'You are the Chess House Club Coach at FST Béni Mellal.',
    `Always reply concisely in ${langLabel}.`,
    'Our club teaches backwards: endgames first, then middlegame, then openings.',
    'Use the provided engine evaluation and best move as ground truth — never hallucinate illegal moves.',
    socratic
      ? 'Socratic mode is ON: Do NOT reveal the exact best move directly; ask 1-2 guiding questions about key squares, king activity, or undefended pieces so the student discovers it.'
      : 'Explain clearly why the engine best move works and mention the main strategic/tactical idea in 3-5 sentences.',
  ].join(' ');

  const prompt = [
    `FEN: ${fen}`,
    `Engine evaluation (centipawns, + = White better): ${engineEvalCp}`,
    bestMoveSan ? `Engine best move: ${bestMoveSan}` : 'No legal moves / terminal position.',
    mistakeCategory ? `Detected mistake category: ${mistakeCategory}` : '',
    `Student question: ${question}`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    return res.status(200).json({
      reply: response.text ?? '',
      model,
    });
  } catch {
    return res.status(502).json({ error: 'Coach service temporarily unavailable.' });
  }
}
