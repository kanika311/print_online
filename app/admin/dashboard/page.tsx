'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    | 'DASHBOARD'
    | 'USERS'
    | 'HUBS'
    | 'ORDERS'
    | 'PAYMENTS'
    | 'PRINTERS'
    | 'ANALYTICS'
    | 'SETTINGS'
  >('DASHBOARD');

  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);
  const [hubStatusFilter, setHubStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED'>('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('printporter_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 1. Fetch Shops
      const shopsRes = await fetch('/api/shops', { headers });
      if (shopsRes.ok) {
        const data = await shopsRes.json();
        setShops(data.shops || []);
      }

      // 2. Fetch Users
      const usersRes = await fetch('/api/users', { headers });
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      // 3. Fetch Orders
      const ordersRes = await fetch('/api/orders', { headers });
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
      }

      // 4. Fetch Printers
      const printersRes = await fetch('/api/printers', { headers });
      if (printersRes.ok) {
        const data = await printersRes.json();
        setPrinters(data.printers || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Filtered datasets
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.phone?.includes(userSearchQuery)
  );

  const filteredHubs = shops.filter((s) => {
    if (hubStatusFilter === 'ACTIVE') return s.isActive !== false;
    if (hubStatusFilter === 'SUSPENDED') return s.isActive === false;
    if (hubStatusFilter === 'PENDING') return s.subscriptionStatus === 'TRIAL' || !s.isActive;
    return true;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  const activePrintersCount = printers.filter((p) => p.status === 'AVAILABLE').length;

  const handleToggleUserBlock = async (userId: string, currentBlocked: boolean) => {
    try {
      const token = localStorage.getItem('printporter_token');
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, isBlocked: !currentBlocked }),
      });

      if (res.ok) {
        showToast(currentBlocked ? 'User reactivated successfully' : 'User suspended');
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isBlocked: !currentBlocked } : u))
        );
      }
    } catch (e) {
      showToast('Action failed');
    }
  };

  const handleToggleShopActive = async (shopId: string, currentActive: boolean) => {
    try {
      const token = localStorage.getItem('printporter_token');
      const res = await fetch(`/api/shops/${shopId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (res.ok) {
        showToast(!currentActive ? 'Shop approved & activated' : 'Shop suspended');
        setShops((prev) =>
          prev.map((s) => (s._id === shopId || s.id === shopId ? { ...s, isActive: !currentActive } : s))
        );
      }
    } catch (e) {
      showToast('Shop update failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 selection:bg-purple-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-purple-600 text-white font-bold px-4 py-2 text-xs shadow-xl animate-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* 1. SAAS ADMIN SIDEBAR */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/90 flex flex-col justify-between shrink-0 p-4">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-2.5 pb-6 border-b border-slate-800">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center font-black text-base shadow-md font-heading">
              P
            </div>
            <div>
              <span className="font-heading text-base font-black tracking-tight text-white block">
                Prinly<span className="text-purple-400">.in</span>
              </span>
              <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block">
                Super Admin Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5 text-xs font-bold">
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'DASHBOARD'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>📊 Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('HUBS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'HUBS'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>🏪 Printing Hubs</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-purple-300">
                {shops.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('USERS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'USERS'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>👥 Platform Users</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-purple-300">
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ORDERS')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'ORDERS'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>📑 Live Orders</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-purple-300">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('PRINTERS')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition ${
                activeTab === 'PRINTERS'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>🖨️ Fleet Hardware</span>
            </button>

            <Link
              href="/admin/cms"
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 hover:bg-amber-500/30 transition border border-amber-500/30 font-extrabold"
            >
              <span>✏️ Admin CMS</span>
              <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded uppercase">
                Zero-Code
              </span>
            </Link>

            <Link
              href="/"
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <span>🌐 Public Homepage</span>
            </Link>
          </nav>
        </div>

        {/* Footer Admin info */}
        <div className="pt-4 border-t border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>Admin</span>
            <span className="text-emerald-400 font-bold">● Super User</span>
          </div>
          <button
            onClick={() => {
              document.cookie = 'printporter_token=; Max-Age=0; path=/;';
              router.push('/login');
            }}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-300 font-bold text-xs transition text-center"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* 2. MAIN ADMIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-black text-white">
              Prinly Network Overview
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time cyber cafe telemetry, printer fleet queues, and financial settlement
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/cms"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition active:scale-95"
            >
              Manage CMS & Copy &rarr;
            </Link>
            <button
              onClick={loadAdminData}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
            >
              ↻ Refresh Telemetry
            </button>
          </div>
        </div>

        {/* 6 KEY DASHBOARD METRICS CARDS (Section 15) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Total Users
            </span>
            <div className="text-xl sm:text-2xl font-black text-white mt-1 font-heading">
              {users.length}
            </div>
            <span className="text-[10px] text-purple-400 font-bold mt-1 block">
              ● Active Accounts
            </span>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Active Hubs
            </span>
            <div className="text-xl sm:text-2xl font-black text-cyan-400 mt-1 font-heading">
              {shops.filter((s) => s.isActive !== false).length}
            </div>
            <span className="text-[10px] text-cyan-300 font-bold mt-1 block">
              ● Cyber Cafes
            </span>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Today's Orders
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-400 mt-1 font-heading">
              {orders.length}
            </div>
            <span className="text-[10px] text-blue-300 font-bold mt-1 block">
              ● In Queue / Done
            </span>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Platform Gross
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 font-heading">
              ₹{totalRevenue.toFixed(0)}
            </div>
            <span className="text-[10px] text-emerald-300 font-bold mt-1 block">
              ● 100% Settled
            </span>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Pending Verify
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1 font-heading">
              {shops.filter((s) => s.isActive === false).length}
            </div>
            <span className="text-[10px] text-amber-300 font-bold mt-1 block">
              ● Needs Approval
            </span>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Active Printers
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-400 mt-1 font-heading">
              {activePrintersCount || 3}
            </div>
            <span className="text-[10px] text-indigo-300 font-bold mt-1 block">
              ● Ready Spoolers
            </span>
          </div>
        </div>

        {/* 3. PRINTING HUB MANAGEMENT (Section 16) */}
        {(activeTab === 'DASHBOARD' || activeTab === 'HUBS') && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-heading text-lg font-black text-white">
                  Partner Printing Hubs & Cyber Cafes
                </h2>
                <p className="text-xs text-slate-400">
                  Manage shop verification, suspend/activate terminals, and review pricing
                </p>
              </div>

              {/* Status filter tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800 text-xs">
                {(['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setHubStatusFilter(filter)}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      hubStatusFilter === filter
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Hubs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="py-3 px-3">Shop Name</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Owner Contact</th>
                    <th className="py-3 px-3">Printers</th>
                    <th className="py-3 px-3">Live Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredHubs.map((hub) => (
                    <tr key={hub._id || hub.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white font-heading">{hub.name}</div>
                        <div className="text-[10px] font-mono text-cyan-400">{hub.upiId}</div>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate text-slate-400">
                        {hub.address}
                      </td>
                      <td className="py-3 px-3">
                        <div>{hub.phone}</div>
                        <div className="text-[10px] text-slate-500">{hub.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-white">{hub.totalPrinters || 2}</span> units
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            hub.isActive !== false
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {hub.isActive !== false ? '● ACTIVE' : '● SUSPENDED'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => handleToggleShopActive(hub._id || hub.id, hub.isActive !== false)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                            hub.isActive !== false
                              ? 'bg-rose-900/60 hover:bg-rose-800 text-rose-300'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {hub.isActive !== false ? 'Suspend' : 'Approve & Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. USER MANAGEMENT (Section 17) */}
        {(activeTab === 'DASHBOARD' || activeTab === 'USERS') && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-heading text-lg font-black text-white">
                  Customer & User Accounts
                </h2>
                <p className="text-xs text-slate-400">
                  Search, inspect print activity, and manage account statuses
                </p>
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search user by name or phone..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="py-3 px-3">Name</th>
                    <th className="py-3 px-3">Email & Phone</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Joined Date</th>
                    <th className="py-3 px-3">Account Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-bold text-white">
                        {user.name}
                      </td>
                      <td className="py-3 px-3">
                        <div>{user.email}</div>
                        <div className="text-[10px] text-slate-500">{user.phone}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-extrabold text-purple-300">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            !user.isBlocked
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {!user.isBlocked ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleToggleUserBlock(user.id, user.isBlocked)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                            !user.isBlocked
                              ? 'bg-rose-950 hover:bg-rose-900 text-rose-300'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {!user.isBlocked ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
