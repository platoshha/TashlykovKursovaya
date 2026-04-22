import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  Paper,
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
import AppLayout from '../components/AppLayout';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  createMeasurement,
  deleteMeasurement,
  getMeasurements,
} from '../api/measurements';
import type { MeasurementCreate, MeasurementResponse } from '../types';

// Format ISO date string to Russian locale short format
const formatDate = (iso: string): string => {
  const [year, month, day] = iso.split('-');
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Default form state
const emptyForm: MeasurementCreate = {
  measured_at: new Date().toISOString().split('T')[0],
  weight_kg: undefined,
  body_fat_pct: undefined,
  notes: undefined,
};

const MetricsPage: React.FC = () => {

  const [measurements, setMeasurements] = useState<MeasurementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<MeasurementCreate>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMeasurements(0, 50, 'desc');
      setMeasurements(res.items);
    } catch {
      setError('Не удалось загрузить измерения. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openDialog = () => {
    setForm({ ...emptyForm, measured_at: new Date().toISOString().split('T')[0] });
    setFormError(null);
    setDialogOpen(true);
  };

  const handleFormChange =
    (field: keyof MeasurementCreate) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (field === 'weight_kg' || field === 'body_fat_pct') {
        setForm((prev) => ({ ...prev, [field]: raw === '' ? undefined : Number(raw) }));
      } else {
        setForm((prev) => ({ ...prev, [field]: raw === '' ? undefined : raw }));
      }
    };

  const handleSubmit = async () => {
    if (!form.measured_at) {
      setFormError('Укажите дату измерения.');
      return;
    }
    if (form.weight_kg == null && form.body_fat_pct == null) {
      setFormError('Укажите хотя бы одно значение: вес или % жира.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await createMeasurement(form);
      setDialogOpen(false);
      void load();
    } catch {
      setFormError('Не удалось сохранить измерение. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteMeasurement(id);
      setMeasurements((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError('Не удалось удалить измерение. Попробуйте позже.');
    } finally {
      setDeletingId(null);
    }
  };

  // Chart data: reverse to show chronological order (asc by date)
  const chartData = [...measurements]
    .filter((m) => m.weight_kg != null)
    .reverse()
    .map((m) => ({
      date: m.measured_at,
      weight: m.weight_kg as number,
    }));

  return (
    <AppLayout>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Current metrics card */}
      {measurements.length > 0 && measurements[0].weight_kg != null && (
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Текущие показатели
          </Typography>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'baseline' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Вес</Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {measurements[0].weight_kg}
                </Typography>
                <Typography variant="body1" color="text.secondary">кг</Typography>
                {/* Delta — only when a previous measurement with weight exists */}
                {measurements[1]?.weight_kg != null && (() => {
                  const delta = Number(measurements[0].weight_kg) - Number(measurements[1].weight_kg);
                  if (delta === 0) return null;
                  const isUp = delta > 0;
                  return (
                    <Typography
                      variant="body2"
                      sx={{ color: isUp ? 'error.main' : 'success.main', fontWeight: 600 }}
                    >
                      {isUp ? '▲' : '▼'} {Math.abs(delta).toFixed(1)} кг
                    </Typography>
                  );
                })()}
              </Box>
            </Box>
            {measurements[0].body_fat_pct != null && (
              <Box>
                <Typography variant="caption" color="text.secondary">% жира</Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {measurements[0].body_fat_pct}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">%</Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {/* Weight chart */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        График веса
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
          <CircularProgress />
        </Box>
      ) : chartData.length === 0 ? (
        <Paper
          elevation={1}
          sx={{ p: 4, textAlign: 'center', mb: 4, borderRadius: 2 }}
        >
          <Typography color="text.secondary">
            Нет данных о весе. Добавьте первое измерение.
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(v: string) => {
                  const [, m, d] = v.split('-');
                  return `${d}.${m}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                domain={['auto', 'auto']}
                tickFormatter={(v: number) => `${v} кг`}
              />
              <RechartsTooltip
                formatter={(value: unknown) => [`${value as number} кг`, 'Вес']}
                labelFormatter={(label: unknown) => formatDate(String(label))}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#00897b"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Вес"
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Measurements table */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        История измерений
      </Typography>

      {!loading && (
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Дата</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Вес (кг)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  % жира
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Заметки</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Действия
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {measurements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Измерений нет
                  </TableCell>
                </TableRow>
              ) : (
                measurements.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell>{formatDate(m.measured_at)}</TableCell>
                    <TableCell align="right">
                      {m.weight_kg != null ? `${m.weight_kg}` : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {m.body_fat_pct != null ? `${m.body_fat_pct}%` : '—'}
                    </TableCell>
                    <TableCell>{m.notes ?? '—'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Удалить">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={deletingId === m.id}
                            onClick={() => void handleDelete(m.id)}
                            aria-label="Удалить измерение"
                          >
                            {deletingId === m.id ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              <DeleteIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* FAB */}
      <Fab
        color="primary"
        aria-label="Добавить измерение"
        onClick={openDialog}
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
      >
        <AddIcon />
      </Fab>

      {/* Add measurement dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="add-measurement-dialog-title"
      >
        <DialogTitle id="add-measurement-dialog-title">
          Добавить измерение
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {formError && (
              <Alert severity="error" onClose={() => setFormError(null)}>
                {formError}
              </Alert>
            )}
            <TextField
              label="Дата"
              type="date"
              value={form.measured_at}
              onChange={handleFormChange('measured_at')}
              slotProps={{ htmlInput: { max: new Date().toISOString().split('T')[0] } }}
              required
              fullWidth
            />
            <TextField
              label="Вес (кг)"
              type="number"
              value={form.weight_kg ?? ''}
              onChange={handleFormChange('weight_kg')}
              slotProps={{ htmlInput: { step: 0.1, min: 0 } }}
              fullWidth
            />
            <TextField
              label="% жира"
              type="number"
              value={form.body_fat_pct ?? ''}
              onChange={handleFormChange('body_fat_pct')}
              slotProps={{ htmlInput: { step: 0.1, min: 0, max: 100 } }}
              fullWidth
            />
            <TextField
              label="Заметки"
              value={form.notes ?? ''}
              onChange={handleFormChange('notes')}
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

export default MetricsPage;
