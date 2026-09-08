'use client';

import React from 'react';

interface Document3DProps {
  title?: string;
  pages?: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export default function Document3D({
  title = 'Project_Report_2026.pdf',
  pages = 12,
  size = 'md',
  animated = true,
}: Document3DProps) {
  const scale = size === 'sm' ? 0.8 : size === 'lg' ? 1.2 : 1;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${
        animated ? 'animate-float-slow' : ''
      }`}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
    >
      {/* 3D Soft Ambient Shadow */}
      <div className="absolute -bottom-4 w-40 h-8 bg-blue-600/20 rounded-full blur-lg" />

      {/* Layer 3: Bottom Page */}
      <div className="absolute w-36 h-48 rounded-xl bg-slate-200 border border-slate-300 transform rotate-6 translate-y-3 translate-x-3 shadow-sm opacity-60" />

      {/* Layer 2: Middle Page */}
      <div className="absolute w-36 h-48 rounded-xl bg-blue-100 border border-blue-200 transform -rotate-3 translate-y-1.5 -translate-x-1 shadow-md opacity-80" />

      {/* Layer 1: Foreground Top Page */}
      <div className="relative w-36 h-48 rounded-xl bg-gradient-to-br from-white via-white to-blue-50/40 border border-slate-200 shadow-[0_12px_28px_-6px_rgba(37,99,235,0.2)] p-3 flex flex-col justify-between overflow-hidden">
        {/* Top Curl / Fold Ribbon Accent */}
        <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-bl from-blue-600 to-cyan-500 transform rotate-45 shadow-sm" />
        </div>

        {/* Header with Document Type Badge */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-rose-500 text-[9px] font-black text-white">
              PDF
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              {pages} Pages
            </span>
          </div>

          <div className="text-[11px] font-black text-slate-800 line-clamp-1 leading-tight font-heading">
            {title}
          </div>
        </div>

        {/* Abstract Document Content Lines */}
        <div className="space-y-1.5 my-2">
          <div className="h-1.5 w-full bg-slate-200 rounded-full" />
          <div className="h-1.5 w-5/6 bg-slate-100 rounded-full" />
          <div className="h-1.5 w-4/5 bg-slate-100 rounded-full" />
          <div className="h-1.5 w-3/4 bg-blue-100 rounded-full" />
          <div className="h-1.5 w-2/3 bg-slate-100 rounded-full" />
        </div>

        {/* Bottom verification badge */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            <span className="text-[8px] font-bold text-blue-700">Duplex • Color</span>
          </div>
          <span className="text-[9px] font-black text-slate-900">₹{pages * 3.5}</span>
        </div>
      </div>
    </div>
  );
}
