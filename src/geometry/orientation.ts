export type Point = [number, number];
export type Corner = 'TL' | 'TR' | 'BR' | 'BL';

const LABELS: Corner[] = ['TL', 'TR', 'BR', 'BL'];

export interface Orientation {
  /** Real pixel coordinates of the rectangle's corners, relabeled per the current flip/rotation. */
  corners(width: number, height: number): Record<Corner, Point>;
  /** Which real corner currently plays the "start" (logical TL) role. */
  startLabel: Corner;
}

/**
 * Overlays that care about orientation (which corner a diagonal/spiral originates from) are
 * built from the rectangle's 4 real corners, relabeled by flip/rotation rather than by
 * literally transforming coordinates — this keeps every construction exact for any W×H,
 * since a true 90° coordinate rotation would swap W and H and no longer fit the box.
 */
export function resolveOrientation(rotation: number, flipH: boolean, flipV: boolean): Orientation {
  let roleToReal = [0, 1, 2, 3];
  if (flipH) {
    roleToReal = [roleToReal[1], roleToReal[0], roleToReal[3], roleToReal[2]];
  }
  if (flipV) {
    roleToReal = [roleToReal[3], roleToReal[2], roleToReal[1], roleToReal[0]];
  }
  const r = ((rotation % 4) + 4) % 4;
  const rotated = [0, 1, 2, 3].map((i) => roleToReal[(i + r) % 4]);

  return {
    corners: (width, height) => {
      const real: Point[] = [
        [0, 0],
        [width, 0],
        [width, height],
        [0, height],
      ];
      const [TL, TR, BR, BL] = rotated.map((i) => real[i]);
      return { TL, TR, BR, BL };
    },
    startLabel: LABELS[rotated[0]],
  };
}
