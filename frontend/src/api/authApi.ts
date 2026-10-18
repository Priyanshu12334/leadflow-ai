import { axiosClient } from './axiosClient';

// IMPORTANT: OAuth start URL must be absolute (http://localhost:5000/...) so the browser
// navigates directly to the backend, bypassing the Vite /api proxy.
// If a relative /api/auth/google path is used, the Vite proxy intercepts it,
// follows the Google redirect server-side, and the browser ends up on /api/users/me
// instead of http://localhost:5173/dashboard.
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const authApi = {
  getGoogleAuthUrl: () => {
    return `${BACKEND_URL}/api/auth/google`;
  },

  logout: async (): Promise<void> => {
    const response = await axiosClient.post<void>('/api/auth/logout');
    return response.data;
  },
};
