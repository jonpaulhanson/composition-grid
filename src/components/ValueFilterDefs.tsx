import { VALUE_LEVELS, posterizeFilterId, posterizeTableValues } from '../utils/imageFilter';

/**
 * The SVG filters the notan preview references by id. A CSS `filter` chain can reduce the
 * image to luminance, blur it and bias it, but it has no function that flattens a continuous
 * range into a fixed number of tones — that needs an feComponentTransfer, which only exists
 * as a referenced SVG filter.
 *
 * Rendered once, near the root, so the ids resolve wherever the stage image lives. Kept in the
 * layout at zero size rather than `display: none`, which can stop a browser resolving the
 * reference at all. `colorInterpolationFilters="sRGB"` matters: the SVG default is linearRGB,
 * which would put the tone boundaries somewhere other than where the preview and export agree.
 */
export function ValueFilterDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        {VALUE_LEVELS.map((levels) => {
          const table = posterizeTableValues(levels);
          return (
            <filter key={levels} id={posterizeFilterId(levels)} colorInterpolationFilters="sRGB">
              <feComponentTransfer>
                <feFuncR type="discrete" tableValues={table} />
                <feFuncG type="discrete" tableValues={table} />
                <feFuncB type="discrete" tableValues={table} />
              </feComponentTransfer>
            </filter>
          );
        })}
      </defs>
    </svg>
  );
}
