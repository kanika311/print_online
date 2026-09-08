'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomNavigation from '@/components/BottomNavigation';
import QRScannerModal from '@/components/QRScannerModal';
import RoleSelectionModal from '@/components/RoleSelectionModal';
import Document3D from '@/components/3d/Document3D';
import Printer3D from '@/components/3d/Printer3D';
import QRCode3D from '@/components/3d/QRCode3D';
import Location3D from '@/components/3d/Location3D';
import Network3D from '@/components/3d/Network3D';

export default function HomePage() {
  const router = useRouter();
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('Sector 18, Noida (Metro Complex)');
  const [shops, setShops] = useState<any[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState<string | null>('faq_1');
  const [cmsData, setCmsData] = useState<any>(null);

  // Fetch CMS configuration
  useEffect(() => {
    fetch('/api/cms')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.cms) {
          setCmsData(data.cms);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch registered printing hubs
  const fetchShops = async () => {
    try {
      setLoadingShops(true);
      const res = await fetch('/api/shops');
      const data = await res.json();
      if (data && data.shops) {
        setShops(data.shops);
      }
    } catch (err) {
      console.error('Error fetching shops:', err);
    } finally {
      setLoadingShops(false);
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

  const cms = cmsData || {};
  const hero = cms.hero || {
    badge: 'Smart Cyber Cafe Print Network • Zero Waiting Time',
    headlinePart1: 'Your Documents.',
    headlinePart2: 'Printed Nearby.',
    subheading:
      'Upload online, choose a nearby Prinly Hub, pay digitally and collect your prints without waiting in line.',
    primaryCtaText: 'Find a Printing Hub',
    secondaryCtaText: 'Become a Prinly Hub',
    stat1Number: '~2 Mins',
    stat1Label: 'Avg. Collection Time',
    stat2Number: '₹0 Fee',
    stat2Label: 'Direct Shop UPI',
    stat3Number: '100% Private',
    stat3Label: 'Auto-deleted Files',
  };

  const roles = cms.roles || {
    userCard: {
      tag: 'FOR CUSTOMERS',
      title: 'Print documents from anywhere',
      description:
        'Upload your documents, find a nearby Prinly printing hub, customize your print settings, pay digitally, and collect your prints.',
      primaryCta: 'Continue as User',
      secondaryCta: 'Login / Register',
    },
    printerCard: {
      tag: 'FOR CYBER CAFE & PRINTER OWNERS',
      title: 'Turn your printer into a Prinly Hub',
      description:
        'Register your cyber cafe or printing shop, receive online print orders, manage your printer queue, and grow your local printing business.',
      primaryCta: 'Register Your Printer',
      secondaryCta: 'Printer Owner Login',
    },
  };

  const features = cms.features || [
    {
      id: 'f1',
      title: 'Zero Queue Cloud Spooling',
      description:
        'Files are pre-processed and sent directly to the shop’s active printer tray. No standing in counter lines.',
      badge: 'High Speed',
    },
    {
      id: 'f2',
      title: 'Direct Shopkeeper UPI / Cash',
      description:
        'Pay directly to the local shopkeeper using GPay, PhonePe, Paytm, or choose cash on collection.',
      badge: 'Transparent',
    },
    {
      id: 'f3',
      title: 'Total Document Privacy',
      description:
        '256-bit SSL encrypted transit. Uploaded files are automatically erased right after printing.',
      badge: 'Confidential',
    },
    {
      id: 'f4',
      title: 'Full Format & Duplex Freedom',
      description:
        'Support for PDF, Word docs, images, colored brochures, spiral binding, and staple options.',
      badge: 'Flexible',
    },
  ];

  const faqs = cms.faqs || [
    {
      id: 'faq_1',
      question: 'How do I print a document using Prinly?',
      answer:
        'Simply select a nearby Prinly hub or scan their counter QR code, upload your file (PDF, DOCX, or Image), customize your print settings (Color/B&W, Duplex), and pay digitally or in cash upon arrival.',
    },
    {
      id: 'faq_2',
      question: 'Are my uploaded documents secure and private?',
      answer:
        'Yes. Prinly uses 256-bit TLS encryption in transit. Files are only accessible to the designated printer for output and are automatically purged from the spooler after printing.',
    },
    {
      id: 'faq_3',
      question: 'How can cyber cafe or printer owners join Prinly?',
      answer:
        'Click on "Join as a Printing Hub" or "Register Your Printer". Complete our 5-minute onboarding with your shop details, printer fleet, and pricing. You will immediately start receiving online print orders from nearby students and professionals.',
    },
    {
      id: 'faq_4',
      question: 'What is the Counter QR Standee?',
      answer:
        'Every Prinly partner shop receives a unique QR standee. Customers can simply walk in, scan the QR with any camera, upload their documents on the spot, and have them print out automatically without using WhatsApp or USB drives.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-blue-600 selection:text-white pb-16 md:pb-0">
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
        {/* =============================================================== */}
        {/* 2. THE MOST IMPORTANT INTERACTION: TWO PRIMARY PERSPECTIVES     */}
        {/* =============================================================== */}
        <section className="relative overflow-hidden pt-8 pb-10 sm:pt-12 sm:pb-14 bg-gradient-to-b from-blue-50/50 via-white to-slate-50 border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 backdrop-blur px-3.5 py-1 text-xs font-black text-blue-700 shadow-sm mb-3">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                <span>SELECT YOUR JOURNEY</span>
                <span className="text-[10px] text-slate-400">|</span>
                <span className="text-slate-600 font-semibold">2026 Print Platform</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                Upload Anywhere. <span className="text-blue-600">Print Nearby.</span> Collect Instantly.
              </h2>
              <p className="mt-2 text-xs sm:text-base text-slate-600">
                Prinly powers instant cloud-to-counter printing for customers and local businesses. Choose how you want to use the network:
              </p>
            </div>

            {/* THE TWO LARGE 3D PERSPECTIVE CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {/* PERSPECTIVE A: PRINT SOMETHING (Customers / Users) */}
              <div className="relative group rounded-3xl bg-white border-2 border-slate-200 hover:border-blue-500 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1.5 overflow-hidden">
                {/* Accent Top Bar */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-black text-blue-700 uppercase tracking-wider">
                      {roles.userCard.tag}
                    </span>
                    <span className="text-xs font-bold text-slate-400">Step 1 of 3</span>
                  </div>

                  {/* 3D Visual Centerpiece */}
                  <div className="h-44 sm:h-52 flex items-center justify-center my-3 relative">
                    <Document3D size="md" title="Final_Semester_Thesis.pdf" pages={18} />
                  </div>

                  <h3 className="font-heading text-xl sm:text-2xl font-black text-slate-900 group-hover:text-blue-600 transition">
                    {roles.userCard.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {roles.userCard.description}
                  </p>
                </div>

                <div className="mt-6 sm:mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    href="/user/dashboard"
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-xs sm:text-sm font-black text-white shadow-md shadow-blue-600/20 transition active:scale-95 text-center"
                  >
                    <span>{roles.userCard.primaryCta}</span>
                    <span>&rarr;</span>
                  </Link>

                  <Link
                    href="/login?role=customer"
                    className="w-full sm:w-auto px-4 py-3 text-xs font-bold text-slate-600 hover:text-blue-600 transition text-center"
                  >
                    {roles.userCard.secondaryCta}
                  </Link>
                </div>
              </div>

              {/* PERSPECTIVE B: JOIN AS A PRINTING HUB (Printer & Cyber Cafe Owners) */}
              <div className="relative group rounded-3xl bg-white border-2 border-slate-200 hover:border-cyan-500 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1.5 overflow-hidden">
                {/* Accent Top Bar */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-xs font-black text-cyan-700 uppercase tracking-wider">
                      {roles.printerCard.tag}
                    </span>
                    <span className="text-xs font-bold text-slate-400">Business Network</span>
                  </div>

                  {/* 3D Visual Centerpiece */}
                  <div className="h-44 sm:h-52 flex items-center justify-center my-3 relative">
                    <Printer3D size="md" status="ONLINE" />
                  </div>

                  <h3 className="font-heading text-xl sm:text-2xl font-black text-slate-900 group-hover:text-cyan-600 transition">
                    {roles.printerCard.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {roles.printerCard.description}
                  </p>

                  {/* Highlight note */}
                  <div className="mt-3 p-2.5 rounded-xl bg-cyan-50/60 border border-cyan-200/80 flex items-start gap-2 text-[11px] text-slate-700">
                    <span className="text-cyan-600 font-bold">⚡ Smart QR:</span>
                    <span>
                      Customers scan your standee QR &rarr; order appears with audio chime &rarr; direct UPI confirm &rarr; auto spool!
                    </span>
                  </div>
                </div>

                <div className="mt-6 sm:mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
                  <Link
                    href="/printer"
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-700 hover:to-cyan-700 px-5 py-3 text-xs sm:text-sm font-black text-white shadow-md shadow-blue-600/20 transition active:scale-95 text-center"
                  >
                    <span>Explore Shop Partner Hub</span>
                    <span>&rarr;</span>
                  </Link>

                  <Link
                    href="/printer/login"
                    className="w-full sm:w-auto px-4 py-3 text-xs font-bold text-slate-600 hover:text-cyan-600 transition text-center"
                  >
                    Shop Owner Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 3. HERO SECTION WITH 3D NETWORK ILLUSTRATION                     */}
        {/* =============================================================== */}
        <section className="relative overflow-hidden py-12 sm:py-18 bg-white border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 mb-4 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                <span>{hero.badge}</span>
              </div>

              <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                {hero.headlinePart1}{' '}
                <span className="text-blue-600 block sm:inline">
                  {hero.headlinePart2}
                </span>
              </h1>

              <p className="mt-4 text-xs sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                {hero.subheading}
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="#nearby-shops"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition active:scale-95"
                >
                  <span>{hero.primaryCtaText}</span>
                  <span>&darr;</span>
                </a>

                <Link
                  href="/printer/register"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                >
                  <span>{hero.secondaryCtaText}</span>
                </Link>
              </div>
            </div>

            {/* LARGE 3D PIPELINE ILLUSTRATION */}
            <Network3D />
          </div>
        </section>

        {/* =============================================================== */}
        {/* 4. HOW PRINLY WORKS (STEP BY STEP FLOW)                          */}
        {/* =============================================================== */}
        <section id="how-it-works" className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600">
                Simple & Frictionless
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                How Prinly Works
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                From remote document upload to physical printout in under 120 seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm hover-lift-3d transition">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm mb-4">
                  1
                </div>
                <h3 className="font-heading text-lg font-black text-slate-900">
                  Select a Nearby Hub
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Browse verified local cyber cafes or scan the counter standee QR code when you walk into any partnered print shop.
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm hover-lift-3d transition">
                <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-black text-sm mb-4">
                  2
                </div>
                <h3 className="font-heading text-lg font-black text-slate-900">
                  Upload & Configure
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Upload your PDF, DOCX, or images. Choose color/B&W, duplex sides, paper size, and binding with real-time price estimation.
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm hover-lift-3d transition">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm mb-4">
                  3
                </div>
                <h3 className="font-heading text-lg font-black text-slate-900">
                  Pay & Collect Instantly
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Pay directly via Shop UPI (GPay, PhonePe) or counter cash. Your documents spool immediately to the printer tray.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 5. NEARBY PRINTING HUBS SECTION                                  */}
        {/* =============================================================== */}
        <section id="nearby-shops" className="py-12 sm:py-16 bg-white border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-blue-600">
                  Live Network Radar
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  Nearby Printing Hubs
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Active shops near <span className="font-bold text-slate-800">{currentLocation}</span>
                </p>
              </div>

              {/* Search filter input */}
              <div className="w-full sm:w-72">
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter by shop name or sector..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-medium outline-none focus:border-blue-600 focus:bg-white transition"
                />
              </div>
            </div>

            {loadingShops ? (
              <div className="py-12 text-center text-slate-400">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-2" />
                <p className="text-xs">Scanning nearby Prinly hubs...</p>
              </div>
            ) : filteredShops.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-sm font-bold text-slate-700">No printing hubs found matching "{filterQuery}"</p>
                <p className="text-xs text-slate-500 mt-1">Try searching another sector or clear your filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShops.map((shop) => (
                  <div
                    key={shop._id || shop.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-400 hover:shadow-lg transition flex flex-col justify-between hover-lift-3d"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-heading text-base font-black text-slate-900 leading-tight">
                          {shop.name}
                        </h3>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            shop.isOnline
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          ● {shop.isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                        {shop.address}
                      </p>

                      {/* Capabilities pills */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                          B&W ₹{shop.pricingRates?.bwSingle || 2}/pg
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-[10px] font-bold text-blue-700">
                          Color ₹{shop.pricingRates?.colorSingle || 10}/pg
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                          Queue: {shop.currentQueueCount || 0} jobs
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Estimated Wait</div>
                        <div className="text-xs font-black text-slate-800">
                          ~{shop.estimatedWaitMinutes || 3} mins
                        </div>
                      </div>

                      <Link
                        href={`/hub/${shop._id || shop.id}`}
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-black text-white shadow-sm transition active:scale-95 text-center"
                      >
                        Print Here &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =============================================================== */}
        {/* 6. PLATFORM BENEFITS (DYNAMIC CMS)                              */}
        {/* =============================================================== */}
        <section className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600">
                Next-Gen Architecture
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Built for Speed, Privacy & Precision
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Modern 2026 infrastructure connecting students, professionals, and cyber cafes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feat: any) => (
                <div
                  key={feat.id}
                  className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm hover-lift-3d transition flex flex-col justify-between"
                >
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-extrabold text-blue-700 mb-3">
                      {feat.badge || 'Prinly Pro'}
                    </span>
                    <h3 className="font-heading text-base font-black text-slate-900 mb-2">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 7. PRINTER OWNER PARTNER CTA                                    */}
        {/* =============================================================== */}
        <section className="py-12 sm:py-16 bg-slate-900 text-white border-b border-slate-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-blue-600/10" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-xs font-black uppercase tracking-wider">
                  Partner with Prinly
                </span>
                <h2 className="font-heading text-2xl sm:text-4xl font-black mt-3 leading-tight">
                  Turn your local cyber cafe into a smart cloud print hub.
                </h2>
                <p className="text-xs sm:text-base text-slate-400 mt-3 leading-relaxed">
                  Join hundreds of shopkeepers generating high-margin repeat printing orders with zero line bottlenecks. Receive online files directly into your printer queue and accept payments via your own Shop UPI QR.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    href="/printer/register"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-xs sm:text-sm hover:opacity-95 transition shadow-lg shadow-cyan-500/20 text-center"
                  >
                    Register Your Printer Now &rarr;
                  </Link>

                  <Link
                    href="/login?role=printer_owner"
                    className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition text-center"
                  >
                    Printer Owner Login
                  </Link>
                </div>
              </div>

              {/* 3D QR & Printer preview */}
              <div className="flex items-center justify-center gap-6">
                <QRCode3D size="md" label="Your Shop QR" />
              </div>
            </div>
          </div>
        </section>

        {/* =============================================================== */}
        {/* 8. FREQUENTLY ASKED QUESTIONS (DYNAMIC CMS)                     */}
        {/* =============================================================== */}
        <section id="faq" className="py-12 sm:py-16 bg-white border-b border-slate-200">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600">
                Got Questions?
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Everything you need to know about the Prinly smart cyber cafe network.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq: any) => {
                const isOpen = activeFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition shadow-sm"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : faq.id)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 font-heading text-xs sm:text-sm font-black text-slate-900 hover:text-blue-600 transition"
                    >
                      <span>{faq.question}</span>
                      <span className="text-blue-600 font-bold text-base">
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* 9. Dynamic Footer */}
      <Footer cmsData={cmsData} />

      {/* 10. Mobile Bottom Navigation Bar */}
      <BottomNavigation
        role="CUSTOMER"
        onScanQR={() => setIsQRScannerOpen(true)}
      />

      {/* QR Scanner Modal for Instant Counter Walk-ins */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
      />

      {/* Role Selection Modal */}
      <RoleSelectionModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        targetAction="GENERAL"
      />
    </div>
  );
}
