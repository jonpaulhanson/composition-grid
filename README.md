# Composition Grid Overlay

A single-purpose tool for checking an image's composition against classic composition
grids — rule of thirds, golden section, golden triangle, harmonious triangle, golden
spiral (plus two variants), dynamic symmetry, and the harmonic armature. Upload an image,
toggle on one or more grid overlays, adjust their orientation, and visually check
alignment. Everything runs client-side; the image never leaves the browser.

## Running locally

```bash
npm install
npm run dev
```

Requires Node 20.19+ or 22.12+ (Vite 8).

## How the grids work

Every overlay is defined algorithmically from the image's displayed width/height and
redrawn live to match — nothing is a stretched reference image, so right angles stay
right angles and the spiral stays a spiral at any aspect ratio. See `src/geometry/` for
the implementation:

- **Rule of Thirds** — two vertical and two horizontal lines at the 1/3 and 2/3 marks.
- **Golden Section** — the same 4-line pattern as rule of thirds, but at 1/φ² and 1/φ
  (≈38.2% and ≈61.8%) instead of exact thirds — lines sit closer together around the
  center than a thirds grid does.
- **Golden Triangle** — one corner-to-corner diagonal, plus a true perpendicular dropped
  from each of the other two corners onto it. Where the feet land shifts with the aspect
  ratio (matching the 1/3 and 2/3 thirds points only for one specific ratio).
- **Harmonious Triangle** — same diagonal, but the other two corners connect straight to
  the diagonal's own 1/3 and 2/3 points instead of a true perpendicular. A rectangle's main
  diagonal always passes exactly through those two points regardless of aspect ratio, so
  the side lines land on real rule-of-thirds points for any image. These two get confused
  for each other constantly online — Wikipedia's "golden triangle" is specifically the
  perpendicular version, so that's the one this app calls Golden Triangle.
- **Golden Spiral** — recursively cuts a square off one end of the rectangle for ~8
  iterations (each side 61.8% of the current longer dimension), inscribing a quarter-circle
  arc in each square. Reduces to the exact classic golden spiral sequence when the image
  happens to be golden-ratio shaped, and still shrinks smoothly for any other ratio.
  - **Golden Circles** and **Diagonal Spiral** are the same square construction
    (`goldenSpiralGeometry` in `src/geometry/goldenSpiral.ts`), just drawn differently: a
    circle inscribed in each square, or a straight chord across each square instead of the
    quarter-circle arc. Flip/rotate/stretch all behave identically across all three since
    they share one geometry function.
- **Dynamic Symmetry** — both main diagonals of the frame, plus the diagonals of each
  half (split along the shorter axis).
- **Harmonic Armature** — the classic 14-line construction: both main diagonals, a line
  from each corner to the midpoint of each edge it doesn't touch (8 lines), and a diagonal
  connecting each pair of adjacent edge midpoints (4 lines, tracing the inscribed rhombus).

Flip and rotation are implemented by relabeling which real corner of the rectangle plays
each role (`src/geometry/orientation.ts`), rather than literally transforming coordinates
— that keeps every construction exact for any W×H instead of distorting non-square images.

The golden-spiral family (Golden Spiral, Golden Circles, Diagonal Spiral) is the only
construction whose bounding box can fall short of an image edge (each square is 61.8% of
the previous one by design, so the first square alone won't always reach the far edge).
Those three get their own "Stretch to fill width" (↔) / "Stretch to fill height" (↕)
toggles that scale the natural bounding box up to the image edge on whichever axis falls
short — never below its natural size, and a no-op on any axis that already reaches the
edge. Off by default, so the construction keeps its true, undistorted proportions and is
centered in whatever gap is left, rather than left pinned wherever it happened to start.
Thirds, golden triangle, and dynamic symmetry always span corner-to-corner already, so
they don't show these controls at all.

The golden-spiral family also gets a "1×/2×/4×" multiplicity control that layers extra
copies of the same construction into one overlay instead of just showing a single spiral:
2× pairs the current orientation with its horizontal mirror, 4× shows all 4 rotations of
the current flip state at once (a symmetric 4-corner pinwheel). Implemented by generating
the underlying square/arc geometry once per orientation variant and merging the results
(`buildSpiralGeometry` in `src/geometry/index.ts`) — stretch-to-fill, if enabled, applies
to the combined bounding box of all copies together, not per-copy.

Golden Spiral specifically (not Golden Circles or Diagonal Spiral, which never draw them)
also has a "▢" toggle for the nested square outlines, off by default (just the curve), on
adds them in. This only affects what's drawn (`OverlaySvg.tsx`) — the square geometry is
still generated and still feeds stretch-to-fill's bounding-box math either way, so hiding
the squares doesn't disable or change stretch behavior.

## Image formats

Upload accepts any browser-displayable image format, plus `.heic`/`.heif` (the default
format for iPhone photos) — which most browsers besides Safari can't decode natively.
HEIC files are converted to JPEG entirely client-side (`heic2any`, a WASM build of
libheif) before display, so the "image never leaves the browser" guarantee still holds.
That decoder is a ~1.3MB dependency, so it's dynamically imported only when a HEIC file is
actually selected (`src/utils/heic.ts`) rather than bundled into the main app — everyone
else's page weight is unaffected.

## Image display controls

A "Grayscale" slider (0–100%) in the Image section desaturates the photo itself — useful
for judging tonal/value structure independent of color. It's a plain CSS `filter:
grayscale()` on the `<img>` element (`ImageStage.tsx`), so it's a display-only change: it
never touches the uploaded file, and has no effect on overlay geometry or colors. A slider
rather than an on/off toggle, since partial desaturation is often more useful than a hard
switch for this — you can dial in how much color to keep while judging values.

## Cropping

The "Crop" button (Image section) enters an editing mode: a draggable rectangle over the
full image, with corner handles for resizing and drag-to-move on the rectangle itself
(`CropEditor.tsx`). Everything outside the rectangle is dimmed, and any active overlays
are live-previewed inside it as it's resized, so you can see how the grid will land before
committing. Crop state is stored as normalized (0–1) fractions of the image's natural
width/height (`CropRect` in `types.ts`) rather than pixels, so it doesn't need to know the
image's size up front and survives any display size.

Hitting "Apply crop" doesn't touch the uploaded file — it switches the stage to a
letterboxed viewport sized to the crop rectangle's aspect ratio, with the full image scaled
and offset inside it (`overflow: hidden` clips the rest), so the cropped region fills the
frame (`useCropViewport.ts`). Overlays then recompute against that cropped W×H like any
other image, exactly as if you'd uploaded the cropped region directly. "Edit crop" reopens
the rectangle at its last position; "Reset crop" clears it back to the full image.

## Future work

Not built in v1, in rough priority order:

- Free-angle rotation (slider) in addition to 90° steps
- Draggable (mouse/touch) grid repositioning and continuous resizing
- Export: flatten the image + active overlays into a downloadable PNG
- Save/recall a favorite overlay combination
- Touch/mobile support

## Out of scope

No accounts, no cloud storage, no multi-image galleries, no non-composition-grid features
(color picking, histograms, etc.).
