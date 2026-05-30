import { useCallback, useEffect, useState } from 'react';
import { rentalRepository } from '../../data';
import type { BuildOrder, Builder, RentalRequest, Trailer } from '../../types';
import {
  Button,
  Card,
  StatusBadge,
  buildStatusDisplay,
  requestStatusDisplay,
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
    { value: `${m.fleetSize}`, label: 'Fleet size' },
  ];
}

interface State {
  trailers: Trailer[];
  requests: RentalRequest[];
  buildOrders: BuildOrder[];
  builders: Builder[];
}

export function FleetDashboard() {
  const [state, setState] = useState<State | null>(null);

  const load = useCallback(async (): Promise<State> => {
    const [trailers, requests, buildOrders, builders] = await Promise.all([
      rentalRepository.listTrailers(),
      rentalRepository.listRequests(),
      rentalRepository.listBuildOrders(),
      rentalRepository.listBuilders(),
    ]);
    return { trailers, requests, buildOrders, builders };
  }, []);

  useEffect(() => {
    let active = true;
    load()
      .then((s) => active && setState(s))
      .catch(() => active && setState({ trailers: [], requests: [], buildOrders: [], builders: [] }));
    return () => {
      active = false;
    };
  }, [load]);

  if (state === null) return <p className={styles.muted}>Loading fleet dashboard…</p>;

  const { trailers, requests, buildOrders, builders } = state;
  const metrics = computeFleetMetrics(trailers, requests);
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

      <section aria-labelledby="builds-heading" className={styles.section}>
        <h2 id="builds-heading" className={styles.sectionTitle}>Commissioned builds</h2>
        <Card>
          <table className={styles.table}>
            <caption className={styles.visuallyHidden}>Builds commissioned from third-party builders</caption>
            <thead>
              <tr>
                <th scope="col">Spec</th>
                <th scope="col">Builder</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {buildOrders.map((b) => {
                const d = buildStatusDisplay[b.status];
                return (
                  <tr key={b.id}>
                    <td>{specSummary(b.spec)}</td>
                    <td>{builderName(b.builderId)}</td>
                    <td><StatusBadge tone={d.tone}>{d.label}</StatusBadge></td>
                    <td>
                      {b.status !== 'completed' ? (
                        <Button variant="secondary" onClick={() => advance(b.id)}>
                          {b.status === 'commissioned' ? 'Start build' : 'Mark complete'}
                        </Button>
                      ) : (
                        <span className={styles.muted}>Joined fleet</span>
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
