import api from './api';
import type { ReportRequest } from '../types/report';

export const reportPdfPreviewService = {
  async getPdfBlob(request: ReportRequest, signal?: AbortSignal): Promise<Blob> {
    const response = await api.post(
      '/v1/reports/export',
      { ...request, format: 'PDF' },
      { responseType: 'blob', signal },
    );

    return response.data instanceof Blob
      ? response.data.slice(0, response.data.size, 'application/pdf')
      : new Blob([response.data], { type: 'application/pdf' });
  },
};
