import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { projectRepository } from '../../data';
import type { Firm, Project, StandardBuild } from '../../types';
import { AppNav } from '../../components/AppNav';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { ConceptLayoutSection } from '../../components/ConceptLayoutSection';
import { PROJECT_STATUS_BADGE, briefSummary, formatUsd } from '../../lib/projectStatus';

const STATUS_PROGRESS: Record<Project['status'], number> = {
  draft: 15,
  submitted: 35,
  in_review: 65,
  approved: 100,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function initials(name: string): string {
  return name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function ProjectView() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [firm, setFirm] = useState<Firm | null>(null);
  const [equivalentBuild, setEquivalentBuild] = useState<StandardBuild | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading');

  const load = useCallback(
    async (showLoading: boolean) => {
      if (!id) return;
      if (showLoading) setState('loading');
      try {
        const proj = await projectRepository.getProject(id);
        if (!proj) {
          setState('notfound');
          return;
        }
        const [firms, build] = await Promise.all([
          projectRepository.listFirms(),
          projectRepository.findEquivalentBuild(id),
        ]);
        setProject(proj);
        setFirm(firms.find((f) => f.id === proj.firmId) ?? null);
        setEquivalentBuild(build);
        setState('ready');
      } catch {
        setState('error');
      }
    },
    [id],
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f6f3] to-[#ebe9e3]">
      <AppNav />

      <main className="p-8 max-w-6xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#6b6560] hover:text-[#1c1a17] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">Back to Projects</span>
        </Link>

        {state === 'loading' && <p className="text-[#6b6560]">Loading project…</p>}
        {state === 'error' && (
          <p role="alert" className="text-[#b4231d] font-medium">
            We couldn’t load this project. Please try again.
          </p>
        )}
        {state === 'notfound' && (
          <div>
            <h1 className="text-3xl font-bold text-[#1c1a17] mb-2">Project not found</h1>
            <p className="text-[#6b6560]">
              The project you’re looking for doesn’t exist. <Link to="/" className="text-[#2f6f4f] underline">Back to projects</Link>.
            </p>
          </div>
        )}

        {state === 'ready' && project && (
          <ProjectBody
            project={project}
            firm={firm}
            equivalentBuild={equivalentBuild}
            onReload={() => load(false)}
          />
        )}
      </main>
    </div>
  );
}

interface ProjectBodyProps {
  project: Project;
  firm: Firm | null;
  equivalentBuild: StandardBuild | null;
  onReload: () => Promise<void>;
}

function ProjectBody({ project, firm, equivalentBuild, onReload }: ProjectBodyProps) {
  const badge = PROJECT_STATUS_BADGE[project.status];
  const [hero, ...thumbs] = project.galleryUrls;
  const hasFloorplan = project.floorplans.length > 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-[#1c1a17]">{project.clientName}</h1>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide ${badge.className}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-[#6b6560] text-lg">{briefSummary(project.brief)}</p>
        </div>
      </div>

      {/* Gallery */}
      {hero && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 rounded-2xl overflow-hidden shadow-lg h-[400px]">
            <ImageWithFallback
              src={hero}
              alt={`${project.clientName} trailer concept`}
              className="w-full h-full object-cover"
            />
          </div>
          {thumbs.length > 0 && (
            <div className="flex flex-col gap-4">
              {thumbs.slice(0, 2).map((url, i) => (
                <div key={url} className="rounded-2xl overflow-hidden shadow-lg h-[192px]">
                  <ImageWithFallback
                    src={url}
                    alt={`${project.clientName} detail ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Brief + concept layout */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#e3e0da] p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-[#1c1a17] mb-6">Project Brief</h2>
            <dl className="divide-y divide-[#f7f6f3]">
              <BriefRow label="Trailer length" value={`${project.brief.trailerLengthFt} ft`} />
              <BriefRow label="Sleeping capacity" value={`${project.brief.sleeps} adults`} />
              <BriefRow label="Wet bath" value={project.brief.hasWetBath ? 'Included' : 'Not requested'} included={project.brief.hasWetBath} />
              <BriefRow label="Kitchenette" value={project.brief.hasKitchenette ? 'Included' : 'Not requested'} included={project.brief.hasKitchenette} />
              <BriefRow label="Solar upgrade" value={project.brief.solar ? 'Requested' : 'Not requested'} included={project.brief.solar} />
              <BriefRow label="Battery upgrade" value={project.brief.battery ? 'Requested' : 'Not requested'} included={project.brief.battery} />
              <div className="flex items-center justify-between py-3">
                <dt className="text-[#6b6560]">Budget</dt>
                <dd className="font-bold text-[#2f6f4f] text-lg">{formatUsd(project.brief.budgetUsd)}</dd>
              </div>
            </dl>

            {project.brief.notes && (
              <div className="mt-6 pt-6 border-t border-[#e3e0da]">
                <p className="text-sm font-semibold text-[#6b6560] mb-2">Client notes</p>
                <p className="text-[#1c1a17] leading-relaxed">{project.brief.notes}</p>
              </div>
            )}
          </div>

          <ConceptLayoutSection
            equivalentBuild={equivalentBuild}
            layout={project.conceptLayout}
            onGenerate={async () => {
              await projectRepository.generateConceptLayout(project.id);
              await onReload();
            }}
            onApprove={async () => {
              await projectRepository.approveConceptLayout(project.id);
              await onReload();
            }}
            onReject={async () => {
              await projectRepository.rejectConceptLayout(project.id);
              await onReload();
            }}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-6" aria-label="Project details">
          <div className="bg-gradient-to-br from-[#2f6f4f] to-[#25533d] rounded-2xl p-6 shadow-lg text-white">
            <h2 className="font-bold text-lg mb-4">Quick actions</h2>
            {hasFloorplan ? (
              <Link
                to={`/review/${project.id}`}
                className="block w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-3 rounded-lg transition-colors font-medium"
              >
                View floorplan
              </Link>
            ) : (
              <p className="text-white/80 text-sm">No floorplan uploaded yet.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#e3e0da] p-6 shadow-sm">
            <h2 className="font-bold text-[#1c1a17] mb-4">Timeline</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#6b6560]">Started</dt>
                <dd className="font-medium text-[#1c1a17]">{formatDate(project.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#6b6560]">Last update</dt>
                <dd className="font-medium text-[#1c1a17]">{formatDate(project.updatedAt)}</dd>
              </div>
            </dl>
            <div className="mt-4 pt-4 border-t border-[#e3e0da]">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#6b6560]">Progress</span>
                <span className="font-semibold text-[#1c1a17]">{STATUS_PROGRESS[project.status]}%</span>
              </div>
              <div
                className="h-2 bg-[#f7f6f3] rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={STATUS_PROGRESS[project.status]}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Project progress"
              >
                <div
                  className="h-full bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] rounded-full"
                  style={{ width: `${STATUS_PROGRESS[project.status]}%` }}
                />
              </div>
            </div>
          </div>

          {firm && (
            <div className="bg-white rounded-2xl border border-[#e3e0da] p-6 shadow-sm">
              <h2 className="font-bold text-[#1c1a17] mb-4">Assigned firm</h2>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="w-12 h-12 bg-gradient-to-br from-[#2f6f4f] to-[#3d8a64] rounded-full flex items-center justify-center text-white font-bold"
                >
                  {initials(firm.name)}
                </span>
                <div>
                  <p className="font-semibold text-[#1c1a17]">{firm.name}</p>
                  <p className="text-sm text-[#6b6560]">{firm.activeProjects} active projects</p>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function BriefRow({ label, value, included }: { label: string; value: string; included?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-[#6b6560]">{label}</dt>
      <dd className="inline-flex items-center gap-2">
        {included !== undefined && (
          <span
            aria-hidden="true"
            className={`w-2 h-2 rounded-full ${included ? 'bg-[#2f6f4f]' : 'bg-[#cbced4]'}`}
          />
        )}
        <span className={`font-semibold ${included === false ? 'text-[#6b6560]' : 'text-[#1c1a17]'}`}>{value}</span>
      </dd>
    </div>
  );
}
