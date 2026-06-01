import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Check } from 'lucide-react';
import { projectRepository } from '../../data';
import { SLEEP_OPTIONS, TRAILER_SIZE_CATEGORIES } from '../../lib/constraints';
import { AppNav } from '../../components/AppNav';
import type {
  BathroomType,
  BudgetRange,
  DesignStyle,
  KitchenType,
  PowerOption,
  TrailerSizeCategory,
  TowVehicle,
  UsageIntent,
} from '../../types';

type FieldName = 'clientName' | 'sizeCategory' | 'sleeps' | 'bathroomType' | 'kitchenType' | 'budgetRange' | 'designStyle' | 'intendedUsage' | 'towVehicle';
type Errors = Partial<Record<FieldName, string>>;

export function RequirementForm() {
  const navigate = useNavigate();

  const [clientName, setClientName] = useState('');
  const [sizeCategory, setSizeCategory] = useState<TrailerSizeCategory>('medium');
  const [sleeps, setSleeps] = useState<number>(2);
  const [bathroomType, setBathroomType] = useState<BathroomType>('wet_bath');
  const [kitchenType, setKitchenType] = useState<KitchenType>('standard');
  const [powerOptions, setPowerOptions] = useState<PowerOption[]>([]);
  const [intendedUsage, setIntendedUsage] = useState<UsageIntent>('weekend');
  const [towVehicle, setTowVehicle] = useState<TowVehicle>('suv');
  const [budgetRange, setBudgetRange] = useState<BudgetRange>('40k_50k');
  const [designStyle, setDesignStyle] = useState<DesignStyle>('modern');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function togglePowerOption(opt: PowerOption) {
    setPowerOptions((prev) =>
      prev.includes(opt) ? prev.filter((p) => p !== opt) : [...prev, opt],
    );
  }

  function validate(): Errors {
    const next: Errors = {};
    if (clientName.trim() === '') next.clientName = 'Client name is required.';
    return next;
  }

  async function save(submit: boolean) {
    setSubmitError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const el = document.getElementById('clientName');
      el?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const project = await projectRepository.createProject({
        clientName: clientName.trim(),
        submit,
        brief: { sizeCategory, sleeps, bathroomType, kitchenType, powerOptions, intendedUsage, towVehicle, budgetRange, designStyle, notes: notes.trim() },
      });
      navigate(submit ? `/project/${project.id}` : '/');
    } catch {
      setSubmitError('Something went wrong saving the brief. Please try again.');
      setSubmitting(false);
    }
  }

  const sizeSpec = TRAILER_SIZE_CATEGORIES[sizeCategory];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f6f3] to-[#ebe9e3]">
      <AppNav />
      <main className="px-8 pb-8 pt-24 max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#6b6560] hover:text-[#1c1a17] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">Back to Projects</span>
        </button>

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[#1c1a17] mb-3">New Trailer Brief</h1>
          <p className="text-[#6b6560] text-lg">
            Tell us about the trailer you have in mind — size, features, and style.
          </p>
        </div>

        <form
          noValidate
          onSubmit={(e) => { e.preventDefault(); void save(true); }}
          className="bg-white rounded-3xl border border-[#e3e0da] p-8 shadow-lg space-y-8"
        >
          {/* Client name */}
          <div>
            <label htmlFor="clientName" className="block text-sm font-semibold text-[#1c1a17] mb-2">
              Client name <span aria-hidden="true" className="text-[#b4231d]">*</span>
            </label>
            <input
              id="clientName"
              type="text"
              autoComplete="name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              aria-invalid={errors.clientName ? true : undefined}
              aria-describedby={errors.clientName ? 'clientName-error' : undefined}
              className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:outline-none transition-colors ${errors.clientName ? 'border-[#b4231d] focus:border-[#b4231d]' : 'border-[#e3e0da] focus:border-[#2f6f4f]'}`}
            />
            {errors.clientName && (
              <p id="clientName-error" role="alert" className="text-xs text-[#b4231d] font-medium mt-1">
                {errors.clientName}
              </p>
            )}
          </div>

          {/* Trailer size + sleeping */}
          <Section title="Trailer Size">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                id="sizeCategory"
                label="Trailer size"
                value={sizeCategory}
                onChange={(v) => setSizeCategory(v as TrailerSizeCategory)}
                hint={`Tow vehicle: ${sizeSpec.towVehicle} · ${sizeSpec.minWeightLbs.toLocaleString()}–${sizeSpec.maxWeightLbs.toLocaleString()} lbs`}
              >
                {(Object.keys(TRAILER_SIZE_CATEGORIES) as TrailerSizeCategory[]).map((cat) => (
                  <option key={cat} value={cat}>{TRAILER_SIZE_CATEGORIES[cat].label}</option>
                ))}
              </SelectField>
              <SelectField
                id="sleeps"
                label="Sleeping capacity"
                value={String(sleeps)}
                onChange={(v) => setSleeps(Number(v))}
              >
                {SLEEP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </SelectField>
            </div>
          </Section>

          {/* Interior */}
          <Section title="Interior">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField id="bathroomType" label="Bathroom type" value={bathroomType} onChange={(v) => setBathroomType(v as BathroomType)}>
                <option value="none">No Bathroom</option>
                <option value="wet_bath">Wet Bath (Shower + Toilet)</option>
                <option value="dry_bath">Dry Bath</option>
              </SelectField>
              <SelectField id="kitchenType" label="Kitchenette" value={kitchenType} onChange={(v) => setKitchenType(v as KitchenType)}>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="extended_storage">Extended Storage</option>
              </SelectField>
            </div>
          </Section>

          {/* Power */}
          <Section title="Power Options">
            <fieldset className="border-0 p-0 m-0">
              <legend className="sr-only">Power options</legend>
              <div className="space-y-3">
                {(
                  [
                    { value: 'solar', label: 'Solar Upgrade' },
                    { value: 'battery', label: 'Battery Backup' },
                    { value: 'shore_power', label: 'Shore Power Only' },
                  ] as { value: PowerOption; label: string }[]
                ).map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-3 p-4 bg-[#f7f6f3] rounded-xl cursor-pointer hover:bg-[#ebe9e3] transition-colors">
                    <input
                      type="checkbox"
                      checked={powerOptions.includes(value)}
                      onChange={() => togglePowerOption(value)}
                      className="w-4 h-4 accent-[#2f6f4f]"
                    />
                    <span className="font-medium text-[#1c1a17]">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </Section>

          {/* Usage & style */}
          <Section title="Usage & Style">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField id="intendedUsage" label="Intended usage" value={intendedUsage} onChange={(v) => setIntendedUsage(v as UsageIntent)}>
                <option value="weekend">Weekend Camping</option>
                <option value="part_time">Part-Time Living</option>
                <option value="full_time">Full-Time Living</option>
              </SelectField>
              <SelectField id="towVehicle" label="Tow vehicle" value={towVehicle} onChange={(v) => setTowVehicle(v as TowVehicle)}>
                <option value="suv">SUV</option>
                <option value="truck">Truck</option>
                <option value="unsure">Unsure</option>
              </SelectField>
              <SelectField id="designStyle" label="Design style" value={designStyle} onChange={(v) => setDesignStyle(v as DesignStyle)}>
                <option value="modern">Modern</option>
                <option value="rustic">Rustic</option>
                <option value="minimalist">Minimalist</option>
                <option value="luxury_compact">Luxury Compact</option>
              </SelectField>
              <SelectField id="budgetRange" label="Budget range" value={budgetRange} onChange={(v) => setBudgetRange(v as BudgetRange)}>
                <option value="under_40k">Under $40k</option>
                <option value="40k_50k">$40k–$50k</option>
                <option value="50k_70k">$50k–$70k</option>
                <option value="70k_plus">$70k+</option>
              </SelectField>
            </div>
          </Section>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-[#1c1a17] mb-2">
              Additional notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any specific requests, inspirations, or constraints…"
              className="w-full px-4 py-3 bg-white border-2 border-[#e3e0da] rounded-xl focus:outline-none focus:border-[#2f6f4f] transition-colors resize-none"
            />
          </div>

          {submitError && (
            <p role="alert" className="text-[#b4231d] font-medium">
              {submitError}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Check className="w-5 h-5" aria-hidden="true" />
              {submitting ? 'Submitting…' : 'Submit Brief'}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void save(false)}
              className="px-6 py-4 border-2 border-[#e3e0da] rounded-xl hover:bg-[#f7f6f3] transition-colors font-semibold disabled:opacity-60"
            >
              Save Draft
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-[#1c1a17] mb-4 pb-2 border-b border-[#f7f6f3]">{title}</h2>
      {children}
    </div>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  children: ReactNode;
}

function SelectField({ id, label, value, onChange, hint, children }: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-[#1c1a17] mb-2">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-white border-2 border-[#e3e0da] rounded-xl focus:outline-none focus:border-[#2f6f4f] transition-colors appearance-none"
      >
        {children}
      </select>
      {hint && <p className="text-xs text-[#6b6560] mt-1">{hint}</p>}
    </div>
  );
}
