'use client';

import { AuthProvider } from '@/lib/supabase/auth-context';
import { ProjectRoleProvider } from '@/lib/projectRole';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProjectRoleProvider>{children}</ProjectRoleProvider>
    </AuthProvider>
  );
}
