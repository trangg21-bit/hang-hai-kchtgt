import api from './api';

export interface ReportRecord {
  id?: string;
  orgUnitId: string;
  orgUnitName?: string;
  reportCode: string;
  reportPeriod: string;
  reportYear: number;
  status: string;
  reportData: string;
  notes?: string;
  version?: number;
  createdDate?: string;
  lastModifiedDate?: string;
}

export const reportRecordService = {
  search: async (params: {
    reportCode?: string;
    orgUnitId?: string;
    reportYear?: number;
    reportPeriod?: string;
  }): Promise<ReportRecord[]> => {
    const res = await api.get('/api/v1/report-records', { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<ReportRecord> => {
    const res = await api.get(`/api/v1/report-records/${id}`);
    return res.data.data;
  },

  save: async (data: Partial<ReportRecord>): Promise<ReportRecord> => {
    const res = await api.post('/api/v1/report-records', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<ReportRecord>): Promise<ReportRecord> => {
    const res = await api.put(`/api/v1/report-records/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/report-records/${id}`);
  },
};
