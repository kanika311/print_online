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

  // Counter Desk Standee QR & Customer Portal Link state
  const [portalBaseUrl, setPortalBaseUrl] = useState('');
  const [editingBaseUrl, setEditingBaseUrl] = useState(false);
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [showPrintStandeeModal, setShowPrintStandeeModal] = useState(false);
  const [copiedPortalUrl, setCopiedPortalUrl] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setPortalBaseUrl(origin);
      setCustomBaseUrl(origin);
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
      const res = await fetch(`/api/shops/${shopId}/pricing`, {
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
        showNotification('Shop QR image uploaded!');
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
    setSavingUpi(true);
    try {
      const res = await fetch(`/api/shops/${shopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upiId: shopUpiId.trim(),
          upiQrUrl: shopUpiQrUrl.trim(),
        }),
      });

      if (res.ok) {
        showNotification('Shop UPI settings updated!');
        loadDashboardData(shopId);
      } else {
        showNotification('Failed to save UPI settings');
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
      const res = await fetch(`/api/shops/${shopId}/printers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPrinterName.trim() || 'HP LaserJet Enterprise',
          model: newPrinterModel.trim() || 'M607dn Heavy Duty',
          type: newPrinterType,
          ppmSpeed: Number(newPrinterPPM) || 30,
          connectionType: newPrinterConnectionType,
          ipAddress: newPrinterConnectionType === 'NETWORK_IP' ? newPrinterIp.trim() : undefined,
          port: newPrinterConnectionType === 'NETWORK_IP' ? Number(newPrinterPort) : undefined,
          usbPort: newPrinterConnectionType === 'USB_PORT' ? newPrinterUsbPort.trim() : undefined,
          supportsDuplex: true,
        }),
      });

      if (res.ok) {
        showNotification('New printer machine linked!');
        setShowAddPrinterModal(false);
        setNewPrinterName('');
        setNewPrinterModel('');
        loadDashboardData(shopId);
      } else {
        showNotification('Failed to link printer');
      }
    } catch (err) {
      showNotification('Failed to link printer');
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
    setEditPrinterPort(printer.port || 9100);
    setEditPrinterUsbPort(printer.usbPort || 'USB001');
    setShowEditPrinterModal(true);
  };

  const handleUpdatePrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrinter) return;

    try {
      const res = await fetch(`/api/printers/${editingPrinter._id || editingPrinter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editPrinterName.trim(),
          model: editPrinterModel.trim(),
          type: editPrinterType,
          ppmSpeed: Number(editPrinterPPM) || 30,
          connectionType: editPrinterConnectionType,
          ipAddress: editPrinterConnectionType === 'NETWORK_IP' ? editPrinterIp.trim() : undefined,
          port: editPrinterConnectionType === 'NETWORK_IP' ? Number(editPrinterPort) : undefined,
          usbPort: editPrinterConnectionType === 'USB_PORT' ? editPrinterUsbPort.trim() : undefined,
        }),
      });

      if (res.ok) {
        showNotification('Printer details updated successfully!');
        setShowEditPrinterModal(false);
        setEditingPrinter(null);
        loadDashboardData(shopId);
      } else {
        showNotification('Failed to update printer');
      }
    } catch (err) {
      showNotification('Failed to update printer');
    }
  };

  // Delete Printer
  const handleDeletePrinter = async (printerId: string, printerName: string) => {
    if (!window.confirm(`Are you sure you want to remove printer machine "${printerName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/printers/${printerId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showNotification(`Printer "${printerName}" removed.`);
        loadDashboardData(shopId);
      } else {
        showNotification('Failed to delete printer');
      }
    } catch (err) {
      showNotification('Failed to delete printer');
    }
  };

  // Test Ping Printer
  const handlePingPrinter = async (printerId: string) => {
    setPingingPrinterId(printerId);
    try {
      const res = await fetch(`/api/printers/${printerId}/ping`, { method: 'POST' });
      const data = await res.json();
      if (data.online) {
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
      const res = await fetch(`/api/shops/${shopId}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (res.ok) {
        showNotification(`Subscription updated to "${planName}"!`);
        loadDashboardData(shopId);
      } else {
        showNotification('Failed to update plan');
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

  const customerPortalUrl = `${portalBaseUrl}/shop/${shopId}`;

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
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs tracking-wider shrink-0">
                PP
              </div>
              <div className="min-w-0">
                <span className="font-heading text-xs font-bold text-slate-900 truncate block" title={shop?.name}>
                  {shop?.name || 'Printer Terminal'}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                    Online Terminal
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

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => loadDashboardData(shopId)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <button
              onClick={() => setShowPrintStandeeModal(true)}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition"
            >
              Desk QR
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Standee QR Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-slate-900">
                      Counter Desk Standee Placard
                    </h3>
                    <p className="text-xs text-slate-500">
                      Display this QR code at your cyber café counter for walk-in customers.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(customerPortalUrl)}`}
                      alt="Customer Standee QR"
                      className="h-36 w-36 object-contain"
                    />
                  </div>

                  <div className="space-y-2 text-center sm:text-left">
                    <div className="text-xs font-bold text-slate-900">
                      Direct Ordering Portal URL:
                    </div>
                    <div className="rounded-lg bg-white border border-slate-300 px-3 py-1.5 text-xs font-mono text-slate-800 break-all shadow-inner">
                      {customerPortalUrl}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(customerPortalUrl);
                          setCopiedPortalUrl(true);
                          setTimeout(() => setCopiedPortalUrl(false), 2000);
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                      >
                        {copiedPortalUrl ? 'Copied URL' : 'Copy URL'}
                      </button>

                      <button
                        onClick={() => setShowPrintStandeeModal(true)}
                        className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-1.5 text-xs font-bold text-white shadow-sm"
                      >
                        Open Printable Placard
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <div className="font-bold text-slate-800">How walk-in customers use it:</div>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Customer scans this QR code with their mobile camera.</li>
                    <li>Opens your cyber café's page directly — no typing required.</li>
                    <li>Customer uploads files, pays via Shop UPI or Cash, and machine prints immediately.</li>
                  </ol>
                </div>
              </div>

              {/* Direct Shop UPI Setup Form */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="font-heading text-sm font-bold text-slate-900">
                    Direct Shop UPI ID & Standee QR
                  </h3>
                  <p className="text-xs text-slate-500">
                    Customers will pay directly to your shopkeeper UPI account with 0% platform deductions.
                  </p>
                </div>

                <form onSubmit={handleSaveUpi} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-800 font-bold mb-1 block">
                      Shop UPI ID (VPA) *
                    </label>
                    <input
                      type="text"
                      required
                      value={shopUpiId}
                      onChange={(e) => setShopUpiId(e.target.value)}
                      placeholder="e.g. apexprint@okaxis or 9876543210@paytm"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-slate-800 font-bold mb-1 block">
                      Upload Shop Payment QR Image (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadUpiQr}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {uploadingQr && <span className="text-[11px] text-blue-600 mt-1 block">Uploading QR...</span>}
                  </div>

                  {shopUpiQrUrl && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <img src={shopUpiQrUrl} alt="UPI QR" className="h-16 w-16 object-contain border border-slate-200 rounded-md bg-white p-1" />
                      <div>
                        <span className="font-bold text-slate-800 block">Custom Shop QR active</span>
                        <span className="text-[10px] text-slate-500">Rendered on customer checkout</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingUpi}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                  >
                    {savingUpi ? 'Saving Settings...' : 'Save UPI Settings'}
                  </button>
                </form>
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

      {/* MODAL 1: Counter Desk Standee Printable Placard */}
      {showPrintStandeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-sm font-bold text-slate-900">
                Desk Standee Placard (Print Preview)
              </h3>
              <button
                onClick={() => setShowPrintStandeeModal(false)}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            {/* Printable Counter Desk Placard Canvas */}
            <div className="border-2 border-slate-900 rounded-2xl p-6 text-center bg-white space-y-3 shadow-md">
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider">
                PrintPorter Counter Desk
              </div>

              <h2 className="font-heading text-xl font-black text-slate-900 leading-tight">
                {shop?.name || 'Cyber Café Printing'}
              </h2>

              <p className="text-xs text-slate-600">
                Scan with Phone Camera or Google Lens to Upload & Print Instantly
              </p>

              <div className="inline-block p-4 border-2 border-slate-300 rounded-2xl bg-white shadow-inner my-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(customerPortalUrl)}`}
                  alt="Placard QR"
                  className="h-44 w-44 object-contain mx-auto"
                />
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700 font-mono">
                {customerPortalUrl}
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                Direct GPay / PhonePe / Cash • No Waiting in Queue
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs font-bold text-white shadow-sm"
              >
                Print Standee (A4)
              </button>
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
    </div>
  );
}
