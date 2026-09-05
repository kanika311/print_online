'use client';

import React, { useState, useEffect } from 'react';
import { calculatePrintPrice, PricingBreakdown } from '@/services/pricingService';

export interface PrintSettings {
  pageRange: string;
  copies: number;
  isColor: boolean;
  isDuplex: boolean;
  paperSize: string;
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  binding: string;
  notes: string;
  pricing: PricingBreakdown;
}

interface PrintConfiguratorProps {
  totalPages: number;
  shopPricingRates?: any;
  onChange: (settings: PrintSettings) => void;
}

export default function PrintConfigurator({
  totalPages,
  shopPricingRates,
  onChange,
}: PrintConfiguratorProps) {
  const [pageOption, setPageOption] = useState<'ALL' | 'CUSTOM'>('ALL');
  const [customRange, setCustomRange] = useState('');
  const [effectivePageCount, setEffectivePageCount] = useState(totalPages || 1);
  const [copies, setCopies] = useState(1);
  const [isColor, setIsColor] = useState(false);
  const [isDuplex, setIsDuplex] = useState(false);
  const [paperSize, setPaperSize] = useState('A4');
  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>('PORTRAIT');
  const [binding, setBinding] = useState('None');
  const [notes, setNotes] = useState('');

  // Effective page count
  useEffect(() => {
    if (pageOption === 'ALL') {
      setEffectivePageCount(totalPages || 1);
    } else {
      if (customRange.includes('-')) {
        const parts = customRange.split('-');
        const start = parseInt(parts[0], 10) || 1;
        const end = parseInt(parts[1], 10) || totalPages;
        setEffectivePageCount(Math.max(1, end - start + 1));
      } else if (customRange.includes(',')) {
        setEffectivePageCount(customRange.split(',').length);
      } else if (parseInt(customRange, 10)) {
        setEffectivePageCount(1);
      } else {
        setEffectivePageCount(totalPages || 1);
      }
    }
  }, [pageOption, customRange, totalPages]);

  // Pricing calculation
  const pricing = calculatePrintPrice({
    pageCount: effectivePageCount,
    copies,
    isColor,
    isDuplex,
    paperSize,
    orientation,
    binding,
    shopRates: shopPricingRates,
  });

  useEffect(() => {
    onChange({
      pageRange: pageOption === 'ALL' ? `All (${effectivePageCount} pgs)` : customRange || `1-${effectivePageCount}`,
      copies,
      isColor,
      isDuplex,
      paperSize,
      orientation,
      binding,
      notes,
      pricing,
    });
  }, [
    effectivePageCount,
    copies,
    isColor,
    isDuplex,
    paperSize,
    orientation,
    binding,
    notes,
  ]);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. Paper Size Choice */}
      <div>
        <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 block">
          1. Paper Size
        </label>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
          {[
            { id: 'A4', label: 'A4', sub: '210 × 297 mm', badge: 'Standard' },
            { id: 'A3', label: 'A3', sub: '297 × 420 mm', badge: '+₹5' },
            { id: 'Legal', label: 'Legal', sub: '216 × 356 mm', badge: 'Court' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPaperSize(item.id)}
              className={`relative flex flex-col items-center justify-center rounded-xl border p-2.5 sm:p-3 transition text-center shadow-sm ${
                paperSize === item.id
                  ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-600'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              <span className="font-heading text-xs sm:text-sm font-extrabold text-slate-900">
                {item.label}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">{item.sub}</span>
              <span className="mt-1 rounded bg-slate-100 border border-slate-200 px-1.5 py-0.2 text-[8px] sm:text-[9px] font-bold text-slate-700">
                {item.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Color Mode & Orientation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Color Mode */}
        <div>
          <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 block">
            2. Colour Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsColor(false)}
              className={`rounded-xl border p-2.5 sm:p-3 transition text-center shadow-sm ${
                !isColor
                  ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-600'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              <span className="block font-heading text-xs font-bold text-slate-900">Black & White</span>
              <span className="block text-[10px] text-slate-500 mt-0.5">₹2.00 / page</span>
            </button>

            <button
              type="button"
              onClick={() => setIsColor(true)}
              className={`rounded-xl border p-2.5 sm:p-3 transition text-center shadow-sm ${
                isColor
                  ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-600'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              <span className="block font-heading text-xs font-bold text-slate-900">Vibrant Colour</span>
              <span className="block text-[10px] text-slate-500 mt-0.5">₹10.00 / page</span>
            </button>
          </div>
        </div>

        {/* Orientation: Portrait vs Landscape */}
        <div>
          <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 block">
            3. Orientation
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOrientation('PORTRAIT')}
              className={`rounded-xl border p-2.5 sm:p-3 transition text-center shadow-sm ${
                orientation === 'PORTRAIT'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-600'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              <span className="font-heading text-xs font-bold text-slate-900 block">Portrait</span>
              <span className="text-[10px] text-slate-500">Vertical</span>
            </button>

            <button
              type="button"
              onClick={() => setOrientation('LANDSCAPE')}
              className={`rounded-xl border p-2.5 sm:p-3 transition text-center shadow-sm ${
                orientation === 'LANDSCAPE'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-600'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              <span className="font-heading text-xs font-bold text-slate-900 block">Landscape</span>
              <span className="text-[10px] text-slate-500">Horizontal</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Single vs Double Sided (Sides) */}
      <div>
        <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 block">
          4. Printing Sides
        </label>
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setIsDuplex(false)}
            className={`rounded-xl border p-3 sm:p-3.5 transition text-left shadow-sm ${
              !isDuplex
                ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600'
                : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          >
            <span className="block font-heading text-xs font-bold text-slate-900">Single-Sided</span>
            <span className="block text-[10px] sm:text-[11px] text-slate-500 mt-0.5">One side of leaf</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDuplex(true)}
            className={`rounded-xl border p-3 sm:p-3.5 transition text-left shadow-sm ${
              isDuplex
                ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600'
                : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-heading text-xs font-bold text-slate-900">Double-Sided</span>
              <span className="rounded bg-emerald-100 text-emerald-800 px-1 py-0.2 text-[8px] sm:text-[9px] font-bold">
                10% Off
              </span>
            </div>
            <span className="block text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Eco duplex</span>
          </button>
        </div>
      </div>

      {/* 5. Copies & Custom Pages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Copies Stepper */}
        <div>
          <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
            5. Number of Copies
          </label>
          <div className="flex items-center rounded-xl border border-slate-300 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setCopies(Math.max(1, copies - 1))}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-slate-100 text-base font-bold text-slate-800 hover:bg-slate-200 transition"
            >
              -
            </button>
            <div className="flex-1 text-center font-heading text-xs sm:text-sm font-bold text-slate-900">
              {copies} {copies === 1 ? 'Copy' : 'Copies'}
            </div>
            <button
              type="button"
              onClick={() => setCopies(copies + 1)}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-blue-600 text-base font-bold text-white hover:bg-blue-700 transition"
            >
              +
            </button>
          </div>
        </div>

        {/* Page Range Selector */}
        <div>
          <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
            6. Pages to Print
          </label>
          <div className="grid grid-cols-2 gap-1.5 mb-1.5">
            <button
              type="button"
              onClick={() => setPageOption('ALL')}
              className={`rounded-xl border py-2 text-xs font-bold transition shadow-sm ${
                pageOption === 'ALL'
                  ? 'border-blue-600 bg-blue-50 text-blue-800 ring-1 ring-blue-600'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              All ({totalPages})
            </button>
            <button
              type="button"
              onClick={() => setPageOption('CUSTOM')}
              className={`rounded-xl border py-2 text-xs font-bold transition shadow-sm ${
                pageOption === 'CUSTOM'
                  ? 'border-blue-600 bg-blue-50 text-blue-800 ring-1 ring-blue-600'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Custom Range
            </button>
          </div>
          {pageOption === 'CUSTOM' && (
            <input
              type="text"
              value={customRange}
              onChange={(e) => setCustomRange(e.target.value)}
              placeholder="e.g. 1-4, 7"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm"
            />
          )}
        </div>
      </div>

      {/* 6. Binding Finishing */}
      <div>
        <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
          7. Binding & Finishing
        </label>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {[
            { id: 'None', label: 'None', fee: 'Free' },
            { id: 'Corner Staple', label: 'Corner Staple', fee: '+₹5' },
            { id: 'Spiral Binding', label: 'Spiral Ring', fee: '+₹35' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setBinding(item.id)}
              className={`rounded-xl border p-2 sm:p-2.5 text-center transition shadow-sm ${
                binding === item.id
                  ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              <span className="block font-heading text-[11px] sm:text-xs font-bold text-slate-900 truncate">{item.label}</span>
              <span className="block text-[9px] sm:text-[10px] text-blue-700 font-semibold">{item.fee}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Clear Print Total Display Card */}
      <div className="rounded-xl sm:rounded-2xl border-2 border-blue-600 bg-white p-4 sm:p-5 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
          <span className="font-heading text-xs font-bold text-slate-900 uppercase tracking-wider">
            Live Cost Summary
          </span>
          <span className="rounded bg-blue-100 text-blue-800 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold">
            Auto Calculated
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>
              {pricing.pagesTotal} total pages @ ₹{pricing.ratePerPage.toFixed(2)}/pg:
            </span>
            <span className="font-bold text-slate-900">₹{pricing.printingSubtotal.toFixed(2)}</span>
          </div>

          {pricing.bindingFee > 0 && (
            <div className="flex justify-between">
              <span>Binding ({binding}):</span>
              <span className="font-bold text-slate-900">₹{pricing.bindingFee.toFixed(2)}</span>
            </div>
          )}

          {pricing.paperSurcharge > 0 && (
            <div className="flex justify-between">
              <span>Paper surcharge ({paperSize}):</span>
              <span className="font-bold text-slate-900">₹{pricing.paperSurcharge.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-500">
            <span>GST Tax (5%):</span>
            <span>₹{pricing.gstAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Clear Print Total */}
        <div className="mt-3 sm:mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
          <div>
            <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Print Total
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Inclusive of all taxes</span>
          </div>
          <div className="font-heading text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
            ₹{pricing.totalPrice.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
