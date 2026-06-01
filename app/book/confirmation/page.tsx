'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { AppNav } from '@/components/AppNav';

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f6f3] to-[#ebe9e3]">
      <AppNav />
      <main className="flex items-center justify-center min-h-screen px-6">
        <div className="bg-white rounded-2xl border border-[#e3e0da] shadow-lg p-10 max-w-md w-full text-center">
          <CheckCircle2 className="w-12 h-12 text-[#2f6f4f] mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-[#1c1a17] mb-3">Booking request submitted</h1>
          <p className="text-[#6b6560] mb-6 text-sm leading-relaxed">
            We&apos;ve received your request. Our team will review it and get back to you shortly.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/trailers"
              className="py-2.5 rounded-xl bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
            >
              Browse more trailers
            </Link>
            <Link href="/" className="text-sm text-[#2f6f4f] hover:underline">
              Back to projects
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
