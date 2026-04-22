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
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile } from '../api/profile';
import AppLayout from '../components/AppLayout';
import type { Profile, ProfileUpdate } from '../types';

type TrainingLevel = 'beginner' | 'intermediate' | 'advanced';

const TRAINING_LEVEL_LABELS: Record<TrainingLevel, string> = {
  beginner: 'Начинающий',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state — mirrors ProfileUpdate fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [trainingLevel, setTrainingLevel] = useState<TrainingLevel>('beginner');

  useEffect(() => {
    const load = async () => {
      try {
        const prof = await getProfile();
        setProfile(prof);
        // Populate form fields from loaded profile
        setName(prof.name ?? '');
        setAge(prof.age !== null && prof.age !== undefined ? String(prof.age) : '');
        setHeightCm(
          prof.height_cm !== null && prof.height_cm !== undefined
            ? String(prof.height_cm)
            : '',
        );
        setTrainingLevel(prof.training_level ?? 'beginner');
      } catch {
        setError('Не удалось загрузить профиль. Попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim()) {
      setError('Имя обязательно для заполнения.');
      return;
    }

    const data: ProfileUpdate = {
      name: name.trim(),
      training_level: trainingLevel,
    };

    const parsedAge = age !== '' ? parseInt(age, 10) : null;
    if (age !== '' && (isNaN(parsedAge!) || parsedAge! < 0)) {
      setError('Возраст должен быть положительным числом.');
      return;
    }
    data.age = parsedAge;

    const parsedHeight = heightCm !== '' ? parseFloat(heightCm) : null;
    if (heightCm !== '' && (isNaN(parsedHeight!) || parsedHeight! <= 0)) {
      setError('Рост должен быть положительным числом.');
      return;
    }
    data.height_cm = parsedHeight;

    setSaving(true);
    try {
      const updated = await updateProfile(data);
      setProfile(updated);
      setSuccess(true);
    } catch {
      setError('Не удалось сохранить профиль. Попробуйте позже.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
        onClick={() => navigate('/')}
        sx={{ mb: 2 }}
      >
        Назад
      </Button>

      <Typography variant="h5" sx={{ fontWeight: 600 }} gutterBottom>
        Мой профиль
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
          Профиль успешно сохранён.
        </Alert>
      )}

      {/* Constrain form width on wide screens */}
      <Box sx={{ maxWidth: 560 }}>
        {/* Show loaded profile info even before edits */}
        {profile && (
          <Box component="form" onSubmit={(e) => void handleSave(e)} noValidate>
            <TextField
              label="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              margin="normal"
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />

            <TextField
              label="Возраст"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              type="number"
              fullWidth
              margin="normal"
              slotProps={{ htmlInput: { min: 0, max: 120 } }}
            />

            <TextField
              label="Рост (см)"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              type="number"
              fullWidth
              margin="normal"
              slotProps={{ htmlInput: { min: 0, max: 300 } }}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel id="training-level-label">Уровень подготовки</InputLabel>
              <Select
                labelId="training-level-label"
                label="Уровень подготовки"
                value={trainingLevel}
                onChange={(e) => setTrainingLevel(e.target.value as TrainingLevel)}
              >
                {(Object.keys(TRAINING_LEVEL_LABELS) as TrainingLevel[]).map(
                  (level) => (
                    <MenuItem key={level} value={level}>
                      {TRAINING_LEVEL_LABELS[level]}
                    </MenuItem>
                  ),
                )}
              </Select>
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={saving}
              sx={{ mt: 3 }}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </Box>
        )}
      </Box>
    </AppLayout>
  );
};

export default ProfilePage;
