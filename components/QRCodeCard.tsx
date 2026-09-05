'use client';

import React, { useState } from 'react';
import { Download, Printer, Share2, Check, QrCode } from 'lucide-react';

interface QRCodeCardProps {
  shopId: string;
  shopName: string;
  qrDataUrl: string;
  address?: string;
  phone?: string;
}

export default function QRCodeCard({
  shopId,
  shopName,
  qrDataUrl,
  address,
  phone,
}: QRCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${shopName.replace(/\s+/g, '_')}_Counter_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    const shopUrl = `${window.location.origin}/shop/${shopId}`;
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 backdrop-blur-xl shadow-2xl max-w-sm mx-auto text-center">
      {/* Brand Badge */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-white">
          <Printer className="h-4 w-4" />
        </div>
        <span className="font-heading text-lg font-bold text-white tracking-tight">
          Print<span className="text-sky-400">Porter</span>
        </span>
      </div>

      <h3 className="font-heading text-xl font-extrabold text-white mb-1">
        {shopName}
      </h3>
      {address && (
        <p className="text-xs text-slate-400 mb-4 line-clamp-2 px-2">
          {address}
        </p>
      )}

      {/* QR Code Container with sleek white placard styling */}
      <div className="relative mx-auto my-4 w-60 rounded-2xl bg-white p-4 shadow-xl ring-4 ring-sky-500/20">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`${shopName} QR Code`}
            className="h-52 w-52 mx-auto rounded-lg"
          />
        ) : (
          <div className="flex h-52 w-52 items-center justify-center text-slate-400">
            <QrCode className="h-16 w-16 animate-pulse" />
          </div>
        )}
        <div className="mt-2 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-800">
            Scan with phone camera
          </p>
          <p className="text-[9px] text-slate-500 font-medium">
            Upload & print instantly
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 grid grid-cols-2 gap-2.5">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 px-3 py-2.5 text-xs font-bold text-white hover:bg-sky-400 transition shadow-lg shadow-sky-500/25"
        >
          <Download className="h-3.5 w-3.5" />
          Download PNG
        </button>

        <button
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  );
}
