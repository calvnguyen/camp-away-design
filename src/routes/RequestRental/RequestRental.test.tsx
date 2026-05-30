import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { RequestRental } from './RequestRental';

// Fills the renter's name and a valid date range. The spec fields keep their
// PRD defaults (17 ft, sleeps 2, wet bath + kitchenette), which match seeded
// available units CA-018 and CA-020.
function fillContactAndDates() {
  fireEvent.change(screen.getByLabelText(/your name/i), {
    target: { value: 'Test Renter' },
  });
  fireEvent.change(screen.getByLabelText(/start date/i), {
    target: { value: '2026-08-01' },
  });
  fireEvent.change(screen.getByLabelText(/end date/i), {
    target: { value: '2026-08-05' },
  });
}

describe('RequestRental', () => {
  it('blocks submission and flags the missing required fields', async () => {
    render(<RequestRental />);
    await userEvent.click(
      screen.getByRole('button', { name: /find available trailers/i }),
    );

    const nameField = screen.getByLabelText(/your name/i);
    expect(nameField).toHaveAttribute('aria-invalid', 'true');
    // The name error is announced as an alert (one per missing required field).
    const nameError = screen.getByText(/enter your name/i);
    expect(nameError).toHaveAttribute('role', 'alert');
    // It stays on the form — no results panel appears.
    expect(
      screen.queryByRole('heading', { name: /we found/i }),
    ).not.toBeInTheDocument();
    // Focus moves to the first invalid field.
    expect(nameField).toHaveFocus();
  });

  it('validates the date range', async () => {
    render(<RequestRental />);
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: 'Test Renter' },
    });
    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: '2026-08-10' },
    });
    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: '2026-08-01' },
    });
    await userEvent.click(
      screen.getByRole('button', { name: /find available trailers/i }),
    );

    const endField = screen.getByLabelText(/end date/i);
    expect(endField).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent(
      /on or after the start date/i,
    );
  });

  it('warns softly when the length is outside the small-trailer range', () => {
    render(<RequestRental />);
    fireEvent.change(screen.getByLabelText(/trailer length/i), {
      target: { value: '24' },
    });
    expect(screen.getByText(/should be 16–18 ft/i)).toBeInTheDocument();
  });

  it('matches a valid request to available units and confirms a rental', async () => {
    render(<RequestRental />);
    fillContactAndDates();
    await userEvent.click(
      screen.getByRole('button', { name: /find available trailers/i }),
    );

    expect(
      await screen.findByRole('heading', { name: /we found \d+ available/i }),
    ).toBeInTheDocument();
    const confirmCA018 = await screen.findByRole('button', {
      name: /confirm rental of CA-018/i,
    });
    await userEvent.click(confirmCA018);

    expect(
      await screen.findByRole('heading', { name: /you're all set/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/CA-018/)).toBeInTheDocument();
  });

  it('records an unfulfillable request as demand and explains why', async () => {
    render(<RequestRental />);
    fillContactAndDates();
    // No seeded available unit sleeps 3 — this cannot be matched.
    fireEvent.change(screen.getByLabelText(/sleeping capacity/i), {
      target: { value: '3' },
    });
    await userEvent.click(
      screen.getByRole('button', { name: /find available trailers/i }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /no available trailer matches/i }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/recorded your request as demand/i)).toBeInTheDocument();
  });
});
