import React, { useState } from 'react';
import { X, Store, Bike, CreditCard, Banknote, ShieldCheck, MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { PrintSpecs, PriceBreakdown, Shop } from '../../types';
import confetti from 'canvas-confetti';

interface FulfillmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  specs: PrintSpecs;
  priceBreakdown: PriceBreakdown;
  fileName: string;
  fileSizeMb: number;
  pageCount: number;
  onOrderPlaced: (order: any) => void;
}

export const FulfillmentModal: React.FC<FulfillmentModalProps> = ({
  isOpen,
  onClose,
  specs,
  priceBreakdown,
  fileName,
  fileSizeMb,
  pageCount,
  onOrderPlaced,
}) => {
  const [deliveryType, setDeliveryType] = useState<'SELF_PICKUP' | 'HOME_DELIVERY'>('HOME_DELIVERY');
  const [paymentMode, setPaymentMode] = useState<'ONLINE' | 'COD'>('COD');
  const [deliveryAddress, setDeliveryAddress] = useState('Flat 402, Sunshine Heights, Koramangala, Bengaluru');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  if (!isOpen) return null;

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);

    if (paymentMode === 'ONLINE') {
      setIsProcessingPayment(true);
      // Simulate Razorpay / Stripe modal delay
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setIsProcessingPayment(false);
    }

    try {
      const res = await fetch('http://localhost:5000/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'usr_customer_101',
        },
        body: JSON.stringify({
          fileName,
          fileUrl: '/uploads/sample_report.pdf',
          fileSizeMb,
          pageCount,
          specs,
          deliveryType,
          deliveryAddress,
          deliveryLat: 12.9352,
          deliveryLng: 77.6245,
          paymentMode,
          customNotes: specs.customInstructions,
        }),
      }).then((r) => r.json());

      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        onOrderPlaced(res.order);
        onClose();
      } else {
        alert(res.message || 'Failed to place order.');
      }
    } catch (err: any) {
      alert('Error placing order: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deliveryFee = deliveryType === 'HOME_DELIVERY' ? 35 : 0;
  const finalPrice = priceBreakdown.totalPrice + (deliveryType === 'HOME_DELIVERY' ? 0 : -priceBreakdown.deliveryFee);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-heading">Fulfillment & Payment</h3>
            <p className="text-xs text-slate-400">Review options and dispatch order to nearest shop</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* 1. Fulfillment Type */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300">How would you like to receive your prints?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeliveryType('HOME_DELIVERY')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  deliveryType === 'HOME_DELIVERY'
                    ? 'bg-brand-600/20 border-brand-500 text-white shadow-md shadow-brand-500/10'
                    : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Bike className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold">Home Delivery</span>
                </div>
                <div className="text-[10px] text-slate-400">Delivered to your doorstep by Porter courier</div>
                <div className="mt-2 text-cyan-300 font-semibold">+₹35 Delivery Fee</div>
              </button>

              <button
                onClick={() => setDeliveryType('SELF_PICKUP')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  deliveryType === 'SELF_PICKUP'
                    ? 'bg-brand-600/20 border-brand-500 text-white shadow-md shadow-brand-500/10'
                    : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Store className="w-4 h-4 text-purple-400" />
                  <span className="font-bold">Self Pickup</span>
                </div>
                <div className="text-[10px] text-slate-400">Collect directly from cyber cafe counter</div>
                <div className="mt-2 text-emerald-400 font-semibold">FREE (No Delivery Fee)</div>
              </button>
            </div>
          </div>

          {/* Delivery Address if Home Delivery */}
          {deliveryType === 'HOME_DELIVERY' && (
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-400" />
                <span>Delivery Address (Within 5km)</span>
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>
          )}

          {/* 2. Payment Method */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300">Payment Option</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMode('COD')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  paymentMode === 'COD'
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10'
                    : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Banknote className="w-4 h-4 text-amber-400" />
                  <span className="font-bold">Cash on Delivery</span>
                </div>
                <div className="text-[10px] text-slate-400">Pay cash upon counter pickup or door arrival</div>
              </button>

              <button
                onClick={() => setPaymentMode('ONLINE')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  paymentMode === 'ONLINE'
                    ? 'bg-brand-600/20 border-brand-500 text-white shadow-md shadow-brand-500/10'
                    : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-brand-400" />
                  <span className="font-bold">Online Escrow</span>
                </div>
                <div className="text-[10px] text-slate-400">Razorpay/Stripe (Released upon completion)</div>
              </button>
            </div>
          </div>

          {/* Order Summary Snapshot */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-slate-400">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>{fileName}</span>
              <span>
                {pageCount}p × {specs.copies} copies
              </span>
            </div>
            <div className="flex justify-between">
              <span>Print + Binding:</span>
              <span>₹{priceBreakdown.printCost + priceBreakdown.bindingCost}</span>
            </div>
            <div className="flex justify-between">
              <span>Fulfillment:</span>
              <span>{deliveryType === 'HOME_DELIVERY' ? 'Door Delivery (₹35)' : 'Self Pickup (Free)'}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800 text-sm font-bold text-white">
              <span>Payable Total:</span>
              <span className="text-emerald-400 font-heading text-base">₹{finalPrice}</span>
            </div>
          </div>

          {/* Guarantee banner */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-900/60 text-cyan-300 text-[11px]">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-cyan-400" />
            <span>45s Auto-Reassignment guarantee if shop is unavailable.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Amount Due</div>
            <div className="text-xl font-bold text-white font-heading">₹{finalPrice}</div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-brand-500/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isProcessingPayment ? (
              <span>Simulating Escrow...</span>
            ) : isSubmitting ? (
              <span>Routing to Shop...</span>
            ) : (
              <>
                <span>Confirm & Place Print Order</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
