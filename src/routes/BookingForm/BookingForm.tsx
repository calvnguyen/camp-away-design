'use client';

import { useId, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  TRAILER_SIZE_CATEGORIES,
  RENTAL_UPGRADES,
  CONCEPT_PACKAGES,
  PRICING_DISCLAIMER,
} from '@/lib/constraints';
import type { TrailerSizeCategory } from '@/types';
import { AppNav } from '@/components/AppNav';

const SIZE_OPTIONS: { value: TrailerSizeCategory; label: string }[] = [
  { value: 'small', label: 'Small (14–16 ft) — $129/night' },
  { value: 'medium', label: 'Medium (17–20 ft) — $179/night' },
  { value: 'large', label: 'Large (21–24 ft) — $229/night' },
];

function diffNights(start: string, end: string): number {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function BookingForm() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const initialSize = (params.get('size') as TrailerSizeCategory) ?? 'medium';
  const initialCustom = params.get('custom') === 'true';

  const [size, setSize] = useState<TrailerSizeCategory>(initialSize);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedUpgrades, setSelectedUpgrades] = useState<string[]>([]);
  const [isCustom, setIsCustom] = useState(initialCustom);
  const [conceptPackage, setConceptPackage] = useState('basic');
  const [offGridNotes, setOffGridNotes] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeId = useId();
  const startId = useId();
  const endId = useId();
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const errorId = useId();

  const spec = TRAILER_SIZE_CATEGORIES[size];
  const nights = diffNights(startDate, endDate);
  const upgradesTotal = selectedUpgrades.reduce((sum, id) => {
    const u = RENTAL_UPGRADES.find((u) => u.id === id);
    return sum + (u?.priceUsd ?? 0);
  }, 0);
  const rentalTotal = spec.nightlyRateUsd * nights;
  const conceptPrice = isCustom
    ? (CONCEPT_PACKAGES.find((p) => p.id === conceptPackage)?.priceUsd ?? 0)
    : 0;
  const grandTotal = rentalTotal + upgradesTotal + conceptPrice;

  function toggleUpgrade(id: string) {
    setSelectedUpgrades((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nights < 1) {
      setError('End date must be after start date.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const { error: err } = await supabase.from('bookings').insert({
        client_name: name,
        client_email: email,
        client_phone: phone,
        trailer_size: size,
        start_date: startDate,
        end_date: endDate,
        nightly_rate_usd: spec.nightlyRateUsd,
        upgrade_ids: selectedUpgrades,
        upgrades_total_usd: upgradesTotal,
        rental_total_usd: rentalTotal,
        is_custom_concept: isCustom,
        concept_package_id: isCustom ? conceptPackage : null,
        off_grid_notes: offGridNotes,
        customization_notes: customNotes,
        special_notes: specialNotes,
        status: 'booking_requested',
      });
      if (err) throw err;
      router.push('/book/confirmation');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f6f3] to-[#ebe9e3]">
      <AppNav />

      <main className="px-6 pb-12 pt-20 sm:pt-28 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1c1a17] mb-8 tracking-tight">
          Request a Rental
        </h1>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col lg:flex-row gap-8">
          {/* Left column — form fields */}
          <div className="flex-1 flex flex-col gap-6">
            {error && (
              <p id={errorId} role="alert" className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                {error}
              </p>
            )}

            {/* Trailer size */}
            <div>
              <label htmlFor={sizeId} className="block text-sm font-medium text-[#1c1a17] mb-1.5">
                Trailer size
              </label>
              <select
                id={sizeId}
                value={size}
                onChange={(e) => setSize(e.target.value as TrailerSizeCategory)}
                className="w-full rounded-xl border border-[#e3e0da] px-3 py-2.5 text-sm text-[#1c1a17] bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6f4f]"
              >
                {SIZE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor={startId} className="block text-sm font-medium text-[#1c1a17] mb-1.5">
                  Start date
                </label>
                <input
                  id={startId}
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-[#e3e0da] px-3 py-2.5 text-sm text-[#1c1a17] bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6f4f]"
                />
              </div>
              <div>
                <label htmlFor={endId} className="block text-sm font-medium text-[#1c1a17] mb-1.5">
                  End date
                </label>
                <input
                  id={endId}
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-[#e3e0da] px-3 py-2.5 text-sm text-[#1c1a17] bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6f4f]"
                />
              </div>
            </div>

            {/* Contact */}
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor={nameId} className="block text-sm font-medium text-[#1c1a17] mb-1.5">Name</label>
                <input id={nameId} type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-[#e3e0da] px-3 py-2.5 text-sm text-[#1c1a17] bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6f4f]"
                  placeholder="Your full name" />
              </div>
              <div>
                <label htmlFor={emailId} className="block text-sm font-medium text-[#1c1a17] mb-1.5">Email</label>
                <input id={emailId} type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#e3e0da] px-3 py-2.5 text-sm text-[#1c1a17] bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6f4f]"
                  placeholder="you@example.com" />
              </div>
              <div>
                <label htmlFor={phoneId} className="block text-sm font-medium text-[#1c1a17] mb-1.5">Phone number</label>
                <input id={phoneId} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-[#e3e0da] px-3 py-2.5 text-sm text-[#1c1a17] bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6f4f]"
                  placeholder="+1 (555) 000-0000" />
              </div>
            </div>

            {/* Upgrades */}
            <fieldset>
              <legend className="text-sm font-medium text-[#1c1a17] mb-2">Optional upgrades</legend>
              <div className="flex flex-col gap-2">
                {RENTAL_UPGRADES.map((u) => (
                  <label key={u.id} className={[
                    'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all',
                    selectedUpgrades.includes(u.id)
                      ? 'border-[#2f6f4f] bg-[#f0f7f3] ring-1 ring-[#2f6f4f]'
                      : 'border-[#e3e0da] hover:border-[#2f6f4f]/40',
                  ].join(' ')}>
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedUpgrades.includes(u.id)}
                        onChange={() => toggleUpgrade(u.id)}
                        className="accent-[#2f6f4f]"
                      />
                      <span className="text-sm text-[#1c1a17]">{u.label}</span>
                    </span>
                    <span className="text-sm font-medium text-[#2f6f4f]">+{fmt(u.priceUsd)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Custom concept */}
            <div className="rounded-xl border border-[#e3e0da] p-4">
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={isCustom}
                  onChange={(e) => setIsCustom(e.target.checked)}
                  className="accent-[#2f6f4f] w-4 h-4"
                />
                <span className="text-sm font-medium text-[#1c1a17]">
                  Add custom concept design
                </span>
              </label>
              {isCustom && (
                <div className="flex flex-col gap-3 mt-1">
                  <div className="flex flex-col gap-2">
                    {CONCEPT_PACKAGES.map((p) => (
                      <label key={p.id} className={[
                        'flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all',
                        conceptPackage === p.id
                          ? 'border-[#2f6f4f] bg-[#f0f7f3] ring-1 ring-[#2f6f4f]'
                          : 'border-[#e3e0da] hover:border-[#2f6f4f]/40',
                      ].join(' ')}>
                        <input type="radio" name="concept" value={p.id} checked={conceptPackage === p.id}
                          onChange={() => setConceptPackage(p.id)} className="mt-0.5 accent-[#2f6f4f]" />
                        <span className="flex flex-col gap-0.5 flex-1">
                          <span className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-[#1c1a17]">{p.label}</span>
                            <span className="text-sm font-medium text-[#2f6f4f]">{fmt(p.priceUsd)}</span>
                          </span>
                          <span className="text-xs text-[#6b6560]">{p.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    rows={3}
                    placeholder="Describe your customization needs…"
                    className="w-full rounded-xl border border-[#e3e0da] px-3 py-2.5 text-sm text-[#1c1a17] bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6f4f] resize-none"
                  />
                </div>
              )}
            </div>

            {/* Optional notes */}
            <div>
              <label className="block text-sm font-medium text-[#1c1a17] mb-1.5">
                Off-grid requirements <span className="text-[#6b6560] font-normal">(optional)</span>
              </label>
              <textarea value={offGridNotes} onChange={(e) => setOffGridNotes(e.target.value)}
                rows={2} placeholder="Solar needs, battery hours, remote location details…"
                className="w-full rounded-xl border border-[#e3e0da] px-3 py-2.5 text-sm text-[#1c1a17] bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6f4f] resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1c1a17] mb-1.5">
                Special notes <span className="text-[#6b6560] font-normal">(optional)</span>
              </label>
              <textarea value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)}
                rows={2} placeholder="Anything else we should know…"
                className="w-full rounded-xl border border-[#e3e0da] px-3 py-2.5 text-sm text-[#1c1a17] bg-white focus:outline-none focus:ring-2 focus:ring-[#2f6f4f] resize-none" />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#2f6f4f] focus:ring-offset-2"
            >
              {submitting ? 'Submitting…' : 'Submit booking request'}
            </button>
          </div>

          {/* Right column — pricing summary */}
          <aside className="lg:w-72">
            <div className="sticky top-28 bg-white rounded-2xl border border-[#e3e0da] p-5 shadow-sm">
              <h2 className="text-base font-bold text-[#1c1a17] mb-4">Pricing Summary</h2>

              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#6b6560]">{spec.label}</dt>
                  <dd className="font-medium text-[#1c1a17]">{fmt(spec.nightlyRateUsd)}/night</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#6b6560]">Nights</dt>
                  <dd className="font-medium text-[#1c1a17]">{nights > 0 ? nights : '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#6b6560]">Rental subtotal</dt>
                  <dd className="font-medium text-[#1c1a17]">{nights > 0 ? fmt(rentalTotal) : '—'}</dd>
                </div>

                {selectedUpgrades.length > 0 && (
                  <>
                    <div className="border-t border-[#e3e0da] pt-3">
                      <p className="text-[#6b6560] mb-2">Upgrades</p>
                      {selectedUpgrades.map((id) => {
                        const u = RENTAL_UPGRADES.find((u) => u.id === id)!;
                        return (
                          <div key={id} className="flex justify-between mb-1">
                            <span className="text-[#6b6560] text-xs">{u.label}</span>
                            <span className="text-xs font-medium">+{fmt(u.priceUsd)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {isCustom && (
                  <div className="flex justify-between border-t border-[#e3e0da] pt-3">
                    <dt className="text-[#6b6560]">Concept package</dt>
                    <dd className="font-medium text-[#1c1a17]">{fmt(conceptPrice)}</dd>
                  </div>
                )}

                <div className="border-t border-[#e3e0da] pt-3 flex justify-between font-bold text-[#1c1a17]">
                  <dt>Estimated total</dt>
                  <dd>{nights > 0 ? fmt(grandTotal) : '—'}</dd>
                </div>
              </dl>

              {isCustom && (
                <div className="mt-4 p-3 rounded-xl bg-[#f0f7f3] border border-[#c5dece]">
                  <p className="text-xs text-[#2f6f4f] font-medium mb-1">Custom build estimate</p>
                  <p className="text-xs text-[#6b6560]">
                    Base: starting at {fmt(spec.baseBuildPriceUsd)}
                  </p>
                </div>
              )}

              <p className="text-[10px] text-[#6b6560] mt-4 leading-relaxed">
                {PRICING_DISCLAIMER}
              </p>
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
}
