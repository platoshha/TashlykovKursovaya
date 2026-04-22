import type { DashboardStats } from '../types';
import apiClient from './axios';

export const getDashboard = (): Promise<DashboardStats> =>
  apiClient.get<DashboardStats>('/statistics/dashboard').then((r) => r.data);
