'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FileUploader, { UploadedFileItem } from '@/components/FileUploader';
import PrintConfigurator, { PrintSettings } from '@/components/PrintConfigurator';
import Printer3D from '@/components/3d/Printer3D';
import QRCode3D from '@/components/3d/QRCode3D';

export default function HubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hubId = params.id as string;

  const [shop, setShop] = useState<any>(null);
  const [printers, setPrinters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload & print order flow states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [printSettings, setPrintSettings] = useState<PrintSettings | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH'>('UPI');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  useEffect(() => {
    if (!hubId) return;

    setLoading(true);
    fetch(`/api/shops/${hubId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Prinly Hub not found');
        return res.json();
      })
      .then((data) => {
        setShop(data.shop);
        setPrinters(data.printers || []);
      })
      .catch((err) => setError(err.message || 'Error loading hub'))
      .finally(() => setLoading(false));

    // Get current user session if available
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.authenticated && d.user) {
          setCustomerName(d.user.name);
          setCustomerPhone(d.user.phone);
        }
      })
      .catch(() => {});
  }, [hubId]);

  const handleStartOrder = () => {
    // Redirects directly to the specialized shop configuration page with hub pre-selected
    router.push(`/shop/${hubId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-blue-600">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-2" />
          <p className="text-xs font-bold text-slate-600">Connecting to Prinly Hub...</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <div className="max-w-md mx-auto my-auto p-6 bg-white rounded-3xl border border-slate-200 shadow-xl text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <h2 className="font-heading text-lg font-black text-slate-900">Hub Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">{error || 'This printing hub ID does not exist.'}</p>
          <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
            Back to Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-blue-600">
            Home
          </Link>
          <span>/</span>
          <Link href="/#nearby-shops" className="hover:text-blue-600">
            Hubs
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">{shop.name}</span>
        </div>

        {/* 1. HUB HEADER CARD */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                  Verified Prinly Partner
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    shop.isOnline
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  ● {shop.isOnline ? 'ONLINE & READY' : 'CLOSED'}
                </span>
              </div>

              <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900">
                {shop.name}
              </h1>

              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {shop.address}
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-semibold text-slate-600">
                <div>
                  <span className="text-amber-500 font-bold">★ {shop.rating || 4.8}</span>{' '}
                  <span className="text-slate-400">({shop.reviewCount || 36} reviews)</span>
                </div>
                <div>
                  <span className="text-slate-400">Queue:</span>{' '}
                  <span className="font-bold text-slate-900">{shop.currentQueueCount || 0} jobs</span>
                </div>
                <div>
                  <span className="text-slate-400">Est. Wait:</span>{' '}
                  <span className="font-bold text-blue-600">~{shop.estimatedWaitMinutes || 3} mins</span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleStartOrder}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/20 transition active:scale-95 text-center"
              >
                Upload Documents Now &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* 2. PRICING & AVAILABLE PRINTERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Transparent Pricing Card */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="font-heading text-sm font-black text-slate-900 mb-4 flex items-center justify-between">
              <span>Transparent Pricing</span>
              <span className="text-[10px] text-emerald-600 font-bold">Direct Shop UPI</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">B&W (Single Side)</span>
                <span className="font-black text-slate-900">₹{shop.pricingRates?.bwSingle || 2.0} / pg</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">B&W (Both Sides Duplex)</span>
                <span className="font-black text-slate-900">₹{shop.pricingRates?.bwDuplex || 3.5} / pg</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Color (Single Side)</span>
                <span className="font-black text-slate-900">₹{shop.pricingRates?.colorSingle || 10.0} / pg</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Color (Both Sides Duplex)</span>
                <span className="font-black text-slate-900">₹{shop.pricingRates?.colorDuplex || 18.0} / pg</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Spiral Binding</span>
                <span className="font-black text-slate-900">₹{shop.pricingRates?.spiralBinding || 35.0}</span>
              </div>
            </div>
          </div>

          {/* Connected Printers */}
          <div className="md:col-span-2 rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-sm font-black text-slate-900">
                Available Printers ({printers.length})
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                Hardware Linked
              </span>
            </div>

            <div className="space-y-3">
              {printers.map((p) => (
                <div
                  key={p._id || p.id}
                  className="rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                      🖨️
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 font-heading">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {p.model} • {p.type === 'COLOR' ? 'Color + B&W' : 'Monochrome High Speed'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        p.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      ● {p.status}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {p.queueCount || 0} in queue
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Scan standee at counter or upload online
              </span>
              <button
                onClick={handleStartOrder}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition"
              >
                Start Printing Here &rarr;
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
