import { buildOverlayGeometry, computeBounds } from '../geometry';
import { OVERLAY_DEFS } from '../types';
import type { CropRect, OverlayState } from '../types';
import { buildValueFilter, valueBlurPx } from './imageFilter';
import type { ValueMode, ValueStudy } from './imageFilter';

export type ExportMode = 'composite' | 'overlay';

const OVERLAY_SLUGS = new Map(
  OVERLAY_DEFS.map((d) => [d.type, d.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')]),
);

function timestamp(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}` +
    `-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
  );
}

/** A descriptive download name: the overlays in play (up to three, else a count) plus a local
 * timestamp — e.g. `armatures-rule-of-thirds-golden-spiral-20260805-143205.png`, or with an
 * `-overlay` marker for the transparent version. */
export function buildExportFilename(
  mode: ExportMode,
  overlays: OverlayState[],
  valueMode: ValueMode = 'off',
): string {
  const slugs = overlays.map((o) => OVERLAY_SLUGS.get(o.type)).filter((s): s is string => Boolean(s));
  let names = '';
  if (slugs.length > 0 && slugs.length <= 3) names = slugs.join('-');
  else if (slugs.length > 3) names = `${slugs.length}-overlays`;
  const parts = [
    'armatures',
    names,
    valueMode === 'notan' ? 'notan' : '',
    mode === 'overlay' ? 'overlay' : '',
    timestamp(),
  ].filter(Boolean);
  return `${parts.join('-')}.png`;
}

export interface DisplayBox {
  width: number;
  height: number;
}

export interface ExportOptions {
  mode: ExportMode;
  imageUrl: string;
  /** The image's natural pixel dimensions. */
  natural: { width: number; height: number };
  /** Active crop as normalized fractions, or null for the full frame. */
  crop: CropRect | null;
  valueStudy: ValueStudy;
  overlays: OverlayState[];
  /** The on-screen rendered size of the overlay box, used as the geometry/stroke reference so
   * the exported line weight matches what the user sees regardless of output resolution. */
  displayBox: DisplayBox;
}

/** Serialize one overlay's construction to an SVG `<g>` — mirrors the live `OverlaySvg`
 * component (same geometry, bounds-centering, and stroke attributes) so the export is a
 * pixel-faithful copy of the preview. */
function overlayGroupMarkup(overlay: OverlayState, width: number, height: number): string {
  const geometry = buildOverlayGeometry(overlay, width, height);
  const { lines, rects, circles, spiralPath } = geometry;
  const { color, opacity, strokeWidth } = overlay;
  const drawSquares = overlay.type !== 'goldenSpiral' || overlay.showSquares;

  const bounds = computeBounds(geometry, width, height);
  const boundsWidth = bounds.maxX - bounds.minX;
  const boundsHeight = bounds.maxY - bounds.minY;
  const translateX = (width - boundsWidth) / 2 - bounds.minX;
  const translateY = (height - boundsHeight) / 2 - bounds.minY;

  const parts: string[] = [];
  for (const [[x1, y1], [x2, y2]] of lines) {
    parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`);
  }
  if (drawSquares) {
    for (const r of rects) {
      parts.push(`<rect x="${r.x}" y="${r.y}" width="${r.size}" height="${r.size}"/>`);
    }
  }
  for (const c of circles) {
    parts.push(`<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}"/>`);
  }
  if (spiralPath) {
    parts.push(`<path d="${spiralPath}" stroke-width="${strokeWidth * 1.4}" stroke-linejoin="round"/>`);
  }

  return (
    `<g transform="translate(${translateX} ${translateY})" stroke="${color}" ` +
    `stroke-opacity="${opacity}" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round">` +
    parts.join('') +
    `</g>`
  );
}

/** All selected overlays composited into a single standalone SVG. `geomW/geomH` set the
 * coordinate system (kept at the on-screen box size so stroke width reads identically);
 * `renderW/renderH` set the SVG's intrinsic pixel size so the browser rasterizes it crisply at
 * the output resolution. */
export function buildOverlaySvgMarkup(
  overlays: OverlayState[],
  geomW: number,
  geomH: number,
  renderW: number,
  renderH: number,
): string {
  const groups = overlays.map((o) => overlayGroupMarkup(o, geomW, geomH)).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${geomW} ${geomH}" ` +
    `width="${renderW}" height="${renderH}">${groups}</svg>`
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image for export'));
    img.src = src;
  });
}

async function rasterizeSvg(markup: string): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
  try {
    return await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Render the requested export to a PNG blob. For 'composite' the source image is drawn first
 * (honoring the crop + value study the user is viewing), then the overlays on top; for 'overlay'
 * only the overlays are drawn, leaving a transparent background. */
export async function renderExportBlob(opts: ExportOptions): Promise<Blob> {
  const { mode, imageUrl, natural, crop, valueStudy, overlays, displayBox } = opts;

  const cropX = crop?.x ?? 0;
  const cropY = crop?.y ?? 0;
  const cropW = crop?.w ?? 1;
  const cropH = crop?.h ?? 1;
  const outW = Math.max(1, Math.round(natural.width * cropW));
  const outH = Math.max(1, Math.round(natural.height * cropH));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser');

  if (mode === 'composite') {
    const src = await loadImage(imageUrl);
    const srcX = cropX * natural.width;
    const srcY = cropY * natural.height;
    const srcW = natural.width * cropW;
    const srcH = natural.height * cropH;
    // Derived from the output width so the notan's blur stays the same proportion of the
    // picture as it is on screen.
    const filter = buildValueFilter(valueStudy, outW);
    const blur = valueBlurPx(valueStudy, outW);

    if (filter && blur > 0) {
      // A blur samples past the picture's edges, where there is nothing — which would fade
      // the border to transparent and, once thresholded, leave a halo. Render onto a canvas
      // whose margins repeat the edge pixels, blur that, and let the margin fall outside the
      // output. A gaussian is spent by ~3 radii, so that's how wide the margin needs to be.
      const margin = Math.ceil(blur * 3);
      const padded = document.createElement('canvas');
      padded.width = outW + margin * 2;
      padded.height = outH + margin * 2;
      const pctx = padded.getContext('2d');
      if (!pctx) throw new Error('Canvas is not supported in this browser');
      pctx.drawImage(src, srcX, srcY, srcW, srcH, margin, margin, outW, outH);
      // Stretch the outermost row/column of the drawn picture out into each margin.
      pctx.drawImage(padded, margin, margin, outW, 1, margin, 0, outW, margin);
      pctx.drawImage(padded, margin, margin + outH - 1, outW, 1, margin, margin + outH, outW, margin);
      pctx.drawImage(padded, margin, 0, 1, padded.height, 0, 0, margin, padded.height);
      pctx.drawImage(padded, margin + outW - 1, 0, 1, padded.height, margin + outW, 0, margin, padded.height);
      // Drawn whole (not via a source rect, which would crop the padding away before the
      // filter ran) and offset so the margin lands outside the canvas.
      ctx.filter = filter;
      ctx.drawImage(padded, -margin, -margin);
    } else {
      if (filter) ctx.filter = filter;
      ctx.drawImage(src, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
    }
    ctx.filter = 'none';
  }

  if (overlays.length > 0 && displayBox.width > 0 && displayBox.height > 0) {
    const overlayImg = await rasterizeSvg(
      buildOverlaySvgMarkup(overlays, displayBox.width, displayBox.height, outW, outH),
    );
    ctx.drawImage(overlayImg, 0, 0, outW, outH);
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode PNG'))),
      'image/png',
    );
  });
}

/** Trigger a browser download of a blob under the given filename. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
