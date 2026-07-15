import { useRef } from 'react';
import { useImageBox } from '../hooks/useImageBox';
import { useCropViewport } from '../hooks/useCropViewport';
import { useNaturalSize } from '../hooks/useNaturalSize';
import { OverlaySvg } from './OverlaySvg';
import { Dropzone } from './Dropzone';
import { CropEditor } from './CropEditor';
import { FULL_CROP } from '../types';
import type { CropRect, OverlayState } from '../types';

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
}: ImageStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const box = useImageBox(imgRef, containerRef, imageUrl);
  const natural = useNaturalSize(imageUrl);

  const showCroppedView = crop !== null && !isCropping;
  const viewport = useCropViewport(containerRef, natural.width, natural.height, crop ?? FULL_CROP, showCroppedView);

  const imgStyle = grayscale > 0 ? { filter: `grayscale(${grayscale}%)` } : undefined;

  return (
    <div className="stage-frame" ref={containerRef}>
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
