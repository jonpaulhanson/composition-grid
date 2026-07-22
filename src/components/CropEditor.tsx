import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { SPIRAL_FAMILY } from '../types';
import type { CropRect, OverlayState } from '../types';
import type { ImageBox } from '../hooks/useImageBox';
import { isSpiralViable } from '../geometry/goldenSpiral';
import { OverlaySvg } from './OverlaySvg';

interface CropEditorProps {
  box: ImageBox;
  draft: CropRect;
  onChange: (rect: CropRect) => void;
  overlays: OverlayState[];
}

type DragMode = 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w';

interface DragState {
  mode: DragMode;
  startClientX: number;
  startClientY: number;
  startRect: CropRect;
}

const MIN_SIZE = 0.05;

// Rendered clockwise from the top-left; corners resize both axes, edge midpoints resize one.
const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function CropEditor({ box, draft, onChange, overlays }: CropEditorProps) {
  const dragRef = useRef<DragState | null>(null);

  const beginDrag = (mode: DragMode) => (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { mode, startClientX: e.clientX, startClientY: e.clientY, startRect: draft };
  };

  const handleMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || box.width === 0 || box.height === 0) return;

    const dx = (e.clientX - drag.startClientX) / box.width;
    const dy = (e.clientY - drag.startClientY) / box.height;
    const { startRect, mode } = drag;
    let next: CropRect;

    if (mode === 'move') {
      const x = clamp(startRect.x + dx, 0, 1 - startRect.w);
      const y = clamp(startRect.y + dy, 0, 1 - startRect.h);
      next = { ...startRect, x, y };
    } else {
      // Each edge letter in the mode ('n'/'e'/'s'/'w', or two for a corner) resizes that side.
      let { x, y, w, h } = startRect;
      const x2 = startRect.x + startRect.w;
      const y2 = startRect.y + startRect.h;

      if (mode.includes('w')) {
        const newX = clamp(startRect.x + dx, 0, x2 - MIN_SIZE);
        x = newX;
        w = x2 - newX;
      }
      if (mode.includes('e')) {
        const newX2 = clamp(x2 + dx, x + MIN_SIZE, 1);
        w = newX2 - x;
      }
      if (mode.includes('n')) {
        const newY = clamp(startRect.y + dy, 0, y2 - MIN_SIZE);
        y = newY;
        h = y2 - newY;
      }
      if (mode.includes('s')) {
        const newY2 = clamp(y2 + dy, y + MIN_SIZE, 1);
        h = newY2 - y;
      }
      next = { x, y, w, h };
    }

    onChange(next);
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  };

  const rectLeft = draft.x * box.width;
  const rectTop = draft.y * box.height;
  const rectWidth = draft.w * box.width;
  const rectHeight = draft.h * box.height;

  // Ratio-only check, so it's unaffected by box being CSS display pixels rather than the
  // image's natural ones — hide golden-spiral overlays from the live preview the moment a
  // drag makes the draft crop too extreme for them, same as the applied view.
  const spiralViable = isSpiralViable(rectWidth, rectHeight);
  const previewOverlays = spiralViable ? overlays : overlays.filter((o) => !SPIRAL_FAMILY.includes(o.type));

  return (
    <div className="crop-editor" style={{ top: box.top, left: box.left, width: box.width, height: box.height }}>
      <div className="crop-mask crop-mask--top" style={{ top: 0, left: 0, width: box.width, height: Math.max(0, rectTop) }} />
      <div
        className="crop-mask crop-mask--bottom"
        style={{
          top: rectTop + rectHeight,
          left: 0,
          width: box.width,
          height: Math.max(0, box.height - rectTop - rectHeight),
        }}
      />
      <div
        className="crop-mask crop-mask--left"
        style={{ top: rectTop, left: 0, width: Math.max(0, rectLeft), height: rectHeight }}
      />
      <div
        className="crop-mask crop-mask--right"
        style={{
          top: rectTop,
          left: rectLeft + rectWidth,
          width: Math.max(0, box.width - rectLeft - rectWidth),
          height: rectHeight,
        }}
      />

      <div
        className="crop-rect"
        style={{ top: rectTop, left: rectLeft, width: rectWidth, height: rectHeight }}
        onPointerDown={beginDrag('move')}
        onPointerMove={handleMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="crop-rect-preview">
          {previewOverlays.map((overlay) => (
            <OverlaySvg key={overlay.type} overlay={overlay} width={rectWidth} height={rectHeight} />
          ))}
        </div>
        {HANDLES.map((h) => (
          <div
            key={h}
            className={`crop-handle crop-handle--${h}`}
            onPointerDown={beginDrag(h)}
            onPointerMove={handleMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />
        ))}
      </div>
    </div>
  );
}
