import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Plus, Search, TrendingUp, Clock, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { projectRepository } from '../../data';
import type { Project } from '../../types';
import { AppNav } from '../../components/AppNav';
import { Logo } from '../../components/Logo';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { PROJECT_STATUS_BADGE, briefSummary } from '../../lib/projectStatus';

/** Short description of how many floorplans a project has, for the card footer. */
function versionsLabel(project: Project): string {
  if (project.status === 'approved') return 'Approved';
  if (project.floorplans.length > 0) {
    const n = project.floorplans.length;
    return `${n} floorplan version${n === 1 ? '' : 's'}`;
  }
  return project.status === 'draft' ? 'Draft' : 'Awaiting first floorplan';
}

function matchesQuery(project: Project, q: string): boolean {
  if (!q) return true;
  const haystack = [
    project.clientName,
    PROJECT_STATUS_BADGE[project.status].label,
    String(project.brief.budgetUsd),
    `${project.brief.trailerLengthFt} ft`,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}

export function ProjectList() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    projectRepository
      .listProjects()
      .then((all) => active && setProjects(all))
      .catch(() => active && setError('We couldn’t load projects. Please try again.'));
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const list = projects ?? [];
    return {
      total: list.length,
      inProgress: list.filter((p) => p.status === 'submitted' || p.status === 'in_review').length,
      completed: list.filter((p) => p.status === 'approved').length,
    };
  }, [projects]);

  const filtered = useMemo(
    () => (projects ?? []).filter((p) => matchesQuery(p, query)),
    [projects, query],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f6f3] to-[#ebe9e3]">
      <AppNav />

      <main className="px-8 pb-8 pt-24 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="mb-10">
          {/* The Logo's wordmark is the page's h1 (its SVG is decorative). */}
          <h1 className="mb-4">
            <Logo size="lg" />
          </h1>
          <p className="text-[#6b6560] text-lg max-w-2xl">
            Affordable, SUV-towable tiny homes — from brief to approved floorplan.
          </p>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatTile
            icon={<TrendingUp className="w-6 h-6 text-[#2f6f4f]" aria-hidden="true" />}
            iconBg="from-[#e7f0eb] to-[#d1e4db]"
            value={stats.total}
            label="Total Projects"
          />
          <StatTile
            icon={<Clock className="w-6 h-6 text-[#b45309]" aria-hidden="true" />}
            iconBg="from-[#fbf0e2] to-[#f4dfc7]"
            value={stats.inProgress}
            label="In Progress"
          />
          <StatTile
            icon={<CheckCircle2 className="w-6 h-6 text-[#2563eb]" aria-hidden="true" />}
            iconBg="from-[#e7eefb] to-[#d1dff4]"
            value={stats.completed}
            label="Completed"
          />
          <Link
            to="/new"
            className="bg-gradient-to-br from-[#2f6f4f] to-[#25533d] rounded-2xl p-6 shadow-lg text-white hover:shadow-xl transition-shadow block"
          >
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div className="text-xl font-bold mb-1">Start New</div>
            <div className="text-sm text-white/80">Create project brief</div>
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-[#e3e0da] p-4 mb-8 shadow-sm">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-[#6b6560]" aria-hidden="true" />
            <label htmlFor="project-search" className="sr-only">
              Search projects
            </label>
            <input
              id="project-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects by client name, status, or budget…"
              className="flex-1 bg-transparent outline-none text-[#1c1a17] placeholder:text-[#6b6560]"
            />
          </div>
        </div>

        {/* Project grid */}
        {error ? (
          <p role="alert" className="text-[#b4231d] font-medium">
            {error}
          </p>
        ) : projects === null ? (
          <p className="text-[#6b6560]">Loading projects…</p>
        ) : filtered.length === 0 ? (
          <p className="text-[#6b6560]">
            {projects.length === 0
              ? 'No projects yet. Start a new brief to get going.'
              : `No projects match “${query}”.`}
          </p>
        ) : (
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-6 list-none p-0 m-0">
            {filtered.map((project) => {
              const badge = PROJECT_STATUS_BADGE[project.status];
              return (
                <li key={project.id}>
                  <Link
                    to={`/project/${project.id}`}
                    className="group bg-white rounded-2xl border border-[#e3e0da] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 block"
                  >
                    <div className="relative h-48 bg-gradient-to-br from-[#f7f6f3] to-[#e3e0da] overflow-hidden">
                      <ImageWithFallback
                        src={project.thumbnailUrl}
                        alt={`${project.clientName} project cover`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span
                        className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="p-6">
                      <h2 className="text-xl font-bold text-[#1c1a17] mb-2 group-hover:text-[#2f6f4f] transition-colors">
                        {project.clientName}
                      </h2>
                      <p className="text-[#6b6560] mb-3">{briefSummary(project.brief)}</p>
                      <div className="flex items-center gap-2 text-sm text-[#6b6560]">
                        <ImageIcon className="w-4 h-4" aria-hidden="true" />
                        <span>{versionsLabel(project)}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

interface StatTileProps {
  icon: ReactNode;
  iconBg: string;
  value: number;
  label: string;
}

function StatTile({ icon, iconBg, value, label }: StatTileProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e3e0da] p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 bg-gradient-to-br ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-[#1c1a17] mb-1">{value}</div>
      <div className="text-sm text-[#6b6560]">{label}</div>
    </div>
  );
}
