import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/common/Navbar';
import { PDFUpload } from '../components/user/PDFUpload';
import { PrintConfigurator } from '../components/user/PrintConfigurator';
import { FulfillmentModal } from '../components/user/FulfillmentModal';
import { LiveOrderTracker } from '../components/user/LiveOrderTracker';
import { PartnerDashboard } from '../components/partner/PartnerDashboard';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { PrintSpecs, PriceBreakdown, Order } from '../types';
import { apiFetch } from '../utils/api';
import { Printer, Sparkles, FileText, Clock, ShoppingBag } from 'lucide-react';

export default function Home() {
  const { persona, user } = useAuth();
  const [isMobileSimulator, setIsMobileSimulator] = useState(false);

  // User App State
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    url: string;
    sizeMb: number;
    pageCount: number;
  } | null>({
    name: 'Research_Thesis_Final_Draft.pdf',
    url: '/uploads/sample_report.pdf',
    sizeMb: 3.8,
    pageCount: 22,
  });

  const [specs, setSpecs] = useState<PrintSpecs>({
    paperSize: 'A4',
    printType: 'BW',
    paperType: 'Normal 75gsm',
    copies: 2,
    duplex: true,
    binding: 'Spiral Ring Binding',
    customInstructions: 'Please put a transparent plastic cover on top and hard card on back.',
  });

  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isFulfillmentOpen, setIsFulfillmentOpen] = useState(false);

  // Customer Active Order & History State
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userViewTab, setUserViewTab] = useState<'create' | 'tracking' | 'history'>('create');

  // Recalculate price when specs or pageCount change
  useEffect(() => {
    if (!selectedFile) return;

    setIsCalculating(true);
    const debounce = setTimeout(async () => {
      try {
        const res = await apiFetch<{ success: boolean; breakdown: PriceBreakdown }>(
          '/orders/calculate-price',
          {
            method: 'POST',
            body: JSON.stringify({
              specs,
              pageCount: selectedFile.pageCount,
              deliveryType: 'HOME_DELIVERY',
              distanceKm: 2.5,
            }),
          }
        );
        if (res.success) {
          setPriceBreakdown(res.breakdown);
        }
      } catch (err) {
        console.warn('Calculation error:', err);
      } finally {
        setIsCalculating(false);
      }
    }, 200);

    return () => clearTimeout(debounce);
  }, [specs, selectedFile]);

  // Fetch active customer orders
  const fetchCustomerOrders = async () => {
    try {
      const res = await apiFetch<{ success: boolean; orders: Order[] }>('/orders?userId=usr_customer_101');
      if (res.success) {
        setUserOrders(res.orders);
        if (res.orders.length > 0 && !activeOrder) {
          const ongoing = res.orders.find((o) => o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED');
          if (ongoing) {
            setActiveOrder(ongoing);
          } else {
            setActiveOrder(res.orders[0]);
          }
        }
      }
    } catch (err) {
      console.warn('Fetch customer orders error:', err);
    }
  };

  useEffect(() => {
    fetchCustomerOrders();
  }, [persona]);

  const handleOrderPlaced = (newOrder: Order) => {
    setActiveOrder(newOrder);
    setUserViewTab('tracking');
    fetchCustomerOrders();
  };

  const handleReorder = (order: Order) => {
    setSpecs(order.specs);
    setSelectedFile({
      name: order.fileName,
      url: order.fileUrl,
      sizeMb: order.fileSizeMb,
      pageCount: order.pageCount,
    });
    setUserViewTab('create');
  };

  // Main UI by Persona
  const renderActiveModule = () => {
    if (persona === 'partner') {
      return <PartnerDashboard />;
    }

    if (persona === 'admin') {
      return <AdminDashboard />;
    }

    // Default: Customer User App
    return (
      <div className="space-y-6">
        {/* Customer Sub-Nav: New Job vs Track Order vs History */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setUserViewTab('create')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                userViewTab === 'create'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Configure Print Job</span>
            </button>

            {activeOrder && (
              <button
                onClick={() => setUserViewTab('tracking')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  userViewTab === 'tracking'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Live Order #{activeOrder.orderNumber}</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </button>
            )}

            <button
              onClick={() => setUserViewTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                userViewTab === 'history'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>My Orders ({userOrders.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Create / Configure Print Job */}
        {userViewTab === 'create' && (
          <div className="space-y-8 animate-fade-in">
            {/* Hero Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-900/50 via-slate-900/90 to-cyan-950/40 border border-brand-500/20 shadow-2xl relative overflow-hidden">
              <div className="relative z-10 max-w-2xl space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  <span>On-Demand Prints Delivered in 20 Mins or Pickup In-Store</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
                  High-Speed Printing from Nearest <span className="gradient-text">Cyber Cafes</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  Upload your documents, configure paper type, duplex, and binding with live pricing. We auto-match and dispatch to the nearest verified print shop.
                </p>
              </div>
            </div>

            {/* Document Upload Module */}
            <PDFUpload
              onFileSelected={(fileData) => setSelectedFile(fileData)}
              selectedFile={selectedFile}
            />

            {/* Configuration Wizard & Sticky Live Price Calculator */}
            {selectedFile && (
              <PrintConfigurator
                specs={specs}
                setSpecs={setSpecs}
                priceBreakdown={priceBreakdown}
                isCalculating={isCalculating}
                onProceedToFulfillment={() => setIsFulfillmentOpen(true)}
                pageCount={selectedFile.pageCount}
              />
            )}
          </div>
        )}

        {/* Tab 2: Live Tracking */}
        {userViewTab === 'tracking' && activeOrder && (
          <LiveOrderTracker
            order={activeOrder}
            onOrderUpdated={(updated) => setActiveOrder(updated)}
            onReorder={handleReorder}
          />
        )}

        {/* Tab 3: Order History */}
        {userViewTab === 'history' && (
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl animate-fade-in">
            <h3 className="font-bold text-white text-base font-heading">My Past Print Orders</h3>
            <div className="space-y-3">
              {userOrders.map((o) => (
                <div
                  key={o._id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">#{o.orderNumber}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {o.orderStatus}
                      </span>
                      <span className="text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="font-semibold text-slate-200">{o.fileName}</div>
                    <div className="text-slate-400">
                      {o.pageCount}p • {o.specs.copies} copies • {o.specs.paperSize} • {o.specs.binding}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-emerald-400 text-sm">₹{o.totalPrice}</div>
                      <div className="text-[10px] text-slate-500">{o.paymentMode}</div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveOrder(o);
                        setUserViewTab('tracking');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-brand-600/30 text-brand-300 border border-brand-500/30 hover:bg-brand-600/50 font-semibold"
                    >
                      Track
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fulfillment & Payment Checkout Modal */}
        {selectedFile && priceBreakdown && (
          <FulfillmentModal
            isOpen={isFulfillmentOpen}
            onClose={() => setIsFulfillmentOpen(false)}
            specs={specs}
            priceBreakdown={priceBreakdown}
            fileName={selectedFile.name}
            fileSizeMb={selectedFile.sizeMb}
            pageCount={selectedFile.pageCount}
            onOrderPlaced={handleOrderPlaced}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      {/* Top Glass Navbar */}
      <Navbar
        isMobileSimulator={isMobileSimulator}
        setIsMobileSimulator={setIsMobileSimulator}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Render either inside responsive Mobile Simulator Frame or Desktop Full Canvas */}
        {isMobileSimulator ? (
          <div className="flex justify-center py-4">
            {/* Realistic iPhone / Smartphone Frame Container */}
            <div className="relative w-[390px] h-[820px] bg-slate-950 rounded-[48px] border-8 border-slate-800 shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col ring-1 ring-white/10">
              {/* Dynamic Island Notch */}
              <div className="absolute top-3 inset-x-0 z-50 flex justify-center pointer-events-none">
                <div className="w-28 h-6 bg-black rounded-full flex items-center justify-between px-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500/60 animate-pulse" />
                </div>
              </div>

              {/* Scrollable Mobile Viewport */}
              <div className="flex-1 overflow-y-auto p-4 pt-10 text-xs scroll-smooth">
                {renderActiveModule()}
              </div>

              {/* Home Indicator Bar */}
              <div className="h-5 flex items-center justify-center bg-slate-950">
                <div className="w-32 h-1 bg-slate-600 rounded-full" />
              </div>
            </div>
          </div>
        ) : (
          renderActiveModule()
        )}
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-slate-800/60 py-6 bg-slate-950 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            PrintPorter Platform • Node.js + Express + MongoDB Document Store + Next.js + Socket.io
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>24h Privacy Purge Active</span>
            <span>•</span>
            <span>COD Escrow Ledger</span>
            <span>•</span>
            <span>5km GeoRadius</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
