import { describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const put = vi.fn();

vi.mock('../axios', () => ({
  default: { get, put },
}));

import { getProfile, updateProfile } from '../profile';

describe('profile api', () => {
  it('getProfile получает профиль пользователя', async () => {
    const payload = { user_id: 'u1', name: 'Иван', age: 22, height_cm: 180, current_weight_kg: '80', training_level: 'beginner' };
    get.mockResolvedValueOnce({ data: payload });

    await expect(getProfile()).resolves.toEqual(payload);
    expect(get).toHaveBeenCalledWith('/profile');
  });

  it('updateProfile отправляет измененные поля', async () => {
    const payload = { user_id: 'u1', name: 'Петр', age: 22, height_cm: 180, current_weight_kg: '80', training_level: 'intermediate' };
    put.mockResolvedValueOnce({ data: payload });

    await expect(updateProfile({ name: 'Петр', training_level: 'intermediate' })).resolves.toEqual(payload);
    expect(put).toHaveBeenCalledWith('/profile', { name: 'Петр', training_level: 'intermediate' });
  });
});
