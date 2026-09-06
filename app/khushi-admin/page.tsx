'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
  const [showQRModal, setShowQRModal] = useState(false);

  // Edit Shop Modal
  const [showEditShopModal, setShowEditShopModal] = useState(false);
  const [editingShop, setEditingShop] = useState<any>(null);
  const [editShopName, setEditShopName] = useState('');
  const [editShopAddress, setEditShopAddress] = useState('');
  const [editShopOwnerName, setEditShopOwnerName] = useState('');
  const [editShopOwnerPhone, setEditShopOwnerPhone] = useState('');
  const [editShopUpiId, setEditShopUpiId] = useState('');

  // Register Shop Form State
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [initialPassword, setInitialPassword] = useState('Shop@1234');
  const [selectedPlanId, setSelectedPlanId] = useState('plan_free_pioneer');
  const [submittingShop, setSubmittingShop] = useState(false);

  // Subscription Plan Modals
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planPriceMonthly, setPlanPriceMonthly] = useState(0);
  const [planMaxPrinters, setPlanMaxPrinters] = useState(2);
  const [planMaxOrders, setPlanMaxOrders] = useState(1000);
  const [planDescription, setPlanDescription] = useState('');

  // Edit Plan
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  // Search queries
  const [shopSearch, setShopSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Form Validation Errors
  const [shopFormErrors, setShopFormErrors] = useState<Record<string, string>>({});
  const [editShopFormErrors, setEditShopFormErrors] = useState<Record<string, string>>({});
  const [adminFormErrors, setAdminFormErrors] = useState<Record<string, string>>({});

  // Phone and field validation helpers
  const cleanIndianPhone = (val: string) => {
    return val.replace(/\D/g, '').slice(0, 10);
  };

  const validatePhone = (val: string) => {
    const clean = cleanIndianPhone(val);
    if (!clean) return 'Mobile number is required';
    if (!/^[6-9]\d{9}$/.test(clean)) {
      return 'Must be a 10-digit Indian mobile number starting with 6, 7, 8, or 9';
    }
    return '';
  };

  const validateEmail = (val: string) => {
    const clean = val.trim().toLowerCase();
    if (!clean) return 'Email address is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return 'Enter a valid email address (e.g. name@example.com)';
    }
    return '';
  };

  // Authenticated fetch helper that automatically attaches Bearer token from localStorage
  const adminFetch = (url: string, options: RequestInit = {}) => {
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

  const loadAllData = async () => {
    setRefreshing(true);
    try {
      // 1. Session check
      const authRes = await adminFetch('/api/auth/me');
      if (!authRes.ok) {
        window.location.href = '/khushi-admin/login';
        return;
      }
      const authData = await authRes.json();
      if (!authData.authenticated || authData.user.role !== 'ADMIN') {
        window.location.href = '/khushi-admin/login';
        return;
      }
      setCurrentAdmin(authData.user);
      setAdminProfileName(authData.user.name || '');
      setAdminProfileEmail(authData.user.email || '');
      setAdminProfilePhone(authData.user.phone || '');

      // 2. Fetch parallel endpoints
      const [anRes, shRes, usRes, ordRes, plRes, payRes, feeRes, admRes] = await Promise.all([
        adminFetch('/api/analytics').then((r) => (r.ok ? r.json() : null)),
        adminFetch('/api/shops').then((r) => (r.ok ? r.json() : null)),
        adminFetch('/api/users').then((r) => (r.ok ? r.json() : null)),
        adminFetch('/api/orders').then((r) => (r.ok ? r.json() : null)),
        adminFetch('/api/plans').then((r) => (r.ok ? r.json() : null)),
        adminFetch('/api/payments').then((r) => (r.ok ? r.json() : null)),
        adminFetch('/api/admin/settings').then((r) => (r.ok ? r.json() : null)),
        adminFetch('/api/admin/list').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (anRes) setAnalytics(anRes);
      if (shRes?.shops) setShops(shRes.shops);
      if (usRes?.users) setUsers(usRes.users);
      if (ordRes?.orders) setOrders(ordRes.orders);
      if (plRes?.plans) setPlans(plRes.plans);
      if (payRes?.payments) setPayments(payRes.payments);
      if (admRes?.admins) setAdminList(admRes.admins);

      if (feeRes?.settings) {
        setPlatformFeeEnabled(!!feeRes.settings.platformFeeEnabled);
        setPlatformFeeType(feeRes.settings.platformFeeType || 'FLAT');
        setPlatformFeeAmount(feeRes.settings.platformFeeAmount || 0);
        setPlatformFeeLabel(feeRes.settings.platformFeeLabel || 'Platform Convenience Fee');
      }
    } catch (e) {
      console.error('Error loading admin portal data:', e);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Save Platform Fees
  const handleSavePlatformFees = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFeeSettings(true);
    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformFeeEnabled,
          platformFeeType,
          platformFeeAmount: Number(platformFeeAmount) || 0,
          platformFeeLabel: platformFeeLabel.trim(),
        }),
      });

      if (res.ok) {
        showToast('Platform fee settings updated!');
      } else {
        showToast('Failed to save settings');
      }
    } catch (e) {
      showToast('Failed to save settings');
    } finally {
      setSavingFeeSettings(false);
    }
  };

  // Update Admin Profile & Password
  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminNewPassword && adminNewPassword !== adminConfirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    setSavingAdminProfile(true);
    try {
      const res = await adminFetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: adminProfileName.trim(),
          email: adminProfileEmail.trim(),
          phone: adminProfilePhone.trim(),
          currentPassword: adminCurrentPassword,
          newPassword: adminNewPassword || undefined,
        }),
      });

      if (res.ok) {
        showToast('Admin credentials updated successfully!');
        setAdminCurrentPassword('');
        setAdminNewPassword('');
        setAdminConfirmPassword('');
        loadAllData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update credentials');
      }
    } catch (e) {
      alert('Failed to update credentials');
    } finally {
      setSavingAdminProfile(false);
    }
  };

  // Create New Super Admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!newAdminName.trim() || newAdminName.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s.]+$/.test(newAdminName.trim())) {
      errors.name = 'Name can only contain letters and spaces';
    }

    const emailErr = validateEmail(newAdminEmail);
    if (emailErr) errors.email = emailErr;

    if (newAdminPhone) {
      const phoneErr = validatePhone(newAdminPhone);
      if (phoneErr) errors.phone = phoneErr;
    }

    if (!newAdminPassword.trim() || newAdminPassword.trim().length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      setAdminFormErrors(errors);
      return;
    }

    setAdminFormErrors({});
    setCreatingAdmin(true);
    try {
      const res = await adminFetch('/api/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAdminName.trim(),
          email: newAdminEmail.trim().toLowerCase(),
          phone: newAdminPhone ? cleanIndianPhone(newAdminPhone) : undefined,
          password: newAdminPassword.trim(),
        }),
      });

      const d = await res.json();
      if (res.ok) {
        setShowCreateAdminModal(false);
        setNewAdminCredentialsNotice({
          name: newAdminName,
          email: newAdminEmail,
          password: newAdminPassword,
        });
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPhone('');
        showToast('New Super Admin created successfully!');
        loadAllData();
      } else {
        alert(d.error || 'Failed to create admin');
      }
    } catch (e) {
      alert('Failed to create admin');
    } finally {
      setCreatingAdmin(false);
    }
  };

  // Create New Cyber Café Shop
  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const cleanName = shopName.trim();
    if (!cleanName) {
      errors.shopName = 'Shop name is required';
    } else if (cleanName.length < 3) {
      errors.shopName = 'Shop name must be at least 3 characters';
    }

    const cleanAddress = shopAddress.trim();
    if (!cleanAddress) {
      errors.shopAddress = 'Full address is required';
    } else if (cleanAddress.length < 5) {
      errors.shopAddress = 'Address must be at least 5 characters';
    }

    const cleanOwner = ownerName.trim();
    if (!cleanOwner) {
      errors.ownerName = 'Owner name is required';
    } else if (cleanOwner.length < 2) {
      errors.ownerName = 'Owner name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s.]+$/.test(cleanOwner)) {
      errors.ownerName = 'Owner name can only contain letters and spaces';
    }

    const phoneErr = validatePhone(ownerPhone);
    if (phoneErr) errors.ownerPhone = phoneErr;

    const emailErr = validateEmail(ownerEmail);
    if (emailErr) errors.ownerEmail = emailErr;

    const cleanPassword = initialPassword.trim();
    if (!cleanPassword) {
      errors.initialPassword = 'Password is required';
    } else if (cleanPassword.length < 6) {
      errors.initialPassword = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      setShopFormErrors(errors);
      return;
    }

    setShopFormErrors({});
    setSubmittingShop(true);
    try {
      const res = await adminFetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          address: cleanAddress,
          ownerName: cleanOwner,
          ownerEmail: ownerEmail.trim().toLowerCase(),
          ownerPhone: cleanIndianPhone(ownerPhone),
          ownerPassword: cleanPassword,
          password: cleanPassword,
          planId: selectedPlanId,
        }),
      });

      const d = await res.json();
      if (res.ok) {
        setShowRegisterShopModal(false);
        setNewCredentialsNotice({
          shopName: cleanName,
          ownerEmail: ownerEmail.trim().toLowerCase(),
          password: cleanPassword,
          shopId: d.shop?._id || d.shop?.id,
        });
        setShopName('');
        setShopAddress('');
        setOwnerName('');
        setOwnerEmail('');
        setOwnerPhone('');
        showToast('New cyber café shop created!');
        loadAllData();
      } else {
        alert(d.error || 'Failed to create shop');
      }
    } catch (e) {
      alert('Failed to create shop');
    } finally {
      setSubmittingShop(false);
    }
  };

  // Toggle Shop Active/Offline
  const handleToggleShopStatus = async (shopId: string, currentOnline: boolean) => {
    try {
      const res = await adminFetch(`/api/shops/${shopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: !currentOnline }),
      });

      if (res.ok) {
        showToast(`Shop status toggled to ${!currentOnline ? 'Online' : 'Offline'}`);
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open Edit Shop Modal
  const handleOpenEditShop = (shop: any) => {
    setEditingShop(shop);
    setEditShopName(shop.name);
    setEditShopAddress(shop.address);
    setEditShopOwnerName(shop.ownerName || '');
    setEditShopOwnerPhone(shop.ownerPhone || '');
    setEditShopUpiId(shop.upiId || '');
    setShowEditShopModal(true);
  };

  const handleUpdateShopDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop) return;

    const errors: Record<string, string> = {};
    if (!editShopName.trim() || editShopName.trim().length < 3) {
      errors.name = 'Shop name must be at least 3 characters';
    }
    if (!editShopAddress.trim() || editShopAddress.trim().length < 5) {
      errors.address = 'Address must be at least 5 characters';
    }
    if (editShopOwnerName && editShopOwnerName.trim()) {
      if (editShopOwnerName.trim().length < 2) {
        errors.ownerName = 'Owner name must be at least 2 characters';
      } else if (!/^[a-zA-Z\s.]+$/.test(editShopOwnerName.trim())) {
        errors.ownerName = 'Owner name can only contain letters and spaces';
      }
    }
    if (editShopOwnerPhone) {
      const phoneErr = validatePhone(editShopOwnerPhone);
      if (phoneErr) errors.phone = phoneErr;
    }
    if (editShopUpiId && editShopUpiId.trim()) {
      if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(editShopUpiId.trim())) {
        errors.upiId = 'Invalid UPI ID format (e.g. shopname@upi or 9876543210@paytm)';
      }
    }

    if (Object.keys(errors).length > 0) {
      setEditShopFormErrors(errors);
      return;
    }

    setEditShopFormErrors({});
    try {
      const res = await adminFetch(`/api/shops/${editingShop._id || editingShop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editShopName.trim(),
          address: editShopAddress.trim(),
          ownerName: editShopOwnerName.trim(),
          ownerPhone: editShopOwnerPhone ? cleanIndianPhone(editShopOwnerPhone) : '',
          upiId: editShopUpiId.trim(),
        }),
      });

      if (res.ok) {
        showToast('Shop details updated!');
        setShowEditShopModal(false);
        setEditingShop(null);
        loadAllData();
      } else {
        showToast('Failed to update shop');
      }
    } catch (e) {
      showToast('Failed to update shop');
    }
  };

  // Delete Shop
  const handleDeleteShop = async (shopId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete shop "${name}"?`)) {
      return;
    }

    try {
      const res = await adminFetch(`/api/shops/${shopId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Shop "${name}" deleted.`);
        loadAllData();
      } else {
        showToast('Failed to delete shop');
      }
    } catch (e) {
      showToast('Failed to delete shop');
    }
  };

  // Create Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminFetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planName.trim(),
          priceMonthly: Number(planPriceMonthly),
          maxPrinters: Number(planMaxPrinters),
          maxOrdersPerMonth: Number(planMaxOrders),
          description: planDescription.trim(),
          isActive: true,
        }),
      });

      if (res.ok) {
        showToast('New plan added!');
        setShowAddPlanModal(false);
        setPlanName('');
        setPlanDescription('');
        loadAllData();
      } else {
        showToast('Failed to add plan');
      }
    } catch (e) {
      showToast('Failed to add plan');
    }
  };

  // Delete Plan
  const handleDeletePlan = async (planId: string, name: string) => {
    if (!window.confirm(`Delete plan "${name}"?`)) return;
    try {
      const res = await adminFetch(`/api/plans?id=${planId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Plan "${name}" removed`);
        loadAllData();
      } else {
        showToast('Failed to delete plan');
      }
    } catch (e) {
      showToast('Failed to delete plan');
    }
  };

  // Sign out
  const handleLogout = () => {
    localStorage.removeItem('printporter_token');
    localStorage.removeItem('printporter_user');
    document.cookie = 'printporter_token=; Max-Age=0; path=/;';
    window.location.href = '/khushi-admin/login';
  };

  if (loading || !currentAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        <p className="text-sm font-semibold">Verifying Admin Session...</p>
      </div>
    );
  }

  const kpis = analytics?.kpis || {};

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
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

      {/* 1. LEFT SIDEBAR PANEL (Desktop persistent, Mobile slide-over drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:w-64 md:h-screen md:sticky md:top-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs tracking-wider shrink-0">
                CMS
              </div>
              <div className="min-w-0">
                <div className="font-heading text-xs font-bold text-slate-900 truncate">
                  PrintPorter Root
                </div>
                <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                  Super Admin Console
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

          {/* Navigation items */}
          <nav className="p-3 space-y-1 text-xs">
            <button
              onClick={() => {
                setActiveTab('OVERVIEW');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                activeTab === 'OVERVIEW'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span>Overview & Metrics</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('SHOPS');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                activeTab === 'SHOPS'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span>Cyber Café Hubs</span>
              <span className={`rounded-full px-2 py-0.2 text-[10px] ${
                activeTab === 'SHOPS' ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {shops.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('ORDERS');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                activeTab === 'ORDERS'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span>Master Orders Queue</span>
              <span className={`rounded-full px-2 py-0.2 text-[10px] ${
                activeTab === 'ORDERS' ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('PLANS');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                activeTab === 'PLANS'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span>Subscription Plans</span>
              <span className={`rounded-full px-2 py-0.2 text-[10px] ${
                activeTab === 'PLANS' ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {plans.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('PLATFORM_FEES');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                activeTab === 'PLATFORM_FEES'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span>User Platform Fees</span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                platformFeeEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {platformFeeEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('PAYMENTS');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                activeTab === 'PAYMENTS'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span>Settlements Ledger</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('USERS');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                activeTab === 'USERS'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span>User Accounts</span>
              <span className={`rounded-full px-2 py-0.2 text-[10px] ${
                activeTab === 'USERS' ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {users.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('ADMINS');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                activeTab === 'ADMINS'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span>Admin Credentials</span>
              <span className="rounded bg-blue-50 border border-blue-200 text-blue-700 px-1.5 py-0.2 text-[9px] font-bold">
                {adminList.length || 1}
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 space-y-2 text-xs">
          <div className="px-3 py-1 text-slate-500 font-medium">
            Signed in as: <strong className="text-slate-900 block truncate">{currentAdmin?.name || 'Super Admin'}</strong>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-rose-600 hover:bg-rose-50 font-medium transition"
          >
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN ADMIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-md px-3 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden flex items-center justify-center rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-sm shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              <span>[Menu]</span>
            </button>

            <div className="min-w-0">
              <h1 className="font-heading text-sm sm:text-lg font-bold text-slate-900 truncate">
                {activeTab === 'OVERVIEW' && 'Platform Overview & Network Metrics'}
                {activeTab === 'SHOPS' && 'Cyber Café Printing Hubs'}
                {activeTab === 'ORDERS' && 'Master Orders Stream & Spooler'}
                {activeTab === 'PLANS' && 'Platform Subscription Tiers'}
                {activeTab === 'PLATFORM_FEES' && 'User Platform Fees & Monetization'}
                {activeTab === 'PAYMENTS' && 'Financial Settlements Ledger'}
                {activeTab === 'USERS' && 'User Accounts & Customer Database'}
                {activeTab === 'ADMINS' && 'Administrator Management & Passwords'}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                Central Control Dashboard • PrintPorter Network
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadAllData}
              className="rounded-lg border border-slate-300 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </header>

        <main className="p-3 sm:p-6 space-y-4 sm:space-y-6 min-w-0">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Registered Shops
                  </span>
                  <div className="font-heading text-2xl font-black text-slate-900 mt-1">
                    {shops.length}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                    {shops.filter((s) => s.isOnline !== false).length} online now
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Total Print Orders
                  </span>
                  <div className="font-heading text-2xl font-black text-blue-600 mt-1">
                    {orders.length}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Platform lifetime
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Registered Users
                  </span>
                  <div className="font-heading text-2xl font-black text-slate-900 mt-1">
                    {users.length}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Customers & shop owners
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Network GMV Volume
                  </span>
                  <div className="font-heading text-2xl font-black text-emerald-700 mt-1">
                    ₹{kpis.totalRevenue?.toFixed(2) || '0.00'}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Direct shop settlements
                  </span>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <h3 className="font-heading text-sm font-bold text-slate-900">
                  Quick Management Actions
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setActiveTab('SHOPS');
                      setShowRegisterShopModal(true);
                    }}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
                  >
                    + Add New Cyber Café
                  </button>

                  <button
                    onClick={() => setActiveTab('PLATFORM_FEES')}
                    className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition"
                  >
                    Configure Platform Fees ({platformFeeEnabled ? 'ON' : 'OFF'})
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('ADMINS');
                      setShowCreateAdminModal(true);
                    }}
                    className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition"
                  >
                    + Create New Super Admin
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SHOPS */}
          {activeTab === 'SHOPS' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <input
                  type="text"
                  value={shopSearch}
                  onChange={(e) => setShopSearch(e.target.value)}
                  placeholder="Search shop by name or address..."
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 w-full sm:w-80 shadow-sm"
                />

                <button
                  onClick={() => setShowRegisterShopModal(true)}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
                >
                  + Add New Shop
                </button>
              </div>

              {/* Credentials Notice */}
              {newCredentialsNotice && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 space-y-2 text-xs shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">
                      New Shopkeeper Credentials Generated
                    </span>
                    <button
                      onClick={() => setNewCredentialsNotice(null)}
                      className="text-[11px] font-bold text-emerald-800"
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white border border-emerald-200 rounded-lg p-3 text-slate-800">
                    <div>
                      <span className="text-slate-500 block">Shop:</span>
                      <strong>{newCredentialsNotice.shopName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Login Email:</span>
                      <strong className="font-mono">{newCredentialsNotice.ownerEmail}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Password:</span>
                      <strong className="font-mono">{newCredentialsNotice.password}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Shops Table */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Shop Name</th>
                        <th className="px-4 py-3">Address</th>
                        <th className="px-4 py-3">Owner Contact</th>
                        <th className="px-4 py-3">Shop UPI</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {shops
                        .filter((s) => s.name?.toLowerCase().includes(shopSearch.toLowerCase()) || s.address?.toLowerCase().includes(shopSearch.toLowerCase()))
                        .map((shop) => (
                          <tr key={shop._id || shop.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3">
                              <span className="font-bold text-slate-900 block">{shop.name}</span>
                              <span className="text-[10px] text-slate-500">ID: {shop._id || shop.id}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]" title={shop.address}>
                              {shop.address}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-800">{shop.ownerName || '-'}</div>
                              <div className="text-[11px] text-slate-500">{shop.ownerPhone || '-'}</div>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-800">
                              {shop.upiId || 'Not set'}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleToggleShopStatus(shop._id || shop.id, shop.isOnline !== false)}
                                className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                                  shop.isOnline !== false
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                    : 'bg-slate-100 border-slate-300 text-slate-500'
                                }`}
                              >
                                {shop.isOnline !== false ? 'Online' : 'Offline'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedQRShop(shop);
                                    setShowQRModal(true);
                                  }}
                                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                                >
                                  QR Placard
                                </button>
                                <button
                                  onClick={() => handleOpenEditShop(shop)}
                                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteShop(shop._id || shop.id, shop.name)}
                                  className="rounded-lg px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MASTER ORDERS */}
          {activeTab === 'ORDERS' && (
            <div className="space-y-4">
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Filter orders by order # or customer..."
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 w-full sm:w-80 shadow-sm"
              />

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Order #</th>
                        <th className="px-4 py-3">Shop</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Document</th>
                        <th className="px-4 py-3">Total</th>
                        <th className="px-4 py-3">Fulfillment</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders
                        .filter((o) => o.orderNumber?.includes(orderSearch) || o.customerName?.toLowerCase().includes(orderSearch.toLowerCase()))
                        .map((ord) => (
                          <tr key={ord._id || ord.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3 font-bold text-slate-900">
                              #{ord.orderNumber}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              {ord.shopName}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-800">{ord.customerName}</div>
                              <div className="text-[11px] text-slate-500">{ord.customerPhone}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-800 truncate max-w-[160px]" title={ord.fileName}>
                                {ord.fileName}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {ord.pageCount} pgs • {ord.isColor ? 'Color' : 'B&W'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">₹{ord.totalPrice?.toFixed(2)}</div>
                              <div className="text-[10px] text-slate-500">{ord.paymentType}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 font-bold text-slate-700">
                                {ord.fulfillmentType || 'PICKUP'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                                ord.status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : ord.status === 'PRINTING'
                                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}>
                                {ord.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SUBSCRIPTION PLANS */}
          {activeTab === 'PLANS' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-sm font-bold text-slate-900">
                    Platform Subscription Plans for Cyber Cafés
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage tier pricing, machine limits, and monthly quota allocations.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddPlanModal(true)}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
                >
                  + Add New Plan
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {plans.map((p) => (
                  <div key={p.planId || p._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-heading text-sm font-bold text-slate-900">{p.name}</span>
                        <span className="rounded bg-blue-50 border border-blue-200 text-blue-700 font-bold px-1.5 py-0.2 text-[10px]">
                          {p.planId}
                        </span>
                      </div>

                      <div className="font-heading text-2xl font-black text-slate-900 mb-2">
                        ₹{p.priceMonthly} <span className="text-xs font-normal text-slate-500">/ month</span>
                      </div>

                      <p className="text-xs text-slate-600 mb-3">{p.description}</p>

                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs space-y-1 text-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Max Printers:</span>
                          <strong>{p.maxPrinters}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Max Orders/Mo:</span>
                          <strong>{p.maxOrdersPerMonth === 999999 ? 'Unlimited' : p.maxOrdersPerMonth}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleDeletePlan(p._id || p.planId, p.name)}
                        className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded"
                      >
                        Delete Plan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PLATFORM FEES & MONETIZATION */}
          {activeTab === 'PLATFORM_FEES' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm max-w-xl space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="font-heading text-base font-bold text-slate-900">
                  User Order Platform Fee Settings
                </h3>
                <p className="text-xs text-slate-500">
                  Charge a convenience fee on customer print checkouts. This fee is automatically added to user payments after initial free trial months.
                </p>
              </div>

              <form onSubmit={handleSavePlatformFees} className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900 block">Enable Platform Fee on User Orders</span>
                    <span className="text-[11px] text-slate-500">
                      When OFF, users pay exactly the cyber café's rate card with ₹0 convenience fee.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={platformFeeEnabled}
                    onChange={(e) => setPlatformFeeEnabled(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-slate-800 font-bold mb-1 block">
                    Fee Calculation Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPlatformFeeType('FLAT')}
                      className={`py-2 rounded-lg border text-xs font-bold transition shadow-sm ${
                        platformFeeType === 'FLAT'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                          : 'border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      Flat Fee (₹ per order)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlatformFeeType('PERCENT')}
                      className={`py-2 rounded-lg border text-xs font-bold transition shadow-sm ${
                        platformFeeType === 'PERCENT'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                          : 'border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      Percentage (% of subtotal)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-slate-800 font-bold mb-1 block">
                    Fee Amount {platformFeeType === 'FLAT' ? '(in ₹)' : '(in %)'} *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={platformFeeAmount}
                    onChange={(e) => setPlatformFeeAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-slate-800 font-bold mb-1 block">
                    Fee Label Displayed to Customer
                  </label>
                  <input
                    type="text"
                    required
                    value={platformFeeLabel}
                    onChange={(e) => setPlatformFeeLabel(e.target.value)}
                    placeholder="e.g. Platform Convenience Fee"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingFeeSettings}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                  >
                    {savingFeeSettings ? 'Saving Settings...' : 'Save Monetization Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: PAYMENTS */}
          {activeTab === 'PAYMENTS' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-heading text-sm font-bold text-slate-900">
                    Platform Master Payments Stream
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Txn ID</th>
                        <th className="px-4 py-3">Order #</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((p) => (
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
                          <td className="px-4 py-3 font-semibold text-slate-700">
                            {p.paymentType}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded bg-emerald-50 border border-emerald-300 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {new Date(p.createdAt || Date.now()).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: USERS */}
          {activeTab === 'USERS' && (
            <div className="space-y-4">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by name or email..."
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 w-full sm:w-80 shadow-sm"
              />

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Joined Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users
                        .filter((u) => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()))
                        .map((u) => (
                          <tr key={u._id || u.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3 font-bold text-slate-900">
                              {u.name}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-700">
                              {u.email}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {u.phone || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                                u.role === 'ADMIN'
                                  ? 'bg-purple-50 text-purple-700 border-purple-300'
                                  : u.role === 'SHOP_OWNER'
                                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {new Date(u.createdAt || Date.now()).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ADMINS */}
          {activeTab === 'ADMINS' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form to update current admin profile / password */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="font-heading text-sm font-bold text-slate-900">
                    My Administrator Profile & Password
                  </h3>
                  <p className="text-xs text-slate-500">
                    Change your super admin display name, email, or master password.
                  </p>
                </div>

                <form onSubmit={handleUpdateAdminProfile} className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-800 font-bold mb-1 block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={adminProfileName}
                      onChange={(e) => setAdminProfileName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-slate-800 font-bold mb-1 block">Admin Email (Login ID)</label>
                    <input
                      type="email"
                      required
                      value={adminProfileEmail}
                      onChange={(e) => setAdminProfileEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-slate-800 font-bold mb-1 block">Current Password (To Confirm Changes) *</label>
                    <input
                      type="password"
                      required
                      value={adminCurrentPassword}
                      onChange={(e) => setAdminCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-800 font-bold mb-1 block">New Password (Optional)</label>
                      <input
                        type="password"
                        value={adminNewPassword}
                        onChange={(e) => setAdminNewPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-slate-800 font-bold mb-1 block">Confirm New Password</label>
                      <input
                        type="password"
                        value={adminConfirmPassword}
                        onChange={(e) => setAdminConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingAdminProfile}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                    >
                      {savingAdminProfile ? 'Updating Credentials...' : 'Save Admin Credentials'}
                    </button>
                  </div>
                </form>
              </div>

              {/* List of Admins & Create New Admin */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="font-heading text-sm font-bold text-slate-900">
                      Super Administrator Accounts
                    </h3>
                    <p className="text-xs text-slate-500">
                      Members with full root console access.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowCreateAdminModal(true)}
                    className="rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                  >
                    + Add New Admin
                  </button>
                </div>

                {newAdminCredentialsNotice && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs space-y-1">
                    <span className="font-bold text-emerald-900">New Admin Created:</span>
                    <div className="font-mono text-slate-800">Email: {newAdminCredentialsNotice.email}</div>
                    <div className="font-mono text-slate-800">Password: {newAdminCredentialsNotice.password}</div>
                  </div>
                )}

                <div className="space-y-2">
                  {adminList.map((adm) => (
                    <div key={adm._id || adm.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{adm.name}</span>
                        <span className="font-mono text-slate-500 text-[11px]">{adm.email}</span>
                      </div>
                      <span className="rounded bg-purple-50 border border-purple-200 text-purple-700 font-bold px-2 py-0.5 text-[10px]">
                        Super Admin
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: Register New Cyber Café Shop */}
      {showRegisterShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-sm font-bold text-slate-900">
                Add New Cyber Café Shop
              </h3>
              <button
                onClick={() => setShowRegisterShopModal(false)}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateShop} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-800 font-bold mb-1 block">Shop Name *</label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  placeholder="e.g. Apex Digital Print Hub"
                  value={shopName}
                  onChange={(e) => {
                    setShopName(e.target.value);
                    if (shopFormErrors.shopName) setShopFormErrors((prev) => ({ ...prev, shopName: '' }));
                  }}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-slate-900 outline-none shadow-sm transition ${
                    shopFormErrors.shopName ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
                {shopFormErrors.shopName && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">{shopFormErrors.shopName}</p>
                )}
              </div>

              <div>
                <label className="text-slate-800 font-bold mb-1 block">Full Address *</label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  placeholder="e.g. Shop 12, Block B, Sector 18, Noida"
                  value={shopAddress}
                  onChange={(e) => {
                    setShopAddress(e.target.value);
                    if (shopFormErrors.shopAddress) setShopFormErrors((prev) => ({ ...prev, shopAddress: '' }));
                  }}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-slate-900 outline-none shadow-sm transition ${
                    shopFormErrors.shopAddress ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
                {shopFormErrors.shopAddress && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">{shopFormErrors.shopAddress}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-800 font-bold mb-1 block">Owner Name *</label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="e.g. Rajesh Kumar"
                    value={ownerName}
                    onChange={(e) => {
                      setOwnerName(e.target.value);
                      if (shopFormErrors.ownerName) setShopFormErrors((prev) => ({ ...prev, ownerName: '' }));
                    }}
                    className={`w-full rounded-xl border bg-white px-3 py-2 text-slate-900 outline-none shadow-sm transition ${
                      shopFormErrors.ownerName ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {shopFormErrors.ownerName && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">{shopFormErrors.ownerName}</p>
                  )}
                </div>

                <div>
                  <label className="text-slate-800 font-bold mb-1 block">Owner Phone *</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-slate-500 select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={ownerPhone}
                      onChange={(e) => {
                        const clean = cleanIndianPhone(e.target.value);
                        setOwnerPhone(clean);
                        if (shopFormErrors.ownerPhone) setShopFormErrors((prev) => ({ ...prev, ownerPhone: '' }));
                      }}
                      className={`w-full rounded-xl border bg-white pl-11 pr-3 py-2 text-slate-900 font-mono text-xs outline-none shadow-sm transition ${
                        shopFormErrors.ownerPhone ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                      }`}
                    />
                  </div>
                  {shopFormErrors.ownerPhone ? (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">{shopFormErrors.ownerPhone}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1">10-digit mobile number (starts with 6-9)</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-slate-800 font-bold mb-1 block">Owner Login Email *</label>
                <input
                  type="email"
                  required
                  maxLength={80}
                  placeholder="owner@apexprint.com"
                  value={ownerEmail}
                  onChange={(e) => {
                    setOwnerEmail(e.target.value);
                    if (shopFormErrors.ownerEmail) setShopFormErrors((prev) => ({ ...prev, ownerEmail: '' }));
                  }}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-slate-900 outline-none shadow-sm transition ${
                    shopFormErrors.ownerEmail ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
                {shopFormErrors.ownerEmail && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">{shopFormErrors.ownerEmail}</p>
                )}
              </div>

              <div>
                <label className="text-slate-800 font-bold mb-1 block">Initial Password *</label>
                <input
                  type="text"
                  required
                  placeholder="At least 6 characters"
                  value={initialPassword}
                  onChange={(e) => {
                    setInitialPassword(e.target.value);
                    if (shopFormErrors.initialPassword) setShopFormErrors((prev) => ({ ...prev, initialPassword: '' }));
                  }}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-slate-900 font-mono outline-none shadow-sm transition ${
                    shopFormErrors.initialPassword ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
                {shopFormErrors.initialPassword ? (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">{shopFormErrors.initialPassword}</p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">Minimum 6 characters for shopkeeper terminal login</p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterShopModal(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingShop}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 font-bold text-white shadow-sm disabled:opacity-50"
                >
                  {submittingShop ? 'Registering...' : 'Register Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Shop */}
      {showEditShopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-sm font-bold text-slate-900">
                Edit Cyber Café Shop
              </h3>
              <button
                onClick={() => setShowEditShopModal(false)}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUpdateShopDetails} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-800 font-bold mb-1 block">Shop Name *</label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={editShopName}
                  onChange={(e) => {
                    setEditShopName(e.target.value);
                    if (editShopFormErrors.name) setEditShopFormErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-slate-900 outline-none shadow-sm transition ${
                    editShopFormErrors.name ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
                {editShopFormErrors.name && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">{editShopFormErrors.name}</p>
                )}
              </div>

              <div>
                <label className="text-slate-800 font-bold mb-1 block">Address *</label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={editShopAddress}
                  onChange={(e) => {
                    setEditShopAddress(e.target.value);
                    if (editShopFormErrors.address) setEditShopFormErrors((prev) => ({ ...prev, address: '' }));
                  }}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-slate-900 outline-none shadow-sm transition ${
                    editShopFormErrors.address ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
                {editShopFormErrors.address && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">{editShopFormErrors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-800 font-bold mb-1 block">Owner Name</label>
                  <input
                    type="text"
                    maxLength={50}
                    placeholder="e.g. Rajesh Kumar"
                    value={editShopOwnerName}
                    onChange={(e) => {
                      setEditShopOwnerName(e.target.value);
                      if (editShopFormErrors.ownerName) setEditShopFormErrors((prev) => ({ ...prev, ownerName: '' }));
                    }}
                    className={`w-full rounded-xl border bg-white px-3 py-2 text-slate-900 outline-none shadow-sm transition ${
                      editShopFormErrors.ownerName ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  {editShopFormErrors.ownerName && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">{editShopFormErrors.ownerName}</p>
                  )}
                </div>

                <div>
                  <label className="text-slate-800 font-bold mb-1 block">Owner Phone</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-slate-500 select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={editShopOwnerPhone}
                      onChange={(e) => {
                        const clean = cleanIndianPhone(e.target.value);
                        setEditShopOwnerPhone(clean);
                        if (editShopFormErrors.phone) setEditShopFormErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      className={`w-full rounded-xl border bg-white pl-11 pr-3 py-2 text-slate-900 font-mono text-xs outline-none shadow-sm transition ${
                        editShopFormErrors.phone ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                      }`}
                    />
                  </div>
                  {editShopFormErrors.phone ? (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1">{editShopFormErrors.phone}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1">10-digit mobile number (starts with 6-9)</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-slate-800 font-bold mb-1 block">Shop UPI ID (for Direct Payments)</label>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. shopname@upi, 9876543210@paytm"
                  value={editShopUpiId}
                  onChange={(e) => {
                    setEditShopUpiId(e.target.value);
                    if (editShopFormErrors.upiId) setEditShopFormErrors((prev) => ({ ...prev, upiId: '' }));
                  }}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-slate-900 font-mono text-xs outline-none shadow-sm transition ${
                    editShopFormErrors.upiId ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
                {editShopFormErrors.upiId ? (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">{editShopFormErrors.upiId}</p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">Format: username@bank (e.g. apexprint@okaxis)</p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditShopModal(false)}
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

      {/* MODAL: Shop Standee QR Preview */}
      {showQRModal && selectedQRShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute right-4 top-4 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
            >
              Close
            </button>
            <QRCodeCard
              shopId={selectedQRShop._id || selectedQRShop.id}
              shopName={selectedQRShop.name}
              qrDataUrl={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                `${
                  typeof window !== 'undefined' &&
                  !window.location.origin.includes('localhost') &&
                  !window.location.origin.includes('127.0.0.1')
                    ? window.location.origin
                    : process.env.NEXT_PUBLIC_APP_URL || 'https://printonline-two.vercel.app'
                }/shop/${selectedQRShop._id || selectedQRShop.id}`
              )}`}
              address={selectedQRShop.address}
            />
          </div>
        </div>
      )}

      {/* MODAL: Create New Super Admin */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-sm font-bold text-slate-900">
                Create New Super Admin
              </h3>
              <button
                onClick={() => setShowCreateAdminModal(false)}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-800 font-bold mb-1 block">Full Name *</label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  placeholder="e.g. Khushi Aggarwal"
                  value={newAdminName}
                  onChange={(e) => {
                    setNewAdminName(e.target.value);
                    if (adminFormErrors.name) setAdminFormErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-slate-900 outline-none shadow-sm transition ${
                    adminFormErrors.name ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
                {adminFormErrors.name && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">{adminFormErrors.name}</p>
                )}
              </div>

              <div>
                <label className="text-slate-800 font-bold mb-1 block">Email (Login ID) *</label>
                <input
                  type="email"
                  required
                  maxLength={80}
                  placeholder="khushi@printporter.com"
                  value={newAdminEmail}
                  onChange={(e) => {
                    setNewAdminEmail(e.target.value);
                    if (adminFormErrors.email) setAdminFormErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-slate-900 outline-none shadow-sm transition ${
                    adminFormErrors.email ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
                {adminFormErrors.email && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">{adminFormErrors.email}</p>
                )}
              </div>

              <div>
                <label className="text-slate-800 font-bold mb-1 block">Phone Number</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-slate-500 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={newAdminPhone}
                    onChange={(e) => {
                      const clean = cleanIndianPhone(e.target.value);
                      setNewAdminPhone(clean);
                      if (adminFormErrors.phone) setAdminFormErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    className={`w-full rounded-xl border bg-white pl-11 pr-3 py-2 text-slate-900 font-mono text-xs outline-none shadow-sm transition ${
                      adminFormErrors.phone ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                </div>
                {adminFormErrors.phone ? (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">{adminFormErrors.phone}</p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">Optional 10-digit mobile number</p>
                )}
              </div>

              <div>
                <label className="text-slate-800 font-bold mb-1 block">Initial Password *</label>
                <input
                  type="text"
                  required
                  placeholder="At least 6 characters"
                  value={newAdminPassword}
                  onChange={(e) => {
                    setNewAdminPassword(e.target.value);
                    if (adminFormErrors.password) setAdminFormErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-slate-900 font-mono outline-none shadow-sm transition ${
                    adminFormErrors.password ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
                {adminFormErrors.password && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">{adminFormErrors.password}</p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 font-bold text-white shadow-sm disabled:opacity-50"
                >
                  {creatingAdmin ? 'Creating...' : 'Create Super Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Plan */}
      {showAddPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading text-sm font-bold text-slate-900">
                Create Platform Subscription Plan
              </h3>
              <button
                onClick={() => setShowAddPlanModal(false)}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-800 font-bold mb-1 block">Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Cyber Hub"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-800 font-bold mb-1 block">Price ₹/mo *</label>
                  <input
                    type="number"
                    required
                    value={planPriceMonthly}
                    onChange={(e) => setPlanPriceMonthly(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-800 font-bold mb-1 block">Max Printers *</label>
                  <input
                    type="number"
                    required
                    value={planMaxPrinters}
                    onChange={(e) => setPlanMaxPrinters(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-800 font-bold mb-1 block">Max Orders/Month</label>
                <input
                  type="number"
                  value={planMaxOrders}
                  onChange={(e) => setPlanMaxOrders(parseInt(e.target.value, 10) || 1000)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div>
                <label className="text-slate-800 font-bold mb-1 block">Description</label>
                <textarea
                  rows={2}
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  placeholder="Best suited for college campus & busy cyber cafés"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPlanModal(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2 font-bold text-white shadow-sm"
                >
                  Publish Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
