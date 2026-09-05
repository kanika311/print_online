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
  Settings,
  UserCheck,
  Percent,
  Coins,
  BadgePercent,
  ShieldAlert,
  ChevronRight,
  Menu,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import QRCodeCard from '@/components/QRCodeCard';

type AdminTab =
  | 'OVERVIEW'
  | 'SHOPS'
  | 'ORDERS'
  | 'PLANS'
  | 'PLATFORM_FEES'
  | 'PAYMENTS'
  | 'USERS'
  | 'ADMINS';

export default function KhushiAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Platform Data
  const [analytics, setAnalytics] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [adminList, setAdminList] = useState<any[]>([]);

  // Platform Fee Settings State
  const [platformFeeEnabled, setPlatformFeeEnabled] = useState(false);
  const [platformFeeType, setPlatformFeeType] = useState<'FLAT' | 'PERCENT'>('FLAT');
  const [platformFeeAmount, setPlatformFeeAmount] = useState(0);
  const [platformFeeLabel, setPlatformFeeLabel] = useState('Platform Convenience Fee');
  const [savingFeeSettings, setSavingFeeSettings] = useState(false);

  // Admin Profile & Change Password State
  const [adminProfileName, setAdminProfileName] = useState('');
  const [adminProfileEmail, setAdminProfileEmail] = useState('');
  const [adminProfilePhone, setAdminProfilePhone] = useState('');
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [savingAdminProfile, setSavingAdminProfile] = useState(false);

  // Create New Admin Modal Form State
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('Admin@2026');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [newAdminCredentialsNotice, setNewAdminCredentialsNotice] = useState<any>(null);

  // Shop Modals
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

  // Edit Shop Form State
  const [showEditShopModal, setShowEditShopModal] = useState(false);
  const [editShopId, setEditShopId] = useState('');
  const [editShopName, setEditShopName] = useState('');
  const [editShopAddress, setEditShopAddress] = useState('');
  const [editShopPhone, setEditShopPhone] = useState('');
  const [editShopPlan, setEditShopPlan] = useState('');
  const [editShopStartingPrice, setEditShopStartingPrice] = useState(2);
  const [editShopUpiId, setEditShopUpiId] = useState('');

  // Plans Modal Forms
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAllData = async () => {
    setRefreshing(true);
    try {
      const [
        analyticsRes,
        shopsRes,
        usersRes,
        ordersRes,
        plansRes,
        paymentsRes,
        settingsRes,
        adminProfileRes,
      ] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/shops'),
        fetch('/api/users'),
        fetch('/api/orders'),
        fetch('/api/plans'),
        fetch('/api/payments'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/profile'),
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
      if (settingsRes.ok) {
        const stData = await settingsRes.json();
        if (stData.settings) {
          setPlatformFeeEnabled(Boolean(stData.settings.platformFeeEnabled));
          setPlatformFeeType(stData.settings.platformFeeType || 'FLAT');
          setPlatformFeeAmount(Number(stData.settings.platformFeeAmount) || 0);
          setPlatformFeeLabel(stData.settings.platformFeeLabel || 'Platform Convenience Fee');
        }
      }
      if (adminProfileRes.ok) {
        const adData = await adminProfileRes.json();
        if (adData.currentAdmin) {
          setCurrentAdmin(adData.currentAdmin);
          setAdminProfileName(adData.currentAdmin.name);
          setAdminProfileEmail(adData.currentAdmin.email);
          setAdminProfilePhone(adData.currentAdmin.phone || '');
        }
        if (adData.admins) {
          setAdminList(adData.admins);
        }
      }
    } catch (e) {
      console.warn('Error loading admin data:', e);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // 1. Save Platform Monetization / Fee Settings
  const handleSaveFeeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFeeSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformFeeEnabled,
          platformFeeType,
          platformFeeAmount: Number(platformFeeAmount),
          platformFeeLabel,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Platform fee configuration updated successfully!');
      } else {
        alert(data.error || 'Failed to update platform fees');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating settings');
    } finally {
      setSavingFeeSettings(false);
    }
  };

  // 2. Change Admin Profile & Password
  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminNewPassword && adminNewPassword !== adminConfirmPassword) {
      alert('New password and confirm password do not match');
      return;
    }

    setSavingAdminProfile(true);
    try {
      const payload: any = {
        name: adminProfileName,
        email: adminProfileEmail,
        phone: adminProfilePhone,
      };

      if (adminNewPassword) {
        payload.currentPassword = adminCurrentPassword;
        payload.newPassword = adminNewPassword;
      }

      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Admin credentials updated successfully!');
        setAdminCurrentPassword('');
        setAdminNewPassword('');
        setAdminConfirmPassword('');
        loadAllData();
      } else {
        alert(data.error || 'Failed to update admin profile');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating profile');
    } finally {
      setSavingAdminProfile(false);
    }
  };

  // 3. Create New Admin Account
  const handleCreateNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAdmin(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAdminName,
          email: newAdminEmail,
          phone: newAdminPhone,
          password: newAdminPassword,
          role: 'ADMIN',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNewAdminCredentialsNotice({
          name: newAdminName,
          email: newAdminEmail,
          password: newAdminPassword,
        });
        setShowCreateAdminModal(false);
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPhone('');
        showToast('New Administrator account created!');
        loadAllData();
      } else {
        alert(data.error || 'Failed to create admin');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating admin');
    } finally {
      setCreatingAdmin(false);
    }
  };

  // 4. Shop Handlers
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
      setShopName('');
      setOwnerName('');
      setOwnerEmail('');
      setOwnerPhone('');
      setShopAddress('');
      loadAllData();
    } catch (e: any) {
      alert(e.message || 'Error registering shop');
    }
  };

  const handleOpenEditShop = (shop: any) => {
    setEditShopId(shop._id || shop.id);
    setEditShopName(shop.name || '');
    setEditShopAddress(shop.address || '');
    setEditShopPhone(shop.phone || '');
    setEditShopPlan(shop.activePlan || 'Free Launch Plan');
    setEditShopStartingPrice(shop.startingPrice || 2);
    setEditShopUpiId(shop.upiId || '');
    setShowEditShopModal(true);
  };

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/shops/${editShopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editShopName,
          address: editShopAddress,
          phone: editShopPhone,
          activePlan: editShopPlan,
          startingPrice: Number(editShopStartingPrice),
          upiId: editShopUpiId,
        }),
      });
      if (res.ok) {
        setShowEditShopModal(false);
        showToast('Shop details updated!');
        loadAllData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update shop');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating shop');
    }
  };

  const handleDeleteShop = async (shopId: string, shopTitle: string) => {
    if (!confirm(`Are you sure you want to permanently delete the shop "${shopTitle}" and all its connected printers?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/shops/${shopId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Shop deleted successfully');
        loadAllData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete shop');
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting shop');
    }
  };

  const handleToggleShopActive = async (shopId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/shops/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  // 5. User Handlers
  const handleToggleBlockUser = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isBlocked: !currentStatus }),
      });
      if (res.ok) loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${userName}"?`)) return;
    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('User removed');
        loadAllData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete user');
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting user');
    }
  };

  // 6. Plans Handlers
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planName,
          priceMonthly: Number(planPrice),
          priceYearly: Number(planPrice) * 10,
          maxPrinters: Number(planPrinters),
          commissionRate: Number(planCommission),
          features: planFeatures.split('\n').filter((f) => f.trim().length > 0),
        }),
      });

      if (res.ok) {
        setShowAddPlanModal(false);
        setPlanName('');
        setPlanFeatures('');
        showToast('New subscription plan published!');
        loadAllData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to create plan');
      }
    } catch (e: any) {
      alert(e.message || 'Error creating plan');
    }
  };

  const handleOpenEditPlan = (plan: any) => {
    setEditPlanId(plan._id);
    setEditPlanName(plan.name);
    setEditPlanPrice(plan.priceMonthly || 0);
    setEditPlanPrinters(plan.maxPrinters || 5);
    setEditPlanCommission(plan.commissionRate || 3.0);
    setEditPlanFeatures((plan.features || []).join('\n'));
    setShowEditPlanModal(true);
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editPlanId,
          name: editPlanName,
          priceMonthly: Number(editPlanPrice),
          priceYearly: Number(editPlanPrice) * 10,
          maxPrinters: Number(editPlanPrinters),
          commissionRate: Number(editPlanCommission),
          features: editPlanFeatures.split('\n').filter((f) => f.trim().length > 0),
        }),
      });

      if (res.ok) {
        setShowEditPlanModal(false);
        showToast('Plan updated successfully!');
        loadAllData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update plan');
      }
    } catch (e: any) {
      alert(e.message || 'Error updating plan');
    }
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (!confirm(`Are you sure you want to delete the plan "${planName}"?`)) return;
    try {
      const res = await fetch(`/api/plans?id=${planId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Plan deleted');
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
      <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center text-slate-400">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent mb-4" />
        <p className="text-sm font-semibold tracking-wide">Loading PrintPorter Root Console...</p>
      </div>
    );
  }

  const kpis = analytics?.kpis || {};

  return (
    <div className="min-h-screen flex bg-[#070b13] text-slate-100 selection:bg-purple-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold px-4 py-3 shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================
          1. MODERN FIXED LEFT SIDEBAR PANEL
      ======================================================== */}
      <aside className="w-64 lg:w-72 border-r border-white/10 bg-[#090e18] flex flex-col justify-between shrink-0 sticky top-0 h-screen z-40">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/30">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-sm font-black text-white tracking-wide">
                    PrintPorter
                  </span>
                  <span className="rounded-md bg-purple-500/20 border border-purple-500/30 px-1.5 py-0.2 text-[9px] font-extrabold text-purple-400 uppercase">
                    Root
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-mono">CMS Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-xs font-semibold">
            {/* 1. Analytics */}
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'OVERVIEW'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 shrink-0" />
                <span>Overview & Metrics</span>
              </div>
            </button>

            {/* 2. Printer Shops */}
            <button
              onClick={() => setActiveTab('SHOPS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'SHOPS'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Store className="h-4 w-4 shrink-0" />
                <span>Cyber Café Hubs</span>
              </div>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                {shops.length}
              </span>
            </button>

            {/* 3. Master Orders */}
            <button
              onClick={() => setActiveTab('ORDERS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'ORDERS'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 shrink-0" />
                <span>Master Orders Queue</span>
              </div>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                {orders.length}
              </span>
            </button>

            {/* 4. Subscription Plans */}
            <button
              onClick={() => setActiveTab('PLANS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'PLANS'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="h-4 w-4 shrink-0" />
                <span>Subscription Plans</span>
              </div>
              <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px]">
                {plans.length}
              </span>
            </button>

            {/* 5. Platform Fees & Monetization (NEW) */}
            <button
              onClick={() => setActiveTab('PLATFORM_FEES')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'PLATFORM_FEES'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <BadgePercent className="h-4 w-4 shrink-0 text-amber-400" />
                <span>User Platform Fees</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${platformFeeEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                {platformFeeEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* 6. Cash & Online Ledger */}
            <button
              onClick={() => setActiveTab('PAYMENTS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'PAYMENTS'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 shrink-0" />
                <span>Settlements Ledger</span>
              </div>
            </button>

            {/* 7. Platform Users */}
            <button
              onClick={() => setActiveTab('USERS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'USERS'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 shrink-0" />
                <span>User Accounts</span>
              </div>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">
                {users.length}
              </span>
            </button>

            {/* 8. Admin Team & Security (NEW) */}
            <button
              onClick={() => setActiveTab('ADMINS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'ADMINS'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserCheck className="h-4 w-4 shrink-0 text-sky-400" />
                <span>Admin Team & Access</span>
              </div>
              <span className="rounded-full bg-sky-500/20 text-sky-400 px-2 py-0.5 text-[10px]">
                {adminList.length || 1}
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: Active Admin Profile Card */}
        <div className="p-4 border-t border-white/10 bg-slate-900/50">
          <div className="flex items-center justify-between gap-3">
            <div
              onClick={() => setActiveTab('ADMINS')}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition"
              title="Click to manage profile & password"
            >
              <div className="h-9 w-9 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-xs shrink-0">
                {currentAdmin?.name?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {currentAdmin?.name || 'Super Admin'}
                </div>
                <div className="text-[10px] text-purple-400 font-semibold truncate">
                  Root Controller
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
          2. MAIN CONTENT AREA WITH DYNAMIC TOP BAR
      ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Sticky Top Action Header */}
        <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-black text-white">
              {activeTab === 'OVERVIEW' && 'Platform Performance & Executive Overview'}
              {activeTab === 'SHOPS' && 'Cyber Café Hubs & Hardware Desks'}
              {activeTab === 'ORDERS' && 'Live Master Spooler & Customer Orders'}
              {activeTab === 'PLANS' && 'Cyber Café Subscription Plans'}
              {activeTab === 'PLATFORM_FEES' && 'User Platform Fees & Future Monetization'}
              {activeTab === 'PAYMENTS' && 'Cash vs UPI Financial Reconciliation'}
              {activeTab === 'USERS' && 'Registered Users & Customers'}
              {activeTab === 'ADMINS' && 'Administrator Team & Security Credentials'}
            </h2>
            <p className="text-[11px] text-slate-400">
              Root Control CMS • Dedicated Admin Panel at /khushi-admin
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick action based on tab */}
            {activeTab === 'SHOPS' && (
              <button
                onClick={() => setShowRegisterShopModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-purple-500 transition shadow-md shadow-purple-600/30"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Register Shop</span>
              </button>
            )}

            {activeTab === 'PLANS' && (
              <button
                onClick={() => setShowAddPlanModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-purple-500 transition shadow-md shadow-purple-600/30"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Tier Plan</span>
              </button>
            )}

            {activeTab === 'ADMINS' && (
              <button
                onClick={() => setShowCreateAdminModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-purple-500 transition shadow-md shadow-purple-600/30"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create New Admin</span>
              </button>
            )}

            <button
              onClick={loadAllData}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
              title="Refresh Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="hidden md:flex items-center gap-1 rounded-xl bg-sky-500/10 border border-sky-500/30 px-3 py-2 text-xs font-semibold text-sky-400 hover:bg-sky-500/20 transition"
            >
              <span>User App</span>
              <ExternalLink className="h-3 w-3" />
            </Link>

            <Link
              href="/printer/login"
              target="_blank"
              className="hidden md:flex items-center gap-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
            >
              <span>Printer Terminal</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-6 space-y-6">
          {/* Top Executive KPI Cards across all tabs for fast situational awareness */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <span className="text-xs text-slate-400 font-medium">Platform GMV</span>
              <div className="font-heading text-2xl font-black text-white mt-1">
                ₹{(kpis.totalRevenue || 23400).toFixed(2)}
              </div>
              <span className="text-[10px] text-emerald-400 font-bold mt-0.5 block">
                Total Orders Value
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <span className="text-xs text-slate-400 font-medium">Registered Cyber Cafes</span>
              <div className="font-heading text-2xl font-black text-sky-400 mt-1">
                {shops.length} Hubs
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {kpis.availablePrinters || 2} active printers online
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <span className="text-xs text-slate-400 font-medium">Platform Users</span>
              <div className="font-heading text-2xl font-black text-purple-400 mt-1">
                {users.length} Users
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {adminList.length} Administrators
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <span className="text-xs text-slate-400 font-medium">Total Print Jobs</span>
              <div className="font-heading text-2xl font-black text-emerald-400 mt-1">
                {kpis.totalOrders || orders.length} Orders
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {kpis.totalPagesPrinted || 25} pages processed
              </span>
            </div>
          </div>

          {/* ========================================================
              TAB 1: OVERVIEW & ANALYTICS
          ======================================================== */}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowRegisterShopModal(true)}
                  className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-5 text-left hover:bg-purple-950/30 transition flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-heading text-sm font-bold text-white">
                      + Register Printer Shop
                    </h4>
                    <p className="text-xs text-purple-300 mt-0.5">
                      Onboard partner café & generate desk QR
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
                      + Create Tier Plan
                    </h4>
                    <p className="text-xs text-sky-300 mt-0.5">
                      Configure monthly tiers and fee rates
                    </p>
                  </div>
                  <Layers className="h-6 w-6 text-sky-400 shrink-0" />
                </button>

                <button
                  onClick={() => setActiveTab('PLATFORM_FEES')}
                  className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 text-left hover:bg-amber-950/30 transition flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-heading text-sm font-bold text-white">
                      Configure Platform Fees
                    </h4>
                    <p className="text-xs text-amber-300 mt-0.5">
                      Add order convenience fee after launch
                    </p>
                  </div>
                  <BadgePercent className="h-6 w-6 text-amber-400 shrink-0" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: CYBER CAFÉ SHOPS & QR GENERATOR
          ======================================================== */}
          {activeTab === 'SHOPS' && (
            <div className="space-y-6">
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
                          <div>UPI ID: <strong className="text-emerald-400">{shop.upiId || 'Not set'}</strong></div>
                          <div>Total Revenue: <strong className="text-emerald-400">₹{(shop.totalRevenue || 0).toFixed(2)}</strong></div>
                        </div>
                      </div>

                      {/* Shop Actions: Desk QR, Edit, Pause/Activate, Delete */}
                      <div className="border-t border-white/10 pt-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => setSelectedQRShop(shop)}
                            className="flex items-center gap-1.5 rounded-xl bg-sky-500/20 border border-sky-500/30 px-3 py-1.5 text-xs font-bold text-sky-400 hover:bg-sky-500/30 transition"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            <span>Desk QR</span>
                          </button>

                          <Link
                            href={`/shop/${shop._id || shop.id}`}
                            target="_blank"
                            className="text-xs font-semibold text-slate-400 hover:text-white"
                          >
                            Open Shop →
                          </Link>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          <button
                            onClick={() => handleOpenEditShop(shop)}
                            className="flex items-center justify-center gap-1 rounded-xl border border-sky-500/30 bg-sky-500/10 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/20 transition"
                            title="Edit Shop Details"
                          >
                            <Pencil className="h-3 w-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleToggleShopActive(shop._id || shop.id, isActive)}
                            className={`rounded-xl py-1.5 text-xs font-bold transition border ${
                              isActive
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            {isActive ? 'Pause' : 'Activate'}
                          </button>

                          <button
                            onClick={() => handleDeleteShop(shop._id || shop.id, shop.name)}
                            className="flex items-center justify-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition"
                            title="Delete Shop"
                          >
                            <Trash2 className="h-3 w-3" />
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

          {/* ========================================================
              TAB 3: MASTER ORDERS LOG
          ======================================================== */}
          {activeTab === 'ORDERS' && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
              <h3 className="font-heading text-base font-bold text-white mb-4">
                Master Orders Spooler Log ({orders.length} total)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-2.5">Order #</th>
                      <th className="py-2.5">Customer</th>
                      <th className="py-2.5">Shop</th>
                      <th className="py-2.5">File</th>
                      <th className="py-2.5">Specs</th>
                      <th className="py-2.5">Amount</th>
                      <th className="py-2.5">Payment</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.map((o) => (
                      <tr key={o._id || o.orderNumber}>
                        <td className="py-2.5 font-mono text-purple-400">{o.orderNumber}</td>
                        <td className="py-2.5 text-white font-semibold">{o.customerName}</td>
                        <td className="py-2.5 text-slate-300">{o.shopName}</td>
                        <td className="py-2.5 max-w-[140px] truncate">{o.fileName}</td>
                        <td className="py-2.5 text-slate-400">
                          {o.pageCount}p × {o.copies}c • {o.isColor ? 'Color' : 'B&W'}
                        </td>
                        <td className="py-2.5 font-bold text-emerald-400">₹{o.totalPrice?.toFixed(2)}</td>
                        <td className="py-2.5">
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-white/10 text-slate-300">
                            {o.paymentType}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              o.status === 'COMPLETED'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : o.status === 'PRINTING'
                                ? 'bg-cyan-500/20 text-cyan-400'
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

          {/* ========================================================
              TAB 4: SUBSCRIPTION PLANS & MONETIZATION TIERS
          ======================================================== */}
          {activeTab === 'PLANS' && (
            <div className="space-y-6">
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

                      <div className="border-t border-white/10 pt-4 space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Limit: <strong className="text-white">{plan.maxPrinters} printers</strong></span>
                          <span>Fee: <strong className="text-sky-400">{plan.commissionRate}%</strong></span>
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => handleOpenEditPlan(plan)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 py-2 text-xs font-bold text-sky-300 hover:bg-sky-500/25 hover:text-white transition shadow-sm"
                            title="Edit Plan"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDeletePlan(plan._id, plan.name)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/25 hover:text-white transition shadow-sm"
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

          {/* ========================================================
              TAB 5: PLATFORM FEES & MONETIZATION SETTINGS (NEW)
          ======================================================== */}
          {activeTab === 'PLATFORM_FEES' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 p-6 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <BadgePercent className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-white">
                      Customer Platform Convenience Fee
                    </h3>
                    <p className="text-xs text-slate-300">
                      Configure a small convenience fee added to user print orders after the promotional launch months.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveFeeSettings} className="mt-6 space-y-4 max-w-xl">
                  {/* Enable / Disable Toggle */}
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-800/60 p-4">
                    <div>
                      <div className="text-xs font-bold text-white">Enable Platform Fee on User Orders</div>
                      <div className="text-[11px] text-slate-400">
                        {platformFeeEnabled
                          ? 'Active — Customers will pay this fee at checkout (Retained by platform).'
                          : 'Disabled — Currently 100% Free Launch offer (₹0 convenience fee for customers).'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPlatformFeeEnabled(!platformFeeEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        platformFeeEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          platformFeeEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Fee Type & Amount */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                        Fee Calculation Mode
                      </label>
                      <select
                        value={platformFeeType}
                        onChange={(e) => setPlatformFeeType(e.target.value as any)}
                        className="w-full rounded-xl border border-white/10 bg-slate-800 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                      >
                        <option value="FLAT">Flat Fee (Fixed ₹ Amount)</option>
                        <option value="PERCENT">Percentage (% of Print Total)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                        {platformFeeType === 'FLAT' ? 'Fee Amount (₹)' : 'Fee Percentage (%)'}
                      </label>
                      <input
                        type="number"
                        step={platformFeeType === 'FLAT' ? '0.5' : '0.1'}
                        min={0}
                        max={100}
                        value={platformFeeAmount}
                        onChange={(e) => setPlatformFeeAmount(parseFloat(e.target.value) || 0)}
                        placeholder={platformFeeType === 'FLAT' ? 'e.g. 2.00' : 'e.g. 2.5'}
                        className="w-full rounded-xl border border-white/10 bg-slate-800 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                      Checkout Display Label
                    </label>
                    <input
                      type="text"
                      value={platformFeeLabel}
                      onChange={(e) => setPlatformFeeLabel(e.target.value)}
                      placeholder="e.g. Platform Convenience Fee"
                      className="w-full rounded-xl border border-white/10 bg-slate-800 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Live Calculation Preview */}
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 space-y-2 text-xs">
                    <span className="font-bold text-amber-400 uppercase text-[10px] tracking-wider block">
                      Live Customer Checkout Preview
                    </span>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Sample Print Order:</span>
                      <span>₹20.00</span>
                    </div>
                    <div className="flex items-center justify-between text-amber-300">
                      <span>{platformFeeLabel}:</span>
                      <span>
                        {platformFeeEnabled
                          ? platformFeeType === 'FLAT'
                            ? `+₹${platformFeeAmount.toFixed(2)}`
                            : `+₹${((20 * platformFeeAmount) / 100).toFixed(2)}`
                          : '₹0.00 (Launch Offer)'}
                      </span>
                    </div>
                    <div className="border-t border-amber-500/20 pt-2 flex items-center justify-between font-bold text-white">
                      <span>Customer Total Payable:</span>
                      <span className="text-emerald-400">
                        ₹
                        {(
                          20 +
                          (platformFeeEnabled
                            ? platformFeeType === 'FLAT'
                              ? platformFeeAmount
                              : (20 * platformFeeAmount) / 100
                            : 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingFeeSettings}
                    className="rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-2.5 text-xs font-bold text-slate-950 transition shadow-lg shadow-amber-500/20"
                  >
                    {savingFeeSettings ? 'Saving Settings...' : 'Save & Update Platform Fees'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 6: PAYMENTS & FINANCIAL RECONCILIATION
          ======================================================== */}
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
                      <th className="py-2.5">Order #</th>
                      <th className="py-2.5">Shop</th>
                      <th className="py-2.5">Total Amount</th>
                      <th className="py-2.5">Admin Fee</th>
                      <th className="py-2.5">Shop Share</th>
                      <th className="py-2.5">Payment Method</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td className="py-2.5 font-mono text-purple-400">{p._id}</td>
                        <td className="py-2.5">{p.orderNumber}</td>
                        <td className="py-2.5">{p.shopName}</td>
                        <td className="py-2.5 font-bold text-white">₹{p.amount.toFixed(2)}</td>
                        <td className="py-2.5 text-amber-400">₹{(p.adminCommission || 0).toFixed(2)}</td>
                        <td className="py-2.5 font-bold text-emerald-400">
                          ₹{(p.shopEarnings || p.amount).toFixed(2)}
                        </td>
                        <td className="py-2.5">{p.paymentType}</td>
                        <td className="py-2.5">
                          <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                            {p.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 7: USER ACCOUNTS
          ======================================================== */}
          {activeTab === 'USERS' && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
              <h3 className="font-heading text-base font-bold text-white mb-4">
                Registered Platform Users ({users.length})
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
                          <div className="flex items-center justify-end gap-2">
                            {u.role !== 'ADMIN' && (
                              <>
                                <button
                                  onClick={() => handleToggleBlockUser(u.id, u.isBlocked)}
                                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                                    u.isBlocked
                                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                      : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                  }`}
                                >
                                  {u.isBlocked ? 'Reactivate' : 'Suspend'}
                                </button>

                                <button
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
                                  title="Delete User"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 8: ADMIN TEAM & SECURITY (NEW)
          ======================================================== */}
          {activeTab === 'ADMINS' && (
            <div className="space-y-6">
              {/* Row 1: Profile & Credentials Update Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Edit Profile & Password Form */}
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-bold text-white">
                        Change Admin Profile & Password
                      </h3>
                      <p className="text-xs text-slate-400">
                        Update your administrator credentials and security settings.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateAdminProfile} className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-300 font-semibold mb-1 block">Full Name</label>
                      <input
                        type="text"
                        required
                        value={adminProfileName}
                        onChange={(e) => setAdminProfileName(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-semibold mb-1 block">Admin Email</label>
                        <input
                          type="email"
                          required
                          value={adminProfileEmail}
                          onChange={(e) => setAdminProfileEmail(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-semibold mb-1 block">Phone</label>
                        <input
                          type="text"
                          value={adminProfilePhone}
                          onChange={(e) => setAdminProfilePhone(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-3">
                      <span className="text-[11px] font-bold text-purple-400 block mb-2">
                        Change Password (Optional)
                      </span>

                      <div className="space-y-2.5">
                        <div>
                          <label className="text-slate-400 text-[11px] mb-1 block">Current Password</label>
                          <input
                            type="password"
                            value={adminCurrentPassword}
                            onChange={(e) => setAdminCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-slate-400 text-[11px] mb-1 block">New Password</label>
                            <input
                              type="password"
                              value={adminNewPassword}
                              onChange={(e) => setAdminNewPassword(e.target.value)}
                              placeholder="Minimum 6 characters"
                              className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                            />
                          </div>
                          <div>
                            <label className="text-slate-400 text-[11px] mb-1 block">Confirm Password</label>
                            <input
                              type="password"
                              value={adminConfirmPassword}
                              onChange={(e) => setAdminConfirmPassword(e.target.value)}
                              placeholder="Confirm new password"
                              className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={savingAdminProfile}
                      className="mt-3 w-full rounded-xl bg-purple-600 hover:bg-purple-500 py-2.5 text-xs font-bold text-white transition shadow-md shadow-purple-600/30"
                    >
                      {savingAdminProfile ? 'Saving Changes...' : 'Save & Update Credentials'}
                    </button>
                  </form>
                </div>

                {/* Provision New Administrator Quick Trigger */}
                <div className="rounded-3xl border border-sky-500/30 bg-sky-950/20 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-heading text-base font-bold text-white">
                          Provision New Administrator
                        </h3>
                        <p className="text-xs text-sky-300">
                          Add trusted staff or partners with full Root Control permissions.
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mt-4">
                      Administrators have root control to onboard cyber cafés, monitor print queues, modify subscription plans, configure user convenience fees, and manage finances.
                    </p>

                    <div className="mt-4 rounded-2xl border border-sky-500/20 bg-slate-900/60 p-4 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-sky-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-400" />
                        <span>Instant login right at /khushi-admin/login</span>
                      </div>
                      <div className="flex items-center gap-2 text-sky-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-400" />
                        <span>Full privileges across all platform hubs</span>
                      </div>
                      <div className="flex items-center gap-2 text-sky-300">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-400" />
                        <span>Protected Root Admin account safe from accidental deletion</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCreateAdminModal(true)}
                    className="mt-6 w-full rounded-xl bg-sky-500 hover:bg-sky-400 py-2.5 text-xs font-bold text-white transition shadow-md shadow-sky-500/30 flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create New Administrator</span>
                  </button>
                </div>
              </div>

              {/* Row 2: All Administrators Table */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
                <h3 className="font-heading text-base font-bold text-white mb-4">
                  Active Platform Administrators ({adminList.length})
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-500">
                      <tr>
                        <th className="py-2.5">Administrator</th>
                        <th className="py-2.5">Email</th>
                        <th className="py-2.5">Phone</th>
                        <th className="py-2.5">Privilege Level</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {adminList.map((ad) => (
                        <tr key={ad.id || ad.email}>
                          <td className="py-2.5 font-bold text-white flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-bold">
                              {ad.name?.charAt(0) || 'A'}
                            </div>
                            <span>{ad.name}</span>
                          </td>
                          <td className="py-2.5">{ad.email}</td>
                          <td className="py-2.5">{ad.phone || 'N/A'}</td>
                          <td className="py-2.5">
                            {ad.isRoot ? (
                              <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
                                Primary Root Admin
                              </span>
                            ) : (
                              <span className="rounded-full bg-sky-500/20 border border-sky-500/30 px-2.5 py-0.5 text-[10px] font-bold text-sky-300">
                                Administrator
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-right">
                            {!ad.isRoot && (
                              <button
                                onClick={() => handleDeleteUser(ad.id, ad.name)}
                                className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
                                title="Revoke Admin Access"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================
          MODALS
      ======================================================== */}

      {/* Modal 1: Create New Admin */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowCreateAdminModal(false)}
              className="absolute right-4 top-4 rounded-full bg-white/5 p-2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-heading text-lg font-bold text-white mb-1">
              Create New Administrator
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Provision an administrator with full Root Control permissions.
            </p>

            <form onSubmit={handleCreateNewAdmin} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Full Name</label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Admin Email</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="e.g. rahul@printporter.com"
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Phone Number</label>
                <input
                  type="text"
                  required
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Initial Password</label>
                <input
                  type="text"
                  required
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={creatingAdmin}
                className="mt-4 w-full rounded-xl bg-purple-600 hover:bg-purple-500 py-2.5 text-xs font-bold text-white transition"
              >
                {creatingAdmin ? 'Creating Administrator...' : 'Provision Administrator Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Admin Created Credentials Card */}
      {newAdminCredentialsNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl border border-purple-500/30 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  Administrator Created!
                </h3>
                <p className="text-xs text-slate-400">
                  Provide these credentials to the new admin
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-4 space-y-3 font-mono text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block font-sans">
                  Admin Name
                </span>
                <span className="text-white font-bold">{newAdminCredentialsNotice.name}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block font-sans">
                  Email
                </span>
                <span className="text-white font-bold">{newAdminCredentialsNotice.email}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block font-sans">
                  Generated Password
                </span>
                <span className="text-emerald-400 font-bold">{newAdminCredentialsNotice.password}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block font-sans">
                  Admin Login URL
                </span>
                <span className="text-sky-400 truncate block">/khushi-admin/login</span>
              </div>
            </div>

            <button
              onClick={() => setNewAdminCredentialsNotice(null)}
              className="mt-6 w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-500 transition"
            >
              Done & Save
            </button>
          </div>
        </div>
      )}

      {/* Modal 3: Register New Shop */}
      {showRegisterShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowRegisterShopModal(false)}
              className="absolute right-4 top-4 rounded-full bg-white/5 p-2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-heading text-lg font-bold text-white mb-1">
              Register New Printer Shop
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Add a partner cyber café hub and generate owner credentials.
            </p>

            <form onSubmit={handleRegisterShop} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Shop Name</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Apex Print & Cyber Hub"
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Owner Name</label>
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
                  <label className="text-slate-300 font-semibold mb-1 block">Phone</label>
                  <input
                    type="text"
                    required
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="+91 98111 22334"
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

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
                <label className="text-slate-300 font-semibold mb-1 block">Initial Password</label>
                <input
                  type="text"
                  required
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Full Address</label>
                <textarea
                  rows={2}
                  required
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="Shop No. 12, Metro Commercial Complex, Sector 18"
                  className="w-full rounded-xl border border-white/10 bg-slate-800 p-2.5 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Subscription Plan</label>
                <select
                  value={activePlan}
                  onChange={(e) => setActivePlan(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                >
                  <option value="Free Launch Plan">Free Launch Plan (FREE - Active for all)</option>
                  {plans.filter(p => p.name !== 'Free Launch Plan').map((p) => (
                    <option key={p._id || p.name} value={p.name}>
                      {p.name} (₹{p.priceMonthly}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="mt-4 w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-500 transition"
              >
                Register & Generate Desk QR Code
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Shop Owner Credentials Notice */}
      {newCredentialsNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  Shop Owner Created!
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

      {/* Modal 5: Edit Shop Modal */}
      {showEditShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowEditShopModal(false)}
              className="absolute right-4 top-4 rounded-full bg-white/5 p-2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-heading text-lg font-bold text-white mb-1">
              Edit Cyber Café Shop
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Update shop location, active tier, and direct UPI configuration.
            </p>

            <form onSubmit={handleUpdateShop} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Shop Name</label>
                <input
                  type="text"
                  required
                  value={editShopName}
                  onChange={(e) => setEditShopName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Physical Address</label>
                <input
                  type="text"
                  required
                  value={editShopAddress}
                  onChange={(e) => setEditShopAddress(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={editShopPhone}
                    onChange={(e) => setEditShopPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Starting Price (₹)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editShopStartingPrice}
                    onChange={(e) => setEditShopStartingPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Active Plan</label>
                <select
                  value={editShopPlan}
                  onChange={(e) => setEditShopPlan(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                >
                  {plans.map((p) => (
                    <option key={p._id || p.name} value={p.name}>
                      {p.name} ({p.priceMonthly === 0 ? 'FREE' : `₹${p.priceMonthly}/mo`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Shop UPI ID</label>
                <input
                  type="text"
                  placeholder="e.g. apexprint@oksbi"
                  value={editShopUpiId}
                  onChange={(e) => setEditShopUpiId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditShopModal(false)}
                  className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-500 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Create Subscription Plan */}
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
              Configure tiered partner fees, machine limits, and commissions.
            </p>

            <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Plan Name</label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. Growth Hub Tier"
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

      {/* Modal 7: Edit Subscription Plan */}
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

      {/* Modal 8: View/Download Desk QR Code */}
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
