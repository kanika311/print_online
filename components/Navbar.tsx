'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Printer,
  QrCode,
  MapPin,
  Search,
  User,
  LogOut,
  Shield,
  Layers,
  ChevronDown,
  Navigation,
  FileText,
} from 'lucide-react';

interface NavbarProps {
  onOpenQRScanner?: () => void;
  currentLocation?: string;
  onLocationChange?: (loc: string) => void;
}

export default function Navbar({
  onOpenQRScanner,
  currentLocation = 'Sector 18, Noida, NCR',
  onLocationChange,
}: NavbarProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    // Check logged in user session
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    document.cookie = 'printporter_token=; Max-Age=0; path=/;';
    setCurrentUser(null);
    setIsProfileOpen(false);
    router.push('/login');
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const newLoc = `GPS: [${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}]`;
          if (onLocationChange) onLocationChange(newLoc);
        },
        () => {
          setIsLocating(false);
          if (onLocationChange) onLocationChange('Delhi University North Campus');
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0b0f19]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo on the Left */}
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-500/25 transition-transform duration-300 group-hover:scale-105">
              <Printer className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-2xl font-black tracking-tight text-white">
                  Print<span className="text-sky-400">Porter</span>
                </span>
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  Smart
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                On-Demand Print & Cyber Hubs
              </p>
            </div>
          </Link>
        </div>

        {/* Location Search / Current Location in the Center */}
        <div className="hidden flex-1 max-w-md items-center mx-6 md:flex">
          <div className="relative flex w-full items-center rounded-2xl border border-white/10 bg-slate-900/90 px-3 py-2 shadow-inner focus-within:border-sky-500/50">
            <button
              onClick={handleLocateMe}
              title="Use current GPS location"
              className="mr-2 flex items-center gap-1.5 rounded-lg bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-400 hover:bg-sky-500/25 transition"
            >
              <Navigation className={`h-3.5 w-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span className="truncate max-w-[100px]">{isLocating ? 'Locating...' : 'Nearby'}</span>
            </button>
            <MapPin className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery || currentLocation}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (onLocationChange) onLocationChange(e.target.value);
              }}
              placeholder="Search shop, street, college, or city..."
              className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
            />
          </div>
        </div>

        {/* Main Actions & Profile on the Right */}
        <div className="flex items-center gap-3">
          {/* Main Action: Scan QR Button */}
          <button
            onClick={onOpenQRScanner}
            id="navbar-scan-qr-btn"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/30 transition-all hover:brightness-110 hover:shadow-sky-500/50 active:scale-95"
          >
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">Scan Shop QR</span>
            <span className="sm:hidden">Scan</span>
          </button>

          {/* Quick Orders Link */}
          <Link
            href="/orders"
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <FileText className="h-3.5 w-3.5 text-sky-400" />
            <span>My Orders</span>
          </Link>

          {/* User Profile / Login Menu */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 p-1.5 pl-2 hover:bg-slate-800 transition"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-sky-400 overflow-hidden font-bold text-xs">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    currentUser.name.charAt(0)
                  )}
                </div>
                <div className="hidden text-left lg:block">
                  <div className="text-xs font-bold text-slate-200 truncate max-w-[100px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] font-semibold text-sky-400">
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 pr-0.5" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-2xl backdrop-blur-xl">
                  <div className="border-b border-white/5 p-2 mb-1">
                    <p className="text-xs font-bold text-white">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-400">
                      {currentUser.role}
                    </span>
                  </div>

                  <Link
                    href="/orders"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    <FileText className="h-3.5 w-3.5 text-sky-400" />
                    My Print Orders
                  </Link>

                  {currentUser.role === 'SHOP_OWNER' && (
                    <Link
                      href="/printer/dashboard"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Printer Shop Dashboard
                    </Link>
                  )}

                  {currentUser.role === 'ADMIN' && (
                    <Link
                      href="/khushi-admin"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-purple-400 hover:bg-purple-500/10"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Admin Control Panel
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
