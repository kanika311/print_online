'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTab, setSelectedTab] = useState<'CUSTOMER' | 'SHOP_OWNER'>(
    initialRole === 'printer_owner' ? 'SHOP_OWNER' : 'CUSTOMER'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRole === 'printer_owner') {
      setSelectedTab('SHOP_OWNER');
    }
  }, [initialRole]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      if (data.token) {
        localStorage.setItem('printporter_token', data.token);
        localStorage.setItem('printporter_user', JSON.stringify(data.user));
        document.cookie = `printporter_token=${data.token}; path=/; max-age=604800; SameSite=Lax; ${
          window.location.protocol === 'https:' ? 'Secure;' : ''
        }`;
      }

      // Role-based redirection:
      if (data.user.role === 'ADMIN') {
        window.location.href = '/khushi-admin';
      } else if (data.user.role === 'SHOP_OWNER') {
        window.location.href = '/printer/dashboard';
      } else {
        window.location.href = '/user/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Quick Fill for testing
  const quickFill = (role: 'CUSTOMER' | 'SHOP_OWNER') => {
    setSelectedTab(role);
    if (role === 'SHOP_OWNER') {
      setEmail('rajesh@cyberprint.com');
      setPassword('Shop@123');
    } else {
      setEmail('aman@student.edu');
      setPassword('User@123');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12 text-slate-900">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex flex-col items-center gap-2 group">
            <img
              src="/logo.png"
              alt="Prinly.in - Print • Scan • Online"
              className="h-12 w-auto object-contain drop-shadow transition group-hover:scale-105"
            />
          </Link>
          <h2 className="mt-3 font-heading text-lg font-bold text-slate-900">
            Sign In to Prinly Platform
          </h2>
          <p className="text-xs text-slate-500">
            Customer & Cyber Café Hub Partner Access
          </p>
        </div>

        {/* 1-Click Demo Accounts Selector (Confidential Admin excluded from public view) */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            1-Click Quick Fill
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => quickFill('CUSTOMER')}
              className={`rounded-xl border p-2.5 text-center transition ${
                selectedTab === 'CUSTOMER'
                  ? 'border-blue-600 bg-blue-50/70 text-blue-700'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span className="text-xs font-black block">User (Customer)</span>
              <span className="text-[10px] text-slate-500 truncate block">aman@student.edu</span>
            </button>

            <button
              type="button"
              onClick={() => quickFill('SHOP_OWNER')}
              className={`rounded-xl border p-2.5 text-center transition ${
                selectedTab === 'SHOP_OWNER'
                  ? 'border-cyan-500 bg-cyan-50/70 text-cyan-800'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span className="text-xs font-black block">Hub Owner (Shop)</span>
              <span className="text-[10px] text-slate-500 truncate block">rajesh@cyberprint.com</span>
            </button>
          </div>
        </div>

        {/* Main Login Form */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address or Phone
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                <a href="#" className="text-[11px] font-bold text-blue-600 hover:underline">
                  Forgot?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-3 text-xs font-black text-white shadow-md shadow-blue-600/20 hover:opacity-95 transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard →'}
            </button>
          </form>

          {/* Registration redirects */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link href="/register" className="font-bold text-blue-600 hover:underline">
              Register as User
            </Link>
            {' • '}
            <Link href="/printer/register" className="font-bold text-cyan-600 hover:underline">
              Join as Hub
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
