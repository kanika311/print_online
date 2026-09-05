'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Main Navbar Row */}
        <div className="flex h-16 sm:h-18 items-center justify-between gap-2">
          {/* Brand Logo on the Left */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link href="/" className="group flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-xs sm:text-sm tracking-wider shadow-sm">
                PP
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading text-lg sm:text-xl font-black tracking-tight text-slate-900">
                    Print<span className="text-blue-600">Porter</span>
                  </span>
                  <span className="hidden sm:inline-block rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">
                    Direct Print
                  </span>
                </div>
                <p className="hidden sm:block text-[10px] text-slate-500 font-medium">
                  Fast Cyber Café Network
                </p>
              </div>
            </Link>
          </div>

          {/* Location Search in the Center (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md items-center mx-4">
            <div className="relative flex w-full items-center rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 shadow-inner focus-within:border-blue-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-600 transition">
              <button
                onClick={handleLocateMe}
                title="Use current GPS location"
                className="mr-2 flex items-center rounded-lg bg-blue-100 border border-blue-200 px-2 py-0.5 text-xs font-bold text-blue-700 hover:bg-blue-200 transition shrink-0"
              >
                <span>{isLocating ? 'Locating...' : 'Near Me'}</span>
              </button>
              <input
                type="text"
                value={searchQuery || currentLocation}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (onLocationChange) onLocationChange(e.target.value);
                }}
                placeholder="Search shop, street, college, or city..."
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none font-medium"
              />
            </div>
          </div>

          {/* Main Actions & Profile on the Right */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Main Action: Scan QR Button */}
            <button
              onClick={onOpenQRScanner}
              id="navbar-scan-qr-btn"
              className="flex items-center rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-white shadow-sm transition active:scale-95"
            >
              <span className="hidden sm:inline">Scan Shop QR</span>
              <span className="sm:hidden">Scan QR</span>
            </button>

            {/* Quick Orders Link */}
            <Link
              href="/orders"
              className="hidden sm:inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition shadow-sm"
            >
              My Orders
            </Link>

            {/* User Profile / Login Menu */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white p-1 sm:p-1.5 pl-2 hover:bg-slate-50 transition shadow-sm"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-xs">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-bold text-slate-800 truncate max-w-[100px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] font-semibold text-blue-600">
                      {currentUser.role}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 px-1">Menu</span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-52 sm:w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in duration-100">
                    <div className="border-b border-slate-100 p-2 mb-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        {currentUser.role}
                      </span>
                    </div>

                    <Link
                      href="/orders"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition"
                    >
                      My Print Orders
                    </Link>

                    {currentUser.role === 'SHOP_OWNER' && (
                      <Link
                        href="/printer/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition"
                      >
                        Printer Shop Dashboard
                      </Link>
                    )}

                    {currentUser.role === 'ADMIN' && (
                      <Link
                        href="/khushi-admin"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center rounded-lg px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition"
                      >
                        Admin Control Panel
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition border-t border-slate-100 mt-1"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/login"
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition shadow-sm"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar Row (Visible on phones below md breakpoint) */}
        <div className="md:hidden pb-2.5 pt-0.5">
          <div className="relative flex w-full items-center rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 shadow-inner focus-within:border-blue-600 focus-within:bg-white transition">
            <button
              onClick={handleLocateMe}
              title="Use current GPS location"
              className="mr-2 flex items-center rounded-md bg-blue-100 border border-blue-200 px-2 py-0.5 text-[11px] font-bold text-blue-700 shrink-0"
            >
              <span>{isLocating ? '...' : 'GPS'}</span>
            </button>
            <input
              type="text"
              value={searchQuery || currentLocation}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (onLocationChange) onLocationChange(e.target.value);
              }}
              placeholder="Search shop, street, or college..."
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none font-medium"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
