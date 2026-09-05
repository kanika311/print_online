'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  PartyPopper,
  Bike,
  Store,
  MapPin,
  Phone,
} from 'lucide-react';
import { useSocket } from '@/lib/socket';

interface LiveQueueTrackerProps {
  orderId: string;
  initialOrder: any;
}

export default function LiveQueueTracker({
  orderId,
  initialOrder,
}: LiveQueueTrackerProps) {
  const [order, setOrder] = useState<any>(initialOrder);
  const [refreshing, setRefreshing] = useState(false);
  const { socket } = useSocket(`order:${orderId}`);

  // Fetch updated status helper
  const fetchOrderStatus = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        if (
          ['COMPLETED', 'DELIVERED'].includes(data.order.status) &&
          !['COMPLETED', 'DELIVERED'].includes(order?.status)
        ) {
          triggerCelebration();
        }
      }
    } catch (e) {
      console.warn('Failed to poll order status:', e);
    } finally {
      setRefreshing(false);
    }
  };

  // Confetti trigger
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  // Listen to WebSocket events
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdated = (payload: any) => {
      if (payload.orderId === orderId) {
        fetchOrderStatus();
      }
    };

    const handleCashApproved = (payload: any) => {
      if (payload.orderId === orderId) {
        fetchOrderStatus();
      }
    };

    const handleFulfillmentUpdated = (payload: any) => {
      if (payload.orderId === orderId) {
        fetchOrderStatus();
      }
    };

    socket.on('order:status_updated', handleStatusUpdated);
    socket.on('order:cash_approved', handleCashApproved);
    socket.on('order:fulfillment_updated', handleFulfillmentUpdated);

    return () => {
      socket.off('order:status_updated', handleStatusUpdated);
      socket.off('order:cash_approved', handleCashApproved);
      socket.off('order:fulfillment_updated', handleFulfillmentUpdated);
    };
  }, [socket, orderId]);

  // Periodic polling fallback
  useEffect(() => {
    if (['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(order?.status)) return;

    const interval = setInterval(() => {
      fetchOrderStatus();
    }, 3500);

    return () => clearInterval(interval);
  }, [order?.status]);

  if (!order) return null;

  const isCashPending =
    order.paymentType === 'CASH' && order.paymentStatus === 'PENDING_APPROVAL';
  const isDelivery = order.fulfillmentType === 'DELIVERY';

  // Adaptive Stepper Definition
  const pickupSteps = [
    {
      id: 'PAYMENT',
      label: order.paymentType === 'CASH' ? 'Cash Approval' : 'Payment Confirmed',
      desc: isCashPending ? 'Pay cash at counter' : 'Payment verified',
      isComplete: order.paymentStatus === 'PAID',
      isCurrent: isCashPending,
    },
    {
      id: 'QUEUED',
      label: 'Queued on Machine',
      desc: order.status === 'QUEUED' ? `Position #${order.queuePosition} in queue` : 'In print queue',
      isComplete: ['PRINTING', 'READY', 'COMPLETED'].includes(order.status),
      isCurrent: order.status === 'QUEUED',
    },
    {
      id: 'PRINTING',
      label: 'Printing Document',
      desc: order.status === 'PRINTING' ? 'Laser output in progress' : 'Laser printing',
      isComplete: ['READY', 'COMPLETED'].includes(order.status),
      isCurrent: order.status === 'PRINTING',
    },
    {
      id: 'READY',
      label: 'Ready for Collection',
      desc: 'Pick up at counter',
      isComplete: order.status === 'COMPLETED',
      isCurrent: order.status === 'READY',
    },
  ];

  const deliverySteps = [
    {
      id: 'PRINTING',
      label: 'Printing Document',
      desc: order.status === 'PRINTING' ? 'High precision laser output' : 'Print spooler processing',
      isComplete: ['READY', 'PORTER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status),
      isCurrent: ['QUEUED', 'PRINTING'].includes(order.status),
    },
    {
      id: 'READY',
      label: 'Printed & Packed',
      desc: 'Wrapped for courier pickup',
      isComplete: ['PORTER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status),
      isCurrent: order.status === 'READY',
    },
    {
      id: 'PORTER',
      label: 'Porter Assigned',
      desc: 'Courier heading to cyber café',
      isComplete: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status),
      isCurrent: order.status === 'PORTER_ASSIGNED',
    },
    {
      id: 'TRANSIT',
      label: 'Out for Delivery',
      desc: 'On bike to your address',
      isComplete: order.status === 'DELIVERED',
      isCurrent: order.status === 'OUT_FOR_DELIVERY',
    },
  ];

  const activeSteps = isDelivery ? deliverySteps : pickupSteps;

  return (
    <div className="w-full space-y-6">
      {/* 1. Live Hero Queue Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-sky-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="rounded-full bg-sky-500/20 border border-sky-500/30 px-3 py-0.5 text-xs font-bold text-sky-400">
                Order #{order.orderNumber}
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                {isDelivery ? '🛵 Porter Delivery' : '🏬 Self Pickup'}
              </span>
              <button
                onClick={fetchOrderStatus}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition ml-2"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Live</span>
              </button>
            </div>

            <h2 className="font-heading text-2xl sm:text-3xl font-black text-white tracking-tight">
              {['COMPLETED', 'DELIVERED'].includes(order.status) ? (
                <span className="text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-8 w-8" /> Order Completed!
                </span>
              ) : order.status === 'PRINTING' ? (
                <span className="text-cyan-400 flex items-center gap-2">
                  <Printer className="h-8 w-8 animate-bounce" /> Printing Now on Machine
                </span>
              ) : isCashPending ? (
                <span className="text-amber-400 flex items-center gap-2">
                  <AlertCircle className="h-8 w-8" /> Awaiting Cash Approval
                </span>
              ) : (
                <span className="text-white">
                  Queue Position:{' '}
                  <span className="text-sky-400">#{order.queuePosition}</span>
                </span>
              )}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              {order.shopName} • Machine:{' '}
              <span className="font-semibold text-sky-300">{order.printerName}</span>
            </p>
          </div>

          {/* Time Countdown Box */}
          <div className="flex items-center gap-4 bg-slate-800/80 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Estimated Waiting</div>
              <div className="font-heading text-2xl font-black text-white">
                {['COMPLETED', 'DELIVERED'].includes(order.status)
                  ? '0 mins'
                  : `~${order.estimatedWaitMinutes || 3} mins`}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold">
                {order.status === 'PRINTING'
                  ? 'Printing in progress'
                  : order.statusLabel || 'Active spooler queue'}
              </div>
            </div>
          </div>
        </div>

        {/* Counter Cash Approval Notice */}
        {isCashPending && (
          <div className="mt-6 rounded-2xl bg-amber-500/15 border border-amber-500/30 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-amber-300">
                Action Required: Show this screen to the counter staff
              </h5>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                Pay ₹{order.totalPrice.toFixed(2)} cash. Once the printer owner clicks "Approve Cash Received", your document will immediately enter the print queue!
              </p>
            </div>
          </div>
        )}

        {/* Delivery Details Card if Porter Delivery */}
        {isDelivery && order.deliveryAddress && (
          <div className="mt-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <Bike className="h-5 w-5" />
              </div>
              <div>
                <span className="font-heading font-bold text-white block">
                  Porter Bike Courier Assigned
                </span>
                <span className="text-slate-300 text-[11px] block">
                  Delivering to: {order.deliveryAddress}
                </span>
              </div>
            </div>
            <div className="text-right text-[11px]">
              <span className="text-emerald-400 font-bold block">Estimated ~25 mins</span>
              <span className="text-slate-400">Driver contact: +91 98980 12345</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Step Timeline */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
        <h3 className="font-heading text-base font-bold text-white mb-6">
          Order Lifecycle Timeline
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          {activeSteps.map((step, idx) => (
            <div
              key={step.id}
              className={`relative flex flex-col rounded-2xl border p-4 transition-all ${
                step.isComplete
                  ? 'border-emerald-500/40 bg-emerald-950/20'
                  : step.isCurrent
                  ? 'border-sky-400 bg-sky-500/15 ring-2 ring-sky-500/30 shadow-lg shadow-sky-500/20'
                  : 'border-white/5 bg-slate-800/40 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Step 0{idx + 1}
                </span>
                {step.isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : step.isCurrent ? (
                  <span className="h-3 w-3 rounded-full bg-sky-400 animate-ping" />
                ) : (
                  <span className="h-3 w-3 rounded-full bg-slate-700" />
                )}
              </div>

              <h4 className="font-heading text-xs font-bold text-white mb-1">
                {step.label}
              </h4>
              <p className="text-[11px] text-slate-400">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Job Specifications Summary */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
        <h3 className="font-heading text-base font-bold text-white mb-4">
          Print Order Specifications
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="rounded-xl border border-white/5 bg-slate-800/50 p-3">
            <span className="text-slate-400 block text-[11px]">Document</span>
            <span className="font-bold text-white truncate block mt-0.5" title={order.fileName}>
              {order.fileName}
            </span>
          </div>

          <div className="rounded-xl border border-white/5 bg-slate-800/50 p-3">
            <span className="text-slate-400 block text-[11px]">Print Mode</span>
            <span className="font-bold text-sky-400 block mt-0.5">
              {order.isColor ? 'Color' : 'B&W'} • {order.isDuplex ? 'Duplex' : 'Single'} • {order.orientation || 'Portrait'}
            </span>
          </div>

          <div className="rounded-xl border border-white/5 bg-slate-800/50 p-3">
            <span className="text-slate-400 block text-[11px]">Pages & Copies</span>
            <span className="font-bold text-white block mt-0.5">
              {order.pageCount} pgs × {order.copies} copy ({order.paperSize})
            </span>
          </div>

          <div className="rounded-xl border border-white/5 bg-slate-800/50 p-3">
            <span className="text-slate-400 block text-[11px]">Total Paid</span>
            <span className="font-bold text-emerald-400 block mt-0.5">
              ₹{order.totalPrice.toFixed(2)} ({order.paymentType})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
