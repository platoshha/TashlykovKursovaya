import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getExercises } from '../api/exercises';
import { getExerciseCategories } from '../api/reference';
import { addExerciseToWorkout } from '../api/workouts';
import AppLayout from '../components/AppLayout';
import type { ExerciseCategory, ExerciseResponse } from '../types';

interface AddFormState {
  sets_count: string;
  reps_count: string;
  weight_kg: string;
}

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

const ExerciseSelectPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const workoutId = searchParams.get('workoutId') ?? '';
  const navigate = useNavigate();

  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [exercises, setExercises] = useState<ExerciseResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search / filter state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Dialog state for adding exercise to workout
  const [selectedExercise, setSelectedExercise] = useState<ExerciseResponse | null>(null);
  const [addForm, setAddForm] = useState<AddFormState>({
    sets_count: '',
    reps_count: '',
    weight_kg: '',
  });
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  // Debounce search input with setTimeout/clearTimeout as per spec
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, DEBOUNCE_MS);
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Load categories once
  useEffect(() => {
    const loadCats = async () => {
      setCatLoading(true);
      try {
        const cats = await getExerciseCategories();
        setCategories(cats);
      } catch {
        setError('Не удалось загрузить категории.');
      } finally {
        setCatLoading(false);
      }
    };
    void loadCats();
  }, []);

  // Reload exercises when search or category filter changes
  const loadExercises = useCallback(
    async (search: string, categoryId: number | null) => {
      setLoading(true);
      setError(null);
      try {
        const params: {
          search?: string;
          category_id?: number;
          page: number;
          size: number;
        } = { page: 1, size: PAGE_SIZE };
        if (search.trim()) params.search = search.trim();
        if (categoryId !== null) params.category_id = categoryId;

        const res = await getExercises(params);
        setExercises(res.items);
        setTotal(res.total);
      } catch {
        setError('Не удалось загрузить упражнения. Попробуйте позже.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadExercises(debouncedSearch, selectedCategoryId);
  }, [loadExercises, debouncedSearch, selectedCategoryId]);

  const handleCategoryToggle = (catId: number) => {
    setSelectedCategoryId((prev) => (prev === catId ? null : catId));
  };

  const openAddDialog = (exercise: ExerciseResponse) => {
    setSelectedExercise(exercise);
    setAddForm({ sets_count: '', reps_count: '', weight_kg: '' });
    setAddError(null);
  };

  const closeAddDialog = () => {
    if (addLoading) return;
    setSelectedExercise(null);
    setAddError(null);
  };

  const handleAddFormChange = (field: keyof AddFormState, value: string) => {
    setAddForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateAddForm = (): string | null => {
    const sets = parseInt(addForm.sets_count, 10);
    const reps = parseInt(addForm.reps_count, 10);
    const weight = parseFloat(addForm.weight_kg);
    if (!addForm.sets_count || isNaN(sets) || sets <= 0)
      return 'Укажите количество подходов.';
    if (!addForm.reps_count || isNaN(reps) || reps <= 0)
      return 'Укажите количество повторений.';
    if (!addForm.weight_kg || isNaN(weight) || weight < 0)
      return 'Укажите вес (0 или больше).';
    return null;
  };

  const handleAddConfirm = async () => {
    if (!selectedExercise || !workoutId) return;
    const validationError = validateAddForm();
    if (validationError) {
      setAddError(validationError);
      return;
    }
    setAddLoading(true);
    setAddError(null);
    try {
      await addExerciseToWorkout(workoutId, {
        exercise_id: selectedExercise.id,
        sets_count: parseInt(addForm.sets_count, 10),
        reps_count: parseInt(addForm.reps_count, 10),
        weight_kg: parseFloat(addForm.weight_kg),
      });
      navigate(`/workouts/${workoutId}`);
    } catch {
      setAddError('Не удалось добавить упражнение. Попробуйте позже.');
    } finally {
      setAddLoading(false);
    }
  };

  // Navigate back to the workout detail page, or workouts list if no workoutId
  const handleBack = () => {
    if (workoutId) {
      navigate(`/workouts/${workoutId}`);
    } else {
      navigate('/workouts');
    }
  };

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

      {/* Header */}
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Выбрать упражнение
        </Typography>
        <Button
          variant="outlined"
          onClick={() =>
            navigate(
              `/exercises/new${workoutId ? `?workoutId=${workoutId}` : ''}`,
            )
          }
        >
          + Создать своё упражнение
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search input */}
      <TextField
        fullWidth
        placeholder="Поиск упражнения..."
        value={searchInput}
        onChange={handleSearchChange}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 2 }}
        aria-label="Поиск упражнения"
      />

      {/* Category chips */}
      {catLoading ? (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: 'wrap', mb: 3, gap: 1 }}
        >
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.name}
              clickable
              color={selectedCategoryId === cat.id ? 'primary' : 'default'}
              onClick={() => handleCategoryToggle(cat.id)}
              variant={selectedCategoryId === cat.id ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* Exercises list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : exercises.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 4, textAlign: 'center' }}
        >
          Упражнения не найдены. Попробуйте другой запрос или создайте своё.
        </Typography>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Найдено: {total}
          </Typography>
          <List disablePadding>
            {exercises.map((ex, idx) => (
              <React.Fragment key={ex.id}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => openAddDialog(ex)}>
                    <ListItemText
                      primary={ex.name}
                      secondary={ex.category_name ?? ex.description ?? undefined}
                    />
                  </ListItemButton>
                </ListItem>
                {idx < exercises.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </>
      )}

      {/* Add exercise dialog */}
      <Dialog
        open={selectedExercise !== null}
        onClose={closeAddDialog}
        aria-labelledby="add-exercise-dialog-title"
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle id="add-exercise-dialog-title">
          {selectedExercise?.name}
        </DialogTitle>
        <DialogContent>
          {addError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {addError}
            </Alert>
          )}
          <TextField
            label="Подходы"
            type="number"
            value={addForm.sets_count}
            onChange={(e) => handleAddFormChange('sets_count', e.target.value)}
            fullWidth
            margin="normal"
            required
            slotProps={{ htmlInput: { min: 1 } }}
            autoFocus
          />
          <TextField
            label="Повторения"
            type="number"
            value={addForm.reps_count}
            onChange={(e) => handleAddFormChange('reps_count', e.target.value)}
            fullWidth
            margin="normal"
            required
            slotProps={{ htmlInput: { min: 1 } }}
          />
          <TextField
            label="Вес (кг)"
            type="number"
            value={addForm.weight_kg}
            onChange={(e) => handleAddFormChange('weight_kg', e.target.value)}
            fullWidth
            margin="normal"
            required
            slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddDialog} disabled={addLoading}>
            Отмена
          </Button>
          <Button
            onClick={() => void handleAddConfirm()}
            variant="contained"
            disabled={addLoading}
            startIcon={
              addLoading ? <CircularProgress size={16} color="inherit" /> : undefined
            }
          >
            {addLoading ? 'Добавление...' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default ExerciseSelectPage;
