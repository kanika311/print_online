'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const cleanIndianPhone = (val: string) => {
    return val.replace(/\D/g, '').slice(0, 10);
  };

  const validate = () => {
    const errors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      errors.name = 'Full name must be at least 2 characters';
    } else if (trimmedName.length > 50) {
      errors.name = 'Full name cannot exceed 50 characters';
    } else if (!/^[a-zA-Z\s.]+$/.test(trimmedName)) {
      errors.name = 'Name can only contain letters and spaces';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    const cleanedPhone = cleanIndianPhone(phone);
    if (!cleanedPhone) {
      errors.phone = 'Mobile number is required';
    } else if (cleanedPhone.length !== 10) {
      errors.phone = 'Mobile number must be exactly 10 digits';
    } else if (!/^[6-9]/.test(cleanedPhone)) {
      errors.phone = 'Indian mobile number must start with 6, 7, 8, or 9';
    }

    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    return errors;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setFormErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: cleanIndianPhone(phone),
          password: password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register account');
      }

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12 text-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm tracking-wider shadow-md">
              PP
            </div>
            <span className="font-heading text-2xl font-black text-slate-900 tracking-tight">
              Print<span className="text-blue-600">Porter</span>
            </span>
          </Link>
          <h2 className="mt-3 font-heading text-lg font-bold text-slate-900">
            Create Customer Account
          </h2>
          <p className="text-xs text-slate-500">
            Sign up for live order tracking and instant kiosk checkout
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-7 shadow-md">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-semibold">
              Notice: {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Full Name *
              </label>
              <input
                type="text"
                required
                maxLength={50}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="e.g. Priya Singh"
                className={`w-full rounded-xl border bg-white py-2 px-3 text-xs text-slate-900 placeholder-slate-400 outline-none shadow-sm transition ${
                  formErrors.name ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                }`}
              />
              {formErrors.name && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Email Address *
              </label>
              <input
                type="email"
                required
                maxLength={80}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="name@example.com"
                className={`w-full rounded-xl border bg-white py-2 px-3 text-xs text-slate-900 placeholder-slate-400 outline-none shadow-sm transition ${
                  formErrors.email ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                }`}
              />
              {formErrors.email && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Phone Number (for SMS & Queue Alerts) *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-slate-500 select-none">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    const clean = cleanIndianPhone(e.target.value);
                    setPhone(clean);
                    if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  placeholder="9876543210"
                  className={`w-full rounded-xl border bg-white pl-11 pr-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 outline-none shadow-sm transition ${
                    formErrors.phone ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                  }`}
                />
              </div>
              {formErrors.phone ? (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{formErrors.phone}</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">10-digit mobile number (starts with 6-9)</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: '' }));
                }}
                placeholder="At least 6 characters"
                className={`w-full rounded-xl border bg-white py-2 px-3 text-xs text-slate-900 placeholder-slate-400 outline-none shadow-sm transition ${
                  formErrors.password ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600' : 'border-slate-300 focus:border-blue-600'
                }`}
              />
              {formErrors.password ? (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{formErrors.password}</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">Must be at least 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-blue-600 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
