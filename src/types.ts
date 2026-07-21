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
  /** Whether the overlay's geometry stretches to touch the image's edges on whichever axis
   * doesn't already reach them (off = its natural, as-constructed size — never shrunk below
   * that). Only matters for the golden-spiral family (goldenSpiral, spiralCircles,
   * spiralDiagonal): one axis of their natural bounding box always already spans edge-to-edge
   * — provably, for every aspect ratio, rotation, flip, and multiplicity — so a single flag
   * (rather than separate X/Y toggles) is enough; it's a no-op on whichever axis is already full. */
  stretch: boolean;
  /** How many rotated/mirrored copies of the construction to layer into this one overlay.
   * 2 = the current orientation plus its horizontal mirror; 4 = all 4 rotations of the
   * current flip state. Only meaningful for the golden-spiral family. */
  multiplicity: 1 | 2 | 4;
  /** Whether to draw the nested square outlines alongside the spiral curve. Only meaningful
   * for 'goldenSpiral' — the other two spiral variants never draw squares in the first place. */
  showSquares: boolean;
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
 * control (see `stretch` above). */
export const SPIRAL_FAMILY: OverlayType[] = ['goldenSpiral', 'spiralCircles', 'spiralDiagonal'];

export interface OverlayGroup {
  label: string;
  types: OverlayType[];
}

/** How the overlay toggles are organized into collapsible groups in the control panel.
 * Grouped by construction family so related armatures sit together and the list stays
 * scannable (one row per overlay). Every OverlayType must appear in exactly one group. */
export const OVERLAY_GROUPS: OverlayGroup[] = [
  { label: 'Thirds & Sections', types: ['thirds', 'goldenSection'] },
  { label: 'Triangles', types: ['goldenTriangle', 'harmoniousTriangle'] },
  { label: 'Golden Spiral', types: ['goldenSpiral', 'spiralCircles', 'spiralDiagonal'] },
  { label: 'Armatures', types: ['dynamicSymmetry', 'harmonicArmature'] },
];

/** Overlay types that are symmetric under flip/rotation — flip H, flip V, and rotate all
 * produce the exact same lines, so these don't show orientation controls at all. */
export const ORIENTATION_INVARIANT: OverlayType[] = [
  'thirds',
  'goldenSection',
  'dynamicSymmetry',
  'harmonicArmature',
];

export const COLOR_PRESETS = ['#000000', '#e63946', '#ffffff'] as const;

/** A crop rectangle in normalized (0-1) fractions of the image's natural width/height —
 * independent of actual pixel dimensions, so a default "full frame" rect doesn't require
 * knowing the image's size, and it survives being recomputed against any display size. */
export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const FULL_CROP: CropRect = { x: 0, y: 0, w: 1, h: 1 };

export function createDefaultOverlay(type: OverlayType): OverlayState {
  return {
    type,
    flipH: false,
    flipV: false,
    rotation: 0,
    color: COLOR_PRESETS[0],
    opacity: 1.00,
    strokeWidth: 2.75, // midpoint of the 0.5-5 thickness slider range
    stretch: false,
    multiplicity: 1,
    showSquares: false,
  };
}
