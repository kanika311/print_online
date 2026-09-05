'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <Link
                href="/"
                className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 transition mb-2"
              >
                &larr; Back to Home
              </Link>
              <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900">
                My Print Orders
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Track active print jobs and view past receipts
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl p-1 text-xs shadow-sm">
              <button
                onClick={() => setFilter('ALL')}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  filter === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({orders.length})
              </button>
              <button
                onClick={() => setFilter('ACTIVE')}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  filter === 'ACTIVE'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active ({orders.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status)).length})
              </button>
              <button
                onClick={() => setFilter('COMPLETED')}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  filter === 'COMPLETED'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed ({orders.filter((o) => o.status === 'COMPLETED').length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              Loading your orders...
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order._id || order.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-slate-300 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs">
                      DOC
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-heading text-xs font-bold text-slate-900">
                          Order #{order.orderNumber}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                            order.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : order.status === 'PRINTING'
                              ? 'bg-blue-50 text-blue-700 border-blue-300'
                              : order.paymentType === 'CASH' && order.paymentStatus === 'PENDING_APPROVAL'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {order.status === 'PRINTING'
                            ? 'Printing Now'
                            : order.paymentType === 'CASH' && order.paymentStatus === 'PENDING_APPROVAL'
                            ? 'Awaiting Cash Approval'
                            : order.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 font-semibold truncate max-w-sm">
                        {order.fileName}
                      </p>

                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {order.shopName} • {order.pageCount} pgs × {order.copies} copy •{' '}
                        {order.isColor ? 'Color' : 'B&W'} • {order.paperSize}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                    <div className="text-left md:text-right">
                      <div className="font-heading text-base font-bold text-slate-900">
                        ₹{order.totalPrice.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {order.paymentType} • {order.paymentStatus}
                      </div>
                    </div>

                    <Link
                      href={`/order/${order._id || order.id}`}
                      className="flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm"
                    >
                      <span>Track Live</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <h3 className="font-heading text-base font-bold text-slate-900">No Orders Found</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-5">
                You haven't placed any print orders yet.
              </p>
              <Link
                href="/"
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm"
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
