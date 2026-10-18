import axios from 'axios';
import type { ApiError } from '../types';
import { getErrorMessage } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const axiosError = axios.isAxiosError<{ error?: string }>(error)
      ? error
      : undefined;
    const formattedError: ApiError = {
      message:
        axiosError?.response?.data?.error ||
        getErrorMessage(error) ||
        'An unexpected error occurred.',
      status: axiosError?.response?.status,
      data: axiosError?.response?.data,
    };
    return Promise.reject(formattedError);
  }
);
