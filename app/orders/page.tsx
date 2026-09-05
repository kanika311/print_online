'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle2,
  Printer,
  ArrowRight,
  ChevronLeft,
  Search,
} from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.orders) {
          setOrders(data.orders);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ACTIVE') return !['COMPLETED', 'CANCELLED'].includes(o.status);
    if (filter === 'COMPLETED') return o.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0e17]">
      <Navbar />

      <main className="flex-1 pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition mb-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Link>
              <h1 className="font-heading text-2xl sm:text-3xl font-black text-white">
                My Print Orders
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Track active print jobs and view past invoices
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-2xl p-1 text-xs">
              <button
                onClick={() => setFilter('ALL')}
                className={`rounded-xl px-3 py-1.5 font-bold transition ${
                  filter === 'ALL'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({orders.length})
              </button>
              <button
                onClick={() => setFilter('ACTIVE')}
                className={`rounded-xl px-3 py-1.5 font-bold transition ${
                  filter === 'ACTIVE'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Active ({orders.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status)).length})
              </button>
              <button
                onClick={() => setFilter('COMPLETED')}
                className={`rounded-xl px-3 py-1.5 font-bold transition ${
                  filter === 'COMPLETED'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Completed ({orders.filter((o) => o.status === 'COMPLETED').length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              Loading your orders...
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order._id || order.id}
                  className="glass-card flex flex-col md:flex-row md:items-center justify-between rounded-3xl p-5 md:p-6 gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400">
                      <FileText className="h-6 w-6" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-heading text-sm font-bold text-white">
                          Order #{order.orderNumber}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            order.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : order.status === 'PRINTING'
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse'
                              : order.paymentType === 'CASH' && order.paymentStatus === 'PENDING_APPROVAL'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          }`}
                        >
                          {order.status === 'PRINTING'
                            ? 'Printing Now'
                            : order.paymentType === 'CASH' && order.paymentStatus === 'PENDING_APPROVAL'
                            ? 'Awaiting Cash Approval'
                            : order.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-semibold truncate max-w-sm">
                        {order.fileName}
                      </p>

                      <p className="text-[11px] text-slate-400 mt-1">
                        {order.shopName} • {order.pageCount} pgs × {order.copies} copy •{' '}
                        {order.isColor ? 'Color' : 'B&W'} • {order.paperSize}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                    <div className="text-left md:text-right">
                      <div className="font-heading text-base font-bold text-white">
                        ₹{order.totalPrice.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {order.paymentType} • {order.paymentStatus}
                      </div>
                    </div>

                    <Link
                      href={`/order/${order._id || order.id}`}
                      className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white hover:bg-sky-400 transition"
                    >
                      <span>Track Live</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-12 text-center">
              <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <h3 className="font-heading text-base font-bold text-white">No Orders Found</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 mb-6">
                You haven't placed any print orders yet.
              </p>
              <Link
                href="/"
                className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white hover:bg-sky-400 transition"
              >
                Find Nearby Print Shop
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
