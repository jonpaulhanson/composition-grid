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
          <p className="dropzone-title">Drop an image here</p>
          <p className="dropzone-subtitle">or click to browse</p>
        </>
      )}
    </div>
  );
}
