import { resolveOrientation } from './orientation';
import type { Point } from './orientation';

function footOfPerpendicular(a: Point, b: Point, p: Point): Point {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const apx = p[0] - a[0];
  const apy = p[1] - a[1];
  const lenSq = abx * abx + aby * aby;
  const t = lenSq === 0 ? 0 : (apx * abx + apy * aby) / lenSq;
  return [a[0] + t * abx, a[1] + t * aby];
}

/**
 * One diagonal (the baseline) plus a true perpendicular dropped from each of the other two
 * corners onto it — the classic three-line golden triangle. Works for any aspect ratio
 * because it's a perpendicular construction, not a ratio-dependent template. Where the feet
 * land depends on the aspect ratio (matching the 1/3 and 2/3 thirds points only for one
 * specific ratio); see harmoniousTriangle.ts for the variant that always lands on those
 * exact thirds points instead.
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
  const footFromTR = footOfPerpendicular(TL, BR, TR);
  const footFromBL = footOfPerpendicular(TL, BR, BL);
  return [
    [TL, BR],
    [TR, footFromTR],
    [BL, footFromBL],
  ];
}
