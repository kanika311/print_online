'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  X,
  AlertCircle,
  Plus,
  Trash2,
  FileCheck,
} from 'lucide-react';

export interface UploadedFileItem {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  estimatedPages: number;
}

interface FileUploaderProps {
  onFilesChanged: (files: UploadedFileItem[], totalPages: number) => void;
}

export default function FileUploader({ onFilesChanged }: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processMultipleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processMultipleFiles(Array.from(e.target.files));
    }
  };

  const processMultipleFiles = async (newFileList: File[]) => {
    setError(null);
    setUploading(true);
    setUploadProgress(15);

    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const uploadedResults: UploadedFileItem[] = [];

    try {
      for (let i = 0; i < newFileList.length; i++) {
        const file = newFileList[i];
        const hasValidExt = validExtensions.some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        );

        if (!hasValidExt) {
          setError(`"${file.name}" is an unsupported format. Please upload PDF, JPG, JPEG, or PNG files.`);
          continue;
        }

        if (file.size > 50 * 1024 * 1024) {
          setError(`"${file.name}" exceeds maximum allowed 50MB limit.`);
          continue;
        }

        setUploadProgress(Math.round(((i + 1) / newFileList.length) * 85));

        try {
          const formData = new FormData();
          formData.append('file', file);

          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            uploadedResults.push(data.file);
          } else {
            // Local fallback
            uploadedResults.push({
              fileUrl: URL.createObjectURL(file),
              fileName: file.name,
              fileType: file.type || 'application/pdf',
              fileSizeBytes: file.size,
              estimatedPages: file.name.toLowerCase().endsWith('.pdf') ? 4 : 1,
            });
          }
        } catch {
          uploadedResults.push({
            fileUrl: URL.createObjectURL(file),
            fileName: file.name,
            fileType: file.type || 'application/pdf',
            fileSizeBytes: file.size,
            estimatedPages: file.name.toLowerCase().endsWith('.pdf') ? 4 : 1,
          });
        }
      }

      setUploadProgress(100);

      const updated = [...files, ...uploadedResults];
      setFiles(updated);
      const totalPages = updated.reduce((sum, f) => sum + (f.estimatedPages || 1), 0);
      onFilesChanged(updated, totalPages);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    const totalPages = updated.reduce((sum, f) => sum + (f.estimatedPages || 1), 0);
    onFilesChanged(updated, totalPages);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalPagesCount = files.reduce((sum, f) => sum + (f.estimatedPages || 1), 0);

  return (
    <div className="w-full space-y-4">
      {/* Upload Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-7 text-center transition-all cursor-pointer ${
          dragActive
            ? 'border-sky-400 bg-sky-500/10 scale-[0.99]'
            : 'border-white/15 bg-slate-900/60 hover:border-sky-500/40 hover:bg-slate-900/90'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleChange}
          className="hidden"
        />

        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-500/25">
          {uploading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <UploadCloud className="h-7 w-7" />
          )}
        </div>

        <h4 className="font-heading text-base font-bold text-white mb-1">
          {uploading ? 'Analyzing Documents & Pages...' : 'Click to Upload Files or Drag & Drop'}
        </h4>
        <p className="text-xs text-slate-400 max-w-sm mb-3">
          Select single or multiple PDF, JPG, JPEG, and PNG files
        </p>

        {uploading && (
          <div className="w-full max-w-xs bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-400">
            PDF
          </span>
          <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
            JPG / JPEG
          </span>
          <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
            PNG
          </span>
          <span className="text-[11px] text-slate-400">Multi-file supported</span>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Uploaded Documents List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-bold text-white">
                Uploaded Documents ({files.length})
              </span>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                {totalPagesCount} Pages Combined
              </span>
            </div>

            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add More Files</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/80 p-3.5 hover:border-white/20 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                    {file.fileName.toLowerCase().endsWith('.pdf') ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </div>

                  <div className="truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
                    <h5 className="font-heading text-xs font-bold text-white truncate" title={file.fileName}>
                      {file.fileName}
                    </h5>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{formatFileSize(file.fileSizeBytes)}</span>
                      <span>•</span>
                      <span className="font-semibold text-emerald-400">
                        {file.estimatedPages} {file.estimatedPages === 1 ? 'Page' : 'Pages'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveFile(idx)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                  title="Remove file"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
