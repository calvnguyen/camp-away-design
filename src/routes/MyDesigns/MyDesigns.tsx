import { useCallback, useEffect, useState } from 'react';
import { rentalRepository } from '../../data';
import type { Reservation, TrailerDesign } from '../../types';
import {
  Button,
  Card,
  StatusBadge,
  reservationStatusDisplay,
} from '../../components';
import { specSummary } from '../../lib/specSummary';
import styles from './MyDesigns.module.css';

interface MyDesignsProps {
  /** Start a fresh rental request prefilled from a saved design. */
  onStartFromDesign: (design: TrailerDesign) => void;
}

interface State {
  designs: TrailerDesign[];
  reservations: Reservation[];
}

export function MyDesigns({ onStartFromDesign }: MyDesignsProps) {
  const [state, setState] = useState<State | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [renting, setRenting] = useState<string | null>(null);
  const [rentError, setRentError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<State> => {
    const [designs, reservations] = await Promise.all([
      rentalRepository.listDesigns(),
      rentalRepository.listReservations(),
    ]);
    return { designs, reservations };
  }, []);

  useEffect(() => {
    let active = true;
    load()
      .then((s) => active && setState(s))
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, [load]);

  async function handleRent(reservation: Reservation) {
    setRenting(reservation.id);
    setRentError(null);
    try {
      await rentalRepository.fulfillReservation(reservation.id);
      setState(await load());
    } catch {
      setRentError(
        `We couldn't complete the rental for this reservation. Please try again.`,
      );
    } finally {
      setRenting(null);
    }
  }

  if (loadError) {
    return (
      <p role="alert" className={styles.error}>
        We couldn't load your designs. Please refresh and try again.
      </p>
    );
  }
  if (state === null) {
    return <p className={styles.muted}>Loading your designs…</p>;
  }

  const { designs, reservations } = state;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>My designs &amp; reservations</h1>
        <p className={styles.subtitle}>
          Reopen a saved design to request a rental, or rent a reserved build
          once it's ready.
        </p>
      </header>

      <section aria-labelledby="designs-heading" className={styles.section}>
        <h2 id="designs-heading" className={styles.sectionTitle}>
          Saved designs
        </h2>
        {designs.length === 0 ? (
          <p className={styles.muted}>
            You haven't saved any designs yet. Save one from a request to reuse
            it later.
          </p>
        ) : (
          <ul className={styles.list}>
            {designs.map((design) => (
              <li key={design.id}>
                <Card className={styles.row}>
                  <div className={styles.info}>
                    <h3 className={styles.rowTitle}>{design.clientName}</h3>
                    <p className={styles.meta}>{specSummary(design.spec)}</p>
                    {design.notes ? (
                      <p className={styles.notes}>{design.notes}</p>
                    ) : null}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => onStartFromDesign(design)}
                  >
                    Start a request
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="reservations-heading" className={styles.section}>
        <h2 id="reservations-heading" className={styles.sectionTitle}>
          Reservations
        </h2>
        {rentError ? (
          <p role="alert" className={styles.error}>
            {rentError}
          </p>
        ) : null}
        {reservations.length === 0 ? (
          <p className={styles.muted}>
            No reservations yet. When nothing in the fleet matches a design, you
            can reserve a build of it.
          </p>
        ) : (
          <ul className={styles.list}>
            {reservations.map((reservation) => {
              const display = reservationStatusDisplay[reservation.status];
              return (
                <li key={reservation.id}>
                  <Card className={styles.row}>
                    <div className={styles.info}>
                      <h3 className={styles.rowTitle}>
                        {reservation.clientName}
                        <StatusBadge tone={display.tone}>
                          {display.label}
                        </StatusBadge>
                      </h3>
                      <p className={styles.meta}>
                        {specSummary(reservation.spec)}
                      </p>
                      {reservation.status === 'pending' ? (
                        <p className={styles.notes}>
                          A builder is constructing your trailer. We'll let you
                          know when it's ready to rent.
                        </p>
                      ) : null}
                    </div>
                    {reservation.status === 'ready' ? (
                      <Button
                        onClick={() => handleRent(reservation)}
                        disabled={renting !== null}
                        aria-label={`Rent the build reserved for ${reservation.clientName}`}
                      >
                        {renting === reservation.id ? 'Renting…' : 'Rent it now'}
                      </Button>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
