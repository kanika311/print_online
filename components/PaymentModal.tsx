'use client';

import React, { useState } from 'react';

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
        // Call Razorpay backend order endpoint
        const orderRes = await fetch('/api/payments/razorpay/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: totalAmount }),
        });

        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.error || 'Failed to initialize payment');

        const fakePaymentId = `pay_rzp_${Date.now()}`;
        onPaymentComplete('ONLINE', {
          razorpay_order_id: orderData.order.id,
          razorpay_payment_id: fakePaymentId,
        });
      } else {
        onPaymentComplete('CASH');
      }
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
        >
          Close
        </button>

        <div className="text-center mb-5">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs tracking-wider">
            PAY
          </div>
          <h3 className="font-heading text-lg font-bold text-slate-900">
            Confirm & Pay for Print Job
          </h3>
          <p className="text-xs text-slate-500">
            Secure encrypted transaction
          </p>
        </div>

        {/* Order Summary Box */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1.5 mb-5">
          <div className="flex justify-between text-slate-600">
            <span>Cyber Café:</span>
            <span className="font-bold text-slate-900">{printDetails.shopName}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Machine:</span>
            <span className="font-semibold text-blue-700">{printDetails.printerName}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Document:</span>
            <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={printDetails.fileName}>
              {printDetails.fileName}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Specs:</span>
            <span className="text-slate-800">
              {printDetails.pageCount} pgs × {printDetails.copies} • {printDetails.isColor ? 'Color' : 'B&W'} • {printDetails.orientation}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 font-heading text-sm font-black text-slate-900">
            <span>Total Payable:</span>
            <span className="text-base text-blue-600">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Select Payment Method
          </label>

          {/* Online Razorpay / UPI */}
          <div
            onClick={() => setMethod('ONLINE')}
            className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition shadow-sm ${
              method === 'ONLINE'
                ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-xs font-bold text-slate-900">
                  Razorpay / UPI / Online
                </span>
                <span className="rounded bg-blue-100 text-blue-800 px-1.5 py-0.2 text-[9px] font-bold">
                  Instant Queue
                </span>
              </div>
              <p className="text-[11px] text-slate-500">GPay, PhonePe, Cards, NetBanking</p>
            </div>
            {method === 'ONLINE' && (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Selected
              </span>
            )}
          </div>

          {/* Cash at Shop */}
          <div
            onClick={() => setMethod('CASH')}
            className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition shadow-sm ${
              method === 'CASH'
                ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div>
              <span className="font-heading text-xs font-bold text-slate-900 block">
                Cash at Shop Counter
              </span>
              <p className="text-[11px] text-slate-500">Pay cash at cyber café desk for approval</p>
            </div>
            {method === 'CASH' && (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Selected
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-semibold">
            Notice: {error}
          </div>
        )}

        <button
          type="button"
          disabled={processing}
          onClick={handlePay}
          className="w-full flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
        >
          {processing ? (
            <span>Verifying Payment...</span>
          ) : (
            <span>
              {method === 'ONLINE'
                ? `Pay ₹${totalAmount.toFixed(2)} via Razorpay`
                : `Confirm Cash Order (₹${totalAmount.toFixed(2)})`}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
