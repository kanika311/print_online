'use client';

import React from 'react';

interface QRCode3DProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export default function QRCode3D({
  label = 'Scan Counter QR',
  size = 'md',
  animated = true,
}: QRCode3DProps) {
  const scale = size === 'sm' ? 0.8 : size === 'lg' ? 1.2 : 1;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${
        animated ? 'animate-float' : ''
      }`}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
    >
      {/* 3D Cyan Soft Shadow */}
      <div className="absolute -bottom-4 w-44 h-8 bg-cyan-500/20 rounded-full blur-md" />

      {/* 3D Standee Card Body */}
      <div className="relative w-44 h-48 rounded-2xl bg-gradient-to-br from-white via-slate-50 to-blue-50/50 border border-slate-200/90 shadow-[0_16px_36px_-8px_rgba(6,182,212,0.25)] p-3.5 flex flex-col justify-between overflow-hidden">
        {/* Animated Laser Scanning Line */}
        <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_8px_#06b6d4] animate-laser z-20" />

        {/* Top Shop Bar */}
        <div className="flex items-center justify-between z-10 border-b border-slate-100 pb-1.5">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            <span className="text-[9px] font-black text-slate-800 tracking-wider font-heading">
              PRINLY HUB QR
            </span>
          </div>
          <span className="text-[8px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
            INSTANT
          </span>
        </div>

        {/* Realistic QR Pattern Simulation */}
        <div className="relative my-2 mx-auto w-24 h-24 bg-white p-2 rounded-xl border border-slate-200 shadow-inner flex flex-col justify-between z-10">
          {/* Top Row QR Position Markers */}
          <div className="flex justify-between">
            <div className="w-6 h-6 border-2 border-slate-900 rounded p-0.5 flex items-center justify-center">
              <div className="w-3 h-3 bg-slate-900 rounded-sm" />
            </div>
            <div className="w-6 h-6 border-2 border-slate-900 rounded p-0.5 flex items-center justify-center">
              <div className="w-3 h-3 bg-slate-900 rounded-sm" />
            </div>
          </div>

          {/* Middle Pattern Cells */}
          <div className="grid grid-cols-5 gap-1 py-1 px-0.5">
            <span className="h-1 bg-slate-800 rounded-sm" />
            <span className="h-1 bg-cyan-600 rounded-sm" />
            <span className="h-1 bg-slate-800 rounded-sm" />
            <span className="h-1 bg-slate-400 rounded-sm" />
            <span className="h-1 bg-blue-600 rounded-sm" />
            <span className="h-1 bg-slate-400 rounded-sm" />
            <span className="h-1 bg-slate-800 rounded-sm" />
            <span className="h-1 bg-blue-600 rounded-sm" />
            <span className="h-1 bg-slate-800 rounded-sm" />
            <span className="h-1 bg-cyan-500 rounded-sm" />
          </div>

          {/* Bottom Row QR Position Marker */}
          <div className="flex justify-between items-end">
            <div className="w-6 h-6 border-2 border-slate-900 rounded p-0.5 flex items-center justify-center">
              <div className="w-3 h-3 bg-slate-900 rounded-sm" />
            </div>
            {/* Center Prinly Dot */}
            <div className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[7px] font-black shadow-sm">
              P
            </div>
          </div>
        </div>

        {/* Bottom Label */}
        <div className="text-center z-10">
          <div className="text-[10px] font-black text-slate-800 leading-tight">
            {label}
          </div>
          <div className="text-[8px] text-slate-400 font-medium">
            Scan with any Camera or UPI App
          </div>
        </div>
      </div>
    </div>
  );
}
