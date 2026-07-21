import { COLOR_PRESETS, ORIENTATION_INVARIANT, SPIRAL_FAMILY } from '../types';
import type { OverlayState } from '../types';

interface OverlayControlsProps {
  overlay: OverlayState;
  onChange: (patch: Partial<OverlayState>) => void;
}

export function OverlayControls({ overlay, onChange }: OverlayControlsProps) {
  const showOrientation = !ORIENTATION_INVARIANT.includes(overlay.type);
  const showSpiral = SPIRAL_FAMILY.includes(overlay.type);

  return (
    <div className="overlay-controls">
      {showOrientation && (
        <div className="ctrl-group">
          <span className="ctrl-group-label">Orientation</span>
          <div className="ctrl-group-buttons">
            {/* A single mirror flip: combined with Rotate's four steps it reaches every
             * orientation, so a second (vertical) flip would be redundant. */}
            <button
              type="button"
              className={`ctrl-btn${overlay.flipH ? ' ctrl-btn--active' : ''}`}
              onClick={() => onChange({ flipH: !overlay.flipH })}
              aria-pressed={overlay.flipH}
              title="Flip (mirror)"
            >
              Flip
            </button>
            <button
              type="button"
              className="ctrl-btn"
              onClick={() => onChange({ rotation: ((overlay.rotation + 1) % 4) as OverlayState['rotation'] })}
              title="Rotate 90°"
            >
              Rotate
            </button>
          </div>
        </div>
      )}

      {showSpiral && (
        <div className="ctrl-group">
          <span className="ctrl-group-label">Fit &amp; repeat</span>
          <div className="ctrl-group-buttons">
            <button
              type="button"
              className={`ctrl-btn${overlay.stretch ? ' ctrl-btn--active' : ''}`}
              onClick={() => onChange({ stretch: !overlay.stretch })}
              aria-pressed={overlay.stretch}
              title="Stretch to fill the frame"
            >
              Stretch
            </button>
            <div className="multiplicity-group">
              {([1, 2, 4] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`ctrl-btn${overlay.multiplicity === n ? ' ctrl-btn--active' : ''}`}
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
            {overlay.type === 'goldenSpiral' && (
              <button
                type="button"
                className={`ctrl-btn${overlay.showSquares ? ' ctrl-btn--active' : ''}`}
                onClick={() => onChange({ showSquares: !overlay.showSquares })}
                aria-pressed={overlay.showSquares}
                title="Show square outlines"
              >
                Squares
              </button>
            )}
          </div>
        </div>
      )}

      <div className="ctrl-group">
        <span className="ctrl-group-label">Color</span>
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

      <div className="overlay-controls-sliders">
        <label className="slider-label">
          <span className="slider-label-text">Opacity</span>
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
          <span className="slider-label-text">Thickness</span>
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
