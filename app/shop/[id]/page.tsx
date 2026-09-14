'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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

    setError(null);
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
      setError(null);
      setSubmitting(true);
      const targetId = createdOrder._id || createdOrder.orderNumber;
      const res = await fetch(`/api/orders/${targetId}/fulfillment`, {
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

      router.push(`/order/${targetId}`);
    } catch (e: any) {
      setError(e.message || 'Failed to set fulfillment');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500">
        <p className="text-sm font-semibold">Connecting to Cyber Café systems...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-4">
        <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">Shop Not Found</h2>
        <Link href="/" className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm">
          Return to Nearby Shops
        </Link>
      </div>
    );
  }

  const selectedPrinter = printers.find(
    (p) => (p._id || p.id) === selectedPrinterId
  );

  const stepTitles = [
    'Upload Documents',
    'Configure Specs',
    'Select Machine',
    'Review & Pay',
    'Pickup / Delivery',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar onOpenQRScanner={() => setIsQRScannerOpen(true)} />

      <main className="flex-1 pb-20">
        {/* Shop Details Header Banner */}
        <div className="border-b border-slate-200 bg-white shadow-sm">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 sm:py-5">
            <Link
              href="/"
              className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 mb-2.5 transition"
            >
              &larr; Back to Nearby Hubs
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <h1 className="font-heading text-lg sm:text-2xl font-black text-slate-900">
                    {shop.name}
                  </h1>
                  {shop.isOnline ? (
                    <span className="rounded bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-700 shrink-0">
                      Active Counter
                    </span>
                  ) : (
                    <span className="rounded bg-slate-100 border border-slate-300 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-slate-500 shrink-0">
                      Closed
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                  {shop.address}
                </p>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-xs">
                  <span className="text-amber-600 font-bold">
                    ★ {shop.rating || '4.9'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600 font-medium">
                    Queue: <strong className="text-slate-900">{shop.currentQueueCount || 0} jobs</strong>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-700 font-semibold">
                    Est. Wait: ~{shop.estimatedWaitMinutes || 3} mins
                  </span>
                </div>
              </div>

              {/* Desk QR Preview Card */}
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 shadow-sm self-start sm:self-auto">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-white border border-slate-200 p-0.5 shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                      `${typeof window !== 'undefined' ? window.location.origin : ''}/shop/${shopId}`
                    )}`}
                    alt="Desk QR"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 block">
                    Counter Desk
                  </span>
                  <span className="text-xs font-bold text-slate-800">Shop Standee</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step Progress Stepper */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 sm:py-6">
          {/* Mobile Stepper Indicator */}
          <div className="sm:hidden mb-5 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-900">
                Step {currentStep} of 5: {stepTitles[currentStep - 1]}
              </span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {Math.round((currentStep / 5) * 100)}%
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-2">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
            {/* Quick Step Buttons */}
            <div className="flex justify-between gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => (s <= currentStep || (uploadedFiles.length > 0 && s <= 4)) && setCurrentStep(s as any)}
                  disabled={uploadedFiles.length === 0 && s > 1}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition ${
                    currentStep === s
                      ? 'bg-blue-600 text-white shadow-sm'
                      : s < currentStep
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Stepper Bar */}
          <div className="hidden sm:flex items-center justify-between border-b border-slate-200 pb-4 mb-8 text-xs font-bold gap-2">
            <button
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-1.5 transition whitespace-nowrap ${
                currentStep === 1
                  ? 'text-blue-600'
                  : currentStep > 1
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                currentStep === 1 ? 'bg-blue-600 text-white' : currentStep > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                1
              </span>
              <span>Upload Files</span>
            </button>

            <span className="text-slate-400 font-normal">&rarr;</span>

            <button
              onClick={() => uploadedFiles.length > 0 && setCurrentStep(2)}
              disabled={uploadedFiles.length === 0}
              className={`flex items-center gap-1.5 transition whitespace-nowrap ${
                currentStep === 2
                  ? 'text-blue-600'
                  : currentStep > 2
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                currentStep === 2 ? 'bg-blue-600 text-white' : currentStep > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                2
              </span>
              <span>Print Specs</span>
            </button>

            <span className="text-slate-400 font-normal">&rarr;</span>

            <button
              onClick={() => uploadedFiles.length > 0 && setCurrentStep(3)}
              disabled={uploadedFiles.length === 0}
              className={`flex items-center gap-1.5 transition whitespace-nowrap ${
                currentStep === 3
                  ? 'text-blue-600'
                  : currentStep > 3
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                currentStep === 3 ? 'bg-blue-600 text-white' : currentStep > 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                3
              </span>
              <span>Select Machine</span>
            </button>

            <span className="text-slate-400 font-normal">&rarr;</span>

            <button
              onClick={() => uploadedFiles.length > 0 && setCurrentStep(4)}
              disabled={uploadedFiles.length === 0}
              className={`flex items-center gap-1.5 transition whitespace-nowrap ${
                currentStep === 4
                  ? 'text-blue-600'
                  : currentStep > 4
                  ? 'text-emerald-700'
                  : 'text-slate-400'
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                currentStep === 4 ? 'bg-blue-600 text-white' : currentStep > 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                4
              </span>
              <span>Payment</span>
            </button>

            <span className="text-slate-400 font-normal">&rarr;</span>

            <span className={`flex items-center gap-1.5 whitespace-nowrap ${
              currentStep === 5 ? 'text-blue-600' : 'text-slate-400'
            }`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                currentStep === 5 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                5
              </span>
              <span>Pickup / Delivery</span>
            </span>
          </div>

          {error && (
            <div className="mb-4 sm:mb-6 rounded-xl border border-rose-200 bg-rose-50 p-3 sm:p-3.5 text-xs text-rose-700 font-semibold">
              Notice: {error}
            </div>
          )}

          {/* STEP 1: Upload Documents */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center max-w-md mx-auto mb-2">
                <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900">
                  Step 1: Upload Your Documents
                </h3>
                <p className="text-xs text-slate-500">
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
                <div className="pt-3 sm:pt-4 flex justify-end">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs sm:text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm"
                  >
                    <span>Proceed to Print Settings</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Print Settings */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900">
                    Step 2: Configure Print Options
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    {uploadedFiles.length} file(s) • {totalCalculatedPages} total pages
                  </p>
                </div>

                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Change Files
                </button>
              </div>

              <PrintConfigurator
                totalPages={totalCalculatedPages}
                shopPricingRates={shop.pricingRates}
                onChange={(settings) => setPrintSettings(settings)}
              />

              <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm order-2 sm:order-1"
                >
                  &larr; Back to Files
                </button>

                <button
                  onClick={() => setCurrentStep(3)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs sm:text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm order-1 sm:order-2"
                >
                  <span>Proceed to Select Machine</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Select Printer Machine */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 mb-0.5 sm:mb-1">
                  Step 3: Select Printer Machine
                </h3>
                <p className="text-xs text-slate-500">
                  Choose an available printer at {shop.name} for instant spooling
                </p>
              </div>

              <PrinterSelector
                printers={printers}
                selectedPrinterId={selectedPrinterId}
                onSelectPrinter={(id) => setSelectedPrinterId(id)}
              />

              {/* Customer Contact Details */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 mt-4 sm:mt-6 shadow-sm">
                <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                  Your Contact Information (For Counter Pickup Alerts)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-700 font-semibold mb-1 block">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Aman Sharma"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-semibold mb-1 block">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm order-2 sm:order-1"
                >
                  &larr; Back to Settings
                </button>

                <button
                  onClick={() => setCurrentStep(4)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs sm:text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm order-1 sm:order-2"
                >
                  <span>Proceed to Payment</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Payment Selection */}
          {currentStep === 4 && (
            <div className="space-y-4 sm:space-y-6 max-w-xl mx-auto">
              <div className="text-center mb-1 sm:mb-2">
                <h3 className="font-heading text-lg sm:text-xl font-bold text-slate-900">
                  Step 4: Review & Pay
                </h3>
                <p className="text-xs text-slate-500">
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
                  <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-2 text-xs shadow-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Cyber Café:</span>
                      <span className="font-bold text-slate-900">{shop.name}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Selected Machine:</span>
                      <span className="font-semibold text-blue-700">{selectedPrinter?.name}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Documents:</span>
                      <span className="font-bold text-slate-900">{uploadedFiles.length} file(s) ({totalCalculatedPages} pgs)</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Specs:</span>
                      <span className="text-slate-800 font-medium">
                        {printSettings?.copies} copy • {printSettings?.isColor ? 'Color' : 'B&W'} • {printSettings?.orientation} • {printSettings?.paperSize}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-600">
                      <span>Printing Subtotal:</span>
                      <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>{platformSettings?.platformFeeLabel || 'Platform Convenience Fee'}:</span>
                      <span className={platformFee > 0 ? 'text-amber-800 font-bold' : 'text-emerald-700 font-bold'}>
                        {platformFee > 0 ? `+₹${platformFee.toFixed(2)}` : '₹0.00 (Free)'}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2.5 font-heading text-sm sm:text-base font-black text-slate-900">
                      <span>Total Payable:</span>
                      <span className="text-blue-600">₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Payment Methods */}
              <div className="space-y-3 sm:space-y-4">
                {/* OPTION 1: Direct Shop UPI Payment */}
                <div
                  onClick={() => setPaymentMethod('UPI')}
                  className={`rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 cursor-pointer transition shadow-sm ${
                    paymentMethod === 'UPI'
                      ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="font-heading text-xs font-bold text-slate-900">
                          Pay via Shop UPI QR / UPI App
                        </span>
                        <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-800">
                          Instant
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-500">
                        Google Pay, PhonePe, Paytm, BHIM (Direct to Shop)
                      </p>
                    </div>
                    {paymentMethod === 'UPI' && (
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded shrink-0">
                        Selected
                      </span>
                    )}
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
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200 space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-xl border border-slate-200">
                          {/* QR Code */}
                          <div className="bg-white border border-slate-200 p-2 rounded-lg shrink-0 shadow-sm mx-auto sm:mx-0">
                            <img
                              src={
                                (shop.upiQrUrl && !shop.upiQrUrl.includes('api.qrserver.com'))
                                  ? shop.upiQrUrl
                                  : `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                                      `upi://pay?pa=${shop.upiId || 'apexprint@upi'}&pn=${encodeURIComponent(
                                        shop.name
                                      )}&am=${grandTotal.toFixed(2)}&cu=INR`
                                    )}`
                              }
                              alt="Scan Shop UPI QR"
                              className="h-28 w-28 sm:h-32 sm:w-32 object-contain"
                            />
                          </div>

                          {/* Payment Info & Quick Actions */}
                          <div className="flex-1 text-center sm:text-left space-y-2 w-full">
                            <div className="text-[11px] text-slate-500">
                              Scan with GPay / PhonePe / Paytm to pay:
                              <div className="font-heading text-lg font-black text-blue-600 mt-0.5">
                                ₹{grandTotal.toFixed(2)}
                              </div>
                            </div>

                            {/* UPI ID Copy Box */}
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 sm:py-2 text-xs">
                              <span className="font-mono text-[10px] sm:text-[11px] text-slate-800 truncate mr-2">
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
                                className="rounded-md bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-200 transition shrink-0"
                              >
                                {copiedUpi ? 'Copied' : 'Copy UPI'}
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
                              className="inline-flex items-center justify-center w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm"
                            >
                              <span>Open in UPI App (GPay/PhonePe)</span>
                            </a>
                          </div>
                        </div>

                        {/* UTR Reference Input */}
                        <div>
                          <label className="text-[11px] sm:text-xs font-semibold text-slate-700 mb-1 block">
                            UPI UTR / Reference ID (Optional confirmation)
                          </label>
                          <input
                            type="text"
                            value={upiRefNumber}
                            onChange={(e) => setUpiRefNumber(e.target.value)}
                            placeholder="e.g. 423984102934 or Google Pay transaction ID"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 font-mono outline-none focus:border-blue-600 shadow-sm"
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
                  className={`flex items-center justify-between rounded-xl sm:rounded-2xl border p-3.5 sm:p-4 cursor-pointer transition shadow-sm ${
                    paymentMethod === 'CASH'
                      ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="font-heading text-xs font-bold text-slate-900 block">
                      Cash at Counter
                    </span>
                    <p className="text-[10px] sm:text-[11px] text-slate-500">Pay cash in-person to shopkeeper for counter approval</p>
                  </div>
                  {paymentMethod === 'CASH' && (
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded shrink-0">
                      Selected
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm order-2 sm:order-1"
                >
                  &larr; Back to Printer
                </button>

                <button
                  disabled={submitting}
                  onClick={handleProceedToPayment}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50 order-1 sm:order-2"
                >
                  {submitting ? (
                    <span>Processing Payment...</span>
                  ) : (
                    <>
                      <span>Confirm & Select Fulfillment</span>
                      <span>&rarr;</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Fulfillment Choice (Self Pickup vs Porter Delivery) */}
          {currentStep === 5 && createdOrder && (
            <div className="max-w-xl mx-auto space-y-4 sm:space-y-6">
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
