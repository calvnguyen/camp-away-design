import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the platform title', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /campaway/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('opens on the rental request form by default', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /request a rental/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('browses available fleet trailers from the browse view', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /browse trailers/i }));
    // Seeded available unit shows up in the browse view.
    expect(await screen.findByText('CA-016')).toBeInTheDocument();
  });

  it('switches to the fleet ops view', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /fleet ops/i }));
    expect(
      await screen.findByRole('heading', { name: /fleet & rentals/i }),
    ).toBeInTheDocument();
  });
});
