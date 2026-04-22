import { describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();

vi.mock('../axios', () => ({
  default: { get, post, put: vi.fn(), delete: vi.fn() },
}));

import { createMeasurement, getMeasurements } from '../measurements';

describe('measurements api', () => {
  it('getMeasurements отправляет параметры пагинации и сортировки', async () => {
    const payload = { items: [], total: 0 };
    get.mockResolvedValueOnce({ data: payload });

    await expect(getMeasurements(0, 20, 'asc')).resolves.toEqual(payload);
    expect(get).toHaveBeenCalledWith('/measurements', { params: { skip: 0, limit: 20, order: 'asc' } });
  });

  it('createMeasurement отправляет данные измерения', async () => {
    const payload = { id: 'm1', user_id: 'u1', measured_at: '2026-04-21', weight_kg: 80, body_fat_pct: 18, notes: null, created_at: '' };
    post.mockResolvedValueOnce({ data: payload });

    await expect(createMeasurement({ measured_at: '2026-04-21', weight_kg: 80 })).resolves.toEqual(payload);
    expect(post).toHaveBeenCalledWith('/measurements', { measured_at: '2026-04-21', weight_kg: 80 });
  });
});
