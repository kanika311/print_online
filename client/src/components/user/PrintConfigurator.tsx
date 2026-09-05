import React from 'react';
import { PrintSpecs, PriceBreakdown } from '../../types';
import { Sliders, Copy, BookOpen, FileCheck, DollarSign, Sparkles } from 'lucide-react';

interface PrintConfiguratorProps {
  specs: PrintSpecs;
  setSpecs: React.Dispatch<React.SetStateAction<PrintSpecs>>;
  priceBreakdown: PriceBreakdown | null;
  isCalculating: boolean;
  onProceedToFulfillment: () => void;
  pageCount: number;
}

export const PrintConfigurator: React.FC<PrintConfiguratorProps> = ({
  specs,
  setSpecs,
  priceBreakdown,
  isCalculating,
  onProceedToFulfillment,
  pageCount,
}) => {
  const paperSizes: ('A4' | 'A3' | 'Legal' | 'Letter')[] = ['A4', 'A3', 'Legal', 'Letter'];
  const paperTypes: ('Normal 75gsm' | 'Bond paper 85gsm' | 'Glossy 180gsm' | 'Cardstock 250gsm')[] = [
    'Normal 75gsm',
    'Bond paper 85gsm',
    'Glossy 180gsm',
    'Cardstock 250gsm',
  ];
  const bindingOptions: ('None' | 'Corner Staple' | 'Spiral Ring Binding')[] = [
    'None',
    'Corner Staple',
    'Spiral Ring Binding',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Columns: Configuration Controls */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            2. Print Job Specifications
          </h2>
        </div>

        {/* 1. Paper Size & Print Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Paper Size */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Paper Size</label>
            <div className="grid grid-cols-2 gap-2">
              {paperSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSpecs((prev) => ({ ...prev, paperSize: size }))}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition-all ${
                    specs.paperSize === size
                      ? 'bg-brand-600/20 border-brand-500 text-brand-300 shadow-md shadow-brand-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Print Type (BW vs Color) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Color Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSpecs((prev) => ({ ...prev, printType: 'BW' }))}
                className={`p-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                  specs.printType === 'BW'
                    ? 'bg-slate-800 border-slate-400 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-slate-300 border border-slate-600" />
                <span>Black & White</span>
              </button>

              <button
                onClick={() => setSpecs((prev) => ({ ...prev, printType: 'COLOR' }))}
                className={`p-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                  specs.printType === 'COLOR'
                    ? 'bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-rose-500 via-yellow-400 to-cyan-400" />
                <span>Vibrant Color</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Paper Quality / Type */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300">Paper GSM & Finish</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {paperTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSpecs((prev) => ({ ...prev, paperType: type }))}
                className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                  specs.paperType === type
                    ? 'bg-brand-600/20 border-brand-500 text-brand-300 shadow-md shadow-brand-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div>{type.split(' ')[0]}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{type.split(' ')[1] || 'Paper'}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Copies & Duplex */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Copies Counter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Number of Sets / Copies</label>
            <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 p-1.5 rounded-xl">
              <button
                onClick={() => setSpecs((prev) => ({ ...prev, copies: Math.max(1, prev.copies - 1) }))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition-colors"
              >
                -
              </button>
              <div className="flex-1 text-center font-bold text-white text-sm">
                {specs.copies} {specs.copies === 1 ? 'Copy' : 'Copies'}
              </div>
              <button
                onClick={() => setSpecs((prev) => ({ ...prev, copies: prev.copies + 1 }))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Duplex (Single-sided vs Double-sided) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Print Sides</label>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-medium">
                Save 10% on Duplex
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSpecs((prev) => ({ ...prev, duplex: false }))}
                className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                  !specs.duplex
                    ? 'bg-brand-600/20 border-brand-500 text-brand-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                Single-Sided
              </button>
              <button
                onClick={() => setSpecs((prev) => ({ ...prev, duplex: true }))}
                className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                  specs.duplex
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                Double-Sided (Duplex)
              </button>
            </div>
          </div>
        </div>

        {/* 4. Binding Options */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300">Binding & Packaging</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {bindingOptions.map((b) => (
              <button
                key={b}
                onClick={() => setSpecs((prev) => ({ ...prev, binding: b }))}
                className={`p-3 rounded-xl text-xs font-medium border text-left transition-all ${
                  specs.binding === b
                    ? 'bg-brand-600/20 border-brand-500 text-brand-300 shadow-md shadow-brand-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="font-semibold">{b}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {b === 'None' ? 'Free (Loose sheets)' : b === 'Corner Staple' ? '+₹5 per copy' : '+₹35 per copy (Coil)'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 5. Custom Instructions */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300">Custom Shop Instructions (Optional)</label>
          <textarea
            value={specs.customInstructions || ''}
            onChange={(e) => setSpecs((prev) => ({ ...prev, customInstructions: e.target.value }))}
            placeholder="e.g., Please staple pages 1 to 5 separately, or front page on glossy cardstock..."
            className="w-full h-20 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
          />
        </div>
      </div>

      {/* Right Column: Sticky Live Price Calculator Card */}
      <div className="lg:col-span-1">
        <div className="sticky top-20 glass-panel p-5 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Live Cost Estimate</h3>
            </div>
            {isCalculating && <span className="text-[10px] text-cyan-400 animate-pulse">Recalculating...</span>}
          </div>

          {priceBreakdown ? (
            <div className="space-y-3 text-xs">
              {/* Itemized Calculation */}
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Sheets to Print</span>
                  <span className="font-medium text-white">
                    {pageCount}p × {specs.copies} = {priceBreakdown.totalPagesToPrint} pages
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rate ({specs.printType} • {specs.paperSize})</span>
                  <span className="font-medium text-white">₹{priceBreakdown.effectiveRatePerPage}/p</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Printing Cost</span>
                  <span className="font-semibold text-white">₹{priceBreakdown.printCost.toFixed(2)}</span>
                </div>
                {priceBreakdown.bindingCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Binding ({specs.binding})</span>
                    <span className="font-semibold text-white">₹{priceBreakdown.bindingCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Platform Maintenance Fee</span>
                  <span className="font-medium text-white">₹{priceBreakdown.platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GST (5%)</span>
                  <span className="font-medium text-white">₹{priceBreakdown.taxGst.toFixed(2)}</span>
                </div>
              </div>

              {/* Total Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-brand-500/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Price</div>
                  <div className="text-2xl font-black text-white font-heading">
                    ₹{priceBreakdown.totalPrice}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-medium">
                    Best Rate Guaranteed
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={onProceedToFulfillment}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-brand-500/25 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Select Pickup or Delivery</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <p className="text-[10px] text-center text-slate-500">
                Supports COD and Instant UPI/Cards. Orders routed to verified local print hubs.
              </p>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 text-xs">
              Upload a document to view live price breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
