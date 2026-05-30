import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { TrendingUp, Users, Clock, Target, BarChart3, Activity } from 'lucide-react';
import { projectRepository } from '../../data';
import type { DashboardStats, Firm, Project } from '../../types';
import { AppNav } from '../../components/AppNav';
import { PROJECT_STATUS_BADGE } from '../../lib/projectStatus';

function currentVersionLabel(project: Project): string {
  const current = project.floorplans.find((f) => f.status === 'current');
  return current ? `v${current.version}` : '—';
}

export function AdminDashboard() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [p, f, s] = await Promise.all([
        projectRepository.listProjects(),
        projectRepository.listFirms(),
        projectRepository.getDashboardStats(),
      ]);
      setProjects(p);
      setFirms(f);
      setStats(s);
    } catch {
      setError('We couldn’t load the dashboard. Please try again.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const maxActive = useMemo(
    () => firms.reduce((max, f) => Math.max(max, f.activeProjects), 1),
    [firms],
  );

  async function assignFirm(projectId: string, firmId: string) {
    await projectRepository.assignFirm(projectId, firmId);
    await load();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f6f3] to-[#ebe9e3]">
      <AppNav />

      <main className="p-8 max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-5xl font-bold text-[#1c1a17] mb-3 tracking-tight">Admin Dashboard</h1>
          <p className="text-[#6b6560] text-lg">All projects, firms, and platform metrics.</p>
        </div>

        {error && (
          <p role="alert" className="text-[#b4231d] font-medium mb-6">
            {error}
          </p>
        )}

        {/* Metrics */}
        <section className="mb-10" aria-label="Platform metrics">
          <h2 className="text-2xl font-bold text-[#1c1a17] mb-6">Platform Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Metric
              icon={<Target className="w-6 h-6 text-[#2f6f4f]" aria-hidden="true" />}
              iconBg="from-[#e7f0eb] to-[#d1e4db]"
              value={stats ? `${Math.round(stats.reachedApprovalRate * 100)}%` : '—'}
              label="Reached approval"
            />
            <Metric
              icon={<Activity className="w-6 h-6 text-[#2563eb]" aria-hidden="true" />}
              iconBg="from-[#e7eefb] to-[#d1dff4]"
              value={stats ? stats.avgRevisionRounds.toFixed(1) : '—'}
              label="Avg revision rounds"
            />
            <Metric
              icon={<Clock className="w-6 h-6 text-[#b45309]" aria-hidden="true" />}
              iconBg="from-[#fbf0e2] to-[#f4dfc7]"
              value={stats ? stats.avgDaysToFirstPlan.toFixed(1) : '—'}
              label="Days to 1st plan"
            />
            <Metric
              icon={<Users className="w-6 h-6 text-[#be185d]" aria-hidden="true" />}
              iconBg="from-[#fce7f3] to-[#f3d4e5]"
              value={stats ? String(stats.activeFirms) : '—'}
              label="Active firms"
            />
            <div className="bg-gradient-to-br from-[#2f6f4f] to-[#25533d] rounded-2xl p-6 shadow-lg text-white">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats ? stats.activeProjects : '—'}</div>
              <div className="text-sm text-white/80">Active projects</div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects table */}
          <section className="lg:col-span-2" aria-label="All projects">
            <div className="bg-white rounded-3xl border border-[#e3e0da] p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6 text-[#2f6f4f]" aria-hidden="true" />
                <h2 className="text-2xl font-bold text-[#1c1a17]">All Projects</h2>
              </div>

              {projects === null ? (
                <p className="text-[#6b6560]">Loading projects…</p>
              ) : projects.length === 0 ? (
                <p className="text-[#6b6560]">No projects yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-[#e3e0da] text-left">
                        <th scope="col" className="py-3 pr-4 text-xs font-semibold text-[#6b6560] tracking-wide">CLIENT</th>
                        <th scope="col" className="py-3 pr-4 text-xs font-semibold text-[#6b6560] tracking-wide">FIRM</th>
                        <th scope="col" className="py-3 pr-4 text-xs font-semibold text-[#6b6560] tracking-wide">STATUS</th>
                        <th scope="col" className="py-3 text-xs font-semibold text-[#6b6560] tracking-wide">VER</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project) => {
                        const badge = PROJECT_STATUS_BADGE[project.status];
                        const firm = firms.find((f) => f.id === project.firmId);
                        return (
                          <tr key={project.id} className="border-b border-[#f7f6f3] last:border-0">
                            <th scope="row" className="py-4 pr-4 font-semibold text-[#1c1a17] text-left">
                              <Link to={`/project/${project.id}`} className="hover:text-[#2f6f4f] transition-colors">
                                {project.clientName}
                              </Link>
                            </th>
                            <td className="py-4 pr-4 text-[#6b6560]">
                              {firm ? (
                                firm.name
                              ) : (
                                <AssignFirm
                                  projectId={project.id}
                                  firms={firms}
                                  onAssign={assignFirm}
                                />
                              )}
                            </td>
                            <td className="py-4 pr-4">
                              <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide ${badge.className}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="py-4 text-[#6b6560]">{currentVersionLabel(project)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Firms */}
          <section aria-label="Firms">
            <div className="bg-white rounded-3xl border border-[#e3e0da] p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-[#2f6f4f]" aria-hidden="true" />
                <h2 className="text-2xl font-bold text-[#1c1a17]">Firms</h2>
              </div>
              <ul className="space-y-4 list-none p-0 m-0">
                {firms.map((firm) => (
                  <li key={firm.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-[#1c1a17] text-sm">{firm.name}</span>
                      <span className="text-xs text-[#6b6560]">{firm.activeProjects} active</span>
                    </div>
                    <div
                      className="h-2 bg-[#f7f6f3] rounded-full overflow-hidden"
                      role="img"
                      aria-label={`${firm.name}: ${firm.activeProjects} active projects`}
                    >
                      <div
                        className="h-full bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] rounded-full"
                        style={{ width: `${Math.round((firm.activeProjects / maxActive) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

interface MetricProps {
  icon: ReactNode;
  iconBg: string;
  value: string;
  label: string;
}

function Metric({ icon, iconBg, value, label }: MetricProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e3e0da] p-6 shadow-sm hover:shadow-lg transition-all">
      <div className={`w-12 h-12 bg-gradient-to-br ${iconBg} rounded-xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-[#1c1a17] mb-1">{value}</div>
      <div className="text-sm text-[#6b6560]">{label}</div>
    </div>
  );
}

interface AssignFirmProps {
  projectId: string;
  firms: Firm[];
  onAssign: (projectId: string, firmId: string) => void;
}

function AssignFirm({ projectId, firms, onAssign }: AssignFirmProps) {
  const selectId = `assign-firm-${projectId}`;
  return (
    <div>
      <label htmlFor={selectId} className="sr-only">
        Assign a firm to this project
      </label>
      <select
        id={selectId}
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) onAssign(projectId, e.target.value);
        }}
        className="text-sm px-3 py-1.5 border-2 border-[#e3e0da] rounded-lg bg-white hover:bg-[#f7f6f3] transition-colors font-medium focus:outline-none focus:border-[#2f6f4f]"
      >
        <option value="" disabled>
          Assign firm…
        </option>
        {firms.map((firm) => (
          <option key={firm.id} value={firm.id}>
            {firm.name}
          </option>
        ))}
      </select>
    </div>
  );
}
