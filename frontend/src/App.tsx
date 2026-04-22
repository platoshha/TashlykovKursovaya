import { Route, Routes } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import DashboardPage from './pages/DashboardPage';
import ExerciseCreatePage from './pages/ExerciseCreatePage';
import ExerciseSelectPage from './pages/ExerciseSelectPage';
import GoalsPage from './pages/GoalsPage';
import LoginPage from './pages/LoginPage';
import MetricsPage from './pages/MetricsPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import WorkoutDetailPage from './pages/WorkoutDetailPage';
import WorkoutFormPage from './pages/WorkoutFormPage';
import WorkoutsPage from './pages/WorkoutsPage';

// Centralised route table.
// Protected routes are nested under PrivateRoute which handles auth guarding.
function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/workouts" element={<WorkoutsPage />} />
        {/* /workouts/new must come before /workouts/:id so the literal "new"
            is not captured by the :id param segment */}
        <Route path="/workouts/new" element={<WorkoutFormPage />} />
        <Route path="/workouts/:id" element={<WorkoutDetailPage />} />
        <Route path="/workouts/:id/edit" element={<WorkoutFormPage />} />
        <Route path="/exercises/select" element={<ExerciseSelectPage />} />
        <Route path="/exercises/new" element={<ExerciseCreatePage />} />
        <Route path="/metrics" element={<MetricsPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}

export default App;
