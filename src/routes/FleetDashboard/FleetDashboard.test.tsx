import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FleetDashboard } from './FleetDashboard';

describe('FleetDashboard', () => {
  it('renders fleet metrics and the requests/fleet sections', async () => {
    render(<FleetDashboard />);
    expect(
      await screen.findByRole('heading', { name: /fleet & rentals/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/fleet utilization/i)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /rental requests/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /^fleet$/i })).toBeInTheDocument();
  });

  it('lists seeded requests with their status', async () => {
    render(<FleetDashboard />);
    expect(await screen.findByText('Maria & Jon')).toBeInTheDocument();
    // Dev & Sam appear in both requests and reservations — scope to requests.
    const requests = screen.getByRole('region', { name: /rental requests/i });
    expect(within(requests).getByText('Dev & Sam')).toBeInTheDocument();
    expect(screen.getAllByText(/unfulfilled/i).length).toBeGreaterThan(0);
  });

  it('surfaces build reservations and flags reservation-bound builds', async () => {
    render(<FleetDashboard />);
    const reservations = await screen.findByRole('region', {
      name: /build reservations/i,
    });
    // Dev & Sam's seeded reservation is pending its build.
    expect(within(reservations).getByText('Dev & Sam')).toBeInTheDocument();
    expect(
      within(reservations).getByText(/build in progress/i),
    ).toBeInTheDocument();
    // The build fulfilling it is flagged as a reservation in the builds table.
    const builds = screen.getByRole('region', { name: /commissioned builds/i });
    expect(within(builds).getByText('Reservation')).toBeInTheDocument();
  });

  it('advances a commissioned build through its lifecycle', async () => {
    render(<FleetDashboard />);
    const buildsSection = await screen.findByRole('region', { name: /commissioned builds/i });
    const startButtons = within(buildsSection).getAllByRole('button', { name: /start build/i });
    await userEvent.click(startButtons[0]);
    // After starting, that row offers "Mark complete".
    await waitFor(() =>
      expect(
        within(buildsSection).getAllByRole('button', { name: /mark complete/i }).length,
      ).toBeGreaterThan(0),
    );
  });
});
