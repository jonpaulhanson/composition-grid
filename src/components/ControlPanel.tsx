import { useState } from 'react';
import { OVERLAY_DEFS } from '../types';
import type { OverlayState, OverlayType } from '../types';
import type { ExportMode } from '../utils/exportImage';
import { SIMPLIFY_MAX, SIMPLIFY_STEP } from '../utils/imageFilter';
import type { ValueStudy } from '../utils/imageFilter';
import { OverlayCard } from './OverlayCard';
import { OverlayPicker } from './OverlayPicker';
import { Dropzone } from './Dropzone';

const OVERLAY_LABELS = new Map(OVERLAY_DEFS.map((d) => [d.type, d.label]));

/** 'off' has no button of its own — the two studies toggle, and neither being on *is* off.
 * A button representing nothing was the only thing lit up when nothing was happening. */
const VALUE_MODES = [
  { mode: 'grayscale', label: 'Grayscale' },
  { mode: 'notan', label: 'Notan' },
] as const;

interface ControlPanelProps {
  hasImage: boolean;
  /** Whether the current (cropped, if applicable) image ratio is narrow/wide enough for the
   * golden-spiral family to still decay into a recognizable spiral. See `isSpiralViable` in
   * `geometry/goldenSpiral.ts`. */
  spiralViable: boolean;
  overlays: OverlayState[];
  onFileSelected: (file: File) => void;
  onToggleOverlay: (type: OverlayType) => void;
  onChangeOverlay: (type: OverlayType, patch: Partial<OverlayState>) => void;
  onResetAll: () => void;
  isConverting: boolean;
  conversionError: string | null;
  valueStudy: ValueStudy;
  onValueStudyChange: (patch: Partial<ValueStudy>) => void;
  hasCrop: boolean;
  isCropping: boolean;
  onStartCrop: () => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  onResetCrop: () => void;
  onDownload: (mode: ExportMode) => void;
  isExporting: boolean;
  pickerOpen: boolean;
  onPickerOpenChange: (open: boolean) => void;
}

export function ControlPanel({
  hasImage,
  spiralViable,
  overlays,
  onFileSelected,
  onToggleOverlay,
  onChangeOverlay,
  onResetAll,
  isConverting,
  conversionError,
  valueStudy,
  onValueStudyChange,
  hasCrop,
  isCropping,
  onStartCrop,
  onApplyCrop,
  onCancelCrop,
  onResetCrop,
  onDownload,
  isExporting,
  pickerOpen,
  onPickerOpenChange,
}: ControlPanelProps) {
  const activeTypes = new Set(overlays.map((o) => o.type));
  // Only expanded cards are tracked, so cards start collapsed — the list stays a scannable
  // summary of what's on, and settings are opened on demand.
  const [expandedCards, setExpandedCards] = useState<Set<OverlayType>>(() => new Set());

  const toggleCard = (type: OverlayType) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  return (
    <aside className="control-panel">
      <div className="control-section">
        <h2 className="control-section-title">Image</h2>
        {isConverting ? (
          <p className="control-hint">Converting HEIC image…</p>
        ) : (
          <div className="image-actions">
            <button
              type="button"
              className="btn-secondary image-action-btn"
              onClick={onStartCrop}
              disabled={isCropping}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6.13 1 6 16a2 2 0 0 0 2 2h15" />
                <path d="M1 6.13 16 6a2 2 0 0 1 2 2v15" />
              </svg>
              {hasCrop ? 'Edit crop' : 'Crop'}
            </button>
            <Dropzone onFileSelected={onFileSelected} variant="button" />
          </div>
        )}
        {conversionError && <p className="control-error">{conversionError}</p>}
        {/* Only the states that need a decision get full-width buttons; plain "crop this" is
            the icon above. */}
        {(isCropping || hasCrop) && (
          <div className="crop-controls">
            {isCropping ? (
              <>
                <button type="button" className="btn-primary" onClick={onApplyCrop}>
                  Apply crop
                </button>
                <button type="button" className="btn-secondary" onClick={onCancelCrop}>
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" className="btn-secondary" onClick={onResetCrop}>
                Reset crop
              </button>
            )}
          </div>
        )}
      </div>

      <div className="control-section">
        <h2 className="control-section-title">Overlays</h2>
        {overlays.length > 0 && (
          <div className="overlay-cards">
            {overlays.map((overlay) => (
              <OverlayCard
                key={overlay.type}
                overlay={overlay}
                label={OVERLAY_LABELS.get(overlay.type) ?? overlay.type}
                collapsed={!expandedCards.has(overlay.type)}
                onToggleCollapse={() => toggleCard(overlay.type)}
                onRemove={() => onToggleOverlay(overlay.type)}
                onChange={(patch) => onChangeOverlay(overlay.type, patch)}
              />
            ))}
          </div>
        )}
        {overlays.length === 0 && (
          <p className="control-hint">No overlays yet — add one below.</p>
        )}
        <OverlayPicker
          activeTypes={activeTypes}
          hasImage={hasImage}
          spiralViable={spiralViable}
          onAdd={onToggleOverlay}
          open={pickerOpen}
          onOpenChange={onPickerOpenChange}
        />
      </div>

      {hasImage && (
        <div className="control-section">
          <h2 className="control-section-title">Value</h2>
          <div className="value-mode-group">
            {VALUE_MODES.map(({ mode, label }) => (
              <button
                key={mode}
                type="button"
                className={`ctrl-btn${valueStudy.mode === mode ? ' ctrl-btn--active' : ''}`}
                onClick={() => onValueStudyChange({ mode: valueStudy.mode === mode ? 'off' : mode })}
                aria-pressed={valueStudy.mode === mode}
              >
                {label}
              </button>
            ))}
          </div>
          {valueStudy.mode === 'grayscale' && (
            <label className="slider-label">
              <span className="slider-label-text">Amount</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={valueStudy.grayscale}
                onChange={(e) => onValueStudyChange({ grayscale: Number(e.target.value) })}
              />
            </label>
          )}
          {valueStudy.mode === 'notan' && (
            <>
              <label className="slider-label">
                <span className="slider-label-text">Threshold</span>
                <input
                  type="range"
                  min={10}
                  max={90}
                  step={1}
                  value={valueStudy.threshold}
                  onChange={(e) => onValueStudyChange({ threshold: Number(e.target.value) })}
                />
              </label>
              <label className="slider-label">
                <span className="slider-label-text">Simplify</span>
                <input
                  type="range"
                  min={0}
                  max={SIMPLIFY_MAX}
                  step={SIMPLIFY_STEP}
                  value={valueStudy.simplify}
                  onChange={(e) => onValueStudyChange({ simplify: Number(e.target.value) })}
                />
              </label>
            </>
          )}
        </div>
      )}

      {hasImage && (
        <div className="control-section control-section--footer">
          <h2 className="control-section-title">Export</h2>
          <div className="export-controls">
            <button
              type="button"
              className="btn-secondary export-btn"
              onClick={() => onDownload('composite')}
              disabled={isCropping || isExporting}
            >
              {isExporting ? 'Preparing…' : 'Download image + overlays'}
            </button>
            <button
              type="button"
              className="btn-secondary export-btn"
              onClick={() => onDownload('overlay')}
              disabled={isCropping || isExporting || overlays.length === 0}
            >
              Download overlays only (transparent PNG)
            </button>
          </div>
          <p className="control-hint">
            Saved at your image's full resolution. Apply your crop first to export just that region.
          </p>
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
