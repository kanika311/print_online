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

  const filteredShops = shops.filter(
    (s) =>
      s.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0e17]">
      {/* 1. Navbar: Logo + brand on left, Location/search in center, Profile on right, Scan QR button */}
      <Navbar
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        currentLocation={currentLocation}
        onLocationChange={(loc) => {
          setCurrentLocation(loc);
          setFilterQuery(loc.startsWith('GPS') ? '' : loc);
        }}
      />

      {/* Role Navigation Bar */}
      <div className="border-b border-white/5 bg-slate-950/80 px-4 py-2 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Active Mode:
            </span>
            <span className="rounded-md bg-sky-500/20 px-2 py-0.5 font-bold text-sky-400">
              👤 User / Consumer App
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/printer/login"
              className="flex items-center gap-1.5 font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Printer Owner Portal</span>
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* 2. Hero Section */}
        <section className="relative overflow-hidden py-14 sm:py-20">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-bold text-sky-400 mb-6 shadow-glow-cyan">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Smart On-Demand Printing & Cyber Café Network</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
              Instant Printing at Nearby Cyber Cafés.{' '}
              <span className="gradient-text">Zero Wait Lines.</span>
            </h1>

            <p className="mt-5 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              Scan a counter QR code or select a nearby shop remotely to upload documents, configure print settings, pay securely, and track live queue progress.
            </p>

            {/* Large Primary Action: Scan QR Button + Find Nearby Printing Shops */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setIsQRScannerOpen(true)}
                id="hero-scan-qr-btn"
                className="group relative flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 px-8 py-4 text-base font-extrabold text-white shadow-2xl shadow-sky-500/40 hover:shadow-sky-500/60 hover:brightness-110 active:scale-95 transition-all"
              >
                <QrCode className="h-6 w-6 transition-transform group-hover:rotate-12" />
                <span>Scan Shop QR Code</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>

              <a
                href="#nearby-shops"
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 px-6 py-4 text-sm font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition"
              >
                <Compass className="h-4 w-4 text-sky-400" />
                <span>Find Nearby Printing Shops</span>
              </a>
            </div>
          </div>
        </section>

        {/* 3. Nearby Shops Section */}
        <section id="nearby-shops" className="py-12 border-t border-white/5 bg-slate-950/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                    Nearby Printing Shops & Cyber Cafés
                  </h2>
                  <span className="rounded-full bg-sky-500/15 border border-sky-500/30 px-2.5 py-0.5 text-xs font-bold text-sky-400">
                    {filteredShops.length} Available
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Upload your documents remotely before visiting or order doorstep Porter delivery
                </p>
              </div>

              {/* Location / Query filter */}
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter by shop name or location..."
                  className="w-full rounded-xl border border-white/10 bg-slate-900 py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-sm text-slate-400">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                Scanning nearby cyber cafés...
              </div>
            ) : filteredShops.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShops.map((shop, idx) => (
                  <div
                    key={shop._id || shop.id}
                    className="glass-card glass-card-hover group relative flex flex-col justify-between rounded-3xl p-6"
                  >
                    <div>
                      {/* Shop Name & Open/Closed Badge */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition">
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
                                {idx === 0 ? '0.4 km away' : '1.2 km away'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {shop.isOnline ? (
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 shrink-0">
                            ● Open Now
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-800 border border-white/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-400 shrink-0">
                            Closed
                          </span>
                        )}
                      </div>

                      {/* Address */}
                      <p className="text-xs text-slate-400 flex items-start gap-1.5 mb-4 line-clamp-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>{shop.address}</span>
                      </p>

                      {/* Hardware / Printer Availability & Starting Price */}
                      <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-3 mb-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Printer Availability:</span>
                          <span className="font-bold text-emerald-400">
                            {shop.availablePrinters || 1} Available • {shop.busyPrinters || 1} Busy
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Active Queue:</span>
                          <span className="font-bold text-white flex items-center gap-1">
                            <Clock className="h-3 w-3 text-sky-400" />
                            {shop.currentQueueCount || 0} jobs (~{shop.estimatedWaitMinutes || 3} mins wait)
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/5 pt-1.5">
                          <span className="text-slate-400 text-[11px]">Starting Price:</span>
                          <span className="font-heading font-black text-sky-300">
                            From ₹{shop.pricingRates?.bwSingle?.toFixed(2) || '2.00'} / page
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SELECT SHOP Button */}
                    <div className="border-t border-white/10 pt-3">
                      <Link
                        href={`/shop/${shop._id || shop.id}`}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-xs font-bold text-white hover:bg-sky-400 transition shadow-md shadow-sky-500/20"
                      >
                        <span>Select Shop & Upload</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-slate-400">
                No cyber cafés matching "{filterQuery}". Try another location.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* QR Scanner Interactive Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
      />
    </div>
  );
}
