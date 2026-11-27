export function cleanString(val: unknown, maxLen = 200): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

export function isValidEmail(email: string): boolean {
  if (!email || email.length > 160) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isHoneypotTriggered(body: Record<string, unknown> | null | undefined): boolean {
  if (!body) return true;
  const trap = body.website ?? body.honeypot ?? body.company_fax;
  return typeof trap === 'string' && trap.trim().length > 0;
}

export function safeJsonBody(reqBody: unknown): Record<string, unknown> {
  if (reqBody && typeof reqBody === 'object' && !Array.isArray(reqBody)) {
    return reqBody as Record<string, unknown>;
  }
  if (typeof reqBody === 'string') {
    try {
      const parsed = JSON.parse(reqBody);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}
