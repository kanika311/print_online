'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Printer,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Share2,
  Download,
  Home,
} from 'lucide-react';
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
      <div className="min-h-screen bg-[#0a0e17] flex flex-col items-center justify-center text-slate-400">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-500 border-t-transparent mb-4" />
        <p className="text-sm">Connecting to live print queue...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="h-12 w-12 text-rose-400 mb-3" />
        <h2 className="font-heading text-xl font-bold text-white mb-2">Order Not Found</h2>
        <p className="text-xs text-slate-400 max-w-sm mb-6">
          The requested print order could not be found or has expired.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0e17]">
      <Navbar />

      <main className="flex-1 pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb / Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/orders"
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                <FileText className="h-3.5 w-3.5 text-sky-400" />
                <span>All Orders</span>
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
