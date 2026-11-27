export async function verifyTurnstileToken(token: string | undefined, remoteIp: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // If TURNSTILE_SECRET_KEY is not configured yet (local/preview mode), allow non-bot requests cleanly.
  if (!secret) {
    return true;
  }
  if (!token || typeof token !== 'string' || token.trim().length < 10) {
    return false;
  }

  try {
    const body = new URLSearchParams({
      secret,
      response: token.trim(),
      remoteip: remoteIp,
    });
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!resp.ok) return false;
    const data = (await resp.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}
