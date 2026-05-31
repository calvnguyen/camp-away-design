import { useState } from 'react';
import { Sparkles, Check, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import type { ConceptLayout, StandardBuild } from '../types';
import { ConceptLayoutDiagram } from './ConceptLayoutDiagram';

interface ConceptLayoutSectionProps {
  /** The standard build equivalent to the brief, or null when none exists. */
  equivalentBuild: StandardBuild | null;
  layout: ConceptLayout | null;
  /** Generate (or regenerate) a concept layout. */
  onGenerate: () => Promise<void>;
  /** Approve the layout — the gate that lets the project go to production. */
  onApprove: () => Promise<void>;
  /** Reject the layout so it can be regenerated. */
  onReject: () => Promise<void>;
}

/**
 * The "no equivalent build → generate a concept layout → approve before build"
 * surface on the project view. Three states:
 *   1. An equivalent build exists → no layout needed (can build directly).
 *   2. No build + no layout → offer to generate one (optional).
 *   3. A layout exists → show the diagram + its review status and the approval
 *      gate (only an approved layout may go to production).
 */
export function ConceptLayoutSection({
  equivalentBuild,
  layout,
  onGenerate,
  onApprove,
  onReject,
}: ConceptLayoutSectionProps) {
  const [busy, setBusy] = useState<null | 'generate' | 'approve' | 'reject'>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: 'generate' | 'approve' | 'reject', fn: () => Promise<void>) {
    setError(null);
    setBusy(action);
    try {
      await fn();
    } catch {
      setError(
        action === 'generate'
          ? 'We couldn’t generate a concept layout. Please try again.'
          : 'That action couldn’t be completed. Please try again.',
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      className="bg-white rounded-2xl border border-[#e3e0da] p-8 shadow-sm"
      aria-label="Concept layout"
    >
      <div className="flex items-center gap-3 mb-2">
        <Sparkles className="w-6 h-6 text-[#2f6f4f]" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-[#1c1a17]">Concept Layout</h2>
      </div>

      {equivalentBuild ? (
        <div>
          <p className="text-[#6b6560] mb-3">
            This brief matches a standard build, so no concept layout is needed —
            it can go straight to production.
          </p>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#2f6f4f]">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            Matches “{equivalentBuild.name}”
          </p>
        </div>
      ) : layout ? (
        <ApprovedAwareLayout
          layout={layout}
          busy={busy}
          onApprove={() => run('approve', onApprove)}
          onReject={() => run('reject', onReject)}
          onRegenerate={() => run('generate', onGenerate)}
        />
      ) : (
        <div>
          <p className="text-[#6b6560] mb-5 max-w-2xl">
            No equivalent build exists for this brief yet. Generate a rough 2D
            concept layout — zones for sleeping, kitchenette, bathroom, storage,
            and entry — as a starting point for review. It’s a draft, not a final
            drawing, and must be approved before the project can go to production.
          </p>
          <button
            type="button"
            onClick={() => run('generate', onGenerate)}
            disabled={busy !== null}
            className="px-6 py-3 bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] text-white rounded-xl hover:shadow-lg transition-all font-semibold inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Sparkles className="w-5 h-5" aria-hidden="true" />
            {busy === 'generate' ? 'Generating…' : 'Generate concept layout'}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-[#b4231d] font-medium mt-4">
          {error}
        </p>
      )}
    </section>
  );
}

interface ApprovedAwareLayoutProps {
  layout: ConceptLayout;
  busy: null | 'generate' | 'approve' | 'reject';
  onApprove: () => void;
  onReject: () => void;
  onRegenerate: () => void;
}

const STATUS_BADGE: Record<ConceptLayout['status'], { label: string; className: string }> = {
  pending_review: { label: 'Pending review', className: 'bg-[#fbf0e2] text-[#b45309]' },
  approved: { label: 'Approved for build', className: 'bg-[#e7f0eb] text-[#2f6f4f]' },
  rejected: { label: 'Rejected', className: 'bg-[#fde8e8] text-[#b4231d]' },
};

function ApprovedAwareLayout({
  layout,
  busy,
  onApprove,
  onReject,
  onRegenerate,
}: ApprovedAwareLayoutProps) {
  const badge = STATUS_BADGE[layout.status];
  const sourceLabel = layout.source === 'ai' ? 'AI-generated' : 'Template-generated';

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide ${badge.className}`}>
          {badge.label}
        </span>
        <span className="text-xs text-[#6b6560]">{sourceLabel} · draft for review</span>
      </div>

      <ConceptLayoutDiagram layout={layout} />

      <p className="text-sm text-[#6b6560] mt-3">{layout.rationale}</p>

      {layout.status === 'approved' ? (
        <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#2f6f4f]">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          Approved — this layout can go to production.
        </p>
      ) : (
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onApprove}
            disabled={busy !== null}
            className="px-6 py-3 bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] text-white rounded-xl hover:shadow-lg transition-all font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Check className="w-5 h-5" aria-hidden="true" />
            {busy === 'approve' ? 'Approving…' : 'Approve for production'}
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={busy !== null}
            className="px-6 py-3 border-2 border-[#e3e0da] rounded-xl hover:bg-[#f7f6f3] transition-colors font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <XCircle className="w-5 h-5 text-[#6b6560]" aria-hidden="true" />
            {busy === 'reject' ? 'Rejecting…' : 'Reject'}
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={busy !== null}
            className="px-6 py-3 border-2 border-[#e3e0da] rounded-xl hover:bg-[#f7f6f3] transition-colors font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <RefreshCw className="w-5 h-5 text-[#6b6560]" aria-hidden="true" />
            {busy === 'generate' ? 'Regenerating…' : 'Regenerate'}
          </button>
        </div>
      )}
    </div>
  );
}
