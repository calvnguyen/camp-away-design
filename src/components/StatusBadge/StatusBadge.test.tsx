import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders its label', () => {
    render(<StatusBadge tone="success">Available</StatusBadge>);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('defaults to the neutral tone', () => {
    render(<StatusBadge>Open</StatusBadge>);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });
});
