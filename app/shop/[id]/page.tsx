'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Printer,
  MapPin,
  Clock,
  Star,
  ChevronLeft,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ArrowRight,
  CreditCard,
  Banknote,
  Bike,
  Store,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import FileUploader, { UploadedFileItem } from '@/components/FileUploader';
import PrintConfigurator, { PrintSettings } from '@/components/PrintConfigurator';
import PrinterSelector from '@/components/PrinterSelector';
import FulfillmentSelector from '@/components/FulfillmentSelector';
import QRScannerModal from '@/components/QRScannerModal';

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.id as string;

  // Step Tracker: 1: Upload, 2: Specs, 3: Printer, 4: Pay, 5: Fulfillment
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const [shop, setShop] = useState<any>(null);
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null);

  // Uploaded files
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [totalCalculatedPages, setTotalCalculatedPages] = useState(1);

  // Print settings
  const [printSettings, setPrintSettings] = useState<PrintSettings | null>(null);

  // Payment choice (Direct Shop UPI QR vs Counter Cash)
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH'>('UPI');
  const [upiRefNumber, setUpiRefNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [platformSettings, setPlatformSettings] = useState<any>(null);

  // Contact info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  // Load shop & printers
  useEffect(() => {
    if (!shopId) return;

    setLoading(true);
    fetch(`/api/shops/${shopId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Shop not found');
        return res.json();
      })
      .then((data) => {
        setShop(data.shop);
        setPrinters(data.printers || []);
        const available = (data.printers || []).find(
          (p: any) => p.status === 'AVAILABLE'
        );
        if (available) {
          setSelectedPrinterId(available._id || available.id);
        } else if (data.printers?.length > 0) {
          setSelectedPrinterId(data.printers[0]._id || data.printers[0].id);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load shop details');
      })
      .finally(() => {
        setLoading(false);
      });

    // Fetch user session
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setCustomerName(data.user.name);
          setCustomerPhone(data.user.phone);
        }
      })
      .catch(() => {});

    // Fetch platform monetization settings
    fetch('/api/admin/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.settings) {
          setPlatformSettings(data.settings);
        }
      })
      .catch(() => {});
  }, [shopId]);

  // Handle Initial Order Submission & Payment
  const handleProceedToPayment = async () => {
    setError(null);

    if (uploadedFiles.length === 0) {
      setError('Please upload at least one document to proceed.');
      return;
    }

    if (!selectedPrinterId) {
      setError('Please select a printer machine.');
      return;
    }

    if (!printSettings) {
      setError('Please configure your print settings.');
      return;
    }

    setSubmitting(true);

    try {
      const primaryFile = uploadedFiles[0];

      const payload = {
        shopId,
        printerId: selectedPrinterId,
        fileUrl: primaryFile.fileUrl,
        fileName: primaryFile.fileName,
        fileType: primaryFile.fileType,
        fileSizeBytes: primaryFile.fileSizeBytes,
        files: uploadedFiles.map((f) => ({
          url: f.fileUrl,
          name: f.fileName,
          type: f.fileType,
          size: f.fileSizeBytes,
          pages: f.estimatedPages,
        })),
        pageCount: totalCalculatedPages || 1,
        pageRange: printSettings.pageRange,
        copies: printSettings.copies,
        isColor: printSettings.isColor,
        isDuplex: printSettings.isDuplex,
        paperSize: printSettings.paperSize,
        orientation: printSettings.orientation,
        binding: printSettings.binding,
        notes: printSettings.notes,
        paymentType: paymentMethod,
        upiRefNumber: paymentMethod === 'UPI' ? (upiRefNumber.trim() || undefined) : undefined,
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || '+91 98765 00000',
        fulfillmentType: 'PICKUP',
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize order');
      }

      setCreatedOrder(data.order);
      // Move to Fulfillment Selection Step
      setCurrentStep(5);
    } catch (err: any) {
      setError(err.message || 'Payment submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Fulfillment Choice (Self Pickup vs Porter Delivery)
  const handleConfirmFulfillment = async (fulfillmentData: {
    type: 'PICKUP' | 'DELIVERY';
    deliveryAddress?: string;
    recipientPhone?: string;
    deliveryFee: number;
  }) => {
    if (!createdOrder) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/orders/${createdOrder._id}/fulfillment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfillmentType: fulfillmentData.type,
          deliveryAddress: fulfillmentData.deliveryAddress,
          recipientPhone: fulfillmentData.recipientPhone,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to update delivery choice');
      }

      // Order fully completed! Redirect to Live Order Tracking Screen
      router.push(`/order/${createdOrder._id}`);
    } catch (e: any) {
      setError(e.message || 'Failed to set fulfillment');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex flex-col items-center justify-center text-slate-400">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-500 border-t-transparent mb-4" />
        <p className="text-sm">Connecting to Cyber Café systems...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="h-12 w-12 text-rose-400 mb-3" />
        <h2 className="font-heading text-xl font-bold text-white mb-2">Shop Not Found</h2>
        <Link href="/" className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white">
          Return to Nearby Shops
        </Link>
      </div>
    );
  }

  const selectedPrinter = printers.find(
    (p) => (p._id || p.id) === selectedPrinterId
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0e17]">
      <Navbar onOpenQRScanner={() => setIsQRScannerOpen(true)} />

      <main className="flex-1 pb-24">
        {/* Shop Details Header Banner */}
        <div className="border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-3 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Nearby Hubs</span>
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-heading text-xl sm:text-2xl font-black text-white">
                    {shop.name}
                  </h1>
                  {shop.isOnline ? (
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      ● Active Counter
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-800 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                      Closed
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span>{shop.address}</span>
                </p>

                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="flex items-center text-amber-400 font-bold">
                    <Star className="h-3 w-3 fill-amber-400 mr-1" />
                    {shop.rating || '4.9'}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300">
                    Queue: <strong>{shop.currentQueueCount || 0} jobs</strong>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-semibold">
                    Est. Wait: ~{shop.estimatedWaitMinutes || 3} mins
                  </span>
                </div>
              </div>

              {/* Desk QR Preview Card */}
              <div className="flex items-center gap-2.5 bg-slate-800/80 border border-white/10 rounded-2xl p-2.5 backdrop-blur-md">
                <div className="h-10 w-10 rounded-xl bg-white p-1 shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                      `${typeof window !== 'undefined' ? window.location.origin : ''}/shop/${shopId}`
                    )}`}
                    alt="Desk QR"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-sky-400 block">
                    Counter Station
                  </span>
                  <span className="text-xs font-bold text-white">Desk QR</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step Progress Stepper Bar */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-8 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-1.5 transition whitespace-nowrap ${
                currentStep === 1
                  ? 'text-sky-400'
                  : currentStep > 1
                  ? 'text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                currentStep === 1 ? 'bg-sky-500 text-white' : currentStep > 1 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                1
              </span>
              <span>Upload Files</span>
            </button>

            <ChevronRight className="h-4 w-4 text-slate-600" />

            <button
              onClick={() => uploadedFiles.length > 0 && setCurrentStep(2)}
              disabled={uploadedFiles.length === 0}
              className={`flex items-center gap-1.5 transition whitespace-nowrap ${
                currentStep === 2
                  ? 'text-sky-400'
                  : currentStep > 2
                  ? 'text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                currentStep === 2 ? 'bg-sky-500 text-white' : currentStep > 2 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                2
              </span>
              <span>Print Specs</span>
            </button>

            <ChevronRight className="h-4 w-4 text-slate-600" />

            <button
              onClick={() => uploadedFiles.length > 0 && setCurrentStep(3)}
              disabled={uploadedFiles.length === 0}
              className={`flex items-center gap-1.5 transition whitespace-nowrap ${
                currentStep === 3
                  ? 'text-sky-400'
                  : currentStep > 3
                  ? 'text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                currentStep === 3 ? 'bg-sky-500 text-white' : currentStep > 3 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                3
              </span>
              <span>Select Machine</span>
            </button>

            <ChevronRight className="h-4 w-4 text-slate-600" />

            <button
              onClick={() => uploadedFiles.length > 0 && setCurrentStep(4)}
              disabled={uploadedFiles.length === 0}
              className={`flex items-center gap-1.5 transition whitespace-nowrap ${
                currentStep === 4
                  ? 'text-sky-400'
                  : currentStep > 4
                  ? 'text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                currentStep === 4 ? 'bg-sky-500 text-white' : currentStep > 4 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                4
              </span>
              <span>Payment</span>
            </button>

            <ChevronRight className="h-4 w-4 text-slate-600" />

            <span className={`flex items-center gap-1.5 whitespace-nowrap ${
              currentStep === 5 ? 'text-sky-400' : 'text-slate-500'
            }`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                currentStep === 5 ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                5
              </span>
              <span>Pickup / Delivery</span>
            </span>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Upload Documents */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto mb-2">
                <h3 className="font-heading text-lg font-bold text-white">
                  Step 1: Upload Your Documents
                </h3>
                <p className="text-xs text-slate-400">
                  Select single or multiple PDF, JPG, JPEG, and PNG files
                </p>
              </div>

              <FileUploader
                onFilesChanged={(newFiles, totalPages) => {
                  setUploadedFiles(newFiles);
                  setTotalCalculatedPages(totalPages);
                }}
              />

              {uploadedFiles.length > 0 && (
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center gap-2 rounded-2xl bg-sky-500 px-6 py-3 text-sm font-extrabold text-white hover:bg-sky-400 transition shadow-lg shadow-sky-500/25"
                  >
                    <span>Proceed to Print Settings</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Print Settings */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-white">
                    Step 2: Configure Print Options
                  </h3>
                  <p className="text-xs text-slate-400">
                    {uploadedFiles.length} file(s) • {totalCalculatedPages} total pages
                  </p>
                </div>

                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-semibold text-sky-400 hover:underline"
                >
                  Change Files
                </button>
              </div>

              <PrintConfigurator
                totalPages={totalCalculatedPages}
                shopPricingRates={shop.pricingRates}
                onChange={(settings) => setPrintSettings(settings)}
              />

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white"
                >
                  ← Back to Files
                </button>

                <button
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-2 rounded-2xl bg-sky-500 px-6 py-3 text-sm font-extrabold text-white hover:bg-sky-400 transition shadow-lg shadow-sky-500/25"
                >
                  <span>Proceed to Select Machine</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Select Printer Machine */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading text-lg font-bold text-white mb-1">
                  Step 3: Select Printer Machine
                </h3>
                <p className="text-xs text-slate-400">
                  Choose an available printer at {shop.name} for instant spooling
                </p>
              </div>

              <PrinterSelector
                printers={printers}
                selectedPrinterId={selectedPrinterId}
                onSelectPrinter={(id) => setSelectedPrinterId(id)}
              />

              {/* Customer Contact Details */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 mt-6">
                <h4 className="font-heading text-xs font-bold text-white mb-3">
                  Your Contact Information (For Counter Pickup Alerts)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-semibold mb-1 block">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Aman Sharma"
                      className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold mb-1 block">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white"
                >
                  ← Back to Settings
                </button>

                <button
                  onClick={() => setCurrentStep(4)}
                  className="flex items-center gap-2 rounded-2xl bg-sky-500 px-6 py-3 text-sm font-extrabold text-white hover:bg-sky-400 transition shadow-lg shadow-sky-500/25"
                >
                  <span>Proceed to Payment</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Payment Selection */}
          {currentStep === 4 && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="text-center mb-2">
                <h3 className="font-heading text-xl font-bold text-white">
                  Step 4: Review & Pay
                </h3>
                <p className="text-xs text-slate-400">
                  Pay directly via Shopkeeper UPI QR Standee or Cash at Counter
                </p>
              </div>

              {/* Order Summary Box */}
              {(() => {
                const subtotal = printSettings?.pricing?.totalPrice || 0;
                let platformFee = 0;
                if (platformSettings?.platformFeeEnabled && Number(platformSettings?.platformFeeAmount) > 0) {
                  if (platformSettings.platformFeeType === 'PERCENT') {
                    platformFee = Math.round(((subtotal * platformSettings.platformFeeAmount) / 100) * 100) / 100;
                  } else {
                    platformFee = Number(platformSettings.platformFeeAmount);
                  }
                }
                const grandTotal = +(subtotal + platformFee).toFixed(2);

                return (
                  <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 space-y-2.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Cyber Café:</span>
                      <span className="font-bold text-white">{shop.name}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Selected Machine:</span>
                      <span className="font-semibold text-sky-400">{selectedPrinter?.name}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Documents:</span>
                      <span className="font-bold text-white">{uploadedFiles.length} file(s) ({totalCalculatedPages} pgs)</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Specs:</span>
                      <span className="text-slate-200">
                        {printSettings?.copies} copy • {printSettings?.isColor ? 'Color' : 'B&W'} • {printSettings?.orientation} • {printSettings?.paperSize}
                      </span>
                    </div>
                    <div className="border-t border-white/5 pt-2 flex justify-between text-slate-300">
                      <span>Printing Subtotal:</span>
                      <span className="font-semibold text-white">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>{platformSettings?.platformFeeLabel || 'Platform Convenience Fee'}:</span>
                      <span className={platformFee > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {platformFee > 0 ? `+₹${platformFee.toFixed(2)}` : '₹0.00 (Launch Offer)'}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-3 font-heading text-base font-black text-white">
                      <span>Total Payable:</span>
                      <span className="text-emerald-400">₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Payment Methods */}
              <div className="space-y-4">
                {/* OPTION 1: Direct Shop UPI Payment */}
                <div
                  onClick={() => setPaymentMethod('UPI')}
                  className={`rounded-2xl border p-4 cursor-pointer transition ${
                    paymentMethod === 'UPI'
                      ? 'border-emerald-400 bg-emerald-950/20 ring-2 ring-emerald-500/30'
                      : 'border-white/10 bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                        <QrCode className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-xs font-bold text-white">
                            Pay via Shop UPI QR / UPI App
                          </span>
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                            Instant Queue
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Google Pay, PhonePe, Paytm, BHIM (Direct to Shop)
                        </p>
                      </div>
                    </div>
                    {paymentMethod === 'UPI' && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
                  </div>

                  {/* Expanded UPI QR Payment Details */}
                  {paymentMethod === 'UPI' && (() => {
                    const subtotal = printSettings?.pricing?.totalPrice || 0;
                    let platformFee = 0;
                    if (platformSettings?.platformFeeEnabled && Number(platformSettings?.platformFeeAmount) > 0) {
                      if (platformSettings.platformFeeType === 'PERCENT') {
                        platformFee = Math.round(((subtotal * platformSettings.platformFeeAmount) / 100) * 100) / 100;
                      } else {
                        platformFee = Number(platformSettings.platformFeeAmount);
                      }
                    }
                    const grandTotal = +(subtotal + platformFee).toFixed(2);

                    return (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-white/5">
                          {/* QR Code */}
                          <div className="bg-white p-2.5 rounded-xl shrink-0 shadow-md">
                            <img
                              src={
                                shop.upiQrUrl ||
                                `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                                  `upi://pay?pa=${shop.upiId || 'apexprint@upi'}&pn=${encodeURIComponent(
                                    shop.name
                                  )}&am=${grandTotal.toFixed(2)}&cu=INR`
                                )}`
                              }
                              alt="Scan Shop UPI QR"
                              className="h-32 w-32 object-contain"
                            />
                          </div>

                          {/* Payment Info & Quick Actions */}
                          <div className="flex-1 text-center sm:text-left space-y-2.5 w-full">
                            <div className="text-[11px] text-slate-400">
                              Scan with GPay / PhonePe / Paytm to pay:
                              <div className="font-heading text-lg font-black text-emerald-400 mt-0.5">
                                ₹{grandTotal.toFixed(2)}
                              </div>
                            </div>

                            {/* UPI ID Copy Box */}
                            <div className="flex items-center justify-between rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-xs">
                              <span className="font-mono text-[11px] text-slate-200 truncate mr-2">
                                {shop.upiId || 'apexprint@upi'}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(shop.upiId || 'apexprint@upi');
                                  setCopiedUpi(true);
                                  setTimeout(() => setCopiedUpi(false), 2000);
                                }}
                                className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/30 transition flex items-center gap-1 shrink-0"
                              >
                                {copiedUpi ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                <span>{copiedUpi ? 'Copied' : 'Copy UPI'}</span>
                              </button>
                            </div>

                            {/* Mobile UPI App Link */}
                            <a
                              href={`upi://pay?pa=${shop.upiId || 'apexprint@upi'}&pn=${encodeURIComponent(
                                shop.name
                              )}&am=${grandTotal.toFixed(2)}&cu=INR`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 py-2 text-xs font-bold text-white hover:brightness-110 transition"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Open in UPI App</span>
                            </a>
                          </div>
                        </div>

                        {/* UTR Reference Input */}
                        <div>
                          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                            UPI UTR / Reference ID (Optional confirmation)
                          </label>
                          <input
                            type="text"
                            value={upiRefNumber}
                            onChange={(e) => setUpiRefNumber(e.target.value)}
                            placeholder="e.g. 423984102934 or Google Pay transaction ID"
                            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white font-mono outline-none focus:border-emerald-500"
                          />
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            Instant verification for shopkeeper counter ledger.
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* OPTION 2: Cash at Counter */}
                <div
                  onClick={() => setPaymentMethod('CASH')}
                  className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition ${
                    paymentMethod === 'CASH'
                      ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-500/30'
                      : 'border-white/10 bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                      <Banknote className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-heading text-xs font-bold text-white">
                        Cash at Counter
                      </span>
                      <p className="text-[11px] text-slate-400">Pay cash in-person to shopkeeper for counter approval</p>
                    </div>
                  </div>
                  {paymentMethod === 'CASH' && <CheckCircle2 className="h-5 w-5 text-amber-400" />}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300"
                >
                  ← Back to Printer
                </button>

                <button
                  disabled={submitting}
                  onClick={handleProceedToPayment}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-sky-500/25 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Processing Payment...</span>
                  ) : (
                    <>
                      <span>Confirm & Select Fulfillment</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Fulfillment Choice (Self Pickup vs Porter Delivery) */}
          {currentStep === 5 && createdOrder && (
            <div className="max-w-xl mx-auto space-y-6">
              <FulfillmentSelector
                shopName={shop.name}
                shopAddress={shop.address}
                orderNumber={createdOrder.orderNumber}
                printingSubtotal={createdOrder.totalPrice}
                onFulfillmentConfirmed={handleConfirmFulfillment}
              />
            </div>
          )}
        </div>
      </main>

      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
      />
    </div>
  );
}
