import { buildOverlayGeometry, computeBounds } from '../geometry';
import type { OverlayState } from '../types';

interface OverlaySvgProps {
  overlay: OverlayState;
  width: number;
  height: number;
}

export function OverlaySvg({ overlay, width, height }: OverlaySvgProps) {
  const geometry = buildOverlayGeometry(overlay, width, height);
  const { lines, rects, circles, spiralPath } = geometry;
  const { color, opacity, strokeWidth, stretchX, stretchY } = overlay;

  // Most constructions (thirds, golden triangle, dynamic symmetry) already span corner to
  // corner. The golden spiral's first square is only 61.8% of the longer side by design (to
  // keep every square strictly smaller than the last), so its bounding box can fall short of
  // the image edges. Stretching maps that natural bounding box onto the full image — it never
  // shrinks anything that already fills the frame, since scale is 1 whenever bounds already
  // match width/height. On any axis left unstretched (ratio locked), the natural-size bounding
  // box is centered rather than left wherever the construction happened to anchor it — which
  // is a no-op on axes that already fill the frame, since there's no gap left to center within.
  const bounds = computeBounds(geometry, width, height);
  const boundsWidth = bounds.maxX - bounds.minX;
  const boundsHeight = bounds.maxY - bounds.minY;
  const scaleX = stretchX && boundsWidth > 0 ? width / boundsWidth : 1;
  const scaleY = stretchY && boundsHeight > 0 ? height / boundsHeight : 1;
  const translateX = stretchX ? -bounds.minX : (width - boundsWidth) / 2 - bounds.minX;
  const translateY = stretchY ? -bounds.minY : (height - boundsHeight) / 2 - bounds.minY;
  const transform = `scale(${scaleX} ${scaleY}) translate(${translateX} ${translateY})`;

  return (
    <svg
      className="overlay-svg"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
    >
      <g
        transform={transform}
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      >
        {lines.map(([[x1, y1], [x2, y2]], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.size} height={r.size} />
        ))}
        {circles.map((c, i) => (
          <circle key={i} cx={c.cx} cy={c.cy} r={c.r} />
        ))}
        {spiralPath && <path d={spiralPath} strokeWidth={strokeWidth * 1.4} strokeLinejoin="round" />}
      </g>
    </svg>
  );
}
