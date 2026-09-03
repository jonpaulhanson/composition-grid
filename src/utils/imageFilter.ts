/** Which value study is applied to the image, if any. A notan reduces the picture to flat
 * light/dark masses so the composition's value structure can be judged on its own. */
export type ValueMode = 'off' | 'grayscale' | 'notan';

export interface ValueStudy {
  mode: ValueMode;
  /** Desaturation amount (0-100) for 'grayscale'. */
  grayscale: number;
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
  threshold: 50,
  simplify: 0.1,
};

/**
 * The CSS filter for the current value study, or undefined when the image should render
 * untouched. The same string drives both the live preview (as an element style) and the PNG
 * export (as `ctx.filter`), so the download always matches what's on screen.
 *
 * `referenceWidth` is the width, in the target coordinate space, of the picture being
 * filtered — the on-screen box for the preview, the output pixel width for an export. Blur is
 * measured in pixels, so it has to be derived from that width to stay the same *proportion*
 * of the picture at any resolution.
 */
export function valueBlurPx(study: ValueStudy, referenceWidth: number): number {
  if (study.mode !== 'notan') return 0;
  return Math.max(0, (study.simplify / 100) * referenceWidth);
}

export function buildValueFilter(study: ValueStudy, referenceWidth: number): string | undefined {
  if (study.mode === 'grayscale') {
    return study.grayscale > 0 ? `grayscale(${study.grayscale}%)` : undefined;
  }

  if (study.mode === 'notan') {
    // Clamped away from 0/100, where the brightness multiplier would blow up or flatten the
    // picture to a single value.
    const threshold = Math.min(Math.max(study.threshold, 1), 99) / 100;
    const blur = valueBlurPx(study, referenceWidth);
    // grayscale() reduces to true luminance; blur() groups detail into masses; brightness()
    // slides the split point (luminance crosses 0.5 exactly at `threshold`); and the extreme
    // contrast() snaps everything either side of that to black or white.
    return (
      `grayscale(1)${blur > 0 ? ` blur(${blur.toFixed(2)}px)` : ''}` +
      ` brightness(${(0.5 / threshold).toFixed(4)}) contrast(10000%)`
    );
  }

  return undefined;
}
