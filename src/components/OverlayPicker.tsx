import { useEffect, useRef, useState } from 'react';
import { OVERLAY_DEFS, OVERLAY_GROUPS, SPIRAL_FAMILY, createDefaultOverlay } from '../types';
import type { OverlayType } from '../types';
import { SPIRAL_MAX_ASPECT_RATIO } from '../geometry/goldenSpiral';
import { OverlaySvg } from './OverlaySvg';

/** Thumbnail geometry is drawn by the same component as the real overlay, so a row can't
 * misrepresent what you'll get. Its own colour and hairline stroke though — the overlay's
 * default black would vanish against the panel, and 2.75px at this size would be a blob.
 *
 * These are the *drawing* dimensions, inset from the visible box (see .picker-thumb-inner):
 * constructions run corner to corner, and a stroke is centred on its path, so at the exact
 * box size the outer half of every edge line would be clipped away. */
const THUMB_W = 38;
const THUMB_H = 24;
const THUMB_COLOR = '#c9ccd2';
const THUMB_STROKE = 0.9;

const OVERLAY_BY_TYPE = new Map(OVERLAY_DEFS.map((d) => [d.type, d]));

interface OverlayPickerProps {
  activeTypes: Set<OverlayType>;
  hasImage: boolean;
  spiralViable: boolean;
  onAdd: (type: OverlayType) => void;
}

export function OverlayPicker({ activeTypes, hasImage, spiralViable, onAdd }: OverlayPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on click-outside or Escape, the two things a panel like this is expected to do.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Nothing to add once every overlay is on.
  const allAdded = OVERLAY_DEFS.every((d) => activeTypes.has(d.type));

  return (
    <div className="overlay-picker" ref={rootRef}>
      <button
        type="button"
        className="overlay-add-btn"
        onClick={() => setOpen((o) => !o)}
        disabled={!hasImage || allAdded}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {allAdded ? 'All overlays added' : 'Add overlay'}
      </button>

      {open && (
        <div className="overlay-picker-panel" role="dialog" aria-label="Add an overlay">
          {OVERLAY_GROUPS.map((group) => {
            const isSpiralGroup = group.types.every((t) => SPIRAL_FAMILY.includes(t));
            const blocked = isSpiralGroup && !spiralViable;
            return (
              <div className="picker-group" key={group.label}>
                <p className="picker-group-label">{group.label}</p>
                {blocked && (
                  <p className="callout-notice picker-note">
                    <svg
                      className="callout-notice-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>
                      Too wide or tall for this ratio — these need the image within about{' '}
                      {SPIRAL_MAX_ASPECT_RATIO.toFixed(1)}:1.
                    </span>
                  </p>
                )}
                {group.types.map((type) => {
                  const def = OVERLAY_BY_TYPE.get(type);
                  if (!def) return null;
                  const added = activeTypes.has(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      className="picker-row"
                      disabled={added || blocked}
                      onClick={() => {
                        onAdd(type);
                        setOpen(false);
                      }}
                    >
                      <span className="picker-row-text">
                        <span className="picker-row-label">
                          {def.label}
                          {added && <span className="picker-row-added">Added</span>}
                        </span>
                        <span className="picker-row-desc">{def.description}</span>
                      </span>
                      <span className="picker-thumb" aria-hidden="true">
                        <span className="picker-thumb-inner">
                          <OverlaySvg
                            overlay={{
                              ...createDefaultOverlay(type),
                              color: THUMB_COLOR,
                              strokeWidth: THUMB_STROKE,
                              opacity: 1,
                            }}
                            width={THUMB_W}
                            height={THUMB_H}
                          />
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
