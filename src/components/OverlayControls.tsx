import { COLOR_PRESETS, ORIENTATION_INVARIANT, OVERLAY_DEFS, SPIRAL_FAMILY } from '../types';
import type { OverlayState } from '../types';

interface OverlayControlsProps {
  overlay: OverlayState;
  onChange: (patch: Partial<OverlayState>) => void;
  onRemove: () => void;
}

export function OverlayControls({ overlay, onChange, onRemove }: OverlayControlsProps) {
  const label = OVERLAY_DEFS.find((d) => d.type === overlay.type)?.label ?? overlay.type;

  return (
    <div className="overlay-controls">
      <div className="overlay-controls-header">
        <span className="overlay-controls-title">{label}</span>
        <button type="button" className="icon-btn" onClick={onRemove} aria-label={`Remove ${label} overlay`}>
          ×
        </button>
      </div>

      <div className="overlay-controls-row">
        {!ORIENTATION_INVARIANT.includes(overlay.type) && (
          <>
            <button
              type="button"
              className={`icon-btn${overlay.flipH ? ' icon-btn--active' : ''}`}
              onClick={() => onChange({ flipH: !overlay.flipH })}
              aria-pressed={overlay.flipH}
              title="Flip horizontal"
            >
              ⇋
            </button>
            <button
              type="button"
              className={`icon-btn${overlay.flipV ? ' icon-btn--active' : ''}`}
              onClick={() => onChange({ flipV: !overlay.flipV })}
              aria-pressed={overlay.flipV}
              title="Flip vertical"
            >
              ⇵
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => onChange({ rotation: ((overlay.rotation + 1) % 4) as OverlayState['rotation'] })}
              title="Rotate 90°"
            >
              ⟳
            </button>
          </>
        )}
        {SPIRAL_FAMILY.includes(overlay.type) && (
          <>
            <button
              type="button"
              className={`icon-btn${overlay.stretchX ? ' icon-btn--active' : ''}`}
              onClick={() => onChange({ stretchX: !overlay.stretchX })}
              aria-pressed={overlay.stretchX}
              title="Stretch to fill width"
            >
              ↔
            </button>
            <button
              type="button"
              className={`icon-btn${overlay.stretchY ? ' icon-btn--active' : ''}`}
              onClick={() => onChange({ stretchY: !overlay.stretchY })}
              aria-pressed={overlay.stretchY}
              title="Stretch to fill height"
            >
              ↕
            </button>
            <div className="multiplicity-group">
              {([1, 2, 4] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`icon-btn${overlay.multiplicity === n ? ' icon-btn--active' : ''}`}
                  onClick={() => onChange({ multiplicity: n })}
                  aria-pressed={overlay.multiplicity === n}
                  title={
                    n === 1
                      ? 'Single spiral'
                      : n === 2
                        ? 'Two spirals (mirrored)'
                        : 'Four spirals (all rotations)'
                  }
                >
                  {n}×
                </button>
              ))}
            </div>
          </>
        )}

        <div className="swatch-group">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              className={`swatch${overlay.color === color ? ' swatch--active' : ''}`}
              style={{ background: color }}
              onClick={() => onChange({ color })}
              aria-label={`Set color ${color}`}
              aria-pressed={overlay.color === color}
            />
          ))}
        </div>
      </div>

      <div className="overlay-controls-row overlay-controls-sliders">
        <label className="slider-label">
          Opacity
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={overlay.opacity}
            onChange={(e) => onChange({ opacity: Number(e.target.value) })}
          />
        </label>
        <label className="slider-label">
          Thickness
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.25}
            value={overlay.strokeWidth}
            onChange={(e) => onChange({ strokeWidth: Number(e.target.value) })}
          />
        </label>
      </div>
    </div>
  );
}
