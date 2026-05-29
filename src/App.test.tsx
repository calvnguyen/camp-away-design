import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the platform title', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /campawaydesign/i }),
    ).toBeInTheDocument();
  });

  it('lists seeded projects', async () => {
    render(<App />);
    expect(await screen.findByText(/maria & jon/i)).toBeInTheDocument();
  });
});
