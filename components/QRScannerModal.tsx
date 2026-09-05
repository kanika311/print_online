'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute right-4 top-4 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition"
        >
          Close
        </button>

        {/* Modal Header */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs tracking-wider">
            QR
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">
              Scan Cyber Café QR Code
            </h2>
            <p className="text-xs text-slate-500">
              Point your camera at the desk standee QR or select a shop below
            </p>
          </div>
        </div>

        {/* Camera Viewport / Scanner Simulation */}
        <div className="relative mb-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-900 aspect-video flex flex-col items-center justify-center p-4">
          {isCameraActive ? (
            <div className="relative h-full w-full flex items-center justify-center">
              <video
                ref={videoRef}
                className="h-full w-full object-cover rounded-lg"
                playsInline
                muted
              />
              {/* Overlay target frame */}
              <div className="absolute h-44 w-44 rounded-xl border-2 border-dashed border-blue-400 flex items-center justify-center">
                <div className="h-0.5 w-full bg-blue-400" />
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800 text-blue-400 font-bold text-xs">
                CAMERA
              </div>
              <p className="text-xs font-bold text-white mb-1">
                Scan Counter QR Code
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mb-3">
                Scan the QR code displayed at the printing shop or cyber café counter to order instantly.
              </p>
              <button
                onClick={startCamera}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm"
              >
                Open Device Camera
              </button>
            </div>
          )}

          {cameraError && (
            <div className="absolute bottom-2 inset-x-2 rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-800">
              Notice: {cameraError}
            </div>
          )}
        </div>

        {/* Quick Demo Shop Selector (For Desktop / Instant Testing) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Quick Select Registered Shop
            </div>
            <span className="text-[11px] text-blue-600 font-semibold">1-Click Test</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {shops.length > 0 ? (
              shops.map((shop) => (
                <button
                  key={shop._id || shop.id}
                  onClick={() => handleSelectShop(shop._id || shop.id)}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 hover:border-blue-500 hover:bg-blue-50/50 transition text-left group"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition">
                      {shop.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate max-w-[260px]">
                      {shop.address}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Online
                    </span>
                    <span className="text-xs font-bold text-blue-600 group-hover:underline">
                      Select Shop &rarr;
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-slate-500">
                Loading nearby registered shops...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
