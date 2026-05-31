import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConceptLayoutSection } from './ConceptLayoutSection';
import type { ConceptLayout, StandardBuild } from '../types';
import { envelopeFor, templateLayout, templateRationale } from '../lib/conceptLayout';

function layout(status: ConceptLayout['status']): ConceptLayout {
  const envelope = envelopeFor({ trailerLengthFt: 18 });
  return {
    id: 'concept-1',
    status,
    source: 'template',
    lengthFt: envelope.lengthFt,
    widthFt: envelope.widthFt,
    zones: templateLayout(envelope),
    rationale: templateRationale(envelope),
    createdAt: '2026-05-30T00:00:00.000Z',
    updatedAt: '2026-05-30T00:00:00.000Z',
  };
}

const build: StandardBuild = {
  id: 'std-17-couple',
  name: 'Standard 17 — Couple',
  lengthFt: 17,
  sleeps: 2,
  hasWetBath: true,
  hasKitchenette: true,
};

const noop = () => Promise.resolve();

describe('ConceptLayoutSection', () => {
  it('shows the standard-build match and no generate button when one exists', () => {
    render(
      <ConceptLayoutSection
        equivalentBuild={build}
        layout={null}
        onGenerate={noop}
        onApprove={noop}
        onReject={noop}
      />,
    );
    expect(screen.getByText(/matches/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /generate/i })).not.toBeInTheDocument();
  });

  it('offers to generate a layout when there is no build and no layout', async () => {
    const onGenerate = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <ConceptLayoutSection
        equivalentBuild={null}
        layout={null}
        onGenerate={onGenerate}
        onApprove={noop}
        onReject={noop}
      />,
    );
    await user.click(screen.getByRole('button', { name: /generate concept layout/i }));
    expect(onGenerate).toHaveBeenCalledOnce();
  });

  it('renders the diagram and approval gate for a pending layout', async () => {
    const onApprove = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(
      <ConceptLayoutSection
        equivalentBuild={null}
        layout={layout('pending_review')}
        onGenerate={noop}
        onApprove={onApprove}
        onReject={noop}
      />,
    );
    // The diagram exposes an accessible name.
    expect(screen.getByRole('img', { name: /concept layout for a/i })).toBeInTheDocument();
    expect(screen.getByText(/pending review/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /approve for production/i }));
    expect(onApprove).toHaveBeenCalledOnce();
  });

  it('hides the approve button once the layout is approved', () => {
    render(
      <ConceptLayoutSection
        equivalentBuild={null}
        layout={layout('approved')}
        onGenerate={noop}
        onApprove={noop}
        onReject={noop}
      />,
    );
    expect(screen.getByText(/can go to production/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /approve for production/i }),
    ).not.toBeInTheDocument();
  });
});
