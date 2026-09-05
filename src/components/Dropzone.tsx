import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { isHeic } from '../utils/heic';

interface DropzoneProps {
  onFileSelected: (file: File) => void;
  compact?: boolean;
}

export function Dropzone({ onFileSelected, compact }: DropzoneProps) {
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
      className={`dropzone${isDragging ? ' dropzone--active' : ''}${compact ? ' dropzone--compact' : ''}`}
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
      {compact ? (
        <span>Upload a different image</span>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
