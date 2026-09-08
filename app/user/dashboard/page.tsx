'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BottomNavigation from '@/components/BottomNavigation';
import QRScannerModal from '@/components/QRScannerModal';
import Document3D from '@/components/3d/Document3D';

export default function UserDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [userLocation, setUserLocation] = useState('Sector 18, Noida');

  // Load User, Shops, and Orders
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 1. Fetch user session
        const authRes = await fetch('/api/auth/me');
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData?.authenticated) {
            setCurrentUser(authData.user);
          }
        }

        // 2. Fetch nearby shops
        const shopsRes = await fetch('/api/shops');
        if (shopsRes.ok) {
          const shopsData = await shopsRes.json();
          setShops(shopsData.shops || []);
        }

        // 3. Fetch user orders
        const ordersRes = await fetch('/api/orders');
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData.orders || []);
        }
      } catch (err) {
        console.error('Error loading user dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const activeOrders = orders.filter(
    (o) => !['COMPLETED', 'CANCELLED'].includes(o.status)
  );
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
  const totalPagesPrinted = completedOrders.reduce(
    (sum, o) => sum + (o.pageCount || 1) * (o.copies || 1),
    0
  );

  // Status step mapper for visual pipeline
  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'APPROVED':
        return 1; // Uploaded
      case 'QUEUED':
        return 2; // Processing
      case 'PRINTING':
        return 3; // Printing
      case 'READY':
        return 4; // Ready
      case 'COMPLETED':
        return 5; // Collected
      default:
        return 1;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-blue-600 selection:text-white pb-20 md:pb-12">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link href="/" className="inline-flex items-center gap-2 group">
                <img
                  src="/logo.png"
                  alt="Prinly.in"
                  className="h-9 w-auto object-contain transition group-hover:scale-105"
                />
                <div className="hidden sm:flex flex-col">
                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest leading-none">
                    Customer Hub
                  </span>
                </div>
              </Link>
            </div>

            {/* Location Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{userLocation}</span>
            </div>

            {/* User Profile & Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsQRScannerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-extrabold shadow-sm transition active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span className="hidden sm:inline">Scan Counter QR</span>
                <span className="sm:hidden">QR</span>
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-black text-xs flex items-center justify-center shadow-sm">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-black text-slate-800 leading-none">
                    {currentUser?.name || 'Customer'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {currentUser?.phone || '+91 98333 44556'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* HERO CARD: "READY TO PRINT?" */}
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 text-white p-6 sm:p-10 shadow-xl overflow-hidden">
          {/* Background Ambient Circles */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-cyan-400/20 blur-xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl text-center md:text-left">
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider mb-3">
                Fast Cloud Spooler • 0 Waiting
              </span>
              <h1 className="font-heading text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                Ready to print your documents?
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-blue-100 leading-relaxed">
                Upload your files remotely, customize color and duplex options, pay via shop UPI, and collect warm prints in minutes.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <a
                  href="#nearby-hubs-section"
                  className="px-6 py-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-black text-xs sm:text-sm shadow-lg shadow-black/10 transition active:scale-95"
                >
                  Upload & Print &rarr;
                </a>
                <button
                  onClick={() => setIsQRScannerOpen(true)}
                  className="px-5 py-3 rounded-xl bg-blue-900/60 hover:bg-blue-900 text-white border border-white/20 font-bold text-xs sm:text-sm transition shadow-sm"
                >
                  Scan Shop Counter QR
                </button>
              </div>
            </div>

            {/* 3D Visual in Hero */}
            <div className="shrink-0 hidden lg:block">
              <Document3D size="md" title="Final_Project_Submission.pdf" pages={14} />
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <a
            href="#nearby-hubs-section"
            className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm hover:border-blue-500 hover:shadow-md transition text-center flex flex-col items-center justify-center hover-lift-3d"
          >
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg mb-2">
              📄
            </div>
            <span className="text-xs font-black text-slate-900 font-heading">Upload Document</span>
            <span className="text-[10px] text-slate-500">PDF, DOCX, Photos</span>
          </a>

          <a
            href="#nearby-hubs-section"
            className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm hover:border-blue-500 hover:shadow-md transition text-center flex flex-col items-center justify-center hover-lift-3d"
          >
            <div className="h-10 w-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-lg mb-2">
              📍
            </div>
            <span className="text-xs font-black text-slate-900 font-heading">Find Nearby Hub</span>
            <span className="text-[10px] text-slate-500">View live queues</span>
          </a>

          <button
            onClick={() => setIsQRScannerOpen(true)}
            className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm hover:border-blue-500 hover:shadow-md transition text-center flex flex-col items-center justify-center hover-lift-3d"
          >
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-cyan-400 flex items-center justify-center font-bold text-lg mb-2">
              📷
            </div>
            <span className="text-xs font-black text-slate-900 font-heading">Scan Counter QR</span>
            <span className="text-[10px] text-slate-500">Instant walk-in</span>
          </button>

          <Link
            href="/orders"
            className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm hover:border-blue-500 hover:shadow-md transition text-center flex flex-col items-center justify-center hover-lift-3d"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-2">
              🧾
            </div>
            <span className="text-xs font-black text-slate-900 font-heading">Recent Receipts</span>
            <span className="text-[10px] text-slate-500">Download invoices</span>
          </Link>
        </div>

        {/* STATISTICS SECTION */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Active Orders
            </div>
            <div className="text-2xl font-black text-blue-600 mt-1 font-heading">
              {activeOrders.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">In spool or printing</div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Completed Orders
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1 font-heading">
              {completedOrders.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Successfully collected</div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Nearby Hubs
            </div>
            <div className="text-2xl font-black text-cyan-600 mt-1 font-heading">
              {shops.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Ready for pickup</div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Prints
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-heading">
              {totalPagesPrinted || 24} pgs
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Lifetime printed volume</div>
          </div>
        </div>

        {/* RECENT ORDERS WITH VISUAL PIPELINE (Uploaded -> Processing -> Printing -> Ready -> Collected) */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-lg font-black text-slate-900">
                Recent Orders & Live Progress
              </h2>
              <p className="text-xs text-slate-500">
                Track your jobs through the 5-stage automated print lifecycle
              </p>
            </div>
            <Link
              href="/orders"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              View all &rarr;
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-sm font-bold text-slate-600">No print jobs yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Choose a nearby hub below to upload your first document.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.slice(0, 3).map((order) => {
                const step = getStepIndex(order.status);
                const steps = [
                  { label: 'Uploaded', num: 1 },
                  { label: 'Processing', num: 2 },
                  { label: 'Printing', num: 3 },
                  { label: 'Ready', num: 4 },
                  { label: 'Collected', num: 5 },
                ];

                return (
                  <div
                    key={order._id || order.id}
                    className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-slate-200/80">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-blue-600 uppercase">
                          {order.orderNumber}
                        </span>
                        <h3 className="font-heading text-sm font-black text-slate-900 mt-0.5">
                          {order.fileName}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          {order.shopName} • {order.pageCount} pages • {order.copies} copies •{' '}
                          {order.isColor ? 'Color' : 'B&W'}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-base font-black text-slate-900 font-heading">
                          ₹{order.totalPrice?.toFixed(2)}
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            order.status === 'READY'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'PRINTING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* VISUAL 5-STAGE PIPELINE TRACKER */}
                    <div className="py-2">
                      <div className="flex items-center justify-between relative">
                        {/* Connecting Line */}
                        <div className="absolute top-3 left-4 right-4 h-1 bg-slate-200 z-0" />
                        <div
                          className="absolute top-3 left-4 h-1 bg-blue-600 transition-all duration-500 z-0"
                          style={{
                            width: `${((Math.min(step, 5) - 1) / 4) * 92}%`,
                          }}
                        />

                        {steps.map((s) => {
                          const isDone = step >= s.num;
                          const isCurrent = step === s.num;

                          return (
                            <div
                              key={s.label}
                              className="relative z-10 flex flex-col items-center"
                            >
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition ${
                                  isCurrent
                                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow'
                                    : isDone
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border-2 border-slate-300 text-slate-400'
                                }`}
                              >
                                {isDone && !isCurrent ? '✓' : s.num}
                              </div>
                              <span
                                className={`text-[10px] mt-1.5 font-bold ${
                                  isCurrent
                                    ? 'text-blue-700'
                                    : isDone
                                    ? 'text-slate-800'
                                    : 'text-slate-400'
                                }`}
                              >
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* NEARBY HUBS SECTION */}
        <div id="nearby-hubs-section" className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-black text-blue-600 uppercase tracking-wider">
                Select Printing Destination
              </span>
              <h2 className="font-heading text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                Nearby Prinly Partner Hubs
              </h2>
            </div>
            <div className="text-xs font-bold text-slate-500">
              {shops.length} verified hubs active
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {shops.map((shop) => (
              <div
                key={shop._id || shop.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-500 hover:shadow-lg transition flex flex-col justify-between hover-lift-3d"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-heading text-base font-black text-slate-900">
                      {shop.name}
                    </h3>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        shop.isOnline
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      ● {shop.isOnline ? 'ONLINE' : 'CLOSED'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                    {shop.address}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      ⭐ {shop.rating || 4.8}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      B&W ₹{shop.pricingRates?.bwSingle || 2}/pg
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-800">
                      Queue: {shop.currentQueueCount || 0} jobs
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {shop.totalPrinters || 2} Printers
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      Est. Wait
                    </span>
                    <span className="text-xs font-black text-slate-800">
                      ~{shop.estimatedWaitMinutes || 3} mins
                    </span>
                  </div>

                  <Link
                    href={`/hub/${shop._id || shop.id}`}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-black text-white shadow-sm transition active:scale-95"
                  >
                    Print Here &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        role="CUSTOMER"
        onScanQR={() => setIsQRScannerOpen(true)}
      />

      {/* Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
      />
    </div>
  );
}
