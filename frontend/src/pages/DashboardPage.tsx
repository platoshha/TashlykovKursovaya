import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight';
import ScaleIcon from '@mui/icons-material/Scale';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getDashboard } from '../api/statistics';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import type { DashboardStats } from '../types';

// Stat card sub-component — kept inline as required (no sub-component files)
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => (
  <Card elevation={2} sx={{ borderRadius: 2, height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 1.5,
            backgroundColor: color ?? 'primary.main',
            color: 'white',
            display: 'flex',
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {value}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDashboard();
        setStats(data);
      } catch {
        setError('Не удалось загрузить статистику. Попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  // Show last 6 months of workout data
  const workoutsChartData = stats?.workouts_per_month.slice(-6) ?? [];

  // Weight chart — only rendered if data exists
  const weightChartData =
    stats?.weight_history.map((w) => ({ date: w.date, weight: w.weight_kg })) ?? [];

  return (
    <AppLayout>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Добро пожаловать{user ? `, ${user.name}` : ''}!
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <CircularProgress />
          </Box>
        ) : stats ? (
          <>
            {/* Stat cards row */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard
                  label="Тренировок всего"
                  value={stats.total_workouts}
                  icon={<FitnessCenterIcon />}
                  color="#1565c0"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard
                  label="В этом месяце"
                  value={stats.workouts_this_month}
                  icon={<FitnessCenterIcon />}
                  color="#00897b"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard
                  label="Общий объём (кг)"
                  value={stats.total_volume_kg.toLocaleString('ru-RU')}
                  icon={<ScaleIcon />}
                  color="#6a1b9a"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatCard
                  label="Текущий вес"
                  value={
                    stats.latest_weight_kg != null
                      ? `${stats.latest_weight_kg} кг`
                      : '—'
                  }
                  icon={<MonitorWeightIcon />}
                  color="#e65100"
                />
              </Grid>
            </Grid>

            {/* Latest workout */}
            {stats.latest_workout && (
              <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Последняя тренировка
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FitnessCenterIcon color="primary" fontSize="small" />
                    <Typography>{stats.latest_workout.workout_type_name}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon color="action" fontSize="small" />
                    <Typography>{stats.latest_workout.duration_minutes} мин</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {(() => {
                      const [y, m, d] = stats.latest_workout.workout_date.split('-');
                      return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'long',
                      });
                    })()}
                  </Typography>
                  {stats.latest_workout.exercises_count > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {stats.latest_workout.exercises_count} упр.
                    </Typography>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/workouts/${stats.latest_workout!.id}`)}
                    sx={{ ml: 'auto' }}
                  >
                    Открыть
                  </Button>
                </Box>
              </Paper>
            )}

            {/* Goals summary */}
            <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Цели
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrackChangesIcon color="primary" />
                  <Typography>
                    Активных: <strong>{stats.active_goals_count}</strong>
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrackChangesIcon color="success" />
                  <Typography>
                    Выполненных: <strong>{stats.achieved_goals_count}</strong>
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/goals')}
                  sx={{ ml: 'auto' }}
                >
                  Перейти к целям
                </Button>
              </Box>
            </Paper>

            {/* Workouts per month bar chart */}
            {workoutsChartData.length > 0 && (
              <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Тренировки по месяцам (последние 6 месяцев)
                </Typography>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={workoutsChartData}
                    margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <RechartsTooltip
                      formatter={(value: unknown) => [value as number, 'Тренировок']}
                    />
                    <Legend
                      formatter={() => 'Тренировок'}
                    />
                    <Bar dataKey="count" name="Тренировок" fill="#1976d2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            )}

            {/* Weight history line chart — only if data exists */}
            {weightChartData.length > 0 && (
              <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  История веса
                </Typography>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart
                    data={weightChartData}
                    margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v: string) => {
                        const parts = v.split('-');
                        return `${parts[2]}.${parts[1]}`;
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      domain={['auto', 'auto']}
                      tickFormatter={(v: number) => `${v}`}
                    />
                    <RechartsTooltip
                      formatter={(value: unknown) => [`${value as number} кг`, 'Вес']}
                    />
                    <Legend formatter={() => 'Вес (кг)'} />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Вес"
                      stroke="#00897b"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            )}

            {/* Quick navigation */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                justifyContent: 'center',
              }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/workouts/new')}
              >
                + Добавить тренировку
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/metrics')}
              >
                Показатели тела
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/goals')}
              >
                Мои цели
              </Button>
            </Box>
          </>
        ) : (
          // Fallback when stats is null (after error)
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'center',
              mt: 6,
            }}
          >
            <Button variant="contained" size="large" onClick={() => navigate('/workouts/new')}>
              + Добавить тренировку
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/workouts')}>
              Мои тренировки
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/profile')}>
              Мой профиль
            </Button>
          </Box>
        )}
    </AppLayout>
  );
};

export default DashboardPage;
