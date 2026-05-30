import { fireEvent, render, screen } from '@testing-library/react';
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

  // Submits a configuration no seeded available unit can satisfy (sleeps 3).
  async function submitUnmatchable() {
    fillContactAndDates();
    fireEvent.change(screen.getByLabelText(/sleeping capacity/i), {
      target: { value: '3' },
    });
    await userEvent.click(
      screen.getByRole('button', { name: /find available trailers/i }),
    );
    await screen.findByRole('heading', { name: /no available trailer matches/i });
  }

  it('records an unfulfillable request as demand and offers save/notify/reserve', async () => {
    render(<RequestRental />);
    await submitUnmatchable();

    expect(screen.getByText(/recorded your design as demand/i)).toBeInTheDocument();
    // PRD: the no-match state offers all three paths.
    expect(screen.getByRole('button', { name: /^save design$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^notify me$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reserve a build/i })).toBeInTheDocument();
  });

  it('saves a design from the no-match state', async () => {
    render(<RequestRental />);
    await submitUnmatchable();

    await userEvent.click(screen.getByRole('button', { name: /^save design$/i }));
    const note = await screen.findByRole('status');
    expect(note).toHaveTextContent(/design saved/i);
    expect(screen.getByRole('button', { name: /design saved/i })).toBeDisabled();
  });

  it('reserves a build of a no-match design and shows a pending reservation', async () => {
    render(<RequestRental />);
    await submitUnmatchable();

    await userEvent.click(screen.getByRole('button', { name: /reserve a build/i }));
    expect(
      await screen.findByRole('heading', { name: /your build is reserved/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/build in progress/i)).toBeInTheDocument();
  });

  it('prefills the form from a saved design', () => {
    render(
      <RequestRental
        initialDesign={{
          id: 'design-1',
          clientName: 'Prefilled Renter',
          notes: 'From a saved design',
          spec: {
            trailerLengthFt: 18,
            sleeps: 3,
            hasWetBath: true,
            hasKitchenette: true,
            solar: true,
            battery: false,
          },
          createdAt: '2026-05-01T00:00:00.000Z',
          updatedAt: '2026-05-01T00:00:00.000Z',
        }}
      />,
    );
    expect(screen.getByLabelText(/your name/i)).toHaveValue('Prefilled Renter');
    expect(screen.getByLabelText(/sleeping capacity/i)).toHaveValue(3);
    expect(screen.getByLabelText(/solar panel/i)).toBeChecked();
  });
});
