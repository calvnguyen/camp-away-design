import { useEffect, useRef, useState } from 'react';
import { Sparkles, Check, RefreshCw, CheckCircle2, XCircle, Maximize2, X } from 'lucide-react';
import type { ConceptLayout, LayoutZone, StandardBuild } from '../types';
import { ConceptLayoutDiagram } from './ConceptLayoutDiagram';
import { ConceptLayout3D } from './ConceptLayout3D';

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
  /** Skip concept generation entirely and proceed without a layout. */
  onSkip?: () => Promise<void>;
  /** Persist zone positions after a drag or keyboard move. Only called when layout is pending_review. */
  onZonesChange?: (zones: LayoutZone[]) => void;
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
  onSkip,
  onZonesChange,
}: ConceptLayoutSectionProps) {
  const [busy, setBusy] = useState<null | 'generate' | 'approve' | 'reject' | 'skip'>(null);
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
          onZonesChange={layout.status === 'pending_review' ? onZonesChange : undefined}
        />
      ) : (
        <div>
          <p className="text-[#6b6560] mb-5 max-w-2xl">
            No equivalent build exists for this brief yet. Generate a rough 2D
            concept layout — zones for sleeping, kitchenette, bathroom, storage,
            and entry — as a starting point for review. It’s a draft, not a final
            drawing, and must be approved before the project moves to architect refinement.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => run('generate', onGenerate)}
              disabled={busy !== null}
              className="px-6 py-3 bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] text-white rounded-xl hover:shadow-lg transition-all font-semibold inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Sparkles className="w-5 h-5" aria-hidden="true" />
              {busy === 'generate' ? 'Generating…' : 'Generate concept layout'}
            </button>
            {onSkip && (
              <button
                type="button"
                onClick={() => run('skip', onSkip)}
                disabled={busy !== null}
                className="px-6 py-3 border-2 border-[#e3e0da] rounded-xl hover:bg-[#f7f6f3] transition-colors font-semibold disabled:opacity-60 text-[#6b6560]"
              >
                {busy === 'skip' ? 'Skipping…' : 'Skip — proceed without a concept'}
              </button>
            )}
          </div>
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
  onZonesChange?: (zones: LayoutZone[]) => void;
}

const STATUS_BADGE: Record<ConceptLayout['status'], { label: string; className: string }> = {
  pending_review: { label: 'Pending review', className: 'bg-[#fbf0e2] text-[#b45309]' },
  approved: { label: 'Concept approved', className: 'bg-[#e7f0eb] text-[#2f6f4f]' },
  rejected: { label: 'Rejected', className: 'bg-[#fde8e8] text-[#b4231d]' },
};

function ApprovedAwareLayout({
  layout,
  busy,
  onApprove,
  onReject,
  onRegenerate,
  onZonesChange,
}: ApprovedAwareLayoutProps) {
  const badge = STATUS_BADGE[layout.status];
  const sourceLabel = layout.source === 'ai' ? 'AI-generated' : 'Template-generated';
  const editable = layout.status === 'pending_review' && onZonesChange !== undefined;
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [dialogPos, setDialogPos] = useState({ x: 0, y: 0 });
  const [dialogView, setDialogView] = useState<'2d' | '3d'>('2d');
  const dragOrigin = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Shared zone state — both 2D and 3D read from here so they always match.
  const [localZones, setLocalZones] = useState(layout.zones);
  // Re-seed when the layout itself is replaced (regeneration).
  useEffect(() => { setLocalZones(layout.zones); }, [layout.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function openExpanded() {
    setDialogPos({ x: 0, y: 0 });
    setDialogView(view);
    dialogRef.current?.showModal();
  }
  function closeExpanded() { dialogRef.current?.close(); }

  function onHeaderPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOrigin.current = { startX: e.clientX, startY: e.clientY, originX: dialogPos.x, originY: dialogPos.y };
    setIsDragging(true);
  }
  function onHeaderPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragOrigin.current) return;
    setDialogPos({
      x: dragOrigin.current.originX + (e.clientX - dragOrigin.current.startX),
      y: dragOrigin.current.originY + (e.clientY - dragOrigin.current.startY),
    });
  }
  function onHeaderPointerUp() {
    dragOrigin.current = null;
    setIsDragging(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide ${badge.className}`}>
            {badge.label}
          </span>
          <span className="text-xs text-[#6b6560]">{sourceLabel} · draft for review</span>
        </div>

        <div className="flex items-center gap-2">
          {/* 2D / 3D toggle */}
          <div role="group" aria-label="Layout view" className="flex items-center bg-[#f7f6f3] rounded-xl p-1 gap-1">
            {(['2d', '3d'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={view === mode}
                onClick={() => setView(mode)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  view === mode ? 'bg-white shadow-sm text-[#1c1a17]' : 'text-[#6b6560] hover:text-[#1c1a17]'
                }`}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Expand button */}
          <button
            type="button"
            onClick={openExpanded}
            aria-label={`Open concept layout ${view.toUpperCase()} view in full window`}
            className="p-2 rounded-xl hover:bg-[#f7f6f3] text-[#6b6560] hover:text-[#1c1a17] transition-colors"
          >
            <Maximize2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Expanded layout dialog — draggable via the header bar */}
      {/* flex/display classes must NOT go on <dialog> — they override the UA's
          display:none for closed dialogs, making close() and Escape ineffective
          after a page refresh. Use an inner wrapper for flex layout instead. */}
      <dialog
        ref={dialogRef}
        className="w-[92vw] max-w-5xl rounded-2xl border border-[#e3e0da] p-0 shadow-2xl backdrop:bg-black/60 overflow-hidden"
        style={{
          position: 'fixed',
          left: `calc(50% + ${dialogPos.x}px)`,
          top: `calc(50% + ${dialogPos.y}px)`,
          transform: 'translate(-50%, -50%)',
          margin: 0,
          maxHeight: '90vh',
        }}
        onClose={closeExpanded}
      >
        <div className="flex flex-col" style={{ height: '90vh' }}>

        {/* Drag handle header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-[#e3e0da] bg-[#f7f6f3] select-none shrink-0"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={onHeaderPointerUp}
          onPointerCancel={onHeaderPointerUp}
        >
          <div>
            <h3 className="text-lg font-bold text-[#1c1a17]">Concept Layout</h3>
            <p className="text-xs text-[#6b6560] mt-0.5">{layout.lengthFt}ft × {layout.widthFt}ft · {sourceLabel}</p>
          </div>
          <button
            type="button"
            onClick={closeExpanded}
            aria-label="Close full view"
            onPointerDown={(e) => e.stopPropagation()}
            className="p-2 rounded-xl hover:bg-[#e3e0da] text-[#6b6560] hover:text-[#1c1a17] transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 flex-1 min-h-0 overflow-auto">
          {dialogView === '2d' ? (
            <ConceptLayoutDiagram layout={layout} zones={localZones} editable={false} />
          ) : (
            <ConceptLayout3D
              layout={layout}
              zones={localZones}
              className="w-full flex-1 min-h-0 rounded-2xl border border-[#e3e0da] bg-[#f4f2ee] overflow-hidden"
            />
          )}
          {layout.rationale && (
            <p className="text-sm text-[#6b6560] shrink-0">{layout.rationale}</p>
          )}
        </div>

        </div> {/* end flex wrapper */}
      </dialog>

      {/* Both views stay mounted — CSS hides the inactive one to avoid
          remounting the WebGL canvas and losing orbit state. */}
      <div className={view === '2d' ? '' : 'hidden'}>
        <ConceptLayoutDiagram
          layout={layout}
          zones={localZones}
          editable={editable}
          onZonesDrag={setLocalZones}
          onZonesDrop={onZonesChange}
        />
        {editable && (
          <p className="text-xs text-[#6b6560] mt-2" aria-live="polite">
            Drag zones or use arrow keys — they snap to edges. Changes are saved automatically.
          </p>
        )}
      </div>

      <div className={view === '3d' ? '' : 'hidden'}>
        <ConceptLayout3D layout={layout} zones={localZones} />
        <p className="text-xs text-[#6b6560] mt-2">
          Drag to orbit · scroll to zoom{editable ? ' · switch to 2D to reposition zones' : ''}
        </p>
      </div>

      <p className="text-sm text-[#6b6560] mt-3">{layout.rationale}</p>

      {layout.status === 'approved' ? (
        <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#2f6f4f]">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          Concept approved — ready for architect refinement.
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
            {busy === 'approve' ? 'Approving…' : 'Approve concept'}
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
