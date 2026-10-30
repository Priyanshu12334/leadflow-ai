import { axiosClient } from './axiosClient';
import type { FollowUpLead, LeadProcessingResult } from '../types';

export const leadApi = {
  listLeads: async (): Promise<FollowUpLead[]> => {
    const response = await axiosClient.get<{ leads: FollowUpLead[] }>('/api/leads');
    return response.data.leads;
  },
  updateFollowUpDate: async (rowNumber: number, nextFollowUpDate: string | null): Promise<string | null> => {
    const response = await axiosClient.put<{ nextFollowUpDate: string | null }>(`/api/leads/${rowNumber}/follow-up`, { nextFollowUpDate });
    return response.data.nextFollowUpDate;
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
