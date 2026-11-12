import type { CropRect } from '../types';

export type CropRatioId = 'free' | 'original' | '1:1' | '5:4' | '4:3' | '3:2' | '16:9' | 'golden';

interface CropRatioDef {
  id: CropRatioId;
  /** Long side : short side. Orientation is chosen separately, so each proportion is listed
   * once rather than as a landscape/portrait pair. Absent for the two that aren't a fixed
   * proportion. */
  sides?: [number, number];
  label?: string;
  hint?: string;
}

const PHI = (1 + Math.sqrt(5)) / 2;

/** The proportions pictures actually get made in: square, the common canvas and paper sizes
 * (5:4 is 8×10 and 16×20, 4:3 is 9×12 and 18×24, 3:2 is 24×36 and the 35mm frame), widescreen,
 * and the golden rectangle — the frame the golden-ratio overlays are built from. */
export const CROP_RATIOS: CropRatioDef[] = [
  { id: 'free', label: 'Free', hint: 'No fixed proportion' },
  { id: 'original', label: 'Original', hint: 'The image’s own proportion' },
  { id: '1:1', sides: [1, 1] },
  { id: '5:4', sides: [5, 4] },
  { id: '4:3', sides: [4, 3] },
  { id: '3:2', sides: [3, 2] },
  { id: '16:9', sides: [16, 9] },
  { id: 'golden', sides: [PHI, 1], label: 'Golden', hint: 'Golden rectangle, 1.618 : 1' },
];

const RATIO_BY_ID = new Map(CROP_RATIOS.map((r) => [r.id, r]));

/** Whether portrait/landscape means anything for this choice. */
export function isOrientable(id: CropRatioId): boolean {
  const sides = RATIO_BY_ID.get(id)?.sides;
  return sides !== undefined && sides[0] !== sides[1];
}

export function cropRatioLabel(id: CropRatioId, portrait: boolean): string {
  const def = RATIO_BY_ID.get(id);
  if (!def) return id;
  if (def.label) return def.label;
  const [long, short] = def.sides ?? [1, 1];
  return portrait ? `${short}:${long}` : `${long}:${short}`;
}

export function cropRatioHint(id: CropRatioId): string | undefined {
  return RATIO_BY_ID.get(id)?.hint;
}

/**
 * The lock a ratio choice puts on the crop rectangle, or null for a free crop.
 *
 * A crop rect is stored as fractions of the image, so the lock is expressed the same way: the
 * w/h the *fractions* must keep for the crop's pixels to come out at the chosen proportion.
 * That's the proportion divided by the image's own — which is why 'original' is simply 1.
 */
export function cropRatioLock(
  id: CropRatioId,
  portrait: boolean,
  natural: { width: number; height: number },
): number | null {
  if (id === 'free' || natural.width <= 0 || natural.height <= 0) return null;
  if (id === 'original') return 1;
  const [long, short] = RATIO_BY_ID.get(id)?.sides ?? [1, 1];
  const pixelRatio = portrait ? short / long : long / short;
  return (pixelRatio * natural.height) / natural.width;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Reshape a crop to a locked ratio. It keeps the crop's centre and, as far as the image
 * allows, its area — so picking a ratio reshapes the region you'd framed rather than jumping
 * to the largest crop the image can hold, and flicking between ratios doesn't shrink it a
 * little more each time. A crop too big to hold its area at the new shape (the untouched
 * full-frame one, typically) is scaled down to the largest that fits.
 */
export function fitCropToLock(rect: CropRect, lock: number): CropRect {
  let h = Math.sqrt((rect.w * rect.h) / lock);
  let w = h * lock;
  const scale = Math.min(1, 1 / w, 1 / h);
  w *= scale;
  h *= scale;
  return {
    x: clamp(rect.x + rect.w / 2 - w / 2, 0, 1 - w),
    y: clamp(rect.y + rect.h / 2 - h / 2, 0, 1 - h),
    w,
    h,
  };
}

/** Whether a crop already has the locked shape, give or take rounding. */
export function matchesLock(rect: CropRect, lock: number): boolean {
  return Math.abs(rect.w / rect.h / lock - 1) < 0.005;
}
