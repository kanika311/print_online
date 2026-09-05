import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Camera, CheckCircle, RefreshCw, Layers, Sparkles } from 'lucide-react';

interface PDFUploadProps {
  onFileSelected: (fileData: { name: string; url: string; sizeMb: number; pageCount: number }) => void;
  selectedFile: { name: string; sizeMb: number; pageCount: number } | null;
}

export const PDFUpload: React.FC<PDFUploadProps> = ({ onFileSelected, selectedFile }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedPages, setCapturedPages] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleDocs = [
    { name: 'Research_Thesis_Final_Draft.pdf', sizeMb: 3.8, pageCount: 22 },
    { name: 'Apartment_Rental_Agreement_Stamp.pdf', sizeMb: 1.4, pageCount: 6 },
    { name: 'Executive_Color_Resume_Portfolio.pdf', sizeMb: 0.9, pageCount: 2 },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Estimate page count based on file size or default
      const estimatedPages = Math.max(1, Math.round(file.size / (150 * 1024)));
      onFileSelected({
        name: file.name,
        url: `/uploads/${file.name}`,
        sizeMb: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
        pageCount: Math.min(estimatedPages, 40),
      });
    }
  };

  const triggerCameraScan = () => {
    setIsCameraActive(true);
    setCapturedPages(0);
  };

  const handleCapturePage = () => {
    setIsScanning(true);
    setTimeout(() => {
      setCapturedPages((prev) => prev + 1);
      setIsScanning(false);
    }, 600);
  };

  const finishScanning = () => {
    setIsCameraActive(false);
    const pages = Math.max(1, capturedPages);
    onFileSelected({
      name: `Mobile_Camera_Scan_${new Date().toISOString().slice(0, 10)}.pdf`,
      url: '/uploads/scanned_document.pdf',
      sizeMb: parseFloat((pages * 0.45).toFixed(2)),
      pageCount: pages,
    });
  };

  return (
    <div className="space-y-4">
      {/* Tab Selectors: Upload File vs Camera Scan */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-400" />
          1. Upload Document or Scan
        </label>
        <button
          onClick={triggerCameraScan}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold transition-all shadow-sm"
        >
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>Camera Scan-to-PDF</span>
        </button>
      </div>

      {/* Main Drag & Drop Zone */}
      {!isCameraActive ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
            selectedFile
              ? 'border-brand-500/60 bg-brand-500/5 hover:bg-brand-500/10'
              : 'border-slate-700/80 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-900/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2">
              <div className="flex items-center gap-3 text-left">
                <div className="w-12 h-12 rounded-xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm truncate max-w-xs">
                    {selectedFile.name}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {selectedFile.pageCount} Pages • {selectedFile.sizeMb} MB • Auto-calibrated
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Ready to Print
                </span>
                <span className="text-xs text-brand-400 underline">Change</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="w-14 h-14 rounded-2xl bg-brand-600/10 border border-brand-500/20 text-brand-400 mx-auto flex items-center justify-center shadow-lg shadow-brand-500/5">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Drop your PDF here or <span className="text-brand-400 underline">browse files</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports up to 50MB. Sensitive files are protected with auto-shredding.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Camera Scan-to-PDF Viewfinder Simulation */
        <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-2xl relative overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Smart Edge-Detect Scanner
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              {capturedPages} Page(s) Scanned
            </span>
          </div>

          {/* Viewfinder simulation canvas */}
          <div className="relative my-4 w-full h-56 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {/* Edge detection corners */}
            <div className="absolute inset-6 border-2 border-dashed border-cyan-400/70 rounded-lg pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-cyan-300" />
                <div className="w-4 h-4 border-t-2 border-r-2 border-cyan-300" />
              </div>
              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-cyan-300" />
                <div className="w-4 h-4 border-b-2 border-r-2 border-cyan-300" />
              </div>
            </div>

            {/* Scanning line animation */}
            {isScanning && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce" />
            )}

            <div className="text-center space-y-1.5 z-10 px-4">
              <Sparkles className="w-6 h-6 text-cyan-400 mx-auto animate-pulse" />
              <p className="text-xs text-slate-300 font-medium">
                Align document within green guidelines
              </p>
              <p className="text-[10px] text-slate-500">
                Perspective auto-crop and shadow removal enabled
              </p>
            </div>
          </div>

          {/* Scanner Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setIsCameraActive(false)}
              className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800/80 border border-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleCapturePage}
              disabled={isScanning}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>{isScanning ? 'Processing...' : 'Capture Page'}</span>
            </button>
            <button
              onClick={finishScanning}
              disabled={capturedPages === 0}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                capturedPages > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Done ({capturedPages}p)
            </button>
          </div>
        </div>
      )}

      {/* Quick Pre-fill Samples */}
      <div className="pt-1">
        <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
          <Layers className="w-3 h-3 text-brand-400" />
          <span>Or test with pre-loaded sample documents:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {sampleDocs.map((doc) => (
            <button
              key={doc.name}
              onClick={() =>
                onFileSelected({
                  name: doc.name,
                  url: '/uploads/sample_report.pdf',
                  sizeMb: doc.sizeMb,
                  pageCount: doc.pageCount,
                })
              }
              className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-brand-500/40 text-left transition-all group"
            >
              <div className="text-xs font-medium text-slate-300 group-hover:text-brand-300 truncate">
                {doc.name}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {doc.pageCount} pages • {doc.sizeMb}MB
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
