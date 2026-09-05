import { OverlayControls } from './OverlayControls';
import type { OverlayState } from '../types';

interface OverlayCardProps {
  overlay: OverlayState;
  label: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onRemove: () => void;
  onChange: (patch: Partial<OverlayState>) => void;
}

/** One overlay you've added: a header, and its settings behind it. Cards start collapsed so
 * the list reads as a summary of what's on rather than a wall of sliders; the colour dot keeps
 * each one identifiable at a glance, and you open the one you actually want to adjust. */
export function OverlayCard({
  overlay,
  label,
  collapsed,
  onToggleCollapse,
  onRemove,
  onChange,
}: OverlayCardProps) {
  return (
    <div className="overlay-card">
      <div className="overlay-card-header">
        <button
          type="button"
          className="overlay-card-toggle"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
        >
          <svg
            className={`overlay-card-chevron${collapsed ? '' : ' overlay-card-chevron--open'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <polyline points="9 6 15 12 9 18" />
          </svg>
          <span className="overlay-card-title">{label}</span>
        </button>
        {/* Keeps the overlay identifiable at a glance once its settings are folded away. */}
        <span className="overlay-card-dot" style={{ background: overlay.color }} aria-hidden="true" />
        <button
          type="button"
          className="overlay-card-remove"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          title={`Remove ${label}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      </div>
      {!collapsed && <OverlayControls overlay={overlay} onChange={onChange} />}
    </div>
  );
}
