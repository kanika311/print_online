import React from 'react';
import { useAuth, PersonaType } from '../../context/AuthContext';
import { User, Store, Shield, Smartphone, Monitor } from 'lucide-react';

interface RoleSwitcherProps {
  isMobileSimulator: boolean;
  setIsMobileSimulator: (val: boolean) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  isMobileSimulator,
  setIsMobileSimulator,
}) => {
  const { persona, switchPersona, user, shop } = useAuth();

  const personas: { id: PersonaType; label: string; icon: any; badge: string; desc: string }[] = [
    {
      id: 'customer',
      label: 'User App',
      icon: User,
      badge: 'Customer View',
      desc: 'Upload PDF, configure print, track order',
    },
    {
      id: 'partner',
      label: 'Partner Hub',
      icon: Store,
      badge: shop ? shop.name : 'Cyber Cafe',
      desc: '45s incoming queue, print pipeline, COD cash',
    },
    {
      id: 'admin',
      label: 'Admin CMS',
      icon: Shield,
      badge: 'Super Admin',
      desc: 'KPIs, heatmap, KYC approval, COD reconciliation',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 border border-slate-800 p-1.5 rounded-2xl backdrop-blur-md">
      <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
        {personas.map((p) => {
          const Icon = p.icon;
          const isActive = persona === p.id;
          return (
            <button
              key={p.id}
              onClick={() => switchPersona(p.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{p.label}</span>
              {isActive && (
                <span className="hidden md:inline-block text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                  Active
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Viewport simulator toggle */}
      <button
        onClick={() => setIsMobileSimulator(!isMobileSimulator)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
          isMobileSimulator
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-white'
        }`}
        title="Toggle Mobile Viewport Simulator"
      >
        {isMobileSimulator ? (
          <>
            <Smartphone className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Mobile Frame</span>
          </>
        ) : (
          <>
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop View</span>
          </>
        )}
      </button>
    </div>
  );
};
