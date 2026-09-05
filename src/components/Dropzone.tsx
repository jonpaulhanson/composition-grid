import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { isHeic } from '../utils/heic';

interface DropzoneProps {
  onFileSelected: (file: File) => void;
  /** 'full' is the initial view's panel; 'button' is the Replace action in the image section.
   * Both go through here so the accepted-types check lives in one place — and dropping a file
   * straight onto the Replace button works as a result. */
  variant?: 'full' | 'button';
}

export function Dropzone({ onFileSelected, variant = 'full' }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    // HEIC/HEIF files frequently report an empty `type`, so isHeic() checks the extension too.
    if (file && (file.type.startsWith('image/') || isHeic(file))) {
      onFileSelected(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div
      className={
        variant === 'button'
          ? `btn-secondary image-action-btn${isDragging ? ' image-action-btn--active' : ''}`
          : `dropzone-area${isDragging ? ' dropzone-area--active' : ''}`
      }
      aria-label={variant === 'button' ? 'Replace image' : undefined}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleInputChange}
        hidden
      />
      {variant === 'button' ? (
        <>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Replace
        </>
      ) : (
        <div className="dropzone">
          <svg
            className="dropzone-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2.5" />
            <circle cx="8.75" cy="8.75" r="1.75" />
            <path d="M21 14.5 16.5 10 5 21" />
          </svg>
          <p className="dropzone-title">Drop an image here</p>
          <p className="dropzone-subtitle">or click to browse</p>
          <p className="dropzone-meta">
            JPG, PNG, WebP or HEIC — your image is never uploaded, everything happens in
            your browser.
          </p>
        </div>
      )}
    </div>
  );
}
