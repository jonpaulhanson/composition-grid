import { useCallback, useEffect, useRef, useState } from 'react';
import { ImageStage } from './components/ImageStage';
import { ControlPanel } from './components/ControlPanel';
import { FeedbackModal } from './components/FeedbackModal';
import { useNaturalSize } from './hooks/useNaturalSize';
import { createDefaultOverlay, FULL_CROP, OVERLAY_DEFS, SPIRAL_FAMILY } from './types';
import type { CropRect, OverlayState, OverlayType } from './types';
import { isSpiralViable } from './geometry/goldenSpiral';
import { convertHeicToJpeg, isHeic } from './utils/heic';
import './App.css';

function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<OverlayState[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [grayscale, setGrayscale] = useState(0);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [draftCrop, setDraftCrop] = useState<CropRect>(FULL_CROP);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const natural = useNaturalSize(imageUrl);

  // Effective displayed size — the cropped region if a crop is active, else the whole image.
  const effectiveWidth = natural.width * (crop?.w ?? 1);
  const effectiveHeight = natural.height * (crop?.h ?? 1);
  const spiralViable = isSpiralViable(effectiveWidth, effectiveHeight);

  // Cropping into too extreme a ratio should drop any spiral-family overlay that's active,
  // rather than leave it silently showing a shape the geometry can no longer produce cleanly.
  useEffect(() => {
    if (spiralViable) return;
    setOverlays((prev) => prev.filter((o) => !SPIRAL_FAMILY.includes(o.type)));
  }, [spiralViable]);

  const handleFileSelected = useCallback(async (file: File) => {
    setConversionError(null);
    let finalFile = file;

    if (isHeic(file)) {
      setIsConverting(true);
      try {
        finalFile = await convertHeicToJpeg(file);
      } catch {
        setConversionError('Could not convert this HEIC image — try exporting it as JPEG first.');
        setIsConverting(false);
        return;
      }
      setIsConverting(false);
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(finalFile);
    objectUrlRef.current = url;
    setImageUrl(url);
    setCrop(null);
    setIsCropping(false);
    // Start a fresh image with Rule of Thirds on as a sensible default; if the user already
    // has overlays configured (e.g. swapping images mid-session), leave their setup alone.
    setOverlays((prev) => (prev.length === 0 ? [createDefaultOverlay('thirds')] : prev));
  }, []);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handleToggleOverlay = useCallback((type: OverlayType) => {
    setOverlays((prev) => {
      if (prev.some((o) => o.type === type)) {
        return prev.filter((o) => o.type !== type);
      }
      const order = OVERLAY_DEFS.map((d) => d.type);
      const next = [...prev, createDefaultOverlay(type)];
      return next.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
    });
  }, []);

  const handleChangeOverlay = useCallback((type: OverlayType, patch: Partial<OverlayState>) => {
    setOverlays((prev) => prev.map((o) => (o.type === type ? { ...o, ...patch } : o)));
  }, []);

  const handleResetAll = useCallback(() => {
    setOverlays([]);
  }, []);

  const handleStartCrop = useCallback(() => {
    setDraftCrop(crop ?? FULL_CROP);
    setIsCropping(true);
  }, [crop]);

  const handleApplyCrop = useCallback(() => {
    setCrop(draftCrop);
    setIsCropping(false);
  }, [draftCrop]);

  const handleCancelCrop = useCallback(() => {
    setIsCropping(false);
  }, []);

  const handleResetCrop = useCallback(() => {
    setCrop(null);
    setIsCropping(false);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <svg
            className="app-logo"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <rect x="2.5" y="2.5" width="19" height="19" rx="2.5" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
          </svg>
          <div className="app-titles">
            <h1 className="app-title">Composition Armatures</h1>
            <p className="app-tagline">Check your photo against classic composition grids</p>
          </div>
        </div>
        <button type="button" className="feedback-btn" onClick={() => setFeedbackOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
          </svg>
          Feedback
        </button>
      </header>
      <div className="app-body">
        <ImageStage
          imageUrl={imageUrl}
          overlays={overlays}
          onFileSelected={handleFileSelected}
          isConverting={isConverting}
          grayscale={grayscale}
          crop={crop}
          isCropping={isCropping}
          draftCrop={draftCrop}
          onDraftCropChange={setDraftCrop}
          natural={natural}
        />
        <ControlPanel
          hasImage={imageUrl !== null}
          spiralViable={spiralViable}
          overlays={overlays}
          onFileSelected={handleFileSelected}
          onToggleOverlay={handleToggleOverlay}
          onChangeOverlay={handleChangeOverlay}
          onResetAll={handleResetAll}
          isConverting={isConverting}
          conversionError={conversionError}
          grayscale={grayscale}
          onGrayscaleChange={setGrayscale}
          hasCrop={crop !== null}
          isCropping={isCropping}
          onStartCrop={handleStartCrop}
          onApplyCrop={handleApplyCrop}
          onCancelCrop={handleCancelCrop}
          onResetCrop={handleResetCrop}
        />
      </div>
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}

export default App;
