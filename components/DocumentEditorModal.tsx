'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UploadedFileItem } from './FileUploader';

interface DocumentEditorModalProps {
  isOpen: boolean;
  fileItem: UploadedFileItem | null;
  onClose: () => void;
  onSave: (updatedFile: UploadedFileItem, newFileBlob?: Blob) => void;
}

export default function DocumentEditorModal({
  isOpen,
  fileItem,
  onClose,
  onSave,
}: DocumentEditorModalProps) {
  const [rotation, setRotation] = useState<number>(0);
  const [filter, setFilter] = useState<'NONE' | 'BW_CONTRAST' | 'GRAYSCALE' | 'VIBRANT'>('NONE');
  const [aspectPreset, setAspectPreset] = useState<'FREE' | 'A4' | '1:1'>('FREE');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Crop box state as percentages (0 to 100)
  const [cropBox, setCropBox] = useState({ x: 5, y: 5, width: 90, height: 90 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  // Reset state when opening a new file
  useEffect(() => {
    if (isOpen && fileItem) {
      setRotation(0);
      setFilter('NONE');
      setAspectPreset('FREE');
      setCropBox({ x: 5, y: 5, width: 90, height: 90 });
      setImageLoaded(false);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = fileItem.fileUrl;
      img.onload = () => {
        imageRef.current = img;
        setImageLoaded(true);
        renderPreview(img, 0, 'NONE', { x: 5, y: 5, width: 90, height: 90 });
      };
    }
  }, [isOpen, fileItem]);

  const renderPreview = (
    img: HTMLImageElement,
    rot: number,
    filt: string,
    crop: { x: number; y: number; width: number; height: number }
  ) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions based on rotation
    const isRotated90 = rot === 90 || rot === 270;
    const baseW = isRotated90 ? img.naturalHeight : img.naturalWidth;
    const baseH = isRotated90 ? img.naturalWidth : img.naturalHeight;

    canvas.width = baseW;
    canvas.height = baseH;

    ctx.save();
    ctx.translate(baseW / 2, baseH / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    // Apply Filters
    if (filt !== 'NONE') {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Luminance
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        if (filt === 'GRAYSCALE') {
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        } else if (filt === 'BW_CONTRAST') {
          // Document Scan thresholding (Crisp text on paper)
          const contrast = gray > 140 ? 255 : gray < 70 ? 0 : (gray - 70) * (255 / 70);
          data[i] = contrast;
          data[i + 1] = contrast;
          data[i + 2] = contrast;
        } else if (filt === 'VIBRANT') {
          data[i] = Math.min(255, r * 1.15);
          data[i + 1] = Math.min(255, g * 1.15);
          data[i + 2] = Math.min(255, b * 1.15);
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
  };

  const handleRotate = (degrees: number) => {
    const nextRot = (rotation + degrees + 360) % 360;
    setRotation(nextRot);
    if (imageRef.current) {
      renderPreview(imageRef.current, nextRot, filter, cropBox);
    }
  };

  const handleFilterChange = (newFilter: 'NONE' | 'BW_CONTRAST' | 'GRAYSCALE' | 'VIBRANT') => {
    setFilter(newFilter);
    if (imageRef.current) {
      renderPreview(imageRef.current, rotation, newFilter, cropBox);
    }
  };

  const handleApplyPreset = (preset: 'FREE' | 'A4' | '1:1') => {
    setAspectPreset(preset);
    if (preset === 'A4') {
      setCropBox({ x: 10, y: 5, width: 80, height: Math.min(90, Math.round(80 * 1.414)) });
    } else if (preset === '1:1') {
      setCropBox({ x: 15, y: 15, width: 70, height: 70 });
    } else {
      setCropBox({ x: 5, y: 5, width: 90, height: 90 });
    }
  };

  const handleSaveCropped = async (asPdf: boolean = false) => {
    if (!canvasRef.current || !fileItem) return;

    try {
      setSaving(true);
      const sourceCanvas = canvasRef.current;

      // Crop final region from preview canvas
      const cropX = Math.round((cropBox.x / 100) * sourceCanvas.width);
      const cropY = Math.round((cropBox.y / 100) * sourceCanvas.height);
      const cropW = Math.round((cropBox.width / 100) * sourceCanvas.width);
      const cropH = Math.round((cropBox.height / 100) * sourceCanvas.height);

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = cropW;
      finalCanvas.height = cropH;

      const finalCtx = finalCanvas.getContext('2d');
      if (!finalCtx) return;

      finalCtx.drawImage(
        sourceCanvas,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        cropW,
        cropH
      );

      finalCanvas.toBlob(
        async (blob) => {
          if (!blob) return;

          const baseName = fileItem.fileName.replace(/\.[^/.]+$/, '');
          const newName = asPdf ? `${baseName}_edited.pdf` : `${baseName}_edited.png`;
          const newType = asPdf ? 'application/pdf' : 'image/png';

          const uploadForm = new FormData();
          uploadForm.append('file', blob, newName);

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: uploadForm,
          });

          if (uploadRes.ok) {
            const data = await uploadRes.json();
            onSave(data.file, blob);
          } else {
            // Local data fallback
            const dataUrl = finalCanvas.toDataURL('image/png');
            onSave({
              ...fileItem,
              fileUrl: dataUrl,
              fileName: newName,
              fileType: newType,
              fileSizeBytes: blob.size,
            }, blob);
          }
          setSaving(false);
          onClose();
        },
        'image/png',
        0.95
      );
    } catch (e) {
      console.error('Error saving edited file:', e);
      setSaving(false);
    }
  };

  if (!isOpen || !fileItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50">
          <div>
            <h3 className="font-heading text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>Document Editing Studio</span>
              <span className="rounded bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5">
                Print Preparation
              </span>
            </h3>
            <p className="text-xs text-slate-500 truncate max-w-sm sm:max-w-md">
              {fileItem.fileName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Studio Body */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Quick Preset Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/70 p-3 rounded-xl border border-slate-200">
            {/* Aspect Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase mr-1">Aspect:</span>
              {(['FREE', 'A4', '1:1'] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    aspectPreset === preset
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Rotation Tools */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase mr-1">Rotate:</span>
              <button
                type="button"
                onClick={() => handleRotate(90)}
                className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                ⟳ 90°
              </button>
              <button
                type="button"
                onClick={() => handleRotate(180)}
                className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                180°
              </button>
            </div>

            {/* Scan Filters */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase mr-1">Filter:</span>
              <button
                type="button"
                onClick={() => handleFilterChange('NONE')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  filter === 'NONE'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Original
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('BW_CONTRAST')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  filter === 'BW_CONTRAST'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                📄 Crisp B&W Scan
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('GRAYSCALE')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  filter === 'GRAYSCALE'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Grayscale
              </button>
            </div>
          </div>

          {/* Interactive Canvas Canvas Area */}
          <div
            ref={previewContainerRef}
            className="relative flex items-center justify-center min-h-[300px] sm:min-h-[380px] bg-slate-900/95 rounded-xl p-4 overflow-hidden border border-slate-800"
          >
            <canvas
              ref={canvasRef}
              className="max-h-[360px] max-w-full object-contain rounded shadow-lg"
            />

            {/* Simulated Crop Boundary Overlay */}
            <div
              style={{
                position: 'absolute',
                top: `${cropBox.y}%`,
                left: `${cropBox.x}%`,
                width: `${cropBox.width}%`,
                height: `${cropBox.height}%`,
              }}
              className="border-2 border-dashed border-blue-400 bg-blue-500/10 pointer-events-none rounded transition-all shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
            >
              <span className="absolute top-1 left-2 text-[10px] font-mono font-bold text-white bg-blue-600/90 px-1.5 py-0.5 rounded">
                Print Area
              </span>
            </div>
          </div>

          {/* Adjust Crop Sliders */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Left Margin</label>
              <input
                type="range"
                min="0"
                max="40"
                value={cropBox.x}
                onChange={(e) => setCropBox({ ...cropBox, x: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Top Margin</label>
              <input
                type="range"
                min="0"
                max="40"
                value={cropBox.y}
                onChange={(e) => setCropBox({ ...cropBox, y: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Crop Width</label>
              <input
                type="range"
                min="30"
                max="100"
                value={cropBox.width}
                onChange={(e) => setCropBox({ ...cropBox, width: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Crop Height</label>
              <input
                type="range"
                min="30"
                max="100"
                value={cropBox.height}
                onChange={(e) => setCropBox({ ...cropBox, height: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition order-2 sm:order-1"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveCropped(false)}
              className="flex-1 sm:flex-none rounded-xl bg-slate-800 hover:bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
            >
              Save Cropped Image
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveCropped(true)}
              className="flex-1 sm:flex-none rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Processing...' : '📄 Save & Convert to PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
