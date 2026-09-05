'use client';

import React, { useEffect, useState } from 'react';
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
      }
    } catch (e) {
      console.warn('Failed to poll order status:', e);
    } finally {
      setRefreshing(false);
    }
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
    <div className="w-full space-y-4 sm:space-y-6">
      {/* 1. Live Hero Queue Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="rounded bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                Order #{order.orderNumber}
              </span>
              <span className="rounded bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                {isDelivery ? 'Porter Delivery' : 'Self Pickup'}
              </span>
              <button
                onClick={fetchOrderStatus}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 ml-2"
              >
                {refreshing ? 'Refreshing...' : 'Refresh Status'}
              </button>
            </div>

            <h2 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {['COMPLETED', 'DELIVERED'].includes(order.status) ? (
                <span className="text-emerald-700">
                  Order Completed & Picked Up
                </span>
              ) : order.status === 'PRINTING' ? (
                <span className="text-blue-600">
                  Printing Now on Machine
                </span>
              ) : isCashPending ? (
                <span className="text-amber-700">
                  Awaiting Counter Cash Approval
                </span>
              ) : (
                <span className="text-slate-900">
                  Queue Position:{' '}
                  <span className="text-blue-600 font-extrabold">#{order.queuePosition}</span>
                </span>
              )}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Shop: <span className="font-semibold text-slate-800">{order.shopName}</span> • Machine:{' '}
              <span className="font-semibold text-blue-700">{order.printerName}</span>
            </p>
          </div>

          {/* Time Countdown Box */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Estimated Waiting</div>
              <div className="font-heading text-2xl font-black text-slate-900">
                {['COMPLETED', 'DELIVERED'].includes(order.status)
                  ? '0 mins'
                  : `~${order.estimatedWaitMinutes || 3} mins`}
              </div>
              <div className="text-[11px] text-emerald-700 font-bold">
                {order.status === 'PRINTING'
                  ? 'Printing in progress'
                  : order.statusLabel || 'Active spooler queue'}
              </div>
            </div>
          </div>
        </div>

        {/* Counter Cash Approval Notice */}
        {isCashPending && (
          <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <h5 className="text-xs font-bold text-amber-900">
              Notice: Show this screen to the counter staff
            </h5>
            <p className="text-[11px] text-amber-800 mt-0.5">
              Pay ₹{order.totalPrice.toFixed(2)} cash. Once the shop owner clicks "Approve Cash Received", your document will immediately enter the print queue.
            </p>
          </div>
        )}

        {/* Delivery Details Card if Porter Delivery */}
        {isDelivery && order.deliveryAddress && (
          <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-heading font-bold text-slate-900 block">
                Porter Courier Assigned
              </span>
              <span className="text-slate-600 text-[11px] block">
                Delivering to: {order.deliveryAddress}
              </span>
            </div>
            <div className="text-right text-[11px]">
              <span className="text-emerald-700 font-bold block">Estimated ~25 mins</span>
              <span className="text-slate-500">Driver contact: +91 98980 12345</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Step Timeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-md">
        <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
          Order Status Lifecycle
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
          {activeSteps.map((step, idx) => (
            <div
              key={step.id}
              className={`relative flex flex-col rounded-xl border p-4 transition-all ${
                step.isComplete
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : step.isCurrent
                  ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600'
                  : 'border-slate-200 bg-slate-50 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Step 0{idx + 1}
                </span>
                {step.isComplete ? (
                  <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5">
                    Done
                  </span>
                ) : step.isCurrent ? (
                  <span className="rounded bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5">
                    Current
                  </span>
                ) : (
                  <span className="rounded bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5">
                    Waiting
                  </span>
                )}
              </div>

              <h4 className="font-heading text-xs font-bold text-slate-900 mb-1">
                {step.label}
              </h4>
              <p className="text-[11px] text-slate-500">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Job Specifications Summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-md">
        <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
          Print Order Specifications
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-slate-500 block text-[11px] font-semibold">Document</span>
            <span className="font-bold text-slate-900 truncate block mt-0.5" title={order.fileName}>
              {order.fileName}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-slate-500 block text-[11px] font-semibold">Print Mode</span>
            <span className="font-bold text-blue-700 block mt-0.5">
              {order.isColor ? 'Color' : 'B&W'} • {order.isDuplex ? 'Duplex' : 'Single'} • {order.orientation || 'Portrait'}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-slate-500 block text-[11px] font-semibold">Pages & Copies</span>
            <span className="font-bold text-slate-900 block mt-0.5">
              {order.pageCount} pgs × {order.copies} copy ({order.paperSize})
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-slate-500 block text-[11px] font-semibold">Total Paid</span>
            <span className="font-bold text-emerald-700 block mt-0.5">
              ₹{order.totalPrice.toFixed(2)} ({order.paymentType})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
