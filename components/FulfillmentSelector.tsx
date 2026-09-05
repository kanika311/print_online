'use client';

import React, { useState } from 'react';

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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md space-y-6">
      <div className="text-center max-w-md mx-auto">
        <h3 className="font-heading text-lg font-extrabold text-slate-900">
          Choose How to Receive Your Prints
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Collect in person at the shop counter or get Porter courier bike delivery
        </p>
      </div>

      {/* Two Clear Choices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Choice 1: Self Pickup */}
        <div
          onClick={() => setSelectedType('PICKUP')}
          className={`relative rounded-xl border p-5 cursor-pointer transition-all shadow-sm ${
            selectedType === 'PICKUP'
              ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <span className="rounded bg-blue-100 text-blue-800 font-bold px-2 py-0.5 text-xs">
              SELF PICKUP
            </span>
            {selectedType === 'PICKUP' && (
              <span className="text-[10px] font-bold text-blue-700 uppercase">Selected</span>
            )}
          </div>

          <h4 className="font-heading text-sm font-bold text-slate-900 mb-1">
            Self Pickup at Cyber Café
          </h4>
          <p className="text-xs text-slate-500 mb-3">
            Visit the shop counter to collect your documents when ready.
          </p>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] space-y-1">
            <div className="text-slate-800 font-bold">{shopName}</div>
            <div className="text-slate-500 truncate">{shopAddress}</div>
            <div className="text-emerald-700 font-bold mt-1">
              Pickup Fee: FREE (₹0.00)
            </div>
          </div>
        </div>

        {/* Choice 2: Porter Delivery */}
        <div
          onClick={() => setSelectedType('DELIVERY')}
          className={`relative rounded-xl border p-5 cursor-pointer transition-all shadow-sm ${
            selectedType === 'DELIVERY'
              ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <span className="rounded bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-xs">
              PORTER BIKE
            </span>
            {selectedType === 'DELIVERY' && (
              <span className="text-[10px] font-bold text-blue-700 uppercase">Selected</span>
            )}
          </div>

          <h4 className="font-heading text-sm font-bold text-slate-900 mb-1">
            Porter Courier Delivery
          </h4>
          <p className="text-xs text-slate-500 mb-3">
            Direct doorstep dispatch via third-party Porter bike courier.
          </p>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] space-y-1">
            <div className="text-slate-800 font-bold">Speed: ~25 mins from ready</div>
            <div className="text-emerald-700 font-bold">
              Delivery Charge: ₹{deliveryFee.toFixed(2)}
            </div>
            <div className="text-slate-500">Live courier tracking link provided</div>
          </div>
        </div>
      </div>

      {/* Address Form if Delivery selected */}
      {selectedType === 'DELIVERY' && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
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
              className={`w-full rounded-xl border bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none ${
                addressError ? 'border-rose-500' : 'border-slate-300 focus:border-blue-600'
              }`}
            />
            {addressError && (
              <span className="text-[10px] text-rose-600 mt-1 block font-semibold">
                Please provide your full delivery address
              </span>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 mb-1 block">
              Recipient Phone Number (For Porter Driver)
            </label>
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600"
            />
          </div>

          <div className="rounded-lg bg-white p-3 text-xs space-y-1 text-slate-600 border border-slate-200">
            <div className="flex justify-between">
              <span>Printing Charge:</span>
              <span className="font-bold text-slate-900">₹{printingSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Porter Bike Delivery:</span>
              <span className="font-bold">+₹{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 font-heading text-sm font-black text-slate-900">
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
        className="w-full flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 py-3.5 text-xs font-bold text-white shadow-sm transition active:scale-95"
      >
        <span>
          {selectedType === 'PICKUP'
            ? 'Confirm Self Pickup'
            : `Confirm & Order Porter Delivery (₹${totalWithDelivery.toFixed(2)})`}
        </span>
      </button>
    </div>
  );
}
