import type { ExerciseListResponse, ExerciseResponse } from '../types';
import apiClient from './axios';

export interface GetExercisesParams {
  search?: string;
  category_id?: number;
  page?: number;
  size?: number;
}

export const getExercises = (
  params?: GetExercisesParams,
): Promise<ExerciseListResponse> =>
  apiClient
    .get<ExerciseListResponse>('/exercises', { params })
    .then((r) => r.data);

export interface CreateExerciseData {
  name: string;
  category_id?: number;
  description?: string;
}

export const createExercise = (
  data: CreateExerciseData,
): Promise<ExerciseResponse> =>
  apiClient.post<ExerciseResponse>('/exercises', data).then((r) => r.data);
