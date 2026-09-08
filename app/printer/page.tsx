'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Printer3D from '@/components/3d/Printer3D';
import QRCode3D from '@/components/3d/QRCode3D';

export default function ShopOwnerPartnerLandingPage() {
  const router = useRouter();

  // Interactive Calculator State
  const [dailyPrints, setDailyPrints] = useState(150);
  const [pricePerPage, setPricePerPage] = useState(3.0);

  // Standee Live Customizer Preview State
  const [previewShopName, setPreviewShopName] = useState('Apex Digital Print & Cyber Cafe');
  const [previewTheme, setPreviewTheme] = useState<'BLUE' | 'GOLD' | 'OBSIDIAN' | 'EMERALD'>('BLUE');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Calculate metrics
  const monthlyPrints = dailyPrints * 30;
  const monthlyRevenue = monthlyPrints * pricePerPage;
  const hoursSavedMonthly = Math.round((monthlyPrints * 2.5) / 60); // 2.5 mins saved per order vs WhatsApp

  const faqs = [
    {
      q: 'Do I need to buy a new Wi-Fi or expensive cloud printer?',
      a: 'No! Prinly works with 100% of your existing printers (HP, Canon, Epson, Brother, Konica Minolta). You only need your existing shop PC or laptop connected to your printer with regular USB cables.',
    },
    {
      q: 'Where does the customer payment go? Is there any commission?',
      a: '100% of payments go directly to your personal or shop UPI (Google Pay, PhonePe, Paytm, BHIM) with 0% platform commission on the Pioneer plan. You can also accept cash at your counter!',
    },
    {
      q: 'How does a customer print from their phone without WhatsApp?',
      a: 'Customers simply point their mobile camera at your Prinly Counter Desk Standee QR. A web app opens instantly without installing any app. They pick their PDF/image, select B&W or Color, pay, and your dashboard chimes with the print job ready!',
    },
    {
      q: 'What happens to the customer documents after printing?',
      a: 'Customer files are protected with 256-bit SSL encryption and are automatically purged from the cloud spooler once printed. No random personal files cluttering your desktop or WhatsApp memory.',
    },
    {
      q: 'How long does it take to setup my shop?',
      a: 'Exactly 2 minutes! Just enter your shop name, per-page rates, and UPI ID. Download your instant Counter Desk Standee QR, print it on A4, and you are ready to accept orders today.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/20 to-white text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* ========================================================= */}
      {/* 1. B2B PARTNER STICKY HEADER                              */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-18 items-center justify-between gap-4">
            {/* Logo + Partner Badge */}
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/" className="inline-flex items-center gap-2 group">
                <img
                  src="/logo.png"
                  alt="Prinly.in - Local Print Network"
                  className="h-9 w-auto object-contain transition group-hover:scale-105"
                />
              </Link>
              <span className="hidden sm:inline-block rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-blue-700">
                Partner Network
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-600">
              <a href="#how-it-works" className="hover:text-blue-600 transition">How It Works</a>
              <a href="#features" className="hover:text-blue-600 transition">Features</a>
              <a href="#calculator" className="hover:text-blue-600 transition">Revenue Calculator</a>
              <a href="#standee" className="hover:text-blue-600 transition">Desk Standee</a>
              <a href="#pricing" className="hover:text-blue-600 transition">Plans & Pricing</a>
              <a href="#faq" className="hover:text-blue-600 transition">FAQ</a>
            </nav>

            {/* Right Action CTAs */}
            <div className="flex items-center gap-2.5">
              <Link
                href="/printer/login"
                className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition active:scale-95"
              >
                Shop Owner Login
              </Link>
              <Link
                href="/printer/register"
                className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-4 py-2 text-xs font-black text-white shadow-md shadow-blue-600/20 transition active:scale-95 flex items-center gap-1.5"
              >
                <span>Register Shop Now</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. HERO SECTION (Directly Inspired by Shopkeeper Workflow) */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-200/80">
        {/* Ambient background glow */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-blue-100/50 via-cyan-100/40 to-indigo-100/30 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Left Column: Value Proposition & CTAs (7 Cols) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Trust Eyebrow */}
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 backdrop-blur px-4 py-1.5 text-xs font-black text-blue-700 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>FOR CYBER CAFES, CSC CENTERS & XEROX SHOPS</span>
              </div>

              {/* Big Headline */}
              <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
                From the customer's phone{' '}
                <span className="block mt-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 bg-clip-text text-transparent">
                  To Your Printer. Instantly.
                </span>
              </h1>

              {/* Tagline / Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 font-semibold max-w-xl mx-auto lg:mx-0">
                <span className="text-rose-600 font-bold">No WhatsApp number sharing</span> •{' '}
                <span className="text-rose-600 font-bold">No virus in pen drives</span> •{' '}
                <span className="text-blue-700 font-bold">Direct UPI payment to you</span>
              </p>

              {/* 4 Interactive Process Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 max-w-xl mx-auto lg:mx-0">
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-xs text-center">
                  <div className="h-8 w-8 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-1.5 shadow-xs">
                    📱
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Step 1</div>
                  <div className="text-xs font-black text-slate-800">Scan QR Code</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-xs text-center">
                  <div className="h-8 w-8 mx-auto rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold text-sm mb-1.5 shadow-xs">
                    📄
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Step 2</div>
                  <div className="text-xs font-black text-slate-800">Upload Doc</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-xs text-center">
                  <div className="h-8 w-8 mx-auto rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm mb-1.5 shadow-xs">
                    💳
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Step 3</div>
                  <div className="text-xs font-black text-slate-800">Pay Direct UPI</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-xs text-center">
                  <div className="h-8 w-8 mx-auto rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm mb-1.5 shadow-xs">
                    🖨️
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Step 4</div>
                  <div className="text-xs font-black text-slate-800">Auto Print</div>
                </div>
              </div>

              {/* Primary Call to Actions */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <a
                  href="#pricing"
                  className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 hover:from-orange-600 hover:to-rose-600 px-6 py-3.5 text-xs sm:text-sm font-black text-white shadow-lg shadow-orange-500/25 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>💰 See Setup Plans & Pricing</span>
                  <span>↓</span>
                </a>

                <Link
                  href="/printer/register"
                  className="w-full sm:w-auto rounded-2xl bg-blue-600 hover:bg-blue-700 px-6 py-3.5 text-xs sm:text-sm font-black text-white shadow-md shadow-blue-600/20 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>⚡ Register Shop in 2 Mins</span>
                  <span>&rarr;</span>
                </Link>
              </div>

              {/* Micro Social Proof */}
              <div className="pt-2 flex items-center justify-center lg:justify-start gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <span className="text-emerald-500">✓</span>
                  <span>Zero Hardware Cost</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <span className="text-emerald-500">✓</span>
                  <span>0% Platform Commission</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <span className="text-emerald-500">✓</span>
                  <span>Instant Setup</span>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Visual Showcase (5 Cols) */}
            <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
              {/* Outer Glow Container */}
              <div className="relative w-full max-w-md rounded-3xl border border-slate-200/90 bg-white/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-blue-600/10 space-y-6">
                {/* Floating Top Badge: 100% Privacy */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3 flex items-start gap-2.5 shadow-xs">
                  <span className="text-emerald-600 text-lg">🛡️</span>
                  <div className="text-xs">
                    <strong className="block text-emerald-950 font-black">NO FILE STORED ON SERVER</strong>
                    <span className="text-emerald-800 text-[11px] leading-tight block mt-0.5">
                      Customer files are securely purged right after printing. Zero risk of private leak.
                    </span>
                  </div>
                </div>

                {/* Live 3D Elements Stack */}
                <div className="grid grid-cols-2 gap-4 items-center">
                  {/* Left: 3D Standee QR */}
                  <div className="flex flex-col items-center justify-center bg-gradient-to-b from-blue-50/50 to-white rounded-2xl border border-blue-100 p-4 shadow-xs">
                    <QRCode3D label="Counter QR" size="sm" />
                    <span className="mt-2 text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                      Desk Standee
                    </span>
                  </div>

                  {/* Right: 3D Workhorse Printer */}
                  <div className="flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                    <Printer3D size="sm" status="PRINTING" />
                    <span className="mt-2 text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Auto-Printing
                    </span>
                  </div>
                </div>

                {/* Floating Walk-in Order Simulation Card */}
                <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/80 to-cyan-50/80 p-3.5 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      PDF
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">Notes_Semester_Final.pdf</div>
                      <div className="text-[10px] font-bold text-slate-500">12 Pages • B&W Duplex • ₹24.00</div>
                    </div>
                  </div>
                  <span className="rounded-lg bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 shadow-xs">
                    PAID UPI ✓
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. SMART PRINTING HIGHLIGHT STRIP (Bottom Strip)          */}
      {/* ========================================================= */}
      <section className="py-6 sm:py-8 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="col-span-2 md:col-span-1 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                🏬
              </div>
              <div className="text-xs font-black text-slate-900 leading-tight">
                Built for Cyber Cafes & CSC Centers
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-base shadow-xs">
                🖨️
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">All Printers</div>
                <div className="text-[10px] text-slate-500">HP, Canon, Epson</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-base shadow-xs">
                🔌
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">No Wi-Fi Needed</div>
                <div className="text-[10px] text-slate-500">Uses regular USB cable</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-base shadow-xs">
                📑
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">B&W + Color</div>
                <div className="text-[10px] text-slate-500">Duplex & Binding</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-base shadow-xs">
                ⏱️
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">2-Min Setup</div>
                <div className="text-[10px] text-slate-500">Instant QR Standee</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. OLD WHATSAPP NIGHTMARE VS PRINLY 2026 SAAS             */}
      {/* ========================================================= */}
      <section id="features" className="py-16 sm:py-20 bg-slate-50/60 border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3.5 py-1 text-xs font-black text-blue-700 shadow-xs mb-3">
              <span>WHY CYBER CAFES ARE SWITCHING</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-black text-slate-900">
              Stop Fighting With WhatsApp & Pen Drives
            </h2>
            <p className="text-xs sm:text-base text-slate-500 mt-2">
              Transform your front desk into a friction-free, high-speed digital printing counter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Old Way */}
            <div className="rounded-3xl border-2 border-rose-200 bg-white p-6 sm:p-8 shadow-md space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black uppercase tracking-wider">
                <span>❌ The Old WhatsApp Way</span>
              </div>
              <h3 className="font-heading text-lg font-black text-slate-900">
                Slow, Cluttered & Full of Viruses
              </h3>
              <ul className="space-y-3 text-xs text-slate-600 font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold text-sm">✕</span>
                  <span>Every customer asks for your mobile number or scans WhatsApp Web.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold text-sm">✕</span>
                  <span>Shop PC storage fills up with 200 random 50MB PDFs every week.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold text-sm">✕</span>
                  <span>Pen drives corrupt your machine with shortcut viruses.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold text-sm">✕</span>
                  <span>Crowds waiting 15 minutes at counter just to print 2 pages.</span>
                </li>
              </ul>
            </div>

            {/* Prinly Way */}
            <div className="rounded-3xl border-2 border-blue-500 bg-white p-6 sm:p-8 shadow-xl shadow-blue-500/10 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 to-cyan-500" />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black uppercase tracking-wider">
                <span>⚡ The Prinly 2026 SaaS Way</span>
              </div>
              <h3 className="font-heading text-lg font-black text-slate-900">
                10-Second Touchless Spooling
              </h3>
              <ul className="space-y-3 text-xs text-slate-700 font-bold">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black text-sm">✓</span>
                  <span>Customer scans Counter Standee QR — zero phone number sharing.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black text-sm">✓</span>
                  <span>Direct UPI payment lands 100% in your account before print output.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black text-sm">✓</span>
                  <span>No storage mess: files are auto-purged from server and PC after print.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-black text-sm">✓</span>
                  <span>Serve 4x more customers in peak exam hours with zero line bottlenecks!</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. INTERACTIVE SHOPKEEPER PROFIT & TIME CALCULATOR        */}
      {/* ========================================================= */}
      <section id="calculator" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50/60 via-slate-50 to-white p-6 sm:p-12 shadow-xl shadow-blue-500/5 max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black uppercase tracking-wider px-3 py-1 mb-2">
                <span>REVENUE CALCULATOR</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-black text-slate-900">
                How Much More Can Your Cyber Café Earn?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Fast counter turnarounds mean more orders handled per day with zero manual WhatsApp lag.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Sliders (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                    <span>Average Daily Prints:</span>
                    <span className="font-mono text-sm font-black text-blue-600">{dailyPrints} prints / day</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="600"
                    step="10"
                    value={dailyPrints}
                    onChange={(e) => setDailyPrints(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                    <span>30 prints</span>
                    <span>300 prints</span>
                    <span>600+ prints</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                    <span>Average Price Per Page:</span>
                    <span className="font-mono text-sm font-black text-cyan-600">₹{pricePerPage.toFixed(1)} / page</span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="10.0"
                    step="0.5"
                    value={pricePerPage}
                    onChange={(e) => setPricePerPage(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                    <span>₹1.5 (B&W)</span>
                    <span>₹5.0 (Duplex)</span>
                    <span>₹10.0 (Color)</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 space-y-1 shadow-xs">
                  <div className="font-bold text-slate-900">💡 Counter Math:</div>
                  <div>Saving 2.5 minutes per print job = <strong>{hoursSavedMonthly} hours saved every month</strong> from manually typing numbers and searching WhatsApp attachments!</div>
                </div>
              </div>

              {/* Output Metric Cards (5 Cols) */}
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Monthly Print Revenue</div>
                  <div className="text-3xl font-black text-blue-600 mt-1">
                    ₹{monthlyRevenue.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    100% direct to your personal/shop UPI
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Time Saved at Counter</div>
                  <div className="text-3xl font-black text-emerald-600 mt-1">
                    ~{hoursSavedMonthly} hrs / mo
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    More time to handle CSC services, forms & lamination
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. LIVE DESK STANDEE CUSTOMIZER PREVIEW                   */}
      {/* ========================================================= */}
      <section id="standee" className="py-16 sm:py-20 bg-slate-50/60 border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black uppercase tracking-wider px-3 py-1 mb-2">
              <span>PHYSICAL COUNTER PLACARD</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-black text-slate-900">
              Your Custom Desk Standee QR
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Every partner gets an instant print-ready A4 acrylic placard with their shop branding.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
            {/* Customizer Controls (5 Cols) */}
            <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-heading text-sm font-black text-slate-900">
                Preview Your Standee
              </h3>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Your Shop Name:</label>
                <input
                  type="text"
                  value={previewShopName}
                  onChange={(e) => setPreviewShopName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white shadow-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Standee Theme:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPreviewTheme('BLUE')}
                    className={`rounded-xl border p-2 text-xs font-bold transition text-left ${
                      previewTheme === 'BLUE' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    💎 Electric Blue
                  </button>
                  <button
                    onClick={() => setPreviewTheme('OBSIDIAN')}
                    className={`rounded-xl border p-2 text-xs font-bold transition text-left ${
                      previewTheme === 'OBSIDIAN' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    🖤 Obsidian Black
                  </button>
                  <button
                    onClick={() => setPreviewTheme('GOLD')}
                    className={`rounded-xl border p-2 text-xs font-bold transition text-left ${
                      previewTheme === 'GOLD' ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ⚡ Cyber Gold
                  </button>
                  <button
                    onClick={() => setPreviewTheme('EMERALD')}
                    className={`rounded-xl border p-2 text-xs font-bold transition text-left ${
                      previewTheme === 'EMERALD' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    🌿 Emerald Pro
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/printer/register"
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-3 text-xs font-black text-white shadow-md shadow-blue-600/20 hover:opacity-95 transition flex items-center justify-center gap-1.5"
                >
                  <span>Generate Your Free Standee QR →</span>
                </Link>
              </div>
            </div>

            {/* Standee Visual Representation (7 Cols) */}
            <div className="lg:col-span-7 flex justify-center">
              <div className={`relative w-full max-w-sm rounded-[28px] border-4 p-6 text-center shadow-2xl transition-all duration-300 ${
                previewTheme === 'BLUE'
                  ? 'border-blue-500 bg-gradient-to-b from-blue-600 via-blue-700 to-slate-900 text-white'
                  : previewTheme === 'OBSIDIAN'
                  ? 'border-slate-800 bg-slate-950 text-white'
                  : previewTheme === 'GOLD'
                  ? 'border-amber-400 bg-gradient-to-b from-amber-400 via-amber-500 to-yellow-600 text-slate-950'
                  : 'border-emerald-500 bg-gradient-to-b from-emerald-600 via-teal-700 to-slate-900 text-white'
              }`}>
                {/* Brand Header */}
                <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-4">
                  <span className="font-heading text-xs font-black tracking-widest uppercase">PRINLY DESK STANDEE</span>
                  <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded-full">SCAN & PRINT</span>
                </div>

                {/* Shop Title */}
                <h4 className="font-heading text-base font-black truncate px-2 mb-1">
                  {previewShopName}
                </h4>
                <p className="text-[11px] opacity-80 mb-4">
                  Instant Xerox • Color Printouts • Spiral Binding
                </p>

                {/* QR Box */}
                <div className="mx-auto w-40 h-40 bg-white p-3 rounded-2xl shadow-inner flex items-center justify-center relative">
                  <div className="w-full h-full border-2 border-slate-900 rounded-xl p-2 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-2 border-slate-900 rounded p-0.5 flex items-center justify-center">
                        <div className="w-3 h-3 bg-slate-900 rounded-xs" />
                      </div>
                      <div className="w-6 h-6 border-2 border-slate-900 rounded p-0.5 flex items-center justify-center">
                        <div className="w-3 h-3 bg-slate-900 rounded-xs" />
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="text-[9px] font-black uppercase text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        SCAN TO PRINT
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-2 border-slate-900 rounded p-0.5 flex items-center justify-center">
                        <div className="w-3 h-3 bg-slate-900 rounded-xs" />
                      </div>
                      <div className="text-[8px] font-black text-slate-600">2026</div>
                    </div>
                  </div>
                </div>

                {/* Footer instructions */}
                <div className="mt-4 pt-3 border-t border-white/20 text-xs font-black">
                  <div>1. Point Camera at QR &rarr; 2. Pick Document &rarr; 3. Collect Prints!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. PLANS & PRICING SECTION                                */}
      {/* ========================================================= */}
      <section id="pricing" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-black uppercase tracking-wider px-3 py-1 mb-2">
              <span>TRANSPARENT PARTNER TIERS</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-black text-slate-900">
              Simple, Affordable Shopkeeper Plans
            </h2>
            <p className="text-xs sm:text-base text-slate-500 mt-1">
              Start 100% free with zero risk. Upgrade only when your daily print volume explodes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Plan 1: Free Starter */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6 transition hover:shadow-md">
              <div>
                <div className="inline-block rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 mb-3">
                  PIONEER STARTER
                </div>
                <h3 className="font-heading text-xl font-black text-slate-900">Free Forever</h3>
                <div className="mt-2 text-3xl font-black text-slate-900">
                  ₹0 <span className="text-xs text-slate-500 font-semibold">/ month</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Perfect for local cyber cafes testing counter QR printing.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-700 font-semibold">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>1 Counter Desk Standee QR</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Up to 2 Active Printers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>100% Direct P2P Shop UPI</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>0% Platform Commission</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Live Order Chime & Notification</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/printer/register?plan=free"
                className="w-full rounded-xl border-2 border-slate-300 hover:border-blue-600 bg-white hover:bg-blue-50 py-3 text-xs font-black text-slate-800 hover:text-blue-700 transition text-center"
              >
                Start Free Registration →
              </Link>
            </div>

            {/* Plan 2: Business Pro (Popular) */}
            <div className="rounded-3xl border-2 border-blue-500 bg-white p-6 sm:p-8 shadow-xl shadow-blue-500/10 flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 to-cyan-500" />
              <div className="absolute top-4 right-4 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5">
                MOST POPULAR
              </div>

              <div>
                <div className="inline-block rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 mb-3">
                  CYBER PRO HUB
                </div>
                <h3 className="font-heading text-xl font-black text-slate-900">Busy Print Counter</h3>
                <div className="mt-2 text-3xl font-black text-blue-600">
                  ₹499 <span className="text-xs text-slate-500 font-semibold">/ month</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  For university hubs, CSC centers & busy commercial markets.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-700 font-bold">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Everything in Pioneer Free</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Up to 5 High-Speed Printers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Priority Listing on Prinly Student Radar</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>SMS / WhatsApp Order Readiness Alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Custom Watermark & Document Numbering</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/printer/register?plan=pro"
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 py-3 text-xs font-black text-white shadow-md shadow-blue-600/25 transition text-center active:scale-95"
              >
                Get Started with Pro Hub →
              </Link>
            </div>

            {/* Plan 3: Enterprise Fleet */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6 transition hover:shadow-md">
              <div>
                <div className="inline-block rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 mb-3">
                  ENTERPRISE FLEET
                </div>
                <h3 className="font-heading text-xl font-black text-slate-900">Multi-Counter Chain</h3>
                <div className="mt-2 text-3xl font-black text-slate-900">
                  ₹1,499 <span className="text-xs text-slate-500 font-semibold">/ month</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  For large printing presses, multiple machines & branch cafes.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-700 font-semibold">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Unlimited Printers & Standees</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Multi-Operator Counter Logins</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Custom POS Billing & GST Invoices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span>Dedicated Relationship Manager</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/printer/register?plan=enterprise"
                className="w-full rounded-xl border-2 border-slate-300 hover:border-blue-600 bg-white hover:bg-blue-50 py-3 text-xs font-black text-slate-800 hover:text-blue-700 transition text-center"
              >
                Register Enterprise Chain →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. HOW IT WORKS (3 SIMPLE STEPS)                          */}
      {/* ========================================================= */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-slate-50/60 border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-heading text-2xl sm:text-4xl font-black text-slate-900">
              Setup Your Shop in 3 Easy Steps
            </h2>
            <p className="text-xs sm:text-base text-slate-500 mt-1">
              No technical expertise needed. If you know how to operate a printer, you're ready!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs text-center space-y-3">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg shadow-xs">
                1
              </div>
              <h3 className="font-heading text-base font-black text-slate-900">Sign Up & Set Rates</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your cyber cafe name, address, and your standard per-page rates (e.g. ₹2 B&W, ₹10 Color).
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs text-center space-y-3">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-black text-lg shadow-xs">
                2
              </div>
              <h3 className="font-heading text-base font-black text-slate-900">Print Your Desk Standee</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Download your generated A4 Desk Standee QR placard. Print it on your own machine and place it on your front desk.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs text-center space-y-3">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg shadow-xs">
                3
              </div>
              <h3 className="font-heading text-base font-black text-slate-900">Customers Scan & Print!</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Customers walk in, scan the QR with any camera, pay to your UPI, and collect their prints with zero waiting line!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. FREQUENTLY ASKED QUESTIONS (FAQ)                       */}
      {/* ========================================================= */}
      <section id="faq" className="py-16 sm:py-20 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl sm:text-3xl font-black text-slate-900">
              Questions Cyber Cafe Owners Ask
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Everything you need to know about joining the Prinly local print network.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((f, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-heading text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-600 transition"
                >
                  <span>{f.q}</span>
                  <span className="text-base text-blue-600 font-bold ml-2">
                    {openFaq === idx ? '−' : '+'}
                  </span>
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2 bg-white">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 10. FINAL BOTTOM CTA BANNER                               */}
      {/* ========================================================= */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-heading text-3xl sm:text-4xl font-black tracking-tight">
            Ready to Double Your Cyber Café Printing Volume?
          </h2>
          <p className="text-xs sm:text-base text-blue-100 max-w-2xl mx-auto">
            Join hundreds of smart cyber cafes and Xerox shops across India. Zero setup fees, instant standee placard, and direct UPI settlements.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/printer/register"
              className="w-full sm:w-auto rounded-2xl bg-white hover:bg-slate-50 px-8 py-3.5 text-xs sm:text-sm font-black text-blue-700 shadow-xl shadow-blue-900/20 transition active:scale-95"
            >
              Register Your Printing Hub (2 Mins) →
            </Link>
            <Link
              href="/printer/login"
              className="w-full sm:w-auto rounded-2xl border border-white/40 hover:bg-white/10 px-6 py-3.5 text-xs sm:text-sm font-black text-white transition"
            >
              Already Registered? Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 11. FOOTER                                                */}
      {/* ========================================================= */}
      <footer className="py-8 bg-slate-900 text-slate-400 text-center text-xs border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Prinly.in" className="h-6 w-auto brightness-200" />
            <span className="font-bold text-white">Prinly Hub Partner Network</span>
          </div>
          <div>© 2026 Prinly.in • Smart Local Cyber Cafe & Printer Network</div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
            <Link href="/" className="hover:text-white transition">Customer Home</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/privacy-policy" className="hover:text-white transition">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
