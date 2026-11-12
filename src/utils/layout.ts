/** The width at and below which the controls stack beneath the picture instead of sitting
 * beside it. Keep in step with the responsive breakpoint in App.css. */
const STACKED_LAYOUT = '(max-width: 720px)';

export function isStackedLayout(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(STACKED_LAYOUT).matches;
}
