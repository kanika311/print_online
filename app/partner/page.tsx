'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PartnerRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/printer');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-blue-600">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-2" />
        <p className="text-xs font-bold text-slate-700">Loading Prinly Partner Program...</p>
      </div>
    </div>
  );
}
