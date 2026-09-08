'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Document3D from './3d/Document3D';
import Printer3D from './3d/Printer3D';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAction?: 'LOGIN' | 'REGISTER' | 'GENERAL';
}

export default function RoleSelectionModal({
  isOpen,
  onClose,
  targetAction = 'GENERAL',
}: RoleSelectionModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSelectUser = () => {
    onClose();
    if (targetAction === 'LOGIN') {
      router.push('/login?role=customer');
    } else if (targetAction === 'REGISTER') {
      router.push('/register?role=customer');
    } else {
      router.push('/user/dashboard');
    }
  };

  const handleSelectPrinterOwner = () => {
    onClose();
    if (targetAction === 'LOGIN') {
      router.push('/login?role=printer_owner');
    } else if (targetAction === 'REGISTER') {
      router.push('/printer/register');
    } else {
      router.push('/printer/register');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(37,99,235,0.25)] overflow-hidden">
        {/* Top ambient highlight */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold transition"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <span>Prinly Platform Gateway</span>
          </div>
          <h3 className="font-heading text-xl sm:text-2xl font-black text-slate-900">
            How do you want to use Prinly?
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Choose your journey to access customized tools, queues, and features.
          </p>
        </div>

        {/* The Two Primary Perspectives Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: USER */}
          <div
            onClick={handleSelectUser}
            className="group cursor-pointer rounded-2xl border-2 border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 text-left hover:border-blue-600 hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              {/* 3D Mini Document Preview */}
              <div className="h-28 flex items-center justify-center mb-3">
                <Document3D size="sm" title="Upload & Print" pages={8} />
              </div>

              <div className="inline-block px-2 py-0.5 rounded bg-blue-100/70 text-[10px] font-extrabold text-blue-700 uppercase tracking-wider mb-1.5">
                Customer / Student
              </div>

              <h4 className="font-heading text-base font-black text-slate-900 group-hover:text-blue-600 transition">
                USER
              </h4>

              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Print documents from nearby Prinly hubs without waiting in line.
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectUser();
              }}
              className="mt-4 w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md group-hover:shadow-blue-500/25 transition active:scale-95 text-center"
            >
              Continue as User &rarr;
            </button>
          </div>

          {/* Card 2: PRINTER OWNER */}
          <div
            onClick={handleSelectPrinterOwner}
            className="group cursor-pointer rounded-2xl border-2 border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 text-left hover:border-cyan-500 hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              {/* 3D Mini Printer Preview */}
              <div className="h-28 flex items-center justify-center mb-3">
                <Printer3D size="sm" status="ONLINE" />
              </div>

              <div className="inline-block px-2 py-0.5 rounded bg-cyan-100/70 text-[10px] font-extrabold text-cyan-800 uppercase tracking-wider mb-1.5">
                Cyber Cafe / Shop
              </div>

              <h4 className="font-heading text-base font-black text-slate-900 group-hover:text-cyan-600 transition">
                PRINTER OWNER
              </h4>

              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Accept and manage online printing orders, fleet queues, and direct payments.
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectPrinterOwner();
              }}
              className="mt-4 w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-black shadow-md transition active:scale-95 text-center"
            >
              Continue as Printer Owner &rarr;
            </button>
          </div>
        </div>

        {/* Small Switch Footnote */}
        <div className="mt-5 text-center text-[11px] text-slate-400 font-medium border-t border-slate-100 pt-3">
          💡 You can switch roles later by logging out.
        </div>
      </div>
    </div>
  );
}
