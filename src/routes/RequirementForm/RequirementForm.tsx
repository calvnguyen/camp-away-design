import { useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Check } from 'lucide-react';
import { projectRepository } from '../../data';
import { TRAILER_CONSTRAINTS } from '../../lib/constraints';
import { AppNav } from '../../components/AppNav';

type FieldName = 'clientName' | 'length' | 'sleeps' | 'budget';
type Errors = Partial<Record<FieldName, string>>;

/** Parse a user-entered number, tolerating commas/$ (e.g. "45,000"). */
function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, '');
  if (cleaned === '' || !/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

export function RequirementForm() {
  const navigate = useNavigate();

  const [clientName, setClientName] = useState('');
  const [length, setLength] = useState(String(TRAILER_CONSTRAINTS.trailerLengthFt.default));
  const [sleeps, setSleeps] = useState(String(TRAILER_CONSTRAINTS.sleeps.default));
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [wetBath, setWetBath] = useState(true);
  const [kitchenette, setKitchenette] = useState(true);
  const [solar, setSolar] = useState(false);
  const [battery, setBattery] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const refs: Record<FieldName, RefObject<HTMLInputElement | null>> = {
    clientName: useRef<HTMLInputElement>(null),
    length: useRef<HTMLInputElement>(null),
    sleeps: useRef<HTMLInputElement>(null),
    budget: useRef<HTMLInputElement>(null),
  };

  function validate(): Errors {
    const next: Errors = {};
    const { trailerLengthFt, buildCostCeilingUsd } = TRAILER_CONSTRAINTS;

    if (clientName.trim() === '') {
      next.clientName = 'Client name is required.';
    }

    const lengthVal = parseNumber(length);
    if (lengthVal === null) {
      next.length = 'Enter the trailer length in feet.';
    } else if (lengthVal < trailerLengthFt.min || lengthVal > trailerLengthFt.max) {
      next.length = `Length must be ${trailerLengthFt.min}–${trailerLengthFt.max} ft to stay SUV-towable.`;
    }

    const sleepsVal = parseNumber(sleeps);
    if (sleepsVal === null || !Number.isInteger(sleepsVal) || sleepsVal < 1) {
      next.sleeps = 'Sleeping capacity must be a whole number of at least 1.';
    }

    const budgetVal = parseNumber(budget);
    if (budgetVal === null) {
      next.budget = 'Enter a budget in USD.';
    } else if (budgetVal <= 0) {
      next.budget = 'Budget must be greater than zero.';
    } else if (budgetVal > buildCostCeilingUsd) {
      next.budget = `Budget must stay under ${formatUsd(buildCostCeilingUsd)} for a small build.`;
    }

    return next;
  }

  async function save(submit: boolean) {
    setSubmitError(null);
    const found = validate();
    setErrors(found);

    if (Object.keys(found).length > 0) {
      // Move focus to the first invalid field so keyboard/SR users land on it.
      const order: FieldName[] = ['clientName', 'length', 'sleeps', 'budget'];
      const first = order.find((f) => found[f]);
      if (first) refs[first].current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const project = await projectRepository.createProject({
        clientName: clientName.trim(),
        submit,
        brief: {
          trailerLengthFt: parseNumber(length)!,
          sleeps: parseNumber(sleeps)!,
          hasWetBath: wetBath,
          hasKitchenette: kitchenette,
          solar,
          battery,
          budgetUsd: parseNumber(budget)!,
          notes: notes.trim(),
        },
      });
      navigate(submit ? `/project/${project.id}` : '/');
    } catch {
      setSubmitError('Something went wrong saving the brief. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f6f3] to-[#ebe9e3]">
      <AppNav />

      <main className="p-8 max-w-4xl mx-auto">
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
            Tell us about your trailer home — layout, features, and budget.
          </p>
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void save(true);
          }}
          className="bg-white rounded-3xl border border-[#e3e0da] p-8 shadow-lg space-y-6"
        >
          <TextField
            id="clientName"
            label="Client name"
            value={clientName}
            onChange={setClientName}
            error={errors.clientName}
            inputRef={refs.clientName}
            autoComplete="name"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              id="length"
              label="Trailer length (ft)"
              value={length}
              onChange={setLength}
              error={errors.length}
              inputRef={refs.length}
              hint={`Target ${TRAILER_CONSTRAINTS.trailerLengthFt.min}–${TRAILER_CONSTRAINTS.trailerLengthFt.max} ft for SUV towing.`}
              inputMode="numeric"
            />
            <TextField
              id="sleeps"
              label="Sleeping capacity"
              value={sleeps}
              onChange={setSleeps}
              error={errors.sleeps}
              inputRef={refs.sleeps}
              hint="Adults."
              inputMode="numeric"
            />
          </div>

          <Fieldset legend="Features">
            <FeatureSwitch label="Wet bath (shower + toilet)" checked={wetBath} onChange={setWetBath} />
            <FeatureSwitch label="Compact kitchenette" checked={kitchenette} onChange={setKitchenette} />
          </Fieldset>

          <Fieldset legend="Optional upgrades">
            <FeatureSwitch label="Solar panels" checked={solar} onChange={setSolar} />
            <FeatureSwitch label="Battery pack" checked={battery} onChange={setBattery} />
          </Fieldset>

          <TextField
            id="budget"
            label="Budget (USD)"
            value={budget}
            onChange={setBudget}
            error={errors.budget}
            inputRef={refs.budget}
            hint={`Target under ${formatUsd(TRAILER_CONSTRAINTS.buildCostCeilingUsd)}.`}
            inputMode="numeric"
            placeholder="45,000"
          />

          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-[#1c1a17] mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Weekend getaways for two; prefer light wood interior."
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

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  inputRef: RefObject<HTMLInputElement | null>;
  inputMode?: 'numeric' | 'text';
  autoComplete?: string;
  placeholder?: string;
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  inputRef,
  inputMode,
  autoComplete,
  placeholder,
}: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-[#1c1a17] mb-2">
        {label}
      </label>
      <input
        id={id}
        ref={inputRef}
        type="text"
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:outline-none transition-colors ${
          error ? 'border-[#b4231d] focus:border-[#b4231d]' : 'border-[#e3e0da] focus:border-[#2f6f4f]'
        }`}
      />
      {hint && (
        <p id={hintId} className="text-xs text-[#6b6560] mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-[#b4231d] font-medium mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="border-0 p-0 m-0">
      <legend className="block text-sm font-semibold text-[#1c1a17] mb-4">{legend}</legend>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

interface FeatureSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function FeatureSwitch({ label, checked, onChange }: FeatureSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between p-4 bg-[#f7f6f3] rounded-xl hover:bg-[#ebe9e3] transition-colors text-left"
    >
      <span className="font-medium text-[#1c1a17]">{label}</span>
      <span
        aria-hidden="true"
        className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-[#2f6f4f]' : 'bg-[#e3e0da]'}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );
}
