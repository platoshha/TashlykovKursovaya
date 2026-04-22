import { describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();

vi.mock('../axios', () => ({
  default: { get, post },
}));

import { createExercise, getExercises } from '../exercises';

describe('exercises api', () => {
  it('getExercises передает query params', async () => {
    const payload = { items: [], total: 0 };
    get.mockResolvedValueOnce({ data: payload });

    await expect(getExercises({ search: 'жим', category_id: 2, page: 1, size: 10 })).resolves.toEqual(payload);
    expect(get).toHaveBeenCalledWith('/exercises', { params: { search: 'жим', category_id: 2, page: 1, size: 10 } });
  });

  it('createExercise отправляет POST на /exercises', async () => {
    const payload = { id: '1', name: 'Жим', description: null, category_id: 2, category_name: 'Силовые', is_system: false, created_by_user_id: 'u1' };
    post.mockResolvedValueOnce({ data: payload });

    await expect(createExercise({ name: 'Жим', category_id: 2, description: 'База' })).resolves.toEqual(payload);
    expect(post).toHaveBeenCalledWith('/exercises', { name: 'Жим', category_id: 2, description: 'База' });
  });
});
