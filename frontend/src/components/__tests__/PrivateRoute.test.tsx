import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PrivateRoute from '../PrivateRoute';

const navigateSpy = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  Outlet: () => <div>Private page</div>,
  Navigate: ({ to }: { to: string }) => {
    navigateSpy(to);
    return <div>redirected</div>;
  },
}));

import { useAuth } from '../../contexts/AuthContext';

describe('PrivateRoute', () => {
  it('показывает индикатор загрузки во время проверки авторизации', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: true, login: vi.fn(), logout: vi.fn() });
    render(<PrivateRoute />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('перенаправляет неавторизованного пользователя на /login', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isLoading: false, login: vi.fn(), logout: vi.fn() });
    render(<PrivateRoute />);

    expect(navigateSpy).toHaveBeenCalledWith('/login');
    expect(screen.getByText('redirected')).toBeInTheDocument();
  });

  it('отображает защищенный маршрут для авторизованного пользователя', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: '1', email: 'u@test.ru', name: 'Иван' }, isLoading: false, login: vi.fn(), logout: vi.fn() });
    render(<PrivateRoute />);

    expect(screen.getByText('Private page')).toBeInTheDocument();
  });
});
