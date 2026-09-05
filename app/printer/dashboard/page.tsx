'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Printer,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Banknote,
  DollarSign,
  TrendingUp,
  Plus,
  RefreshCw,
  Power,
  Layers,
  Sparkles,
  Zap,
  Check,
  X,
  CreditCard,
  ShieldCheck,
  LogOut,
  Bell,
  Play,
  PackageCheck,
  Flame,
  Bike,
  Sliders,
  QrCode,
  Upload,
  Radio,
  Wifi,
  Trash2,
  Pencil,
  Copy,
  ExternalLink,
  Camera,
} from 'lucide-react';
import { useSocket } from '@/lib/socket';

export default function PrinterDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'FLEET' | 'UPI_PAYMENT' | 'PRICING' | 'REVENUE' | 'PLAN'>('QUEUE');
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

  // Load user session & verify role
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then((data) => {
        if (data.authenticated) {
          if (data.user.role !== 'SHOP_OWNER' && data.user.role !== 'ADMIN') {
            router.push('/printer/login');
            return;
          }
          setCurrentUser(data.user);
          loadDashboardData(data.user.shopId || 'shop_001');
        } else {
          router.push('/printer/login');
        }
      })
      .catch(() => {
        router.push('/printer/login');
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
        if (shopData.shop?.upiQrUrl) {
          setShopUpiQrUrl(shopData.shop.upiQrUrl);
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
      showNotification(`🔔 New print order received: #${newOrder.orderNumber} (${newOrder.customerName})`);
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
      const res = await fetch(`/api/printers/${printerId}/status`, {
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
      const res = await fetch(`/api/orders/${orderId}/approve-cash`, {
        method: 'POST',
      });

      if (res.ok) {
        showNotification(`✅ Cash payment approved for #${orderNumber}! Order added to print queue.`);
        loadDashboardData(shopId);
      }
    } catch (e) {
      console.error('Failed to approve cash:', e);
    }
  };

  // Update Order Status Pipeline: QUEUED -> PRINTING -> READY -> COMPLETED
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
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
      const res = await fetch(`/api/shops/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricingRates }),
      });

      if (res.ok) {
        showNotification('Pricing rates updated successfully!');
        loadDashboardData(shopId);
      } else {
        const d = await res.json();
        showNotification(d.error || 'Failed to update rates');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error saving rates');
    } finally {
      setSavingPricing(false);
    }
  };

  // Add/Link New Printer
  const handleAddPrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          name: newPrinterName,
          model: newPrinterModel,
          type: newPrinterType,
          paperSizes: ['A4', 'Legal', 'A3'],
          ppmSpeed: Number(newPrinterPPM),
          supportsDuplex: true,
          connectionType: newPrinterConnectionType,
          ipAddress: newPrinterConnectionType === 'NETWORK_IP' ? newPrinterIp : undefined,
          portNumber: newPrinterConnectionType === 'NETWORK_IP' ? Number(newPrinterPort) : undefined,
          usbPort: newPrinterConnectionType === 'USB_PORT' ? newPrinterUsbPort : undefined,
          isLinked: true,
        }),
      });

      if (res.ok) {
        showNotification('✅ Hardware printer successfully linked & deployed to fleet!');
        setShowAddPrinterModal(false);
        setNewPrinterName('');
        setNewPrinterModel('');
        loadDashboardData(shopId);
      } else {
        const d = await res.json();
        showNotification(d.error || 'Failed to link printer');
      }
    } catch (e: any) {
      showNotification(e.message || 'Error linking printer');
    }
  };

  // Test Ping Printer Connection
  const handlePingPrinter = async (printerId: string) => {
    setPingingPrinterId(printerId);
    try {
      const res = await fetch(`/api/printers/${printerId}/test-link`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`🟢 ${data.message}`);
        loadDashboardData(shopId);
      } else {
        showNotification(data.error || 'Ping failed');
      }
    } catch (e: any) {
      showNotification(e.message || 'Error pinging printer');
    } finally {
      setPingingPrinterId(null);
    }
  };

  // Open Edit Printer Modal
  const handleOpenEditPrinter = (printer: any) => {
    setEditingPrinter(printer);
    setEditPrinterName(printer.name);
    setEditPrinterModel(printer.model);
    setEditPrinterType(printer.type || 'MONOCHROME');
    setEditPrinterPPM(printer.ppmSpeed || 30);
    setEditPrinterConnectionType(printer.connectionType || 'NETWORK_IP');
    setEditPrinterIp(printer.ipAddress || '192.168.1.105');
    setEditPrinterPort(printer.portNumber || 9100);
    setEditPrinterUsbPort(printer.usbPort || 'USB001');
    setShowEditPrinterModal(true);
  };

  // Update Printer
  const handleUpdatePrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrinter) return;
    try {
      const res = await fetch(`/api/printers/${editingPrinter._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editPrinterName,
          model: editPrinterModel,
          type: editPrinterType,
          ppmSpeed: Number(editPrinterPPM),
          connectionType: editPrinterConnectionType,
          ipAddress: editPrinterConnectionType === 'NETWORK_IP' ? editPrinterIp : undefined,
          portNumber: editPrinterConnectionType === 'NETWORK_IP' ? Number(editPrinterPort) : undefined,
          usbPort: editPrinterConnectionType === 'USB_PORT' ? editPrinterUsbPort : undefined,
        }),
      });

      if (res.ok) {
        showNotification('✅ Printer details & link parameters updated!');
        setShowEditPrinterModal(false);
        loadDashboardData(shopId);
      } else {
        const d = await res.json();
        showNotification(d.error || 'Failed to update printer');
      }
    } catch (e: any) {
      showNotification(e.message || 'Error updating printer');
    }
  };

  // Delete Printer
  const handleDeletePrinter = async (printerId: string, printerName: string) => {
    if (!confirm(`Are you sure you want to remove "${printerName}" from your fleet?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/printers/${printerId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showNotification('Printer removed from fleet.');
        loadDashboardData(shopId);
      } else {
        const d = await res.json();
        showNotification(d.error || 'Failed to remove printer');
      }
    } catch (e: any) {
      showNotification(e.message || 'Error deleting printer');
    }
  };

  // Upload Shop Payment QR image
  const handleUploadQrFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.file?.fileUrl) {
        setShopUpiQrUrl(data.file.fileUrl);
        showNotification('✅ QR image uploaded! Click "Save Payment Settings" to activate.');
      } else {
        showNotification(data.error || 'Failed to upload QR image');
      }
    } catch (e: any) {
      showNotification(e.message || 'Error uploading image');
    } finally {
      setUploadingQr(false);
    }
  };

  // Save Shop UPI Settings
  const handleSaveShopUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUpi(true);
    try {
      const res = await fetch(`/api/shops/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upiId: shopUpiId,
          upiQrUrl: shopUpiQrUrl,
        }),
      });

      if (res.ok) {
        showNotification('✅ Shop UPI ID and Payment QR saved! Customers will now pay directly to your QR.');
        loadDashboardData(shopId);
      } else {
        const d = await res.json();
        showNotification(d.error || 'Failed to save UPI settings');
      }
    } catch (e: any) {
      showNotification(e.message || 'Error saving UPI settings');
    } finally {
      setSavingUpi(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'printporter_token=; Max-Age=0; path=/;';
    router.push('/printer/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex flex-col items-center justify-center text-slate-400">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mb-4" />
        <p className="text-sm">Connecting to Printer Terminal...</p>
      </div>
    );
  }

  // Active print queue orders
  const pendingCashOrders = orders.filter(
    (o) => o.paymentType === 'CASH' && o.paymentStatus === 'PENDING_APPROVAL'
  );
  const activeQueueOrders = orders.filter((o) =>
    ['QUEUED', 'PRINTING'].includes(o.status)
  );
  const readyAndDeliveryOrders = orders.filter((o) =>
    ['READY', 'OUT_FOR_DELIVERY'].includes(o.status)
  );
  const completedOrders = orders.filter((o) =>
    ['COMPLETED', 'DELIVERED'].includes(o.status)
  );

  // Currently printing job
  const currentlyPrintingJob = orders.find((o) => o.status === 'PRINTING');

  return (
    <div className="min-h-screen flex bg-[#070b13] text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold px-4 py-3 shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <Bell className="h-4 w-4" />
          <span className="text-xs">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================
          1. MODERN FIXED LEFT SIDEBAR PANEL FOR SHOP TERMINAL
      ======================================================== */}
      <aside className="w-64 lg:w-72 border-r border-white/10 bg-[#090e18] flex flex-col justify-between shrink-0 sticky top-0 h-screen z-40">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand & Shop Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/25 shrink-0">
                <Printer className="h-5 w-5 text-slate-950" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading text-sm font-black text-white truncate" title={shop?.name}>
                    {shop?.name || 'Printer Terminal'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-400 uppercase">
                    Shop Terminal
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation Items */}
          <nav className="p-3 space-y-1 text-xs font-semibold">
            {/* 1. Print Queue & Incoming Orders */}
            <button
              onClick={() => setActiveTab('QUEUE')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'QUEUE'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 shrink-0 text-sky-400" />
                <span>Print Queue & Orders</span>
              </div>
              {(pendingCashOrders.length > 0 || activeQueueOrders.length > 0) && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    pendingCashOrders.length > 0
                      ? 'bg-amber-500 text-slate-950 animate-pulse'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  {pendingCashOrders.length + activeQueueOrders.length}
                </span>
              )}
            </button>

            {/* 2. Connected Printer Fleet */}
            <button
              onClick={() => setActiveTab('FLEET')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'FLEET'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Printer className="h-4 w-4 shrink-0 text-purple-400" />
                <span>Connected Fleet</span>
              </div>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                {printers.length}
              </span>
            </button>

            {/* 3. Shop UPI & QR Payments */}
            <button
              onClick={() => setActiveTab('UPI_PAYMENT')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'UPI_PAYMENT'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <QrCode className="h-4 w-4 shrink-0 text-cyan-400" />
                <span>Shop UPI & QR Setup</span>
              </div>
            </button>

            {/* 4. Pricing Rates */}
            <button
              onClick={() => setActiveTab('PRICING')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'PRICING'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sliders className="h-4 w-4 shrink-0 text-amber-400" />
                <span>Pricing Rates</span>
              </div>
            </button>

            {/* 5. Payments & Cash Ledger */}
            <button
              onClick={() => setActiveTab('REVENUE')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'REVENUE'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Payments & Cash Ledger</span>
              </div>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                {payments.length}
              </span>
            </button>

            {/* 6. Subscription Plans */}
            <button
              onClick={() => setActiveTab('PLAN')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'PLAN'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="h-4 w-4 shrink-0 text-indigo-400" />
                <span>Subscription Plans</span>
              </div>
              <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                {availablePlans.length || 4}
              </span>
            </button>
          </nav>
        </div>

        {/* Quick Customer Desk QR Link Card in Sidebar */}
        <div className="p-3 border-t border-white/5 space-y-2 text-xs">
          <Link
            href={`/shop/${shopId}`}
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 hover:bg-sky-500/20 transition group"
          >
            <div className="flex items-center gap-2">
              <QrCode className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-semibold text-[11px]">Customer Desk QR</span>
            </div>
            <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition" />
          </Link>
        </div>

        {/* Sidebar Footer: Shopkeeper Profile Card */}
        <div className="p-4 border-t border-white/10 bg-slate-900/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-xs shrink-0">
                {currentUser?.name?.charAt(0) || 'P'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {currentUser?.name || 'Shop Manager'}
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold truncate">
                  {shop?.ownerName || currentUser?.role || 'Shop Owner'}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl p-2 text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================
          2. MAIN TERMINAL AREA (RIGHT PANEL)
      ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        {/* Sticky Top Header Bar */}
        <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-black text-white">
              {activeTab === 'QUEUE' && 'Live Print Spooler & Incoming Counter Orders'}
              {activeTab === 'FLEET' && 'Connected Fleet & Hardware Printers'}
              {activeTab === 'UPI_PAYMENT' && 'Shop Payment QR & Direct UPI Settlement'}
              {activeTab === 'PRICING' && 'Shop Printing & Finishing Rate Cards'}
              {activeTab === 'REVENUE' && 'Daily Financial Ledger & Settlements'}
              {activeTab === 'PLAN' && 'Shop Subscription Tiers & Machine Quotas'}
            </h2>
            <p className="text-[11px] text-slate-400">
              {shop?.name || 'Cyber Café Hub'} • Terminal Active
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadDashboardData(shopId)}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              href={`/shop/${shopId}`}
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 px-3.5 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/25 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Customer Order Page</span>
            </Link>
          </div>
        </header>

        {/* Main Terminal Body */}
        <main className="flex-1 px-6 py-6 pb-16">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Quick Metrics KPI Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-300 font-semibold">
                    Awaiting Cash Approval
                  </span>
                  <Banknote className="h-4 w-4 text-amber-400" />
                </div>
                <div className="font-heading text-2xl font-black text-white mt-1">
                  {pendingCashOrders.length} orders
                </div>
                <div className="text-[11px] text-amber-400 font-medium mt-0.5">
                  Require counter confirmation
                </div>
              </div>

              <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-sky-300 font-semibold">Active Print Queue</span>
                  <Clock className="h-4 w-4 text-sky-400" />
                </div>
                <div className="font-heading text-2xl font-black text-white mt-1">
                  {activeQueueOrders.length} jobs
                </div>
                <div className="text-[11px] text-sky-400 font-medium mt-0.5">
                  ~{shop?.estimatedWaitMinutes || 4} mins total wait
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-300 font-semibold">Today's Revenue</span>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="font-heading text-2xl font-black text-white mt-1">
                  ₹{(shop?.totalRevenue || 0).toFixed(2)}
                </div>
                <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
                  Cash: ₹{(shop?.cashCollected || 0).toFixed(0)} | Online: ₹{(shop?.onlineCollected || 0).toFixed(0)}
                </div>
              </div>

              <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-300 font-semibold">Connected Fleet</span>
                  <Printer className="h-4 w-4 text-purple-400" />
                </div>
                <div className="font-heading text-2xl font-black text-white mt-1">
                  {printers.filter((p) => p.status === 'AVAILABLE').length} / {printers.length} Online
                </div>
                <div className="text-[11px] text-purple-400 font-medium mt-0.5">
                  {printers.filter((p) => p.status === 'BUSY').length} currently printing
                </div>
              </div>
            </div>

            {/* Currently Printing Live Monitor Banner */}
            {currentlyPrintingJob && (
              <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-cyan-500/10 animate-pulse-subtle">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 animate-bounce">
                    <Printer className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-cyan-500 px-2 py-0.5 text-[9px] font-extrabold uppercase text-slate-950">
                        Machine Active
                      </span>
                      <span className="text-xs font-bold text-white">
                        {currentlyPrintingJob.printerName}
                      </span>
                    </div>
                    <p className="text-xs text-cyan-200 mt-0.5">
                      Currently printing: <strong>{currentlyPrintingJob.fileName}</strong> ({currentlyPrintingJob.pageCount} pages × {currentlyPrintingJob.copies} copies) for {currentlyPrintingJob.customerName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateOrderStatus(currentlyPrintingJob._id, 'READY')}
                    className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-400 transition"
                  >
                    Mark Ready for Pickup
                  </button>
                </div>
              </div>
            )}

          {/* TAB 1: Print Queue & Orders */}
          {activeTab === 'QUEUE' && (
            <div className="space-y-6">
              {/* Cash Approvals Section (Urgent Action Required) */}
              {pendingCashOrders.length > 0 && (
                <div className="rounded-3xl border border-amber-500/40 bg-amber-950/20 p-6 backdrop-blur-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Banknote className="h-5 w-5 text-amber-400" />
                    <h3 className="font-heading text-base font-bold text-white">
                      Action Required: Incoming Cash Payments ({pendingCashOrders.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingCashOrders.map((order) => (
                      <div
                        key={order._id}
                        className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-heading text-xs font-bold text-white">
                              Order #{order.orderNumber}
                            </span>
                            <span className="font-heading text-base font-extrabold text-amber-400">
                              ₹{order.totalPrice.toFixed(2)} CASH
                            </span>
                          </div>

                          <p className="text-xs text-slate-200 font-semibold truncate">
                            {order.fileName}
                          </p>

                          <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                            <div>Customer: {order.customerName} ({order.customerPhone})</div>
                            <div>
                              Specs: {order.pageCount} pgs × {order.copies} copy • {order.isColor ? 'Color' : 'B&W'} • {order.paperSize}
                            </div>
                            {order.notes && (
                              <div className="text-amber-300 font-medium">
                                Note: {order.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            Collect cash at counter
                          </span>

                          <button
                            onClick={() => handleApproveCash(order._id, order.orderNumber)}
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-md hover:brightness-110 active:scale-95 transition"
                          >
                            <Check className="h-4 w-4" />
                            <span>Approve Cash Received</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Print Queue */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading text-base font-bold text-white">
                    Active Spooler Queue ({activeQueueOrders.length})
                  </h3>
                  <span className="text-xs text-slate-400">
                    Live Order Pipeline
                  </span>
                </div>

                {activeQueueOrders.length > 0 ? (
                  <div className="space-y-3">
                    {activeQueueOrders.map((order, idx) => (
                      <div
                        key={order._id}
                        className={`rounded-2xl border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                          order.status === 'PRINTING'
                            ? 'border-cyan-400 bg-cyan-950/20'
                            : 'border-white/5 bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sky-400 font-heading text-sm font-black">
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-heading text-xs font-bold text-white">
                                {order.fileName}
                              </h4>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                  order.status === 'PRINTING'
                                    ? 'bg-cyan-500 text-slate-950'
                                    : 'bg-sky-500/20 text-sky-400'
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">
                              {order.customerName} • {order.pageCount} pgs × {order.copies} copy • {order.printerName} • ₹{order.totalPrice.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Pipeline Controller Buttons */}
                        <div className="flex items-center gap-2">
                          {order.status === 'QUEUED' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'PRINTING')}
                              className="flex items-center gap-1 rounded-xl bg-sky-500 px-3 py-2 text-xs font-bold text-white hover:bg-sky-400 transition"
                            >
                              <Play className="h-3.5 w-3.5" />
                              <span>Start Printing</span>
                            </button>
                          )}

                          {order.status === 'PRINTING' && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order._id, 'READY')}
                              className="flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-400 transition"
                            >
                              <PackageCheck className="h-3.5 w-3.5" />
                              <span>Mark Ready</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleUpdateOrderStatus(order._id, 'COMPLETED')}
                            className="rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
                          >
                            Mark Completed
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Queue is currently empty. Ready to accept incoming print jobs!
                  </div>
                )}
              </div>

              {/* Ready for Collection & Porter Dispatch */}
              {readyAndDeliveryOrders.length > 0 && (
                <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/10 p-6">
                  <h3 className="font-heading text-base font-bold text-white mb-3">
                    Ready for Collection & Courier Dispatch ({readyAndDeliveryOrders.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {readyAndDeliveryOrders.map((order) => {
                      const isDelivery = order.fulfillmentType === 'DELIVERY';
                      return (
                        <div
                          key={order._id}
                          className="rounded-2xl border border-emerald-500/20 bg-slate-900 p-4 flex flex-col justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-white">
                                #{order.orderNumber}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-1 ${
                                  isDelivery
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400'
                                }`}
                              >
                                {isDelivery ? (
                                  <>
                                    <Bike className="h-3 w-3" /> Delivery
                                  </>
                                ) : (
                                  'Counter Pickup'
                                )}
                              </span>
                            </div>

                            <div className="text-xs font-semibold text-slate-200 truncate">
                              {order.customerName}
                            </div>

                            {isDelivery && order.deliveryAddress && (
                              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                Drop: {order.deliveryAddress}
                              </div>
                            )}

                            <div className="text-[10px] text-emerald-400 mt-1 font-bold">
                              ₹{order.totalPrice.toFixed(2)} Paid ({order.status})
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                            {isDelivery ? (
                              order.status === 'READY' ? (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order._id, 'OUT_FOR_DELIVERY')}
                                  className="w-full rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500 transition flex items-center justify-center gap-1"
                                >
                                  <Bike className="h-3.5 w-3.5" />
                                  <span>Hand to Porter</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order._id, 'DELIVERED')}
                                  className="w-full rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-400 transition"
                                >
                                  Mark Delivered
                                </button>
                              )
                            ) : (
                              <button
                                onClick={() => handleUpdateOrderStatus(order._id, 'COMPLETED')}
                                className="w-full rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-400 transition"
                              >
                                Handed Over
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Completed Jobs History */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
                <h3 className="font-heading text-base font-bold text-white mb-4">
                  Completed Jobs History ({completedOrders.length})
                </h3>
                {completedOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-500">
                        <tr>
                          <th className="py-2.5">Order</th>
                          <th className="py-2.5">Customer</th>
                          <th className="py-2.5">Document</th>
                          <th className="py-2.5">Specs</th>
                          <th className="py-2.5">Amount</th>
                          <th className="py-2.5">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {completedOrders.map((o) => (
                          <tr key={o._id}>
                            <td className="py-2.5 font-bold text-white">#{o.orderNumber}</td>
                            <td className="py-2.5">{o.customerName}</td>
                            <td className="py-2.5 truncate max-w-[180px]">{o.fileName}</td>
                            <td className="py-2.5">
                              {o.pageCount} pgs × {o.copies} copy ({o.isColor ? 'Color' : 'B&W'})
                            </td>
                            <td className="py-2.5 font-bold text-emerald-400">₹{o.totalPrice.toFixed(2)}</td>
                            <td className="py-2.5">
                              <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-semibold">
                                {o.paymentType}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No completed jobs yet today.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Printer Fleet Management */}
          {activeTab === 'FLEET' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading text-base font-bold text-white">
                    Printer Fleet & Hardware Linking
                  </h3>
                  <p className="text-xs text-slate-400">
                    Link physical printers (Network IP / RAW 9100 / USB) and monitor live spooler status
                  </p>
                </div>

                <button
                  onClick={() => setShowAddPrinterModal(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="h-4 w-4" />
                  <span>Link Printer Machine</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {printers.map((printer) => {
                  const isAvailable = printer.status === 'AVAILABLE';
                  const isBusy = printer.status === 'BUSY';
                  const isOffline = printer.status === 'OFFLINE';
                  const isPinging = pingingPrinterId === printer._id;

                  return (
                    <div
                      key={printer._id}
                      className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 flex flex-col justify-between hover:border-white/20 transition"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-emerald-400">
                              <Printer className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-heading text-sm font-bold text-white line-clamp-1">
                                {printer.name}
                              </h4>
                              <p className="text-[11px] text-slate-400 truncate">
                                {printer.model}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${
                              isAvailable
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isBusy
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {printer.status}
                          </span>
                        </div>

                        {/* Hardware Connection Card */}
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3 mb-3 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="flex items-center gap-1.5 font-bold text-emerald-400 text-[11px]">
                              <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
                              {printer.connectionType === 'USB_PORT' ? 'USB Local Spooler' : 'Network IP (Port 9100)'}
                            </span>
                            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-300 uppercase">
                              Linked
                            </span>
                          </div>
                          <p className="font-mono text-[10px] text-slate-300 truncate">
                            {printer.connectionType === 'USB_PORT'
                              ? printer.usbPort || 'USB001 (Direct)'
                              : `${printer.ipAddress || '192.168.1.105'}:${printer.portNumber || 9100}`}
                          </p>
                        </div>

                        <div className="space-y-1 text-xs text-slate-300 mb-4">
                          <div>Type: <strong className="text-white">{printer.type}</strong></div>
                          <div>Speed: <strong className="text-sky-400">{printer.ppmSpeed} PPM</strong></div>
                          <div>Total Prints Completed: <strong className="text-emerald-400">{printer.totalPrintsCompleted || 0}</strong></div>
                          {printer.currentDocumentName && (
                            <div className="rounded bg-cyan-500/10 border border-cyan-500/20 p-2 text-[11px] text-cyan-300 mt-2">
                              Active Job: {printer.currentDocumentName}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hardware Controls & Actions */}
                      <div className="border-t border-white/10 pt-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            disabled={isPinging}
                            onClick={() => handlePingPrinter(printer._id)}
                            className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-slate-800/80 py-1.5 text-xs font-bold text-sky-400 hover:bg-sky-500/20 transition disabled:opacity-50"
                            title="Ping & Test Connection"
                          >
                            <Wifi className={`h-3.5 w-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                            <span>{isPinging ? 'Pinging...' : 'Ping Test'}</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditPrinter(printer)}
                            className="flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-slate-800/80 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition"
                            title="Edit Printer Parameters"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDeletePrinter(printer._id, printer.name)}
                            className="flex items-center justify-center gap-1 rounded-xl border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition"
                            title="Remove Printer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleTogglePrinterStatus(printer._id, printer.status)}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-800 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition"
                        >
                          <Power className="h-3.5 w-3.5" />
                          <span>Rotate Status ({printer.status})</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Shop UPI & Payment QR Setup */}
          {activeTab === 'UPI_PAYMENT' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-emerald-400" />
                      Shop UPI & Payment QR Configuration
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Upload your shop's Google Pay / PhonePe / Paytm standee QR and enter your UPI ID. Customers pay directly to your account with 0% platform fee.
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400 shrink-0">
                    Direct Payout Active (0% Fee)
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Form: UPI ID & QR Image Upload */}
                  <form onSubmit={handleSaveShopUpi} className="lg:col-span-7 space-y-5">
                    <div className="rounded-2xl border border-white/10 bg-slate-800/40 p-5 space-y-4">
                      <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider text-slate-300">
                        1. Shop UPI ID (VPA)
                      </h4>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 mb-1 block">
                          Your UPI ID (VPA)
                        </label>
                        <input
                          type="text"
                          required
                          value={shopUpiId}
                          onChange={(e) => setShopUpiId(e.target.value)}
                          placeholder="e.g. apexprint@okhdfcbank or 9811122334@paytm"
                          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white font-mono outline-none focus:border-emerald-500"
                        />
                        <p className="text-[11px] text-slate-400 mt-1.5">
                          Customers can 1-click copy this UPI ID to pay directly from GPay, PhonePe, Paytm, or BHIM.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-800/40 p-5 space-y-4">
                      <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider text-slate-300">
                        2. Upload Shop Payment QR Standee
                      </h4>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 mb-2 block">
                          Upload Photo / Screenshot of your Shop QR Code
                        </label>

                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 rounded-xl bg-slate-800 border border-white/10 hover:border-emerald-500/50 px-4 py-3 text-xs font-bold text-slate-200 cursor-pointer hover:text-white transition">
                            <Camera className="h-4 w-4 text-emerald-400" />
                            <span>{uploadingQr ? 'Uploading QR...' : 'Choose QR Image'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleUploadQrFile}
                              className="hidden"
                              disabled={uploadingQr}
                            />
                          </label>

                          <span className="text-xs text-slate-400">or enter image link below</span>
                        </div>

                        <div className="mt-3">
                          <input
                            type="text"
                            value={shopUpiQrUrl}
                            onChange={(e) => setShopUpiQrUrl(e.target.value)}
                            placeholder="https://... or uploaded image URL"
                            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white font-mono outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={savingUpi}
                      className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                    >
                      {savingUpi ? 'Saving Configuration...' : 'Save UPI & QR Configuration'}
                    </button>
                  </form>

                  {/* Right Side: Live Standee Preview */}
                  <div className="lg:col-span-5 flex flex-col items-center justify-center">
                    <div className="w-full max-w-xs rounded-3xl border-2 border-emerald-500/40 bg-slate-950 p-6 text-center shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400" />

                      <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase">
                        Official Shop Payment QR
                      </span>
                      <h4 className="font-heading text-base font-black text-white mt-1 mb-3">
                        {shop?.name || 'Your Cyber Café'}
                      </h4>

                      {/* Display QR Code */}
                      <div className="bg-white p-4 rounded-2xl mx-auto shadow-inner flex items-center justify-center my-3 max-w-[220px]">
                        <img
                          src={
                            shopUpiQrUrl ||
                            `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                              `upi://pay?pa=${shopUpiId || 'apexprint@upi'}&pn=${encodeURIComponent(
                                shop?.name || 'Cyber Cafe'
                              )}&cu=INR`
                            )}`
                          }
                          alt="Shop Payment QR"
                          className="h-44 w-44 object-contain rounded-lg"
                        />
                      </div>

                      <div className="mt-2 text-xs">
                        <span className="text-slate-400 text-[11px]">UPI ID:</span>
                        <div className="font-mono text-xs font-bold text-emerald-400 break-all select-all mt-0.5">
                          {shopUpiId || 'apexprint@upi'}
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl bg-slate-900 border border-white/5 p-2 text-[10px] text-slate-400">
                        Accepted: Google Pay • PhonePe • Paytm • BHIM
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Shop Pricing Rates Editor */}
          {activeTab === 'PRICING' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-white">
                      Shop Pricing Rates Editor
                    </h3>
                    <p className="text-xs text-slate-400">
                      Custom rates per page, color upgrades, paper sizes, and binding options.
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                    Live Calculation Active
                  </span>
                </div>

                <form onSubmit={handleSavePricing} className="space-y-6">
                  {/* Category 1: Black & White Rates */}
                  <div className="rounded-2xl border border-white/5 bg-slate-800/40 p-5">
                    <h4 className="font-heading text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                      Black & White Printing (₹ / page)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 mb-1 block">
                          Single-Sided (₹)
                        </label>
                        <input
                          type="number"
                          step="0.25"
                          min="0.5"
                          max="50"
                          value={pricingRates.bwSingle}
                          onChange={(e) =>
                            setPricingRates({
                              ...pricingRates,
                              bwSingle: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">Standard A4 B&W 1 side</span>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-300 mb-1 block">
                          Double-Sided / Duplex (₹)
                        </label>
                        <input
                          type="number"
                          step="0.25"
                          min="0.5"
                          max="50"
                          value={pricingRates.bwDuplex}
                          onChange={(e) =>
                            setPricingRates({
                              ...pricingRates,
                              bwDuplex: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">A4 B&W both sides</span>
                      </div>
                    </div>
                  </div>

                  {/* Category 2: Full Color Rates */}
                  <div className="rounded-2xl border border-white/5 bg-slate-800/40 p-5">
                    <h4 className="font-heading text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                      Full Colour Printing (₹ / page)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 mb-1 block">
                          Single-Sided Color (₹)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="100"
                          value={pricingRates.colorSingle}
                          onChange={(e) =>
                            setPricingRates({
                              ...pricingRates,
                              colorSingle: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">Standard A4 Vibrant Color</span>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-300 mb-1 block">
                          Double-Sided Color / Duplex (₹)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="150"
                          value={pricingRates.colorDuplex}
                          onChange={(e) =>
                            setPricingRates({
                              ...pricingRates,
                              colorDuplex: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">A4 Vibrant Color both sides</span>
                      </div>
                    </div>
                  </div>

                  {/* Category 3: Paper Sizes & Binding */}
                  <div className="rounded-2xl border border-white/5 bg-slate-800/40 p-5">
                    <h4 className="font-heading text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
                      Paper Size Surcharges & Binding Services
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 mb-1 block">
                          A3 Paper Extra Surcharge (₹)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="50"
                          value={pricingRates.a3Surcharge}
                          onChange={(e) =>
                            setPricingRates({
                              ...pricingRates,
                              a3Surcharge: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">Added per A3 sheet</span>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-300 mb-1 block">
                          Spiral Binding Fee (₹)
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="200"
                          value={pricingRates.spiralBinding}
                          onChange={(e) =>
                            setPricingRates({
                              ...pricingRates,
                              spiralBinding: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">Per document spiral</span>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-300 mb-1 block">
                          Corner Staple Fee (₹)
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="50"
                          value={pricingRates.stapleBinding}
                          onChange={(e) =>
                            setPricingRates({
                              ...pricingRates,
                              stapleBinding: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">Corner wire staple</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={savingPricing}
                      className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                    >
                      {savingPricing ? 'Saving Changes...' : 'Save & Publish Pricing Rates'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: Payments & Cash Reconciliation */}
          {activeTab === 'REVENUE' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
                <h3 className="font-heading text-base font-bold text-white mb-4">
                  Earnings & Settlements Summary
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="rounded-2xl border border-white/5 bg-slate-800/60 p-4">
                    <span className="text-xs text-slate-400">Total Gross GMV</span>
                    <div className="font-heading text-2xl font-black text-white mt-1">
                      ₹{(shop?.totalRevenue || 0).toFixed(2)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4">
                    <span className="text-xs text-amber-300">Total Cash Collected</span>
                    <div className="font-heading text-2xl font-black text-amber-400 mt-1">
                      ₹{(shop?.cashCollected || 0).toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-400">Retained at counter</span>
                  </div>

                  <div className="rounded-2xl border border-sky-500/20 bg-sky-950/20 p-4">
                    <span className="text-xs text-sky-300">Online Escrow Collected</span>
                    <div className="font-heading text-2xl font-black text-sky-400 mt-1">
                      ₹{(shop?.onlineCollected || 0).toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-400">Weekly bank remittance</span>
                  </div>
                </div>

                {/* Ledger Transactions */}
                <h4 className="font-heading text-sm font-bold text-white mb-3">
                  Transaction Audit Log
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-500">
                      <tr>
                        <th className="py-2">Txn ID</th>
                        <th className="py-2">Order</th>
                        <th className="py-2">Customer</th>
                        <th className="py-2">Method</th>
                        <th className="py-2">Gross</th>
                        <th className="py-2">Platform Fee</th>
                        <th className="py-2">Your Earnings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {payments.map((p) => (
                        <tr key={p._id}>
                          <td className="py-2 font-mono text-[11px] text-slate-400">{p.transactionId}</td>
                          <td className="py-2 font-bold text-white">#{p.orderNumber}</td>
                          <td className="py-2">{p.customerName}</td>
                          <td className="py-2">
                            <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-semibold">
                              {p.paymentType}
                            </span>
                          </td>
                          <td className="py-2 font-bold text-white">₹{p.amount.toFixed(2)}</td>
                          <td className="py-2 text-rose-400">₹{(p.adminCommission || 0).toFixed(2)}</td>
                          <td className="py-2 font-bold text-emerald-400">₹{(p.shopEarnings || p.amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Subscription Plans & All Tiers */}
          {activeTab === 'PLAN' && (
            <div className="space-y-6">
              {/* Active Plan Overview Card */}
              <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 p-6 backdrop-blur-xl ring-1 ring-emerald-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      <h3 className="font-heading text-lg font-bold text-white">
                        Current Active Plan: {shop?.activePlan || 'Free Launch Plan'}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Cyber café platform tier, machine limits, and commission agreement.
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-4 py-1.5 text-xs font-black text-emerald-400 uppercase tracking-wider shrink-0">
                    ● ACTIVE & VERIFIED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-4">
                    <span className="text-xs font-semibold text-slate-400">Monthly Tier Fee</span>
                    <div className="font-heading text-2xl font-black text-emerald-400 mt-1">
                      {shop?.activePlan === 'Free Launch Plan' ? 'FREE (₹0)' : 'Active Plan'}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Zero monthly charges</p>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                    <span className="text-xs font-semibold text-emerald-300">Platform Commission</span>
                    <div className="font-heading text-2xl font-black text-emerald-400 mt-1">
                      0.0% Fee
                    </div>
                    <p className="text-[11px] text-emerald-300/80 mt-0.5">Keep 100% of all cash & UPI revenue</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-4">
                    <span className="text-xs font-semibold text-slate-400">Machine Fleet Limit</span>
                    <div className="font-heading text-2xl font-black text-white mt-1">
                      {printers.length} Connected
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Unlimited hardware slots enabled</p>
                  </div>
                </div>
              </div>

              {/* All Platform Plans Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-base font-bold text-white">
                      All Platform Monetization & Subscription Tiers
                    </h3>
                    <p className="text-xs text-slate-400">
                      Explore available cyber café plans configured by Super Admin.
                    </p>
                  </div>

                  <span className="text-xs text-slate-400">
                    {availablePlans.length} Plans available
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {availablePlans.map((plan) => {
                    const isCurrent = (shop?.activePlan || 'Free Launch Plan').toLowerCase() === plan.name.toLowerCase();
                    const isFree = plan.priceMonthly === 0;

                    return (
                      <div
                        key={plan._id || plan.name}
                        className={`rounded-3xl border p-5 flex flex-col justify-between transition-all ${
                          isCurrent
                            ? 'border-emerald-500/50 bg-emerald-950/20 ring-1 ring-emerald-500/30'
                            : 'border-white/10 bg-slate-900/80 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h4 className="font-heading text-sm font-bold text-white line-clamp-1">
                              {plan.name}
                            </h4>
                            {isCurrent ? (
                              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-extrabold text-emerald-400 uppercase">
                                Current
                              </span>
                            ) : plan.isPopular ? (
                              <span className="rounded-full bg-sky-500/20 border border-sky-500/30 px-2 py-0.5 text-[9px] font-bold text-sky-400">
                                Popular
                              </span>
                            ) : null}
                          </div>

                          <div className="font-heading text-2xl font-black text-white mb-3">
                            {isFree ? (
                              <span className="text-emerald-400">FREE</span>
                            ) : (
                              <>
                                ₹{plan.priceMonthly}
                                <span className="text-xs font-normal text-slate-400">/mo</span>
                              </>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-300 pb-3 mb-3 border-b border-white/5 space-y-1">
                            <div>Machines: <strong className="text-white">{plan.maxPrinters} printers</strong></div>
                            <div>Platform Fee: <strong className="text-sky-400">{plan.commissionRate}%</strong></div>
                          </div>

                          <ul className="space-y-1.5 text-[11px] text-slate-300 mb-4">
                            {(plan.features || []).map((f: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <CheckCircle2 className={`h-3 w-3 shrink-0 mt-0.5 ${isCurrent ? 'text-emerald-400' : 'text-sky-400'}`} />
                                <span className="line-clamp-2">{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-2 border-t border-white/10">
                          {isCurrent ? (
                            <button
                              disabled
                              className="w-full rounded-xl bg-emerald-500/20 border border-emerald-500/30 py-2 text-xs font-bold text-emerald-300 cursor-default"
                            >
                              ✓ Active Plan
                            </button>
                          ) : (
                            <button
                              disabled={updatingPlan}
                              onClick={async () => {
                                if (!confirm(`Switch your shop subscription to "${plan.name}"?`)) return;
                                setUpdatingPlan(true);
                                try {
                                  const res = await fetch(`/api/shops/${shopId}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ activePlan: plan.name }),
                                  });
                                  if (res.ok) {
                                    setToastMessage(`Switched to ${plan.name}`);
                                    loadDashboardData(shopId);
                                  } else {
                                    alert('Failed to update plan');
                                  }
                                } catch {
                                  alert('Error switching plan');
                                } finally {
                                  setUpdatingPlan(false);
                                }
                              }}
                              className="w-full rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 py-2 text-xs font-bold text-slate-200 transition"
                            >
                              Switch to this Plan
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>

      {/* Link Hardware Printer Modal */}
      {showAddPrinterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowAddPrinterModal(false)}
              className="absolute right-4 top-4 rounded-full bg-white/5 p-2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-heading text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Printer className="h-5 w-5 text-emerald-400" />
              Link Hardware Printer
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Configure hardware communication over local Network IP / RAW 9100 or USB spooler.
            </p>

            <form onSubmit={handleAddPrinter} className="space-y-3.5 text-xs">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                  Printer Display Name
                </label>
                <input
                  type="text"
                  required
                  value={newPrinterName}
                  onChange={(e) => setNewPrinterName(e.target.value)}
                  placeholder="e.g. Canon High Speed Color Hub"
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                  Model Specification
                </label>
                <input
                  type="text"
                  required
                  value={newPrinterModel}
                  onChange={(e) => setNewPrinterModel(e.target.value)}
                  placeholder="e.g. Canon iR 2630i Multifunction"
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Hardware Connection Mode */}
              <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-3 space-y-3">
                <div>
                  <label className="text-xs font-bold text-emerald-400 mb-1.5 block">
                    Connection Protocol
                  </label>
                  <select
                    value={newPrinterConnectionType}
                    onChange={(e: any) => setNewPrinterConnectionType(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-emerald-500"
                  >
                    <option value="NETWORK_IP">Network IP / Ethernet LAN (RAW 9100)</option>
                    <option value="USB_PORT">USB / Local Spooler (USB001 / Virtual Port)</option>
                    <option value="CLOUD_AGENT">Cloud Print Agent Pairing</option>
                  </select>
                </div>

                {newPrinterConnectionType === 'NETWORK_IP' && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                        Printer IP Address
                      </label>
                      <input
                        type="text"
                        required
                        value={newPrinterIp}
                        onChange={(e) => setNewPrinterIp(e.target.value)}
                        placeholder="192.168.1.105"
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white font-mono text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                        Port
                      </label>
                      <input
                        type="number"
                        required
                        value={newPrinterPort}
                        onChange={(e) => setNewPrinterPort(Number(e.target.value))}
                        placeholder="9100"
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white font-mono text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {newPrinterConnectionType === 'USB_PORT' && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                      USB Port / Spooler Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newPrinterUsbPort}
                      onChange={(e) => setNewPrinterUsbPort(e.target.value)}
                      placeholder="e.g. USB001 or HP_LaserJet_Pro"
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white font-mono text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">
                    Type
                  </label>
                  <select
                    value={newPrinterType}
                    onChange={(e: any) => setNewPrinterType(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
                  >
                    <option value="MONOCHROME">Black & White</option>
                    <option value="COLOR">Color + Mono</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">
                    Speed (PPM)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={newPrinterPPM}
                    onChange={(e) => setNewPrinterPPM(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 w-full rounded-2xl bg-emerald-500 py-3 text-xs font-extrabold text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition"
              >
                Deploy & Link Machine
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Printer Modal */}
      {showEditPrinterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowEditPrinterModal(false)}
              className="absolute right-4 top-4 rounded-full bg-white/5 p-2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-heading text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Pencil className="h-5 w-5 text-sky-400" />
              Edit Printer Configuration
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Update display name, model, speed, and hardware connection parameters.
            </p>

            <form onSubmit={handleUpdatePrinter} className="space-y-3.5 text-xs">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                  Printer Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editPrinterName}
                  onChange={(e) => setEditPrinterName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                  Model Specification
                </label>
                <input
                  type="text"
                  required
                  value={editPrinterModel}
                  onChange={(e) => setEditPrinterModel(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
                />
              </div>

              {/* Hardware Connection Mode */}
              <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-3 space-y-3">
                <div>
                  <label className="text-xs font-bold text-sky-400 mb-1.5 block">
                    Connection Protocol
                  </label>
                  <select
                    value={editPrinterConnectionType}
                    onChange={(e: any) => setEditPrinterConnectionType(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none focus:border-sky-500"
                  >
                    <option value="NETWORK_IP">Network IP / Ethernet LAN (RAW 9100)</option>
                    <option value="USB_PORT">USB / Local Spooler</option>
                    <option value="CLOUD_AGENT">Cloud Print Agent</option>
                  </select>
                </div>

                {editPrinterConnectionType === 'NETWORK_IP' && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                        IP Address
                      </label>
                      <input
                        type="text"
                        required
                        value={editPrinterIp}
                        onChange={(e) => setEditPrinterIp(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white font-mono text-xs outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                        Port
                      </label>
                      <input
                        type="number"
                        required
                        value={editPrinterPort}
                        onChange={(e) => setEditPrinterPort(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white font-mono text-xs outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                )}

                {editPrinterConnectionType === 'USB_PORT' && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                      USB Spooler Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editPrinterUsbPort}
                      onChange={(e) => setEditPrinterUsbPort(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white font-mono text-xs outline-none focus:border-sky-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">
                    Type
                  </label>
                  <select
                    value={editPrinterType}
                    onChange={(e: any) => setEditPrinterType(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
                  >
                    <option value="MONOCHROME">Black & White</option>
                    <option value="COLOR">Color + Mono</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">
                    Speed (PPM)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={editPrinterPPM}
                    onChange={(e) => setEditPrinterPPM(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditPrinterModal(false)}
                  className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-500 px-5 py-2 text-xs font-bold text-white hover:bg-sky-400 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
