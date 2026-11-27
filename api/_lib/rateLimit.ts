interface RateBucket {
  timestamps: number[];
}

const ipBuckets = new Map<string, RateBucket>();

export function checkIpRateLimit(key: string, maxRequests = 12, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length >= maxRequests) {
    ipBuckets.set(key, bucket);
    return false;
  }
  bucket.timestamps.push(now);
  ipBuckets.set(key, bucket);
  return true;
}

export function getClientIp(headers: Record<string, string | string[] | undefined>): string {
  const fwd = headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    return fwd.split(',')[0].trim();
  }
  if (Array.isArray(fwd) && fwd.length > 0) {
    return fwd[0].trim();
  }
  const realIp = headers['x-real-ip'];
  if (typeof realIp === 'string') return realIp.trim();
  return '127.0.0.1';
}
