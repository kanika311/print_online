'use client';

import React from 'react';

interface Printer3DProps {
  status?: 'ONLINE' | 'PRINTING' | 'OFFLINE';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export default function Printer3D({
  status = 'ONLINE',
  size = 'md',
  animated = true,
}: Printer3DProps) {
  const scale = size === 'sm' ? 0.75 : size === 'lg' ? 1.25 : 1;

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
      {/* 3D Soft Shadow */}
      <div className="absolute -bottom-4 w-44 h-8 bg-blue-600/15 rounded-full blur-md transform scale-x-110" />

      {/* Printer 3D Body Container */}
      <div className="relative w-48 h-40 transform-style-3d">
        {/* Top Paper Tray & Input Stack */}
        <div className="absolute -top-6 left-8 right-8 h-12 bg-gradient-to-b from-slate-200 to-slate-300 rounded-t-lg shadow-inner border-t border-x border-slate-300 transform -rotate-x-12">
          {/* Stacked sheets */}
          <div className="absolute top-1 left-2 right-2 h-7 bg-white rounded-t shadow-sm border-t border-slate-200" />
          <div className="absolute top-2.5 left-3 right-3 h-7 bg-white/90 rounded-t shadow-sm border-t border-slate-200" />
          <div className="absolute top-4 left-4 right-4 h-7 bg-blue-50 rounded-t shadow-sm border-t border-blue-200 flex items-center justify-center">
            <span className="text-[8px] font-bold text-blue-700 tracking-wider">A4 80GSM</span>
          </div>
        </div>

        {/* Main Printer Chassis */}
        <div className="absolute top-4 inset-x-0 bottom-0 rounded-2xl bg-gradient-to-b from-white via-slate-50 to-slate-100 border border-slate-200/90 shadow-[0_16px_32px_-8px_rgba(37,99,235,0.18)] p-3 flex flex-col justify-between overflow-hidden">
          {/* Top Bevel Highlight */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />

          {/* Upper Console: Status screen & controls */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[10px] font-black tracking-wider text-slate-800 uppercase font-heading">
                Prinly Pro
              </span>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status === 'PRINTING'
                    ? 'bg-amber-500 animate-ping'
                    : status === 'ONLINE'
                    ? 'bg-emerald-500'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-[9px] font-bold text-slate-600">
                {status === 'PRINTING' ? 'BUSY' : status}
              </span>
            </div>
          </div>

          {/* Interactive LCD Mini Screen */}
          <div className="my-1 rounded-lg bg-slate-900 p-2 text-cyan-400 font-mono shadow-inner border border-slate-800 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] text-cyan-200/80 font-bold">READY TO PRINT</span>
              <span className="text-[8px] text-slate-400">Queue: 0 jobs • 1200 DPI</span>
            </div>
            <div className="flex items-center gap-0.5">
              <span className="h-3 w-1 bg-cyan-400/30 rounded-sm" />
              <span className="h-3 w-1 bg-cyan-400/60 rounded-sm" />
              <span className="h-3 w-1 bg-cyan-400 rounded-sm" />
            </div>
          </div>

          {/* Paper Output Slot & Ejected Document */}
          <div className="relative h-9 bg-slate-800 rounded-lg p-1 flex items-center justify-center overflow-hidden border-t-2 border-slate-900">
            {/* Output rollers */}
            <div className="absolute inset-x-4 top-0.5 h-1 bg-slate-700 rounded-full" />

            {/* Extruding Document with Smooth Micro Animation */}
            <div className="relative w-36 bg-white rounded-md shadow-md border border-slate-200 p-1 transform translate-y-1 hover:translate-y-0 transition-transform">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded bg-blue-600" />
                  <div className="h-1 w-12 bg-slate-200 rounded" />
                </div>
                <span className="text-[7px] font-bold text-emerald-600">PAID & READY</span>
              </div>
              <div className="mt-1 space-y-0.5">
                <div className="h-0.5 w-full bg-slate-100 rounded" />
                <div className="h-0.5 w-4/5 bg-slate-100 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
