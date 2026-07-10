import type { Point } from './orientation';

export function thirdsLines(width: number, height: number): [Point, Point][] {
  const x1 = width / 3;
  const x2 = (2 * width) / 3;
  const y1 = height / 3;
  const y2 = (2 * height) / 3;
  return [
    [[x1, 0], [x1, height]],
    [[x2, 0], [x2, height]],
    [[0, y1], [width, y1]],
    [[0, y2], [width, y2]],
  ];
}
