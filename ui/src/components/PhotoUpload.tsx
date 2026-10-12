import React, { useRef, useState } from 'react';

interface PhotoUploadProps {
  onFilesSelected: (files: File[]) => void;
  previews?: { url: string; caption?: string }[];
  onCaptionChange?: (index: number, caption: string) => void;
  maxFiles?: number;
}

export function PhotoUpload({ onFilesSelected, previews = [], onCaptionChange, maxFiles = 10 }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files).slice(0, maxFiles);
    onFilesSelected(selected);
  };

  return (
    <div className="photo-upload">
      <label className="input-label">Photos</label>
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
      >
        <span className="drop-icon">📸</span>
        <p>Drop photos here or click to browse</p>
        <p className="drop-hint">Up to {maxFiles} photos, max 20MB each</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden-input"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {previews.length > 0 && (
        <div className="photo-previews">
          {previews.map((photo, i) => (
            <div key={i} className="photo-preview-item">
              <img src={photo.url} alt={`Preview ${i + 1}`} />
              {onCaptionChange && (
                <input
                  type="text"
                  placeholder="Add a caption..."
                  value={photo.caption || ''}
                  onChange={(e) => onCaptionChange(i, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="photo-caption-input"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
