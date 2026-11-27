import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedAdmin: SupabaseClient | null = null;

export function isSupabaseServerConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseServerConfigured()) return null;
  if (!cachedAdmin) {
    cachedAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );
  }
  return cachedAdmin;
}

export interface VerifiedAuthUser {
  id: string;
  email?: string;
  role: 'member' | 'board' | 'admin';
}

export async function verifyBearerUser(authHeader: string | undefined): Promise<VerifiedAuthUser | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const admin = getSupabaseAdmin();
  if (!admin) {
    // Preview fallback session token format: "preview:<role>:<email>"
    if (token.startsWith('preview:')) {
      const parts = token.split(':');
      const role = (parts[1] === 'admin' || parts[1] === 'board' ? parts[1] : 'member') as VerifiedAuthUser['role'];
      return { id: `preview-${parts[2] || 'user'}`, email: parts[2] || 'member@usms.ac.ma', role };
    }
    return null;
  }

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  const role = (profile?.role === 'admin' || profile?.role === 'board' ? profile.role : 'member') as VerifiedAuthUser['role'];
  return {
    id: data.user.id,
    email: data.user.email,
    role,
  };
}
