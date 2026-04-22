import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getExerciseCategories, getWorkoutTypes } from '../api/reference';
import {
  createWorkout,
  getWorkout,
  removeWorkoutExercise,
  updateWorkout,
} from '../api/workouts';
import AppLayout from '../components/AppLayout';
import type { WorkoutExerciseResponse, WorkoutType } from '../types';

interface FormState {
  workout_type_id: number | '';
  workout_date: string;
  duration_minutes: string;
}

const today = (): string => new Date().toISOString().slice(0, 10);

const WorkoutFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [workoutTypes, setWorkoutTypes] = useState<WorkoutType[]>([]);
  const [exercises, setExercises] = useState<WorkoutExerciseResponse[]>([]);

  const [form, setForm] = useState<FormState>({
    workout_type_id: '',
    workout_date: today(),
    duration_minutes: '',
  });

  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track which exercise is being deleted to show per-row loading
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoadingPage(true);
      setError(null);
      try {
        // getExerciseCategories is loaded to satisfy the reference API completeness;
        // categories are not displayed on this form but used on ExerciseSelectPage
        const [types] = await Promise.all([
          getWorkoutTypes(),
          getExerciseCategories(),
        ]);
        setWorkoutTypes(types);

        if (isEdit && id) {
          const workout = await getWorkout(id);
          setForm({
            workout_type_id: workout.workout_type_id,
            workout_date: workout.workout_date,
            duration_minutes: String(workout.duration_minutes),
          });
          setExercises(workout.exercises);
        }
      } catch {
        setError('Не удалось загрузить данные. Попробуйте позже.');
      } finally {
        setLoadingPage(false);
      }
    };
    void init();
  }, [id, isEdit]);

  const handleChange = (field: keyof FormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): string | null => {
    if (form.workout_type_id === '') return 'Выберите тип тренировки.';
    if (!form.workout_date) return 'Укажите дату тренировки.';
    const dur = parseInt(form.duration_minutes, 10);
    if (!form.duration_minutes || isNaN(dur) || dur <= 0)
      return 'Укажите длительность в минутах (положительное число).';
    return null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);

    const payload = {
      workout_type_id: form.workout_type_id as number,
      workout_date: form.workout_date,
      duration_minutes: parseInt(form.duration_minutes, 10),
    };

    try {
      if (isEdit && id) {
        await updateWorkout(id, payload);
        navigate(`/workouts/${id}`);
      } else {
        const created = await createWorkout(payload);
        navigate(`/workouts/${created.id}`);
      }
    } catch {
      setError('Не удалось сохранить тренировку. Попробуйте позже.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveExercise = async (weId: string) => {
    if (!id) return;
    setDeletingExerciseId(weId);
    try {
      await removeWorkoutExercise(id, weId);
      setExercises((prev) => prev.filter((ex) => ex.id !== weId));
    } catch {
      setError('Не удалось удалить упражнение. Попробуйте позже.');
    } finally {
      setDeletingExerciseId(null);
    }
  };

  // Determine the "Back" destination based on create vs. edit mode
  const handleBack = () => {
    if (isEdit && id) {
      navigate(`/workouts/${id}`);
    } else {
      navigate('/workouts');
    }
  };

  if (loadingPage) {
    return (
      <AppLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Back button */}
      <Button
        startIcon={<ArrowBackIcon />}
        variant="text"
        onClick={handleBack}
        sx={{ mb: 2 }}
      >
        Назад
      </Button>

      <Typography variant="h5" sx={{ fontWeight: 600 }} gutterBottom>
        {isEdit ? 'Редактировать тренировку' : 'Новая тренировка'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Constrain form width on wide screens */}
      <Box sx={{ maxWidth: 560 }}>
        <Box component="form" onSubmit={(e) => void handleSave(e)} noValidate>
          {/* Workout type */}
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="workout-type-label">Тип тренировки</InputLabel>
            <Select
              labelId="workout-type-label"
              label="Тип тренировки"
              value={form.workout_type_id}
              onChange={(e) => handleChange('workout_type_id', e.target.value as number)}
            >
              {workoutTypes.map((wt) => (
                <MenuItem key={wt.id} value={wt.id}>
                  {wt.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date */}
          <TextField
            label="Дата тренировки"
            type="date"
            value={form.workout_date}
            onChange={(e) => handleChange('workout_date', e.target.value)}
            required
            fullWidth
            margin="normal"
            slotProps={{ htmlInput: { max: new Date().toISOString().slice(0, 10) } }}
          />

          {/* Duration */}
          <TextField
            label="Длительность (мин)"
            value={form.duration_minutes}
            onChange={(e) => handleChange('duration_minutes', e.target.value)}
            type="number"
            required
            fullWidth
            margin="normal"
            slotProps={{ htmlInput: { min: 1, max: 600 } }}
          />

          {/* Exercises list — only shown when editing an existing workout */}
          {isEdit && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
                Упражнения
              </Typography>

              {exercises.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Упражнения ещё не добавлены.
                </Typography>
              ) : (
                <List disablePadding sx={{ mb: 2 }}>
                  {exercises
                    .slice()
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((ex) => (
                      <ListItem
                        key={ex.id}
                        disableGutters
                        secondaryAction={
                          <Tooltip title="Удалить упражнение">
                            <span>
                              <IconButton
                                edge="end"
                                size="small"
                                color="error"
                                onClick={() => void handleRemoveExercise(ex.id)}
                                disabled={deletingExerciseId === ex.id}
                                aria-label={`Удалить ${ex.exercise_name}`}
                              >
                                {deletingExerciseId === ex.id ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <DeleteIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        }
                        sx={{
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          py: 1,
                        }}
                      >
                        <ListItemText
                          primary={ex.exercise_name}
                          secondary={`${ex.sets_count} × ${ex.reps_count} повт × ${ex.weight_kg} кг`}
                        />
                      </ListItem>
                    ))}
                </List>
              )}

              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate(`/exercises/select?workoutId=${id}`)}
                sx={{ mb: 2 }}
              >
                + Добавить упражнение
              </Button>
            </>
          )}

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleBack}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </AppLayout>
  );
};

export default WorkoutFormPage;
