import { resolveOrientation } from './orientation';
import type { Corner, Point } from './orientation';

const ORDER: Corner[] = ['TL', 'TR', 'BR', 'BL'];
const PHI_INV = 0.6180339887498949; // 1/φ

/** The aspect ratio (long side ÷ short side) at and beyond which the construction can no
 * longer read as a spiral. Past the golden ratio, the largest square is clamped to fill the
 * whole short side (like a flex item stretching to fill the cross axis); at exactly 2:1 the
 * leftover after that square is a *perfect square*, so there's no oriented golden rectangle
 * left to keep curling into and the next square's curve flips the opposite way. Below 2:1
 * every square turns the same way (verified by sweep across all ratios/rotations/flips);
 * from 2:1 up it doesn't. So 2 is the true boundary, not a tuned guess — and it's why no
 * amount of pivot tweaking fixes the wide case: the shape simply isn't a spiral there. */
export const SPIRAL_MAX_ASPECT_RATIO = 2;

/** Whether a golden-spiral-family overlay still reads as a spiral at this width/height —
 * see `SPIRAL_MAX_ASPECT_RATIO`. Strict `<` since exactly 2:1 is already degenerate. */
export function isSpiralViable(width: number, height: number): boolean {
  if (width <= 0 || height <= 0) return true;
  const ratio = Math.max(width, height) / Math.min(width, height);
  return ratio < SPIRAL_MAX_ASPECT_RATIO;
}

function cornerPoints(x: number, y: number, size: number): Record<Corner, Point> {
  return {
    TL: [x, y],
    TR: [x + size, y],
    BR: [x + size, y + size],
    BL: [x, y + size],
  };
}

function closeEnough(a: Point, b: Point, eps = 1e-2): boolean {
  return Math.abs(a[0] - b[0]) < eps && Math.abs(a[1] - b[1]) < eps;
}

function labelOfPoint(pts: Record<Corner, Point>, p: Point): Corner {
  return ORDER.find((label) => closeEnough(pts[label], p)) ?? 'TL';
}

function onRectBoundary(p: Point, rect: { x: number; y: number; w: number; h: number }): boolean {
  const eps = 1e-2;
  const onVertical =
    (Math.abs(p[0] - rect.x) < eps || Math.abs(p[0] - (rect.x + rect.w)) < eps) &&
    p[1] >= rect.y - eps &&
    p[1] <= rect.y + rect.h + eps;
  const onHorizontal =
    (Math.abs(p[1] - rect.y) < eps || Math.abs(p[1] - (rect.y + rect.h)) < eps) &&
    p[0] >= rect.x - eps &&
    p[0] <= rect.x + rect.w + eps;
  return onVertical || onHorizontal;
}

/** Angle (in degrees, 0-360) swept from point `from` to point `to` around `center`, going
 * in the increasing-atan2 direction — matches how `sweepFlag` below picks the minor arc. */
function arcMidpoint(center: Point, from: Point, to: Point, radius: number): Point {
  const a1 = Math.atan2(from[1] - center[1], from[0] - center[0]);
  const a2 = Math.atan2(to[1] - center[1], to[0] - center[0]);
  let diff = ((a2 - a1) * 180) / Math.PI;
  diff = ((diff % 360) + 360) % 360;
  const sweep = diff <= 180 ? diff : diff - 360;
  const midAngle = a1 + ((sweep * Math.PI) / 180) / 2;
  return [center[0] + radius * Math.cos(midAngle), center[1] + radius * Math.sin(midAngle)];
}

export interface SpiralSquare {
  x: number;
  y: number;
  size: number;
}

export interface ChainedArc {
  center: Point;
  start: Point;
  end: Point;
  radius: number;
}

export interface SpiralGeometry {
  squares: SpiralSquare[];
  /** One entry per square, in order — the arc that square's curve occupies. Consecutive
   * entries share an endpoint (chain[i].end === chain[i+1].start), so alternate renderings
   * (e.g. straight chords instead of arcs) chain together the same way `pathD` does. */
  chain: ChainedArc[];
  pathD: string;
}

/**
 * Each square's side is 61.8% of the current rectangle's longer dimension (capped at the
 * shorter dimension, since a square can never exceed it) rather than literally the largest
 * possible square. Cutting the literal largest square every time is geometrically equivalent
 * to the Euclidean algorithm, which repeats the same size several iterations in a row for
 * any "round" aspect ratio (9:12, 8:10, 5:7 — exactly the ratios standard art paper comes
 * in) instead of shrinking — this decays smoothly for any aspect ratio and still reduces to
 * the exact classic golden spiral sequence when the rectangle is golden-ratio shaped.
 *
 * When the golden-ratio size is smaller than the rect's shorter dimension, the square only
 * covers part of that axis too, so the tracking rectangle's off-axis dimension shrinks down
 * to match the square (discarding a thin sliver along that edge permanently) — this keeps
 * every step a clean, non-L-shaped rectangle instead of an unshrinking leftover strip.
 */
export function goldenSpiralGeometry(
  width: number,
  height: number,
  rotation: number,
  flipH: boolean,
  flipV: boolean,
  iterations = 8,
): SpiralGeometry {
  const { startLabel } = resolveOrientation(rotation, flipH, flipV);

  const squares: SpiralSquare[] = [];
  const chain: ChainedArc[] = [];
  let rect = { x: 0, y: 0, w: width, h: height };
  let entry: Point | null = null;

  for (let i = 0; i < iterations; i++) {
    const naturalMax = Math.max(rect.w, rect.h);
    const naturalMin = Math.min(rect.w, rect.h);
    const size = Math.min(PHI_INV * naturalMax, naturalMin);
    if (size < 5) break;

    let square: SpiralSquare;
    let newRect: typeof rect;
    if (rect.w >= rect.h) {
      const isLeft = entry ? Math.abs(entry[0] - rect.x) < 1e-2 : startLabel === 'TL' || startLabel === 'BL';
      const isTop = entry ? Math.abs(entry[1] - rect.y) < 1e-2 : startLabel === 'TL' || startLabel === 'TR';
      const x = isLeft ? rect.x : rect.x + rect.w - size;
      const y = isTop ? rect.y : rect.y + rect.h - size;
      square = { x, y, size };
      newRect = { x: isLeft ? rect.x + size : rect.x, y, w: rect.w - size, h: size };
    } else {
      const isTop = entry ? Math.abs(entry[1] - rect.y) < 1e-2 : startLabel === 'TL' || startLabel === 'TR';
      const isLeft = entry ? Math.abs(entry[0] - rect.x) < 1e-2 : startLabel === 'TL' || startLabel === 'BL';
      const y = isTop ? rect.y : rect.y + rect.h - size;
      const x = isLeft ? rect.x : rect.x + rect.w - size;
      square = { x, y, size };
      newRect = { x, y: isTop ? rect.y + size : rect.y, w: size, h: rect.h - size };
    }

    const pts = cornerPoints(square.x, square.y, square.size);

    // Pivot is one of the two corners adjacent to the entry point (or, for the first square,
    // adjacent to startLabel). Both choices connect the same two endpoints but curl opposite
    // ways — pick whichever bulges *away* from the upcoming remainder rectangle, so the curve
    // hugs the outside and leaves the inside clear for the next, smaller square to nest into.
    // (The naive alternative — a fixed clockwise/counterclockwise rule — breaks for whichever
    // corner labels aren't the one it was tuned against, since sometimes "clockwise" points the
    // arc into the remainder instead of around it.)
    const entryLabel = entry ? labelOfPoint(pts, entry) : startLabel;
    const entryIdx = ORDER.indexOf(entryLabel);
    const pivotCandidates: Corner[] = [ORDER[(entryIdx + 1) % 4], ORDER[(entryIdx + 3) % 4]];
    const newRectCenter: Point = [newRect.x + newRect.w / 2, newRect.y + newRect.h / 2];
    let pivotLabel = pivotCandidates[0];
    let bestDist = -Infinity;
    for (const candidate of pivotCandidates) {
      const idx = ORDER.indexOf(candidate);
      const p1 = pts[ORDER[(idx + 1) % 4]];
      const p2 = pts[ORDER[(idx + 3) % 4]];
      const mid = arcMidpoint(pts[candidate], p1, p2, size);
      const dist = Math.hypot(mid[0] - newRectCenter[0], mid[1] - newRectCenter[1]);
      if (dist > bestDist) {
        bestDist = dist;
        pivotLabel = candidate;
      }
    }

    const idx = ORDER.indexOf(pivotLabel);
    const cand1 = pts[ORDER[(idx + 1) % 4]];
    const cand2 = pts[ORDER[(idx + 3) % 4]];

    let start: Point;
    let end: Point;
    if (entry) {
      start = entry;
      end = closeEnough(cand1, entry) ? cand2 : cand1;
    } else if (onRectBoundary(cand1, newRect) && !onRectBoundary(cand2, newRect)) {
      start = cand2;
      end = cand1;
    } else if (onRectBoundary(cand2, newRect) && !onRectBoundary(cand1, newRect)) {
      start = cand1;
      end = cand2;
    } else {
      start = cand1;
      end = cand2;
    }

    squares.push(square);
    chain.push({ center: pts[pivotLabel], start, end, radius: size });
    entry = end;
    rect = newRect;
  }

  return { squares, chain, pathD: buildPath(chain) };
}

function buildPath(chain: ChainedArc[]): string {
  if (chain.length === 0) return '';
  const first = chain[0];
  let d = `M ${first.start[0]} ${first.start[1]}`;
  for (const arc of chain) {
    d += ` A ${arc.radius} ${arc.radius} 0 0 ${sweepFlag(arc)} ${arc.end[0]} ${arc.end[1]}`;
  }
  return d;
}

function sweepFlag(arc: ChainedArc): 0 | 1 {
  const a1 = Math.atan2(arc.start[1] - arc.center[1], arc.start[0] - arc.center[0]);
  const a2 = Math.atan2(arc.end[1] - arc.center[1], arc.end[0] - arc.center[0]);
  let diff = ((a2 - a1) * 180) / Math.PI;
  diff = ((diff % 360) + 360) % 360;
  return diff <= 180 ? 1 : 0;
}
