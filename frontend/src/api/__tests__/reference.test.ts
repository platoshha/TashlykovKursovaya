import { describe, expect, it, vi } from 'vitest';

const get = vi.fn();

vi.mock('../axios', () => ({
  default: { get },
}));

import { getGoalTypes } from '../reference';

describe('reference api', () => {
  it('getGoalTypes запрашивает справочник типов целей', async () => {
    const payload = [{ id: 1, code: 'weight', name: 'Вес' }];
    get.mockResolvedValueOnce({ data: payload });

    await expect(getGoalTypes()).resolves.toEqual(payload);
    expect(get).toHaveBeenCalledWith('/reference/goal-types');
  });
});
