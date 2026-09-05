import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { isHeic } from '../utils/heic';

interface DropzoneProps {
  onFileSelected: (file: File) => void;
  /** 'full' is the initial view's panel; 'button' is the Replace action in the image section.
   * Both go through here so the accepted-types check lives in one place — and dropping a file
   * straight onto the Replace button works as a result. */
  variant?: 'full' | 'button';
}

const PASTE_SHORTCUT =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘V' : 'Ctrl+V';

function isAcceptable(file: File): boolean {
  // HEIC/HEIF files frequently report an empty `type`, so isHeic() checks the extension too.
  return file.type.startsWith('image/') || isHeic(file);
}

export function Dropzone({ onFileSelected, variant = 'full' }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pasteHint, setPasteHint] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file && isAcceptable(file)) onFileSelected(file);
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

  // ⌘V anywhere on the empty stage, alongside the Paste button — the button exists because
  // the shortcut isn't discoverable, but people who reach for it shouldn't have to find it.
  useEffect(() => {
    if (variant !== 'full') return;
    const onPaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files?.[0];
      if (file && isAcceptable(file)) {
        setPasteHint(null);
        onFileSelected(file);
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [variant, onFileSelected]);

  /** Reading the clipboard needs permission the shortcut doesn't, so this can fail in ways a
   * paste can't — say so rather than appearing to do nothing. */
  const handlePasteClick = async () => {
    setPasteHint(null);
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (type) {
          const blob = await item.getType(type);
          onFileSelected(new File([blob], `pasted-image.${type.split('/')[1] || 'png'}`, { type }));
          return;
        }
      }
      setPasteHint('No image in the clipboard — copy one first.');
    } catch {
      setPasteHint(`Couldn't read the clipboard. Press ${PASTE_SHORTCUT} instead.`);
    }
  };

  if (variant === 'button') {
    return (
      <div
        className={`btn-secondary image-action-btn${isDragging ? ' image-action-btn--active' : ''}`}
        aria-label="Replace image"
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
        <input ref={inputRef} type="file" accept="image/*,.heic,.heif" onChange={handleInputChange} hidden />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Replace
      </div>
    );
  }

  return (
    // The whole canvas catches a drop, but only the buttons below act on a click — the area
    // itself isn't a control.
    <div
      className={`dropzone-area${isDragging ? ' dropzone-area--active' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input ref={inputRef} type="file" accept="image/*,.heic,.heif" onChange={handleInputChange} hidden />
      {/* Clicking anywhere on the panel browses — the common case shouldn't require hitting a
          108px target. Not a role=button: it contains buttons, and nesting controls would be
          worse for keyboard and screen readers than leaving those buttons to do that job. */}
      <div className="dropzone" onClick={() => inputRef.current?.click()}>
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
        <div className="dropzone-actions">
          <button
            type="button"
            className="dropzone-btn dropzone-btn--primary"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Browse
          </button>
          <button
            type="button"
            className="dropzone-btn"
            onClick={(e) => {
              e.stopPropagation();
              handlePasteClick();
            }}
          >
            Paste
            <kbd className="dropzone-kbd">{PASTE_SHORTCUT}</kbd>
          </button>
        </div>
        {pasteHint && <p className="dropzone-hint">{pasteHint}</p>}
        <p className="dropzone-meta">
          JPG, PNG, WebP or HEIC — your image is never uploaded, everything happens in your
          browser.
        </p>
      </div>
    </div>
  );
}
