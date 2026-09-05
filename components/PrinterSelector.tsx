'use client';

import React from 'react';
import { Printer, Check, Clock, Zap, AlertTriangle } from 'lucide-react';
import { IPrinter } from '@/models/Printer';

interface PrinterSelectorProps {
  printers: any[];
  selectedPrinterId: string | null;
  onSelectPrinter: (printerId: string) => void;
}

export default function PrinterSelector({
  printers,
  selectedPrinterId,
  onSelectPrinter,
}: PrinterSelectorProps) {
  if (!printers || printers.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-center text-xs text-slate-400">
        No printers currently registered for this cyber cafe.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-heading text-sm font-bold text-white">
          Select Printer Machine
        </label>
        <span className="text-xs text-slate-400">
          {printers.filter((p) => p.status === 'AVAILABLE').length} of {printers.length} online
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {printers.map((printer) => {
          const isSelected = selectedPrinterId === (printer._id || printer.id);
          const isAvailable = printer.status === 'AVAILABLE';
          const isBusy = printer.status === 'BUSY';
          const isOffline = printer.status === 'OFFLINE';

          return (
            <div
              key={printer._id || printer.id}
              onClick={() => {
                if (!isOffline) {
                  onSelectPrinter(printer._id || printer.id);
                }
              }}
              className={`relative flex flex-col justify-between rounded-2xl border p-4 transition cursor-pointer ${
                isSelected
                  ? 'border-sky-400 bg-sky-500/15 shadow-lg shadow-sky-500/15 ring-2 ring-sky-500/30'
                  : isOffline
                  ? 'border-white/5 bg-slate-900/40 opacity-60 cursor-not-allowed'
                  : 'border-white/10 bg-slate-900/70 hover:border-white/20 hover:bg-slate-900'
              }`}
            >
              {/* Header: Machine Name and Status Badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      isSelected
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Printer className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-heading text-xs font-bold text-white line-clamp-1">
                      {printer.name}
                    </h5>
                    <p className="text-[10px] text-slate-400">
                      {printer.model}
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                {isAvailable && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Available
                  </span>
                )}
                {isBusy && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Busy ({printer.queueCount || 1} in queue)
                  </span>
                )}
                {isOffline && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                    Offline
                  </span>
                )}
              </div>

              {/* Specs Chips */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="rounded bg-white/5 px-2 py-0.5 font-medium text-sky-400">
                  {printer.type === 'COLOR' ? 'Color + Mono' : 'Monochrome'}
                </span>
                <span className="rounded bg-white/5 px-2 py-0.5 font-medium text-slate-300">
                  {printer.ppmSpeed} PPM Speed
                </span>
                {printer.supportsDuplex && (
                  <span className="rounded bg-white/5 px-2 py-0.5 font-medium text-emerald-400">
                    Duplex Ready
                  </span>
                )}
              </div>

              {/* Selection Checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-white shadow-md">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
