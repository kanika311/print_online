'use client';

import React from 'react';

interface Location3DProps {
  hubName?: string;
  distance?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Location3D({
  hubName = 'Apex Cyber Hub',
  distance = '150m away',
  size = 'md',
}: Location3DProps) {
  const scale = size === 'sm' ? 0.8 : size === 'lg' ? 1.2 : 1;

  return (
    <div
      className="relative inline-flex flex-col items-center justify-center select-none"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
    >
      {/* 3D Radar Concentric Ripples */}
      <div className="absolute top-16 w-32 h-12 flex items-center justify-center">
        <div className="absolute w-28 h-10 rounded-full border border-blue-400/30 animate-pulse-glow" />
        <div className="absolute w-20 h-7 rounded-full border border-cyan-400/40 animate-ping" />
        <div className="absolute w-12 h-4 rounded-full bg-blue-600/20 blur-sm" />
      </div>

      {/* Floating 3D Map Pin */}
      <div className="relative animate-float z-10 flex flex-col items-center">
        {/* Floating Bubble Badge */}
        <div className="mb-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-800 font-heading">
            {distance}
          </span>
        </div>

        {/* 3D Pin Head */}
        <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-400 p-1 shadow-[0_10px_20px_rgba(37,99,235,0.4)] flex items-center justify-center border-2 border-white">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-inner">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>

        {/* Pin Tip Point */}
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-700 -mt-0.5" />
      </div>

      {/* Ground Pinpoint Base */}
      <div className="mt-2 text-center">
        <div className="text-[11px] font-black text-slate-800 font-heading">
          {hubName}
        </div>
        <div className="text-[9px] font-semibold text-blue-600">
          ● Ready for pick-up
        </div>
      </div>
    </div>
  );
}
