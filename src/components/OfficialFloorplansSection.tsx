import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  FolderOpen,
  MessageCircle,
  RotateCcw,
  Send,
} from 'lucide-react';
import type { Comment, Floorplan, Project } from '../types';
import { projectRepository } from '../data';
import { FloorplanUpload } from './FloorplanUpload';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface OfficialFloorplansSectionProps {
  project: Project;
  role: 'designer' | 'client';
  onProjectChange: (updated: Project) => void;
}

export function OfficialFloorplansSection({
  project,
  role,
  onProjectChange,
}: OfficialFloorplansSectionProps) {
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const versionsDesc = [...project.floorplans].sort((a, b) => b.version - a.version);
  const current = versionsDesc.find((f) => f.status === 'current') ?? versionsDesc[0] ?? null;
  const isApproved = project.status === 'approved';
  const isRevisionRequested = project.status === 'revision_requested';

  async function handleUpload(file: File, label: string, revisionNote?: string) {
    const updated = await projectRepository.uploadFloorplan(
      project.id,
      file,
      'designer',
      label,
      revisionNote,
    );
    onProjectChange(updated);
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (draft.trim() === '') return;
    setActionError(null);
    setPosting(true);
    try {
      await projectRepository.postComment({
        projectId: project.id,
        author: role === 'designer' ? 'Designer' : 'Client',
        role,
        body: draft.trim(),
      });
      const refreshed = await projectRepository.getProject(project.id);
      if (refreshed) onProjectChange(refreshed);
      setDraft('');
    } catch {
      setActionError("Your comment couldn't be posted. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  async function approve() {
    setActionError(null);
    setApproving(true);
    try {
      const updated = await projectRepository.approveCurrentFloorplan(project.id);
      onProjectChange(updated);
    } catch {
      setActionError("We couldn't approve this floorplan. Please try again.");
    } finally {
      setApproving(false);
    }
  }

  async function requestRevision() {
    setActionError(null);
    setRequesting(true);
    try {
      const updated = await projectRepository.requestRevision(project.id);
      onProjectChange(updated);
    } catch {
      setActionError("We couldn't send the revision request. Please try again.");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-[#1c1a17]">Official Floorplans</h2>
        <span className="px-2.5 py-1 rounded-lg bg-[#e7eefb] text-[#2563eb] text-xs font-semibold">
          Designer uploaded
        </span>
      </div>
      <p className="-mt-4 text-sm text-[#6b6560]">
        Formal versioned documents uploaded by the assigned firm. Reviewed and approved by the client
        before moving to architect refinement — distinct from the AI concept above.
      </p>

      {/* Revision banner — designer only when client requested changes */}
      {isRevisionRequested && role === 'designer' && (
        <div
          role="status"
          className="flex items-center gap-3 bg-[#fbf0e2] border border-[#f0d4a0] rounded-2xl px-5 py-4"
        >
          <RotateCcw className="w-5 h-5 text-[#b45309] shrink-0" aria-hidden="true" />
          <p className="text-sm font-semibold text-[#b45309]">
            The client has requested revisions. Upload a new version when ready.
          </p>
        </div>
      )}

      {/* Current floorplan viewer — both roles */}
      <section
        className="bg-white rounded-2xl border border-[#e3e0da] p-8 shadow-sm"
        aria-label="Current floorplan"
      >
        {current ? (
          <>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-[#1c1a17]">Floorplan v{current.version}</h3>
                <p className="text-sm text-[#6b6560] mt-0.5">
                  Uploaded by {current.uploadedBy} · {formatDate(current.uploadedAt)}
                </p>
                {current.revisionNote && (
                  <p className="text-sm text-[#6b6560] mt-1 italic">
                    Revision notes: &ldquo;{current.revisionNote}&rdquo;
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {current.fileUrl && (
                  <a
                    href={current.fileUrl}
                    download={current.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e3e0da] text-sm text-[#6b6560] hover:text-[#1c1a17] hover:bg-[#f7f6f3] transition-colors"
                    aria-label={`Download ${current.label}`}
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    Download
                  </a>
                )}
                <span className="bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] text-white px-3 py-1.5 rounded-full text-xs font-semibold">
                  Latest
                </span>
              </div>
            </div>
            <FloorplanViewer floorplan={current} />
          </>
        ) : (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-[#cbced4] mx-auto mb-3" aria-hidden="true" />
            {role === 'designer' ? (
              <>
                <p className="text-[#6b6560] font-medium">No floorplan uploaded yet.</p>
                <p className="text-sm text-[#6b6560] mt-1">Upload the first version using the form below.</p>
              </>
            ) : (
              <>
                <p className="text-[#6b6560] font-medium">Awaiting floorplan from designer.</p>
                <p className="text-sm text-[#6b6560] mt-1">
                  You'll be able to review and approve once a version is ready.
                </p>
              </>
            )}
          </div>
        )}
      </section>

      {/* Upload — designer only, hidden once approved */}
      {role === 'designer' && !isApproved && (
        <section
          className="bg-white rounded-2xl border border-[#e3e0da] p-6 shadow-sm"
          aria-label={versionsDesc.length > 0 ? 'Upload revision' : 'Upload floorplan'}
        >
          <FloorplanUpload onUpload={handleUpload} showRevisionNote={versionsDesc.length > 0} />
        </section>
      )}

      {/* Version history — both roles, only when more than one version exists */}
      {versionsDesc.length > 1 && (
        <section
          className="bg-white rounded-2xl border border-[#e3e0da] p-6 shadow-sm"
          aria-label="Version history"
        >
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-[#2f6f4f]" aria-hidden="true" />
            <h3 className="font-bold text-[#1c1a17]">Version history</h3>
          </div>
          <ol className="space-y-3 list-none p-0 m-0">
            {versionsDesc.map((fp) => (
              <VersionItem key={fp.id} floorplan={fp} />
            ))}
          </ol>
        </section>
      )}

      {/* Comments — both roles */}
      <section
        className="bg-white rounded-2xl border border-[#e3e0da] p-8 shadow-sm"
        aria-label="Comments and revisions"
      >
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="w-6 h-6 text-[#2f6f4f]" aria-hidden="true" />
          <h3 className="text-xl font-bold text-[#1c1a17]">Comments</h3>
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

        <form onSubmit={postComment} className="border-t border-[#e3e0da] pt-6">
          <label htmlFor="comment-input" className="block text-sm font-semibold text-[#1c1a17] mb-3">
            Add a comment{' '}
            <span className="text-[#6b6560] font-normal">(as {role})</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="comment-input"
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
          {actionError && posting === false && (
            <p role="alert" className="text-sm text-[#b4231d] mt-2 font-medium">
              {actionError}
            </p>
          )}
        </form>
      </section>

      {/* Approval workflow — client only */}
      {role === 'client' && (
        <section
          className={`rounded-2xl p-8 text-white shadow-xl ${
            isApproved
              ? 'bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64]'
              : 'bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64]'
          }`}
          aria-label="Approval workflow"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">
                {isApproved ? 'Floorplan approved' : 'Ready to approve?'}
              </h3>
              <p className="text-white/80 mb-6">
                {isApproved
                  ? `v${current?.version ?? ''} is locked as the approved floorplan. The project moves to architect refinement.`
                  : isRevisionRequested
                  ? "You've requested revisions. Waiting for the designer to upload a new version."
                  : current
                  ? `Review v${current.version} and approve it or request changes.`
                  : 'A floorplan must be uploaded before you can approve.'}
              </p>

              {!isApproved && !isRevisionRequested && current && (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={approve}
                    disabled={approving || requesting}
                    className="px-8 py-4 bg-white text-[#2f6f4f] rounded-xl hover:bg-white/90 transition-all font-bold flex items-center gap-2 disabled:opacity-60"
                  >
                    <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                    {approving ? 'Approving…' : 'Approve floorplan'}
                  </button>
                  <button
                    type="button"
                    onClick={requestRevision}
                    disabled={approving || requesting}
                    className="px-8 py-4 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all font-bold flex items-center gap-2 disabled:opacity-60"
                  >
                    <RotateCcw className="w-5 h-5" aria-hidden="true" />
                    {requesting ? 'Requesting…' : 'Request revisions'}
                  </button>
                </div>
              )}

              {isRevisionRequested && (
                <p className="inline-flex items-center gap-2 text-white/90 font-semibold">
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  Revisions requested — awaiting new version
                </p>
              )}

              {actionError && (approving || requesting) === false && (
                <p role="alert" className="mt-3 text-white font-medium">
                  {actionError}
                </p>
              )}
            </div>
            <span
              aria-hidden="true"
              className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0"
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </span>
          </div>
        </section>
      )}
    </div>
  );
}

function FloorplanViewer({ floorplan }: { floorplan: Floorplan }) {
  const { fileUrl, fileType, label } = floorplan;

  if (!fileUrl) {
    return (
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#f7f6f3] to-[#e3e0da] aspect-video flex items-center justify-center shadow-inner">
        <div className="text-center">
          <div className="w-20 h-20 bg-white/50 backdrop-blur-sm rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-[#6b6560]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-[#6b6560] font-medium">{label}</p>
          <p className="text-sm text-[#6b6560] mt-1">Upload a file to preview it here.</p>
        </div>
      </div>
    );
  }

  if (fileType === 'application/pdf') {
    return (
      <div
        className="rounded-2xl overflow-hidden border border-[#e3e0da] bg-[#f7f6f3]"
        style={{ height: 600 }}
      >
        <object
          data={fileUrl}
          type="application/pdf"
          className="w-full h-full"
          aria-label={`PDF floorplan: ${label}`}
        >
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[#6b6560]">
            <p className="text-sm">Your browser can&apos;t display this PDF inline.</p>
            <a
              href={fileUrl}
              download={label}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2f6f4f] text-white rounded-xl text-sm font-semibold hover:bg-[#265e42] transition-colors"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Download PDF
            </a>
          </div>
        </object>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-[#e3e0da] bg-[#f7f6f3]">
      <img src={fileUrl} alt={`Floorplan: ${label}`} className="w-full h-auto" />
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  const isClient = comment.role === 'client';
  const avatar = isClient
    ? 'bg-gradient-to-br from-[#e7eefb] to-[#d1dff4] text-[#2563eb]'
    : 'bg-gradient-to-br from-[#e7f0eb] to-[#d1e4db] text-[#2f6f4f]';
  return (
    <li className="flex gap-4">
      <span
        aria-hidden="true"
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${avatar}`}
      >
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
        <span className="font-semibold text-[#1c1a17]">
          v{floorplan.version} — {floorplan.label}
        </span>
        {isCurrent && <span className="text-xs font-semibold text-[#2f6f4f]">Current</span>}
      </div>
      <p className="text-xs text-[#6b6560]">
        {floorplan.uploadedBy} · {formatDate(floorplan.uploadedAt)}
      </p>
      {floorplan.revisionNote && (
        <p className="text-xs text-[#6b6560] mt-1 italic">&ldquo;{floorplan.revisionNote}&rdquo;</p>
      )}
    </li>
  );
}
