import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders its label as an accessible button', () => {
    render(<Button>Submit brief</Button>);
    expect(
      screen.getByRole('button', { name: /submit brief/i }),
    ).toBeInTheDocument();
  });

  it('defaults to type="button" so it does not submit forms unexpectedly', () => {
    render(<Button>Save draft</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('calls onClick when activated', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Approve</Button>);
    await userEvent.click(screen.getByRole('button', { name: /approve/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Approve
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: /approve/i }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
