import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequirementForm } from './RequirementForm';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

function renderForm() {
  return render(<RequirementForm />);
}

describe('RequirementForm', () => {
  beforeEach(() => {
    localStorage.clear();
    pushMock.mockClear();
  });

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

    await vi.waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(expect.stringMatching(/^\/project\/.+/));
    });
  });

  it('saves a draft without navigating to project page', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/client name/i), 'Draft Client');
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    await vi.waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/');
    });
  });
});
