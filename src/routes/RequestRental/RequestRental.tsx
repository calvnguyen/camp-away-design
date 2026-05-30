import { useEffect, useId, useRef, useState } from 'react';
import { rentalRepository } from '../../data';
import type {
  RentalRequest,
  Reservation,
  Trailer,
  TrailerDesign,
  TrailerSpec,
} from '../../types';
import {
  Button,
  Card,
  Input,
  StatusBadge,
  Toggle,
  requestStatusDisplay,
  reservationStatusDisplay,
  trailerStatusDisplay,
} from '../../components';
import { TRAILER_CONSTRAINTS, validateRequirements } from '../../lib/constraints';
import { specSummary } from '../../lib/specSummary';
import styles from './RequestRental.module.css';

interface FormState {
  clientName: string;
  startDate: string;
  endDate: string;
  notes: string;
  trailerLengthFt: number;
  sleeps: number;
  hasWetBath: boolean;
  hasKitchenette: boolean;
  solar: boolean;
  battery: boolean;
}

// Hard, submission-blocking errors. The length range (16–18 ft) is a *soft*
// warning (see validateRequirements) and intentionally not in here.
type ErrorField = 'clientName' | 'startDate' | 'endDate' | 'sleeps' | 'trailerLengthFt';
type FieldErrors = Partial<Record<ErrorField, string>>;

// Focus order for moving to the first invalid field on submit.
const FIELD_ORDER: ErrorField[] = [
  'clientName',
  'startDate',
  'endDate',
  'trailerLengthFt',
  'sleeps',
];

const initialForm: FormState = {
  clientName: '',
  startDate: '',
  endDate: '',
  notes: '',
  // PRD defaults: small trailer, sleeps 2, wet bath + kitchenette, solar/battery off.
  trailerLengthFt: TRAILER_CONSTRAINTS.trailerLengthFt.default,
  sleeps: TRAILER_CONSTRAINTS.sleeps.default,
  hasWetBath: true,
  hasKitchenette: true,
  solar: false,
  battery: false,
};

// Prefill the form from a saved design (dates stay blank — the renter picks new ones).
function formFromDesign(design: TrailerDesign | undefined): FormState {
  if (!design) return initialForm;
  return {
    ...initialForm,
    clientName: design.clientName,
    notes: design.notes,
    trailerLengthFt: design.spec.trailerLengthFt,
    sleeps: design.spec.sleeps,
    hasWetBath: design.spec.hasWetBath,
    hasKitchenette: design.spec.hasKitchenette,
    solar: design.spec.solar,
    battery: design.spec.battery,
  };
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.clientName.trim()) {
    errors.clientName = 'Enter your name so we know who the rental is for.';
  }
  if (!form.startDate) {
    errors.startDate = 'Choose a start date.';
  }
  if (!form.endDate) {
    errors.endDate = 'Choose an end date.';
  } else if (form.startDate && form.endDate < form.startDate) {
    errors.endDate = 'End date must be on or after the start date.';
  }
  if (!Number.isFinite(form.trailerLengthFt) || form.trailerLengthFt <= 0) {
    errors.trailerLengthFt = 'Enter the trailer length in feet.';
  }
  if (!Number.isFinite(form.sleeps) || form.sleeps < 1) {
    errors.sleeps = 'Sleeping capacity must be at least 1.';
  }
  return errors;
}

function toSpec(form: FormState): TrailerSpec {
  return {
    trailerLengthFt: form.trailerLengthFt,
    sleeps: form.sleeps,
    hasWetBath: form.hasWetBath,
    hasKitchenette: form.hasKitchenette,
    solar: form.solar,
    battery: form.battery,
  };
}

interface Result {
  request: RentalRequest;
  matches: Trailer[];
}

interface RequestRentalProps {
  /** When the renter starts a request from a saved design, prefill the form with it. */
  initialDesign?: TrailerDesign;
}

export function RequestRental({ initialDesign }: RequestRentalProps = {}) {
  const baseId = useId();
  const [form, setForm] = useState<FormState>(() => formFromDesign(initialDesign));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [result, setResult] = useState<Result | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Trailer | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // No-match actions: save the design, ask to be notified, or reserve a build.
  const [noMatchBusy, setNoMatchBusy] = useState<'save' | 'reserve' | null>(null);
  const [savedDesign, setSavedDesign] = useState<TrailerDesign | null>(null);
  const [notified, setNotified] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [noMatchError, setNoMatchError] = useState<string | null>(null);

  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the results once they render, so screen-reader and keyboard
  // users land on the outcome instead of staying on the (now-hidden) form.
  useEffect(() => {
    if (result) resultHeadingRef.current?.focus();
  }, [result]);

  // Reserving swaps the no-match panel for the reservation-success panel,
  // unmounting the button that was focused — move focus to the new heading.
  useEffect(() => {
    if (reservation) resultHeadingRef.current?.focus();
  }, [reservation]);

  const fieldId = (field: ErrorField | 'notes') => `${baseId}-${field}`;
  const lengthWarning = validateRequirements({
    trailerLengthFt: form.trailerLengthFt,
  }).trailerLengthFt;

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function numberValue(n: number): string {
    return Number.isNaN(n) ? '' : String(n);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const requirements = toSpec(form);
      const request = await rentalRepository.createRequest({
        clientName: form.clientName.trim(),
        requirements,
        startDate: form.startDate,
        endDate: form.endDate,
        notes: form.notes.trim(),
      });
      const matches = await rentalRepository.findMatches(requirements);
      setConfirmed(null);
      setConfirmError(null);
      // Fresh outcome — clear any prior no-match actions.
      setSavedDesign(null);
      setNotified(false);
      setReservation(null);
      setNoMatchError(null);
      setResult({ request, matches });
    } catch {
      setSubmitError(
        'Something went wrong submitting your request. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(trailer: Trailer) {
    if (!result) return;
    setConfirming(trailer.id);
    setConfirmError(null);
    try {
      const updated = await rentalRepository.confirmRental(
        result.request.id,
        trailer.id,
      );
      setConfirmed(trailer);
      setResult({ ...result, request: updated });
    } catch {
      // The unit was taken between matching and confirming — refresh the list.
      const matches = await rentalRepository.findMatches(
        result.request.requirements,
      );
      setConfirmError(
        `We couldn't hold ${trailer.name} — it may have just been taken. Pick another available unit below.`,
      );
      setResult((prev) => (prev ? { ...prev, matches } : prev));
    } finally {
      setConfirming(null);
    }
  }

  async function handleSaveDesign() {
    if (!result) return;
    setNoMatchBusy('save');
    setNoMatchError(null);
    try {
      const design = await rentalRepository.saveDesign({
        clientName: result.request.clientName,
        spec: result.request.requirements,
        notes: result.request.notes,
      });
      setSavedDesign(design);
    } catch {
      setNoMatchError("We couldn't save your design. Please try again.");
    } finally {
      setNoMatchBusy(null);
    }
  }

  function handleNotify() {
    // MVP: notification is simulated — record the intent so the renter sees it stuck.
    setNotified(true);
  }

  async function handleReserve() {
    if (!result) return;
    setNoMatchBusy('reserve');
    setNoMatchError(null);
    try {
      const res = await rentalRepository.reserveBuild({
        clientName: result.request.clientName,
        spec: result.request.requirements,
        notes: result.request.notes,
        // Reuse the design if we already saved it this session, else one is saved.
        designId: savedDesign?.id,
      });
      setSavedDesign(res.design);
      setReservation(res.reservation);
    } catch {
      setNoMatchError("We couldn't place your reservation. Please try again.");
    } finally {
      setNoMatchBusy(null);
    }
  }

  function clearNoMatchState() {
    setSavedDesign(null);
    setNotified(false);
    setReservation(null);
    setNoMatchError(null);
  }

  function resetToNewRequest() {
    setForm(initialForm);
    setErrors({});
    setResult(null);
    setConfirmed(null);
    setConfirmError(null);
    setSubmitError(null);
    clearNoMatchState();
  }

  function backToForm() {
    // Keep the entered values so the renter can tweak and resubmit.
    setResult(null);
    setConfirmed(null);
    setConfirmError(null);
    clearNoMatchState();
  }

  if (result) {
    return (
      <section
        aria-labelledby={`${baseId}-result-heading`}
        className={styles.results}
      >
        {confirmed ? (
          <ResultPanel
            headingId={`${baseId}-result-heading`}
            headingRef={resultHeadingRef}
            tone="success"
            title="You're all set"
          >
            <p className={styles.lead}>
              <strong>{confirmed.name}</strong> is held for{' '}
              {result.request.clientName} from {result.request.startDate} to{' '}
              {result.request.endDate}.
            </p>
            <p className={styles.meta}>{specSummary(confirmed.spec)}</p>
            <RequestStatusLine request={result.request} />
            <div className={styles.actions}>
              <Button onClick={resetToNewRequest}>Start a new request</Button>
            </div>
          </ResultPanel>
        ) : result.request.status === 'matched' && result.matches.length > 0 ? (
          <ResultPanel
            headingId={`${baseId}-result-heading`}
            headingRef={resultHeadingRef}
            tone="info"
            title={`We found ${result.matches.length} available ${
              result.matches.length === 1 ? 'trailer' : 'trailers'
            } that fit`}
          >
            <p className={styles.lead}>
              Pick one to hold it for your dates ({result.request.startDate} to{' '}
              {result.request.endDate}).
            </p>
            {confirmError ? (
              <p role="alert" className={styles.error}>
                {confirmError}
              </p>
            ) : null}
            <ul className={styles.matchList}>
              {result.matches.map((trailer) => {
                const display = trailerStatusDisplay[trailer.status];
                return (
                  <li key={trailer.id}>
                    <Card className={styles.matchCard}>
                      <div className={styles.matchInfo}>
                        <h3 className={styles.matchName}>
                          {trailer.name}
                          <StatusBadge tone={display.tone}>
                            {display.label}
                          </StatusBadge>
                        </h3>
                        <p className={styles.meta}>
                          {specSummary(trailer.spec)}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleConfirm(trailer)}
                        disabled={confirming !== null}
                        aria-label={`Confirm rental of ${trailer.name}`}
                      >
                        {confirming === trailer.id ? 'Confirming…' : 'Confirm'}
                      </Button>
                    </Card>
                  </li>
                );
              })}
            </ul>
            <div className={styles.actions}>
              <Button variant="secondary" onClick={backToForm}>
                Edit my requirements
              </Button>
            </div>
          </ResultPanel>
        ) : reservation ? (
          <ResultPanel
            headingId={`${baseId}-result-heading`}
            headingRef={resultHeadingRef}
            tone="success"
            title="Your build is reserved"
          >
            <p className={styles.lead}>
              We've reserved a build of your design for{' '}
              {result.request.clientName}. A builder will construct it and we'll
              hold the finished unit for you to rent first — we'll email you when
              it's ready.
            </p>
            <p className={styles.meta}>
              Reserved spec: {specSummary(reservation.spec)}
            </p>
            <p className={styles.statusLine}>
              Reservation status:{' '}
              <StatusBadge tone={reservationStatusDisplay[reservation.status].tone}>
                {reservationStatusDisplay[reservation.status].label}
              </StatusBadge>
            </p>
            <p className={styles.meta}>
              Find it any time under <strong>My designs &amp; reservations</strong>.
            </p>
            <div className={styles.actions}>
              <Button onClick={resetToNewRequest}>Start a new request</Button>
            </div>
          </ResultPanel>
        ) : (
          <ResultPanel
            headingId={`${baseId}-result-heading`}
            headingRef={resultHeadingRef}
            tone="warning"
            title="No available trailer matches right now"
          >
            <p className={styles.lead}>
              Nothing in our fleet currently fits these requirements for{' '}
              {result.request.startDate} to {result.request.endDate}. We've
              recorded your design as demand for this configuration. Here's what
              you can do next:
            </p>
            <p className={styles.meta}>
              You asked for: {specSummary(result.request.requirements)}
            </p>
            <RequestStatusLine request={result.request} />

            {noMatchError ? (
              <p role="alert" className={styles.error}>
                {noMatchError}
              </p>
            ) : null}
            {savedDesign ? (
              <p role="status" className={styles.note}>
                ✓ Design saved — reopen it any time under My designs &amp;
                reservations.
              </p>
            ) : null}
            {notified ? (
              <p role="status" className={styles.note}>
                ✓ We'll email you if a matching unit frees up for your dates.
              </p>
            ) : null}

            <div className={styles.actions}>
              <Button
                variant="secondary"
                onClick={handleSaveDesign}
                disabled={noMatchBusy !== null || savedDesign !== null}
              >
                {noMatchBusy === 'save'
                  ? 'Saving…'
                  : savedDesign
                    ? 'Design saved'
                    : 'Save design'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleNotify}
                disabled={notified}
              >
                {notified ? 'Notifying you' : 'Notify me'}
              </Button>
              <Button onClick={handleReserve} disabled={noMatchBusy !== null}>
                {noMatchBusy === 'reserve' ? 'Reserving…' : 'Reserve a build'}
              </Button>
            </div>
            <div className={styles.actions}>
              <Button variant="secondary" onClick={backToForm}>
                Adjust my requirements
              </Button>
              <Button variant="secondary" onClick={resetToNewRequest}>
                Start a new request
              </Button>
            </div>
          </ResultPanel>
        )}
      </section>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <header className={styles.header}>
        <h1 className={styles.title}>Request a rental</h1>
        <p className={styles.subtitle}>
          Tell us what you need and we'll match you to an available trailer in
          our fleet.
        </p>
      </header>

      {submitError ? (
        <p role="alert" className={styles.error}>
          {submitError}
        </p>
      ) : null}

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>About you &amp; your dates</legend>
        <Input
          id={fieldId('clientName')}
          label="Your name"
          value={form.clientName}
          onChange={(e) => setField('clientName', e.target.value)}
          error={errors.clientName}
          required
        />
        <div className={styles.row}>
          <Input
            id={fieldId('startDate')}
            label="Start date"
            type="date"
            value={form.startDate}
            onChange={(e) => setField('startDate', e.target.value)}
            error={errors.startDate}
            required
          />
          <Input
            id={fieldId('endDate')}
            label="End date"
            type="date"
            value={form.endDate}
            onChange={(e) => setField('endDate', e.target.value)}
            error={errors.endDate}
            required
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>What you need</legend>
        <div className={styles.row}>
          <Input
            id={fieldId('trailerLengthFt')}
            label="Trailer length (ft)"
            type="number"
            inputMode="numeric"
            min={TRAILER_CONSTRAINTS.trailerLengthFt.min}
            max={TRAILER_CONSTRAINTS.trailerLengthFt.max}
            value={numberValue(form.trailerLengthFt)}
            onChange={(e) => setField('trailerLengthFt', Number(e.target.value))}
            error={errors.trailerLengthFt}
            helperText={
              lengthWarning ??
              `${TRAILER_CONSTRAINTS.trailerLengthFt.min}–${TRAILER_CONSTRAINTS.trailerLengthFt.max} ft fits a typical SUV.`
            }
            required
          />
          <Input
            id={fieldId('sleeps')}
            label="Sleeping capacity (adults)"
            type="number"
            inputMode="numeric"
            min={1}
            value={numberValue(form.sleeps)}
            onChange={(e) => setField('sleeps', Number(e.target.value))}
            error={errors.sleeps}
            required
          />
        </div>

        <div className={styles.toggles}>
          <Toggle
            label="Wet bath (shower + toilet)"
            checked={form.hasWetBath}
            onChange={(e) => setField('hasWetBath', e.target.checked)}
          />
          <Toggle
            label="Compact kitchenette"
            checked={form.hasKitchenette}
            onChange={(e) => setField('hasKitchenette', e.target.checked)}
          />
          <Toggle
            label="Solar panel"
            checked={form.solar}
            onChange={(e) => setField('solar', e.target.checked)}
          />
          <Toggle
            label="Battery pack"
            checked={form.battery}
            onChange={(e) => setField('battery', e.target.checked)}
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Anything else?</legend>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={fieldId('notes')}>
            Notes (optional)
          </label>
          <textarea
            id={fieldId('notes')}
            className={styles.textarea}
            rows={3}
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
          />
        </div>
      </fieldset>

      <div className={styles.actions}>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Finding matches…' : 'Find available trailers'}
        </Button>
      </div>
    </form>
  );
}

function RequestStatusLine({ request }: { request: RentalRequest }) {
  const display = requestStatusDisplay[request.status];
  return (
    <p className={styles.statusLine}>
      Request status: <StatusBadge tone={display.tone}>{display.label}</StatusBadge>
    </p>
  );
}

interface ResultPanelProps {
  headingId: string;
  headingRef: React.Ref<HTMLHeadingElement>;
  tone: 'success' | 'info' | 'warning';
  title: string;
  children: React.ReactNode;
}

function ResultPanel({
  headingId,
  headingRef,
  tone,
  title,
  children,
}: ResultPanelProps) {
  return (
    <div className={`${styles.panel} ${styles[tone]}`}>
      <h2
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        className={styles.resultTitle}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
