import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AppLayout from '../AppLayout';

const navigate = vi.fn();
const logout = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Иван' }, logout }),
}));

describe('AppLayout', () => {
  it('показывает имя пользователя и навигационные кнопки', () => {
    render(<AppLayout><div>Контент</div></AppLayout>);

    expect(screen.getByText('Иван')).toBeInTheDocument();
    expect(screen.getByText('Тренировки')).toBeInTheDocument();
    expect(screen.getByText('Контент')).toBeInTheDocument();
  });

  it('выполняет выход из системы и переход на /login', () => {
    render(<AppLayout><div>Контент</div></AppLayout>);
    fireEvent.click(screen.getByLabelText('Выйти'));

    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
