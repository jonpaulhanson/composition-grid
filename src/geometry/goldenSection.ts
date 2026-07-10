import type { Point } from './orientation';

const PHI_INV = 0.6180339887498949; // 1/φ ≈ 61.8%
const PHI_INV_SQ = 0.3819660112501051; // 1/φ² ≈ 38.2%

/**
 * Same 4-line pattern as the rule of thirds, but at the golden ratio's own division points
 * (38.2% and 61.8%, i.e. 1/φ² and 1/φ) instead of exact thirds — lines sit closer together
 * around the center than a thirds grid does.
 */
export function goldenSectionLines(width: number, height: number): [Point, Point][] {
  const x1 = width * PHI_INV_SQ;
  const x2 = width * PHI_INV;
  const y1 = height * PHI_INV_SQ;
  const y2 = height * PHI_INV;
  return [
    [[x1, 0], [x1, height]],
    [[x2, 0], [x2, height]],
    [[0, y1], [width, y1]],
    [[0, y2], [width, y2]],
  ];
}
