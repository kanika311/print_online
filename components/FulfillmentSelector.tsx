'use client';

import React, { useState } from 'react';
import {
  Store,
  Bike,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface FulfillmentSelectorProps {
  shopName: string;
  shopAddress: string;
  orderNumber?: string;
  printingSubtotal: number;
  onFulfillmentConfirmed: (data: {
    type: 'PICKUP' | 'DELIVERY';
    deliveryAddress?: string;
    recipientPhone?: string;
    deliveryFee: number;
  }) => void;
}

export default function FulfillmentSelector({
  shopName,
  shopAddress,
  orderNumber,
  printingSubtotal,
  onFulfillmentConfirmed,
}: FulfillmentSelectorProps) {
  const [selectedType, setSelectedType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [addressError, setAddressError] = useState(false);

  const deliveryFee = 40.0;
  const totalWithDelivery = +(printingSubtotal + deliveryFee).toFixed(2);

  const handleConfirm = () => {
    if (selectedType === 'DELIVERY' && !deliveryAddress.trim()) {
      setAddressError(true);
      return;
    }

    onFulfillmentConfirmed({
      type: selectedType,
      deliveryAddress: selectedType === 'DELIVERY' ? deliveryAddress : undefined,
      recipientPhone: selectedType === 'DELIVERY' ? recipientPhone : undefined,
      deliveryFee: selectedType === 'DELIVERY' ? deliveryFee : 0,
    });
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 backdrop-blur-xl shadow-2xl space-y-6">
      <div className="text-center max-w-md mx-auto">
        <h3 className="font-heading text-xl font-extrabold text-white">
          Choose How to Receive Your Prints
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Collect in person at the shop counter or get Porter courier bike delivery
        </p>
      </div>

      {/* Two Clear Choices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Choice 1: Self Pickup */}
        <div
          onClick={() => setSelectedType('PICKUP')}
          className={`relative rounded-3xl border p-5 cursor-pointer transition-all ${
            selectedType === 'PICKUP'
              ? 'border-sky-400 bg-sky-500/15 ring-2 ring-sky-500/30 shadow-lg shadow-sky-500/10'
              : 'border-white/10 bg-slate-800/60 hover:border-white/20'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400">
              <Store className="h-6 w-6" />
            </div>
            {selectedType === 'PICKUP' && (
              <CheckCircle2 className="h-5 w-5 text-sky-400" />
            )}
          </div>

          <h4 className="font-heading text-sm font-bold text-white mb-1">
            Self Pickup at Cyber Café
          </h4>
          <p className="text-xs text-slate-400 mb-3">
            Visit the shop counter to collect your documents when ready.
          </p>

          <div className="rounded-2xl border border-white/5 bg-slate-900/80 p-3 text-[11px] space-y-1">
            <div className="text-slate-300 font-semibold">{shopName}</div>
            <div className="text-slate-400 truncate">{shopAddress}</div>
            <div className="text-emerald-400 font-bold mt-1">
              Pickup Fee: FREE (₹0.00)
            </div>
          </div>
        </div>

        {/* Choice 2: Porter Delivery */}
        <div
          onClick={() => setSelectedType('DELIVERY')}
          className={`relative rounded-3xl border p-5 cursor-pointer transition-all ${
            selectedType === 'DELIVERY'
              ? 'border-emerald-400 bg-emerald-500/15 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
              : 'border-white/10 bg-slate-800/60 hover:border-white/20'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Bike className="h-6 w-6" />
            </div>
            {selectedType === 'DELIVERY' && (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            )}
          </div>

          <h4 className="font-heading text-sm font-bold text-white mb-1">
            Porter Courier Delivery
          </h4>
          <p className="text-xs text-slate-400 mb-3">
            Direct doorstep dispatch via third-party Porter bike courier.
          </p>

          <div className="rounded-2xl border border-white/5 bg-slate-900/80 p-3 text-[11px] space-y-1">
            <div className="text-slate-300 font-semibold">Speed: ~25 mins from ready</div>
            <div className="text-emerald-400 font-bold">
              Delivery Charge: ₹{deliveryFee.toFixed(2)}
            </div>
            <div className="text-slate-400">Live courier tracking link provided</div>
          </div>
        </div>
      </div>

      {/* Address Form if Delivery selected */}
      {selectedType === 'DELIVERY' && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-3 animate-in fade-in">
          <div>
            <label className="text-xs font-bold text-emerald-300 mb-1 block">
              Doorstep Delivery Address *
            </label>
            <input
              type="text"
              required
              value={deliveryAddress}
              onChange={(e) => {
                setDeliveryAddress(e.target.value);
                setAddressError(false);
              }}
              placeholder="e.g. Flat 302, Green Valley Apts, Sector 18, Noida"
              className={`w-full rounded-xl border bg-slate-800 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none ${
                addressError ? 'border-rose-500' : 'border-white/10 focus:border-emerald-500'
              }`}
            />
            {addressError && (
              <span className="text-[10px] text-rose-400 mt-1 block">
                Please provide your full delivery address
              </span>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-emerald-300 mb-1 block">
              Recipient Phone Number (For Porter Driver)
            </label>
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="rounded-xl bg-slate-900/80 p-3 text-xs space-y-1 text-slate-300 border border-white/5">
            <div className="flex justify-between">
              <span>Printing Charge:</span>
              <span className="font-bold text-white">₹{printingSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Porter Bike Delivery:</span>
              <span className="font-bold">+₹{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-1 font-heading text-sm font-black text-white">
              <span>Total Payable:</span>
              <span>₹{totalWithDelivery.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Button */}
      <button
        type="button"
        onClick={handleConfirm}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-sky-500/25 hover:brightness-110 active:scale-95 transition"
      >
        <span>
          {selectedType === 'PICKUP'
            ? 'Confirm Self Pickup'
            : `Confirm & Order Porter Delivery (₹${totalWithDelivery.toFixed(2)})`}
        </span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
