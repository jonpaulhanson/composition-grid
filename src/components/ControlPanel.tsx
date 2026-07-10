import { OVERLAY_DEFS } from '../types';
import type { OverlayState, OverlayType } from '../types';
import { OverlayControls } from './OverlayControls';
import { Dropzone } from './Dropzone';

interface ControlPanelProps {
  hasImage: boolean;
  overlays: OverlayState[];
  onFileSelected: (file: File) => void;
  onToggleOverlay: (type: OverlayType) => void;
  onChangeOverlay: (type: OverlayType, patch: Partial<OverlayState>) => void;
  onResetAll: () => void;
  isConverting: boolean;
  conversionError: string | null;
}

export function ControlPanel({
  hasImage,
  overlays,
  onFileSelected,
  onToggleOverlay,
  onChangeOverlay,
  onResetAll,
  isConverting,
  conversionError,
}: ControlPanelProps) {
  const activeTypes = new Set(overlays.map((o) => o.type));

  return (
    <aside className="control-panel">
      <div className="control-section">
        <h2 className="control-section-title">Image</h2>
        {isConverting ? (
          <p className="control-hint">Converting HEIC image…</p>
        ) : hasImage ? (
          <Dropzone onFileSelected={onFileSelected} compact />
        ) : (
          <p className="control-hint">Upload an image to get started.</p>
        )}
        {conversionError && <p className="control-error">{conversionError}</p>}
      </div>

      <div className="control-section">
        <h2 className="control-section-title">Overlays</h2>
        <div className="chip-group">
          {OVERLAY_DEFS.map((def) => (
            <button
              key={def.type}
              type="button"
              className={`chip${activeTypes.has(def.type) ? ' chip--active' : ''}`}
              onClick={() => onToggleOverlay(def.type)}
              aria-pressed={activeTypes.has(def.type)}
              disabled={!hasImage}
            >
              {def.label}
            </button>
          ))}
        </div>
      </div>

      {overlays.length > 0 && (
        <div className="control-section">
          {overlays.map((overlay) => (
            <OverlayControls
              key={overlay.type}
              overlay={overlay}
              onChange={(patch) => onChangeOverlay(overlay.type, patch)}
              onRemove={() => onToggleOverlay(overlay.type)}
            />
          ))}
        </div>
      )}

      <div className="control-section">
        <button type="button" className="btn-reset" onClick={onResetAll} disabled={overlays.length === 0}>
          Reset all
        </button>
      </div>
    </aside>
  );
}
