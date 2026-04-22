import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import LoginPage from '../LoginPage';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn(), user: null, isLoading: false, logout: vi.fn() }),
}));
vi.mock('../../api/auth', () => ({ login: vi.fn() }));

describe('LoginPage', () => {
  it('отображает форму входа', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByText('Вход')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
  });
});
