import { useState } from 'react';
import { OVERLAY_DEFS, OVERLAY_GROUPS, SPIRAL_FAMILY } from '../types';
import type { OverlayState, OverlayType } from '../types';
import { SPIRAL_MAX_ASPECT_RATIO } from '../geometry/goldenSpiral';
import { OverlayControls } from './OverlayControls';
import { Dropzone } from './Dropzone';

const OVERLAY_LABELS = new Map(OVERLAY_DEFS.map((d) => [d.type, d.label]));

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
  grayscale: number;
  onGrayscaleChange: (value: number) => void;
  hasCrop: boolean;
  isCropping: boolean;
  onStartCrop: () => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  onResetCrop: () => void;
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
  grayscale,
  onGrayscaleChange,
  hasCrop,
  isCropping,
  onStartCrop,
  onApplyCrop,
  onCancelCrop,
  onResetCrop,
}: ControlPanelProps) {
  const activeTypes = new Set(overlays.map((o) => o.type));
  const overlayByType = new Map(overlays.map((o) => [o.type, o]));
  // Every group starts expanded so all options are visible; collapsing is a tidy-up affordance.
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

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
        {hasImage && (
          <label className="slider-label">
            Grayscale
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={grayscale}
              onChange={(e) => onGrayscaleChange(Number(e.target.value))}
            />
          </label>
        )}
        {hasImage && (
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
              <>
                <button type="button" className="btn-secondary" onClick={onStartCrop}>
                  {hasCrop ? 'Edit crop' : 'Crop'}
                </button>
                {hasCrop && (
                  <button type="button" className="btn-secondary" onClick={onResetCrop}>
                    Reset crop
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="control-section">
        <h2 className="control-section-title">Overlays</h2>
        <div className="overlay-groups">
          {OVERLAY_GROUPS.map((group) => {
            const collapsed = collapsedGroups.has(group.label);
            const activeCount = group.types.filter((t) => activeTypes.has(t)).length;
            const isSpiralGroup = group.types.every((t) => SPIRAL_FAMILY.includes(t));
            const spiralBlocked = isSpiralGroup && hasImage && !spiralViable;
            return (
              <div className="overlay-group" key={group.label}>
                <button
                  type="button"
                  className="overlay-group-header"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={!collapsed}
                >
                  <svg
                    className={`overlay-group-chevron${collapsed ? '' : ' overlay-group-chevron--open'}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <polyline points="9 6 15 12 9 18" />
                  </svg>
                  <span className="overlay-group-label">{group.label}</span>
                  {collapsed && activeCount > 0 && (
                    <span className="overlay-group-count">{activeCount}</span>
                  )}
                </button>
                {!collapsed && spiralBlocked && (
                  <p className="control-hint overlay-group-note">
                    Too wide or tall for this ratio — golden-spiral overlays need the image
                    within about {SPIRAL_MAX_ASPECT_RATIO.toFixed(1)}:1.
                  </p>
                )}
                {!collapsed && (
                  <div className="overlay-list">
                    {group.types.map((type) => {
                      const active = activeTypes.has(type);
                      const overlay = overlayByType.get(type);
                      return (
                        <div
                          key={type}
                          className={`overlay-item${active ? ' overlay-item--active' : ''}`}
                        >
                          <button
                            type="button"
                            className="overlay-row"
                            onClick={() => onToggleOverlay(type)}
                            aria-pressed={active}
                            disabled={!hasImage || spiralBlocked}
                          >
                            <span className="overlay-row-label">{OVERLAY_LABELS.get(type)}</span>
                            {active && (
                              <svg
                                className="overlay-row-check"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                aria-hidden="true"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                          {active && overlay && (
                            <OverlayControls
                              overlay={overlay}
                              onChange={(patch) => onChangeOverlay(type, patch)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="control-section">
        <button type="button" className="btn-reset" onClick={onResetAll} disabled={overlays.length === 0}>
          Reset all
        </button>
      </div>
    </aside>
  );
}
