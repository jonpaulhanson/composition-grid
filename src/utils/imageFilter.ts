/** Which value study is applied to the image, if any. A notan reduces the picture to flat
 * light/dark masses so the composition's value structure can be judged on its own. */
export type ValueMode = 'off' | 'grayscale' | 'notan';

/** How many flat tones a notan is reduced to. Two is the classic black-and-white study; three
 * and four keep a midtone mass, which often reads more like a painter's value sketch. */
export const VALUE_LEVELS = [2, 3, 4] as const;
export type ValueLevels = (typeof VALUE_LEVELS)[number];

export interface ValueStudy {
  mode: ValueMode;
  /** Desaturation amount (0-100) for 'grayscale'. */
  grayscale: number;
  /** Number of flat tones for 'notan'. */
  values: ValueLevels;
  /** Where the light/dark split falls, as a percentage of the luminance range. Lower keeps
   * more of the picture white; higher pushes more into black. */
  threshold: number;
  /** Blur applied *before* thresholding, which collapses fine detail into readable masses —
   * without it a notan comes out as speckle rather than shapes. Expressed as a percentage of
   * the picture's width so it stays proportional at any preview or export size. The useful
   * range is small (see SIMPLIFY_MAX): past a fraction of a percent the masses stop following
   * the picture's actual shapes and turn into blobs. */
  simplify: number;
}

/** Slider bounds for `simplify`, in percent of picture width. */
export const SIMPLIFY_MAX = 0.25;
export const SIMPLIFY_STEP = 0.005;

export const DEFAULT_VALUE_STUDY: ValueStudy = {
  mode: 'off',
  grayscale: 100,
  values: 2,
  threshold: 50,
  simplify: 0.1,
};

/**
 * The posterizing step, defined once and shared by both renderers.
 *
 * Luminance is cut into `levels` equal-width bins mapped onto evenly spaced output tones, so
 * at two levels the split lands at 0.5 (the classic notan) and at three or four a midtone
 * band appears. The preview hands this to an SVG `feComponentTransfer` as its discrete
 * `tableValues`; the export walks pixels through `posterizeLut`. Both come from this function,
 * so the two paths cannot drift apart.
 */
export function posterizeBin(value: number, levels: number): number {
  return Math.min(Math.floor(value * levels), levels - 1);
}

/** The exact 0-255 tones an image is flattened to. Both renderers derive from this single
 * list so they can't disagree about what, say, "the midtone" is. */
export function posterizeTones(levels: number): number[] {
  return Array.from({ length: levels }, (_, i) => Math.round((i / (levels - 1)) * 255));
}

/** Discrete `tableValues` for an feComponentTransfer that posterizes to `levels` tones. Full
 * precision, so the browser lands on the same integers the export's lookup uses — a rounded
 * table (0.3333 rather than 1/3) drifts a level off. */
export function posterizeTableValues(levels: number): string {
  return posterizeTones(levels)
    .map((tone) => String(tone / 255))
    .join(' ');
}

/** A 256-entry channel lookup applying the same posterization, for the export's pixel pass. */
export function posterizeLut(levels: number): Uint8Array {
  const tones = posterizeTones(levels);
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    lut[i] = tones[posterizeBin(i / 255, levels)];
  }
  return lut;
}

/** DOM id of the SVG filter that posterizes to `levels` tones (see `ValueFilterDefs`). */
export function posterizeFilterId(levels: number): string {
  return `notan-posterize-${levels}`;
}

/** How far, in pixels, the notan's blur reaches at the given reference width — 0 when no blur
 * applies. Exports need it to know how far the blur reaches past the picture's edges. */
export function valueBlurPx(study: ValueStudy, referenceWidth: number): number {
  if (study.mode !== 'notan') return 0;
  return Math.max(0, (study.simplify / 100) * referenceWidth);
}

/**
 * The tonal half of the filter — everything up to but not including posterization: reduce to
 * true luminance, blur to group detail into masses, then slide the whole range against the
 * fixed posterize bins so `threshold` biases the result light or dark.
 *
 * `referenceWidth` is the width, in the target coordinate space, of the picture being
 * filtered — the on-screen box for the preview, the output pixel width for an export. Blur is
 * measured in pixels, so it has to be derived from that width to stay the same *proportion*
 * of the picture at any resolution.
 *
 * The export stops here and posterizes in a pixel pass, because a canvas `filter` cannot
 * reliably reference an SVG filter across browsers.
 */
export function buildValueToneFilter(study: ValueStudy, referenceWidth: number): string | undefined {
  if (study.mode === 'grayscale') {
    return study.grayscale > 0 ? `grayscale(${study.grayscale}%)` : undefined;
  }

  if (study.mode === 'notan') {
    // Clamped away from 0/100, where the brightness multiplier would blow up or flatten the
    // picture to a single tone.
    const threshold = Math.min(Math.max(study.threshold, 1), 99) / 100;
    const blur = valueBlurPx(study, referenceWidth);
    return (
      `grayscale(1)${blur > 0 ? ` blur(${blur.toFixed(2)}px)` : ''}` +
      ` brightness(${(0.5 / threshold).toFixed(4)})`
    );
  }

  return undefined;
}

/**
 * The complete CSS filter for the live preview, or undefined when the image should render
 * untouched — the tonal steps above followed by a reference to the SVG filter that flattens
 * the result into `values` tones.
 */
export function buildValueFilter(study: ValueStudy, referenceWidth: number): string | undefined {
  const tone = buildValueToneFilter(study, referenceWidth);
  if (study.mode !== 'notan' || !tone) return tone;
  return `${tone} url(#${posterizeFilterId(study.values)})`;
}
