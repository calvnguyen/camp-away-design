import { createBrowserRouter } from 'react-router';
import { ProjectList } from './routes/ProjectList/ProjectList';
import { RequirementForm } from './routes/RequirementForm/RequirementForm';
import { ProjectView } from './routes/ProjectView/ProjectView';
import { FloorplanReview } from './routes/FloorplanReview/FloorplanReview';
import { AdminDashboard } from './routes/AdminDashboard/AdminDashboard';
import { LogoShowcase } from './routes/LogoShowcase/LogoShowcase';

export const router = createBrowserRouter([
  { path: '/', Component: ProjectList },
  { path: '/new', Component: RequirementForm },
  { path: '/project/:id', Component: ProjectView },
  { path: '/review/:id', Component: FloorplanReview },
  { path: '/dashboard', Component: AdminDashboard },
  { path: '/logo', Component: LogoShowcase },
]);
