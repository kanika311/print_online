import React from 'react';
import { MapPin, Navigation, Store, Bike, Compass } from 'lucide-react';

interface MapVisualizerProps {
  userLocation?: [number, number]; // [lng, lat]
  shopLocation?: [number, number];
  partnerLocation?: [number, number];
  shopName?: string;
  orderStatus?: string;
  deliveryType?: 'SELF_PICKUP' | 'HOME_DELIVERY';
}

export const MapVisualizer: React.FC<MapVisualizerProps> = ({
  userLocation = [77.6245, 12.9352],
  shopLocation = [77.6200, 12.9340],
  partnerLocation = [77.6225, 12.9345],
  shopName = 'Patel Cyber Cafe',
  orderStatus = 'PRINTING',
  deliveryType = 'HOME_DELIVERY',
}) => {
  const isOutForDelivery = orderStatus === 'OUT_FOR_DELIVERY';
  const isReady = orderStatus === 'READY';
  const isCompleted = orderStatus === 'COMPLETED';

  return (
    <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner group">
      {/* Background Map Grid Simulation */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Cyberpunk Map Contour lines SVG */}
      <svg className="absolute inset-0 w-full h-full stroke-slate-800/80 fill-none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 0,60 Q 150,90 300,50 T 600,120" strokeWidth="1.5" />
        <path d="M 50,200 Q 200,160 400,220 T 700,180" strokeWidth="1.5" />
        <path d="M 100,0 Q 140,150 180,300" strokeWidth="1.2" strokeDasharray="4 4" />
        <path d="M 450,0 Q 400,180 480,320" strokeWidth="1.2" strokeDasharray="4 4" />

        {/* Route Line connecting Shop -> Delivery Partner -> Customer */}
        <path
          d="M 120,180 Q 240,140 380,120"
          stroke="#0284c7"
          strokeWidth="3"
          strokeDasharray="6 6"
          className="animate-[dash_2s_linear_infinite]"
        />
      </svg>

      {/* Dynamic Compass / Scale Indicator */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/60 text-[10px] text-slate-300 backdrop-blur-md">
        <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
        <span>Koramangala, Bengaluru (5km Zone)</span>
      </div>

      {/* 1. Shop Marker */}
      <div className="absolute top-[170px] left-[105px] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group/marker cursor-pointer">
        <div className="relative">
          <div className="absolute -inset-2 bg-purple-500/30 rounded-full animate-ping-slow" />
          <div className="w-9 h-9 rounded-xl bg-purple-600 border-2 border-white flex items-center justify-center text-white shadow-lg shadow-purple-600/50">
            <Store className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-1 px-2 py-0.5 rounded-md bg-slate-900/95 border border-purple-500/40 text-[10px] font-semibold text-purple-200 whitespace-nowrap shadow-md">
          {shopName}
        </div>
      </div>

      {/* 2. Customer Destination Marker */}
      <div className="absolute top-[110px] left-[380px] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center cursor-pointer">
        <div className="relative">
          <div className="absolute -inset-2 bg-emerald-500/30 rounded-full animate-ping-slow" />
          <div className="w-9 h-9 rounded-xl bg-emerald-600 border-2 border-white flex items-center justify-center text-white shadow-lg shadow-emerald-600/50">
            <MapPin className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-1 px-2 py-0.5 rounded-md bg-slate-900/95 border border-emerald-500/40 text-[10px] font-semibold text-emerald-200 whitespace-nowrap shadow-md">
          Delivery Address (You)
        </div>
      </div>

      {/* 3. Delivery Partner Courier Marker (Active during Delivery) */}
      {deliveryType === 'HOME_DELIVERY' && (
        <div
          className={`absolute top-[145px] left-[240px] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center transition-all duration-1000 ${
            isOutForDelivery ? 'scale-110' : 'opacity-80'
          }`}
        >
          <div className="relative">
            <div className="absolute -inset-2.5 bg-amber-500/40 rounded-full animate-pulse-fast" />
            <div className="w-8 h-8 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/50">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1 px-2 py-0.5 rounded-md bg-slate-900/95 border border-amber-500/40 text-[10px] font-semibold text-amber-300 whitespace-nowrap shadow-md flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            {isOutForDelivery ? 'Rohan en-route (8 mins)' : 'Rohan assigned (Bike)'}
          </div>
        </div>
      )}

      {/* Bottom Live Geolocation Status Bar */}
      <div className="absolute bottom-3 inset-x-3 z-10 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-300 font-medium">
            {deliveryType === 'SELF_PICKUP'
              ? 'Self Pickup: Visit shop counter when Ready'
              : isOutForDelivery
              ? 'Porter Delivery: Arriving in approx 8 mins'
              : isReady
              ? 'Job Ready: Delivery partner picking up package'
              : 'Print Shop is processing your documents'}
          </span>
        </div>
        <div className="text-[11px] font-mono text-cyan-400 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
          Distance: ~1.4 km
        </div>
      </div>
    </div>
  );
};
