'use client';

import Link from 'next/link';
import { Users, Truck, Weight, ArrowRight, Sparkles } from 'lucide-react';
import { AppNav } from '@/components/AppNav';
import {
  TRAILER_SIZE_CATEGORIES,
  PRICING_DISCLAIMER,
} from '@/lib/constraints';
import type { TrailerSizeCategory } from '@/types';

const TRAILER_IMAGES: Record<TrailerSizeCategory, string> = {
  small:
    'https://images.unsplash.com/photo-1771022136054-208a15f1126f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
  medium:
    'https://images.unsplash.com/photo-1604549001484-df28edea610b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
  large:
    'https://images.unsplash.com/photo-1604549053344-d353adf347d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
};

const SIZE_ORDER: TrailerSizeCategory[] = ['small', 'medium', 'large'];

function fmt(n: number) {
  return n.toLocaleString('en-US');
}

export function TrailerListing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f6f3] to-[#ebe9e3]">
      <AppNav />

      <main className="px-6 pb-12 pt-28 max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[#1c1a17] mb-3 tracking-tight">
            Rental Trailers
          </h1>
          <p className="text-[#6b6560] text-lg">
            SUV-towable tiny trailers for weekend escapes and off-grid living.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {SIZE_ORDER.map((size) => {
            const spec = TRAILER_SIZE_CATEGORIES[size];
            return (
              <article
                key={size}
                className="bg-white rounded-2xl border border-[#e3e0da] overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={TRAILER_IMAGES[size]}
                    alt={spec.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white rounded-xl px-3 py-1.5 shadow text-sm font-bold text-[#2f6f4f]">
                    ${spec.nightlyRateUsd}/night
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h2 className="text-lg font-bold text-[#1c1a17] mb-1">{spec.label}</h2>

                  <div className="flex flex-col gap-1.5 text-sm text-[#6b6560] mb-5">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#2f6f4f]" aria-hidden="true" />
                      Sleeps {spec.sleepsRange}
                    </span>
                    <span className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#2f6f4f]" aria-hidden="true" />
                      {spec.towVehicle}
                    </span>
                    <span className="flex items-center gap-2">
                      <Weight className="w-4 h-4 text-[#2f6f4f]" aria-hidden="true" />
                      {fmt(spec.minWeightLbs)}–{fmt(spec.maxWeightLbs)} lbs dry
                    </span>
                  </div>

                  <div className="mt-auto flex flex-col gap-2">
                    <Link
                      href={`/book?size=${size}`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#2f6f4f] focus:ring-offset-2"
                    >
                      Book Now
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                    <Link
                      href={`/book?size=${size}&custom=true`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[#e3e0da] text-[#2f6f4f] text-sm font-semibold hover:bg-[#f0f7f3] transition-all focus:outline-none focus:ring-2 focus:ring-[#2f6f4f]"
                    >
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                      Request Custom Concept
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <p className="text-xs text-[#6b6560] text-center">{PRICING_DISCLAIMER}</p>
      </main>
    </div>
  );
}
