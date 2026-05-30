import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('associates the label with the input', () => {
    render(<Input label="Budget (USD)" />);
    expect(screen.getByLabelText(/budget \(usd\)/i)).toBeInTheDocument();
  });

  it('exposes helper text via aria-describedby', () => {
    render(<Input label="Budget (USD)" helperText="Target under ~$50,000." />);
    const input = screen.getByLabelText(/budget/i);
    expect(input).toHaveAccessibleDescription(/target under ~\$50,000\./i);
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('marks the field invalid and announces the error', () => {
    render(<Input label="Budget (USD)" error="Budget is above the ~$50,000 target." />);
    const input = screen.getByLabelText(/budget/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent(/above the ~\$50,000 target/i);
  });

  it('forwards typing to the onChange handler', async () => {
    const onChange = vi.fn();
    render(<Input label="Client name" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText(/client name/i), 'Maria');
    expect(onChange).toHaveBeenCalled();
  });
});
