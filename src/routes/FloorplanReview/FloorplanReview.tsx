import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, MessageCircle, CheckCircle2, Clock, Send } from 'lucide-react';
import { projectRepository } from '../../data';
import type { Comment, Floorplan, Project } from '../../types';
import { AppNav } from '../../components/AppNav';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function FloorplanReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading');
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setState('loading');
    projectRepository
      .getProject(id)
      .then((proj) => {
        if (!active) return;
        if (!proj) setState('notfound');
        else {
          setProject(proj);
          setState('ready');
        }
      })
      .catch(() => active && setState('error'));
    return () => {
      active = false;
    };
  }, [id]);

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!project || draft.trim() === '') return;
    setActionError(null);
    setPosting(true);
    try {
      await projectRepository.postComment({
        projectId: project.id,
        author: 'You',
        role: 'designer',
        body: draft.trim(),
      });
      const refreshed = await projectRepository.getProject(project.id);
      if (refreshed) setProject(refreshed);
      setDraft('');
    } catch {
      setActionError('Your comment couldn’t be posted. Please try again.');
    } finally {
      setPosting(false);
    }
  }

  async function approve() {
    if (!project) return;
    setActionError(null);
    setApproving(true);
    try {
      await projectRepository.approveCurrentFloorplan(project.id);
      navigate(`/project/${project.id}`);
    } catch {
      setActionError('We couldn’t approve this floorplan. Please try again.');
      setApproving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f6f3] to-[#ebe9e3]">
      <AppNav />

      <main className="px-8 pb-8 pt-24 max-w-7xl mx-auto">
        <Link
          to={id ? `/project/${id}` : '/'}
          className="inline-flex items-center gap-2 text-[#6b6560] hover:text-[#1c1a17] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">Back to project</span>
        </Link>

        {state === 'loading' && <p className="text-[#6b6560]">Loading floorplan…</p>}
        {state === 'error' && (
          <p role="alert" className="text-[#b4231d] font-medium">
            We couldn’t load this review. Please try again.
          </p>
        )}
        {state === 'notfound' && (
          <p className="text-[#6b6560]">
            Project not found. <Link to="/" className="text-[#2f6f4f] underline">Back to projects</Link>.
          </p>
        )}

        {state === 'ready' && project && (
          <ReviewBody
            project={project}
            draft={draft}
            setDraft={setDraft}
            posting={posting}
            approving={approving}
            actionError={actionError}
            onPost={postComment}
            onApprove={approve}
          />
        )}
      </main>
    </div>
  );
}

interface ReviewBodyProps {
  project: Project;
  draft: string;
  setDraft: (v: string) => void;
  posting: boolean;
  approving: boolean;
  actionError: string | null;
  onPost: (e: React.FormEvent) => void;
  onApprove: () => void;
}

function ReviewBody({
  project,
  draft,
  setDraft,
  posting,
  approving,
  actionError,
  onPost,
  onApprove,
}: ReviewBodyProps) {
  const versionsDesc = [...project.floorplans].sort((a, b) => b.version - a.version);
  const current = versionsDesc.find((f) => f.status === 'current') ?? versionsDesc[0] ?? null;
  const isApproved = project.status === 'approved';

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#1c1a17] mb-2">Floorplan Review</h1>
          <p className="text-[#6b6560] text-lg">{project.clientName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Current floorplan */}
          <section className="bg-white rounded-3xl border border-[#e3e0da] p-8 shadow-lg" aria-label="Current floorplan">
            {current ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#1c1a17]">Floorplan v{current.version}</h2>
                    <p className="text-sm text-[#6b6560] mt-1">
                      Uploaded by {current.uploadedBy} · {formatDate(current.uploadedAt)}
                    </p>
                  </div>
                  <span className="bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Latest
                  </span>
                </div>
                <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#f7f6f3] to-[#e3e0da] aspect-video flex items-center justify-center shadow-inner">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-white/50 backdrop-blur-sm rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#6b6560]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-[#6b6560] font-medium">Floorplan v{current.version} — {current.label}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-[#6b6560]">No floorplan has been uploaded for this project yet.</p>
            )}
          </section>

          {/* Comments */}
          <section className="bg-white rounded-3xl border border-[#e3e0da] p-8 shadow-lg" aria-label="Comments">
            <div className="flex items-center gap-3 mb-6">
              <MessageCircle className="w-6 h-6 text-[#2f6f4f]" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-[#1c1a17]">Comments</h2>
            </div>

            {project.comments.length === 0 ? (
              <p className="text-[#6b6560] mb-6">No comments yet. Start the conversation below.</p>
            ) : (
              <ul className="space-y-6 mb-6 list-none p-0 m-0">
                {project.comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
              </ul>
            )}

            <form onSubmit={onPost} className="border-t border-[#e3e0da] pt-6">
              <label htmlFor="comment" className="block text-sm font-semibold text-[#1c1a17] mb-3">
                Add a comment
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="comment"
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a comment…"
                  className="flex-1 px-4 py-3 bg-white border-2 border-[#e3e0da] rounded-xl focus:outline-none focus:border-[#2f6f4f] transition-colors"
                />
                <button
                  type="submit"
                  disabled={posting || draft.trim() === ''}
                  className="px-6 py-3 bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  {posting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </form>
          </section>

          {/* Approve */}
          <section className="bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] rounded-3xl p-8 text-white shadow-xl" aria-label="Approval">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {isApproved ? 'Floorplan approved' : 'Ready to approve?'}
                </h2>
                <p className="text-white/80 mb-6">
                  {isApproved
                    ? `v${current?.version ?? ''} is locked as the approved floorplan.`
                    : `Locks v${current?.version ?? ''} as approved and notifies the firm.`}
                </p>
                {!isApproved && (
                  <button
                    type="button"
                    onClick={onApprove}
                    disabled={approving || !current}
                    className="px-8 py-4 bg-white text-[#2f6f4f] rounded-xl hover:bg-white/90 transition-all font-bold flex items-center gap-2 disabled:opacity-60"
                  >
                    <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                    {approving ? 'Approving…' : 'Approve floorplan'}
                  </button>
                )}
                {actionError && (
                  <p role="alert" className="mt-3 text-white font-medium">
                    {actionError}
                  </p>
                )}
              </div>
              <span aria-hidden="true" className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </span>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6" aria-label="Version history">
          <div className="bg-white rounded-3xl border border-[#e3e0da] p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-5 h-5 text-[#2f6f4f]" aria-hidden="true" />
              <h2 className="font-bold text-[#1c1a17]">Version history</h2>
            </div>
            {versionsDesc.length === 0 ? (
              <p className="text-sm text-[#6b6560]">No versions yet.</p>
            ) : (
              <ol className="space-y-3 list-none p-0 m-0">
                {versionsDesc.map((fp) => (
                  <VersionItem key={fp.id} floorplan={fp} />
                ))}
              </ol>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  const isClient = comment.role === 'client';
  const avatar = isClient
    ? 'bg-gradient-to-br from-[#e7eefb] to-[#d1dff4] text-[#2563eb]'
    : 'bg-gradient-to-br from-[#e7f0eb] to-[#d1e4db] text-[#2f6f4f]';
  return (
    <li className="flex gap-4">
      <span aria-hidden="true" className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${avatar}`}>
        {comment.author[0]?.toUpperCase()}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-[#1c1a17]">{comment.author}</span>
          <span className="text-xs text-[#6b6560]">({isClient ? 'client' : 'designer'})</span>
          <span className="text-xs text-[#6b6560]">{formatDate(comment.createdAt)}</span>
        </div>
        <p className="text-[#1c1a17] bg-[#f7f6f3] p-4 rounded-xl">{comment.body}</p>
      </div>
    </li>
  );
}

function VersionItem({ floorplan }: { floorplan: Floorplan }) {
  const isCurrent = floorplan.status === 'current';
  return (
    <li
      className={
        isCurrent
          ? 'p-4 bg-gradient-to-r from-[#e7f0eb] to-[#d1e4db] rounded-xl border-2 border-[#2f6f4f]'
          : 'p-4 bg-[#f7f6f3] rounded-xl'
      }
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-[#1c1a17]">Version {floorplan.version}</span>
        {isCurrent && <span className="text-xs font-semibold text-[#2f6f4f]">Current</span>}
      </div>
      <p className="text-xs text-[#6b6560]">
        {floorplan.uploadedBy} · {formatDate(floorplan.uploadedAt)}
      </p>
    </li>
  );
}
