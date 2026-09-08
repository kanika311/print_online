'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UserRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [location, setLocation] = useState('Sector 18, Noida');
  const [preferredArea, setPreferredArea] = useState('Metro Market Complex');

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
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    const cleanedPhone = cleanIndianPhone(phone);
    if (!cleanedPhone || cleanedPhone.length !== 10) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
          address: `${location}, ${preferredArea}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (data.token) {
        localStorage.setItem('printporter_token', data.token);
        localStorage.setItem('printporter_user', JSON.stringify(data.user));
        document.cookie = `printporter_token=${data.token}; path=/; max-age=604800; SameSite=Lax; ${
          window.location.protocol === 'https:' ? 'Secure;' : ''
        }`;
      }

      // Specifications require: redirect to /user/dashboard
      window.location.href = '/user/dashboard';
    } catch (err: any) {
      setError(err.message || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    const rnd = Math.floor(100 + Math.random() * 900);
    setName(`Pooja Sharma ${rnd}`);
    setEmail(`pooja${rnd}@student.edu`);
    setPhone(`98765${rnd}12`);
    setPassword('User@123');
    setConfirmPassword('User@123');
    setLocation('Sector 18, Noida');
    setPreferredArea('Near Gate 2 Metro');
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
          <h2 className="mt-3 font-heading text-xl font-bold text-slate-900">
            Create Customer Account
          </h2>
          <p className="text-xs text-slate-500">
            Upload documents and print instantly at nearby partner hubs
          </p>
        </div>

        {/* 1-Click Fast Fill */}
        <div className="mb-4 flex items-center justify-between p-3 rounded-2xl bg-blue-50/70 border border-blue-200">
          <span className="text-xs font-bold text-blue-800">Testing evaluation?</span>
          <button
            type="button"
            onClick={handleDemoFill}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg shadow-sm transition active:scale-95"
          >
            Auto-fill Test User
          </button>
        </div>

        {/* Registration Form Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Verma"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-medium transition"
              />
              {formErrors.name && (
                <p className="text-[10px] text-rose-600 font-bold mt-0.5">{formErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-medium transition"
                />
                {formErrors.phone && (
                  <p className="text-[10px] text-rose-600 font-bold mt-0.5">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@mail.com"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-medium transition"
                />
                {formErrors.email && (
                  <p className="text-[10px] text-rose-600 font-bold mt-0.5">{formErrors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-medium transition"
                />
                {formErrors.password && (
                  <p className="text-[10px] text-rose-600 font-bold mt-0.5">{formErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-blue-600 font-medium transition"
                />
                {formErrors.confirmPassword && (
                  <p className="text-[10px] text-rose-600 font-bold mt-0.5">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Optional Location & Preferred Printing Area */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Sector / City"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Preferred Printing Area
                </label>
                <input
                  type="text"
                  value={preferredArea}
                  onChange={(e) => setPreferredArea(e.target.value)}
                  placeholder="e.g. Near Metro"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-3 text-xs font-black text-white shadow-md shadow-blue-600/20 hover:opacity-95 transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Continue to User Dashboard →'}
            </button>
          </form>

          {/* Partner hub link */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Own a printing shop or cyber cafe?{' '}
            <Link href="/printer/register" className="font-bold text-cyan-600 hover:underline">
              Register as a Prinly Hub
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
