import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { getProfile, getRoles, logAudit } from "@/services/hqmlService";
import { ROLE_RANK, type AppRole, type Profile } from "@/types/hqml";

interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  role: AppRole;
  hasAtLeast: (role: AppRole) => boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);

  const load = useCallback(async (uid: string | undefined) => {
    if (!uid) {
      setProfile(null);
      setRoles([]);
      return;
    }
    const [p, r] = await Promise.all([getProfile(uid).catch(() => null), getRoles(uid).catch(() => [])]);
    setProfile(p);
    setRoles(r);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      void load(next?.user?.id);
    });
    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await load(data.session?.user?.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const role: AppRole = useMemo(() => {
    if (roles.length === 0) return "researcher";
    return roles.reduce<AppRole>((best, r) => (ROLE_RANK[r] > ROLE_RANK[best] ? r : best), roles[0]);
  }, [roles]);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      roles,
      role,
      hasAtLeast: (needed) => ROLE_RANK[role] >= ROLE_RANK[needed],
      refresh: () => load(session?.user?.id),
      signOut: async () => {
        await logAudit("auth.logout");
        await supabase.auth.signOut();
      },
    }),
    [loading, session, profile, roles, role, load],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
