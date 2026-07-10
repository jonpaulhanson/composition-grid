import { useCallback, useEffect, useRef, useState } from 'react';
import { ImageStage } from './components/ImageStage';
import { ControlPanel } from './components/ControlPanel';
import { createDefaultOverlay, OVERLAY_DEFS } from './types';
import type { OverlayState, OverlayType } from './types';
import './App.css';

function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<OverlayState[]>([]);
  const objectUrlRef = useRef<string | null>(null);

  const handleFileSelected = useCallback((file: File) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImageUrl(url);
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>Composition Armatures</h1>
      </header>
      <div className="app-body">
        <ImageStage imageUrl={imageUrl} overlays={overlays} onFileSelected={handleFileSelected} />
        <ControlPanel
          hasImage={imageUrl !== null}
          overlays={overlays}
          onFileSelected={handleFileSelected}
          onToggleOverlay={handleToggleOverlay}
          onChangeOverlay={handleChangeOverlay}
          onResetAll={handleResetAll}
        />
      </div>
    </div>
  );
}

export default App;
