import { useId, useRef, useState } from 'react';
import type { ConceptLayout, LayoutZone, ZoneKind } from '../types';
import { ZONE_LABELS } from '../types';

interface ConceptLayoutDiagramProps {
  layout: ConceptLayout;
  zones: LayoutZone[];
  editable?: boolean;
  onZonesDrag?: (zones: LayoutZone[]) => void;
  onZonesDrop?: (zones: LayoutZone[]) => void;
}

const ZONE_FILL: Record<ZoneKind, string> = {
  entry: '#e8e4de', kitchenette: '#deeade', bathroom: '#dae4f0',
  storage: '#f0ead8', sleeping: '#ede6e0',
};
const ZONE_TEXT: Record<ZoneKind, string> = {
  entry: '#5a524a', kitchenette: '#2f5a3a', bathroom: '#2a4070',
  storage: '#6a5020', sleeping: '#5a4038',
};
const ZONE_LABEL_BG: Record<ZoneKind, string> = {
  entry: '#cdc8c0', kitchenette: '#a8c8b0', bathroom: '#a8bcd8',
  storage: '#d8c898', sleeping: '#d0c0b0',
};

const SCALE     = 40;
const PAD       = 20;
const WALL_OUT  = 10;
const WALL_IN   = 2;
const SNAP_GRID = 0.5;
const SNAP_EDGE = 0.6;
const MIN_DIM   = 1.0; // minimum zone size in ft
const HS        = 5;   // half-size of resize handle visual square (px)
const HIT       = 10;  // half-size of resize handle hit area (px)

function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }

function snapToNearest(raw: number, candidates: number[], lo: number, hi: number): number {
  const c0 = clamp(raw, lo, hi);
  let best = Math.round(c0 / SNAP_GRID) * SNAP_GRID;
  let dist = SNAP_EDGE;
  for (const c of candidates) {
    const cc = clamp(c, lo, hi);
    const d = Math.abs(c0 - cc);
    if (d < dist) { dist = d; best = cc; }
  }
  return clamp(best, lo, hi);
}

function snapX(raw: number, size: number, others: LayoutZone[], limit: number): number {
  const candidates = [0, limit - size, ...others.flatMap(z => [z.x, z.x + z.width, z.x - size, z.x + z.width - size])];
  return snapToNearest(raw, candidates, 0, limit - size);
}
function snapY(raw: number, size: number, others: LayoutZone[], limit: number): number {
  const candidates = [0, limit - size, ...others.flatMap(z => [z.y, z.y + z.depth, z.y - size, z.y + z.depth - size])];
  return snapToNearest(raw, candidates, 0, limit - size);
}
function snapEdgeX(raw: number, others: LayoutZone[], limit: number): number {
  const candidates = [0, limit, ...others.flatMap(z => [z.x, z.x + z.width])];
  return snapToNearest(raw, candidates, 0, limit);
}
function snapEdgeY(raw: number, others: LayoutZone[], limit: number): number {
  const candidates = [0, limit, ...others.flatMap(z => [z.y, z.y + z.depth])];
  return snapToNearest(raw, candidates, 0, limit);
}

// ─── Resize ──────────────────────────────────────────────────────────────────

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
const RESIZE_CURSORS: Record<ResizeHandle, string> = {
  n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
  ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize',
};

function handlePositions(zx: number, zy: number, zw: number, zh: number): Record<ResizeHandle, [number, number]> {
  return {
    n:  [zx + zw / 2, zy],
    s:  [zx + zw / 2, zy + zh],
    e:  [zx + zw,     zy + zh / 2],
    w:  [zx,          zy + zh / 2],
    ne: [zx + zw,     zy],
    nw: [zx,          zy],
    se: [zx + zw,     zy + zh],
    sw: [zx,          zy + zh],
  };
}

function applyResize(
  start: LayoutZone,
  handle: ResizeHandle,
  dx: number, dy: number,
  others: LayoutZone[],
  L: number, W: number,
): LayoutZone {
  let { x, y, width, depth } = start;

  if (handle === 'e' || handle === 'ne' || handle === 'se') {
    const right = snapEdgeX(start.x + start.width + dx, others, L);
    width = Math.max(MIN_DIM, right - x);
  }
  if (handle === 'w' || handle === 'nw' || handle === 'sw') {
    const left = snapEdgeX(start.x + dx, others, L);
    const newX = clamp(left, 0, start.x + start.width - MIN_DIM);
    width = start.width + (start.x - newX);
    x = newX;
  }
  if (handle === 's' || handle === 'se' || handle === 'sw') {
    const bottom = snapEdgeY(start.y + start.depth + dy, others, W);
    depth = Math.max(MIN_DIM, bottom - y);
  }
  if (handle === 'n' || handle === 'ne' || handle === 'nw') {
    const top = snapEdgeY(start.y + dy, others, W);
    const newY = clamp(top, 0, start.y + start.depth - MIN_DIM);
    depth = start.depth + (start.y - newY);
    y = newY;
  }

  // Clamp to envelope
  width = Math.min(width, L - x);
  depth = Math.min(depth, W - y);
  return { ...start, x, y, width, depth };
}

// ─── Furniture icons ─────────────────────────────────────────────────────────

function Bed({ zx, zy, zw, zh }: { zx: number; zy: number; zw: number; zh: number }) {
  const p = Math.min(zw, zh) * 0.1;
  const bw = zw - p * 2, bh = zh - p * 2;
  if (bw < 8 || bh < 8) return null;
  const headH = Math.min(bh * 0.14, 14);
  const pilR  = Math.min(bw * 0.18, 14);
  const pilY  = zy + p + headH + pilR * 0.8;
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={zx+p} y={zy+p} width={bw} height={bh} rx={3} fill="#f5efe6" stroke="#b0a090" strokeWidth={1.2}/>
      <rect x={zx+p} y={zy+p} width={bw} height={headH} rx="2 2 0 0" fill="#c8b498" stroke="none"/>
      {bh > 36 && <>
        <ellipse cx={zx+p+bw*0.3} cy={pilY} rx={pilR} ry={pilR*0.55} fill="white" stroke="#b0a090" strokeWidth={1}/>
        <ellipse cx={zx+p+bw*0.7} cy={pilY} rx={pilR} ry={pilR*0.55} fill="white" stroke="#b0a090" strokeWidth={1}/>
      </>}
    </g>
  );
}
function Kitchen({ zx, zy, zw, zh }: { zx: number; zy: number; zw: number; zh: number }) {
  const p = Math.min(zw, zh) * 0.1;
  const ch = Math.min(zh * 0.38, 42);
  const cx = zx + p, cy = zy + zh - p - ch, cw = zw - p * 2;
  const br = Math.min(ch * 0.18, 6);
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={cx} y={cy} width={cw} height={ch} rx={2} fill="#ece5d8" stroke="#a09080" strokeWidth={1.2}/>
      <rect x={cx+cw*0.58} y={cy+ch*0.1} width={cw*0.34} height={ch*0.78} rx={2} fill="#c8c0b4" stroke="#a09080" strokeWidth={1}/>
      <circle cx={cx+cw*0.75} cy={cy+ch*0.49} r={ch*0.12} fill="#8a8070" stroke="none"/>
      {([[0.15,0.28],[0.35,0.28],[0.15,0.72],[0.35,0.72]] as [number,number][]).map(([bx,by],i)=>(
        <circle key={i} cx={cx+cw*bx} cy={cy+ch*by} r={br} fill="none" stroke="#a09080" strokeWidth={1}/>
      ))}
    </g>
  );
}
function Bathroom({ zx, zy, zw, zh }: { zx: number; zy: number; zw: number; zh: number }) {
  const p = Math.min(zw, zh) * 0.1;
  const tw = Math.min(zw * 0.52, 34), th = Math.min(zh * 0.46, 42);
  const sh = zh - p * 2 - th - 4;
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={zx+p} y={zy+p} width={zw-p*2} height={Math.max(0, sh)} rx={2} fill="#d8e4f0" stroke="#8090b0" strokeWidth={1.2} strokeDasharray="4 2"/>
      <circle cx={zx+zw/2} cy={zy+p+Math.max(0,sh)/2} r={Math.min(sh,zw-p*2)*0.14} fill="none" stroke="#8090b0" strokeWidth={1.2}/>
      <rect x={zx+zw/2-tw/2} y={zy+zh-p-th} width={tw} height={th*0.3} rx={2} fill="white" stroke="#8090b0" strokeWidth={1.2}/>
      <ellipse cx={zx+zw/2} cy={zy+zh-p-th*0.38} rx={tw*0.46} ry={th*0.56} fill="white" stroke="#8090b0" strokeWidth={1.2}/>
    </g>
  );
}
function Entry({ zx, zy, zw, zh }: { zx: number; zy: number; zw: number; zh: number }) {
  const p = Math.min(zw, zh) * 0.1;
  const dw = Math.min(zw - p*2, 22), dh = Math.min(zh - p*2, 54);
  const dx = zx + (zw - dw) / 2, dy = zy + (zh - dh) / 2;
  const r  = dh * 0.9;
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={dx} y={dy} width={dw} height={dh} rx={2} fill="white" stroke="#9a9288" strokeWidth={1.2}/>
      <path d={`M ${dx+dw} ${dy} A ${r} ${r} 0 0 1 ${dx+dw-r} ${dy+r}`} fill="none" stroke="#9a9288" strokeWidth={1} strokeDasharray="3 2"/>
    </g>
  );
}
function Storage({ zx, zy, zw, zh }: { zx: number; zy: number; zw: number; zh: number }) {
  const p = Math.min(zw, zh) * 0.1;
  const sw = zw - p*2, sh = zh - p*2;
  const rows = Math.max(2, Math.floor(sh / 16));
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={zx+p} y={zy+p} width={sw} height={sh} rx={2} fill="#f0e8c8" stroke="#a09060" strokeWidth={1.2}/>
      {Array.from({length: rows}, (_,i) => (
        <line key={i} x1={zx+p} x2={zx+p+sw} y1={zy+p+sh*(i+1)/(rows+1)} y2={zy+p+sh*(i+1)/(rows+1)} stroke="#a09060" strokeWidth={0.8}/>
      ))}
    </g>
  );
}
const FURNITURE: Record<ZoneKind, (p:{zx:number;zy:number;zw:number;zh:number}) => React.ReactNode> = {
  sleeping: p => <Bed {...p}/>, kitchenette: p => <Kitchen {...p}/>,
  bathroom: p => <Bathroom {...p}/>, entry: p => <Entry {...p}/>, storage: p => <Storage {...p}/>,
};

// ─── Drag / Resize state ─────────────────────────────────────────────────────

type DragState = {
  kind: ZoneKind; pointerId: number;
  sClientX: number; sClientY: number; sFtX: number; sFtY: number;
};
type ResizeState = {
  kind: ZoneKind; handle: ResizeHandle; pointerId: number;
  sClientX: number; sClientY: number; startZone: LayoutZone;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ConceptLayoutDiagram({
  layout, zones, editable = false, onZonesDrag, onZonesDrop,
}: ConceptLayoutDiagramProps) {
  const titleId = useId(), descId = useId();
  const svgRef  = useRef<SVGSVGElement>(null);
  const latestZones = useRef(zones);
  latestZones.current = zones;

  const [dragging,    setDragging]    = useState<DragState | null>(null);
  const [resizing,    setResizing]    = useState<ResizeState | null>(null);
  const [focusedKind, setFocusedKind] = useState<ZoneKind | null>(null);

  const vw = layout.lengthFt * SCALE + PAD * 2;
  const vh = layout.widthFt  * SCALE + PAD * 2;

  function clientToFtDelta(dxPx: number, dyPx: number) {
    if (!svgRef.current) return { dx: 0, dy: 0 };
    const r = svgRef.current.getBoundingClientRect();
    return { dx: (dxPx * vw / r.width) / SCALE, dy: (dyPx * vh / r.height) / SCALE };
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────

  function onDragDown(e: React.PointerEvent<SVGGElement>, zone: LayoutZone) {
    if (resizing) return;
    e.preventDefault();
    (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
    setDragging({ kind: zone.kind, pointerId: e.pointerId, sClientX: e.clientX, sClientY: e.clientY, sFtX: zone.x, sFtY: zone.y });
  }
  function onDragMove(e: React.PointerEvent<SVGGElement>, zone: LayoutZone) {
    if (!dragging || dragging.kind !== zone.kind) return;
    const { dx, dy } = clientToFtDelta(e.clientX - dragging.sClientX, e.clientY - dragging.sClientY);
    const others = latestZones.current.filter(z => z.kind !== zone.kind);
    const nx = snapX(dragging.sFtX + dx, zone.width,  others, layout.lengthFt);
    const ny = snapY(dragging.sFtY + dy, zone.depth, others, layout.widthFt);
    onZonesDrag?.(latestZones.current.map(z => z.kind === zone.kind ? { ...z, x: nx, y: ny } : z));
  }
  function onDragUp(_e: React.PointerEvent<SVGGElement>, zone: LayoutZone) {
    if (!dragging || dragging.kind !== zone.kind) return;
    setDragging(null);
    onZonesDrop?.(latestZones.current);
  }

  // ── Resize handlers ────────────────────────────────────────────────────────

  function onResizeDown(e: React.PointerEvent<SVGGElement>, zone: LayoutZone, handle: ResizeHandle) {
    e.preventDefault();
    e.stopPropagation(); // prevent triggering drag
    (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
    setResizing({ kind: zone.kind, handle, pointerId: e.pointerId, sClientX: e.clientX, sClientY: e.clientY, startZone: { ...zone } });
  }
  function onResizeMove(e: React.PointerEvent<SVGGElement>, zone: LayoutZone) {
    if (!resizing || resizing.kind !== zone.kind) return;
    const { dx, dy } = clientToFtDelta(e.clientX - resizing.sClientX, e.clientY - resizing.sClientY);
    const others = latestZones.current.filter(z => z.kind !== zone.kind);
    const updated = applyResize(resizing.startZone, resizing.handle, dx, dy, others, layout.lengthFt, layout.widthFt);
    onZonesDrag?.(latestZones.current.map(z => z.kind === zone.kind ? updated : z));
  }
  function onResizeUp(_e: React.PointerEvent<SVGGElement>, zone: LayoutZone) {
    if (!resizing || resizing.kind !== zone.kind) return;
    setResizing(null);
    onZonesDrop?.(latestZones.current);
  }

  // ── Keyboard (move) ────────────────────────────────────────────────────────

  function onKeyDown(e: React.KeyboardEvent<SVGGElement>, zone: LayoutZone) {
    let dx = 0, dy = 0;
    if (e.key === 'ArrowRight') dx =  SNAP_GRID;
    else if (e.key === 'ArrowLeft')  dx = -SNAP_GRID;
    else if (e.key === 'ArrowDown')  dy =  SNAP_GRID;
    else if (e.key === 'ArrowUp')    dy = -SNAP_GRID;
    else return;
    e.preventDefault();
    const others = latestZones.current.filter(z => z.kind !== zone.kind);
    const updated = latestZones.current.map(z => {
      if (z.kind !== zone.kind) return z;
      return { ...z,
        x: snapX(z.x + dx, z.width,  others, layout.lengthFt),
        y: snapY(z.y + dy, z.depth, others, layout.widthFt),
      };
    });
    onZonesDrag?.(updated);
    onZonesDrop?.(updated);
  }

  const zoneSummary = zones.map(z => ZONE_LABELS[z.kind]).join(', ');

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${vw} ${vh}`}
      className="w-full h-auto rounded-2xl border border-[#e3e0da] bg-white"
      role={editable ? undefined : 'img'}
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>Concept layout — {layout.lengthFt}ft × {layout.widthFt}ft trailer</title>
      <desc id={descId}>
        {editable
          ? `Interactive floor plan showing ${zoneSummary}. Drag to move, drag edge handles to resize.`
          : `Top-down floor plan showing ${zoneSummary}.`}
      </desc>

      {/* White floor */}
      <rect x={PAD} y={PAD} width={layout.lengthFt*SCALE} height={layout.widthFt*SCALE} fill="white"/>

      {/* Zone fills */}
      {zones.map(z => (
        <rect key={z.kind} x={PAD+z.x*SCALE} y={PAD+z.y*SCALE} width={z.width*SCALE} height={z.depth*SCALE} fill={ZONE_FILL[z.kind]}/>
      ))}

      {/* Inner partition lines */}
      {zones.map(z => (
        <rect key={z.kind} x={PAD+z.x*SCALE} y={PAD+z.y*SCALE} width={z.width*SCALE} height={z.depth*SCALE} fill="none" stroke="#a09888" strokeWidth={WALL_IN}/>
      ))}

      {/* Furniture */}
      {zones.map(z => {
        const zx = PAD+z.x*SCALE, zy = PAD+z.y*SCALE, zw = z.width*SCALE, zh = z.depth*SCALE;
        return <g key={z.kind}>{FURNITURE[z.kind]({ zx, zy, zw, zh })}</g>;
      })}

      {/* Outer wall */}
      <rect x={PAD} y={PAD} width={layout.lengthFt*SCALE} height={layout.widthFt*SCALE} fill="none" stroke="#1c1a17" strokeWidth={WALL_OUT} rx={4}/>

      {/* Direction labels */}
      <text x={PAD+4} y={PAD-5} fontSize={9} fill="#8a8278" fontFamily="system-ui">FRONT</text>
      <text x={PAD+layout.lengthFt*SCALE-28} y={PAD-5} fontSize={9} fill="#8a8278" fontFamily="system-ui">REAR</text>

      {/* Interactive zone groups */}
      {zones.map(zone => {
        const zx = PAD+zone.x*SCALE, zy = PAD+zone.y*SCALE, zw = zone.width*SCALE, zh = zone.depth*SCALE;
        const isDragging = dragging?.kind === zone.kind;
        const isResizing = resizing?.kind === zone.kind;
        const isFocused  = focusedKind === zone.kind;
        const active     = isDragging || isResizing;
        const handles    = editable ? handlePositions(zx, zy, zw, zh) : null;

        return (
          <g
            key={zone.kind}
            tabIndex={editable ? 0 : undefined}
            role={editable ? 'group' : undefined}
            aria-label={editable ? `${ZONE_LABELS[zone.kind]}: ${zone.x}ft from front, ${zone.y}ft from side, ${zone.width}ft wide, ${zone.depth}ft deep. Arrow keys to move.` : undefined}
            aria-roledescription={editable ? 'draggable resizable zone' : undefined}
            style={{ cursor: isDragging ? 'grabbing' : editable ? 'grab' : 'default', outline: 'none' }}
            onPointerDown={editable ? (e) => onDragDown(e, zone) : undefined}
            onPointerMove={editable ? (e) => onDragMove(e, zone) : undefined}
            onPointerUp={editable ? (e) => onDragUp(e, zone) : undefined}
            onPointerCancel={editable ? () => setDragging(null) : undefined}
            onKeyDown={editable ? (e) => onKeyDown(e, zone) : undefined}
            onFocus={editable ? () => setFocusedKind(zone.kind) : undefined}
            onBlur={editable ? () => setFocusedKind(k => (k === zone.kind ? null : k)) : undefined}
          >
            {/* Transparent drag hit area */}
            <rect x={zx} y={zy} width={zw} height={zh} fill="transparent"/>

            {/* Active highlight */}
            {active && <rect x={zx} y={zy} width={zw} height={zh} fill="rgba(47,111,79,0.07)" stroke="#2f6f4f" strokeWidth={2}/>}

            {/* Zone label badge */}
            <rect x={zx+zw/2-ZONE_LABELS[zone.kind].length*3.4} y={zy+zh-20} width={ZONE_LABELS[zone.kind].length*6.8+8} height={16} rx={3} fill={ZONE_LABEL_BG[zone.kind]} opacity={0.9}/>
            <text x={zx+zw/2} y={zy+zh-9} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight={700} fill={ZONE_TEXT[zone.kind]} fontFamily="system-ui" style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {ZONE_LABELS[zone.kind]}
            </text>

            {/* Dimension label */}
            {zw > 28 && (
              <text x={zx+zw/2} y={zy+10} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="#8a8278" fontFamily="system-ui" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                {zone.width}ft × {zone.depth}ft
              </text>
            )}

            {/* Focus ring */}
            {isFocused && <rect x={zx-2} y={zy-2} width={zw+4} height={zh+4} fill="none" stroke="#2f6f4f" strokeWidth={2} strokeDasharray="4 2" rx={2} aria-hidden="true" style={{ pointerEvents: 'none' }}/>}

            {/* Resize handles */}
            {handles && (Object.entries(handles) as [ResizeHandle, [number, number]][]).map(([handle, [hx, hy]]) => (
              <g
                key={handle}
                style={{ cursor: RESIZE_CURSORS[handle] }}
                onPointerDown={(e) => { onResizeDown(e, zone, handle); }}
                onPointerMove={(e) => { onResizeMove(e, zone); }}
                onPointerUp={(e) => { onResizeUp(e, zone); }}
                onPointerCancel={() => setResizing(null)}
              >
                {/* Transparent hit area */}
                <rect x={hx-HIT} y={hy-HIT} width={HIT*2} height={HIT*2} fill="transparent"/>
                {/* Visual handle */}
                <rect
                  x={hx-HS} y={hy-HS} width={HS*2} height={HS*2} rx={2}
                  fill={isResizing && resizing?.handle === handle ? '#2f6f4f' : 'white'}
                  stroke={active ? '#2f6f4f' : '#a09888'}
                  strokeWidth={1.5}
                />
              </g>
            ))}
          </g>
        );
      })}

      {/* Overall dimension footer */}
      <text x={PAD+layout.lengthFt*SCALE/2} y={vh-4} textAnchor="middle" fontSize={9} fill="#8a8278" fontFamily="system-ui">
        {layout.lengthFt}ft × {layout.widthFt}ft
      </text>
    </svg>
  );
}
