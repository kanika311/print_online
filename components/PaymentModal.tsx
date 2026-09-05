'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  printDetails: {
    shopName: string;
    printerName: string;
    fileName: string;
    pageCount: number;
    copies: number;
    paperSize: string;
    isColor: boolean;
    isDuplex: boolean;
    orientation: string;
  };
  onPaymentComplete: (paymentType: 'CASH' | 'ONLINE', razorpayDetails?: any) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  totalAmount,
  printDetails,
  onPaymentComplete,
}: PaymentModalProps) {
  const [method, setMethod] = useState<'ONLINE' | 'CASH'>('ONLINE');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePay = async () => {
    setError(null);
    setProcessing(true);

    try {
      if (method === 'ONLINE') {
        // 1. Call Razorpay backend order endpoint
        const orderRes = await fetch('/api/payments/razorpay/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: totalAmount }),
        });

        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.error || 'Failed to initialize payment');

        // Simulate Razorpay Gateway success (can plug in window.Razorpay when live keys present)
        const fakePaymentId = `pay_rzp_${Date.now()}`;
        onPaymentComplete('ONLINE', {
          razorpay_order_id: orderData.order.id,
          razorpay_payment_id: fakePaymentId,
        });
      } else {
        // Cash payment choice
        onPaymentComplete('CASH');
      }
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/5 p-2 text-slate-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center mb-5">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-500/25">
            <CreditCard className="h-6 w-6" />
          </div>
          <h3 className="font-heading text-lg font-bold text-white">
            Confirm & Pay for Print Job
          </h3>
          <p className="text-xs text-slate-400">
            Secure 256-bit encrypted transaction
          </p>
        </div>

        {/* Order Summary Pill */}
        <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-4 text-xs space-y-1.5 mb-5">
          <div className="flex justify-between text-slate-400">
            <span>Cyber Café:</span>
            <span className="font-bold text-white">{printDetails.shopName}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Machine:</span>
            <span className="font-semibold text-sky-400">{printDetails.printerName}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Document:</span>
            <span className="font-semibold text-slate-200 truncate max-w-[200px]" title={printDetails.fileName}>
              {printDetails.fileName}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Specs:</span>
            <span className="text-slate-300">
              {printDetails.pageCount} pgs × {printDetails.copies} • {printDetails.isColor ? 'Color' : 'B&W'} • {printDetails.orientation}
            </span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2 font-heading text-sm font-black text-white">
            <span>Total Payable:</span>
            <span className="text-base text-emerald-400">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Select Payment Method
          </label>

          {/* Online Razorpay / UPI */}
          <div
            onClick={() => setMethod('ONLINE')}
            className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition ${
              method === 'ONLINE'
                ? 'border-sky-400 bg-sky-500/15 ring-2 ring-sky-500/30'
                : 'border-white/10 bg-slate-800/60 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-xs font-bold text-white">
                    Razorpay / UPI / Online
                  </span>
                  <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold text-sky-400">
                    Instant Queue
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">GPay, PhonePe, Cards, NetBanking</p>
              </div>
            </div>
            {method === 'ONLINE' && <CheckCircle2 className="h-5 w-5 text-sky-400" />}
          </div>

          {/* Cash at Shop */}
          <div
            onClick={() => setMethod('CASH')}
            className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition ${
              method === 'CASH'
                ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-500/30'
                : 'border-white/10 bg-slate-800/60 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-xs font-bold text-white">
                    Cash at Shop Counter
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Pay cash at cyber café desk for approval</p>
              </div>
            </div>
            {method === 'CASH' && <CheckCircle2 className="h-5 w-5 text-amber-400" />}
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          disabled={processing}
          onClick={handlePay}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-sky-500/25 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
        >
          {processing ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Verifying Payment...</span>
            </div>
          ) : (
            <>
              <span>
                {method === 'ONLINE'
                  ? `Pay ₹${totalAmount.toFixed(2)} via Razorpay`
                  : `Confirm Cash Order (₹${totalAmount.toFixed(2)})`}
              </span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
