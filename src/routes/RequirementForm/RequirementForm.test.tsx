import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { RequirementForm } from './RequirementForm';

// Use the component-based <MemoryRouter> (not createMemoryRouter): the data
// router builds a fetch Request whose AbortSignal isn't Node's undici
// AbortSignal under jsdom, which throws. MemoryRouter + Routes navigates without
// that machinery.
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
    // Focus moves to the first invalid field.
    expect(nameField).toHaveFocus();
  });

  it('rejects a trailer length outside the SUV-towable range', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/client name/i), 'Test Client');
    const length = screen.getByLabelText(/trailer length/i);
    await user.clear(length);
    await user.type(length, '24');
    await user.click(screen.getByRole('button', { name: /submit brief/i }));

    expect(length).toHaveAttribute('aria-invalid', 'true');
    const error = screen.getByText(/must be 16–18 ft/i);
    expect(error).toHaveAttribute('role', 'alert');
  });

  it('exposes feature toggles as switches with state', async () => {
    const user = userEvent.setup();
    renderForm();

    const wetBath = screen.getByRole('switch', { name: /wet bath/i });
    expect(wetBath).toHaveAttribute('aria-checked', 'true');
    await user.click(wetBath);
    expect(wetBath).toHaveAttribute('aria-checked', 'false');
  });

  it('submits a valid brief and navigates to the new project', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/client name/i), 'Valid Client');
    await user.type(screen.getByLabelText(/budget/i), '40000');
    await user.click(screen.getByRole('button', { name: /submit brief/i }));

    expect(await screen.findByText('Project page')).toBeInTheDocument();
  });
});
