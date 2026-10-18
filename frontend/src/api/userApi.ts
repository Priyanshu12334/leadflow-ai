import { axiosClient } from './axiosClient';
import type { UserResponse } from '../types';

export const userApi = {
  getSpreadsheetOpenLink: async (): Promise<{ url: string; sheetId: number; sheetName: string }> => {
    const response = await axiosClient.get<{ url: string; sheetId: number; sheetName: string }>('/api/users/spreadsheet/open-link');
    return response.data;
  },

  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await axiosClient.get<UserResponse>('/api/users/me');
    return response.data;
  },

  updateSpreadsheet: async (
    spreadsheetId: string,
    sheetName = 'Sheet1'
  ): Promise<UserResponse> => {
    const response = await axiosClient.put<UserResponse>('/api/users/spreadsheet', {
      spreadsheetId,
      sheetName,
    });
    return response.data;
  },

  disconnectGoogle: async (): Promise<UserResponse> => {
    const response = await axiosClient.delete<UserResponse>('/api/users/google');
    return response.data;
  },
};
