export type OverlayType =
  | 'thirds'
  | 'goldenSection'
  | 'goldenTriangle'
  | 'harmoniousTriangle'
  | 'goldenSpiral'
  | 'spiralCircles'
  | 'spiralDiagonal'
  | 'dynamicSymmetry'
  | 'harmonicArmature';

export interface OverlayState {
  type: OverlayType;
  flipH: boolean;
  flipV: boolean;
  rotation: 0 | 1 | 2 | 3;
  color: string;
  opacity: number;
  strokeWidth: number;
  /** Whether the overlay's geometry stretches to touch the image's left/right edges (off = its
   * natural, as-constructed width — never shrunk below that). Only matters for the golden-spiral
   * family (goldenSpiral, spiralCircles, spiralDiagonal), which don't always span edge-to-edge. */
  stretchX: boolean;
  /** Same as `stretchX`, for the image's top/bottom edges. */
  stretchY: boolean;
}

export interface OverlayDef {
  type: OverlayType;
  label: string;
}

export const OVERLAY_DEFS: OverlayDef[] = [
  { type: 'thirds', label: 'Rule of Thirds' },
  { type: 'goldenSection', label: 'Golden Section' },
  { type: 'goldenTriangle', label: 'Golden Triangle' },
  { type: 'harmoniousTriangle', label: 'Harmonious Triangle' },
  { type: 'goldenSpiral', label: 'Golden Spiral' },
  { type: 'spiralCircles', label: 'Golden Circles' },
  { type: 'spiralDiagonal', label: 'Diagonal Spiral' },
  { type: 'dynamicSymmetry', label: 'Dynamic Symmetry' },
  { type: 'harmonicArmature', label: 'Harmonic Armature' },
];

/** Overlay types built from the same golden-spiral square construction — these are the only
 * ones whose bounding box can fall short of the image edge, so only they show the stretch
 * controls (see `stretchX`/`stretchY` above). */
export const SPIRAL_FAMILY: OverlayType[] = ['goldenSpiral', 'spiralCircles', 'spiralDiagonal'];

/** Overlay types that are symmetric under flip/rotation — flip H, flip V, and rotate all
 * produce the exact same lines, so these don't show orientation controls at all. */
export const ORIENTATION_INVARIANT: OverlayType[] = [
  'thirds',
  'goldenSection',
  'dynamicSymmetry',
  'harmonicArmature',
];

export const COLOR_PRESETS = ['#000000', '#e63946', '#ffffff'] as const;

export function createDefaultOverlay(type: OverlayType): OverlayState {
  return {
    type,
    flipH: false,
    flipV: false,
    rotation: 0,
    color: COLOR_PRESETS[0],
    opacity: 1.00,
    strokeWidth: 2.75, // midpoint of the 0.5-5 thickness slider range
    stretchX: false,
    stretchY: false,
  };
}
