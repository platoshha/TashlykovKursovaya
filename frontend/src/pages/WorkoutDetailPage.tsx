import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  addSet,
  completeSet,
  deleteSet,
  deleteWorkout,
  getWorkout,
  removeWorkoutExercise,
  updateSet,
} from '../api/workouts';
import AppLayout from '../components/AppLayout';
import type {
  WorkoutResponse,
  WorkoutSetCreate,
  WorkoutSetResponse,
} from '../types';

// Format an ISO date string (YYYY-MM-DD) to a readable Russian locale date
const formatDate = (iso: string): string => {
  const [year, month, day] = iso.split('-');
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// ── Add-set dialog state ──────────────────────────────────────────────────────

interface AddSetDialogState {
  workoutExerciseId: string;
  exerciseName: string;
  defaultReps: number;
  defaultWeight: string;
  nextSetNumber: number;
}

// ── Edit-set dialog state ─────────────────────────────────────────────────────

interface EditSetDialogState {
  workoutExerciseId: string;
  set: WorkoutSetResponse;
  reps: string;
  weight: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

const WorkoutDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState<WorkoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete workout dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Delete exercise dialog
  const [deleteExerciseId, setDeleteExerciseId] = useState<string | null>(null);
  const [deleteExerciseLoading, setDeleteExerciseLoading] = useState(false);

  // Add-set dialog
  const [addSetDialog, setAddSetDialog] = useState<AddSetDialogState | null>(null);
  const [addSetReps, setAddSetReps] = useState('');
  const [addSetWeight, setAddSetWeight] = useState('');
  const [addSetLoading, setAddSetLoading] = useState(false);
  const [addSetError, setAddSetError] = useState<string | null>(null);

  // Edit-set dialog
  const [editSetDialog, setEditSetDialog] = useState<EditSetDialogState | null>(null);
  const [editSetLoading, setEditSetLoading] = useState(false);
  const [editSetError, setEditSetError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getWorkout(id);
        if (!cancelled) setWorkout(data);
      } catch {
        if (!cancelled)
          setError('Не удалось загрузить тренировку. Попробуйте позже.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // ── Local state updater for sets — avoids full workout reload ──────────────

  const updateExerciseSets = (
    workoutExerciseId: string,
    updater: (sets: WorkoutSetResponse[]) => WorkoutSetResponse[],
  ) => {
    setWorkout((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) =>
          ex.id === workoutExerciseId
            ? { ...ex, sets: updater(ex.sets) }
            : ex,
        ),
      };
    });
  };

  // ── Delete workout ─────────────────────────────────────────────────────────

  const handleDeleteWorkout = async () => {
    if (!id) return;
    setDeleteLoading(true);
    try {
      await deleteWorkout(id);
      navigate('/workouts');
    } catch {
      setError('Не удалось удалить тренировку. Попробуйте позже.');
      setDeleteDialogOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Delete exercise ────────────────────────────────────────────────────────

  const handleDeleteExercise = async () => {
    if (!id || !deleteExerciseId) return;
    setDeleteExerciseLoading(true);
    try {
      await removeWorkoutExercise(id, deleteExerciseId);
      setWorkout((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: prev.exercises.filter((ex) => ex.id !== deleteExerciseId),
        };
      });
      setDeleteExerciseId(null);
    } catch {
      setError('Не удалось удалить упражнение. Попробуйте позже.');
      setDeleteExerciseId(null);
    } finally {
      setDeleteExerciseLoading(false);
    }
  };

  // ── Complete set ───────────────────────────────────────────────────────────

  const handleCompleteSet = async (
    workoutExerciseId: string,
    setId: string,
  ) => {
    if (!id) return;
    try {
      const updated = await completeSet(id, workoutExerciseId, setId);
      updateExerciseSets(workoutExerciseId, (sets) =>
        sets.map((s) => (s.id === setId ? updated : s)),
      );
    } catch {
      setError('Не удалось отметить подход. Попробуйте позже.');
    }
  };

  // ── Delete set ─────────────────────────────────────────────────────────────

  const handleDeleteSet = async (
    workoutExerciseId: string,
    setId: string,
  ) => {
    if (!id) return;
    try {
      await deleteSet(id, workoutExerciseId, setId);
      updateExerciseSets(workoutExerciseId, (sets) =>
        sets.filter((s) => s.id !== setId),
      );
    } catch {
      setError('Не удалось удалить подход. Попробуйте позже.');
    }
  };

  // ── Open add-set dialog ────────────────────────────────────────────────────

  const openAddSetDialog = (
    workoutExerciseId: string,
    exerciseName: string,
    sets: WorkoutSetResponse[],
  ) => {
    const sorted = sets.slice().sort((a, b) => a.set_number - b.set_number);
    const last = sorted[sorted.length - 1];
    const nextSetNumber = last ? last.set_number + 1 : 1;
    const defaultReps = last ? last.reps_count : 8;
    const defaultWeight = last ? last.weight_kg : '0';

    setAddSetDialog({
      workoutExerciseId,
      exerciseName,
      defaultReps,
      defaultWeight,
      nextSetNumber,
    });
    setAddSetReps(String(defaultReps));
    setAddSetWeight(String(defaultWeight));
    setAddSetError(null);
  };

  const handleAddSetConfirm = async () => {
    if (!id || !addSetDialog) return;

    const reps = parseInt(addSetReps, 10);
    const weight = parseFloat(addSetWeight);

    if (isNaN(reps) || reps <= 0) {
      setAddSetError('Укажите корректное количество повторений.');
      return;
    }
    if (isNaN(weight) || weight < 0) {
      setAddSetError('Укажите корректный вес (0 или больше).');
      return;
    }

    setAddSetLoading(true);
    setAddSetError(null);

    const payload: WorkoutSetCreate = {
      set_number: addSetDialog.nextSetNumber,
      reps_count: reps,
      weight_kg: weight,
    };

    try {
      const newSet = await addSet(id, addSetDialog.workoutExerciseId, payload);
      updateExerciseSets(addSetDialog.workoutExerciseId, (sets) => [
        ...sets,
        newSet,
      ]);
      setAddSetDialog(null);
    } catch {
      setAddSetError('Не удалось добавить подход. Попробуйте позже.');
    } finally {
      setAddSetLoading(false);
    }
  };

  // ── Open edit-set dialog ───────────────────────────────────────────────────

  const openEditSetDialog = (
    workoutExerciseId: string,
    set: WorkoutSetResponse,
  ) => {
    setEditSetDialog({
      workoutExerciseId,
      set,
      reps: String(set.reps_count),
      weight: set.weight_kg,
    });
    setEditSetError(null);
  };

  const handleEditSetConfirm = async () => {
    if (!id || !editSetDialog) return;

    const reps = parseInt(editSetDialog.reps, 10);
    const weight = parseFloat(editSetDialog.weight);

    if (isNaN(reps) || reps <= 0) {
      setEditSetError('Укажите корректное количество повторений.');
      return;
    }
    if (isNaN(weight) || weight < 0) {
      setEditSetError('Укажите корректный вес (0 или больше).');
      return;
    }

    setEditSetLoading(true);
    setEditSetError(null);

    try {
      const updated = await updateSet(
        id,
        editSetDialog.workoutExerciseId,
        editSetDialog.set.id,
        { reps_count: reps, weight_kg: weight },
      );
      updateExerciseSets(editSetDialog.workoutExerciseId, (sets) =>
        sets.map((s) => (s.id === editSetDialog.set.id ? updated : s)),
      );
      setEditSetDialog(null);
    } catch {
      setEditSetError('Не удалось обновить подход. Попробуйте позже.');
    } finally {
      setEditSetLoading(false);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  if (!workout) {
    return (
      <AppLayout>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="text"
          onClick={() => navigate('/workouts')}
          sx={{ mb: 2 }}
        >
          Назад
        </Button>
        <Alert severity="error">{error ?? 'Тренировка не найдена.'}</Alert>
      </AppLayout>
    );
  }

  const sortedExercises = workout.exercises
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <AppLayout>
      {/* Back button */}
      <Button
        startIcon={<ArrowBackIcon />}
        variant="text"
        onClick={() => navigate('/workouts')}
        sx={{ mb: 2 }}
      >
        Назад
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {workout.workout_type_name}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          {formatDate(workout.workout_date)} · {workout.duration_minutes} мин
        </Typography>
      </Box>

      {/* Action buttons */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/workouts/${id}/edit`)}
        >
          Изменить
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => setDeleteDialogOpen(true)}
        >
          Удалить
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate(`/exercises/select?workoutId=${id}`)}
        >
          + Добавить упражнение
        </Button>
      </Stack>

      {/* Exercises section */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Упражнения
      </Typography>

      {sortedExercises.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Упражнений ещё нет. Добавьте первое!
        </Typography>
      ) : (
        <Stack spacing={3}>
          {sortedExercises.map((ex) => {
            const sortedSets = ex.sets
              .slice()
              .sort((a, b) => a.set_number - b.set_number);

            return (
              <Paper key={ex.id} elevation={2} sx={{ p: 2 }}>
                {/* Exercise header */}
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1.5,
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {ex.exercise_name}
                    </Typography>
                    <Chip
                      label={`${ex.sets_count} подх.`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </Stack>
                  <Tooltip title="Удалить упражнение">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteExerciseId(ex.id)}
                      aria-label={`Удалить упражнение ${ex.exercise_name}`}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>

                <Divider sx={{ mb: 1.5 }} />

                {/* Sets table */}
                {sortedSets.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.5 }}
                  >
                    Подходов ещё нет. Добавьте первый!
                  </Typography>
                ) : (
                  <TableContainer sx={{ mb: 1.5 }}>
                    <Table size="small" aria-label={`Подходы — ${ex.exercise_name}`}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Подход</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>
                            Повт.
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>
                            Вес (кг)
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>
                            Статус
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            Действия
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedSets.map((set) => (
                          <TableRow
                            key={set.id}
                            sx={{
                              '&:last-child td, &:last-child th': { border: 0 },
                              // Visually highlight completed rows
                              bgcolor: set.is_completed
                                ? 'action.hover'
                                : 'transparent',
                            }}
                          >
                            <TableCell component="th" scope="row">
                              {set.set_number}
                            </TableCell>
                            <TableCell align="center">
                              {set.reps_count}
                            </TableCell>
                            <TableCell align="center">
                              {parseFloat(set.weight_kg).toFixed(1)}
                            </TableCell>
                            <TableCell align="center">
                              {set.is_completed ? (
                                <Tooltip title="Выполнен">
                                  <CheckCircleIcon
                                    color="success"
                                    fontSize="small"
                                    aria-label="Выполнен"
                                  />
                                </Tooltip>
                              ) : (
                                <Tooltip title="Отметить выполненным">
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        void handleCompleteSet(ex.id, set.id)
                                      }
                                      aria-label="Отметить выполненным"
                                    >
                                      <RadioButtonUncheckedIcon
                                        color="action"
                                        fontSize="small"
                                      />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Stack
                                direction="row"
                                spacing={0.5}
                                justifyContent="flex-end"
                              >
                                <Tooltip title="Редактировать">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      openEditSetDialog(ex.id, set)
                                    }
                                    aria-label={`Редактировать подход ${set.set_number}`}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Удалить подход">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      void handleDeleteSet(ex.id, set.id)
                                    }
                                    aria-label={`Удалить подход ${set.set_number}`}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* Add set button */}
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() =>
                    openAddSetDialog(ex.id, ex.exercise_name, ex.sets)
                  }
                >
                  Добавить подход
                </Button>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* ── Delete workout confirmation dialog ─────────────────────────────── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteLoading && setDeleteDialogOpen(false)}
        aria-labelledby="delete-workout-dialog-title"
      >
        <DialogTitle id="delete-workout-dialog-title">
          Удалить тренировку?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Это действие необратимо. Тренировка «{workout.workout_type_name}» от{' '}
            {formatDate(workout.workout_date)} и все её упражнения будут удалены.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteLoading}
          >
            Отмена
          </Button>
          <Button
            onClick={() => void handleDeleteWorkout()}
            color="error"
            variant="contained"
            disabled={deleteLoading}
            startIcon={
              deleteLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            {deleteLoading ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete exercise confirmation dialog ────────────────────────────── */}
      <Dialog
        open={deleteExerciseId !== null}
        onClose={() => !deleteExerciseLoading && setDeleteExerciseId(null)}
        aria-labelledby="delete-exercise-dialog-title"
      >
        <DialogTitle id="delete-exercise-dialog-title">
          Удалить упражнение?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Упражнение и все его подходы будут удалены из тренировки.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteExerciseId(null)}
            disabled={deleteExerciseLoading}
          >
            Отмена
          </Button>
          <Button
            onClick={() => void handleDeleteExercise()}
            color="error"
            variant="contained"
            disabled={deleteExerciseLoading}
            startIcon={
              deleteExerciseLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            {deleteExerciseLoading ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add set dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={addSetDialog !== null}
        onClose={() => !addSetLoading && setAddSetDialog(null)}
        aria-labelledby="add-set-dialog-title"
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle id="add-set-dialog-title">
          Добавить подход — {addSetDialog?.exerciseName}
        </DialogTitle>
        <DialogContent>
          {addSetError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {addSetError}
            </Alert>
          )}
          <TextField
            label="Повторения"
            type="number"
            value={addSetReps}
            onChange={(e) => setAddSetReps(e.target.value)}
            fullWidth
            margin="normal"
            required
            slotProps={{ htmlInput: { min: 1 } }}
            autoFocus
          />
          <TextField
            label="Вес (кг)"
            type="number"
            value={addSetWeight}
            onChange={(e) => setAddSetWeight(e.target.value)}
            fullWidth
            margin="normal"
            required
            slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAddSetDialog(null)}
            disabled={addSetLoading}
          >
            Отмена
          </Button>
          <Button
            onClick={() => void handleAddSetConfirm()}
            variant="contained"
            disabled={addSetLoading}
            startIcon={
              addSetLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            {addSetLoading ? 'Добавление...' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit set dialog ────────────────────────────────────────────────── */}
      <Dialog
        open={editSetDialog !== null}
        onClose={() => !editSetLoading && setEditSetDialog(null)}
        aria-labelledby="edit-set-dialog-title"
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle id="edit-set-dialog-title">
          Подход {editSetDialog?.set.set_number}
        </DialogTitle>
        <DialogContent>
          {editSetError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editSetError}
            </Alert>
          )}
          <TextField
            label="Повторения"
            type="number"
            value={editSetDialog?.reps ?? ''}
            onChange={(e) =>
              setEditSetDialog((prev) =>
                prev ? { ...prev, reps: e.target.value } : prev,
              )
            }
            fullWidth
            margin="normal"
            required
            slotProps={{ htmlInput: { min: 1 } }}
            autoFocus
          />
          <TextField
            label="Вес (кг)"
            type="number"
            value={editSetDialog?.weight ?? ''}
            onChange={(e) =>
              setEditSetDialog((prev) =>
                prev ? { ...prev, weight: e.target.value } : prev,
              )
            }
            fullWidth
            margin="normal"
            required
            slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditSetDialog(null)}
            disabled={editSetLoading}
          >
            Отмена
          </Button>
          <Button
            onClick={() => void handleEditSetConfirm()}
            variant="contained"
            disabled={editSetLoading}
            startIcon={
              editSetLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            {editSetLoading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default WorkoutDetailPage;
