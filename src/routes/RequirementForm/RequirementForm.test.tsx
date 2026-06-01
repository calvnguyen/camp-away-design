import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { RequirementForm } from './RequirementForm';

function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/new']}>
      <Routes>
        <Route path="/new" element={<RequirementForm />} />
        <Route path="/project/:id" element={<div>Project page</div>} />
        <Route path="/" element={<div>Projects home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequirementForm', () => {
  beforeEach(() => localStorage.clear());

  it('blocks submit and announces an error when the client name is empty', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /submit brief/i }));

    const nameField = screen.getByLabelText(/client name/i);
    expect(nameField).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/client name is required/i)).toHaveAttribute('role', 'alert');
    expect(nameField).toHaveFocus();
  });

  it('renders dropdown fields for size, bathroom, kitchen, usage, style, and budget', () => {
    renderForm();
    expect(screen.getByLabelText(/trailer size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bathroom type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/kitchenette/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/intended usage/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/design style/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/budget range/i)).toBeInTheDocument();
  });

  it('renders power option checkboxes', () => {
    renderForm();
    expect(screen.getByLabelText(/solar upgrade/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/battery backup/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/shore power only/i)).toBeInTheDocument();
  });

  it('submits a valid brief and navigates to the new project', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/client name/i), 'Valid Client');
    await user.click(screen.getByRole('button', { name: /submit brief/i }));

    expect(await screen.findByText('Project page')).toBeInTheDocument();
  });

  it('saves a draft without navigating to project page', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/client name/i), 'Draft Client');
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    expect(await screen.findByText('Projects home')).toBeInTheDocument();
  });
});
