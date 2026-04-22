import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LogoutIcon from '@mui/icons-material/Logout';
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          {/* Brand — click to go home */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              mr: 2,
              flexShrink: 0,
            }}
            onClick={() => navigate('/')}
            role="link"
            aria-label="На главную"
          >
            <FitnessCenterIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Fitness Tracker
            </Typography>
          </Box>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Navigation buttons — hidden on xs to save space */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
            <Button color="inherit" onClick={() => navigate('/workouts')} sx={{ mr: 1 }}>
              Тренировки
            </Button>
            <Button color="inherit" onClick={() => navigate('/metrics')} sx={{ mr: 1 }}>
              Показатели
            </Button>
            <Button color="inherit" onClick={() => navigate('/goals')} sx={{ mr: 1 }}>
              Цели
            </Button>
            <Button color="inherit" onClick={() => navigate('/profile')} sx={{ mr: 2 }}>
              Профиль
            </Button>
          </Box>

          {/* User name */}
          {user && (
            <Typography
              variant="body2"
              sx={{ mr: 1, opacity: 0.85, display: { xs: 'none', sm: 'block' } }}
            >
              {user.name}
            </Typography>
          )}

          {/* Logout */}
          <Tooltip title="Выйти">
            <IconButton color="inherit" onClick={handleLogout} aria-label="Выйти">
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        {children}
      </Container>
    </Box>
  );
};

export default AppLayout;
