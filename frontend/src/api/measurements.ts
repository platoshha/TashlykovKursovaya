import type {
  MeasurementCreate,
  MeasurementListResponse,
  MeasurementResponse,
  MeasurementUpdate,
} from '../types';
import apiClient from './axios';

export const getMeasurements = (
  skip = 0,
  limit = 50,
  order: 'asc' | 'desc' = 'desc',
): Promise<MeasurementListResponse> =>
  apiClient
    .get<MeasurementListResponse>('/measurements', { params: { skip, limit, order } })
    .then((r) => r.data);

export const createMeasurement = (
  data: MeasurementCreate,
): Promise<MeasurementResponse> =>
  apiClient.post<MeasurementResponse>('/measurements', data).then((r) => r.data);

export const updateMeasurement = (
  id: string,
  data: MeasurementUpdate,
): Promise<MeasurementResponse> =>
  apiClient
    .put<MeasurementResponse>(`/measurements/${id}`, data)
    .then((r) => r.data);

export const deleteMeasurement = (id: string): Promise<void> =>
  apiClient.delete(`/measurements/${id}`).then(() => undefined);
