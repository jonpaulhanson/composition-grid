import { resolveOrientation } from './orientation';
import type { Point } from './orientation';

function pointAlong(a: Point, b: Point, t: number): Point {
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
}

/**
 * One diagonal (the baseline) plus a line from each of the other two corners to the
 * diagonal's own rule-of-thirds points — the main diagonal of any rectangle always passes
 * exactly through the 1/3 and 2/3 points along itself, regardless of aspect ratio, so this
 * lands the two side lines exactly on real thirds points without needing a fixed ratio.
 */
export function goldenTriangleLines(
  width: number,
  height: number,
  rotation: number,
  flipH: boolean,
  flipV: boolean,
): [Point, Point][] {
  const { corners } = resolveOrientation(rotation, flipH, flipV);
  const { TL, TR, BR, BL } = corners(width, height);
  const nearTL = pointAlong(TL, BR, 1 / 3);
  const nearBR = pointAlong(TL, BR, 2 / 3);
  return [
    [TL, BR],
    [TR, nearBR],
    [BL, nearTL],
  ];
}
