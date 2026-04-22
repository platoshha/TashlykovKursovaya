import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import axios from 'axios';

// ── Types ──────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const validate = (values: FormState): FormErrors => {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Имя обязательно';
  }

  if (!values.email.includes('@') || !values.email.includes('.')) {
    errors.email = 'Введите корректный email';
  }

  if (values.password.length < 8) {
    errors.password = 'Пароль должен содержать минимум 8 символов';
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Пароли не совпадают';
  }

  return errors;
};

// ── Component ──────────────────────────────────────────────────────────────

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear the field-level error as the user types
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setApiError('');

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/login');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setApiError(
          typeof detail === 'string'
            ? detail
            : 'Ошибка при регистрации. Попробуйте ещё раз.',
        );
      } else {
        setApiError('Ошибка при регистрации. Попробуйте ещё раз.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 2 }}>
          <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Создание аккаунта
          </Typography>

          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Имя"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={Boolean(errors.name)}
              helperText={errors.name}
              fullWidth
              margin="normal"
              autoComplete="name"
              autoFocus
            />

            <TextField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={Boolean(errors.email)}
              helperText={errors.email}
              fullWidth
              margin="normal"
              autoComplete="email"
            />

            <TextField
              label="Пароль"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              error={Boolean(errors.password)}
              helperText={errors.password}
              fullWidth
              margin="normal"
              autoComplete="new-password"
            />

            <TextField
              label="Подтвердите пароль"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword}
              fullWidth
              margin="normal"
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Зарегистрироваться'
              )}
            </Button>
          </Box>

          <Typography variant="body2" align="center">
            Уже есть аккаунт?{' '}
            <Link component={RouterLink} to="/login" underline="hover">
              Войти
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;
