import type { ExerciseCategory, GoalType, WorkoutType } from '../types';
import apiClient from './axios';

export const getWorkoutTypes = (): Promise<WorkoutType[]> =>
  apiClient.get<WorkoutType[]>('/workout-types').then((r) => r.data);

export const getExerciseCategories = (): Promise<ExerciseCategory[]> =>
  apiClient.get<ExerciseCategory[]>('/exercise-categories').then((r) => r.data);

export const getGoalTypes = (): Promise<GoalType[]> =>
  apiClient.get<GoalType[]>('/reference/goal-types').then((r) => r.data);
