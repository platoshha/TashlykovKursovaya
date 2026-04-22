import type { Profile, ProfileUpdate } from '../types';
import apiClient from './axios';

export const getProfile = (): Promise<Profile> =>
  apiClient.get<Profile>('/profile').then((r) => r.data);

export const updateProfile = (data: ProfileUpdate): Promise<Profile> =>
  apiClient.put<Profile>('/profile', data).then((r) => r.data);
