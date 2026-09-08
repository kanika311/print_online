'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent mb-2" />
      <p className="text-xs">Redirecting to secure admin portal...</p>
    </div>
  );
}
