'use client';

import React from 'react';

export default function Network3D() {
  return (
    <div className="relative w-full max-w-4xl mx-auto py-6 px-4 select-none">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-cyan-500/10 to-blue-600/5 rounded-3xl blur-2xl" />

      {/* Main Glassmorphic Display Frame */}
      <div className="relative rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_20px_50px_rgba(37,99,235,0.12)] p-6 sm:p-8">
        {/* Top Status Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 font-heading">
              Prinly Cloud-to-Counter Mesh Network
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ⚡ 0.8s Latency
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              End-to-End Encrypted
            </span>
          </div>
        </div>

        {/* 5-Node Interactive Visual Pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative items-center">
          {/* Node 1: User Phone */}
          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50 border border-slate-200 hover-lift-3d transition">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg mb-2 relative">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="5" y="2" width="14" height="20" rx="3" />
                <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
              </svg>
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-cyan-400 rounded-full border-2 border-white" />
            </div>
            <span className="text-xs font-black text-slate-900 font-heading">1. User Phone</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Any device or browser</span>
          </div>

          {/* Connection Vector 1 */}
          <div className="hidden sm:flex flex-col items-center justify-center">
            <svg className="w-full h-8" viewBox="0 0 100 20" fill="none">
              <path d="M0 10 H100" stroke="#93c5fd" strokeWidth="2" strokeDasharray="4 4" className="animate-data-flow" />
              <circle cx="50" cy="10" r="3" fill="#2563eb" className="animate-pulse" />
            </svg>
            <span className="text-[9px] font-extrabold text-blue-600">SSL UPLOAD</span>
          </div>

          {/* Node 2: Cloud Spooler */}
          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-blue-50/60 border border-blue-200 hover-lift-3d transition">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 text-white flex items-center justify-center shadow-lg mb-2 relative">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              </svg>
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <span className="text-xs font-black text-slate-900 font-heading">2. Cloud Spooler</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Parse, render & quote</span>
          </div>

          {/* Connection Vector 2 */}
          <div className="hidden sm:flex flex-col items-center justify-center">
            <svg className="w-full h-8" viewBox="0 0 100 20" fill="none">
              <path d="M0 10 H100" stroke="#93c5fd" strokeWidth="2" strokeDasharray="4 4" className="animate-data-flow" />
              <circle cx="50" cy="10" r="3" fill="#06b6d4" className="animate-pulse" />
            </svg>
            <span className="text-[9px] font-extrabold text-cyan-600">GPS MATCH</span>
          </div>

          {/* Node 3: Cyber Cafe Hub */}
          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50 border border-slate-200 hover-lift-3d transition">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center shadow-lg mb-2 relative">
              <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
              </svg>
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <span className="text-xs font-black text-slate-900 font-heading">3. Nearby Hub</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Direct Shop Queue</span>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg sm:text-xl font-black text-slate-900 font-heading">&lt; 2 mins</div>
            <div className="text-[11px] text-slate-500 font-medium">Average Pickup Time</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-blue-600 font-heading">Zero Queue</div>
            <div className="text-[11px] text-slate-500 font-medium">Auto-Spool System</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-cyan-600 font-heading">Shop UPI / Cash</div>
            <div className="text-[11px] text-slate-500 font-medium">Direct Settlement</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-emerald-600 font-heading">100% Privacy</div>
            <div className="text-[11px] text-slate-500 font-medium">Auto-Purged Post Print</div>
          </div>
        </div>
      </div>
    </div>
  );
}
