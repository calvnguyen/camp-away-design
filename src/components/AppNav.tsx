import { Link, useLocation } from 'react-router';
import { LayoutGrid, BarChart3 } from 'lucide-react';
import { Logo } from './Logo';

/**
 * Floating primary navigation: the brand logo (left) and two destinations —
 * the client-facing project workspace ("Projects") and the ops "Dashboard"
 * (right). Layout mirrors the Figma Make redesign's AppNav.
 *
 * Accessibility: a real <nav> with an accessible name; the active link carries
 * aria-current="page" so the current section is announced, not just colour-coded.
 */
export function AppNav() {
  const { pathname } = useLocation();

  const dashboardActive = pathname.startsWith('/dashboard');
  // Everything that isn't the dashboard lives under the projects workspace.
  const projectsActive = !dashboardActive;

  const linkClass = (active: boolean) =>
    [
      'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
      active
        ? 'bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] text-white shadow-md'
        : 'text-[#6b6560] hover:bg-[#f7f6f3]',
    ].join(' ');

  return (
    <div className="fixed top-6 left-6 right-6 z-50 flex items-center justify-between">
      <Link
        to="/"
        className="bg-white rounded-2xl border border-[#e3e0da] p-3 shadow-lg hover:shadow-xl transition-shadow"
      >
        <Logo variant="mark" size="sm" />
      </Link>

      <nav
        aria-label="Primary"
        className="flex gap-2 bg-white rounded-2xl border border-[#e3e0da] p-2 shadow-lg"
      >
        <Link
          to="/"
          aria-current={projectsActive ? 'page' : undefined}
          className={linkClass(projectsActive)}
        >
          <LayoutGrid className="w-4 h-4" aria-hidden="true" />
          Projects
        </Link>
        <Link
          to="/dashboard"
          aria-current={dashboardActive ? 'page' : undefined}
          className={linkClass(dashboardActive)}
        >
          <BarChart3 className="w-4 h-4" aria-hidden="true" />
          Dashboard
        </Link>
      </nav>
    </div>
  );
}
