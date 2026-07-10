import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

export interface ImageBox {
  width: number;
  height: number;
  top: number;
  left: number;
}

const EMPTY_BOX: ImageBox = { width: 0, height: 0, top: 0, left: 0 };

/**
 * Tracks the image's live rendered box (size + offset) relative to its container, so
 * overlay SVGs can be positioned to match exactly — even as the window resizes or the
 * image's contained (letterboxed) size changes.
 */
export function useImageBox(
  imgRef: RefObject<HTMLImageElement | null>,
  containerRef: RefObject<HTMLDivElement | null>,
  /** Include the image source (or any value that changes when the <img> (re)mounts) so the
   * effect re-attaches — imgRef/containerRef are stable objects and won't retrigger it. */
  resetKey: unknown,
): ImageBox {
  const [box, setBox] = useState<ImageBox>(EMPTY_BOX);

  useEffect(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const update = () => {
      const imgRect = img.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      if (imgRect.width === 0 || imgRect.height === 0) return;
      setBox({
        width: imgRect.width,
        height: imgRect.height,
        top: imgRect.top - containerRect.top,
        left: imgRect.left - containerRect.left,
      });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(img);
    ro.observe(container);
    window.addEventListener('resize', update);
    img.addEventListener('load', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      img.removeEventListener('load', update);
    };
  }, [imgRef, containerRef, resetKey]);

  return box;
}
