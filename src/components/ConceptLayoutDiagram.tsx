import { useId } from 'react';
import type { ConceptLayout, ZoneKind } from '../types';
import { ZONE_LABELS } from '../types';

interface ConceptLayoutDiagramProps {
  layout: ConceptLayout;
}

// Fill + text colors per zone, drawn from the warm/green palette. Each zone is
// also labeled in the SVG, so color is never the only signal.
const ZONE_STYLE: Record<ZoneKind, { fill: string; text: string }> = {
  entry: { fill: '#ebe9e3', text: '#6b6560' },
  kitchenette: { fill: '#e7f0eb', text: '#2f6f4f' },
  bathroom: { fill: '#e7eefb', text: '#2563eb' },
  storage: { fill: '#fbf0e2', text: '#b45309' },
  sleeping: { fill: '#f3e8f0', text: '#9333ea' },
};

const SCALE = 36; // px per foot
const PAD = 8; // px padding inside the viewBox

/**
 * Renders a concept layout's zones as a scaled, labeled 2D SVG (top-down view).
 *
 * Accessibility: the SVG has role="img" + a descriptive accessible name and a
 * <title>/<desc>; each zone also shows its visible text label so the diagram is
 * not conveyed by color alone.
 */
export function ConceptLayoutDiagram({ layout }: ConceptLayoutDiagramProps) {
  const titleId = useId();
  const descId = useId();
  const w = layout.lengthFt * SCALE + PAD * 2;
  const h = layout.widthFt * SCALE + PAD * 2;

  const zoneSummary = layout.zones
    .map((z) => ZONE_LABELS[z.kind])
    .join(', ');

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-auto rounded-2xl border border-[#e3e0da] bg-white"
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
    >
      <title id={titleId}>
        Concept layout for a {layout.lengthFt}ft by {layout.widthFt}ft trailer
      </title>
      <desc id={descId}>
        Top-down zoning showing {zoneSummary}. A rough starting point for review,
        not a final architectural drawing.
      </desc>

      {/* Trailer envelope outline */}
      <rect
        x={PAD}
        y={PAD}
        width={layout.lengthFt * SCALE}
        height={layout.widthFt * SCALE}
        fill="none"
        stroke="#1c1a17"
        strokeWidth={2}
        rx={6}
      />

      {layout.zones.map((zone) => {
        const style = ZONE_STYLE[zone.kind];
        const zx = PAD + zone.x * SCALE;
        const zy = PAD + zone.y * SCALE;
        const zw = zone.width * SCALE;
        const zh = zone.depth * SCALE;
        return (
          <g key={zone.kind}>
            <rect
              x={zx}
              y={zy}
              width={zw}
              height={zh}
              fill={style.fill}
              stroke="#1c1a17"
              strokeWidth={1}
            />
            <text
              x={zx + zw / 2}
              y={zy + zh / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12}
              fontWeight={600}
              fill={style.text}
            >
              {ZONE_LABELS[zone.kind]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
