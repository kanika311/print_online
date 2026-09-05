'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Route based on role
      if (data.user.role === 'ADMIN') {
        router.push('/khushi-admin');
      } else if (data.user.role === 'SHOP_OWNER') {
        router.push('/printer/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Quick Fill for testing
  const quickFill = (role: 'CUSTOMER' | 'SHOP_OWNER') => {
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
        {/* Brand Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm tracking-wider">
              PP
            </div>
            <span className="font-heading text-2xl font-black text-slate-900 tracking-tight">
              Print<span className="text-blue-600">Porter</span>
            </span>
          </Link>
          <h2 className="mt-3 font-heading text-lg font-bold text-slate-900">
            Sign In to PrintPorter
          </h2>
          <p className="text-xs text-slate-500">
            Access your orders, shop dashboard, or customer account
          </p>
        </div>

        {/* 1-Click Demo Accounts Selector */}
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            1-Click Quick Test Logins
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => quickFill('CUSTOMER')}
              className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-center hover:border-blue-500 hover:bg-blue-50/50 transition"
            >
              <span className="text-xs font-bold text-slate-900 block">Customer</span>
              <span className="text-[10px] text-slate-500">aman@student.edu</span>
            </button>

            <button
              type="button"
              onClick={() => quickFill('SHOP_OWNER')}
              className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-center hover:border-blue-500 hover:bg-blue-50/50 transition"
            >
              <span className="text-xs font-bold text-slate-900 block">Shop Owner</span>
              <span className="text-[10px] text-slate-500">rajesh@cyberprint.com</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-7 shadow-md">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-semibold">
              Notice: {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link href="/register" className="font-bold text-blue-600 hover:underline">
              Create Customer Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
