import React, { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type UserRole = 'member' | 'board' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  showOnLeaderboard: boolean;
  accessToken: string;
}

export interface SignUpMeta {
  firstName?: string;
  lastName?: string;
  phone?: string;
  faculty?: string;
  chessElo?: number | null;
  preferredPiece?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isSupabaseReady: boolean;
  signInWithPassword: (email: string, password: string, meta?: { faculty?: string }) => Promise<{ error?: string }>;
  signUpWithPassword: (
    email: string,
    password: string,
    displayName: string,
    meta?: SignUpMeta
  ) => Promise<{ error?: string }>;
  signInWithGoogle: (meta?: { faculty?: string }) => Promise<{ error?: string }>;
  sendMagicLink: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateLeaderboardOptIn: (optIn: boolean) => Promise<void>;
  previewSignInAs: (role: UserRole, email: string, displayName: string, faculty?: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const PREVIEW_USER_KEY = 'ch_preview_user';
const PENDING_FACULTY_KEY = 'ch_pending_faculty';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      if (!supabase) {
        try {
          const raw = localStorage.getItem(PREVIEW_USER_KEY);
          if (raw && active) {
            setUser(JSON.parse(raw) as AuthUser);
          }
        } catch {
          // ignore
        }
        if (active) setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session && active) {
        await hydrateSupabaseUser(
          data.session.user.id,
          data.session.user.email ?? '',
          data.session.access_token,
          data.session.user.user_metadata
        );
      }
      if (active) setLoading(false);

      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!active) return;
        if (session?.user) {
          await hydrateSupabaseUser(
            session.user.id,
            session.user.email ?? '',
            session.access_token,
            session.user.user_metadata
          );
        } else {
          setUser(null);
        }
      });

      return () => {
        listener.subscription.unsubscribe();
      };
    }

    async function hydrateSupabaseUser(
      id: string,
      email: string,
      accessToken: string,
      userMeta?: Record<string, unknown>
    ) {
      if (!supabase) return;
      const metaName =
        (typeof userMeta?.display_name === 'string' && userMeta.display_name.trim()) ||
        (typeof userMeta?.full_name === 'string' && userMeta.full_name.trim()) ||
        (typeof userMeta?.name === 'string' && userMeta.name.trim()) ||
        email.split('@')[0] ||
        'Member';

      const pendingFaculty = localStorage.getItem(PENDING_FACULTY_KEY) || '';
      const metaFaculty =
        (typeof userMeta?.faculty === 'string' && userMeta.faculty.trim()) || pendingFaculty;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, role, show_on_leaderboard, faculty')
        .eq('id', id)
        .maybeSingle();

      if (!profile) {
        const insertPayload: Record<string, unknown> = {
          id,
          display_name: metaName,
          role: 'member',
          show_on_leaderboard: false,
        };
        if (typeof userMeta?.phone === 'string' && userMeta.phone.trim()) {
          insertPayload.phone = userMeta.phone.trim();
        }
        if (metaFaculty) {
          insertPayload.faculty = metaFaculty;
        }
        if (typeof userMeta?.chess_elo === 'number') {
          insertPayload.chess_elo = userMeta.chess_elo;
        }
        if (typeof userMeta?.preferred_piece === 'string' && userMeta.preferred_piece.trim()) {
          insertPayload.preferred_piece = userMeta.preferred_piece.trim();
        }
        await supabase.from('profiles').insert(insertPayload);
      } else if (pendingFaculty) {
        await supabase.from('profiles').update({ faculty: pendingFaculty }).eq('id', id);
      }
      if (pendingFaculty) {
        localStorage.removeItem(PENDING_FACULTY_KEY);
      }

      setUser({
        id,
        email,
        displayName: profile?.display_name || metaName,
        role: (profile?.role as UserRole) || 'member',
        showOnLeaderboard: Boolean(profile?.show_on_leaderboard),
        accessToken,
      });
    }

    loadSession();
    return () => {
      active = false;
    };
  }, []);

  const signInWithPassword = async (email: string, password: string, meta?: { faculty?: string }) => {
    const cleanFaculty = meta?.faculty?.trim() || '';
    if (!supabase) {
      const role: UserRole =
        email.toLowerCase().includes('miloud') || email.toLowerCase().includes('board') ? 'admin' : 'member';
      previewSignInAs(role, email, email.split('@')[0] || 'Member', cleanFaculty || undefined);
      return {};
    }
    if (cleanFaculty) {
      localStorage.setItem(PENDING_FACULTY_KEY, cleanFaculty);
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      localStorage.removeItem(PENDING_FACULTY_KEY);
      return { error: error.message };
    }
    if (cleanFaculty && data.user) {
      await supabase.from('profiles').update({ faculty: cleanFaculty }).eq('id', data.user.id);
      localStorage.removeItem(PENDING_FACULTY_KEY);
    }
    return {};
  };

  const signUpWithPassword = async (
    email: string,
    password: string,
    displayName: string,
    meta?: SignUpMeta
  ) => {
    const cleanName = displayName.trim() || `${meta?.firstName ?? ''} ${meta?.lastName ?? ''}`.trim() || email.split('@')[0];
    if (!supabase) {
      const role: UserRole =
        email.toLowerCase().includes('miloud') || email.toLowerCase().includes('board') ? 'admin' : 'member';
      previewSignInAs(role, email, cleanName, meta?.faculty?.trim() || undefined);
      if (meta && (meta.phone || meta.faculty || meta.chessElo || meta.preferredPiece)) {
        await fetch('/api/passport', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer preview:${role}:${email}`,
          },
          body: JSON.stringify({
            action: 'update_profile',
            displayName: cleanName,
            phone: meta.phone || '',
            faculty: meta.faculty?.trim() || '',
            chessElo: meta.chessElo ?? null,
            preferredPiece: meta.preferredPiece || 'p',
          }),
        }).catch(() => null);
      }
      return {};
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: cleanName,
          first_name: meta?.firstName?.trim() || undefined,
          last_name: meta?.lastName?.trim() || undefined,
          phone: meta?.phone?.trim() || undefined,
          faculty: meta?.faculty?.trim() || undefined,
          chess_elo: meta?.chessElo ?? undefined,
          preferred_piece: meta?.preferredPiece || 'p',
        },
      },
    });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        display_name: cleanName,
        phone: meta?.phone?.trim() || '',
        faculty: meta?.faculty?.trim() || '',
        chess_elo: meta?.chessElo ?? null,
        preferred_piece: meta?.preferredPiece || 'p',
        role: 'member',
      });
    }
    return {};
  };

  const signInWithGoogle = async (meta?: { faculty?: string }) => {
    const cleanFaculty = meta?.faculty?.trim() || '';
    if (!supabase) {
      return { error: 'Preview mode active: pick a student email below to test Google login.' };
    }
    if (cleanFaculty) {
      localStorage.setItem(PENDING_FACULTY_KEY, cleanFaculty);
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/my-chess-house',
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    return error ? { error: error.message } : {};
  };

  const sendMagicLink = async (email: string) => {
    if (!supabase) {
      const role: UserRole =
        email.toLowerCase().includes('miloud') || email.toLowerCase().includes('board') ? 'admin' : 'member';
      previewSignInAs(role, email, email.split('@')[0] || 'Member');
      return {};
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/my-chess-house' },
    });
    return error ? { error: error.message } : {};
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem(PREVIEW_USER_KEY);
    }
    setUser(null);
  };

  const updateLeaderboardOptIn = async (optIn: boolean) => {
    if (!user) return;
    if (supabase) {
      await supabase.from('profiles').update({ show_on_leaderboard: optIn }).eq('id', user.id);
    } else {
      const updated = { ...user, showOnLeaderboard: optIn };
      localStorage.setItem(PREVIEW_USER_KEY, JSON.stringify(updated));
    }
    setUser({ ...user, showOnLeaderboard: optIn });
  };

  const previewSignInAs = (role: UserRole, email: string, displayName: string, faculty?: string) => {
    const previewUser: AuthUser = {
      id: `preview-${email}`,
      email,
      displayName,
      role,
      showOnLeaderboard: true,
      accessToken: `preview:${role}:${email}`,
    };
    localStorage.setItem(PREVIEW_USER_KEY, JSON.stringify(previewUser));
    setUser(previewUser);
    if (faculty?.trim()) {
      fetch('/api/passport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer preview:${role}:${email}`,
        },
        body: JSON.stringify({
          action: 'update_profile',
          faculty: faculty.trim(),
        }),
      }).catch(() => null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSupabaseReady: isSupabaseConfigured,
        signInWithPassword,
        signUpWithPassword,
        signInWithGoogle,
        sendMagicLink,
        signOut,
        updateLeaderboardOptIn,
        previewSignInAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
