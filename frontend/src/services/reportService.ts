import api from './api';
import type { ReportRequest, ReportResponse } from '../types/report';

export const reportService = {
  /**
   * Fetch report preview data
   */
  async getPreview(request: ReportRequest): Promise<ReportResponse> {
    const res = await api.post('/v1/reports/preview', request);
    return res.data.data;
  },

  /**
   * Trigger file download for Excel/PDF exports
   */
  async exportReport(request: ReportRequest): Promise<void> {
    const res = await api.post('/v1/reports/export', request, {
      responseType: 'blob',
    });

    // Extract filename from response headers if present, else construct custom filename
    const disposition = res.headers['content-disposition'];
    let filename = '';
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }

    if (!filename) {
      const isExcel = request.format === 'EXCEL';
      const extension = isExcel ? '.csv' : '.txt';
      filename = `baocao_${request.reportCode.toLowerCase()}_${Date.now()}${extension}`;
    }

    const url = window.URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
