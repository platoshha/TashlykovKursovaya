import { describe, expect, it, vi } from 'vitest';

const get = vi.fn();

vi.mock('../axios', () => ({
  default: { get },
}));

import { getDashboard } from '../statistics';

describe('statistics api', () => {
  it('getDashboard получает сводную статистику', async () => {
    const payload = { total_workouts: 5, workouts_this_month: 2, total_volume_kg: 1000, latest_weight_kg: 80, active_goals_count: 1, achieved_goals_count: 0, workouts_per_month: [], weight_history: [], latest_workout: null };
    get.mockResolvedValueOnce({ data: payload });

    await expect(getDashboard()).resolves.toEqual(payload);
    expect(get).toHaveBeenCalledWith('/statistics/dashboard');
  });
});
