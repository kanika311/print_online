'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface FooterProps {
  cmsData?: any;
}

export default function Footer({ cmsData }: FooterProps) {
  const [footerContent, setFooterContent] = useState<any>(cmsData?.footer || null);

  useEffect(() => {
    if (!footerContent) {
      fetch('/api/cms')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.cms?.footer) {
            setFooterContent(data.cms.footer);
          }
        })
        .catch(() => {});
    }
  }, [footerContent]);

  const f = footerContent || {
    logoText: 'Prinly.in',
    tagline: 'Smart Cyber Cafe Print Network',
    description:
      'Prinly bridges remote digital documents with local cyber cafes and smart printers. Upload anywhere, print nearby, and collect instantly.',
    contactEmail: 'support@prinly.in',
    contactPhone: '+91 98111 22334',
    contactAddress: 'Prinly Technologies Inc., Sector 18, Commercial Hub, NCR, India',
    quickLinks: [
      { label: 'Home', url: '/' },
      { label: 'Find Printing Hub', url: '#nearby-shops' },
      { label: 'Become a Hub', url: '/printer/register' },
      { label: 'How It Works', url: '#how-it-works' },
      { label: 'User Dashboard', url: '/user/dashboard' },
      { label: 'Printer Dashboard', url: '/printer/dashboard' },
    ],
  };

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand & Tagline */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <img
                src="/logo.png"
                alt="Prinly.in"
                className="h-10 w-auto object-contain transition group-hover:scale-105"
              />
            </Link>

            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {f.tagline}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              {f.description}
            </p>

            <div className="pt-2 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Network Live 2026
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="font-heading text-xs font-black uppercase tracking-wider text-slate-900 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li>
                <Link href="/" className="text-slate-600 hover:text-blue-600 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/user/dashboard" className="text-slate-600 hover:text-blue-600 transition">
                  User Dashboard
                </Link>
              </li>
              <li>
                <Link href="/printer/dashboard" className="text-slate-600 hover:text-blue-600 transition">
                  Printer Hub Dashboard
                </Link>
              </li>
              <li>
                <Link href="/printer/register" className="text-slate-600 hover:text-blue-600 transition">
                  Become a Prinly Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Policies */}
          <div>
            <h4 className="font-heading text-xs font-black uppercase tracking-wider text-slate-900 mb-4">
              Legal & Policies
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li>
                <Link href="/terms" className="text-slate-600 hover:text-blue-600 transition">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-slate-600 hover:text-blue-600 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-slate-600 hover:text-blue-600 transition">
                  Refund & Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Support */}
          <div>
            <h4 className="font-heading text-xs font-black uppercase tracking-wider text-slate-900 mb-4">
              Contact & Support
            </h4>
            <div className="space-y-2.5 text-xs text-slate-500 font-medium">
              <div>
                <span className="font-bold text-slate-700 block">Email:</span>
                <a href={`mailto:${f.contactEmail}`} className="text-blue-600 hover:underline">
                  {f.contactEmail}
                </a>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Helpline:</span>
                <span>{f.contactPhone}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block">Headquarters:</span>
                <span>{f.contactAddress}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 Prinly.in. All rights reserved. Online to Local Smart Cyber Cafe Network.
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/terms" className="hover:text-blue-600 transition">
              Terms
            </Link>
            <Link href="/privacy-policy" className="hover:text-blue-600 transition">
              Privacy
            </Link>
            <Link href="/refund-policy" className="hover:text-blue-600 transition">
              Refunds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
