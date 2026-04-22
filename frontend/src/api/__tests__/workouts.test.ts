import { describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();

vi.mock('../axios', () => ({
  default: { get, post, patch, put: vi.fn(), delete: vi.fn() },
}));

import { addSet, completeSet, getWorkouts } from '../workouts';

describe('workouts api', () => {
  it('getWorkouts отправляет параметры фильтрации', async () => {
    const payload = { items: [], total: 0, page: 1, size: 10 };
    get.mockResolvedValueOnce({ data: payload });

    await expect(getWorkouts({ date_from: '2026-04-01', date_to: '2026-04-30', page: 1, size: 10 })).resolves.toEqual(payload);
    expect(get).toHaveBeenCalledWith('/workouts', { params: { date_from: '2026-04-01', date_to: '2026-04-30', page: 1, size: 10 } });
  });

  it('addSet отправляет запрос на добавление подхода', async () => {
    const payload = { id: 's1', workout_exercise_id: 'we1', set_number: 1, reps_count: 10, weight_kg: '60', is_completed: false, completed_at: null, created_at: '' };
    post.mockResolvedValueOnce({ data: payload });

    await expect(addSet('w1', 'we1', { set_number: 1, reps_count: 10, weight_kg: 60 })).resolves.toEqual(payload);
    expect(post).toHaveBeenCalledWith('/workouts/w1/exercises/we1/sets', { set_number: 1, reps_count: 10, weight_kg: 60 });
  });

  it('completeSet отправляет PATCH на завершение подхода', async () => {
    const payload = { id: 's1', workout_exercise_id: 'we1', set_number: 1, reps_count: 10, weight_kg: '60', is_completed: true, completed_at: '2026-04-21T12:00:00', created_at: '' };
    patch.mockResolvedValueOnce({ data: payload });

    await expect(completeSet('w1', 'we1', 's1')).resolves.toEqual(payload);
    expect(patch).toHaveBeenCalledWith('/workouts/w1/exercises/we1/sets/s1/complete');
  });
});
