'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RoleSelectionModal from './RoleSelectionModal';

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
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

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
    localStorage.removeItem('printporter_token');
    localStorage.removeItem('printporter_user');
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
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-18 items-center justify-between gap-2">
            {/* 1. Brand Logo on Left */}
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/" className="inline-flex items-center gap-2.5 group">
                <img
                  src="/logo.png"
                  alt="Prinly.in - Smart Cyber Cafe Print Network"
                  className="h-9 sm:h-10 w-auto object-contain transition group-hover:scale-105"
                />
              </Link>
            </div>

            {/* 2. Center Location Bar (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md items-center mx-4">
              <div className="relative flex w-full items-center rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 shadow-inner focus-within:border-blue-600 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-600 transition">
                <button
                  onClick={handleLocateMe}
                  title="Use current GPS location"
                  className="mr-2 flex items-center rounded-lg bg-blue-100 border border-blue-200 px-2 py-0.5 text-xs font-bold text-blue-700 hover:bg-blue-200 transition shrink-0"
                >
                  <span>{isLocating ? 'Locating...' : 'GPS Radar'}</span>
                </button>
                <input
                  type="text"
                  value={searchQuery || currentLocation}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (onLocationChange) onLocationChange(e.target.value);
                  }}
                  placeholder="Search hub, college, or area..."
                  className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none font-medium"
                />
              </div>
            </div>

            {/* 3. Primary Actions on Right */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Scan Shop QR */}
              {onOpenQRScanner && (
                <button
                  onClick={onOpenQRScanner}
                  id="navbar-scan-qr-btn"
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-extrabold text-cyan-400 shadow-sm transition active:scale-95 border border-slate-800"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span className="hidden sm:inline">Scan Counter QR</span>
                  <span className="sm:hidden">Scan QR</span>
                </button>
              )}

              {/* Partner Hub Program Link */}
              <Link
                href="/printer"
                className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 px-3 py-2 text-xs font-bold text-blue-700 transition shadow-2xs"
              >
                <span>Partner Program</span>
                <span className="text-[10px] bg-blue-200/80 text-blue-800 px-1 rounded font-extrabold">HUB</span>
              </Link>

              {/* Quick Orders Link - Only visible when signed in */}
              {currentUser && (
                <Link
                  href="/orders"
                  className="hidden sm:inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition shadow-sm"
                >
                  My Orders
                </Link>
              )}

              {/* User Profile / Login Menu */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white p-1 sm:p-1.5 pl-2 hover:bg-slate-50 transition shadow-sm"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-bold text-xs">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="hidden lg:block text-left">
                      <div className="text-xs font-bold text-slate-800 truncate max-w-[100px]">
                        {currentUser.name}
                      </div>
                      <div className="text-[10px] font-semibold text-blue-600">
                        {currentUser.role === 'SHOP_OWNER'
                          ? 'Hub Owner'
                          : currentUser.role === 'ADMIN'
                          ? 'Super Admin'
                          : 'Customer'}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 px-1">▼</span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in duration-100">
                      <div className="border-b border-slate-100 p-2.5 mb-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                        <span className="inline-block mt-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[9px] font-extrabold text-blue-700 uppercase">
                          {currentUser.role}
                        </span>
                      </div>

                      <Link
                        href="/user/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition"
                      >
                        User Dashboard
                      </Link>

                      <Link
                        href="/orders"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition"
                      >
                        My Print Orders
                      </Link>

                      {currentUser.role === 'SHOP_OWNER' && (
                        <Link
                          href="/printer/dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center rounded-lg px-3 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-50 transition"
                        >
                          Printer Hub Dashboard
                        </Link>
                      )}

                      {currentUser.role === 'ADMIN' && (
                        <Link
                          href="/khushi-admin"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50/70 hover:bg-blue-100 transition"
                        >
                          <span>Super Admin Console</span>
                          <span className="text-[9px] font-extrabold uppercase bg-blue-600 text-white px-1.5 py-0.5 rounded">ROOT</span>
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition border-t border-slate-100 mt-1"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setIsRoleModalOpen(true)}
                    className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition shadow-sm"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setIsRoleModalOpen(true)}
                    className="inline-flex rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-3.5 py-2 text-xs font-black text-white hover:opacity-95 transition shadow-md active:scale-95"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Search Bar Row */}
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
                placeholder="Search hub, street, or college..."
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none font-medium"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Global Role Selection Modal */}
      <RoleSelectionModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        targetAction="GENERAL"
      />
    </>
  );
}
