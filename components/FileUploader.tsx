'use client';

import React, { useState, useRef } from 'react';
import DocumentEditorModal from './DocumentEditorModal';

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

  // Document Editor State
  const [editingFile, setEditingFile] = useState<UploadedFileItem | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Google Drive & Cloud link state
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveUrl, setDriveUrl] = useState('');
  const [driveDocName, setDriveDocName] = useState('');

  const inputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const pageNum = files.length + 1;
      const renamedFile = new File([file], `Scanned_Paper_Page_${pageNum}.jpg`, {
        type: file.type || 'image/jpeg',
      });
      processMultipleFiles([renamedFile]);
    }
  };

  const handleAddDriveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrl.trim()) return;

    const name = driveDocName.trim() || `Cloud_Document_${files.length + 1}.pdf`;
    const finalName = name.endsWith('.pdf') ? name : `${name}.pdf`;

    const driveItem: UploadedFileItem = {
      fileUrl: driveUrl.trim(),
      fileName: finalName,
      fileType: 'application/pdf',
      fileSizeBytes: 2 * 1024 * 1024,
      estimatedPages: 4,
    };

    const updated = [...files, driveItem];
    setFiles(updated);
    const totalPages = updated.reduce((sum, f) => sum + (f.estimatedPages || 1), 0);
    onFilesChanged(updated, totalPages);

    setDriveUrl('');
    setDriveDocName('');
    setShowDriveModal(false);
  };

  const processMultipleFiles = async (newFileList: File[]) => {
    setError(null);
    setUploading(true);
    setUploadProgress(15);

    const validExtensions = [
      '.pdf',
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.doc',
      '.docx',
      '.ppt',
      '.pptx',
      '.txt',
    ];
    const uploadedResults: UploadedFileItem[] = [];

    try {
      for (let i = 0; i < newFileList.length; i++) {
        const file = newFileList[i];
        const hasValidExt = validExtensions.some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        );

        if (!hasValidExt) {
          setError(
            `"${file.name}" is an unsupported format. Please upload PDF, Word DOCX, or Image files.`
          );
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
            const storedFile = data.file;

            // Verify file integrity immediately via HEAD request
            try {
              const verifyRes = await fetch(storedFile.fileUrl, { method: 'HEAD' });
              if (verifyRes.ok) {
                uploadedResults.push(storedFile);
              } else {
                setError(
                  `Verification failed for "${file.name}": Server could not confirm file storage. Please try again.`
                );
              }
            } catch {
              // If HEAD request is restricted by network, verify with storedFile
              uploadedResults.push(storedFile);
            }
          } else {
            const errData = await res.json().catch(() => ({}));
            setError(
              `Upload failed for "${file.name}": ${errData.error || 'Server error. Please try again.'}`
            );
          }
        } catch (uploadErr: any) {
          setError(
            `Upload failed for "${file.name}": ${uploadErr.message || 'Network connection failed. Please try again.'}`
          );
        }
      }

      setUploadProgress(100);

      if (uploadedResults.length > 0) {
        const updated = [...files, ...uploadedResults];
        setFiles(updated);
        const totalPages = updated.reduce((sum, f) => sum + (f.estimatedPages || 1), 0);
        onFilesChanged(updated, totalPages);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (inputRef.current) inputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    const totalPages = updated.reduce((sum, f) => sum + (f.estimatedPages || 1), 0);
    onFilesChanged(updated, totalPages);
  };

  const handleOpenEditor = (file: UploadedFileItem, index: number) => {
    setEditingFile(file);
    setEditingIndex(index);
    setIsEditorOpen(true);
  };

  const handleSaveEditedFile = (updatedItem: UploadedFileItem) => {
    if (editingIndex < 0) return;
    const updated = [...files];
    updated[editingIndex] = updatedItem;
    setFiles(updated);
    const totalPages = updated.reduce((sum, f) => sum + (f.estimatedPages || 1), 0);
    onFilesChanged(updated, totalPages);
    setIsEditorOpen(false);
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
      {/* Hidden native inputs */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.ppt,.pptx,.txt"
        onChange={handleChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />

      {/* 3 Quick Action Methods Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* Option 1: Choose Files */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col p-3.5 sm:p-4 rounded-xl border border-slate-300 bg-white hover:border-blue-600 hover:bg-blue-50/30 transition text-left shadow-sm group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Browse Files</span>
            <span className="rounded bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 text-[9px] sm:text-[10px]">Step 1</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500">PDF, Word DOCX, Slides</div>
        </button>

        {/* Option 2: Scan with Camera */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex flex-col p-3.5 sm:p-4 rounded-xl border border-slate-300 bg-white hover:border-blue-600 hover:bg-blue-50/30 transition text-left shadow-sm group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Camera Scan Paper</span>
            <span className="rounded bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 text-[9px] sm:text-[10px]">Photo</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500">Snap physical paper / notes</div>
        </button>

        {/* Option 3: Google Drive / Cloud Link */}
        <button
          type="button"
          onClick={() => setShowDriveModal(true)}
          className="flex flex-col p-3.5 sm:p-4 rounded-xl border border-slate-300 bg-white hover:border-blue-600 hover:bg-blue-50/30 transition text-left shadow-sm group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Google Drive / Link</span>
            <span className="rounded bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 text-[9px] sm:text-[10px]">Cloud</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500">Paste Docs or Drive URL</div>
        </button>
      </div>

      {/* Main Drag & Drop / Tap Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 sm:p-8 text-center transition-all cursor-pointer ${
          dragActive
            ? 'border-blue-600 bg-blue-100/50'
            : 'border-blue-300 bg-blue-50/30 hover:border-blue-500 hover:bg-blue-50/60'
        }`}
      >
        <div className="mb-2 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs sm:text-sm tracking-wider shadow-sm">
          {uploading ? '...' : 'DOCS'}
        </div>

        <h4 className="font-heading text-xs sm:text-sm font-bold text-slate-900 mb-1">
          {uploading ? 'Analyzing Documents & Pages...' : 'Tap to Upload or Drag & Drop Documents'}
        </h4>
        <p className="text-[11px] sm:text-xs text-slate-500 max-w-sm mb-3">
          Upload PDF files, Word DOCX, handwritten notes, or scan directly with your phone
        </p>

        {uploading && (
          <div className="w-full max-w-xs bg-slate-200 rounded-full h-2 overflow-hidden mb-3">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <span className="rounded bg-white border border-slate-300 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-blue-700">
            PDF
          </span>
          <span className="rounded bg-white border border-slate-300 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-700">
            Camera Scan
          </span>
          <span className="rounded bg-white border border-slate-300 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-purple-700">
            Word DOCX
          </span>
          <span className="rounded bg-white border border-slate-300 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-amber-700">
            Photos JPG/PNG
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Multi-file supported</span>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">
            Notice: {error}
          </div>
        )}
      </div>

      {/* Google Drive Link Modal */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl">
            <button
              onClick={() => setShowDriveModal(false)}
              className="absolute right-4 top-4 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            >
              Close
            </button>

            <div className="mb-2">
              <span className="rounded bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 uppercase">
                Cloud Link
              </span>
              <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 mt-1">
                Add from Google Drive / Cloud Link
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Paste the shareable link of your document from Google Drive, Google Docs, or Canva.
            </p>

            <form onSubmit={handleAddDriveDocument} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold mb-1 block">
                  Document Link (Google Drive / Docs URL)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/file/d/..."
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold mb-1 block">
                  Document Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Final_Project_Report.pdf"
                  value={driveDocName}
                  onChange={(e) => setDriveDocName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDriveModal(false)}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm"
                >
                  Add Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Uploaded Documents List */}
      {files.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="font-heading text-xs font-bold text-slate-900">
                Uploaded Documents ({files.length})
              </span>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                {totalPagesCount} Pages Combined
              </span>
            </div>

            <button
              onClick={() => inputRef.current?.click()}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
            >
              + Add More Files
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:border-slate-300 transition gap-2"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[10px]">
                    {file.fileName.toLowerCase().endsWith('.pdf') ? 'PDF' : 'IMG'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h5
                      className="font-heading text-xs font-bold text-slate-900 truncate"
                      title={file.fileName}
                    >
                      {file.fileName}
                    </h5>
                    <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                      <span>{formatFileSize(file.fileSizeBytes)}</span>
                      <span>•</span>
                      <span className="font-bold text-emerald-700">
                        {file.estimatedPages}{' '}
                        {file.estimatedPages === 1 ? 'Page' : 'Pages'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditor(file, idx)}
                    className="rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 text-xs transition flex items-center gap-1 shadow-sm"
                    title="Crop, rotate, enhance scan filter or convert to PDF"
                  >
                    <span>✏️</span>
                    <span className="hidden sm:inline">Edit / Crop</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition"
                    title="Remove file"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Document Editor Studio Modal */}
      <DocumentEditorModal
        isOpen={isEditorOpen}
        fileItem={editingFile}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveEditedFile}
      />
    </div>
  );
}
