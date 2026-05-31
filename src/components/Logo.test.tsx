import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo } from './Logo';

describe('Logo', () => {
  it('exposes an accessible name when rendered as an icon-only mark', () => {
    render(<Logo variant="mark" />);
    expect(screen.getByRole('img', { name: /campawaydesign/i })).toBeInTheDocument();
  });

  it('shows the visible wordmark and hides the decorative mark from AT', () => {
    const { container } = render(<Logo />);
    expect(screen.getByText('CampAway')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
    // The full logo's visible text is the name, so the SVG is decorative.
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    // No duplicate image role competing with the visible wordmark.
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
