'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Printer,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  User,
  Sparkles,
  AlertCircle,
  Check,
} from 'lucide-react';

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
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#0a0e17] px-4 py-12 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Brand Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-500/30">
              <Printer className="h-6 w-6" />
            </div>
            <span className="font-heading text-3xl font-black text-white tracking-tight">
              Print<span className="text-sky-400">Porter</span>
            </span>
          </Link>
          <h2 className="mt-4 font-heading text-xl font-bold text-white">
            Welcome to Smart Printing
          </h2>
          <p className="text-xs text-slate-400">
            Sign in to access your print orders and queue
          </p>
        </div>

        {/* 1-Click Demo Accounts Selector */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-slate-900/80 p-3.5 backdrop-blur-xl">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span>1-Click Demo Logins</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => quickFill('CUSTOMER')}
              className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-slate-800/80 p-2.5 text-center hover:border-sky-500/40 hover:bg-slate-800 transition"
            >
              <User className="h-4 w-4 text-sky-400 mb-1" />
              <span className="text-[11px] font-bold text-white">Customer</span>
              <span className="text-[9px] text-slate-400">Aman</span>
            </button>

            <button
              type="button"
              onClick={() => quickFill('SHOP_OWNER')}
              className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-slate-800/80 p-2.5 text-center hover:border-emerald-500/40 hover:bg-slate-800 transition"
            >
              <Printer className="h-4 w-4 text-emerald-400 mb-1" />
              <span className="text-[11px] font-bold text-white">Printer Owner</span>
              <span className="text-[9px] text-slate-400">Rajesh</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-white/10 bg-slate-800/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-slate-800/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link href="/register" className="font-bold text-sky-400 hover:underline">
              Create Customer Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
