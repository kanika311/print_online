'use client';

import React, { useState, useEffect } from 'react';
import {
  Copy,
  Palette,
  FileSpreadsheet,
  BookOpen,
  DollarSign,
  Zap,
  CheckCircle2,
  FileCheck,
  Compass,
} from 'lucide-react';
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
    <div className="space-y-5">
      {/* 1. Paper Size Choice */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 block">
          1. Paper Size
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { id: 'A4', label: 'A4', sub: '210 × 297 mm', badge: 'Standard' },
            { id: 'A3', label: 'A3', sub: '297 × 420 mm', badge: '+₹5' },
            { id: 'Legal', label: 'Legal', sub: '216 × 356 mm', badge: 'Court' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPaperSize(item.id)}
              className={`relative flex flex-col items-center justify-center rounded-2xl border p-3.5 transition text-center ${
                paperSize === item.id
                  ? 'border-sky-400 bg-sky-500/15 shadow-lg shadow-sky-500/15 ring-2 ring-sky-500/30'
                  : 'border-white/10 bg-slate-900/80 hover:border-white/20'
              }`}
            >
              <span className="font-heading text-base font-extrabold text-white">
                {item.label}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">{item.sub}</span>
              <span className="mt-1.5 rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold text-sky-400">
                {item.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Color Mode & Orientation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Color Mode */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 block">
            2. Colour Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsColor(false)}
              className={`rounded-2xl border p-3 transition text-center ${
                !isColor
                  ? 'border-sky-400 bg-sky-500/15 shadow-md text-white ring-2 ring-sky-500/30'
                  : 'border-white/10 bg-slate-900/80 text-slate-400 hover:text-white'
              }`}
            >
              <span className="block font-heading text-xs font-bold">Black & White</span>
              <span className="block text-[10px] text-slate-400 mt-0.5">₹2.00 / page</span>
            </button>

            <button
              type="button"
              onClick={() => setIsColor(true)}
              className={`rounded-2xl border p-3 transition text-center ${
                isColor
                  ? 'border-cyan-400 bg-cyan-500/15 shadow-md text-cyan-300 ring-2 ring-cyan-500/30'
                  : 'border-white/10 bg-slate-900/80 text-slate-400 hover:text-white'
              }`}
            >
              <span className="block font-heading text-xs font-bold">Vibrant Colour</span>
              <span className="block text-[10px] text-slate-400 mt-0.5">₹10.00 / page</span>
            </button>
          </div>
        </div>

        {/* Orientation: Portrait vs Landscape */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 block">
            3. Orientation
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOrientation('PORTRAIT')}
              className={`rounded-2xl border p-3 transition text-center flex flex-col items-center justify-center ${
                orientation === 'PORTRAIT'
                  ? 'border-sky-400 bg-sky-500/15 shadow-md text-white ring-2 ring-sky-500/30'
                  : 'border-white/10 bg-slate-900/80 text-slate-400 hover:text-white'
              }`}
            >
              <div className="h-5 w-3.5 border-2 border-current rounded-sm mb-1" />
              <span className="font-heading text-xs font-bold">Portrait</span>
              <span className="text-[10px] text-slate-400">Vertical</span>
            </button>

            <button
              type="button"
              onClick={() => setOrientation('LANDSCAPE')}
              className={`rounded-2xl border p-3 transition text-center flex flex-col items-center justify-center ${
                orientation === 'LANDSCAPE'
                  ? 'border-sky-400 bg-sky-500/15 shadow-md text-white ring-2 ring-sky-500/30'
                  : 'border-white/10 bg-slate-900/80 text-slate-400 hover:text-white'
              }`}
            >
              <div className="h-3.5 w-5 border-2 border-current rounded-sm mb-1.5" />
              <span className="font-heading text-xs font-bold">Landscape</span>
              <span className="text-[10px] text-slate-400">Horizontal</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Single vs Double Sided (Sides) */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 block">
          4. Printing Sides
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setIsDuplex(false)}
            className={`rounded-2xl border p-3.5 transition text-left ${
              !isDuplex
                ? 'border-sky-400 bg-sky-500/15 ring-2 ring-sky-500/30'
                : 'border-white/10 bg-slate-900/80 hover:border-white/20'
            }`}
          >
            <span className="block font-heading text-xs font-bold text-white">Single-Sided</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Printed on one side of leaf</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDuplex(true)}
            className={`rounded-2xl border p-3.5 transition text-left ${
              isDuplex
                ? 'border-emerald-400 bg-emerald-500/15 ring-2 ring-emerald-500/30'
                : 'border-white/10 bg-slate-900/80 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-heading text-xs font-bold text-emerald-300">Double-Sided</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                10% Off
              </span>
            </div>
            <span className="block text-[11px] text-slate-400 mt-0.5">Eco duplex on both sides</span>
          </button>
        </div>
      </div>

      {/* 5. Copies & Custom Pages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Copies Stepper */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
            5. Number of Copies
          </label>
          <div className="flex items-center rounded-2xl border border-white/10 bg-slate-900/80 p-1.5">
            <button
              type="button"
              onClick={() => setCopies(Math.max(1, copies - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-base font-bold text-white hover:bg-slate-700 transition"
            >
              -
            </button>
            <div className="flex-1 text-center font-heading text-sm font-bold text-white">
              {copies} {copies === 1 ? 'Copy' : 'Copies'}
            </div>
            <button
              type="button"
              onClick={() => setCopies(copies + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-base font-bold text-white hover:bg-sky-400 transition"
            >
              +
            </button>
          </div>
        </div>

        {/* Page Range Selector */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
            6. Pages to Print
          </label>
          <div className="grid grid-cols-2 gap-1.5 mb-1.5">
            <button
              type="button"
              onClick={() => setPageOption('ALL')}
              className={`rounded-xl border py-2 text-xs font-bold transition ${
                pageOption === 'ALL'
                  ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                  : 'border-white/10 bg-slate-800 text-slate-400'
              }`}
            >
              All ({totalPages})
            </button>
            <button
              type="button"
              onClick={() => setPageOption('CUSTOM')}
              className={`rounded-xl border py-2 text-xs font-bold transition ${
                pageOption === 'CUSTOM'
                  ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                  : 'border-white/10 bg-slate-800 text-slate-400'
              }`}
            >
              Custom
            </button>
          </div>
          {pageOption === 'CUSTOM' && (
            <input
              type="text"
              value={customRange}
              onChange={(e) => setCustomRange(e.target.value)}
              placeholder="e.g. 1-4, 7"
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
            />
          )}
        </div>
      </div>

      {/* 6. Binding Finishing */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
          7. Binding & Finishing
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'None', label: 'None', fee: 'Free' },
            { id: 'Corner Staple', label: 'Corner Staple', fee: '+₹5' },
            { id: 'Spiral Binding', label: 'Spiral Ring', fee: '+₹35' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setBinding(item.id)}
              className={`rounded-xl border p-2.5 text-center transition ${
                binding === item.id
                  ? 'border-purple-400 bg-purple-500/20 text-white ring-2 ring-purple-500/30'
                  : 'border-white/10 bg-slate-900/80 text-slate-400 hover:text-white'
              }`}
            >
              <span className="block font-heading text-xs font-bold">{item.label}</span>
              <span className="block text-[10px] text-purple-300">{item.fee}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Clear Print Total Display Card */}
      <div className="rounded-3xl border border-sky-500/40 bg-gradient-to-br from-sky-950/50 via-slate-900 to-slate-900 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <span className="font-heading text-sm font-bold text-white">
            Live Cost Summary
          </span>
          <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
            Auto-Calculated
          </span>
        </div>

        <div className="space-y-1 text-xs text-slate-300">
          <div className="flex justify-between">
            <span>
              {pricing.pagesTotal} total pages @ ₹{pricing.ratePerPage.toFixed(2)}/pg:
            </span>
            <span className="font-bold text-white">₹{pricing.printingSubtotal.toFixed(2)}</span>
          </div>

          {pricing.bindingFee > 0 && (
            <div className="flex justify-between">
              <span>Binding ({binding}):</span>
              <span className="font-bold text-white">₹{pricing.bindingFee.toFixed(2)}</span>
            </div>
          )}

          {pricing.paperSurcharge > 0 && (
            <div className="flex justify-between">
              <span>Paper surcharge ({paperSize}):</span>
              <span className="font-bold text-white">₹{pricing.paperSurcharge.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-400">
            <span>GST Tax (5%):</span>
            <span>₹{pricing.gstAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Clear Print Total */}
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
          <div>
            <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Print Total
            </span>
            <span className="text-[10px] text-emerald-400">Inclusive of all taxes</span>
          </div>
          <div className="font-heading text-3xl font-black text-white tracking-tight">
            ₹{pricing.totalPrice.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
