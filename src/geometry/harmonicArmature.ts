import type { Point } from './orientation';

/**
 * The classic 14-line harmonic armature: both main diagonals, a line from each corner to
 * the midpoint of each edge it doesn't touch (8 lines), and a diagonal connecting each pair
 * of adjacent edge midpoints (4 lines, tracing the inscribed rhombus). Symmetric by
 * construction, so flip/rotation have no visual effect — same as the rule of thirds and
 * dynamic symmetry overlays.
 */
export function harmonicArmatureLines(width: number, height: number): [Point, Point][] {
  const TL: Point = [0, 0];
  const TR: Point = [width, 0];
  const BR: Point = [width, height];
  const BL: Point = [0, height];
  const TM: Point = [width / 2, 0];
  const BM: Point = [width / 2, height];
  const LM: Point = [0, height / 2];
  const RM: Point = [width, height / 2];

  return [
    [TL, BR],
    [TR, BL],
    [TL, RM],
    [TL, BM],
    [TR, LM],
    [TR, BM],
    [BR, TM],
    [BR, LM],
    [BL, TM],
    [BL, RM],
    [TM, LM],
    [TM, RM],
    [BM, LM],
    [BM, RM],
  ];
}
