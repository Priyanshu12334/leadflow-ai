import { axiosClient } from './axiosClient';
import type { LeadListItem, LeadProcessingResult } from '../types';

export const leadApi = {
  listLeads: async (): Promise<LeadListItem[]> => {
    const response = await axiosClient.get<{ leads: LeadListItem[] }>('/api/leads');
    return response.data.leads;
  },
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
