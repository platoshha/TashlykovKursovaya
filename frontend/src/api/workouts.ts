import type {
  WorkoutExerciseResponse,
  WorkoutListResponse,
  WorkoutResponse,
  WorkoutSetCreate,
  WorkoutSetResponse,
  WorkoutSetUpdate,
} from '../types';
import apiClient from './axios';

export interface GetWorkoutsParams {
  date_from?: string;
  date_to?: string;
  page?: number;
  size?: number;
}

export const getWorkouts = (
  params?: GetWorkoutsParams,
): Promise<WorkoutListResponse> =>
  apiClient
    .get<WorkoutListResponse>('/workouts', { params })
    .then((r) => r.data);

export const getWorkout = (id: string): Promise<WorkoutResponse> =>
  apiClient.get<WorkoutResponse>(`/workouts/${id}`).then((r) => r.data);

export interface CreateWorkoutData {
  workout_type_id: number;
  workout_date: string;
  duration_minutes: number;
}

export const createWorkout = (
  data: CreateWorkoutData,
): Promise<WorkoutResponse> =>
  apiClient.post<WorkoutResponse>('/workouts', data).then((r) => r.data);

export const updateWorkout = (
  id: string,
  data: Partial<CreateWorkoutData>,
): Promise<WorkoutResponse> =>
  apiClient.put<WorkoutResponse>(`/workouts/${id}`, data).then((r) => r.data);

export const deleteWorkout = (id: string): Promise<void> =>
  apiClient.delete(`/workouts/${id}`).then(() => undefined);

export interface AddExerciseData {
  exercise_id: string;
  sets_count: number;
  reps_count: number;
  weight_kg: number;
  sort_order?: number;
}

export const addExerciseToWorkout = (
  workoutId: string,
  data: AddExerciseData,
): Promise<WorkoutExerciseResponse> =>
  apiClient
    .post<WorkoutExerciseResponse>(`/workouts/${workoutId}/exercises`, data)
    .then((r) => r.data);

export interface UpdateWorkoutExerciseData {
  sets_count?: number;
  reps_count?: number;
  weight_kg?: number;
  sort_order?: number;
}

export const updateWorkoutExercise = (
  workoutId: string,
  weId: string,
  data: UpdateWorkoutExerciseData,
): Promise<WorkoutExerciseResponse> =>
  apiClient
    .put<WorkoutExerciseResponse>(
      `/workouts/${workoutId}/exercises/${weId}`,
      data,
    )
    .then((r) => r.data);

export const removeWorkoutExercise = (
  workoutId: string,
  weId: string,
): Promise<void> =>
  apiClient
    .delete(`/workouts/${workoutId}/exercises/${weId}`)
    .then(() => undefined);

export const addSet = (
  workoutId: string,
  workoutExerciseId: string,
  data: WorkoutSetCreate,
): Promise<WorkoutSetResponse> =>
  apiClient
    .post<WorkoutSetResponse>(
      `/workouts/${workoutId}/exercises/${workoutExerciseId}/sets`,
      data,
    )
    .then((r) => r.data);

export const updateSet = (
  workoutId: string,
  workoutExerciseId: string,
  setId: string,
  data: WorkoutSetUpdate,
): Promise<WorkoutSetResponse> =>
  apiClient
    .put<WorkoutSetResponse>(
      `/workouts/${workoutId}/exercises/${workoutExerciseId}/sets/${setId}`,
      data,
    )
    .then((r) => r.data);

export const completeSet = (
  workoutId: string,
  workoutExerciseId: string,
  setId: string,
): Promise<WorkoutSetResponse> =>
  apiClient
    .patch<WorkoutSetResponse>(
      `/workouts/${workoutId}/exercises/${workoutExerciseId}/sets/${setId}/complete`,
    )
    .then((r) => r.data);

export const deleteSet = (
  workoutId: string,
  workoutExerciseId: string,
  setId: string,
): Promise<void> =>
  apiClient
    .delete(`/workouts/${workoutId}/exercises/${workoutExerciseId}/sets/${setId}`)
    .then(() => undefined);
