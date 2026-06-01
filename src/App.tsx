import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ProjectRoleProvider } from './lib/projectRole';

export function App() {
  return (
    <ProjectRoleProvider>
      <RouterProvider router={router} />
    </ProjectRoleProvider>
  );
}
