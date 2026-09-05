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
  /** The element itself rather than a ref, so the effect re-attaches whenever it changes.
   * A ref object is stable, so an effect keyed on it can't tell that the <img> was swapped —
   * it would keep measuring a detached node and freeze the box at its last value. */
  img: HTMLImageElement | null,
  containerRef: RefObject<HTMLDivElement | null>,
): ImageBox {
  const [box, setBox] = useState<ImageBox>(EMPTY_BOX);

  useEffect(() => {
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
  }, [img, containerRef]);

  return box;
}
