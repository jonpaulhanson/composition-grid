import type { OverlayState } from '../types';
import type { Point } from './orientation';
import { thirdsLines } from './thirds';
import { goldenSectionLines } from './goldenSection';
import { goldenTriangleLines } from './goldenTriangle';
import { harmoniousTriangleLines } from './harmoniousTriangle';
import { goldenSpiralGeometry } from './goldenSpiral';
import type { SpiralSquare } from './goldenSpiral';
import { dynamicSymmetryLines } from './dynamicSymmetry';
import { harmonicArmatureLines } from './harmonicArmature';

export interface Circle {
  cx: number;
  cy: number;
  r: number;
}

export interface OverlayGeometry {
  lines: [Point, Point][];
  rects: SpiralSquare[];
  circles: Circle[];
  spiralPath: string;
}

interface SpiralOrientation {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

/** The orientation variants to layer together for a given multiplicity, built off the
 * overlay's own flip/rotation state: 2 pairs the current orientation with its horizontal
 * mirror; 4 uses all 4 rotations of the current flip state. */
function spiralOrientations(overlay: OverlayState): SpiralOrientation[] {
  const { rotation, flipH, flipV, multiplicity } = overlay;
  if (multiplicity === 2) {
    return [
      { rotation, flipH, flipV },
      { rotation, flipH: !flipH, flipV },
    ];
  }
  if (multiplicity === 4) {
    return [0, 1, 2, 3].map((r) => ({ rotation: (rotation + r) % 4, flipH, flipV }));
  }
  return [{ rotation, flipH, flipV }];
}

function buildSpiralGeometry(
  overlay: OverlayState,
  width: number,
  height: number,
  render: (squares: SpiralSquare[], pathD: string, chain: ReturnType<typeof goldenSpiralGeometry>['chain']) => OverlayGeometry,
): OverlayGeometry {
  const variants = spiralOrientations(overlay).map((o) => goldenSpiralGeometry(width, height, o.rotation, o.flipH, o.flipV));
  return variants
    .map((v) => render(v.squares, v.pathD, v.chain))
    .reduce((merged, g) => ({
      lines: [...merged.lines, ...g.lines],
      rects: [...merged.rects, ...g.rects],
      circles: [...merged.circles, ...g.circles],
      spiralPath: merged.spiralPath ? `${merged.spiralPath} ${g.spiralPath}` : g.spiralPath,
    }));
}

export function buildOverlayGeometry(overlay: OverlayState, width: number, height: number): OverlayGeometry {
  const { type, rotation, flipH, flipV } = overlay;

  switch (type) {
    case 'thirds':
      return { lines: thirdsLines(width, height), rects: [], circles: [], spiralPath: '' };
    case 'goldenSection':
      return { lines: goldenSectionLines(width, height), rects: [], circles: [], spiralPath: '' };
    case 'goldenTriangle':
      return {
        lines: goldenTriangleLines(width, height, rotation, flipH, flipV),
        rects: [],
        circles: [],
        spiralPath: '',
      };
    case 'harmoniousTriangle':
      return {
        lines: harmoniousTriangleLines(width, height, rotation, flipH, flipV),
        rects: [],
        circles: [],
        spiralPath: '',
      };
    case 'goldenSpiral':
      return buildSpiralGeometry(overlay, width, height, (squares, pathD) => ({
        lines: [],
        rects: squares,
        circles: [],
        spiralPath: pathD,
      }));
    case 'spiralCircles':
      return buildSpiralGeometry(overlay, width, height, (squares) => ({
        lines: [],
        rects: [],
        circles: squares.map((s) => ({ cx: s.x + s.size / 2, cy: s.y + s.size / 2, r: s.size / 2 })),
        spiralPath: '',
      }));
    case 'spiralDiagonal':
      return buildSpiralGeometry(overlay, width, height, (_squares, _pathD, chain) => ({
        lines: chain.map((arc) => [arc.start, arc.end]) as [Point, Point][],
        rects: [],
        circles: [],
        spiralPath: '',
      }));
    case 'dynamicSymmetry':
      return { lines: dynamicSymmetryLines(width, height), rects: [], circles: [], spiralPath: '' };
    case 'harmonicArmature':
      return { lines: harmonicArmatureLines(width, height), rects: [], circles: [], spiralPath: '' };
  }
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Bounding box of the geometry's own coordinates — arcs/circles are always inscribed within
 * the `rects` they're drawn from, so lines + rects + circles together cover every construction. */
export function computeBounds(geometry: OverlayGeometry, width: number, height: number): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [[x1, y1], [x2, y2]] of geometry.lines) {
    minX = Math.min(minX, x1, x2);
    maxX = Math.max(maxX, x1, x2);
    minY = Math.min(minY, y1, y2);
    maxY = Math.max(maxY, y1, y2);
  }
  for (const r of geometry.rects) {
    minX = Math.min(minX, r.x);
    maxX = Math.max(maxX, r.x + r.size);
    minY = Math.min(minY, r.y);
    maxY = Math.max(maxY, r.y + r.size);
  }
  for (const c of geometry.circles) {
    minX = Math.min(minX, c.cx - c.r);
    maxX = Math.max(maxX, c.cx + c.r);
    minY = Math.min(minY, c.cy - c.r);
    maxY = Math.max(maxY, c.cy + c.r);
  }

  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: width, maxY: height };
  }
  return { minX, minY, maxX, maxY };
}
