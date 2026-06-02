'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, BarChart3, Caravan, LogOut } from 'lucide-react';
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
  const pathname = usePathname();
  function handleSignOut() {
    window.location.href = '/auth/signout';
  }

  const dashboardActive = pathname.startsWith('/dashboard');
  const trailersActive = pathname.startsWith('/trailers') || pathname.startsWith('/book');
  const projectsActive = !dashboardActive && !trailersActive;

  const linkClass = (active: boolean) =>
    [
      'flex items-center gap-2 px-3 py-2.5 sm:px-4 rounded-xl text-sm font-semibold transition-all',
      active
        ? 'bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] text-white shadow-md'
        : 'text-[#6b6560] hover:bg-[#f7f6f3]',
    ].join(' ');

  return (
    <div className="fixed top-4 sm:top-6 left-3 sm:left-6 right-3 sm:right-6 z-50 flex items-center justify-between gap-2">
      <Link
        href="/"
        className="bg-white rounded-2xl border border-[#e3e0da] p-3 shadow-lg hover:shadow-xl transition-shadow flex-shrink-0"
      >
        <Logo variant="mark" size="sm" />
      </Link>

      <nav
        aria-label="Primary"
        className="flex gap-1 sm:gap-2 bg-white rounded-2xl border border-[#e3e0da] p-2 shadow-lg"
      >
        <Link
          href="/"
          aria-current={projectsActive ? 'page' : undefined}
          className={linkClass(projectsActive)}
          aria-label="Projects"
        >
          <LayoutGrid className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Projects</span>
        </Link>
        <Link
          href="/trailers"
          aria-current={trailersActive ? 'page' : undefined}
          className={linkClass(trailersActive)}
          aria-label="Rentals"
        >
          <Caravan className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Rentals</span>
        </Link>
        <Link
          href="/dashboard"
          aria-current={dashboardActive ? 'page' : undefined}
          className={linkClass(dashboardActive)}
          aria-label="Dashboard"
        >
          <BarChart3 className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
      </nav>

      <button
        type="button"
        onClick={handleSignOut}
        aria-label="Sign out"
        className="flex items-center gap-2 bg-white rounded-2xl border border-[#e3e0da] px-3 sm:px-4 py-3 shadow-lg hover:shadow-xl transition-shadow text-[#6b6560] hover:text-[#1c1a17] focus:outline-none focus:ring-2 focus:ring-[#2f6f4f] flex-shrink-0"
      >
        <LogOut className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline text-sm font-medium">Sign out</span>
      </button>
    </div>
  );
}
