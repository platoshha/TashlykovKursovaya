import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createExercise } from '../api/exercises';
import { getExerciseCategories } from '../api/reference';
import AppLayout from '../components/AppLayout';
import type { ExerciseCategory } from '../types';

const ExerciseCreatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const workoutId = searchParams.get('workoutId') ?? '';
  const navigate = useNavigate();

  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [catLoading, setCatLoading] = useState(true);

  // Form fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCats = async () => {
      setCatLoading(true);
      try {
        const cats = await getExerciseCategories();
        setCategories(cats);
      } catch {
        setError('Не удалось загрузить категории упражнений.');
      } finally {
        setCatLoading(false);
      }
    };
    void loadCats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Название упражнения обязательно.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await createExercise({
        name: name.trim(),
        ...(categoryId !== '' ? { category_id: categoryId } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      // Redirect back to exercise selection (or workouts list if no workoutId)
      if (workoutId) {
        navigate(`/exercises/select?workoutId=${workoutId}`);
      } else {
        navigate('/workouts');
      }
    } catch {
      setError(
        'Не удалось создать упражнение. Возможно, упражнение с таким названием уже существует.',
      );
    } finally {
      setSaving(false);
    }
  };

  // Navigate back to exercise select page, preserving workoutId context
  const handleBack = () => {
    if (workoutId) {
      navigate(`/exercises/select?workoutId=${workoutId}`);
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

      <Typography variant="h5" sx={{ fontWeight: 600 }} gutterBottom>
        Создать своё упражнение
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Constrain form width on wide screens */}
      <Box sx={{ maxWidth: 560 }}>
        <Box component="form" onSubmit={(e) => void handleSubmit(e)} noValidate>
          <TextField
            label="Название"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            margin="normal"
            slotProps={{ htmlInput: { maxLength: 200 } }}
            autoFocus
          />

          <FormControl fullWidth margin="normal" disabled={catLoading}>
            <InputLabel id="category-label">Категория</InputLabel>
            <Select
              labelId="category-label"
              label="Категория"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value as number | '')}
            >
              <MenuItem value="">
                <em>Без категории</em>
              </MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={3}
            slotProps={{ htmlInput: { maxLength: 1000 } }}
          />

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button variant="outlined" fullWidth onClick={handleBack}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={saving || catLoading}
              startIcon={
                saving ? <CircularProgress size={18} color="inherit" /> : undefined
              }
            >
              {saving ? 'Создание...' : 'Создать'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </AppLayout>
  );
};

export default ExerciseCreatePage;
