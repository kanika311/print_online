'use client';

import React from 'react';

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
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 shadow-sm">
        No printers currently registered for this cyber cafe.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-heading text-xs font-bold uppercase tracking-wider text-slate-700">
          Select Printer Machine
        </label>
        <span className="text-xs text-slate-500 font-medium">
          {printers.filter((p) => p.status === 'AVAILABLE').length} of {printers.length} online
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {printers.map((printer, idx) => {
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
              className={`relative flex flex-col justify-between rounded-xl border p-4 transition cursor-pointer shadow-sm ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600'
                  : isOffline
                  ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {/* Header: Machine Name and Status Badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    P{idx + 1}
                  </div>
                  <div>
                    <h5 className="font-heading text-xs font-bold text-slate-900 line-clamp-1">
                      {printer.name}
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      {printer.model}
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                {isAvailable && (
                  <span className="rounded bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Available
                  </span>
                )}
                {isBusy && (
                  <span className="rounded bg-amber-50 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    Busy ({printer.queueCount || 1} in queue)
                  </span>
                )}
                {isOffline && (
                  <span className="rounded bg-slate-100 border border-slate-300 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                    Offline
                  </span>
                )}
              </div>

              {/* Specs Chips */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 font-bold text-blue-700">
                  {printer.type === 'COLOR' ? 'Color + Mono' : 'Monochrome'}
                </span>
                <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 font-medium text-slate-600">
                  {printer.ppmSpeed} PPM Speed
                </span>
                {printer.supportsDuplex && (
                  <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-bold text-emerald-700">
                    Duplex Ready
                  </span>
                )}
              </div>

              {/* Selection Text Badge */}
              {isSelected && (
                <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded">
                  Active
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
