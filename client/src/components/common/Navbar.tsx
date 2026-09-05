import React from 'react';
import { Printer, Wifi, Wallet, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleSwitcher } from './RoleSwitcher';
import { NotificationDrawer } from './NotificationDrawer';

interface NavbarProps {
  isMobileSimulator: boolean;
  setIsMobileSimulator: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isMobileSimulator,
  setIsMobileSimulator,
}) => {
  const { user, persona } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-400 p-0.5 shadow-lg shadow-brand-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Printer className="w-5 h-5 text-brand-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white font-heading">
                Print<span className="gradient-text">Porter</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider bg-brand-500/20 text-brand-400 border border-brand-500/30 px-1.5 py-0.2 rounded font-bold">
                MongoDB
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              On-Demand Cloud & Cyber Cafe Print Marketplace
            </p>
          </div>
        </div>

        {/* Central Persona Switcher */}
        <div className="hidden md:flex items-center">
          <RoleSwitcher
            isMobileSimulator={isMobileSimulator}
            setIsMobileSimulator={setIsMobileSimulator}
          />
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Live WebSocket Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Wifi className="w-3 h-3" />
            <span>Socket Live</span>
          </div>

          {/* User Wallet Balance */}
          {user && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200">
              <Wallet className="w-3.5 h-3.5 text-brand-400" />
              <span className="font-semibold text-white">₹{user.walletBalance.toFixed(2)}</span>
            </div>
          )}

          {/* Live Notification Drawer */}
          <NotificationDrawer />

          {/* User Profile Avatar */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-300 font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-medium text-white truncate max-w-[100px]">{user.name}</div>
                <div className="text-[10px] text-slate-400 capitalize">{persona}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile-only persona bar */}
      <div className="md:hidden px-4 pb-2 pt-1 border-t border-slate-800/40 flex justify-center">
        <RoleSwitcher
          isMobileSimulator={isMobileSimulator}
          setIsMobileSimulator={setIsMobileSimulator}
        />
      </div>
    </header>
  );
};
