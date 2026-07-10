import { useRef } from 'react';
import { useImageBox } from '../hooks/useImageBox';
import { OverlaySvg } from './OverlaySvg';
import { Dropzone } from './Dropzone';
import type { OverlayState } from '../types';

interface ImageStageProps {
  imageUrl: string | null;
  overlays: OverlayState[];
  onFileSelected: (file: File) => void;
  isConverting: boolean;
}

export function ImageStage({ imageUrl, overlays, onFileSelected, isConverting }: ImageStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const box = useImageBox(imgRef, containerRef, imageUrl);

  return (
    <div className="stage-frame" ref={containerRef}>
      {imageUrl ? (
        <>
          <img ref={imgRef} src={imageUrl} alt="Uploaded" className="stage-img" />
          {box.width > 0 && (
            <div
              className="overlay-stack"
              style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
            >
              {overlays.map((overlay) => (
                <OverlaySvg key={overlay.type} overlay={overlay} width={box.width} height={box.height} />
              ))}
            </div>
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
