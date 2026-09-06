'use client';

import React, { useState } from 'react';

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
    const origin =
      typeof window !== 'undefined' &&
      !window.location.origin.includes('localhost') &&
      !window.location.origin.includes('127.0.0.1')
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || 'https://printonline-two.vercel.app';
    const shopUrl = `${origin}/shop/${shopId}`;
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md max-w-sm mx-auto text-center">
      {/* Brand Badge */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
          PP
        </div>
        <span className="font-heading text-base font-bold text-slate-900 tracking-tight">
          Print<span className="text-blue-600">Porter</span>
        </span>
      </div>

      <h3 className="font-heading text-lg font-bold text-slate-900 mb-1">
        {shopName}
      </h3>
      {address && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2 px-2">
          {address}
        </p>
      )}

      {/* QR Code Container with sleek white placard styling */}
      <div className="relative mx-auto my-3 w-56 rounded-xl bg-white p-3 border-2 border-slate-200 shadow-sm">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`${shopName} QR Code`}
            className="h-48 w-48 mx-auto object-contain"
          />
        ) : (
          <div className="flex h-48 w-48 items-center justify-center text-slate-400 font-bold text-xs">
            Generating QR Code...
          </div>
        )}
        <div className="mt-2 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Scan with phone camera
          </p>
          <p className="text-[9px] text-slate-500 font-medium">
            Upload & print instantly
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={handleDownload}
          className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm"
        >
          Download PNG
        </button>

        <button
          onClick={handleCopyLink}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          {copied ? 'Copied URL!' : 'Copy Link'}
        </button>
      </div>
    </div>
  );
}
