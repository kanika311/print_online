'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Printer,
  Users,
  Store,
  FileText,
  DollarSign,
  TrendingUp,
  Plus,
  QrCode,
  Download,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Search,
  Lock,
  Unlock,
  RefreshCw,
  LogOut,
  Sparkles,
  Layers,
  X,
  Copy,
  Check,
  Pencil,
  Trash2,
} from 'lucide-react';
import QRCodeCard from '@/components/QRCodeCard';

export default function KhushiAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SHOPS' | 'USERS' | 'ORDERS' | 'PLANS' | 'PAYMENTS'>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Platform Data
  const [analytics, setAnalytics] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Modals
  const [showRegisterShopModal, setShowRegisterShopModal] = useState(false);
  const [newCredentialsNotice, setNewCredentialsNotice] = useState<any>(null);
  const [selectedQRShop, setSelectedQRShop] = useState<any>(null);

  // Shop Registration Form
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('Shop@123');
  const [shopAddress, setShopAddress] = useState('');
  const [activePlan, setActivePlan] = useState('Free Launch Plan');

  // New Plan Modal Form
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState(1499);
  const [planPrinters, setPlanPrinters] = useState(5);
  const [planCommission, setPlanCommission] = useState(3.0);
  const [planFeatures, setPlanFeatures] = useState('');

  // Edit Plan Form State
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [editPlanId, setEditPlanId] = useState('');
  const [editPlanName, setEditPlanName] = useState('');
  const [editPlanPrice, setEditPlanPrice] = useState(0);
  const [editPlanPrinters, setEditPlanPrinters] = useState(5);
  const [editPlanCommission, setEditPlanCommission] = useState(3.0);
  const [editPlanFeatures, setEditPlanFeatures] = useState('');

  // Verify Admin Session
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then((data) => {
        if (data.authenticated && data.user.role === 'ADMIN') {
          loadAllData();
        } else {
          router.push('/khushi-admin/login');
        }
      })
      .catch(() => {
        router.push('/khushi-admin/login');
      });
  }, []);

  const loadAllData = async () => {
    setRefreshing(true);
    try {
      const [analyticsRes, shopsRes, usersRes, ordersRes, plansRes, paymentsRes] =
        await Promise.all([
          fetch('/api/analytics'),
          fetch('/api/shops'),
          fetch('/api/users'),
          fetch('/api/orders'),
          fetch('/api/plans'),
          fetch('/api/payments'),
        ]);

      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (shopsRes.ok) {
        const sData = await shopsRes.json();
        setShops(sData.shops || []);
      }
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData.users || []);
      }
      if (ordersRes.ok) {
        const oData = await ordersRes.json();
        setOrders(oData.orders || []);
      }
      if (plansRes.ok) {
        const plData = await plansRes.json();
        setPlans(plData.plans || []);
      }
      if (paymentsRes.ok) {
        const pyData = await paymentsRes.json();
        setPayments(pyData.payments || []);
      }
    } catch (e) {
      console.warn('Error loading admin data:', e);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Register New Printer Shop and Generate Owner Credentials
  const handleRegisterShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: shopName,
          ownerName,
          ownerEmail,
          ownerPhone,
          ownerPassword,
          address: shopAddress,
          activePlan,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to register shop');
        return;
      }

      setNewCredentialsNotice(data.credentials);
      setShowRegisterShopModal(false);
      // Reset form
      setShopName('');
      setOwnerName('');
      setOwnerEmail('');
      setOwnerPhone('');
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error creating shop');
    }
  };

  // Block/Unblock User
  const handleToggleBlockUser = async (userId: string, currentBlocked: boolean) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isBlocked: !currentBlocked }),
      });

      if (res.ok) {
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Activate/Deactivate Shop
  const handleToggleShopActive = async (shopId: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/shops', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, isActive: !currentActive }),
      });

      if (res.ok) {
        loadAllData();
      }
    } catch (e) {
      console.error('Error toggling shop status:', e);
    }
  };

  // Add Subscription Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const customFeatures = planFeatures
        ? planFeatures.split('\n').map((f) => f.trim()).filter(Boolean)
        : [
            `Up to ${planPrinters} connected printers`,
            `Platform commission ${planCommission}%`,
            'High-speed cloud spooler sync',
            'Counter QR code suite',
          ];

      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planName,
          priceMonthly: planPrice,
          priceYearly: planPrice * 10,
          maxPrinters: planPrinters,
          commissionRate: planCommission,
          features: customFeatures,
        }),
      });

      if (res.ok) {
        setShowAddPlanModal(false);
        setPlanName('');
        setPlanFeatures('');
        loadAllData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to create plan');
      }
    } catch (e: any) {
      alert(e.message || 'Error creating plan');
    }
  };

  // Open Edit Plan Modal
  const handleOpenEditPlan = (plan: any) => {
    setEditPlanId(plan._id);
    setEditPlanName(plan.name);
    setEditPlanPrice(plan.priceMonthly || 0);
    setEditPlanPrinters(plan.maxPrinters || 5);
    setEditPlanCommission(plan.commissionRate || 0);
    setEditPlanFeatures((plan.features || []).join('\n'));
    setShowEditPlanModal(true);
  };

  // Submit Edit Plan
  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const featuresArray = editPlanFeatures
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      const res = await fetch('/api/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editPlanId,
          name: editPlanName,
          priceMonthly: editPlanPrice,
          priceYearly: editPlanPrice * 10,
          maxPrinters: editPlanPrinters,
          commissionRate: editPlanCommission,
          features: featuresArray,
        }),
      });

      if (res.ok) {
        setShowEditPlanModal(false);
        loadAllData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update plan');
      }
    } catch (e: any) {
      alert(e.message || 'Error updating plan');
    }
  };

  // Delete Plan
  const handleDeletePlan = async (planId: string, planName: string) => {
    if (!confirm(`Are you sure you want to delete the plan "${planName}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/plans?id=${planId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadAllData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete plan');
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting plan');
    }
  };

  const handleLogout = () => {
    document.cookie = 'printporter_token=; Max-Age=0; path=/;';
    router.push('/khushi-admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex flex-col items-center justify-center text-slate-400">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent mb-4" />
        <p className="text-sm">Loading Admin Command Center...</p>
      </div>
    );
  }

  const kpis = analytics?.kpis || {};

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0e17] text-slate-100">
      {/* Admin Top Header */}
      <header className="border-b border-white/10 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/30">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg font-black text-white">
                  Super Admin CMS
                </span>
                <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                  Root Control
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Master management of shops, credentials, plans, and revenue
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/25 transition"
            >
              <span>User App</span>
            </Link>

            <Link
              href="/printer/dashboard"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition"
            >
              <span>Printer Terminal</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/25 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Generated Credentials Alert Modal */}
      {newCredentialsNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-emerald-500/40 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setNewCredentialsNotice(null)}
              className="absolute right-4 top-4 rounded-full bg-white/5 p-2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  Shop Owner Account Created!
                </h3>
                <p className="text-xs text-slate-400">
                  Provide these credentials to the cyber café owner
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-4 space-y-3 font-mono text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block font-sans">
                  Owner Email
                </span>
                <span className="text-white font-bold">{newCredentialsNotice.email}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block font-sans">
                  Generated Password
                </span>
                <span className="text-emerald-400 font-bold">{newCredentialsNotice.password}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block font-sans">
                  Owner Terminal URL
                </span>
                <span className="text-sky-400 truncate block">/printer/login</span>
              </div>
            </div>

            <button
              onClick={() => setNewCredentialsNotice(null)}
              className="mt-6 w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
            >
              Done & Save Credentials
            </button>
          </div>
        </div>
      )}

      {/* Main Admin Content */}
      <main className="flex-1 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {/* Executive Overview KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
              <span className="text-xs text-slate-400">Platform GMV</span>
              <div className="font-heading text-3xl font-black text-white mt-1">
                ₹{(kpis.totalRevenue || 23400).toFixed(2)}
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold mt-0.5 block">
                Total Orders Value
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
              <span className="text-xs text-slate-400">Registered Cyber Cafes</span>
              <div className="font-heading text-3xl font-black text-sky-400 mt-1">
                {shops.length} Hubs
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {kpis.availablePrinters || 2} active printers online
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
              <span className="text-xs text-slate-400">Registered Users</span>
              <div className="font-heading text-3xl font-black text-purple-400 mt-1">
                {users.length} Users
              </div>
              <span className="text-[11px] text-purple-400 mt-0.5 block">
                Customers & Shop Owners
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
              <span className="text-xs text-slate-400">Total Print Jobs</span>
              <div className="font-heading text-3xl font-black text-emerald-400 mt-1">
                {orders.length} Orders
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {kpis.totalPagesPrinted || 48} pages processed
              </span>
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="flex border-b border-white/10 mb-6 space-x-6 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`pb-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'OVERVIEW'
                  ? 'border-purple-400 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Platform Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('SHOPS')}
              className={`pb-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'SHOPS'
                  ? 'border-purple-400 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Store className="h-4 w-4" />
              <span>Printer Shops ({shops.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('USERS')}
              className={`pb-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'USERS'
                  ? 'border-purple-400 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>User Accounts ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ORDERS')}
              className={`pb-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'ORDERS'
                  ? 'border-purple-400 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Master Orders Log ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('PLANS')}
              className={`pb-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'PLANS'
                  ? 'border-purple-400 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Subscription Plans ({plans.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('PAYMENTS')}
              className={`pb-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'PAYMENTS'
                  ? 'border-purple-400 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>Cash & Online Ledger</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
                <h3 className="font-heading text-base font-bold text-white mb-4">
                  7-Day Platform Revenue & Order Volume
                </h3>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {(analytics?.revenueTrend || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="text-[10px] text-slate-400 mb-1">₹{item.revenue}</div>
                      <div className="w-full bg-slate-800 rounded-t-lg h-32 flex items-end justify-center p-1">
                        <div
                          className="w-full rounded bg-gradient-to-t from-sky-500 to-purple-500 transition-all"
                          style={{
                            height: `${Math.min(100, Math.max(20, (item.revenue / 2000) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs font-bold text-slate-300 mt-2">{item.day}</div>
                      <div className="text-[10px] text-slate-500">{item.orders} orders</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setShowRegisterShopModal(true)}
                  className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-5 text-left hover:bg-purple-950/30 transition flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-heading text-sm font-bold text-white">
                      + Register New Printer Shop
                    </h4>
                    <p className="text-xs text-purple-300 mt-0.5">
                      Onboard partner café, generate owner credentials and instant desk QR code
                    </p>
                  </div>
                  <Store className="h-6 w-6 text-purple-400 shrink-0" />
                </button>

                <button
                  onClick={() => setShowAddPlanModal(true)}
                  className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-5 text-left hover:bg-sky-950/30 transition flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-heading text-sm font-bold text-white">
                      + Create New Subscription Plan
                    </h4>
                    <p className="text-xs text-sky-300 mt-0.5">
                      Configure monthly tiers, machine allowances, and commission rates
                    </p>
                  </div>
                  <Layers className="h-6 w-6 text-sky-400 shrink-0" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PRINTER SHOPS & QR GENERATOR */}
          {activeTab === 'SHOPS' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-base font-bold text-white">
                    Registered Printer Shops & Cyber Hubs
                  </h3>
                  <p className="text-xs text-slate-400">
                    Manage active shops, generate desk QR codes, and review operational status
                  </p>
                </div>

                <button
                  onClick={() => setShowRegisterShopModal(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Register Shop</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shops.map((shop) => {
                  const isActive = shop.isActive !== false;
                  return (
                    <div
                      key={shop._id || shop.id}
                      className="glass-card rounded-3xl p-5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-heading text-sm font-bold text-white line-clamp-1">
                            {shop.name}
                          </h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isActive
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                          {shop.address}
                        </p>

                        <div className="space-y-1 text-xs text-slate-300 mb-4">
                          <div>Plan: <strong className="text-sky-400">{shop.activePlan}</strong></div>
                          <div>Printers: <strong className="text-white">{shop.totalPrinters || 2}</strong></div>
                          <div>Total Revenue: <strong className="text-emerald-400">₹{(shop.totalRevenue || 0).toFixed(2)}</strong></div>
                        </div>
                      </div>

                      {/* QR Code & Activation Action */}
                      <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedQRShop(shop)}
                          className="flex items-center gap-1.5 rounded-xl bg-sky-500/20 border border-sky-500/30 px-3 py-1.5 text-xs font-bold text-sky-400 hover:bg-sky-500/30 transition"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          <span>QR</span>
                        </button>

                        <button
                          onClick={() => handleToggleShopActive(shop._id || shop.id, isActive)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition border ${
                            isActive
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        <Link
                          href={`/shop/${shop._id || shop.id}`}
                          target="_blank"
                          className="text-xs font-semibold text-slate-400 hover:text-white"
                        >
                          Open →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: USER MANAGEMENT */}
          {activeTab === 'USERS' && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
              <h3 className="font-heading text-base font-bold text-white mb-4">
                Platform Users ({users.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-2.5">Name</th>
                      <th className="py-2.5">Email</th>
                      <th className="py-2.5">Phone</th>
                      <th className="py-2.5">Role</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="py-2.5 font-bold text-white">{u.name}</td>
                        <td className="py-2.5">{u.email}</td>
                        <td className="py-2.5">{u.phone}</td>
                        <td className="py-2.5">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-500/20 text-purple-400'
                                : u.role === 'SHOP_OWNER'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-sky-500/20 text-sky-400'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5">
                          {u.isBlocked ? (
                            <span className="text-rose-400 font-semibold">Suspended</span>
                          ) : (
                            <span className="text-emerald-400 font-semibold">Active</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleToggleBlockUser(u.id, u.isBlocked)}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                                u.isBlocked
                                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                              }`}
                            >
                              {u.isBlocked ? 'Reactivate' : 'Suspend'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: MASTER ORDERS LOG */}
          {activeTab === 'ORDERS' && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
              <h3 className="font-heading text-base font-bold text-white mb-4">
                Master Platform Print Orders Log ({orders.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-2.5">Order</th>
                      <th className="py-2.5">Shop</th>
                      <th className="py-2.5">Customer</th>
                      <th className="py-2.5">Document</th>
                      <th className="py-2.5">Amount</th>
                      <th className="py-2.5">Payment</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.map((o) => (
                      <tr key={o._id}>
                        <td className="py-2.5 font-bold text-white">#{o.orderNumber}</td>
                        <td className="py-2.5 font-semibold text-sky-400">{o.shopName}</td>
                        <td className="py-2.5">{o.customerName}</td>
                        <td className="py-2.5 truncate max-w-[180px]">{o.fileName}</td>
                        <td className="py-2.5 font-bold text-white">₹{o.totalPrice.toFixed(2)}</td>
                        <td className="py-2.5">
                          <span className="rounded bg-white/5 px-2 py-0.5 text-[10px]">
                            {o.paymentType} ({o.paymentStatus})
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              o.status === 'COMPLETED'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : o.status === 'PRINTING'
                                ? 'bg-cyan-500/20 text-cyan-400 animate-pulse'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: PLANS & SUBSCRIPTION MANAGEMENT */}
          {activeTab === 'PLANS' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-base font-bold text-white">
                    Subscription & Future Plans
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tiered cyber café partner monetization plans
                  </p>
                </div>

                <button
                  onClick={() => setShowAddPlanModal(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Tier Plan</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const isFreeLaunch = plan.name === 'Free Launch Plan' || plan.priceMonthly === 0;
                  return (
                    <div
                      key={plan._id}
                      className={`glass-card rounded-3xl p-6 flex flex-col justify-between transition ${
                        isFreeLaunch
                          ? 'border-emerald-500/40 bg-emerald-950/20 ring-1 ring-emerald-500/30'
                          : 'border-white/10'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <h4 className="font-heading text-lg font-bold text-white line-clamp-1">
                            {plan.name}
                          </h4>
                          {isFreeLaunch ? (
                            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider shrink-0">
                              Active For All Shops
                            </span>
                          ) : plan.isPopular ? (
                            <span className="rounded-full bg-sky-500/20 border border-sky-500/30 px-2 py-0.5 text-[10px] font-bold text-sky-400 shrink-0">
                              Popular
                            </span>
                          ) : null}
                        </div>

                        <div className="font-heading text-3xl font-black text-white mb-4">
                          {plan.priceMonthly === 0 ? (
                            <span className="text-emerald-400">FREE</span>
                          ) : (
                            <>
                              ₹{plan.priceMonthly}{' '}
                              <span className="text-xs text-slate-400 font-normal">/ month</span>
                            </>
                          )}
                        </div>

                        <ul className="space-y-2 text-xs text-slate-300 mb-6">
                          {(plan.features || []).map((feat: string, i: number) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${isFreeLaunch ? 'text-emerald-400' : 'text-sky-400'}`} />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-[11px] text-slate-400">
                          Limit: <strong className="text-white">{plan.maxPrinters} printers</strong> • Fee:{' '}
                          <strong className="text-sky-400">{plan.commissionRate}%</strong>
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditPlan(plan)}
                            className="flex items-center gap-1 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/20 hover:text-white transition"
                            title="Edit Plan"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDeletePlan(plan._id, plan.name)}
                            className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:text-white transition"
                            title="Delete Plan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: PAYMENTS & RECONCILIATION */}
          {activeTab === 'PAYMENTS' && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
              <h3 className="font-heading text-base font-bold text-white mb-4">
                Platform Cash & Online Reconciliation Ledger
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-2.5">Txn ID</th>
                      <th className="py-2.5">Shop</th>
                      <th className="py-2.5">Order</th>
                      <th className="py-2.5">Customer</th>
                      <th className="py-2.5">Method</th>
                      <th className="py-2.5">Amount</th>
                      <th className="py-2.5">Admin Cut</th>
                      <th className="py-2.5">Shop Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td className="py-2.5 font-mono text-[11px] text-slate-400">{p.transactionId}</td>
                        <td className="py-2.5 font-semibold text-white">{p.shopName}</td>
                        <td className="py-2.5 font-bold text-sky-400">#{p.orderNumber}</td>
                        <td className="py-2.5">{p.customerName}</td>
                        <td className="py-2.5">
                          <span className="rounded bg-white/5 px-2 py-0.5 text-[10px]">
                            {p.paymentType}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold text-white">₹{p.amount.toFixed(2)}</td>
                        <td className="py-2.5 text-purple-400 font-semibold">₹{(p.adminCommission || 0).toFixed(2)}</td>
                        <td className="py-2.5 text-emerald-400 font-semibold">₹{(p.shopEarnings || p.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Register Shop Modal */}
      {showRegisterShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowRegisterShopModal(false)}
              className="absolute right-4 top-4 rounded-full bg-white/5 p-2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-heading text-lg font-bold text-white mb-1">
              Register New Cyber Café & Generate Owner Credentials
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Creates the shop record, generates QR code, and generates shop-owner login credentials.
            </p>

            <form onSubmit={handleRegisterShop} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Shop Name</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Apex Digital Print & Cyber Cafe"
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Physical Address</label>
                <input
                  type="text"
                  required
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="e.g. Shop 14, Commercial Complex, Sector 18, Noida"
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Owner Full Name</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Owner Phone</label>
                  <input
                    type="tel"
                    required
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="+91 98111 22334"
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Owner Email (Login ID)</label>
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@cyberprint.com"
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Temporary Password</label>
                  <input
                    type="text"
                    required
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Assigned Subscription Plan</label>
                <select
                  value={activePlan}
                  onChange={(e) => setActivePlan(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                >
                  <option value="Free Launch Plan">Free Launch Plan (100% Free - Launch Phase)</option>
                  <option value="Starter Cyber Café">Starter Cyber Café (2 Printers, 5% fee)</option>
                  <option value="Pro Cyber Cafe">Pro Cyber Cafe (6 Printers, 3% fee)</option>
                  <option value="Enterprise Print Network">Enterprise Print Network (25 Printers, 1.5% fee)</option>
                </select>
              </div>

              <button
                type="submit"
                className="mt-6 w-full rounded-xl bg-purple-600 py-3 text-xs font-bold text-white hover:bg-purple-500 transition"
              >
                Register Shop & Generate Credentials
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Subscription Plan Modal */}
      {showAddPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowAddPlanModal(false)}
              className="absolute right-4 top-4 rounded-full bg-white/5 p-2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-heading text-lg font-bold text-white mb-1">
              Add New Subscription Plan
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Configure monetization tier, printer quotas, and platform fees.
            </p>

            <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Plan Name</label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. Campus Special Hub"
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Monthly Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={planPrice}
                    onChange={(e) => setPlanPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Max Printers</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={planPrinters}
                    onChange={(e) => setPlanPrinters(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Platform Commission Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={50}
                  value={planCommission}
                  onChange={(e) => setPlanCommission(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Features (One per line)</label>
                <textarea
                  rows={3}
                  value={planFeatures}
                  onChange={(e) => setPlanFeatures(e.target.value)}
                  placeholder="Up to 4 connected printers&#10;Direct Shop UPI payments&#10;Priority 24/7 support"
                  className="w-full rounded-xl border border-white/10 bg-slate-800 p-2.5 text-white outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                className="mt-4 w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-500 transition"
              >
                Create & Publish Plan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subscription Plan Modal */}
      {showEditPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowEditPlanModal(false)}
              className="absolute right-4 top-4 rounded-full bg-white/5 p-2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-heading text-lg font-bold text-white mb-1">
              Edit Subscription Plan
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Update pricing, machine limits, and features for this plan.
            </p>

            <form onSubmit={handleUpdatePlan} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Plan Name</label>
                <input
                  type="text"
                  required
                  value={editPlanName}
                  onChange={(e) => setEditPlanName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Monthly Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editPlanPrice}
                    onChange={(e) => setEditPlanPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Max Printers</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editPlanPrinters}
                    onChange={(e) => setEditPlanPrinters(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Platform Commission Fee (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={50}
                  value={editPlanCommission}
                  onChange={(e) => setEditPlanCommission(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Features (One per line)</label>
                <textarea
                  rows={4}
                  value={editPlanFeatures}
                  onChange={(e) => setEditPlanFeatures(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 p-2.5 text-white outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditPlanModal(false)}
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

      {/* View/Download Shop QR Modal */}
      {selectedQRShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-sm">
            <button
              onClick={() => setSelectedQRShop(null)}
              className="absolute -top-12 right-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>

            <QRCodeCard
              shopId={selectedQRShop._id || selectedQRShop.id}
              shopName={selectedQRShop.name}
              address={selectedQRShop.address}
              phone={selectedQRShop.phone}
              qrDataUrl={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                `${typeof window !== 'undefined' ? window.location.origin : ''}/shop/${selectedQRShop._id || selectedQRShop.id}`
              )}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
