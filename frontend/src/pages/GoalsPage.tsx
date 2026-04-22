import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { achieveGoal, createGoal, deleteGoal, getGoals } from '../api/goals';
import { getGoalTypes } from '../api/reference';
import type { GoalCreate, GoalResponse, GoalType } from '../types';

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  const [year, month, day] = iso.split('-');
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

const emptyForm: GoalCreate = {
  goal_type_id: 0,
  target_value: undefined,
  target_date: undefined,
  notes: undefined,
};

const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [goalTypes, setGoalTypes] = useState<GoalType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<GoalCreate>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Per-goal action state
  const [achievingId, setAchievingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadGoals = async () => {
    try {
      const res = await getGoals();
      setGoals(res.items);
    } catch {
      setError('Не удалось загрузить цели. Попробуйте позже.');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        const [goalsRes, typesRes] = await Promise.all([getGoals(), getGoalTypes()]);
        setGoals(goalsRes.items);
        setGoalTypes(typesRes);
      } catch {
        setError('Не удалось загрузить данные. Попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  const openDialog = () => {
    setForm({ ...emptyForm, goal_type_id: goalTypes[0]?.id ?? 0 });
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSelectChange = (e: SelectChangeEvent<number>) => {
    setForm((prev) => ({ ...prev, goal_type_id: Number(e.target.value) }));
  };

  const handleTextChange =
    (field: keyof GoalCreate) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (field === 'target_value') {
        setForm((prev) => ({ ...prev, [field]: raw === '' ? undefined : Number(raw) }));
      } else {
        setForm((prev) => ({ ...prev, [field]: raw === '' ? undefined : raw }));
      }
    };

  const handleSubmit = async () => {
    if (!form.goal_type_id) {
      setFormError('Выберите тип цели.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await createGoal(form);
      setDialogOpen(false);
      void loadGoals();
    } catch {
      setFormError('Не удалось создать цель. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAchieve = async (id: string) => {
    setAchievingId(id);
    try {
      const updated = await achieveGoal(id);
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    } catch {
      setError('Не удалось отметить цель как выполненную.');
    } finally {
      setAchievingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch {
      setError('Не удалось удалить цель.');
    } finally {
      setDeletingId(null);
    }
  };

  const activeGoals = goals.filter((g) => !g.is_achieved);
  const achievedGoals = goals.filter((g) => g.is_achieved);

  const GoalCard = ({ goal }: { goal: GoalResponse }) => (
    <Card
      elevation={2}
      sx={{
        borderRadius: 2,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 6 },
        opacity: goal.is_achieved ? 0.75 : 1,
      }}
    >
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              {goal.is_achieved ? (
                <CheckCircleIcon color="success" fontSize="small" />
              ) : (
                <RadioButtonUncheckedIcon color="action" fontSize="small" />
              )}
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {goal.goal_type_name}
              </Typography>
              {goal.is_achieved && (
                <Chip label="Выполнена" size="small" color="success" variant="outlined" />
              )}
            </Stack>

            {goal.target_value != null && (
              <Typography variant="body2" color="text.secondary">
                Целевое значение: {goal.target_value}
              </Typography>
            )}
            {goal.target_date && (
              <Typography variant="body2" color="text.secondary">
                Срок: {formatDate(goal.target_date)}
              </Typography>
            )}
            {goal.notes && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {goal.notes}
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={0.5} sx={{ ml: 1 }}>
            <Tooltip title={goal.is_achieved ? 'Уже выполнена' : 'Отметить как выполненную'}>
              <span>
                <IconButton
                  size="small"
                  color="success"
                  disabled={goal.is_achieved || achievingId === goal.id}
                  onClick={() => void handleAchieve(goal.id)}
                  aria-label="Отметить как выполненную"
                >
                  {achievingId === goal.id ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <CheckCircleIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Удалить цель">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={deletingId === goal.id}
                  onClick={() => void handleDelete(goal.id)}
                  aria-label="Удалить цель"
                >
                  {deletingId === goal.id ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <DeleteIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Active goals */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Активные цели{activeGoals.length > 0 ? ` (${activeGoals.length})` : ''}
          </Typography>

          {activeGoals.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, mb: 4 }}>
              <Typography color="text.secondary">
                Нет активных целей. Нажмите + чтобы добавить первую.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {activeGoals.map((goal) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={goal.id}>
                  <GoalCard goal={goal} />
                </Grid>
              ))}
            </Grid>
          )}

          {/* Achieved goals */}
          {achievedGoals.length > 0 && (
            <>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Выполненные цели ({achievedGoals.length})
              </Typography>
              <Grid container spacing={2}>
                {achievedGoals.map((goal) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={goal.id}>
                    <GoalCard goal={goal} />
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </>
      )}

      {/* FAB */}
      <Fab
        color="primary"
        aria-label="Добавить цель"
        onClick={openDialog}
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
      >
        <AddIcon />
      </Fab>

      {/* Add goal dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="add-goal-dialog-title"
      >
        <DialogTitle id="add-goal-dialog-title">Добавить цель</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {formError && (
              <Alert severity="error" onClose={() => setFormError(null)}>
                {formError}
              </Alert>
            )}

            <FormControl fullWidth required>
              <InputLabel id="goal-type-label">Тип цели</InputLabel>
              <Select<number>
                labelId="goal-type-label"
                value={form.goal_type_id}
                label="Тип цели"
                onChange={handleSelectChange}
              >
                {goalTypes.map((gt) => (
                  <MenuItem key={gt.id} value={gt.id}>
                    {gt.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Целевое значение (необязательно)"
              type="number"
              value={form.target_value ?? ''}
              onChange={handleTextChange('target_value')}
              slotProps={{ htmlInput: { step: 0.1 } }}
              fullWidth
            />

            <TextField
              label="Срок выполнения (необязательно)"
              type="date"
              value={form.target_date ?? ''}
              onChange={handleTextChange('target_date')}
              fullWidth
            />

            <TextField
              label="Заметки (необязательно)"
              value={form.notes ?? ''}
              onChange={handleTextChange('notes')}
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {submitting ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default GoalsPage;
