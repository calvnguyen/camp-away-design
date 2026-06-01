'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from './client';

export type UserRole = 'client' | 'designer' | 'admin';

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

async function fetchRole(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<UserRole> {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
  return (data?.role as UserRole) ?? 'client';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        setRole(await fetchRole(supabase, data.user.id));
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (event === 'SIGNED_IN' && nextUser) {
        setRole(await fetchRole(supabase, nextUser.id));
      } else if (event === 'SIGNED_OUT') {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUser(): AuthContextValue {
  return useContext(AuthContext);
}
