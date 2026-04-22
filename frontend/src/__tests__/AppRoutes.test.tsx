import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';

vi.mock('../components/PrivateRoute', () => ({ default: () => <div>private-wrapper</div> }));
vi.mock('../pages/LoginPage', () => ({ default: () => <div>login-page</div> }));
vi.mock('../pages/RegisterPage', () => ({ default: () => <div>register-page</div> }));
vi.mock('../pages/DashboardPage', () => ({ default: () => <div>dashboard-page</div> }));
vi.mock('../pages/ExerciseCreatePage', () => ({ default: () => <div>exercise-create</div> }));
vi.mock('../pages/ExerciseSelectPage', () => ({ default: () => <div>exercise-select</div> }));
vi.mock('../pages/GoalsPage', () => ({ default: () => <div>goals-page</div> }));
vi.mock('../pages/MetricsPage', () => ({ default: () => <div>metrics-page</div> }));
vi.mock('../pages/ProfilePage', () => ({ default: () => <div>profile-page</div> }));
vi.mock('../pages/WorkoutDetailPage', () => ({ default: () => <div>workout-detail</div> }));
vi.mock('../pages/WorkoutFormPage', () => ({ default: () => <div>workout-form</div> }));
vi.mock('../pages/WorkoutsPage', () => ({ default: () => <div>workouts-page</div> }));

describe('App routes', () => {
  it('открывает публичный маршрут /login', () => {
    render(<MemoryRouter initialEntries={['/login']}><App /></MemoryRouter>);
    expect(screen.getByText('login-page')).toBeInTheDocument();
  });
});
