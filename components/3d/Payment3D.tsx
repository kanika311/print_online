'use client';

import React from 'react';

interface Payment3DProps {
  amount?: number;
  method?: 'UPI' | 'CASH';
  size?: 'sm' | 'md';
}

export default function Payment3D({
  amount = 48,
  method = 'UPI',
  size = 'md',
}: Payment3DProps) {
  const scale = size === 'sm' ? 0.85 : 1;

  return (
    <div
      className="relative inline-flex items-center justify-center select-none animate-float-slow"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
    >
      <div className="absolute -bottom-3 w-36 h-6 bg-blue-600/20 rounded-full blur-md" />

      {/* 3D Fintech Badge Card */}
      <div className="relative w-44 rounded-2xl bg-gradient-to-br from-white via-slate-50 to-blue-50/70 border border-slate-200/90 shadow-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-black text-[10px] shadow-sm">
              ₹
            </div>
            <span className="text-[10px] font-black text-slate-800 tracking-wider font-heading">
              {method === 'UPI' ? 'UPI Direct' : 'Cash Counter'}
            </span>
          </div>
          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            0% Fee
          </span>
        </div>

        <div className="my-2.5">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            Total Payable
          </div>
          <div className="text-xl font-black text-slate-900 font-heading">
            ₹{amount.toFixed(2)}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[8px] text-slate-500 font-semibold">
          <span>● Instant Spool</span>
          <span className="text-blue-600 font-bold">Auto-Print</span>
        </div>
      </div>
    </div>
  );
}
