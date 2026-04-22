import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { getMe } from '../api/auth';
import type { AuthTokens, User } from '../types';

// ── Types ──────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (tokens: AuthTokens) => Promise<void>;
  logout: () => void;
}

// ── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On mount: if a token already exists in localStorage (e.g. page refresh),
  // fetch the user profile to hydrate the context without requiring a new login.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    getMe()
      .then((fetchedUser) => {
        if (!cancelled) setUser(fetchedUser);
      })
      .catch(() => {
        // Token is invalid or expired — clean up so the user is redirected
        // to login by PrivateRoute.
        if (!cancelled) {
          localStorage.removeItem('token');
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Called after a successful login API response.
  // Persists the token and hydrates the user from the server.
  const login = useCallback(async (tokens: AuthTokens): Promise<void> => {
    localStorage.setItem('token', tokens.access_token);
    const fetchedUser = await getMe();
    setUser(fetchedUser);
  }, []);

  // Clears auth state and removes the token from storage.
  const logout = useCallback((): void => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ───────────────────────────────────────────────────────────────────

// Throws if used outside of AuthProvider to catch wiring mistakes early.
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
};
