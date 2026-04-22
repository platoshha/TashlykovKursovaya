import { describe, expect, it, vi } from 'vitest';

const post = vi.fn();
const get = vi.fn();

vi.mock('../axios', () => ({
  default: { post, get },
}));

import { getMe, login, register } from '../auth';

describe('auth api', () => {
  it('login отправляет запрос на /auth/login', async () => {
    const payload = { access_token: 'jwt', token_type: 'bearer' };
    post.mockResolvedValueOnce({ data: payload });

    await expect(login({ email: 'u@test.ru', password: '123456' })).resolves.toEqual(payload);
    expect(post).toHaveBeenCalledWith('/auth/login', { email: 'u@test.ru', password: '123456' });
  });

  it('register отправляет запрос на /auth/register', async () => {
    const payload = { id: '1', email: 'u@test.ru', name: 'Иван' };
    post.mockResolvedValueOnce({ data: payload });

    await expect(register({ email: 'u@test.ru', password: '123456', name: 'Иван' })).resolves.toEqual(payload);
    expect(post).toHaveBeenCalledWith('/auth/register', { email: 'u@test.ru', password: '123456', name: 'Иван' });
  });

  it('getMe запрашивает /auth/me', async () => {
    const payload = { id: '1', email: 'u@test.ru', name: 'Иван' };
    get.mockResolvedValueOnce({ data: payload });

    await expect(getMe()).resolves.toEqual(payload);
    expect(get).toHaveBeenCalledWith('/auth/me');
  });
});
