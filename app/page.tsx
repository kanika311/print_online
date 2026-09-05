'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Printer,
  QrCode,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  CheckCircle2,
  Zap,
  Star,
  Search,
  UploadCloud,
  FileText,
  Navigation,
  Compass,
  FileCheck,
  Smartphone,
  Check,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import QRScannerModal from '@/components/QRScannerModal';

export default function HomePage() {
  const router = useRouter();
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('Sector 18, Noida (Metro Complex)');
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'COLOR' | 'BW' | 'BINDING'>('ALL');

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
    <div className="min-h-screen flex flex-col bg-[#080d16] text-slate-100 selection:bg-sky-500 selection:text-white">
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
        {/* 2. Hero Section - Ultra Clean Modern Aesthetic */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
          {/* Ambient Lighting Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-sky-500/15 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute -top-32 right-1/4 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-bold text-sky-300 mb-6 shadow-glow-cyan backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
                <span>Smart On-Demand Printing • Zero Waiting Time</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-heading text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight sm:leading-[1.1]">
                Print instantly at your nearest cyber café.{' '}
                <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                  Skip the counter queue.
                </span>
              </h1>

              <p className="mt-5 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Scan the cyber café counter QR or select a shop remotely. Upload your documents, customize color and duplex settings, pay directly via Shop UPI, and pick up hot prints immediately.
              </p>

              {/* Primary Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setIsQRScannerOpen(true)}
                  id="hero-scan-qr-btn"
                  className="w-full sm:w-auto group relative flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 px-8 py-4 text-sm sm:text-base font-extrabold text-white shadow-xl shadow-sky-500/30 hover:shadow-sky-500/50 hover:brightness-105 active:scale-95 transition-all"
                >
                  <QrCode className="h-5 w-5 transition-transform group-hover:rotate-12" />
                  <span>Scan Counter QR Code</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>

                <a
                  href="#nearby-shops"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/90 px-7 py-4 text-sm font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition shadow-lg"
                >
                  <Compass className="h-4 w-4 text-sky-400" />
                  <span>Find Nearby Printing Hubs</span>
                </a>
              </div>

              {/* Live Metric Badges */}
              <div className="mt-10 grid grid-cols-3 gap-3 max-w-xl mx-auto text-center border-t border-white/5 pt-6">
                <div>
                  <div className="font-heading text-lg sm:text-xl font-black text-white">~2 Mins</div>
                  <div className="text-[11px] text-slate-400">Avg. Queue Time</div>
                </div>
                <div>
                  <div className="font-heading text-lg sm:text-xl font-black text-emerald-400">₹0 Fee</div>
                  <div className="text-[11px] text-slate-400">Direct Shop UPI</div>
                </div>
                <div>
                  <div className="font-heading text-lg sm:text-xl font-black text-sky-400">100% Private</div>
                  <div className="text-[11px] text-slate-400">Auto-deleted Files</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Interactive 3-Step Flow */}
        <section className="py-12 border-y border-white/5 bg-slate-950/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                How It Works
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-black text-white mt-1">
                Print in 3 Effortless Steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 relative overflow-hidden group hover:border-sky-500/30 transition">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 mb-4 group-hover:scale-110 transition">
                  <QrCode className="h-6 w-6" />
                </div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400 mb-1">
                  Step 01
                </div>
                <h3 className="font-heading text-base font-bold text-white mb-2">
                  Scan QR or Select Shop
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Scan the PrintPorter desk standee at the café counter, or pick an active shop from the live map before leaving home.
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 relative overflow-hidden group hover:border-purple-500/30 transition">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 mb-4 group-hover:scale-110 transition">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 mb-1">
                  Step 02
                </div>
                <h3 className="font-heading text-base font-bold text-white mb-2">
                  Upload & Customize
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Drag and drop your PDF, Word doc, or slides. Choose Color or B&W, double-sided duplex, paper size, and binding options.
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 relative overflow-hidden group hover:border-emerald-500/30 transition">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 group-hover:scale-110 transition">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 mb-1">
                  Step 03
                </div>
                <h3 className="font-heading text-base font-bold text-white mb-2">
                  Direct UPI Pay & Collect
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pay directly to the shop’s GPay/PhonePe UPI QR code. The machine prints automatically; pick up your prints without waiting.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Nearby Shops Explorer */}
        <section id="nearby-shops" className="py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Live Hardware Fleet
                  </span>
                </div>
                <h2 className="font-heading text-2xl sm:text-4xl font-black text-white">
                  Available Printing Hubs Near You
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Choose a verified cyber café to upload files, check queue load, and start printing.
                </p>
              </div>

              {/* Search Box */}
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Search shop by name or metro area..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/90 py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500 transition shadow-inner"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-24 text-center text-sm text-slate-400">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                Finding active cyber cafés in your area...
              </div>
            ) : filteredShops.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShops.map((shop, idx) => {
                  const isOpen = shop.isOnline !== false;
                  return (
                    <div
                      key={shop._id || shop.id}
                      className="glass-card rounded-3xl p-6 flex flex-col justify-between group relative transition-all duration-300 hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-500/10"
                    >
                      <div>
                        {/* Header: Name, Distance & Status Badge */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500/20 to-blue-500/10 text-sky-400 group-hover:scale-105 group-hover:text-white group-hover:from-sky-500 group-hover:to-blue-600 transition">
                              <Printer className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-heading text-base font-bold text-white group-hover:text-sky-300 transition line-clamp-1">
                                {shop.name}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                <span className="flex items-center text-amber-400 font-bold">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 mr-0.5" />
                                  {shop.rating || '4.9'}
                                </span>
                                <span>•</span>
                                <span className="text-sky-400 font-semibold">
                                  {idx === 0 ? '0.4 km away' : '1.1 km away'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border shrink-0 ${
                              isOpen
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                : 'bg-slate-800 border-white/10 text-slate-400'
                            }`}
                          >
                            {isOpen ? '● Open' : 'Closed'}
                          </span>
                        </div>

                        {/* Physical Address */}
                        <p className="text-xs text-slate-400 flex items-start gap-1.5 mb-4 line-clamp-2">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <span>{shop.address}</span>
                        </p>

                        {/* Live Hardware Stats */}
                        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-3.5 mb-4 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Hardware Fleet:</span>
                            <span className="font-bold text-emerald-400">
                              {shop.totalPrinters || 2} Online Machines
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Active Spool Queue:</span>
                            <span className="font-bold text-white flex items-center gap-1">
                              <Clock className="h-3 w-3 text-sky-400" />
                              {shop.currentQueueCount || 0} jobs (~{shop.estimatedWaitMinutes || 2} mins)
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/5 pt-2">
                            <span className="text-slate-400 text-[11px]">Starting Price:</span>
                            <span className="font-heading font-black text-sky-300">
                              From ₹{shop.startingPrice?.toFixed(2) || '2.00'} / page
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Select Shop CTA */}
                      <div className="border-t border-white/10 pt-3">
                        <Link
                          href={`/shop/${shop._id || shop.id}`}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-xs font-bold text-white hover:bg-sky-400 transition shadow-md shadow-sky-500/20"
                        >
                          <span>Select & Upload Documents</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center text-sm text-slate-400">
                No cyber cafés found matching "{filterQuery}". Try another location.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-white/10 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500 text-white font-black text-xs">
              P
            </div>
            <span className="font-heading font-bold text-slate-300">PrintPorter</span>
            <span>— Smart Cyber Café & On-Demand Print Network</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/printer/login" className="text-slate-400 hover:text-white transition">
              Printer Shop Login
            </Link>
            <Link href="/khushi-admin/login" className="text-slate-500 hover:text-slate-400 transition">
              Admin CMS
            </Link>
          </div>
        </div>
      </footer>

      {/* QR Scanner Interactive Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
      />
    </div>
  );
}
