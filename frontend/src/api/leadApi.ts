import { axiosClient } from './axiosClient';
import type { LeadListItem, LeadProcessingJob } from '../types';

interface DemoLeadResponse {
  name: string;
  email: string;
  company: string;
  requirement: string;
  budget: string;
  message: string;
}

export const leadApi = {
  listLeads: async (): Promise<LeadListItem[]> => {
    const response = await axiosClient.get<{ leads: Array<LeadListItem | DemoLeadResponse> }>('/api/leads');
    return response.data.leads.map((lead, index) => {
      if ('rowNumber' in lead) return lead;
      const fields = [
        { column: 'Name', value: lead.name },
        { column: 'Email', value: lead.email },
        { column: 'Company', value: lead.company },
        { column: 'Requirement', value: lead.requirement },
        { column: 'Budget', value: lead.budget },
        { column: 'Message', value: lead.message },
      ];
      return {
        rowNumber: index + 2,
        name: lead.name,
        email: lead.email,
        company: lead.company,
        context: `${lead.requirement}. Budget: ${lead.budget}. ${lead.message}`,
        fields,
      };
    });
  },
  processLeads: async (
    spreadsheetId: string,
    sheetName = 'Sheet1'
  ): Promise<{ jobId: string }> => {
    const response = await axiosClient.post<{ jobId: string }>('/api/leads/process', {
      spreadsheetId,
      sheetName,
    });
    return response.data;
  },
  getProcessLeadsJob: async (jobId: string): Promise<LeadProcessingJob> => {
    const response = await axiosClient.get<{ job: LeadProcessingJob }>(
      `/api/leads/process/${encodeURIComponent(jobId)}`,
    );
    return response.data.job;
  },
};
