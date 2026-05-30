import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './Card';

describe('Card', () => {
  it('renders its children', () => {
    render(
      <Card>
        <p>Brief contents</p>
      </Card>,
    );
    expect(screen.getByText('Brief contents')).toBeInTheDocument();
  });

  it('merges a custom className with the base card class', () => {
    render(<Card className="custom">content</Card>);
    const card = screen.getByText('content');
    expect(card.className).toMatch(/custom/);
  });

  it('forwards arbitrary DOM props', () => {
    render(<Card data-testid="brief-card">content</Card>);
    expect(screen.getByTestId('brief-card')).toBeInTheDocument();
  });
});
