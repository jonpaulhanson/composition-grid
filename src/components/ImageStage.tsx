import { useRef } from 'react';
import { useImageBox } from '../hooks/useImageBox';
import { useCropViewport } from '../hooks/useCropViewport';
import type { NaturalSize } from '../hooks/useNaturalSize';
import { OverlaySvg } from './OverlaySvg';
import { Dropzone } from './Dropzone';
import { CropEditor } from './CropEditor';
import { FULL_CROP, SPIRAL_FAMILY } from '../types';
import type { CropRect, OverlayState } from '../types';
import { isSpiralViable } from '../geometry/goldenSpiral';

interface ImageStageProps {
  imageUrl: string | null;
  overlays: OverlayState[];
  onFileSelected: (file: File) => void;
  isConverting: boolean;
  grayscale: number;
  crop: CropRect | null;
  isCropping: boolean;
  draftCrop: CropRect;
  onDraftCropChange: (rect: CropRect) => void;
  natural: NaturalSize;
}

export function ImageStage({
  imageUrl,
  overlays,
  onFileSelected,
  isConverting,
  grayscale,
  crop,
  isCropping,
  draftCrop,
  onDraftCropChange,
  natural,
}: ImageStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const box = useImageBox(imgRef, containerRef, imageUrl);

  const showCroppedView = crop !== null && !isCropping;
  const viewport = useCropViewport(containerRef, natural.width, natural.height, crop ?? FULL_CROP, showCroppedView);

  const imgStyle = grayscale > 0 ? { filter: `grayscale(${grayscale}%)` } : undefined;

  // While cropping, an active spiral overlay is hidden from the live preview once the draft
  // crop passes the viable ratio (CropEditor filters it out). Call that out in-canvas so it
  // doesn't look like the overlay silently vanished — the ratio check is scale-invariant, so
  // natural dimensions work fine here.
  const spiralHiddenWhileCropping =
    isCropping &&
    natural.width > 0 &&
    overlays.some((o) => SPIRAL_FAMILY.includes(o.type)) &&
    !isSpiralViable(draftCrop.w * natural.width, draftCrop.h * natural.height);

  return (
    <div className={`stage-frame${isCropping ? ' stage-frame--cropping' : ''}`} ref={containerRef}>
      {spiralHiddenWhileCropping && (
        <div className="crop-notice" role="status">
          <svg
            className="callout-notice-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Golden spiral hidden at this crop ratio
        </div>
      )}
      {imageUrl && showCroppedView ? (
        viewport.viewportWidth > 0 && (
          <div className="crop-viewport" style={{ width: viewport.viewportWidth, height: viewport.viewportHeight }}>
            <img
              src={imageUrl}
              alt="Uploaded"
              className="stage-img crop-viewport-img"
              style={{
                width: viewport.imgWidth,
                height: viewport.imgHeight,
                left: viewport.imgLeft,
                top: viewport.imgTop,
                ...imgStyle,
              }}
            />
            <div
              className="overlay-stack"
              style={{ top: 0, left: 0, width: viewport.viewportWidth, height: viewport.viewportHeight }}
            >
              {overlays.map((overlay) => (
                <OverlaySvg key={overlay.type} overlay={overlay} width={viewport.viewportWidth} height={viewport.viewportHeight} />
              ))}
            </div>
          </div>
        )
      ) : imageUrl ? (
        <>
          <img ref={imgRef} src={imageUrl} alt="Uploaded" className="stage-img" style={imgStyle} />
          {box.width > 0 && !isCropping && (
            <div
              className="overlay-stack"
              style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
            >
              {overlays.map((overlay) => (
                <OverlaySvg key={overlay.type} overlay={overlay} width={box.width} height={box.height} />
              ))}
            </div>
          )}
          {box.width > 0 && isCropping && (
            <CropEditor box={box} draft={draftCrop} onChange={onDraftCropChange} overlays={overlays} />
          )}
        </>
      ) : isConverting ? (
        <p className="stage-status">Converting HEIC image…</p>
      ) : (
        <Dropzone onFileSelected={onFileSelected} />
      )}
    </div>
  );
}
