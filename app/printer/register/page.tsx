'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Printer3D from '@/components/3d/Printer3D';
import QRCode3D from '@/components/3d/QRCode3D';

export default function PrinterRegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // STEP 1: Owner Information
  const [ownerName, setOwnerName] = useState('');
  const [ownerMobile, setOwnerMobile] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  // STEP 2: Business Information
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [city, setCity] = useState('Noida');
  const [area, setArea] = useState('Sector 18');
  const [pincode, setPincode] = useState('201301');
  const [mapsLocation, setMapsLocation] = useState('28.5704, 77.3245 (Sector 18 Metro)');

  // STEP 3: Printer Information
  const [printerName, setPrinterName] = useState('HP LaserJet Pro MFP');
  const [printerModel, setPrinterModel] = useState('M428fdw Digital Workhorse');
  const [printerType, setPrinterType] = useState<'MONOCHROME' | 'COLOR'>('MONOCHROME');
  const [bwSupported, setBwSupported] = useState(true);
  const [colorSupported, setColorSupported] = useState(false);
  const [duplexSupported, setDuplexSupported] = useState(true);
  const [paperSizes, setPaperSizes] = useState<string[]>(['A4', 'Legal']);
  const [bindingAvailable, setBindingAvailable] = useState(true);
  const [numberOfPrinters, setNumberOfPrinters] = useState(2);

  // STEP 4: Pricing
  const [bwPrice, setBwPrice] = useState(2.0);
  const [colorPrice, setColorPrice] = useState(10.0);
  const [duplexPrice, setDuplexPrice] = useState(3.5);
  const [otherServices, setOtherServices] = useState('Spiral Binding ₹35, Corner Staple ₹5');

  // STEP 5: Verification
  const [shopPhotoUploaded, setShopPhotoUploaded] = useState(true);
  const [printerPhotoUploaded, setPrinterPhotoUploaded] = useState(true);
  const [gstOrShopDoc, setGstOrShopDoc] = useState('GSTIN07AAACR1234F1Z9');

  // STEP 6: Created Shop Details
  const [createdData, setCreatedData] = useState<any>(null);

  // 1-Click Fast Fill for Testing
  const handleAutoFill = () => {
    const rnd = Math.floor(100 + Math.random() * 900);
    setOwnerName(`Ramesh Verma ${rnd}`);
    setOwnerMobile(`9811${rnd}234`);
    setOwnerEmail(`ramesh${rnd}@prinlyhub.com`);
    setOwnerPassword('Shop@123');

    setShopName(`Apex Digital Prints #${rnd}`);
    setShopAddress(`Shop G-${rnd}, Commercial Complex, Sector 18`);
    setCity('Noida');
    setArea('Sector 18');
    setPincode('201301');

    setPrinterName('Canon imageRUNNER 2630i');
    setPrinterModel('Canon iR 2630i Color Multifunction');
    setPrinterType('COLOR');
    setColorSupported(true);
    setDuplexSupported(true);
    setBwPrice(2.0);
    setColorPrice(10.0);
    setDuplexPrice(3.5);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (currentStep === 1) {
      if (!ownerName || !ownerMobile || !ownerEmail || !ownerPassword) {
        setError('Please complete all owner information fields.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!shopName || !shopAddress || !city || !pincode) {
        setError('Please enter your shop details and address.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!printerName || !printerModel) {
        setError('Please enter printer details.');
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    } else if (currentStep === 5) {
      handleSubmitOnboarding();
    }
  };

  const handleSubmitOnboarding = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ownerName,
        ownerEmail,
        ownerPhone: ownerMobile,
        password: ownerPassword,
        shopName,
        address: shopAddress,
        city,
        area,
        pincode,
        printerName,
        printerModel,
        printerType: colorSupported ? 'COLOR' : 'MONOCHROME',
        bwPrice,
        colorPrice,
        duplexPrice,
        supportsDuplex: duplexSupported,
        paperSizes,
        bindingAvailability: bindingAvailable,
      };

      const res = await fetch('/api/shops/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register printer shop');
      }

      setCreatedData(data);
      if (data.token) {
        localStorage.setItem('printporter_token', data.token);
        localStorage.setItem('printporter_user', JSON.stringify(data.user));
        document.cookie = `printporter_token=${data.token}; path=/; max-age=604800; SameSite=Lax; ${
          window.location.protocol === 'https:' ? 'Secure;' : ''
        }`;
      }

      setCurrentStep(6);
    } catch (err: any) {
      setError(err.message || 'Onboarding failed');
    } finally {
      setSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Owner' },
    { num: 2, title: 'Shop' },
    { num: 3, title: 'Printers' },
    { num: 4, title: 'Pricing' },
    { num: 5, title: 'Verify' },
    { num: 6, title: 'Launch' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-100 text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="bg-white rounded-xl px-1.5 py-1 flex items-center transition group-hover:scale-105">
            <img
              src="/logo.png"
              alt="Prinly.in"
              className="h-8 w-auto object-contain"
            />
          </div>
          <span className="hidden sm:inline-block text-[11px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            Hub Partner Onboarding
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAutoFill}
            className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 shadow-xs transition active:scale-95 flex items-center gap-1.5"
          >
            <span>⚡</span>
            <span>Auto-Fill Demo Hub</span>
          </button>
          <Link
            href="/login?role=printer_owner"
            className="text-xs text-slate-600 hover:text-blue-700 transition font-bold"
          >
            Already a Partner? Sign In
          </Link>
        </div>
      </header>

      {/* Main Multi-Step Container */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Step Progress Tracker */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-6 right-6 h-1 bg-slate-200 rounded-full z-0" />
            <div
              className="absolute top-4 left-6 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-300 z-0"
              style={{ width: `${((currentStep - 1) / 5) * 88}%` }}
            />

            {stepsList.map((s) => (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition ${
                    currentStep === s.num
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-100'
                      : currentStep > s.num
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-400 border-2 border-slate-200 shadow-xs'
                  }`}
                >
                  {currentStep > s.num ? '✓' : s.num}
                </div>
                <span
                  className={`text-[10px] mt-1.5 font-bold ${
                    currentStep === s.num
                      ? 'text-blue-700 font-extrabold'
                      : currentStep > s.num
                      ? 'text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 1: OWNER INFORMATION                                 */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-blue-500/5">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <span className="text-xs font-black text-blue-600 uppercase tracking-wider">
                Step 1 of 5
              </span>
              <h2 className="font-heading text-xl sm:text-2xl font-black mt-1 text-slate-900">
                Owner Information
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Create your shop manager login credentials
              </p>
            </div>

            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Owner Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white px-3.5 py-2.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 shadow-xs transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Mobile Number (For WhatsApp / SMS alerts) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={ownerMobile}
                    onChange={(e) => setOwnerMobile(e.target.value)}
                    placeholder="9811122334"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white px-3.5 py-2.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 shadow-xs transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="rajesh@cyberprint.com"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white px-3.5 py-2.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 shadow-xs transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Create Shop Dashboard Password *
                </label>
                <input
                  type="password"
                  required
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white px-3.5 py-2.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 shadow-xs transition"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition active:scale-95"
              >
                Continue to Business Information &rarr;
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: BUSINESS INFORMATION                              */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-blue-500/5">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <span className="text-xs font-black text-blue-600 uppercase tracking-wider">
                Step 2 of 5
              </span>
              <h2 className="font-heading text-xl sm:text-2xl font-black mt-1 text-slate-900">
                Business Information
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tell nearby customers where your shop is located
              </p>
            </div>

            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Printing Shop / Cyber Cafe Name *
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Apex Digital Print & Cyber Cafe"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white px-3.5 py-2.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 shadow-xs transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Full Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="Shop 14, Commercial Complex, Sector 18"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white px-3.5 py-2.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 shadow-xs transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white px-3 py-2.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 shadow-xs transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Area / Market *</label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white px-3 py-2.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 shadow-xs transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white px-3 py-2.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 shadow-xs transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Google Maps Location / Landmark (GPS Radar)
                </label>
                <input
                  type="text"
                  value={mapsLocation}
                  onChange={(e) => setMapsLocation(e.target.value)}
                  placeholder="Near Sector 18 Metro Gate 2"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white px-3.5 py-2.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 shadow-xs transition"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="py-3 px-5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition active:scale-95"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition active:scale-95"
                >
                  Continue to Printer Fleet &rarr;
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: PRINTER INFORMATION                               */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-blue-500/5">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <span className="text-xs font-black text-blue-600 uppercase tracking-wider">
                Step 3 of 5
              </span>
              <h2 className="font-heading text-xl sm:text-2xl font-black mt-1 text-slate-900">
                Printer Fleet Details
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure your hardware capabilities
              </p>
            </div>

            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Primary Printer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={printerName}
                    onChange={(e) => setPrinterName(e.target.value)}
                    placeholder="HP LaserJet Pro"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white px-3.5 py-2.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 shadow-xs transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Printer Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={printerModel}
                    onChange={(e) => setPrinterModel(e.target.value)}
                    placeholder="MFP M428fdw / Canon iR"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white px-3.5 py-2.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 shadow-xs transition"
                  />
                </div>
              </div>

              {/* Capabilities checkboxes */}
              <div className="rounded-2xl bg-blue-50/60 border border-blue-200/80 p-4 space-y-3">
                <span className="text-xs font-black text-blue-900 uppercase tracking-wider block">
                  Hardware Capabilities
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={bwSupported}
                      onChange={(e) => setBwSupported(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Black & White</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={colorSupported}
                      onChange={(e) => setColorSupported(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Color Printing</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={duplexSupported}
                      onChange={(e) => setDuplexSupported(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Duplex (Both sides)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={bindingAvailable}
                      onChange={(e) => setBindingAvailable(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Spiral Binding</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Number of Printers at Shop
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={numberOfPrinters}
                    onChange={(e) => setNumberOfPrinters(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white px-3.5 py-2 text-xs text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-600 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Supported Paper Sizes
                  </label>
                  <div className="pt-2 text-xs text-blue-700 font-bold">
                    A4, A3, Legal, Letter
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="py-3 px-5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition active:scale-95"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition active:scale-95"
                >
                  Continue to Pricing &rarr;
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: PRICING CONFIGURATION                             */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-blue-500/5">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <span className="text-xs font-black text-blue-600 uppercase tracking-wider">
                Step 4 of 5
              </span>
              <h2 className="font-heading text-xl sm:text-2xl font-black mt-1 text-slate-900">
                Your Custom Pricing (₹)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Set per-page pricing. Customers pay you directly via your shop UPI QR or cash.
              </p>
            </div>

            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 hover:bg-white hover:border-blue-300 transition shadow-xs">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    B&W Single Side (₹)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={bwPrice}
                    onChange={(e) => setBwPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-blue-700 font-black outline-none focus:border-blue-600 shadow-inner"
                  />
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 hover:bg-white hover:border-blue-300 transition shadow-xs">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    B&W Duplex Both Sides (₹)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={duplexPrice}
                    onChange={(e) => setDuplexPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-blue-700 font-black outline-none focus:border-blue-600 shadow-inner"
                  />
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 hover:bg-white hover:border-blue-300 transition shadow-xs">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Color Single Side (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={colorPrice}
                    onChange={(e) => setColorPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-blue-700 font-black outline-none focus:border-blue-600 shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Additional Services & Binding Rates
                </label>
                <input
                  type="text"
                  value={otherServices}
                  onChange={(e) => setOtherServices(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white px-3.5 py-2.5 text-xs text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-600 shadow-xs transition"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="py-3 px-5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition active:scale-95"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition active:scale-95"
                >
                  Continue to Verification &rarr;
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 5: VERIFICATION                                      */}
        {/* ========================================================= */}
        {currentStep === 5 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-blue-500/5">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <span className="text-xs font-black text-blue-600 uppercase tracking-wider">
                Step 5 of 5
              </span>
              <h2 className="font-heading text-xl sm:text-2xl font-black mt-1 text-slate-900">
                Shop Verification
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Quick verification to activate your Prinly live badge
              </p>
            </div>

            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-5 text-center">
                  <div className="text-3xl mb-1.5">🏪</div>
                  <div className="text-xs font-bold text-slate-800">Shop Front Photo</div>
                  <div className="text-[11px] text-emerald-600 font-black mt-1 bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-200">
                    ✓ Verified
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-5 text-center">
                  <div className="text-3xl mb-1.5">🖨️</div>
                  <div className="text-xs font-bold text-slate-800">Printer Photo</div>
                  <div className="text-[11px] text-emerald-600 font-black mt-1 bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-200">
                    ✓ Verified
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  GST / Trade Certificate / ID Number
                </label>
                <input
                  type="text"
                  value={gstOrShopDoc}
                  onChange={(e) => setGstOrShopDoc(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold outline-none focus:bg-white focus:border-blue-600 shadow-xs transition"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="py-3 px-5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition active:scale-95"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Creating Prinly Hub...' : 'Complete Registration & Launch Hub →'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 6: SUCCESS CELEBRATION                               */}
        {/* ========================================================= */}
        {currentStep === 6 && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xl shadow-blue-500/10">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white text-2xl font-black flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
              ✓
            </div>

            <span className="px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-wider">
              Prinly Partner Active
            </span>

            <h2 className="font-heading text-2xl sm:text-4xl font-black mt-3 text-slate-900">
              Your Prinly Hub is ready!
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
              Complete verification to start receiving live orders. Your counter QR standee and live print queue have been generated.
            </p>

            {/* Hub info card */}
            <div className="my-6 max-w-md mx-auto p-5 rounded-2xl bg-blue-50/60 border border-blue-100 text-left text-xs space-y-2 shadow-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Shop Name:</span>
                <span className="font-bold text-slate-900">{shopName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Owner:</span>
                <span className="font-bold text-slate-900">{ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Shop UPI:</span>
                <span className="font-mono text-blue-700 font-black">
                  {createdData?.shop?.upiId || `${shopName.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`}
                </span>
              </div>
            </div>

            <Link
              href="/printer/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black text-sm shadow-xl shadow-blue-600/25 hover:from-blue-700 hover:to-cyan-700 transition active:scale-95"
            >
              <span>Go to Printer Dashboard</span>
              <span>&rarr;</span>
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/70 py-4 px-4 text-center text-xs text-slate-500 font-medium">
        © 2026 Prinly.in • Smart Local Cyber Cafe & Printer Network
      </footer>
    </div>
  );
}

