import { createContext, useContext, useState } from 'react';

export type ProjectRole = 'designer' | 'client';

interface ProjectRoleContextValue {
  role: ProjectRole;
  setRole: (r: ProjectRole) => void;
}

const ProjectRoleContext = createContext<ProjectRoleContextValue>({
  role: 'designer',
  setRole: () => {},
});

export function ProjectRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<ProjectRole>('designer');
  return (
    <ProjectRoleContext.Provider value={{ role, setRole }}>
      {children}
    </ProjectRoleContext.Provider>
  );
}

export function useProjectRole(): ProjectRoleContextValue {
  return useContext(ProjectRoleContext);
}
