'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import QRScannerModal from '@/components/QRScannerModal';

export default function HomePage() {
  const router = useRouter();
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('Sector 18, Noida (Metro Complex)');
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');

  // Fetch registered shops
  const fetchShops = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/shops');
      const data = await res.json();
      if (data && data.shops) {
        setShops(data.shops);
      }
    } catch (err) {
      console.error('Error fetching shops:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const filteredShops = shops.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(filterQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* 1. Header & Navigation */}
      <Navbar
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        currentLocation={currentLocation}
        onLocationChange={(loc) => {
          setCurrentLocation(loc);
          setFilterQuery(loc.startsWith('GPS') ? '' : loc);
        }}
      />

      <main className="flex-1">
        {/* 2. Hero Section - Clean Light Aesthetic */}
        <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-18 bg-white border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              {/* Status Badge */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] sm:text-xs font-bold text-blue-700 mb-4">
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-blue-600" />
                <span>Smart On-Demand Printing • Zero Waiting Time</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-heading text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                Print instantly at your nearest cyber café.{' '}
                <span className="text-blue-600 block sm:inline">
                  Skip the counter queue.
                </span>
              </h1>

              <p className="mt-3 sm:mt-4 text-xs sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Scan the cyber café counter QR or select a shop remotely. Upload your documents, customize color and duplex settings, pay directly via Shop UPI, and pick up hot prints immediately.
              </p>

              {/* Primary Action Buttons */}
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setIsQRScannerOpen(true)}
                  id="hero-scan-qr-btn"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 sm:px-7 sm:py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-sm transition-all active:scale-95"
                >
                  <span>Scan Counter QR Code</span>
                  <span>&rarr;</span>
                </button>

                <a
                  href="#nearby-shops"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                >
                  <span>Find Nearby Printing Hubs</span>
                </a>
              </div>

              {/* Live Metric Badges */}
              <div className="mt-8 sm:mt-10 grid grid-cols-3 gap-2 sm:gap-3 max-w-lg mx-auto text-center border-t border-slate-200 pt-5 sm:pt-6">
                <div>
                  <div className="font-heading text-base sm:text-xl font-black text-slate-900">~2 Mins</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Avg. Queue Time</div>
                </div>
                <div>
                  <div className="font-heading text-base sm:text-xl font-black text-blue-600">₹0 Fee</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Direct Shop UPI</div>
                </div>
                <div>
                  <div className="font-heading text-base sm:text-xl font-black text-emerald-600">100% Private</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Auto-deleted Files</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. 3-Step Flow */}
        <section className="py-8 sm:py-12 border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
              <span className="text-[11px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider">
                How It Works
              </span>
              <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Print in 3 Effortless Steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
              {/* Step 1 */}
              <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
                <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1">
                  Step 01
                </div>
                <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 mb-1.5 sm:mb-2">
                  Scan QR or Select Shop
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Scan the PrintPorter desk standee at the café counter, or pick an active shop from the live list before leaving home.
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
                <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1">
                  Step 02
                </div>
                <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 mb-1.5 sm:mb-2">
                  Upload & Customize
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upload your PDF, Word doc, or take a phone photo. Choose Color or B&W, duplex double-sided, paper size, and binding.
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
                <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1">
                  Step 03
                </div>
                <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 mb-1.5 sm:mb-2">
                  Direct UPI Pay & Collect
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pay directly to the shop’s GPay/PhonePe UPI QR code or pay cash. The machine prints automatically; pick up without waiting.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Nearby Shops Explorer */}
        <section id="nearby-shops" className="py-8 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 sm:gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Live Hardware Fleet
                  </span>
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-900">
                  Available Printing Hubs Near You
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose a verified cyber café to upload files, check queue load, and start printing.
                </p>
              </div>

              {/* Search Box */}
              <div className="w-full md:max-w-sm">
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Search shop by name or metro area..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-sm transition"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-sm text-slate-500">
                Finding active cyber cafés in your area...
              </div>
            ) : filteredShops.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {filteredShops.map((shop, idx) => {
                  const isOpen = shop.isOnline !== false;
                  return (
                    <div
                      key={shop._id || shop.id}
                      className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col justify-between shadow-sm hover:border-blue-500 hover:shadow-md transition group"
                    >
                      <div>
                        {/* Header: Name, Distance & Status Badge */}
                        <div className="flex items-start justify-between gap-2 mb-2.5 sm:mb-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                              {shop.name}
                            </h3>
                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 mt-0.5">
                              <span className="text-amber-600 font-bold">
                                ★ {shop.rating || '4.9'}
                              </span>
                              <span>•</span>
                              <span className="text-blue-600 font-semibold">
                                {idx === 0 ? '0.4 km away' : '1.1 km away'}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold border shrink-0 ${
                              isOpen
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                : 'bg-slate-100 border-slate-300 text-slate-500'
                            }`}
                          >
                            {isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>

                        {/* Physical Address */}
                        <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                          {shop.address}
                        </p>

                        {/* Live Hardware Stats */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3 mb-3.5 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-[11px]">Hardware Fleet:</span>
                            <span className="font-bold text-emerald-700">
                              {shop.totalPrinters || 2} Online Machines
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-[11px]">Active Spool Queue:</span>
                            <span className="font-bold text-slate-800">
                              {shop.currentQueueCount || 0} jobs (~{shop.estimatedWaitMinutes || 2} mins)
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                            <span className="text-slate-500 text-[11px]">Starting Price:</span>
                            <span className="font-heading font-black text-blue-600">
                              From ₹{shop.startingPrice?.toFixed(2) || '2.00'} / page
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Select Shop CTA */}
                      <div className="border-t border-slate-100 pt-3">
                        <Link
                          href={`/shop/${shop._id || shop.id}`}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm"
                        >
                          <span>Select & Upload Documents</span>
                          <span>&rarr;</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-slate-500">
                No cyber cafés found matching "{filterQuery}". Try another location.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Clean Light Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="rounded bg-blue-600 text-white font-bold text-xs px-1.5 py-0.5">
              PP
            </span>
            <span className="font-heading font-bold text-slate-800">PrintPorter</span>
            <span>— Smart Cyber Café Print Network</span>
          </div>

          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <Link href="/printer/login" className="text-slate-600 hover:text-blue-600 transition font-medium">
              Printer Shop Login
            </Link>
            <Link href="/khushi-admin/login" className="text-slate-500 hover:text-slate-700 transition">
              Admin CMS
            </Link>
          </div>
        </div>
      </footer>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
      />
    </div>
  );
}
