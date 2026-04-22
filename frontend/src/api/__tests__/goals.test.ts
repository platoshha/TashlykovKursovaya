import { describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();

vi.mock('../axios', () => ({
  default: { get, post, patch: vi.fn(), delete: vi.fn() },
}));

import { createGoal, getGoals } from '../goals';

describe('goals api', () => {
  it('getGoals получает список целей', async () => {
    const payload = { items: [], total: 0 };
    get.mockResolvedValueOnce({ data: payload });

    await expect(getGoals()).resolves.toEqual(payload);
    expect(get).toHaveBeenCalledWith('/goals');
  });

  it('createGoal отправляет новую цель', async () => {
    const payload = { id: 'g1', goal_type_id: 1, goal_type_name: 'Вес', goal_type_code: 'weight', user_id: 'u1', target_value: 75, target_date: null, is_achieved: false, notes: null, created_at: '', updated_at: '' };
    post.mockResolvedValueOnce({ data: payload });

    await expect(createGoal({ goal_type_id: 1, target_value: 75 })).resolves.toEqual(payload);
    expect(post).toHaveBeenCalledWith('/goals', { goal_type_id: 1, target_value: 75 });
  });
});
