import type { AuthTokens, LoginRequest, RegisterRequest, User } from '../types';
import apiClient from './axios';

// Authenticate with email + password, returns JWT tokens.
// Backend endpoint: POST /api/v1/auth/login (form-encoded per OAuth2 spec)
export const login = async (data: LoginRequest): Promise<AuthTokens> => {
  const response = await apiClient.post<AuthTokens>('/auth/login', data);
  return response.data;
};

// Register a new user account.
// Backend endpoint: POST /api/v1/auth/register
export const register = async (data: RegisterRequest): Promise<User> => {
  const response = await apiClient.post<User>('/auth/register', data);
  return response.data;
};

// Fetch the currently authenticated user's profile.
// Backend endpoint: GET /api/v1/users/me
export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
};
