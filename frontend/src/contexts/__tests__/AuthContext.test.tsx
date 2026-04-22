import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';

const getMe = vi.fn();
vi.mock('../../api/auth', () => ({ getMe }));

const Probe = () => {
  const { user, isLoading } = useAuth();
  return <div>{isLoading ? 'loading' : user ? user.name : 'guest'}</div>;
};

describe('AuthContext', () => {
  it('без токена завершает загрузку и оставляет гостевой режим', async () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('guest')).toBeInTheDocument());
  });

  it('с токеном запрашивает пользователя и гидрирует контекст', async () => {
    localStorage.setItem('token', 'jwt');
    getMe.mockResolvedValueOnce({ id: '1', email: 'u@test.ru', name: 'Иван' });

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText('Иван')).toBeInTheDocument());
  });
});
