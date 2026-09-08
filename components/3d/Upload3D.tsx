'use client';

import React from 'react';

export default function Upload3D({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.25 : 1;

  return (
    <div
      className="relative inline-flex items-center justify-center select-none animate-float"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
    >
      <div className="absolute -bottom-4 w-44 h-8 bg-blue-600/15 rounded-full blur-md" />

      {/* Cloud 3D Body */}
      <div className="relative w-48 h-36 rounded-3xl bg-gradient-to-tr from-white via-blue-50 to-cyan-50/50 border border-slate-200/90 shadow-[0_16px_36px_-6px_rgba(37,99,235,0.18)] p-4 flex flex-col items-center justify-center overflow-hidden">
        {/* Glow particle accents */}
        <div className="absolute top-2 right-4 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <div className="absolute bottom-3 left-4 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />

        {/* Upload Arrow Symbol */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg transform -translate-y-1">
          <svg
            className="w-7 h-7 transform animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>

        <div className="mt-2 text-center">
          <div className="text-xs font-black text-slate-800 font-heading">
            Upload Anywhere
          </div>
          <div className="text-[9px] font-semibold text-slate-500">
            PDF • DOCX • Photos
          </div>
        </div>
      </div>
    </div>
  );
}
