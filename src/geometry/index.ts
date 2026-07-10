import type { OverlayState } from '../types';
import type { Point } from './orientation';
import { thirdsLines } from './thirds';
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

export function buildOverlayGeometry(overlay: OverlayState, width: number, height: number): OverlayGeometry {
  const { type, rotation, flipH, flipV } = overlay;

  switch (type) {
    case 'thirds':
      return { lines: thirdsLines(width, height), rects: [], circles: [], spiralPath: '' };
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
    case 'goldenSpiral': {
      const { squares, pathD } = goldenSpiralGeometry(width, height, rotation, flipH, flipV);
      return { lines: [], rects: squares, circles: [], spiralPath: pathD };
    }
    case 'spiralCircles': {
      const { squares } = goldenSpiralGeometry(width, height, rotation, flipH, flipV);
      const circles = squares.map((s) => ({ cx: s.x + s.size / 2, cy: s.y + s.size / 2, r: s.size / 2 }));
      return { lines: [], rects: [], circles, spiralPath: '' };
    }
    case 'spiralDiagonal': {
      const { chain } = goldenSpiralGeometry(width, height, rotation, flipH, flipV);
      const lines: [Point, Point][] = chain.map((arc) => [arc.start, arc.end]);
      return { lines, rects: [], circles: [], spiralPath: '' };
    }
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
