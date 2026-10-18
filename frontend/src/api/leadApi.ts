import { axiosClient } from './axiosClient';
import type { LeadProcessingResult } from '../types';

export const leadApi = {
  processLeads: async (
    spreadsheetId: string,
    sheetName = 'Sheet1'
  ): Promise<LeadProcessingResult> => {
    const response = await axiosClient.post<LeadProcessingResult>('/api/leads/process', {
      spreadsheetId,
      sheetName,
    });
    return response.data;
  },
};
