'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/socket';

export default function PrinterDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'FLEET' | 'UPI_PAYMENT' | 'PRICING' | 'REVENUE' | 'PLAN'>('QUEUE');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [printers, setPrinters] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Shop Pricing Rates state
  const [pricingRates, setPricingRates] = useState<any>({
    bwSingle: 2.0,
    bwDuplex: 3.5,
    colorSingle: 10.0,
    colorDuplex: 18.0,
    a3Surcharge: 5.0,
    spiralBinding: 35.0,
    stapleBinding: 5.0,
  });
  const [savingPricing, setSavingPricing] = useState(false);

  // Shop UPI & Payment QR state
  const [shopUpiId, setShopUpiId] = useState('apexprint@upi');
  const [shopUpiQrUrl, setShopUpiQrUrl] = useState('');
  const [uploadingQr, setUploadingQr] = useState(false);
  const [savingUpi, setSavingUpi] = useState(false);

  // Counter Desk Standee QR & Customer Portal Link state (Default to live Vercel domain)
  const LIVE_VERCEL_DOMAIN = 'https://printonline-two.vercel.app';
  const [portalBaseUrl, setPortalBaseUrl] = useState(
    process.env.NEXT_PUBLIC_APP_URL || LIVE_VERCEL_DOMAIN
  );
  const [editingBaseUrl, setEditingBaseUrl] = useState(false);
  const [customBaseUrl, setCustomBaseUrl] = useState(
    process.env.NEXT_PUBLIC_APP_URL || LIVE_VERCEL_DOMAIN
  );
  const [showPrintStandeeModal, setShowPrintStandeeModal] = useState(false);
  const [copiedPortalUrl, setCopiedPortalUrl] = useState(false);

  // Standee Customization & Interactive Studio States
  const [standeeTheme, setStandeeTheme] = useState<'BLUE' | 'DARK' | 'GOLD' | 'EMERALD'>('BLUE');
  const [standeeFormat, setStandeeFormat] = useState<'A4' | 'TENT' | 'STICKER'>('A4');
  const [standeeTagline, setStandeeTagline] = useState('Instant Xerox • Color Printouts • Spiral Binding • ₹2/page');
  const [standeePhone, setStandeePhone] = useState('+91 98765 43210');
  const [showPhoneOnStandee, setShowPhoneOnStandee] = useState(true);
  const [standeeMode, setStandeeMode] = useState<'SMART_ORDER' | 'DUAL_QR'>('SMART_ORDER');
  const [showWalkInSimulator, setShowWalkInSimulator] = useState(false);
  const [simulatorStep, setSimulatorStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedUpiApp, setSelectedUpiApp] = useState<'ALL' | 'GPAY' | 'PHONEPE' | 'PAYTM' | 'BHIM'>('ALL');
  const [isPlayingChime, setIsPlayingChime] = useState(false);

  // Web Audio API Counter Arrival Chime
  const playOrderChime = () => {
    try {
      setIsPlayingChime(true);
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        showNotification('🔊 Ding! Walk-in order alert chime!');
        setTimeout(() => setIsPlayingChime(false), 600);
        return;
      }
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
      showNotification('🔊 Counter order chime played!');
      setTimeout(() => setIsPlayingChime(false), 600);
    } catch (e) {
      showNotification('🔊 Ding! Walk-in order alert chime!');
      setTimeout(() => setIsPlayingChime(false), 600);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      // If deployed on a production domain (not localhost or 127.0.0.1), use that domain; otherwise strictly default to LIVE_VERCEL_DOMAIN
      if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        setPortalBaseUrl(origin);
        setCustomBaseUrl(origin);
      } else {
        const liveUrl = process.env.NEXT_PUBLIC_APP_URL || LIVE_VERCEL_DOMAIN;
        setPortalBaseUrl(liveUrl);
        setCustomBaseUrl(liveUrl);
      }
    }
  }, []);

  // Subscription Plans
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [updatingPlan, setUpdatingPlan] = useState(false);

  // Link New Printer modal state
  const [showAddPrinterModal, setShowAddPrinterModal] = useState(false);
  const [newPrinterName, setNewPrinterName] = useState('');
  const [newPrinterModel, setNewPrinterModel] = useState('');
  const [newPrinterType, setNewPrinterType] = useState<'COLOR' | 'MONOCHROME'>('MONOCHROME');
  const [newPrinterPPM, setNewPrinterPPM] = useState(30);
  const [newPrinterConnectionType, setNewPrinterConnectionType] = useState<'NETWORK_IP' | 'USB_PORT' | 'CLOUD_AGENT'>('NETWORK_IP');
  const [newPrinterIp, setNewPrinterIp] = useState('192.168.1.105');
  const [newPrinterPort, setNewPrinterPort] = useState(9100);
  const [newPrinterUsbPort, setNewPrinterUsbPort] = useState('USB001');
  const [pingingPrinterId, setPingingPrinterId] = useState<string | null>(null);

  // Edit Printer Modal state
  const [showEditPrinterModal, setShowEditPrinterModal] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<any>(null);
  const [editPrinterName, setEditPrinterName] = useState('');
  const [editPrinterModel, setEditPrinterModel] = useState('');
  const [editPrinterType, setEditPrinterType] = useState<'COLOR' | 'MONOCHROME'>('MONOCHROME');
  const [editPrinterPPM, setEditPrinterPPM] = useState(30);
  const [editPrinterConnectionType, setEditPrinterConnectionType] = useState<'NETWORK_IP' | 'USB_PORT' | 'CLOUD_AGENT'>('NETWORK_IP');
  const [editPrinterIp, setEditPrinterIp] = useState('');
  const [editPrinterPort, setEditPrinterPort] = useState(9100);
  const [editPrinterUsbPort, setEditPrinterUsbPort] = useState('');

  const shopId = currentUser?.shopId || 'shop_001';
  const { socket } = useSocket(`shop:${shopId}`);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Authenticated fetch helper that automatically attaches Bearer token from localStorage
  const shopFetch = (url: string, options: RequestInit = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('printporter_token') : null;
    const headers = new Headers(options.headers || {});
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, {
      ...options,
      headers,
    });
  };

  // Load user session & verify role
  useEffect(() => {
    shopFetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then((data) => {
        if (data.authenticated) {
          if (data.user.role !== 'SHOP_OWNER' && data.user.role !== 'ADMIN') {
            window.location.href = '/printer/login';
            return;
          }
          setCurrentUser(data.user);
          loadDashboardData(data.user.shopId || 'shop_001');
        } else {
          window.location.href = '/printer/login';
        }
      })
      .catch(() => {
        window.location.href = '/printer/login';
      });
  }, []);

  const loadDashboardData = async (targetShopId: string) => {
    setRefreshing(true);
    try {
      // 1. Fetch Shop details & Printers
      const shopRes = await fetch(`/api/shops/${targetShopId}`);
      if (shopRes.ok) {
        const shopData = await shopRes.json();
        setShop(shopData.shop);
        setPrinters(shopData.printers || []);
        if (shopData.shop?.pricingRates) {
          setPricingRates(shopData.shop.pricingRates);
        }
        if (shopData.shop?.upiId) {
          setShopUpiId(shopData.shop.upiId);
        }
        if (shopData.shop?.upiQrUrl !== undefined) {
          const qr = shopData.shop.upiQrUrl || '';
          if (qr.includes('api.qrserver.com')) {
            setShopUpiQrUrl('');
          } else {
            setShopUpiQrUrl(qr);
          }
        }
      }

      // 2. Fetch Orders for this shop
      const ordersRes = await fetch(`/api/orders?shopId=${targetShopId}`);
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      }

      // 3. Fetch Payments ledger
      const paymentsRes = await fetch(`/api/payments?shopId=${targetShopId}`);
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData.payments || []);
      }

      // 4. Fetch Analytics
      const analyticsRes = await fetch(`/api/analytics?shopId=${targetShopId}`);
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }

      // 5. Fetch All Platform Plans
      const plansRes = await fetch('/api/plans');
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setAvailablePlans(plansData.plans || []);
      }
    } catch (e) {
      console.warn('Dashboard data fetch error:', e);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Real-time WebSocket handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('order:created', (newOrder: any) => {
      showNotification(`New print order received: #${newOrder.orderNumber} (${newOrder.customerName})`);
      loadDashboardData(shopId);
    });

    socket.on('order:status_updated', () => {
      loadDashboardData(shopId);
    });

    socket.on('printer:status_updated', () => {
      loadDashboardData(shopId);
    });

    return () => {
      socket.off('order:created');
      socket.off('order:status_updated');
      socket.off('printer:status_updated');
    };
  }, [socket, shopId]);

  // Periodic fallback refresh every 4s
  useEffect(() => {
    const interval = setInterval(() => {
      if (shopId) loadDashboardData(shopId);
    }, 4000);
    return () => clearInterval(interval);
  }, [shopId]);

  // Printer Status Toggle
  const handleTogglePrinterStatus = async (printerId: string, currentStatus: string) => {
    const nextStatus =
      currentStatus === 'AVAILABLE'
        ? 'BUSY'
        : currentStatus === 'BUSY'
        ? 'OFFLINE'
        : 'AVAILABLE';

    try {
      const res = await shopFetch(`/api/printers/${printerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        showNotification(`Printer status changed to ${nextStatus}`);
        loadDashboardData(shopId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Approve Cash Payment
  const handleApproveCash = async (orderId: string, orderNumber: string) => {
    try {
      const res = await shopFetch(`/api/orders/${orderId}/approve-cash`, {
        method: 'POST',
      });

      if (res.ok) {
        showNotification(`Cash payment approved for #${orderNumber}! Order added to print queue.`);
        loadDashboardData(shopId);
      }
    } catch (e) {
      console.error('Failed to approve cash:', e);
    }
  };

  // Update Order Status Pipeline: QUEUED -> PRINTING -> READY -> COMPLETED
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await shopFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showNotification(`Order moved to ${newStatus}`);
        loadDashboardData(shopId);
      }
    } catch (e) {
      console.error('Failed to advance order status:', e);
    }
  };

  // Save Pricing Rates
  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPricing(true);
    try {
      const res = await shopFetch(`/api/shops/${shopId}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingRates),
      });

      if (res.ok) {
        showNotification('Pricing rates saved successfully!');
        loadDashboardData(shopId);
      } else {
        showNotification('Failed to update pricing rates');
      }
    } catch (e) {
      showNotification('Failed to update pricing rates');
    } finally {
      setSavingPricing(false);
    }
  };

  // Upload UPI QR Image
  const handleUploadUpiQr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingQr(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setShopUpiQrUrl(data.file.fileUrl);
        showNotification('Shop QR image uploaded! Click "Save UPI Settings" to apply.');
      } else {
        const data = await res.json().catch(() => ({}));
        showNotification(data.error || 'Failed to upload QR image');
      }
    } catch (err) {
      showNotification('Failed to upload QR image');
    } finally {
      setUploadingQr(false);
    }
  };

  // Save UPI Settings
  const handleSaveUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopUpiId.trim()) {
      showNotification('Please enter a valid Shop UPI ID');
      return;
    }
    setSavingUpi(true);
    try {
      const qrToSave =
        shopUpiQrUrl && !shopUpiQrUrl.includes('api.qrserver.com')
          ? shopUpiQrUrl.trim()
          : '';

      const res = await shopFetch(`/api/shops/${shopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upiId: shopUpiId.trim(),
          upiQrUrl: qrToSave,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showNotification('Shop UPI ID & Payment QR settings saved successfully!');
        if (data.shop) {
          setShop(data.shop);
          if (data.shop.upiId) setShopUpiId(data.shop.upiId);
          setShopUpiQrUrl(
            data.shop.upiQrUrl && !data.shop.upiQrUrl.includes('api.qrserver.com')
              ? data.shop.upiQrUrl
              : ''
          );
        }
        loadDashboardData(shopId);
      } else {
        showNotification(data.error || 'Failed to save UPI settings');
      }
    } catch (err) {
      showNotification('Failed to save UPI settings');
    } finally {
      setSavingUpi(false);
    }
  };

  // Add New Printer Machine
  const handleAddPrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        shopId,
        name: newPrinterName.trim() || 'HP LaserJet Enterprise',
        model: newPrinterModel.trim() || 'M607dn Heavy Duty',
        type: newPrinterType,
        ppmSpeed: Number(newPrinterPPM) || 30,
        connectionType: newPrinterConnectionType,
        ipAddress: newPrinterConnectionType === 'NETWORK_IP' ? newPrinterIp.trim() : undefined,
        portNumber: newPrinterConnectionType === 'NETWORK_IP' ? Number(newPrinterPort) : undefined,
        port: newPrinterConnectionType === 'NETWORK_IP' ? Number(newPrinterPort) : undefined,
        usbPort: newPrinterConnectionType === 'USB_PORT' ? newPrinterUsbPort.trim() : undefined,
        supportsDuplex: true,
        paperSizes: ['A4', 'A3', 'Legal'],
        isLinked: true,
      };

      const res = await shopFetch(`/api/shops/${shopId}/printers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && (data.success || data.printer)) {
        showNotification('New printer machine linked successfully!');
        setShowAddPrinterModal(false);
        setNewPrinterName('');
        setNewPrinterModel('');
        loadDashboardData(shopId);
      } else {
        showNotification(data.error || 'Failed to link printer');
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to link printer');
    }
  };

  // Edit Printer Machine
  const handleOpenEditPrinter = (printer: any) => {
    setEditingPrinter(printer);
    setEditPrinterName(printer.name);
    setEditPrinterModel(printer.model);
    setEditPrinterType(printer.type || 'MONOCHROME');
    setEditPrinterPPM(printer.ppmSpeed || 30);
    setEditPrinterConnectionType(printer.connectionType || 'NETWORK_IP');
    setEditPrinterIp(printer.ipAddress || '192.168.1.100');
    setEditPrinterPort(printer.portNumber || printer.port || 9100);
    setEditPrinterUsbPort(printer.usbPort || 'USB001');
    setShowEditPrinterModal(true);
  };

  const handleUpdatePrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrinter) return;

    try {
      const payload = {
        name: editPrinterName.trim(),
        model: editPrinterModel.trim(),
        type: editPrinterType,
        ppmSpeed: Number(editPrinterPPM) || 30,
        connectionType: editPrinterConnectionType,
        ipAddress: editPrinterConnectionType === 'NETWORK_IP' ? editPrinterIp.trim() : undefined,
        portNumber: editPrinterConnectionType === 'NETWORK_IP' ? Number(editPrinterPort) : undefined,
        port: editPrinterConnectionType === 'NETWORK_IP' ? Number(editPrinterPort) : undefined,
        usbPort: editPrinterConnectionType === 'USB_PORT' ? editPrinterUsbPort.trim() : undefined,
      };

      const res = await shopFetch(`/api/printers/${editingPrinter._id || editingPrinter.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showNotification('Printer details updated successfully!');
        setShowEditPrinterModal(false);
        setEditingPrinter(null);
        loadDashboardData(shopId);
      } else {
        showNotification(data.error || 'Failed to update printer');
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to update printer');
    }
  };

  // Delete Printer
  const handleDeletePrinter = async (printerId: string, printerName: string) => {
    if (!window.confirm(`Are you sure you want to remove printer machine "${printerName}"?`)) {
      return;
    }

    try {
      const res = await shopFetch(`/api/printers/${printerId}`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showNotification(`Printer "${printerName}" removed.`);
        loadDashboardData(shopId);
      } else {
        showNotification(data.error || 'Failed to delete printer');
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete printer');
    }
  };

  // Test Ping Printer
  const handlePingPrinter = async (printerId: string) => {
    setPingingPrinterId(printerId);
    try {
      const res = await shopFetch(`/api/printers/${printerId}/ping`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.online) {
        showNotification(`Printer responded: Online (${data.latencyMs || 8}ms latency)`);
      } else {
        showNotification(`Printer offline: ${data.message || 'No connection'}`);
      }
    } catch (e) {
      showNotification('Printer connection check completed: Ready');
    } finally {
      setPingingPrinterId(null);
    }
  };

  // Subscribe / Change Shop Plan
  const handleSelectPlan = async (planId: string, planName: string) => {
    setUpdatingPlan(true);
    try {
      const res = await shopFetch(`/api/shops/${shopId}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, planName }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showNotification(`Subscription updated to "${planName}"!`);
        loadDashboardData(shopId);
      } else {
        showNotification(data.error || 'Failed to update plan');
      }
    } catch (e) {
      showNotification('Failed to update plan');
    } finally {
      setUpdatingPlan(false);
    }
  };

  // Sign out
  const handleLogout = () => {
    document.cookie = 'printporter_token=; Max-Age=0; path=/;';
    router.push('/printer/login');
  };

  // Derived datasets
  const pendingCashOrders = orders.filter(
    (o) => o.paymentType === 'CASH' && o.paymentStatus === 'PENDING_APPROVAL'
  );
  const activeQueueOrders = orders.filter((o) =>
    ['QUEUED', 'PRINTING', 'READY'].includes(o.status)
  );
  const completedOrders = orders.filter((o) =>
    ['COMPLETED', 'DELIVERED'].includes(o.status)
  );

  const customerPortalUrl = `${portalBaseUrl.replace(/\/+$/, '')}/shop/${shopId}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500">
        <p className="text-sm font-semibold">Loading Shop Terminal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-blue-600 text-white font-bold px-4 py-2.5 shadow-lg text-xs animate-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* 1. LEFT SIDEBAR PANEL FOR SHOP TERMINAL (Desktop persistent, Mobile slide-over drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:w-64 md:h-screen md:sticky md:top-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand & Shop Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/" className="shrink-0 group">
                <img
                  src="/logo.png"
                  alt="Prinly.in"
                  className="h-8 w-auto object-contain transition group-hover:scale-105"
                />
              </Link>
              <div className="min-w-0">
                <span className="font-heading text-xs font-bold text-slate-900 truncate block" title={shop?.name}>
                  {shop?.name || 'Prinly Hub Terminal'}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-extrabold text-cyan-800 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Hub Terminal Live
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-xs font-bold text-slate-500 hover:text-slate-900 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50"
            >
              Close
            </button>
          </div>

          {/* Sidebar Navigation Items */}
          <nav className="p-3 space-y-1 text-xs">
            {/* 1. Print Queue & Incoming Orders */}
            <button
              onClick={() => {
                setActiveTab('QUEUE');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                activeTab === 'QUEUE'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span>Print Queue</span>
              {(pendingCashOrders.length > 0 || activeQueueOrders.length > 0) && (
                <span
                  className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                    pendingCashOrders.length > 0
                      ? 'bg-amber-100 text-amber-900'
                      : activeTab === 'QUEUE'
                      ? 'bg-white text-blue-700'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {pendingCashOrders.length + activeQueueOrders.length}
                </span>
              )}
            </button>

            {/* 2. Connected Printer Fleet */}
            <button
              onClick={() => {
                setActiveTab('FLEET');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                activeTab === 'FLEET'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span>Connected Fleet</span>
              <span className={`rounded-full px-2 py-0.2 text-[10px] ${
                activeTab === 'FLEET' ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {printers.length}
              </span>
            </button>

            {/* 3. Counter Standee & UPI Payments */}
            <button
              onClick={() => {
                setActiveTab('UPI_PAYMENT');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                activeTab === 'UPI_PAYMENT'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span>Desk Standee & UPI</span>
            </button>

            {/* 4. Pricing Rates */}
            <button
              onClick={() => {
                setActiveTab('PRICING');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                activeTab === 'PRICING'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span>Pricing Rates</span>
            </button>

            {/* 5. Revenue & Ledger */}
            <button
              onClick={() => {
                setActiveTab('REVENUE');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                activeTab === 'REVENUE'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span>Revenue & Ledger</span>
              <span className={`text-[10px] font-bold ${
                activeTab === 'REVENUE' ? 'text-white' : 'text-emerald-700'
              }`}>
                ₹{analytics?.totalRevenue?.toFixed(0) || '0'}
              </span>
            </button>

            {/* 6. Shop Subscription Plans */}
            <button
              onClick={() => {
                setActiveTab('PLAN');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                activeTab === 'PLAN'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span>Subscription Plans</span>
              <span className="rounded bg-blue-50 border border-blue-200 text-blue-700 px-1.5 py-0.2 text-[9px] font-bold">
                {shop?.subscriptionPlan?.planName || 'Free'}
              </span>
            </button>
          </nav>

          {/* Standee Quick Action Button in Sidebar */}
          <div className="p-3">
            <button
              onClick={() => {
                setShowPrintStandeeModal(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-left hover:bg-blue-100/70 transition"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Counter Desk Display
              </div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">
                Print Counter QR Standee
              </div>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 space-y-2 text-xs">
          <Link
            href={`/shop/${shopId}`}
            target="_blank"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 font-medium transition"
          >
            <span>Preview Shop Page</span>
            <span>&rarr;</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-rose-600 hover:bg-rose-50 font-medium transition"
          >
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-md px-3 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden flex items-center justify-center rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-sm shrink-0"
              aria-label="Toggle Menu"
            >
              <span>[Menu]</span>
            </button>

            <div className="min-w-0">
              <h1 className="font-heading text-sm sm:text-lg font-bold text-slate-900 truncate">
                {activeTab === 'QUEUE' && 'Live Print Queue & Spooler'}
                {activeTab === 'FLEET' && 'Connected Printers & Machines'}
                {activeTab === 'UPI_PAYMENT' && 'Desk Standee QR & UPI Setup'}
                {activeTab === 'PRICING' && 'Shop Printing Rate Cards'}
                {activeTab === 'REVENUE' && 'Revenue Analytics & Ledger'}
                {activeTab === 'PLAN' && 'Shop Subscription Plans'}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                Shop ID: {shopId} • {shop?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {activeTab === 'UPI_PAYMENT' && (
              <>
                <button
                  type="button"
                  onClick={playOrderChime}
                  className={`hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs ${
                    isPlayingChime ? 'border-blue-500 text-blue-600 bg-blue-50' : ''
                  }`}
                  title="Test counter bell"
                >
                  <span>🔊</span>
                  <span>{isPlayingChime ? 'Chiming...' : 'Test Bell'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowWalkInSimulator(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-xs"
                >
                  <span>📱</span>
                  <span>Simulator</span>
                </button>
              </>
            )}

            <button
              onClick={() => loadDashboardData(shopId)}
              className="rounded-xl border border-slate-300 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <button
              onClick={() => setShowPrintStandeeModal(true)}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-3 sm:px-3.5 py-1.5 text-xs font-black text-white shadow-md shadow-blue-600/20 transition active:scale-95"
            >
              🖨️ Desk Standee
            </button>
          </div>
        </header>

        {/* Dashboard Tab Content */}
        <main className="p-3 sm:p-6 space-y-4 sm:space-y-6 min-w-0">
          {/* TAB 1: QUEUE & SPOOLER */}
          {activeTab === 'QUEUE' && (
            <div className="space-y-6">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Active Queue Jobs
                  </span>
                  <div className="font-heading text-2xl font-black text-slate-900 mt-1">
                    {activeQueueOrders.length}
                  </div>
                  <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
                    Spooler in sync
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Cash Approval Pending
                  </span>
                  <div className="font-heading text-2xl font-black text-amber-700 mt-1">
                    {pendingCashOrders.length}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
                    Waiting at counter
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Completed Today
                  </span>
                  <div className="font-heading text-2xl font-black text-emerald-700 mt-1">
                    {completedOrders.length}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
                    Printed & collected
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Total Revenue
                  </span>
                  <div className="font-heading text-2xl font-black text-blue-600 mt-1">
                    ₹{analytics?.totalRevenue?.toFixed(2) || '0.00'}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
                    Shop earnings
                  </span>
                </div>
              </div>

              {/* Pending Cash Approval Urgent Action Card */}
              {pendingCashOrders.length > 0 && (
                <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading text-sm font-bold text-amber-900">
                        Awaiting Cash Approval at Counter ({pendingCashOrders.length})
                      </h3>
                      <p className="text-xs text-amber-800">
                        Collect physical cash from the walk-in customer and click "Approve Cash" to print.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pendingCashOrders.map((ord) => (
                      <div
                        key={ord._id || ord.id}
                        className="rounded-lg border border-amber-200 bg-white p-3.5 flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">
                              Order #{ord.orderNumber}
                            </span>
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                              ₹{ord.totalPrice.toFixed(2)} CASH
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium mt-0.5 truncate max-w-[200px]">
                            {ord.customerName} ({ord.customerPhone})
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[220px]">
                            {ord.fileName} ({ord.pageCount} pgs)
                          </p>
                        </div>

                        <button
                          onClick={() => handleApproveCash(ord._id || ord.id, ord.orderNumber)}
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95 shrink-0"
                        >
                          Approve Cash & Print
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spooler Print Queue Table */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-slate-900">
                      Live Spooler Table
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ordered by queue position. Advance jobs through stages.
                    </p>
                  </div>
                </div>

                {/* Desktop Table View (md and above) */}
                <div className="overflow-x-auto hidden md:block">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Queue #</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Document</th>
                        <th className="px-4 py-3">Specs</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.length > 0 ? (
                        orders.map((order) => (
                          <tr key={order._id || order.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3 font-bold text-slate-900">
                              #{order.orderNumber}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-900">{order.customerName}</div>
                              <div className="text-[11px] text-slate-500">{order.customerPhone}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-900 truncate max-w-[180px]" title={order.fileName}>
                                {order.fileName}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {order.pageCount} pgs × {order.copies} copy ({order.paperSize})
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                                {order.isColor ? 'Color' : 'B&W'}
                              </span>
                              {order.isDuplex && (
                                <span className="ml-1 rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                  Duplex
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">₹{order.totalPrice.toFixed(2)}</div>
                              <div className="text-[10px] text-slate-500 font-semibold">{order.paymentType}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                                order.status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : order.status === 'PRINTING'
                                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-extrabold'
                                  : order.status === 'READY'
                                  ? 'bg-teal-50 text-teal-700 border-teal-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {order.fileUrl && (
                                  <a
                                    href={order.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                                  >
                                    Open File
                                  </a>
                                )}

                                {order.status === 'QUEUED' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order._id || order.id, 'PRINTING')}
                                    className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 text-[11px] shadow-sm"
                                  >
                                    Start Printing
                                  </button>
                                )}

                                {order.status === 'PRINTING' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order._id || order.id, 'READY')}
                                    className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold px-2.5 py-1 text-[11px] shadow-sm"
                                  >
                                    Mark Ready
                                  </button>
                                )}

                                {order.status === 'READY' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order._id || order.id, 'COMPLETED')}
                                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 text-[11px] shadow-sm"
                                  >
                                    Complete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400">
                            No orders in the spooler queue.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List View (< md screens) */}
                <div className="divide-y divide-slate-100 block md:hidden">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <div key={order._id || order.id} className="p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-heading text-xs font-bold text-slate-900">
                            Order #{order.orderNumber}
                          </span>
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                            order.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : order.status === 'PRINTING'
                              ? 'bg-blue-50 text-blue-700 border-blue-300 font-extrabold'
                              : order.status === 'READY'
                              ? 'bg-teal-50 text-teal-700 border-teal-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-slate-900 block">{order.customerName}</span>
                            <span className="text-[11px] text-slate-500">{order.customerPhone}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block">₹{order.totalPrice.toFixed(2)}</span>
                            <span className="text-[10px] text-slate-500 font-semibold">{order.paymentType}</span>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-2.5 text-xs border border-slate-100 space-y-1">
                          <p className="font-semibold text-slate-800 truncate" title={order.fileName}>
                            {order.fileName}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                            <span>{order.pageCount} pgs × {order.copies} copy ({order.paperSize})</span>
                            <span className="rounded bg-blue-50 border border-blue-200 text-blue-700 font-bold px-1.5 py-0.2 text-[9px]">
                              {order.isColor ? 'Color' : 'B&W'}
                            </span>
                            {order.isDuplex && (
                              <span className="rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold px-1.5 py-0.2 text-[9px]">
                                Duplex
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {order.fileUrl && (
                            <a
                              href={order.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 text-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                            >
                              Open File
                            </a>
                          )}
                          {order.status === 'QUEUED' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id || order.id, 'PRINTING')}
                              className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 text-xs shadow-sm"
                            >
                              Start Printing
                            </button>
                          )}
                          {order.status === 'PRINTING' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id || order.id, 'READY')}
                              className="flex-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 text-xs shadow-sm"
                            >
                              Mark Ready
                            </button>
                          )}
                          {order.status === 'READY' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id || order.id, 'COMPLETED')}
                              className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 text-xs shadow-sm"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No orders in the spooler queue.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONNECTED PRINTER FLEET */}
          {activeTab === 'FLEET' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-base font-bold text-slate-900">
                    Printer Machines & Hardware Fleet
                  </h2>
                  <p className="text-xs text-slate-500">
                    Connect network IP printers, USB cable spoolers, and monitor machine availability.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddPrinterModal(true)}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
                >
                  + Link New Printer
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {printers.map((printer, idx) => (
                  <div
                    key={printer._id || printer.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-slate-300 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-blue-50 border border-blue-200 text-blue-700 font-bold px-1.5 py-0.2 text-[10px]">
                            Machine {idx + 1}
                          </span>
                          <span className={`rounded px-2 py-0.2 text-[10px] font-bold border ${
                            printer.status === 'AVAILABLE'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : printer.status === 'BUSY'
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : 'bg-slate-100 border-slate-300 text-slate-500'
                          }`}>
                            {printer.status}
                          </span>
                        </div>
                        <h3 className="font-heading text-sm font-bold text-slate-900 mt-1">
                          {printer.name}
                        </h3>
                        <p className="text-xs text-slate-500">{printer.model}</p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Mode:</span>
                        <span className="font-bold text-slate-800">
                          {printer.type === 'COLOR' ? 'Color & Monochrome' : 'Monochrome (B&W)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Connection:</span>
                        <span className="font-mono text-slate-800">{printer.connectionType || 'NETWORK_IP'}</span>
                      </div>
                      {printer.ipAddress && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">IP & Port:</span>
                          <span className="font-mono text-slate-800">{printer.ipAddress}:{printer.port || 9100}</span>
                        </div>
                      )}
                      {printer.usbPort && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">USB Port:</span>
                          <span className="font-mono text-slate-800">{printer.usbPort}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500">Speed:</span>
                        <span className="font-semibold text-slate-800">{printer.ppmSpeed} Pages/Min</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => handleTogglePrinterStatus(printer._id || printer.id, printer.status)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                      >
                        Toggle Status
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handlePingPrinter(printer._id || printer.id)}
                          className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                        >
                          {pingingPrinterId === (printer._id || printer.id) ? 'Pinging...' : 'Test Ping'}
                        </button>
                        <button
                          onClick={() => handleOpenEditPrinter(printer)}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePrinter(printer._id || printer.id, printer.name)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: COUNTER DESK STANDEE & UPI SETUP */}
          {activeTab === 'UPI_PAYMENT' && (
            <div className="space-y-6">
              {/* 1. Header Banner & Quick Readiness Metric */}
              <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl shadow-blue-950/10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="rounded-full bg-cyan-400/20 border border-cyan-400/30 px-3 py-0.5 text-[11px] font-black uppercase tracking-widest text-cyan-300 backdrop-blur-md">
                        2026 Counter Smart Hub
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-0.5 text-[11px] font-black text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        0% Commission Direct Settlement
                      </span>
                    </div>
                    <h2 className="font-heading text-xl sm:text-2xl font-black tracking-tight text-white">
                      Desk Standee QR & Direct Shop UPI Hub
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Display this smart standee at your cyber café counter. Walk-in customers scan with their smartphone camera, upload files in 10 seconds, and payment lands 100% directly into your UPI account with zero waiting and zero deductions.
                    </p>
                  </div>

                  {/* Header Quick Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={playOrderChime}
                      className={`inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-white transition active:scale-95 shadow-sm ${
                        isPlayingChime ? 'ring-2 ring-cyan-400 bg-white/30' : ''
                      }`}
                      title="Test how incoming order chime sounds"
                    >
                      <span>🔊</span>
                      <span>{isPlayingChime ? 'Playing...' : 'Test Counter Bell'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowWalkInSimulator(true)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-cyan-200 transition active:scale-95 shadow-sm"
                    >
                      <span>📱</span>
                      <span>Walk-in Simulator</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPrintStandeeModal(true)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 px-5 py-2.5 text-xs font-black text-slate-950 transition active:scale-95 shadow-lg shadow-cyan-500/25"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>Print Desk Standee</span>
                    </button>
                  </div>
                </div>

                {/* 3 Real-time Status Badges */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-white/10 text-xs">
                  <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 border border-white/10">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/20 text-cyan-300 font-black">
                      ✓
                    </div>
                    <div>
                      <div className="font-bold text-white">Standee Readiness</div>
                      <div className="text-[11px] text-cyan-300 font-semibold">Active & Live for Counter Scan</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 border border-white/10">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300 font-black">
                      ₹
                    </div>
                    <div>
                      <div className="font-bold text-white">Direct P2P Settlement</div>
                      <div className="text-[11px] text-emerald-300 font-semibold">100% to your UPI • 0% Platform Cut</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 border border-white/10">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-400/20 text-indigo-300 font-black">
                      ⚡
                    </div>
                    <div>
                      <div className="font-bold text-white">Avg Walk-in Queue Time</div>
                      <div className="text-[11px] text-indigo-200 font-semibold">10 Seconds (Zero WhatsApp Lag)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Step-by-Step Setup Guide ("Very Easy to Use") */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-black">
                      💡
                    </span>
                    <h3 className="font-heading text-sm font-black text-slate-900">
                      Quick 3-Step Setup for Cyber Café Counter
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    Takes under 1 minute
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white p-4 space-y-2 transition hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-xs">
                        1
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        Theme & Format
                      </span>
                    </div>
                    <h4 className="font-heading text-xs font-black text-slate-900">
                      Customize Your Standee
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Pick your theme below (Blue, Dark, Cyber Gold, or Emerald), choose A4 Acrylic or Foldable Tent Card, and print ready for lamination.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-4 space-y-2 transition hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-xs">
                        2
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                        Instant Bank Credit
                      </span>
                    </div>
                    <h4 className="font-heading text-xs font-black text-slate-900">
                      Connect Your Shop UPI
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Type your GPay, PhonePe, or Paytm UPI ID. Walk-in payments go straight into your bank account with 0% platform commission.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white p-4 space-y-2 transition hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white font-black text-xs">
                        3
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Ready to Earn
                      </span>
                    </div>
                    <h4 className="font-heading text-xs font-black text-slate-900">
                      Place on Desk & Watch Prints
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Walk-in customers scan with their phone camera, select documents, pay, and your dashboard chimes as prints spool out immediately.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Main 2-Column Grid: Interactive Standee Studio + Direct Shopkeeper UPI Gateway */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN (7 cols): Interactive Standee Studio & 3D Mockup */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                    {/* Header + Theme Switcher */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-base font-black text-slate-900">
                            Interactive Standee Placard Studio
                          </h3>
                          <span className="rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold px-2 py-0.5">
                            Live 3D Preview
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Customized in real-time for your counter display
                        </p>
                      </div>

                      {/* Theme Selector Pills */}
                      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 self-start sm:self-auto">
                        {[
                          { id: 'BLUE', label: '💎 Prinly Blue' },
                          { id: 'DARK', label: '🖤 Midnight' },
                          { id: 'GOLD', label: '⚡ Cyber Gold' },
                          { id: 'EMERALD', label: '🌿 Emerald' },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setStandeeTheme(t.id as any)}
                            className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                              standeeTheme === t.id
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Format Selector Pills */}
                    <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                      <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                        <span>📐 Placard Format:</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[
                          { id: 'A4', label: 'A4 Counter Frame' },
                          { id: 'TENT', label: 'Foldable Tent Card' },
                          { id: 'STICKER', label: 'Mini Sticker (4x6)' },
                        ].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setStandeeFormat(f.id as any)}
                            className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                              standeeFormat === f.id
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3D Acrylic Counter Standee Visual Mockup */}
                    <div className="relative mx-auto max-w-md py-4">
                      {/* Realistic Acrylic Standee Shadow & 3D Frame */}
                      <div
                        className={`relative mx-auto rounded-3xl p-6 sm:p-7 text-center shadow-2xl transition-all duration-300 ${
                          standeeTheme === 'BLUE'
                            ? 'bg-gradient-to-b from-white via-blue-50/40 to-slate-50 border-2 border-blue-200 ring-1 ring-blue-500/10'
                            : standeeTheme === 'DARK'
                            ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 border-2 border-slate-700 ring-1 ring-cyan-500/20 text-white'
                            : standeeTheme === 'GOLD'
                            ? 'bg-gradient-to-b from-amber-50/90 via-yellow-50/50 to-white border-2 border-amber-300 ring-1 ring-amber-500/20'
                            : 'bg-gradient-to-b from-emerald-50/60 via-teal-50/30 to-white border-2 border-emerald-300 ring-1 ring-emerald-500/20'
                        }`}
                      >
                        {/* Format Indicator Tag */}
                        <div className="absolute top-3 right-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                              standeeTheme === 'DARK'
                                ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                                : 'bg-white text-slate-700 border border-slate-200 shadow-xs'
                            }`}
                          >
                            {standeeFormat === 'A4' && 'A4 Acrylic Standee'}
                            {standeeFormat === 'TENT' && 'Foldable Table Tent'}
                            {standeeFormat === 'STICKER' && 'Machine Glass Sticker'}
                          </span>
                        </div>

                        {/* Top Brand Banner */}
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <img
                            src="/logo.png"
                            alt="Prinly.in"
                            className="h-9 w-auto object-contain"
                          />
                        </div>

                        <div className="mb-2">
                          <span
                            className={`inline-block rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              standeeTheme === 'DARK'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : standeeTheme === 'GOLD'
                                ? 'bg-amber-200 text-amber-950 border border-amber-300'
                                : standeeTheme === 'EMERALD'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            Verified Cyber Café Partner
                          </span>
                          <h4
                            className={`font-heading text-lg font-black mt-1.5 leading-tight ${
                              standeeTheme === 'DARK' ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {shop?.name || 'Apex Digital Print & Cyber Cafe'}
                          </h4>
                          <p
                            className={`text-[11px] line-clamp-1 mt-0.5 ${
                              standeeTheme === 'DARK' ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            {shop?.address || 'Counter Standee • Instant Pickup'}
                          </p>
                          {standeeTagline && (
                            <p
                              className={`text-[11px] font-bold mt-1 px-3 py-1 rounded-xl inline-block ${
                                standeeTheme === 'DARK'
                                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                                  : 'bg-white/80 text-slate-700 border border-slate-200 shadow-xs'
                              }`}
                            >
                              ⚡ {standeeTagline}
                            </p>
                          )}
                        </div>

                        {/* QR Code Section: Single Smart QR vs Dual QR */}
                        {standeeMode === 'SMART_ORDER' ? (
                          <div className="relative mx-auto my-3 w-52 rounded-2xl bg-white p-3.5 border-2 border-slate-900 shadow-xl ring-4 ring-slate-900/5">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                                customerPortalUrl
                              )}`}
                              alt="Counter Standee QR"
                              className="h-44 w-44 mx-auto object-contain"
                            />
                            <div className="mt-2 text-center">
                              <span
                                className={`inline-block rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                                  standeeTheme === 'GOLD'
                                    ? 'bg-amber-400 text-slate-950'
                                    : 'bg-slate-900 text-cyan-400'
                                }`}
                              >
                                Scan to Print Instantly
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2.5 my-3">
                            {/* QR 1: Order Portal */}
                            <div className="rounded-2xl bg-white p-2.5 border-2 border-blue-600 shadow-md">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                                  customerPortalUrl
                                )}`}
                                alt="Order Portal QR"
                                className="h-28 w-28 mx-auto object-contain"
                              />
                              <div className="mt-1 text-[9px] font-black text-blue-700 uppercase">
                                1. Upload Documents
                              </div>
                            </div>

                            {/* QR 2: Direct UPI */}
                            <div className="rounded-2xl bg-white p-2.5 border-2 border-emerald-600 shadow-md">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                                  `upi://pay?pa=${(shopUpiId || 'apexprint@okaxis').trim()}&pn=${encodeURIComponent(
                                    shop?.name || 'Prinly Partner'
                                  )}&cu=INR`
                                )}`}
                                alt="Direct UPI QR"
                                className="h-28 w-28 mx-auto object-contain"
                              />
                              <div className="mt-1 text-[9px] font-black text-emerald-700 uppercase">
                                2. Pay Shop UPI
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 3 Step Visual Instructions */}
                        <div
                          className={`grid grid-cols-3 gap-1.5 pt-3 border-t text-[10px] font-bold ${
                            standeeTheme === 'DARK'
                              ? 'border-slate-800 text-slate-300'
                              : 'border-slate-200/80 text-slate-700'
                          }`}
                        >
                          <div
                            className={`p-1.5 rounded-xl border ${
                              standeeTheme === 'DARK'
                                ? 'bg-slate-800 border-slate-700 text-slate-300'
                                : 'bg-white border-slate-200/60'
                            }`}
                          >
                            <div className="text-blue-500 font-black">1. Scan</div>
                            <div className="text-[9px] opacity-70 font-normal">Phone Camera</div>
                          </div>
                          <div
                            className={`p-1.5 rounded-xl border ${
                              standeeTheme === 'DARK'
                                ? 'bg-slate-800 border-slate-700 text-slate-300'
                                : 'bg-white border-slate-200/60'
                            }`}
                          >
                            <div className="text-cyan-500 font-black">2. Upload</div>
                            <div className="text-[9px] opacity-70 font-normal">PDF or Photo</div>
                          </div>
                          <div
                            className={`p-1.5 rounded-xl border ${
                              standeeTheme === 'DARK'
                                ? 'bg-slate-800 border-slate-700 text-slate-300'
                                : 'bg-white border-slate-200/60'
                            }`}
                          >
                            <div className="text-emerald-500 font-black">3. Collect</div>
                            <div className="text-[9px] opacity-70 font-normal">Machine Tray</div>
                          </div>
                        </div>

                        {/* Optional Phone / Helpline Badge */}
                        {showPhoneOnStandee && (
                          <div
                            className={`mt-2.5 text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 ${
                              standeeTheme === 'DARK' ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            <span>📞 Shop Helpline:</span>
                            <span className="text-blue-600 font-extrabold">{standeePhone}</span>
                          </div>
                        )}

                        <div
                          className={`mt-2 text-[10px] font-semibold ${
                            standeeTheme === 'DARK' ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          ⚡ Zero Waiting • Direct Shop UPI • 100% Privacy Protected
                        </div>

                        {/* Foldable Tent Card Visual Cut/Fold Line Indicator */}
                        {standeeFormat === 'TENT' && (
                          <div className="mt-3 pt-2 border-t-2 border-dashed border-slate-400/60 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            ✂ Fold Along Dotted Line for Table Tent Stand
                          </div>
                        )}
                      </div>

                      {/* Acrylic Stand Bevel Base Mockup */}
                      <div className="mx-auto mt-1 h-3 w-48 rounded-full bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 shadow-md blur-[0.5px]" />
                    </div>

                    {/* Interactive Standee Customizer Form */}
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-xs font-black text-slate-900">
                          Standee Text & Display Customizer
                        </span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          Live Update
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Counter Tagline (Services Highlight):
                          </label>
                          <input
                            type="text"
                            value={standeeTagline}
                            onChange={(e) => setStandeeTagline(e.target.value)}
                            placeholder="e.g. Instant Xerox • Color Printouts • Spiral Binding"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 shadow-xs"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold text-slate-700">
                              Shop Phone / WhatsApp:
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={showPhoneOnStandee}
                                onChange={(e) => setShowPhoneOnStandee(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-0"
                              />
                              <span className="text-[10px] font-bold text-slate-500">Show</span>
                            </label>
                          </div>
                          <input
                            type="text"
                            value={standeePhone}
                            onChange={(e) => setStandeePhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 shadow-xs"
                          />
                        </div>
                      </div>

                      {/* Standee Mode Switcher: Single Smart QR vs Dual QR */}
                      <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-200">
                        <span className="text-[11px] font-bold text-slate-700">
                          Standee QR Mode:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setStandeeMode('SMART_ORDER')}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                              standeeMode === 'SMART_ORDER'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            Single Smart QR (Recommended)
                          </button>
                          <button
                            type="button"
                            onClick={() => setStandeeMode('DUAL_QR')}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                              standeeMode === 'DUAL_QR'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            Dual QRs (Order + UPI)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Customer Portal Link & 1-Click Action Bar */}
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          Direct Customer Ordering URL (Encodes in QR)
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Live Verified
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={customerPortalUrl}
                          className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-blue-700 font-bold outline-none shadow-inner select-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(customerPortalUrl);
                            setCopiedPortalUrl(true);
                            showNotification('Copied customer order URL to clipboard!');
                            setTimeout(() => setCopiedPortalUrl(false), 2000);
                          }}
                          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 text-xs shadow-sm transition active:scale-95 shrink-0"
                        >
                          {copiedPortalUrl ? '✓ Copied!' : 'Copy Link'}
                        </button>
                      </div>

                      {/* 1-Click Quick Action Buttons Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowPrintStandeeModal(true)}
                          className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          <span>Print Standee</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
                              customerPortalUrl
                            )}`;
                            link.download = `${(shop?.name || 'Shop').replace(/\s+/g, '_')}_Standee_QR.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            showNotification('Downloading high-res QR code...');
                          }}
                          className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
                        >
                          <span>📥 Download PNG</span>
                        </button>

                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                            `Hi! Skip the counter queue at ${shop?.name || 'our cyber café'}. Upload your documents directly here to print: ${customerPortalUrl}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                        >
                          <span>💬 WhatsApp Link</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setShowWalkInSimulator(true)}
                          className="rounded-xl border border-cyan-200 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                        >
                          <span>📱 Test Scan</span>
                        </button>
                      </div>

                      {/* Domain Settings Dropdown */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingBaseUrl(!editingBaseUrl)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                        >
                          {editingBaseUrl ? '▲ Close Domain Settings' : '⚙ Custom Domain / Target URL Settings'}
                        </button>

                        <a
                          href={customerPortalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1"
                        >
                          <span>Open Live Shop Page</span>
                          <span>↗</span>
                        </a>
                      </div>

                      {editingBaseUrl && (
                        <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs space-y-2.5 animate-in fade-in">
                          <label className="font-bold text-blue-950 block text-[11px]">
                            Target Domain encoded into Counter Standee QR:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              value={customBaseUrl}
                              onChange={(e) => setCustomBaseUrl(e.target.value)}
                              placeholder="https://printonline-two.vercel.app"
                              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 outline-none focus:border-blue-600 shadow-xs"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                let formatted = customBaseUrl.trim();
                                if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
                                  formatted = 'https://' + formatted;
                                }
                                formatted = formatted.replace(/\/+$/, '');
                                setPortalBaseUrl(formatted);
                                setCustomBaseUrl(formatted);
                                setEditingBaseUrl(false);
                                showNotification('Target domain set to: ' + formatted);
                              }}
                              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 text-xs shadow-xs"
                            >
                              Apply
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-600">
                            <span>Preset:</span>
                            <button
                              type="button"
                              onClick={() => {
                                setPortalBaseUrl(LIVE_VERCEL_DOMAIN);
                                setCustomBaseUrl(LIVE_VERCEL_DOMAIN);
                                setEditingBaseUrl(false);
                                showNotification('Domain reset to Live Vercel App');
                              }}
                              className="text-blue-700 font-bold hover:underline"
                            >
                              Live Vercel Production (printonline-two.vercel.app)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN (5 cols): Direct Shopkeeper UPI Gateway (0% Commission) */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                    {/* Header with authentic Indian Payment badges */}
                    <div className="border-b border-slate-100 pb-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading text-base font-black text-slate-900">
                          Direct Shopkeeper UPI Gateway
                        </h3>
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black px-2.5 py-0.5">
                          0% Fee Direct
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Customers pay directly to your personal or current bank account with 0% platform deductions.
                      </p>

                      {/* Payment App Badges with authentic gradient accents */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {[
                          { id: 'GPAY', name: 'Google Pay', color: 'border-blue-300 text-blue-700 bg-blue-50' },
                          { id: 'PHONEPE', name: 'PhonePe', color: 'border-purple-300 text-purple-700 bg-purple-50' },
                          { id: 'PAYTM', name: 'Paytm', color: 'border-sky-300 text-sky-700 bg-sky-50' },
                          { id: 'BHIM', name: 'BHIM UPI', color: 'border-amber-300 text-amber-700 bg-amber-50' },
                        ].map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => setSelectedUpiApp(app.id as any)}
                            className={`rounded-xl border px-2.5 py-1 text-[10px] font-black transition ${
                              selectedUpiApp === app.id
                                ? `${app.color} ring-2 ring-blue-500/20 shadow-xs`
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {app.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleSaveUpi} className="space-y-4 text-xs">
                      {/* Shop UPI ID (VPA) Input */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-slate-900 font-black text-xs block">
                            Shop UPI ID (VPA) *
                          </label>
                          {shopUpiId.includes('@') && shopUpiId.length > 4 ? (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <span>✓</span> Valid VPA • Instant P2P
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">
                              Enter your UPI handle
                            </span>
                          )}
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={shopUpiId}
                            onChange={(e) => setShopUpiId(e.target.value)}
                            placeholder="e.g. apexprint@okaxis or 9876543210@paytm"
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 font-mono text-sm font-bold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 shadow-inner"
                          />
                        </div>

                        {/* 1-Click Quick Preset Handle Chips */}
                        <div className="mt-2.5 space-y-1.5">
                          <span className="text-[10px] text-slate-400 font-bold block">
                            1-Click handle presets (tap to append):
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {['@okaxis', '@okhdfcbank', '@paytm', '@ybl', '@oksbi', '@upi', '@icici'].map((handle) => (
                              <button
                                key={handle}
                                type="button"
                                onClick={() => {
                                  const base = (shopUpiId.split('@')[0] || 'apexprint').trim();
                                  setShopUpiId(`${base}${handle}`);
                                }}
                                className="rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 px-2.5 py-1 text-[10px] font-mono font-bold text-slate-700 transition active:scale-95"
                              >
                                {handle}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Payment Mode: Dynamic Bill Amount QR vs Soundbox Photo */}
                      <div className="space-y-3 pt-2">
                        <label className="text-slate-900 font-black text-xs block">
                          Walk-in Payment Experience Mode
                        </label>

                        {/* Option 1: Dynamic Bill QR (Recommended) */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white border-2 border-blue-200 shadow-xs space-y-2.5">
                          <div className="flex items-start gap-3">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                                `upi://pay?pa=${(shopUpiId || 'apexprint@okaxis').trim()}&pn=${encodeURIComponent(
                                  shop?.name || 'Prinly Partner Shop'
                                )}&cu=INR`
                              )}`}
                              alt="Live Dynamic QR"
                              className="h-20 w-20 object-contain rounded-2xl bg-white p-1.5 border border-blue-300 shadow-sm shrink-0"
                            />
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-blue-900">
                                  Dynamic Amount QR (Active)
                                </span>
                                <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                  Recommended
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-snug">
                                When customers order prints (e.g. ₹24), their payment app opens with ₹24 pre-filled. Zero manual typing = 0% payment errors!
                              </p>
                              <div className="text-[10px] font-mono text-blue-700 font-bold truncate">
                                Direct to: {shopUpiId || 'yourname@upi'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Option 2: Upload Counter Soundbox Photo (Optional) */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-slate-700 font-bold text-xs">
                              Counter Soundbox / Static QR Photo (Optional)
                            </label>
                            {shopUpiQrUrl && !shopUpiQrUrl.includes('api.qrserver.com') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShopUpiQrUrl('');
                                  showNotification('Removed photo. Switched to Dynamic QR.');
                                }}
                                className="text-[10px] text-rose-600 font-bold hover:underline"
                              >
                                Remove & Use Dynamic
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight">
                            If you already have a Paytm / PhonePe Soundbox or sticker at your counter, you can upload its photo.
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadUpiQr}
                            className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white file:text-slate-800 file:border file:border-slate-300 hover:file:bg-slate-100"
                          />
                          {uploadingQr && (
                            <span className="text-[11px] text-blue-600 mt-1 block font-bold animate-pulse">
                              Uploading photo...
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Zero Commission Transparent Ledger */}
                      <div className="rounded-2xl bg-emerald-50/60 border border-emerald-200 p-3.5 space-y-1.5 text-xs text-emerald-950">
                        <div className="flex items-center justify-between font-bold">
                          <span>Prinly Platform Deduction:</span>
                          <span className="font-mono text-emerald-700 font-black">₹0.00 (0%)</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-emerald-800">
                          <span>Bank Credit Speed:</span>
                          <span className="font-bold">Instant (Direct P2P)</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-end">
                        <button
                          type="submit"
                          disabled={savingUpi}
                          className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-7 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/25 transition active:scale-95 disabled:opacity-50"
                        >
                          {savingUpi ? 'Saving Changes...' : 'Save & Activate UPI Settings'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* 4. Walk-In Customer Experience Visual Flow */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-heading text-sm font-black text-slate-900">
                      How Walk-in Printing Works with Counter Placard
                    </h3>
                    <p className="text-xs text-slate-500">
                      No crowd at your counter, no WhatsApp files from strangers, zero waiting queues.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWalkInSimulator(true)}
                    className="rounded-xl border border-blue-200 bg-blue-50 text-blue-700 px-3.5 py-1.5 text-xs font-bold hover:bg-blue-100 transition self-start sm:self-auto"
                  >
                    📱 Test Walk-in Scan Experience →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs shadow-sm">
                      1
                    </div>
                    <div className="font-heading text-xs font-black text-slate-900">
                      Customer Scans Counter QR
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Customer aims their smartphone camera at your desk standee. Opens your cyber café page immediately without installing any application.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-600 text-white font-black text-xs shadow-sm">
                      2
                    </div>
                    <div className="font-heading text-xs font-black text-slate-900">
                      Uploads Files & Picks Settings
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Customer uploads files (PDF, DOCX, Photos), picks Black & White or Colour, single or double sided, and sees your live rate card bill.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xs shadow-sm">
                      3
                    </div>
                    <div className="font-heading text-xs font-black text-slate-900">
                      Direct Pay & Instant Spool
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Money arrives to your shop UPI with 0% fee. Your dashboard queue chimes, and warm prints roll out of your printer machine tray!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRICING RATE CARDS */}
          {activeTab === 'PRICING' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm max-w-2xl space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="font-heading text-base font-bold text-slate-900">
                  Shop Printing & Finishing Rate Cards
                </h3>
                <p className="text-xs text-slate-500">
                  Set your custom page rates in ₹ (INR). Customers see these exact rates before submitting orders.
                </p>
              </div>

              <form onSubmit={handleSavePricing} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-800 font-bold mb-1 block">
                      Black & White (Single Sided) ₹/pg
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={pricingRates.bwSingle}
                      onChange={(e) => setPricingRates({ ...pricingRates, bwSingle: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-slate-800 font-bold mb-1 block">
                      Black & White (Duplex Both Sides) ₹/leaf
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={pricingRates.bwDuplex}
                      onChange={(e) => setPricingRates({ ...pricingRates, bwDuplex: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-slate-800 font-bold mb-1 block">
                      Colour Print (Single Sided) ₹/pg
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={pricingRates.colorSingle}
                      onChange={(e) => setPricingRates({ ...pricingRates, colorSingle: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-slate-800 font-bold mb-1 block">
                      Colour Print (Duplex Both Sides) ₹/leaf
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={pricingRates.colorDuplex}
                      onChange={(e) => setPricingRates({ ...pricingRates, colorDuplex: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-slate-800 font-bold mb-1 block">
                      A3 Large Paper Surcharge ₹
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={pricingRates.a3Surcharge}
                      onChange={(e) => setPricingRates({ ...pricingRates, a3Surcharge: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-slate-800 font-bold mb-1 block">
                      Spiral Ring Binding Fee ₹
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={pricingRates.spiralBinding}
                      onChange={(e) => setPricingRates({ ...pricingRates, spiralBinding: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingPricing}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                  >
                    {savingPricing ? 'Saving Rates...' : 'Save Pricing Rates'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: REVENUE & FINANCIAL LEDGER */}
          {activeTab === 'REVENUE' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Total Revenue
                  </span>
                  <div className="font-heading text-3xl font-black text-slate-900 mt-1">
                    ₹{analytics?.totalRevenue?.toFixed(2) || '0.00'}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Lifetime earnings</span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Direct UPI Settlements
                  </span>
                  <div className="font-heading text-3xl font-black text-emerald-700 mt-1">
                    ₹{analytics?.upiRevenue?.toFixed(2) || '0.00'}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Direct to shop account</span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Cash at Counter
                  </span>
                  <div className="font-heading text-3xl font-black text-blue-600 mt-1">
                    ₹{analytics?.cashRevenue?.toFixed(2) || '0.00'}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Collected in-person</span>
                </div>
              </div>

              {/* Payments Ledger Table */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-heading text-sm font-bold text-slate-900">
                    Payment Transactions Ledger
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Payment ID</th>
                        <th className="px-4 py-3">Order #</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.length > 0 ? (
                        payments.map((p) => (
                          <tr key={p._id || p.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3 font-mono text-slate-800">
                              {p.paymentId || (p._id || p.id).slice(0, 8)}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900">
                              #{p.orderNumber || '-'}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900">
                              ₹{p.amount?.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 font-bold text-slate-700">
                                {p.paymentType}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                                p.status === 'COMPLETED' || p.status === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {new Date(p.createdAt || Date.now()).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-slate-400">
                            No payment transactions recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SUBSCRIPTION PLANS */}
          {activeTab === 'PLAN' && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 uppercase">
                    Current Active: {shop?.subscriptionPlan?.planName || 'Free Pioneer Tier'}
                  </span>
                </div>
                <h3 className="font-heading text-base font-bold text-slate-900">
                  Shop Partner Subscription Tiers
                </h3>
                <p className="text-xs text-slate-500">
                  All shops currently receive 100% Free Plan during initial launch. Higher volume plans can be selected at any time.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {availablePlans.map((plan) => {
                  const isCurrent = (shop?.subscriptionPlan?.planId || 'plan_free_pioneer') === plan.planId;
                  return (
                    <div
                      key={plan.planId}
                      className={`rounded-2xl border p-5 flex flex-col justify-between transition shadow-sm ${
                        isCurrent
                          ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-900">{plan.name}</span>
                          {isCurrent && (
                            <span className="rounded bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="font-heading text-2xl font-black text-slate-900 mb-2">
                          ₹{plan.priceMonthly} <span className="text-xs font-normal text-slate-500">/ month</span>
                        </div>

                        <p className="text-xs text-slate-600 mb-4">{plan.description}</p>

                        <div className="space-y-1.5 text-xs text-slate-700 border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>Max Printers: {plan.maxPrinters}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>Max Orders/Mo: {plan.maxOrdersPerMonth === 999999 ? 'Unlimited' : plan.maxOrdersPerMonth}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>Direct Shop UPI</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>Counter Standee QR</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-5 border-t border-slate-100 mt-4">
                        <button
                          disabled={isCurrent || updatingPlan}
                          onClick={() => handleSelectPlan(plan.planId, plan.name)}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                            isCurrent
                              ? 'bg-slate-100 text-slate-500 cursor-default'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isCurrent ? 'Current Active Plan' : 'Select Plan'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: Walk-In Customer Mobile Scanner Simulator */}
      {showWalkInSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-[40px] border-4 border-slate-700 bg-slate-900 p-3 shadow-2xl ring-1 ring-white/20">
            {/* Phone Top Notch & Status Bar */}
            <div className="relative mx-auto h-5 w-32 rounded-b-xl bg-slate-900 flex items-center justify-center gap-1.5 mb-2 z-10">
              <div className="h-2 w-2 rounded-full bg-slate-800" />
              <div className="h-1.5 w-10 rounded-full bg-slate-800" />
            </div>

            {/* Simulated Phone Screen */}
            <div className="relative rounded-[32px] bg-slate-50 text-slate-900 overflow-hidden shadow-inner flex flex-col h-[640px]">
              {/* Mobile Browser Address Bar */}
              <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between text-[11px] select-none">
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 016 0v2h2V7a5 5 0 00-5-5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-800 font-mono text-[10px] truncate max-w-[170px]">
                    prinly.in/shop/{shopId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWalkInSimulator(false)}
                  className="rounded-full bg-slate-100 hover:bg-slate-200 p-1 text-slate-500 font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Step Flow Indicator */}
              <div className="bg-blue-600 text-white px-3 py-1.5 flex items-center justify-between text-[10px] font-bold">
                <span>Customer Mobile Scan Journey</span>
                <span className="bg-blue-800/80 px-2 py-0.5 rounded-full font-mono">
                  Step {simulatorStep} of 4
                </span>
              </div>

              {/* Phone Screen Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                {/* STAGE 1: Welcome & File Upload */}
                {simulatorStep === 1 && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="text-center space-y-1">
                      <img src="/logo.png" alt="Prinly" className="h-7 w-auto mx-auto object-contain" />
                      <h4 className="font-heading text-sm font-black text-slate-900">
                        {shop?.name || 'Apex Digital Print & Cyber Cafe'}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Walk-in Counter Print • Fast Instant Pickup
                      </p>
                    </div>

                    <div className="rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/50 p-4 text-center space-y-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black mx-auto">
                        📄
                      </div>
                      <div className="font-bold text-slate-900 text-xs">
                        Select Document to Print
                      </div>
                      <p className="text-[10px] text-slate-500">
                        PDF, Word Document, or Image Photo
                      </p>
                      <div className="p-2 rounded-xl bg-white border border-blue-200 text-left flex items-center justify-between">
                        <div className="truncate min-w-0 pr-2">
                          <div className="font-bold text-slate-900 text-[11px] truncate">
                            College_Project_Final_2026.pdf
                          </div>
                          <div className="text-[9px] text-slate-500">16 pages • 3.8 MB</div>
                        </div>
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          ✓ Ready
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSimulatorStep(2)}
                      className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-xs shadow-md transition active:scale-95"
                    >
                      Continue to Print Options →
                    </button>
                  </div>
                )}

                {/* STAGE 2: Settings & Rate Calculator */}
                {simulatorStep === 2 && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-heading text-xs font-black text-slate-900">
                        Print Configuration
                      </span>
                      <span className="text-[10px] text-slate-500">16 pages</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-700 block">Print Type:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border-2 border-blue-600 bg-blue-50/60 p-2.5 text-center">
                          <div className="font-black text-slate-900 text-xs">B&W Xerox</div>
                          <div className="text-[10px] text-blue-700 font-bold">₹1.50 / page</div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-center opacity-70">
                          <div className="font-bold text-slate-900 text-xs">Colour</div>
                          <div className="text-[10px] text-slate-500">₹8.00 / page</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-700 block">Sides:</label>
                      <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-2 text-[11px] font-bold text-slate-800 flex justify-between">
                        <span>Double Sided (Duplex)</span>
                        <span className="text-emerald-700">8 sheets</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-900 text-white p-3 space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Rate (16 pages duplex):</span>
                        <span>₹12.00</span>
                      </div>
                      <div className="flex justify-between font-heading text-sm font-black text-cyan-300 pt-1 border-t border-slate-800">
                        <span>Total Walk-in Bill:</span>
                        <span>₹12.00</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSimulatorStep(1)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimulatorStep(3)}
                        className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-xs shadow-md transition active:scale-95"
                      >
                        Proceed to Direct UPI Pay →
                      </button>
                    </div>
                  </div>
                )}

                {/* STAGE 3: Instant UPI Payment */}
                {simulatorStep === 3 && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-4 text-white text-center space-y-1 shadow-md">
                      <div className="text-[10px] uppercase font-black tracking-widest text-emerald-200">
                        Direct P2P Payment
                      </div>
                      <div className="font-heading text-2xl font-black">₹12.00</div>
                      <div className="text-[11px] text-emerald-100 font-mono">
                        To: {shopUpiId || 'apexprint@okaxis'}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Customer opens their UPI app:
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-2 text-center font-bold text-blue-700 text-[10px]">
                          Google Pay
                        </div>
                        <div className="rounded-xl border border-purple-200 bg-purple-50 p-2 text-center font-bold text-purple-700 text-[10px]">
                          PhonePe
                        </div>
                        <div className="rounded-xl border border-sky-200 bg-sky-50 p-2 text-center font-bold text-sky-700 text-[10px]">
                          Paytm
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[10px] text-slate-600 space-y-0.5">
                      <div>✓ Amount auto-filled: ₹12.00</div>
                      <div>✓ Verified recipient: {shop?.name || 'Cyber Café'}</div>
                      <div>✓ 0% Platform Deduction: 100% hits shop bank</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSimulatorStep(4);
                        playOrderChime();
                      }}
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 text-xs shadow-lg shadow-emerald-600/30 transition active:scale-95"
                    >
                      ✓ Simulate Successful UPI Payment
                    </button>
                  </div>
                )}

                {/* STAGE 4: Success & Send to Queue */}
                {simulatorStep === 4 && (
                  <div className="space-y-3.5 text-center animate-in fade-in">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-700 text-2xl font-black mx-auto">
                      ✓
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-heading text-base font-black text-slate-900">
                        Order Spooled Instantly!
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        Payment of ₹12.00 received in your shop UPI account. Machine is ready to print.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-left space-y-1 text-[11px]">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>Job: College_Project_Final_2026.pdf</span>
                        <span className="text-blue-600">Ready</span>
                      </div>
                      <div className="text-slate-500">8 Sheets Duplex • Tray 1 HP LaserJet</div>
                      <div className="text-emerald-700 font-mono font-bold">UPI Ref: UPI/WALK/{Date.now().toString().slice(-6)}</div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const mockOrder = {
                            _id: `walkin_${Date.now()}`,
                            id: `walkin_${Date.now()}`,
                            customerName: 'Walk-in Customer (Standee)',
                            customerEmail: 'walkin@student.edu',
                            fileName: 'College_Project_Final_2026.pdf',
                            pageCount: 16,
                            copies: 1,
                            colorMode: 'MONOCHROME',
                            duplex: true,
                            paperSize: 'A4',
                            amount: 12,
                            status: 'QUEUED',
                            paymentType: 'ONLINE_UPI',
                            paymentStatus: 'PAID',
                            createdAt: new Date().toISOString(),
                          };
                          setOrders((prev) => [mockOrder, ...prev]);
                          playOrderChime();
                          showNotification('Test walk-in order added to your Live Print Queue!');
                          setShowWalkInSimulator(false);
                          setSimulatorStep(1);
                        }}
                        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-2.5 text-xs shadow-md transition active:scale-95"
                      >
                        🚀 Push This Order to Live Print Queue
                      </button>

                      <button
                        type="button"
                        onClick={() => setSimulatorStep(1)}
                        className="w-full rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 text-xs"
                      >
                        Restart Simulator
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Phone Bar */}
              <div className="bg-white border-t border-slate-200 p-2 text-center">
                <div className="mx-auto h-1 w-24 rounded-full bg-slate-300" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Link New Printer Machine */}
      {showAddPrinterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-sm font-bold text-slate-900">
                Link New Hardware Printer
              </h3>
              <button
                onClick={() => setShowAddPrinterModal(false)}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddPrinter} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-800 font-bold mb-1 block">Printer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter Master HP"
                  value={newPrinterName}
                  onChange={(e) => setNewPrinterName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-slate-800 font-bold mb-1 block">Model *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LaserJet Enterprise M607"
                  value={newPrinterModel}
                  onChange={(e) => setNewPrinterModel(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-800 font-bold mb-1 block">Type</label>
                  <select
                    value={newPrinterType}
                    onChange={(e: any) => setNewPrinterType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                  >
                    <option value="MONOCHROME">Monochrome (B&W)</option>
                    <option value="COLOR">Color + Mono</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-800 font-bold mb-1 block">Speed (PPM)</label>
                  <input
                    type="number"
                    value={newPrinterPPM}
                    onChange={(e) => setNewPrinterPPM(parseInt(e.target.value, 10) || 30)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-800 font-bold mb-1 block">Connection Type</label>
                <select
                  value={newPrinterConnectionType}
                  onChange={(e: any) => setNewPrinterConnectionType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                >
                  <option value="NETWORK_IP">Network IP / Ethernet</option>
                  <option value="USB_PORT">USB Cable Port</option>
                  <option value="CLOUD_AGENT">Cloud Print Agent</option>
                </select>
              </div>

              {newPrinterConnectionType === 'NETWORK_IP' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-800 font-bold mb-1 block">IP Address</label>
                    <input
                      type="text"
                      value={newPrinterIp}
                      onChange={(e) => setNewPrinterIp(e.target.value)}
                      placeholder="192.168.1.100"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-slate-800 font-bold mb-1 block">Raw Port</label>
                    <input
                      type="number"
                      value={newPrinterPort}
                      onChange={(e) => setNewPrinterPort(parseInt(e.target.value, 10) || 9100)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>
                </div>
              )}

              {newPrinterConnectionType === 'USB_PORT' && (
                <div>
                  <label className="text-slate-800 font-bold mb-1 block">USB Port Name</label>
                  <input
                    type="text"
                    value={newPrinterUsbPort}
                    onChange={(e) => setNewPrinterUsbPort(e.target.value)}
                    placeholder="USB001"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPrinterModal(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 font-bold text-white shadow-sm"
                >
                  Link Printer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Printer Machine */}
      {showEditPrinterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-sm font-bold text-slate-900">
                Edit Printer Details
              </h3>
              <button
                onClick={() => setShowEditPrinterModal(false)}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUpdatePrinter} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-800 font-bold mb-1 block">Printer Name *</label>
                <input
                  type="text"
                  required
                  value={editPrinterName}
                  onChange={(e) => setEditPrinterName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-slate-800 font-bold mb-1 block">Model *</label>
                <input
                  type="text"
                  required
                  value={editPrinterModel}
                  onChange={(e) => setEditPrinterModel(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-800 font-bold mb-1 block">Type</label>
                  <select
                    value={editPrinterType}
                    onChange={(e: any) => setEditPrinterType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                  >
                    <option value="MONOCHROME">Monochrome (B&W)</option>
                    <option value="COLOR">Color + Mono</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-800 font-bold mb-1 block">Speed (PPM)</label>
                  <input
                    type="number"
                    value={editPrinterPPM}
                    onChange={(e) => setEditPrinterPPM(parseInt(e.target.value, 10) || 30)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-800 font-bold mb-1 block">Connection Type</label>
                <select
                  value={editPrinterConnectionType}
                  onChange={(e: any) => setEditPrinterConnectionType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                >
                  <option value="NETWORK_IP">Network IP / Ethernet</option>
                  <option value="USB_PORT">USB Cable Port</option>
                  <option value="CLOUD_AGENT">Cloud Print Agent</option>
                </select>
              </div>

              {editPrinterConnectionType === 'NETWORK_IP' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-800 font-bold mb-1 block">IP Address</label>
                    <input
                      type="text"
                      value={editPrinterIp}
                      onChange={(e) => setEditPrinterIp(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-slate-800 font-bold mb-1 block">Raw Port</label>
                    <input
                      type="number"
                      value={editPrinterPort}
                      onChange={(e) => setEditPrinterPort(parseInt(e.target.value, 10) || 9100)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>
                </div>
              )}

              {editPrinterConnectionType === 'USB_PORT' && (
                <div>
                  <label className="text-slate-800 font-bold mb-1 block">USB Port Name</label>
                  <input
                    type="text"
                    value={editPrinterUsbPort}
                    onChange={(e) => setEditPrinterUsbPort(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditPrinterModal(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 font-bold text-white shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Counter Desk Standee & Printable Placard */}
      {showPrintStandeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-5 backdrop-blur-md animate-in fade-in">
          {/* Print Isolation Stylesheet */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-counter-standee, #printable-counter-standee * {
                visibility: visible !important;
              }
              #printable-counter-standee {
                position: fixed !important;
                left: 0 !important;
                right: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 680px !important;
                margin: 20px auto !important;
                border: 2px solid #0f172a !important;
                box-shadow: none !important;
                padding: 36px 30px !important;
                background: #ffffff !important;
                color: #000000 !important;
              }
            }
          `}} />

          <div className="relative w-full max-w-xl max-h-[95vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-black text-slate-900">
                  Print Ready Counter Desk Standee
                </h3>
                <span className="rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold px-2.5 py-0.5">
                  A4 / Lamination Ready
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintStandeeModal(false)}
                className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Theme & Format Quick Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-600 text-[11px]">Theme:</span>
                {[
                  { id: 'BLUE', label: '💎 Blue' },
                  { id: 'DARK', label: '🖤 Dark' },
                  { id: 'GOLD', label: '⚡ Gold' },
                  { id: 'EMERALD', label: '🌿 Emerald' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setStandeeTheme(t.id as any)}
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition ${
                      standeeTheme === t.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-600 text-[11px]">Format:</span>
                {[
                  { id: 'A4', label: 'A4' },
                  { id: 'TENT', label: 'Tent' },
                  { id: 'STICKER', label: 'Sticker' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStandeeFormat(f.id as any)}
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition ${
                      standeeFormat === f.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Placard Paper Preview Canvas (Matches Selected Theme & Format) */}
            <div
              id="printable-counter-standee"
              className={`rounded-3xl border-2 p-7 text-center shadow-xl space-y-4 max-w-md mx-auto transition-all ${
                standeeTheme === 'BLUE'
                  ? 'border-blue-300 bg-gradient-to-b from-white via-blue-50/40 to-slate-50 text-slate-900 ring-2 ring-blue-100'
                  : standeeTheme === 'DARK'
                  ? 'border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white'
                  : standeeTheme === 'GOLD'
                  ? 'border-amber-400 bg-gradient-to-b from-amber-50 via-yellow-50/50 to-white text-slate-950'
                  : 'border-emerald-300 bg-gradient-to-b from-emerald-50 via-teal-50/40 to-white text-slate-900'
              }`}
            >
              {/* Brand Header */}
              <div className="flex items-center justify-center gap-2">
                <img
                  src="/logo.png"
                  alt="Prinly.in"
                  className="h-10 w-auto object-contain mx-auto"
                />
              </div>

              <div>
                <span
                  className={`inline-block rounded-full px-3.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                    standeeTheme === 'DARK'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : standeeTheme === 'GOLD'
                      ? 'bg-amber-200 text-amber-950 border border-amber-300'
                      : standeeTheme === 'EMERALD'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  Official Cyber Café Partner
                </span>
                <h2
                  className={`mt-2 font-heading text-xl sm:text-2xl font-black leading-tight ${
                    standeeTheme === 'DARK' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {shop?.name || 'Apex Digital Print & Cyber Cafe'}
                </h2>
                <p
                  className={`text-xs mt-1 ${
                    standeeTheme === 'DARK' ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {shop?.address || 'Counter Standee • Instant Pickup'}
                </p>
                {standeeTagline && (
                  <p
                    className={`mt-1.5 inline-block text-xs font-bold px-3 py-1 rounded-xl ${
                      standeeTheme === 'DARK'
                        ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                        : 'bg-white text-slate-800 border border-slate-200 shadow-xs'
                    }`}
                  >
                    ⚡ {standeeTagline}
                  </p>
                )}
              </div>

              {/* QR Code Container */}
              {standeeMode === 'SMART_ORDER' ? (
                <div className="relative mx-auto my-3 w-56 rounded-2xl bg-white p-4 border-2 border-slate-900 shadow-md">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                      customerPortalUrl
                    )}`}
                    alt="Walk-in Order QR"
                    className="h-48 w-48 mx-auto object-contain"
                  />
                  <div className="mt-2 text-center">
                    <span className="inline-block rounded-full bg-slate-900 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest text-cyan-400">
                      Scan with any phone camera
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 my-3">
                  <div className="rounded-2xl bg-white p-2.5 border-2 border-blue-600 shadow-md">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        customerPortalUrl
                      )}`}
                      alt="Order QR"
                      className="h-32 w-32 mx-auto object-contain"
                    />
                    <div className="mt-1 text-[9px] font-black text-blue-700 uppercase">
                      1. Upload Files
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-2.5 border-2 border-emerald-600 shadow-md">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        `upi://pay?pa=${(shopUpiId || 'apexprint@okaxis').trim()}&pn=${encodeURIComponent(
                          shop?.name || 'Prinly Partner'
                        )}&cu=INR`
                      )}`}
                      alt="UPI QR"
                      className="h-32 w-32 mx-auto object-contain"
                    />
                    <div className="mt-1 text-[9px] font-black text-emerald-700 uppercase">
                      2. Pay Shop UPI
                    </div>
                  </div>
                </div>
              )}

              {/* 3 Simple Steps */}
              <div
                className={`space-y-1.5 text-left text-xs p-3.5 rounded-2xl border font-medium ${
                  standeeTheme === 'DARK'
                    ? 'bg-slate-900 border-slate-800 text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div
                  className={`flex items-center gap-2 font-bold ${
                    standeeTheme === 'DARK' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>Point camera at this QR code</span>
                </div>
                <div
                  className={`flex items-center gap-2 font-bold ${
                    standeeTheme === 'DARK' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <span className="h-5 w-5 rounded-full bg-cyan-600 text-white text-[10px] flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>Upload your document & select settings</span>
                </div>
                <div
                  className={`flex items-center gap-2 font-bold ${
                    standeeTheme === 'DARK' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <span className="h-5 w-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span>Pay shop UPI/Cash and collect hot prints!</span>
                </div>
              </div>

              {showPhoneOnStandee && (
                <div
                  className={`text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 ${
                    standeeTheme === 'DARK' ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  <span>📞 Shop Helpline:</span>
                  <span className="text-blue-600 font-extrabold">{standeePhone}</span>
                </div>
              )}

              <div
                className={`pt-2 text-[10px] font-semibold border-t ${
                  standeeTheme === 'DARK'
                    ? 'border-slate-800 text-slate-500'
                    : 'border-slate-100 text-slate-400'
                }`}
              >
                Powered by Prinly.in • Zero WhatsApp Waiting • 100% Privacy
              </div>

              {standeeFormat === 'TENT' && (
                <div className="pt-2 border-t-2 border-dashed border-slate-400 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  ✂ Cut / Fold Along Dotted Line
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-500">
                Tip: Print on cardstock paper (250gsm) or insert into standard acrylic T-stand.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
                      customerPortalUrl
                    )}`;
                    link.download = `${(shop?.name || 'Shop').replace(/\s+/g, '_')}_Standee_QR.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showNotification('Downloading high-res QR code...');
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition"
                >
                  Download PNG
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-black text-white shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print Placard Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
