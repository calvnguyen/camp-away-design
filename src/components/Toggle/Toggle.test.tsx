import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  it('renders as a labelled switch reflecting checked state', () => {
    render(<Toggle label="Solar panels" checked onChange={() => {}} />);
    const toggle = screen.getByRole('switch', { name: /solar panels/i });
    expect(toggle).toBeChecked();
  });

  it('is unchecked when checked is false', () => {
    render(<Toggle label="Battery pack" checked={false} onChange={() => {}} />);
    expect(screen.getByRole('switch', { name: /battery pack/i })).not.toBeChecked();
  });

  it('calls onChange when toggled via keyboard', async () => {
    const onChange = vi.fn();
    render(<Toggle label="Solar panels" checked={false} onChange={onChange} />);
    const toggle = screen.getByRole('switch', { name: /solar panels/i });
    toggle.focus();
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledOnce();
  });
});
