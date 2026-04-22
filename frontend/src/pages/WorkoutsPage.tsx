import DeleteIcon from '@mui/icons-material/Delete';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  Pagination,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteWorkout, getWorkouts } from '../api/workouts';
import AppLayout from '../components/AppLayout';
import type { WorkoutResponse } from '../types';

const PAGE_SIZE = 10;

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

const WorkoutsPage: React.FC = () => {
  const navigate = useNavigate();

  const [workouts, setWorkouts] = useState<WorkoutResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Delete dialog state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async (p: number, from: string, to: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: { page: number; size: number; date_from?: string; date_to?: string } = {
        page: p,
        size: PAGE_SIZE,
      };
      if (from) params.date_from = from;
      if (to) params.date_to = to;

      const res = await getWorkouts(params);
      setWorkouts(res.items);
      setTotal(res.total);
    } catch {
      setError('Не удалось загрузить тренировки. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, dateFrom, dateTo);
  }, [load, page, dateFrom, dateTo]);

  const handleFilterApply = () => {
    setPage(1);
    void load(1, dateFrom, dateTo);
  };

  const handleFilterReset = () => {
    setDateFrom('');
    setDateTo('');
    setPage(1);
    void load(1, '', '');
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const openDeleteDialog = (e: React.MouseEvent, id: string) => {
    // Prevent the card click-through navigating to detail
    e.stopPropagation();
    setDeletingId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await deleteWorkout(deletingId);
      setDeletingId(null);
      // Reload current page; if last item on page > 1, go back one page
      const newPage = workouts.length === 1 && page > 1 ? page - 1 : page;
      setPage(newPage);
      void load(newPage, dateFrom, dateTo);
    } catch {
      setError('Не удалось удалить тренировку. Попробуйте позже.');
      setDeletingId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Мои тренировки
        </Typography>
        <Button
          variant="contained"
          startIcon={<FitnessCenterIcon />}
          onClick={() => navigate('/workouts/new')}
        >
          + Добавить тренировку
        </Button>
      </Stack>

      {/* Date filters */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, alignItems: 'flex-end' }}
      >
        <TextField
          label="С даты"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="По дату"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button variant="outlined" onClick={handleFilterApply}>
          Применить
        </Button>
        {(dateFrom || dateTo) && (
          <Button variant="text" onClick={handleFilterReset}>
            Сбросить
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Content area */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : workouts.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8, py: 6 }}>
          <FitnessCenterIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Тренировок пока нет
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Добавьте первую тренировку чтобы начать отслеживать прогресс
          </Typography>
          <Button variant="contained" onClick={() => navigate('/workouts/new')}>
            Добавить первую тренировку
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {workouts.map((workout) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={workout.id}>
                <Card
                  elevation={2}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: 6 },
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(`/workouts/${workout.id}`)}
                    sx={{ flexGrow: 1 }}
                  >
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(workout.workout_date)}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {workout.workout_type_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Длительность: {workout.duration_minutes} мин
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Упражнений: {workout.exercises.length}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                  <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                    <Tooltip title="Удалить тренировку">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => openDeleteDialog(e, workout.id)}
                        aria-label="Удалить тренировку"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deletingId !== null}
        onClose={() => !deleteLoading && setDeletingId(null)}
        aria-labelledby="delete-workout-dialog-title"
      >
        <DialogTitle id="delete-workout-dialog-title">Удалить тренировку?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Это действие необратимо. Тренировка и все её упражнения будут удалены.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingId(null)} disabled={deleteLoading}>
            Отмена
          </Button>
          <Button
            onClick={() => void handleDeleteConfirm()}
            color="error"
            variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {deleteLoading ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default WorkoutsPage;
