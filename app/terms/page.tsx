'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cms/terms')
      .then((res) => res.json())
      .then((d) => {
        if (d && d.success) setData(d);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl bg-white rounded-3xl p-6 sm:p-12 border border-slate-200 shadow-sm">
          <div className="mb-8 border-b border-slate-100 pb-6">
            <Link
              href="/"
              className="inline-flex items-center text-xs font-bold text-blue-600 hover:underline mb-3"
            >
              &larr; Back to Home
            </Link>
            <h1 className="font-heading text-2xl sm:text-4xl font-black text-slate-900">
              {data?.title || 'Terms and Conditions'}
            </h1>
            <div className="mt-2 text-xs text-slate-500">
              Live from Prinly CMS • Updated {data?.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : '2026'}
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-2" />
              <p className="text-xs">Loading latest policy terms...</p>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-700">
              {data?.content}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
