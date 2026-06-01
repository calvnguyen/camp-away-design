'use client';

import { ProjectRoleProvider } from '@/lib/projectRole';

export function Providers({ children }: { children: React.ReactNode }) {
  return <ProjectRoleProvider>{children}</ProjectRoleProvider>;
}
