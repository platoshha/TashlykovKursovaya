import type {
  GoalCreate,
  GoalListResponse,
  GoalResponse,
} from '../types';
import apiClient from './axios';

export const getGoals = (): Promise<GoalListResponse> =>
  apiClient.get<GoalListResponse>('/goals').then((r) => r.data);

export const createGoal = (data: GoalCreate): Promise<GoalResponse> =>
  apiClient.post<GoalResponse>('/goals', data).then((r) => r.data);

export const achieveGoal = (id: string): Promise<GoalResponse> =>
  apiClient.patch<GoalResponse>(`/goals/${id}/achieve`).then((r) => r.data);

export const deleteGoal = (id: string): Promise<void> =>
  apiClient.delete(`/goals/${id}`).then(() => undefined);
