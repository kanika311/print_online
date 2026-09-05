'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import LiveQueueTracker from '@/components/LiveQueueTracker';

export default function OrderLiveTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    fetch(`/api/orders/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Order not found');
        return res.json();
      })
      .then((data) => {
        setOrder(data.order);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch order details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500">
        <p className="text-sm font-semibold">Connecting to live print queue...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-4">
        <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mb-6">
          The requested print order could not be found or has expired.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb / Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 transition"
            >
              &larr; Back to Home
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/orders"
                className="flex items-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition shadow-sm"
              >
                All Orders
              </Link>
            </div>
          </div>

          {/* Live Queue Tracker Component with real-time Socket.IO synchronization */}
          <LiveQueueTracker orderId={orderId} initialOrder={order} />
        </div>
      </main>
    </div>
  );
}
