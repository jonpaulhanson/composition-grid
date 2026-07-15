import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { CropRect } from '../types';

export interface CropViewport {
  /** Size of the letterboxed viewport that shows just the cropped region. */
  viewportWidth: number;
  viewportHeight: number;
  /** Size and position of the full (uncropped) image inside that viewport — scaled and
   * offset so the crop rectangle exactly fills it; `overflow: hidden` on the viewport
   * clips everything outside. */
  imgWidth: number;
  imgHeight: number;
  imgLeft: number;
  imgTop: number;
}

const EMPTY: CropViewport = { viewportWidth: 0, viewportHeight: 0, imgWidth: 0, imgHeight: 0, imgLeft: 0, imgTop: 0 };

/**
 * Computes a "crop to fill" layout: a viewport sized to fit the container (same
 * contain-fit math the plain image uses, but against the crop rectangle's aspect ratio
 * instead of the full image's), plus the scale/offset needed to position the full image
 * inside it so only the cropped region is visible.
 */
export function useCropViewport(
  containerRef: RefObject<HTMLDivElement | null>,
  naturalWidth: number,
  naturalHeight: number,
  crop: CropRect,
  enabled: boolean,
): CropViewport {
  const [viewport, setViewport] = useState<CropViewport>(EMPTY);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container || naturalWidth <= 0 || naturalHeight <= 0 || crop.w <= 0 || crop.h <= 0) {
      return;
    }

    const update = () => {
      const rect = container.getBoundingClientRect();
      const style = getComputedStyle(container);
      const availW = rect.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const availH = rect.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      if (availW <= 0 || availH <= 0) return;

      const cropPxW = crop.w * naturalWidth;
      const cropPxH = crop.h * naturalHeight;
      const cropAspect = cropPxW / cropPxH;
      const availAspect = availW / availH;

      const viewportWidth = cropAspect > availAspect ? availW : availH * cropAspect;
      const viewportHeight = cropAspect > availAspect ? availW / cropAspect : availH;
      const scale = viewportWidth / cropPxW;

      setViewport({
        viewportWidth,
        viewportHeight,
        imgWidth: naturalWidth * scale,
        imgHeight: naturalHeight * scale,
        imgLeft: -crop.x * naturalWidth * scale,
        imgTop: -crop.y * naturalHeight * scale,
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    window.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [containerRef, naturalWidth, naturalHeight, crop.x, crop.y, crop.w, crop.h, enabled]);

  return enabled ? viewport : EMPTY;
}
