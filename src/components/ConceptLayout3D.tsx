import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Grid } from '@react-three/drei';
import type { ConceptLayout, LayoutZone, ZoneKind } from '../types';
import { ZONE_LABELS } from '../types';

interface ConceptLayout3DProps {
  layout: ConceptLayout;
  /** Live zone positions — updated in real-time as user drags in 2D view. */
  zones: LayoutZone[];
  /** Override the container's className to control height (default: fixed 380px). */
  className?: string;
}

const FLOOR_H    = 0.06;   // floor slab thickness (ft)
const WALL_H     = 1.55;   // nominal wall height (ft)
const WALL_T     = 0.12;   // wall thickness (ft)

const ZONE_FLOOR: Record<ZoneKind, string> = {
  entry:       '#c8c2b8',
  kitchenette: '#9ec8a2',
  bathroom:    '#9ab4d8',
  storage:     '#d4c280',
  sleeping:    '#d0b8a8',
};
const ZONE_WALL: Record<ZoneKind, string> = {
  entry:       '#ddd8d0',
  kitchenette: '#c8e4cc',
  bathroom:    '#c0d2ea',
  storage:     '#e8daa8',
  sleeping:    '#e4d0c0',
};

// Simple furniture shapes in 3D — flat boxes on the floor
function ZoneFurniture({ kind, x, y, width, depth }: LayoutZone) {
  const cx = x + width / 2, cz = y + depth / 2;

  switch (kind) {
    case 'sleeping': {
      const bw = width * 0.8, bd = depth * 0.75, bh = 0.3;
      return (
        <group position={[cx, 0, cz]}>
          <mesh position={[0, bh / 2 + FLOOR_H, 0]}>
            <boxGeometry args={[bw, bh, bd]} />
            <meshStandardMaterial color="#d4c4b0" />
          </mesh>
          {/* Headboard */}
          <mesh position={[0, bh + FLOOR_H, -(bd / 2 - 0.04)]}>
            <boxGeometry args={[bw, bh * 0.7, 0.08]} />
            <meshStandardMaterial color="#b09070" />
          </mesh>
          {/* Pillows */}
          {[-bw * 0.22, bw * 0.22].map((px, i) => (
            <mesh key={i} position={[px, bh + FLOOR_H + 0.06, -(bd / 2 - 0.22)]}>
              <boxGeometry args={[bw * 0.32, 0.12, 0.25]} />
              <meshStandardMaterial color="white" />
            </mesh>
          ))}
        </group>
      );
    }
    case 'kitchenette': {
      const cw = width * 0.85, cd = Math.min(depth * 0.35, 0.7), ch = 0.85;
      return (
        <group position={[cx, 0, y + depth - cd / 2]}>
          <mesh position={[0, ch / 2 + FLOOR_H, 0]}>
            <boxGeometry args={[cw, ch, cd]} />
            <meshStandardMaterial color="#d8cfc0" />
          </mesh>
          {/* Counter top */}
          <mesh position={[0, ch + FLOOR_H + 0.03, 0]}>
            <boxGeometry args={[cw, 0.06, cd + 0.04]} />
            <meshStandardMaterial color="#c0b8a8" />
          </mesh>
          {/* Sink */}
          <mesh position={[cw * 0.22, ch + FLOOR_H + 0.02, 0]}>
            <boxGeometry args={[cw * 0.28, 0.04, cd * 0.7]} />
            <meshStandardMaterial color="#a8a098" />
          </mesh>
        </group>
      );
    }
    case 'bathroom': {
      const tw = Math.min(width * 0.55, 0.65), td = Math.min(depth * 0.45, 0.75), th = 0.4;
      return (
        <group position={[cx, 0, y + depth - td / 2]}>
          <mesh position={[0, th / 2 + FLOOR_H, 0]}>
            <boxGeometry args={[tw, th, td]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </group>
      );
    }
    case 'storage': {
      const sh = 1.2, sw = width * 0.7, sd = Math.min(depth * 0.25, 0.4);
      return (
        <group position={[cx, 0, y + depth - sd / 2]}>
          <mesh position={[0, sh / 2 + FLOOR_H, 0]}>
            <boxGeometry args={[sw, sh, sd]} />
            <meshStandardMaterial color="#c8c0a0" />
          </mesh>
          {[sh * 0.3, sh * 0.6, sh * 0.9].map((sy, i) => (
            <mesh key={i} position={[0, sy + FLOOR_H, sd / 2 + 0.005]}>
              <boxGeometry args={[sw - 0.04, 0.03, 0.01]} />
              <meshStandardMaterial color="#a09878" />
            </mesh>
          ))}
        </group>
      );
    }
    default:
      return null;
  }
}

function ZoneBox({ zone }: { zone: LayoutZone }) {
  const { kind, x, y, width, depth } = zone;
  const cx = x + width / 2, cz = y + depth / 2;
  const floorColor = ZONE_FLOOR[kind];
  const wallColor  = ZONE_WALL[kind];

  return (
    <group>
      {/* Coloured floor panel */}
      <mesh position={[cx, FLOOR_H / 2, cz]} receiveShadow>
        <boxGeometry args={[width, FLOOR_H, depth]} />
        <meshStandardMaterial color={floorColor} />
      </mesh>
      {/* Semi-transparent wall box */}
      <mesh position={[cx, FLOOR_H + WALL_H / 2, cz]}>
        <boxGeometry args={[width, WALL_H, depth]} />
        <meshStandardMaterial color={wallColor} transparent opacity={0.28} depthWrite={false} />
      </mesh>
      {/* Furniture */}
      <ZoneFurniture {...zone} />
      {/* Floating label */}
      <Html position={[cx, FLOOR_H + WALL_H + 0.25, cz]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#1c1a17', background: 'rgba(255,255,255,0.85)', padding: '2px 7px', borderRadius: 4, border: '1px solid rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}>
          {ZONE_LABELS[kind]}
        </span>
      </Html>
    </group>
  );
}

function Scene({ layout, zones }: { layout: ConceptLayout; zones: LayoutZone[] }) {
  const { lengthFt: L, widthFt: W } = layout;

  // Outer perimeter walls
  const outerWalls = useMemo(() => [
    { pos: [L/2, WALL_H/2+FLOOR_H,   0     ] as const, size: [L+WALL_T*2, WALL_H, WALL_T] as const },
    { pos: [L/2, WALL_H/2+FLOOR_H,   W     ] as const, size: [L+WALL_T*2, WALL_H, WALL_T] as const },
    { pos: [0,   WALL_H/2+FLOOR_H, W/2   ] as const, size: [WALL_T, WALL_H, W      ] as const },
    { pos: [L,   WALL_H/2+FLOOR_H, W/2   ] as const, size: [WALL_T, WALL_H, W      ] as const },
  ], [L, W]);

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[L * 0.9, L * 0.7, W * 2.5]} intensity={1.1} castShadow />
      <directionalLight position={[-L * 0.3, L * 0.4, -W]}     intensity={0.35} />

      {/* Ground / base slab */}
      <mesh position={[L/2, 0, W/2]} receiveShadow>
        <boxGeometry args={[L, 0.02, W]} />
        <meshStandardMaterial color="#e8e4dc" />
      </mesh>

      {/* Zone boxes */}
      {zones.map(z => <ZoneBox key={z.kind} zone={z} />)}

      {/* Outer perimeter walls */}
      {outerWalls.map((w, i) => (
        <mesh key={i} position={w.pos} castShadow receiveShadow>
          <boxGeometry args={w.size} />
          <meshStandardMaterial color="#f0ede6" />
        </mesh>
      ))}

      <Grid
        position={[L/2, -0.01, W/2]}
        args={[L+6, W+6]}
        cellColor="#d8d4cc"
        sectionColor="#c0bcb4"
        cellSize={1}
        sectionSize={5}
        fadeDistance={35}
        infiniteGrid={false}
      />

      <OrbitControls
        target={[L/2, 0, W/2]}
        minDistance={3}
        maxDistance={L * 2.2}
        maxPolarAngle={Math.PI / 2.05}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

/**
 * Interactive 3D floor plan view.
 * Receives live `zones` so it stays in sync as the user drags in the 2D view.
 * Accessibility: WebGL canvas is not AT-traversable — the 2D view remains available.
 */
export function ConceptLayout3D({ layout, zones, className }: ConceptLayout3DProps) {
  const { lengthFt: L, widthFt: W } = layout;
  const camX = L * 0.5, camY = L * 0.55, camZ = W * 3.0;

  return (
    <div
      className={className ?? 'w-full rounded-2xl border border-[#e3e0da] bg-[#f4f2ee] overflow-hidden'}
      style={className ? undefined : { height: 380 }}
      role="img"
      aria-label={`3D floor plan — ${L}ft × ${W}ft trailer. Drag to orbit, scroll to zoom.`}
    >
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center text-[#6b6560] text-sm">
          Loading 3D view…
        </div>
      }>
        <Canvas
          camera={{ position: [camX, camY, camZ], fov: 42 }}
          shadows
          gl={{ antialias: true }}
          frameloop="always"
        >
          <Scene layout={layout} zones={zones} />
        </Canvas>
      </Suspense>
    </div>
  );
}
