import { useCallback, useEffect, useState } from 'react';
import { rentalRepository } from '../../data';
import type {
  BuildOrder,
  Builder,
  RentalRequest,
  Reservation,
  Trailer,
} from '../../types';
import {
  Button,
  Card,
  StatusBadge,
  buildStatusDisplay,
  requestStatusDisplay,
  reservationStatusDisplay,
  trailerStatusDisplay,
} from '../../components';
import {
  computeBuilderLoads,
  computeFleetMetrics,
  type FleetMetrics,
} from '../../lib/fleetMetrics';
import { specSummary } from '../../lib/specSummary';
import styles from './FleetDashboard.module.css';

function metricCards(m: FleetMetrics): { value: string; label: string }[] {
  return [
    { value: `${m.utilizationPct}%`, label: 'Fleet utilization' },
    { value: `${m.fulfilledPct}%`, label: 'Requests fulfilled' },
    { value: `${m.available}`, label: 'Available now' },
    { value: `${m.unfulfilled}`, label: 'Unmet requests' },
    { value: `${m.reserved}`, label: 'Held for reservations' },
    { value: `${m.pendingReservations}`, label: 'Reservations pending' },
    { value: `${m.fleetSize}`, label: 'Fleet size' },
  ];
}

interface State {
  trailers: Trailer[];
  requests: RentalRequest[];
  buildOrders: BuildOrder[];
  builders: Builder[];
  reservations: Reservation[];
}

export function FleetDashboard() {
  const [state, setState] = useState<State | null>(null);

  const load = useCallback(async (): Promise<State> => {
    const [trailers, requests, buildOrders, builders, reservations] = await Promise.all([
      rentalRepository.listTrailers(),
      rentalRepository.listRequests(),
      rentalRepository.listBuildOrders(),
      rentalRepository.listBuilders(),
      rentalRepository.listReservations(),
    ]);
    return { trailers, requests, buildOrders, builders, reservations };
  }, []);

  useEffect(() => {
    let active = true;
    load()
      .then((s) => active && setState(s))
      .catch(
        () =>
          active &&
          setState({
            trailers: [],
            requests: [],
            buildOrders: [],
            builders: [],
            reservations: [],
          }),
      );
    return () => {
      active = false;
    };
  }, [load]);

  if (state === null) return <p className={styles.muted}>Loading fleet dashboard…</p>;

  const { trailers, requests, buildOrders, builders, reservations } = state;
  const metrics = computeFleetMetrics(trailers, requests, reservations);
  const builderLoads = computeBuilderLoads(buildOrders, builders);
  const maxLoad = Math.max(1, ...builderLoads.map((l) => l.activeBuilds));
  const builderName = (id: string | null) =>
    builders.find((b) => b.id === id)?.name ?? 'Unassigned';
  const trailerName = (id: string | null) =>
    trailers.find((t) => t.id === id)?.name ?? '—';

  async function advance(buildId: string) {
    await rentalRepository.advanceBuild(buildId);
    setState(await load());
  }

  async function assignBuilder(buildId: string, builderId: string) {
    if (!builderId) return;
    await rentalRepository.assignBuilder(buildId, builderId);
    setState(await load());
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>Fleet &amp; rentals</h1>
        <p className={styles.subtitle}>Requests, fleet availability, and commissioned builds.</p>
      </header>

      <section aria-labelledby="metrics-heading" className={styles.section}>
        <h2 id="metrics-heading" className={styles.sectionTitle}>Platform metrics</h2>
        <ul className={styles.metricsGrid}>
          {metricCards(metrics).map((c) => (
            <li key={c.label}>
              <Card className={styles.stat}>
                <span className={styles.statValue}>{c.value}</span>
                <span className={styles.statLabel}>{c.label}</span>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="requests-heading" className={styles.section}>
        <h2 id="requests-heading" className={styles.sectionTitle}>Rental requests</h2>
        <Card>
          <table className={styles.table}>
            <caption className={styles.visuallyHidden}>Rental requests across renters</caption>
            <thead>
              <tr>
                <th scope="col">Renter</th>
                <th scope="col">Dates</th>
                <th scope="col">Status</th>
                <th scope="col">Matched unit</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const d = requestStatusDisplay[r.status];
                return (
                  <tr key={r.id}>
                    <td>{r.clientName}</td>
                    <td>{r.startDate} → {r.endDate}</td>
                    <td><StatusBadge tone={d.tone}>{d.label}</StatusBadge></td>
                    <td>{r.matchedTrailerId ? trailerName(r.matchedTrailerId) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </section>

      <section aria-labelledby="fleet-heading" className={styles.section}>
        <h2 id="fleet-heading" className={styles.sectionTitle}>Fleet</h2>
        <Card>
          <table className={styles.table}>
            <caption className={styles.visuallyHidden}>All trailers in the fleet</caption>
            <thead>
              <tr>
                <th scope="col">Unit</th>
                <th scope="col">Spec</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {trailers.map((t) => {
                const d = trailerStatusDisplay[t.status];
                return (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{specSummary(t.spec)}</td>
                    <td><StatusBadge tone={d.tone}>{d.label}</StatusBadge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </section>

      <section aria-labelledby="reservations-heading" className={styles.section}>
        <h2 id="reservations-heading" className={styles.sectionTitle}>Build reservations</h2>
        <Card>
          {reservations.length === 0 ? (
            <p className={styles.muted}>No build reservations yet.</p>
          ) : (
            <table className={styles.table}>
              <caption className={styles.visuallyHidden}>Renter build reservations</caption>
              <thead>
                <tr>
                  <th scope="col">Renter</th>
                  <th scope="col">Reserved spec</th>
                  <th scope="col">Status</th>
                  <th scope="col">Held unit</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => {
                  const d = reservationStatusDisplay[r.status];
                  return (
                    <tr key={r.id}>
                      <td>{r.clientName}</td>
                      <td>{specSummary(r.spec)}</td>
                      <td><StatusBadge tone={d.tone}>{d.label}</StatusBadge></td>
                      <td>{trailerName(r.heldTrailerId)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </section>

      <section aria-labelledby="builds-heading" className={styles.section}>
        <h2 id="builds-heading" className={styles.sectionTitle}>Commissioned builds</h2>
        <Card>
          <table className={styles.table}>
            <caption className={styles.visuallyHidden}>Builds commissioned from third-party builders</caption>
            <thead>
              <tr>
                <th scope="col">Spec</th>
                <th scope="col">For</th>
                <th scope="col">Builder</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {buildOrders.map((b) => {
                const d = buildStatusDisplay[b.status];
                const unassigned = b.builderId === null;
                const canAssign = unassigned && b.status !== 'completed';
                return (
                  <tr key={b.id}>
                    <td>{specSummary(b.spec)}</td>
                    <td>
                      {b.reservationId ? (
                        <StatusBadge tone="info">Reservation</StatusBadge>
                      ) : (
                        <span className={styles.muted}>Fleet growth</span>
                      )}
                    </td>
                    <td>
                      {canAssign ? (
                        <label className={styles.assign}>
                          <span className={styles.visuallyHidden}>
                            Assign a builder to this build
                          </span>
                          <select
                            className={styles.select}
                            defaultValue=""
                            onChange={(e) => assignBuilder(b.id, e.target.value)}
                          >
                            <option value="" disabled>
                              Assign builder…
                            </option>
                            {builders.map((builder) => (
                              <option key={builder.id} value={builder.id}>
                                {builder.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        builderName(b.builderId)
                      )}
                    </td>
                    <td><StatusBadge tone={d.tone}>{d.label}</StatusBadge></td>
                    <td>
                      {b.status === 'completed' ? (
                        <span className={styles.muted}>
                          {b.reservationId ? 'Held for renter' : 'Joined fleet'}
                        </span>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => advance(b.id)}
                          disabled={unassigned}
                          title={
                            unassigned ? 'Assign a builder first' : undefined
                          }
                        >
                          {b.status === 'commissioned' ? 'Start build' : 'Mark complete'}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </section>

      <section aria-labelledby="builders-heading" className={styles.section}>
        <h2 id="builders-heading" className={styles.sectionTitle}>Builders</h2>
        <Card>
          <ul className={styles.firmList}>
            {builderLoads.map(({ builder, activeBuilds }) => (
              <li key={builder.id} className={styles.firmRow}>
                <span className={styles.firmName}>{builder.name}</span>
                <span className={styles.bar} aria-hidden="true">
                  <span className={styles.barFill} style={{ width: `${(activeBuilds / maxLoad) * 100}%` }} />
                </span>
                <span className={styles.firmCount}>
                  {activeBuilds} active build{activeBuilds === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
