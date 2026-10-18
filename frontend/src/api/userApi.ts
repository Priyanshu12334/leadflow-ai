import { axiosClient } from './axiosClient';
import type { UserResponse } from '../types';

export const userApi = {
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
};
