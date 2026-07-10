# Composition Grid Overlay

A single-purpose tool for checking an image's composition against classic composition
grids — rule of thirds, golden triangle, golden spiral (plus two variants), dynamic
symmetry, and the harmonic armature. Upload an image, toggle on one or more grid overlays,
adjust their orientation, and visually check alignment. Everything runs client-side; the
image never leaves the browser.

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
- **Golden Triangle** — one corner-to-corner diagonal, plus a line from each of the other
  two corners to the diagonal's own 1/3 and 2/3 points. A rectangle's main diagonal always
  passes exactly through those two points regardless of aspect ratio, so the side lines
  land on real rule-of-thirds points for any image.
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
