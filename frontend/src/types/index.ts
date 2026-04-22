// Core domain types shared across the application

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// ── Profile ──────────────────────────────────────────────────────────────────

export interface Profile {
  user_id: string;
  name: string;
  age: number | null;
  height_cm: number | null;
  current_weight_kg: string | null;
  training_level: 'beginner' | 'intermediate' | 'advanced';
}

export interface ProfileUpdate {
  name?: string;
  age?: number | null;
  height_cm?: number | null;
  current_weight_kg?: number | null;
  training_level?: 'beginner' | 'intermediate' | 'advanced';
}

// ── Reference data ────────────────────────────────────────────────────────────

export interface WorkoutType {
  id: number;
  code: string;
  name: string;
}

export interface ExerciseCategory {
  id: number;
  code: string;
  name: string;
}

// ── Exercises ─────────────────────────────────────────────────────────────────

export interface ExerciseResponse {
  id: string;
  name: string;
  description: string | null;
  category_id: number | null;
  category_name: string | null;
  is_system: boolean;
  created_by_user_id: string | null;
}

export interface ExerciseListResponse {
  items: ExerciseResponse[];
  total: number;
}

// ── Workouts ──────────────────────────────────────────────────────────────────

export interface WorkoutSetResponse {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  reps_count: number;
  weight_kg: string; // Decimal сериализуется как string
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface WorkoutSetCreate {
  set_number: number;
  reps_count: number;
  weight_kg: number;
}

export interface WorkoutSetUpdate {
  reps_count?: number;
  weight_kg?: number;
  is_completed?: boolean;
}

export interface WorkoutExerciseResponse {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_name: string;
  sort_order: number;
  sets_count: number;
  reps_count: number;
  weight_kg: string;
  sets: WorkoutSetResponse[];
}

export interface WorkoutResponse {
  id: string;
  user_id: string;
  workout_type_id: number;
  workout_type_name: string;
  workout_date: string;
  duration_minutes: number;
  exercises: WorkoutExerciseResponse[];
  created_at: string;
  updated_at: string;
}

export interface WorkoutListResponse {
  items: WorkoutResponse[];
  total: number;
  page: number;
  size: number;
}

// ── Measurements ──────────────────────────────────────────────────────────────

export interface MeasurementCreate {
  measured_at: string; // "YYYY-MM-DD"
  weight_kg?: number | null;
  body_fat_pct?: number | null;
  notes?: string | null;
}

export interface MeasurementUpdate {
  measured_at?: string;
  weight_kg?: number | null;
  body_fat_pct?: number | null;
  notes?: string | null;
}

export interface MeasurementResponse {
  id: string;
  user_id: string;
  measured_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  notes: string | null;
  created_at: string;
}

export interface MeasurementListResponse {
  items: MeasurementResponse[];
  total: number;
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export interface GoalCreate {
  goal_type_id: number;
  target_value?: number | null;
  target_date?: string | null; // "YYYY-MM-DD"
  notes?: string | null;
}

export interface GoalUpdate {
  goal_type_id?: number;
  target_value?: number | null;
  target_date?: string | null;
  notes?: string | null;
}

export interface GoalResponse {
  id: string;
  user_id: string;
  goal_type_id: number;
  goal_type_name: string;
  goal_type_code: string;
  target_value: number | null;
  target_date: string | null;
  is_achieved: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalListResponse {
  items: GoalResponse[];
  total: number;
}

export interface GoalType {
  id: number;
  code: string;
  name: string;
}

// ── Statistics ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_workouts: number;
  workouts_this_month: number;
  total_volume_kg: number;
  latest_weight_kg: number | null;
  active_goals_count: number;
  achieved_goals_count: number;
  workouts_per_month: { month: string; count: number }[];
  weight_history: { date: string; weight_kg: number }[];
  latest_workout: {
    id: string;
    workout_type_name: string;
    workout_date: string;
    duration_minutes: number;
    exercises_count: number;
  } | null;
}
