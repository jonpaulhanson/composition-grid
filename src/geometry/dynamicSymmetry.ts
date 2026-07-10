import type { Point } from './orientation';

/**
 * v1 Hambidge-style armature: both main diagonals of the full rectangle, plus the two
 * diagonals of each half (split along the shorter axis), producing the repeating lattice
 * of crossing diagonals. Symmetric by construction, so flip/rotation have no visual effect.
 */
export function dynamicSymmetryLines(width: number, height: number): [Point, Point][] {
  const lines: [Point, Point][] = [
    [[0, 0], [width, height]],
    [[width, 0], [0, height]],
  ];

  if (width >= height) {
    const halfW = width / 2;
    lines.push([[0, 0], [halfW, height]]);
    lines.push([[halfW, 0], [0, height]]);
    lines.push([[halfW, 0], [width, height]]);
    lines.push([[width, 0], [halfW, height]]);
  } else {
    const halfH = height / 2;
    lines.push([[0, 0], [width, halfH]]);
    lines.push([[width, 0], [0, halfH]]);
    lines.push([[0, halfH], [width, height]]);
    lines.push([[width, halfH], [0, height]]);
  }

  return lines;
}
