import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';

// MUI theme — using teal (cyan-like) as the primary palette to give the
// fitness tracker a fresh, energetic look while staying accessible.
const theme = createTheme({
  palette: {
    primary: {
      main: '#00897b', // teal 600
      light: '#4db6ac',
      dark: '#00695c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#5c6bc0', // indigo 400
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      {/* CssBaseline applies a consistent cross-browser CSS reset */}
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
