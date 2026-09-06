'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PrinterLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('rajesh@cyberprint.com');
  const [password, setPassword] = useState('Shop@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
        throw new Error(data.error || 'Invalid credentials');
      }

      if (data.user.role !== 'SHOP_OWNER' && data.user.role !== 'ADMIN') {
        throw new Error('Access denied: This login is reserved for Printer Shop Owners.');
      }

      if (data.token) {
        localStorage.setItem('printporter_token', data.token);
        localStorage.setItem('printporter_user', JSON.stringify(data.user));
        document.cookie = `printporter_token=${data.token}; path=/; max-age=604800; SameSite=Lax; ${window.location.protocol === 'https:' ? 'Secure;' : ''}`;
      }

      window.location.href = '/printer/dashboard';
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12 text-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-base shadow-sm mb-3">
            SHOP
          </div>
          <h1 className="font-heading text-xl font-bold text-slate-900">
            Printer Owner Terminal
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
            Access your cyber café queue, approve cash payments, and manage printer fleet
          </p>
        </div>

        {/* Notice: Credentials provided by Admin */}
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs text-blue-900 shadow-sm">
          <h4 className="font-bold">
            Admin-Provided Credentials
          </h4>
          <p className="text-[11px] text-blue-800 mt-0.5">
            Printer accounts are registered exclusively through the platform Administrator. Demo credentials pre-filled below.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-7 shadow-md">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-semibold">
              Notice: {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Owner Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 outline-none focus:border-blue-600 shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Shop Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 outline-none focus:border-blue-600 shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Opening Terminal...' : 'Open Shop Terminal'}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500">
            Switch to{' '}
            <Link href="/login" className="font-bold text-blue-600 hover:underline">
              Customer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
