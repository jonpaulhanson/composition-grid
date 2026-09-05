# Composition Armatures

A single-purpose tool for checking an image's composition against classic composition
grids — rule of thirds, golden section, golden triangle, harmonious triangle, golden
spiral (plus two variants), dynamic symmetry, and the harmonic armature. Upload an image,
toggle on one or more grid overlays, adjust their orientation, reduce the picture to flat
value masses, and download the result. Everything runs client-side; the image never leaves
the browser.

Live at [armatures.app](https://armatures.app). (The repo is still named
`composition-grid`, from before the app had a name.)

## Running locally

```bash
npm install
npm run dev
```

Requires Node 20.19+ or 22.12+ (Vite 8). `npm run build` type-checks and builds;
`npm run lint` runs oxlint.

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
    quarter-circle arc. Flip and rotate behave identically across all three since they share
    one geometry function.
- **Dynamic Symmetry** — both main diagonals of the frame, plus the diagonals of each
  half (split along the shorter axis).
- **Harmonic Armature** — the classic 14-line construction: both main diagonals, a line
  from each corner to the midpoint of each edge it doesn't touch (8 lines), and a diagonal
  connecting each pair of adjacent edge midpoints (4 lines, tracing the inscribed rhombus).

Flip and rotation are implemented by relabeling which real corner of the rectangle plays
each role (`src/geometry/orientation.ts`), rather than literally transforming coordinates
— that keeps every construction exact for any W×H instead of distorting non-square images.
A single mirror Flip plus Rotate's four 90° steps reaches all eight orientations, so
there's no second flip control.

The golden-spiral family (Golden Spiral, Golden Circles, Diagonal Spiral) is the only
construction whose bounding box can fall short of an image edge (each square is 61.8% of
the previous one by design, so the first square alone won't always reach the far edge).
It's always centered in whatever gap is left rather than pinned wherever it happened to
start — but never stretched to fill the frame: doing so would scale the two axes
differently, breaking the φ relationship between successive squares that makes the
construction "golden" in the first place, which would defeat the point of overlaying it.
Thirds, golden triangle, and dynamic symmetry always span corner-to-corner already, so
this doesn't come up for them.

### Where the spiral stops being a spiral

Each square's side is capped at the *shorter* dimension of the current rectangle, so past
the golden ratio the largest square is clamped to fill the whole short side. At exactly
**2:1** the leftover after that square is a *perfect square* — there's no oriented golden
rectangle left to keep curling into, and the next square's curve turns the opposite way.
Below 2:1 every square turns the same way; from 2:1 up it doesn't (verified by sweeping
every ratio, rotation and flip). So `SPIRAL_MAX_ASPECT_RATIO = 2` in
`src/geometry/goldenSpiral.ts` is the real boundary rather than a tuned guess — and it's
why no amount of pivot tweaking fixes the wide case: the shape simply isn't a spiral there.

Past that ratio the golden-spiral family is unavailable: their rows are disabled with an
inline note, and an already-active one is automatically turned off if you crop into that
range. This checks the *effective* (post-crop) ratio, not just the uploaded image's own.

### Spiral-only controls

The golden-spiral family gets a "1×/2×/4×" multiplicity control that layers extra copies of
the same construction into one overlay instead of just showing a single spiral: 2× pairs the
current orientation with its horizontal mirror, 4× shows all 4 rotations of the current flip
state at once (a symmetric 4-corner pinwheel). Implemented by generating the underlying
square/arc geometry once per orientation variant and merging the results
(`buildSpiralGeometry` in `src/geometry/index.ts`).

Golden Spiral specifically (not Golden Circles or Diagonal Spiral, which never draw them)
also has a "Squares" toggle for the nested square outlines, **on by default** — the squares
are the construction the curve is drawn from, so showing them makes the overlay read as
geometry rather than a bare arc. This only affects what's drawn (`OverlaySvg.tsx`); the
square geometry is generated and feeds the centering bounding-box math either way, so
toggling it doesn't move the curve.

### Defaults

Uploading an image switches Rule of Thirds on, as the most common starting point (swapping
images mid-session leaves an existing setup alone). Overlay groups start collapsed except
Thirds & Sections, to keep the panel scannable. The golden-ratio family defaults to
rotation 3, which puts the coil's eye in the bottom-right quadrant on a landscape or square
frame without engaging a flip.

## Value: grayscale and notan

The **Value** section, below Overlays, has a three-way mode control — **Off / Grayscale /
Notan** — for judging value structure independent of color.

**Grayscale** is a 0–100% slider. Partial desaturation is often more useful than a hard
switch, letting you dial in how much color to keep while reading values.

**Notan** reduces the picture to flat light and dark — 濃淡 is literally "dark-light", and the
two-value relationship is the whole exercise, so that's deliberately all it does. Two controls:

- **Threshold** — where the split falls; biases the result light or dark.
- **Simplify** — a blur applied *before* thresholding, which groups fine detail into
  readable masses. Without it a notan comes out as speckle rather than shapes. It's
  expressed as a percentage of picture width (not pixels) so it stays the same proportion
  at any preview or export size. The useful range is small — capped at 0.25%, past which
  the masses stop following the picture's actual shapes and turn into blobs.

The whole thing is four CSS filter functions (`src/utils/imageFilter.ts`): reduce to true
luminance, blur, slide the range so the threshold lands at the midpoint, then a contrast high
enough that everything either side of it saturates. That matters beyond brevity — being plain
CSS is what lets the *same string* drive the preview and the export, which hands it straight to
`ctx.filter`. There's no second rendering path to keep in step.

A three- and four-tone posterize lived here for a while. It's a useful exercise, but it's a
value study rather than a notan, and supporting it cost a whole parallel renderer: an SVG
`feComponentTransfer` for the preview (CSS can't flatten a range into N tones), a pixel pass for
the export (a canvas filter can't reliably reference an SVG filter), and shared tone definitions
to stop the two drifting. If it comes back it should be its own mode under its own name.

## Export

Two downloads, both PNG, at the image's **full native resolution** — or the cropped
region's native pixels when a crop is applied:

- **Download image + overlays** — the picture with every active overlay composited in,
  honoring the current crop and value study.
- **Download overlays only** — the same overlay composite on a transparent background.

Overlays are re-serialized from the shared geometry into a single SVG
(`src/utils/exportImage.ts`). Its coordinate system is the *on-screen* overlay box while its
intrinsic size is the output resolution, so stroke weight matches what you were looking at
while still rasterizing crisply at full size; `ImageStage` reports its live overlay box up
for that reference. When a notan blur is active, the source is drawn onto a canvas whose
margins repeat the edge pixels so the blur can't sample past the picture and fade the border
to transparent.

Filenames describe what they contain — overlays in play, a notan marker, and a local
timestamp, e.g. `armatures-rule-of-thirds-golden-spiral-notan-3-20260904-142153.png`. Past
three overlays the list collapses to a count.

## Cropping

The "Crop" button (Image section) enters an editing mode: a draggable rectangle over the
full image with drag-to-move on the rectangle itself, corner handles for resizing both axes
and elongated edge handles for one axis at a time (`CropEditor.tsx`). Handles are sized for
touch, and the stage gains breathing room on entry so a grab near the edge doesn't collide
with an OS swipe gesture. Everything outside the rectangle is dimmed, and active overlays
are live-previewed inside it as it's resized, so you can see how the grid will land before
committing.

Crop state is stored as normalized (0–1) fractions of the image's natural width/height
(`CropRect` in `types.ts`) rather than pixels, so it doesn't need to know the image's size
up front and survives any display size.

Hitting "Apply crop" doesn't touch the uploaded file — it switches the stage to a
letterboxed viewport sized to the crop rectangle's aspect ratio, with the full image scaled
and offset inside it (`overflow: hidden` clips the rest), so the cropped region fills the
frame (`useCropViewport.ts`). Overlays then recompute against that cropped W×H like any
other image, exactly as if you'd uploaded the cropped region directly. "Edit crop" reopens
the rectangle at its last position; "Reset crop" clears it back to the full image.

## Image formats

Upload accepts any browser-displayable image format, plus `.heic`/`.heif` (the default
format for iPhone photos) — which most browsers besides Safari can't decode natively.
HEIC files are converted to JPEG entirely client-side (`heic2any`, a WASM build of
libheif) before display, so the "image never leaves the browser" guarantee still holds.
That decoder is a ~1.3MB dependency, so it's dynamically imported only when a HEIC file is
actually selected (`src/utils/heic.ts`) rather than bundled into the main app — everyone
else's page weight is unaffected.

## Guide pages

Alongside the app, `public/` holds a set of static HTML articles, served at clean URLs.
They're deliberately plain HTML rather than React routes so they're crawlable without
client-side rendering, and they share one stylesheet (`public/article.css`):

- **`/composition-armatures`** — the main guide, and the hub the rest link back to.
- **`/learn/*`** — "what it is" deep dives (rule of thirds, golden ratio, golden triangle,
  dynamic symmetry).
- **`/how-to/*`** — painting-first practical guides: how to actually compose on each
  armature, with jump nav, build steps, common mistakes and FAQ schema.

Their diagrams are generated from the app's own `src/geometry/` code, so the illustrations
can't drift from what the tool draws. `sitemap.xml`, `robots.txt` and `og.jpg` live in
`public/` too.

## Feedback

The header's "Feedback" button opens a modal (`FeedbackModal.tsx`) with a message box and an
optional reply email. Since the app is fully client-side with no backend, submissions POST
directly to [Web3Forms](https://web3forms.com) — a free form-to-email relay — which forwards
each one to your inbox. No server, database, or account dashboard involved.

To enable it, set a single environment variable:

1. Get a free access key from [web3forms.com](https://web3forms.com) (enter the email you
   want feedback delivered to; they email you a key).
2. Copy `.env.example` to `.env.local` and paste the key into `VITE_WEB3FORMS_ACCESS_KEY`
   (git ignores `.env.local`).
3. Add the same `VITE_WEB3FORMS_ACCESS_KEY` variable in your Vercel project settings so
   production picks it up.

The key is read at build time via `import.meta.env` and is safe to ship in client code —
Web3Forms access keys are designed to be public. Until a key is set, the form still opens but
reports that it isn't configured on submit. A hidden honeypot field drops obvious bots.

## Analytics

Vercel Web Analytics (`@vercel/analytics`), chosen because it's cookieless — it needs no
consent banner, which a client-side tool with no accounts shouldn't have to carry. The
`<Analytics />` component covers the app; the static guide pages load the script directly.

`track()` calls mark the moments worth knowing about (upload, overlay added, crop applied,
download, feedback). Custom events are a Vercel Pro feature, so on the Hobby plan only
pageviews are visible — the calls are harmless either way and are left in place.

## Future work

In rough priority order:

- Free-angle rotation (slider) in addition to 90° steps
- Draggable (mouse/touch) grid repositioning and continuous resizing
- Save/recall a favorite overlay combination
- Remaining `/how-to/` guides (harmonious triangle, the spiral family, dynamic symmetry,
  harmonic armature), and real painting examples in place of the generated diagrams

## Out of scope

No accounts, no cloud storage, no multi-image galleries, no non-composition-grid features
(color picking, histograms, etc.).
