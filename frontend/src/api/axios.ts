import axios from 'axios';

// Centralised Axios instance — all API calls must go through this instance
// so that auth headers and error handling are applied consistently.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach the JWT token stored in localStorage to every
// outgoing request as a Bearer token, if one exists.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: on 401 Unauthorized, clear the stored token and
// redirect to the login page so the user can re-authenticate.
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401
    ) {
      localStorage.removeItem('token');
      // Hard redirect — the AuthContext will reflect the cleared token on
      // the next render cycle and the PrivateRoute will redirect as well,
      // but we do a hard redirect here to ensure the user lands on /login
      // even when the 401 happens outside of React's render tree.
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
