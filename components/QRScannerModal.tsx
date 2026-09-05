'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Camera,
  QrCode,
  Store,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QRScannerModal({ isOpen, onClose }: QRScannerModalProps) {
  const router = useRouter();
  const [shops, setShops] = useState<any[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch available shops for quick scanner selector
      fetch('/api/shops')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.shops) {
            setShops(data.shops);
          }
        })
        .catch(() => {});
    } else {
      stopCamera();
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else {
        setCameraError('Camera access not supported on this device/browser');
      }
    } catch (err: any) {
      console.warn('Camera permission denied or not available:', err);
      setCameraError('Camera access not granted or unavailable. You can use the Quick Demo Shop Selector below.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleSelectShop = (shopId: string) => {
    stopCamera();
    onClose();
    router.push(`/shop/${shopId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute right-5 top-5 rounded-full bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-500/30">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-white">
              Scan Cyber Café QR Code
            </h2>
            <p className="text-xs text-slate-400">
              Point your camera at the counter QR or select a shop below
            </p>
          </div>
        </div>

        {/* Camera Viewport / Scanner Simulation */}
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-sky-500/30 bg-black/60 aspect-video flex flex-col items-center justify-center p-4">
          {isCameraActive ? (
            <div className="relative h-full w-full flex items-center justify-center">
              <video
                ref={videoRef}
                className="h-full w-full object-cover rounded-xl"
                playsInline
                muted
              />
              {/* Overlay target frame */}
              <div className="absolute h-48 w-48 rounded-2xl border-2 border-dashed border-sky-400 animate-pulse-subtle flex items-center justify-center">
                <div className="h-1 w-full bg-sky-400 shadow-glow-cyan animate-bounce" />
              </div>
            </div>
          ) : (
            <div className="text-center p-6">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/10 text-sky-400">
                <Camera className="h-8 w-8" />
              </div>
              <p className="text-sm font-semibold text-slate-200 mb-1">
                Scan Counter QR Code
              </p>
              <p className="text-xs text-slate-400 max-w-xs mb-4">
                Scan the QR code displayed at the printing shop or cyber café counter to order instantly.
              </p>
              <button
                onClick={startCamera}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white hover:bg-sky-400 transition"
              >
                <Camera className="h-4 w-4" />
                Open Device Camera
              </button>
            </div>
          )}

          {cameraError && (
            <div className="absolute bottom-2 inset-x-2 rounded-lg bg-amber-500/20 border border-amber-500/30 p-2 text-[11px] text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>

        {/* Quick Demo Shop Selector (For Desktop / Instant Testing) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              <span>Instant Test Shops (Select One)</span>
            </div>
            <span className="text-[11px] text-sky-400 font-semibold">1-Click Jump</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {shops.length > 0 ? (
              shops.map((shop) => (
                <button
                  key={shop._id || shop.id}
                  onClick={() => handleSelectShop(shop._id || shop.id)}
                  className="w-full flex items-center justify-between rounded-xl border border-white/5 bg-slate-800/60 p-3 hover:border-sky-500/40 hover:bg-slate-800 transition text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-105 transition">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition">
                        {shop.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                        {shop.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      Online
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-sky-400 transition transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-slate-400">
                Loading nearby registered shops...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
