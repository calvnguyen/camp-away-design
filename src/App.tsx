import { useEffect, useState } from 'react';
import { rentalRepository } from './data';
import type { Trailer, TrailerDesign } from './types';
import { StatusBadge, trailerStatusDisplay } from './components';
import { specSummary } from './lib/specSummary';
import { FleetDashboard } from './routes/FleetDashboard/FleetDashboard';
import { MyDesigns } from './routes/MyDesigns/MyDesigns';
import { RequestRental } from './routes/RequestRental/RequestRental';
import styles from './App.module.css';

type View = 'request' | 'browse' | 'designs' | 'fleet';

function AvailableTrailers() {
  const [trailers, setTrailers] = useState<Trailer[] | null>(null);

  useEffect(() => {
    let active = true;
    rentalRepository.listTrailers().then((all) => {
      if (active) setTrailers(all.filter((t) => t.status === 'available'));
    });
    return () => {
      active = false;
    };
  }, []);

  if (trailers === null) return <p className={styles.meta}>Loading trailers…</p>;
  if (trailers.length === 0)
    return <p className={styles.meta}>No trailers available right now.</p>;

  return (
    <ul className={styles.list}>
      {trailers.map((t) => {
        const d = trailerStatusDisplay[t.status];
        return (
          <li key={t.id} className={styles.card}>
            <h2 className={styles.cardTitle}>
              {t.name}
              <StatusBadge tone={d.tone}>{d.label}</StatusBadge>
            </h2>
            <p className={styles.meta}>{specSummary(t.spec)}</p>
          </li>
        );
      })}
    </ul>
  );
}

export function App() {
  const [view, setView] = useState<View>('request');
  // Seed for the request form: a key to force a clean remount, and an optional
  // design to prefill it from (set when starting a request from a saved design).
  const [requestSeed, setRequestSeed] = useState<{
    key: number;
    design: TrailerDesign | null;
  }>({ key: 0, design: null });

  function openRequest(design: TrailerDesign | null) {
    setRequestSeed((prev) => ({ key: prev.key + 1, design }));
    setView('request');
  }

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>CampAway</h1>
        <p className={styles.subtitle}>
          Rent a small, SUV-towable tiny trailer — tell us what you need and we'll match you.
        </p>
      </header>

      <nav aria-label="Views" className={styles.nav}>
        <button
          type="button"
          className={styles.navButton}
          aria-current={view === 'request' ? 'page' : undefined}
          onClick={() => openRequest(null)}
        >
          Request a rental
        </button>
        <button
          type="button"
          className={styles.navButton}
          aria-current={view === 'browse' ? 'page' : undefined}
          onClick={() => setView('browse')}
        >
          Browse trailers
        </button>
        <button
          type="button"
          className={styles.navButton}
          aria-current={view === 'designs' ? 'page' : undefined}
          onClick={() => setView('designs')}
        >
          My designs
        </button>
        <button
          type="button"
          className={styles.navButton}
          aria-current={view === 'fleet' ? 'page' : undefined}
          onClick={() => setView('fleet')}
        >
          Fleet ops
        </button>
      </nav>

      {view === 'request' ? (
        <RequestRental
          key={requestSeed.key}
          initialDesign={requestSeed.design ?? undefined}
        />
      ) : view === 'browse' ? (
        <AvailableTrailers />
      ) : view === 'designs' ? (
        <MyDesigns onStartFromDesign={(design) => openRequest(design)} />
      ) : (
        <FleetDashboard />
      )}
    </main>
  );
}
