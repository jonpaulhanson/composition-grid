import { useEffect, useState } from 'react';

export interface NaturalSize {
  width: number;
  height: number;
}

const EMPTY: NaturalSize = { width: 0, height: 0 };

/** Probes an image URL's natural pixel dimensions via a detached `Image`, independent of
 * whether a visible `<img>` for it is currently mounted. */
export function useNaturalSize(imageUrl: string | null): NaturalSize {
  const [size, setSize] = useState<NaturalSize>(EMPTY);

  useEffect(() => {
    if (!imageUrl) {
      setSize(EMPTY);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return size;
}
