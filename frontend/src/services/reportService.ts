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
    console.log("Axios Response Headers:", res.headers);
    const disposition = (res.headers && typeof res.headers.get === 'function' 
      ? res.headers.get('content-disposition') 
      : (res.headers ? res.headers['content-disposition'] : undefined)) as string | undefined;
    console.log("Extracted Content-Disposition:", disposition);
    
    let filename = '';
    if (disposition) {
      const utf8FilenameRegex = /filename\*=UTF-8''([^;\n]+)/i;
      const utf8Matches = utf8FilenameRegex.exec(disposition);
      if (utf8Matches != null && utf8Matches[1]) {
        try {
          filename = decodeURIComponent(utf8Matches[1]);
        } catch (e) {}
      } else {
        const filenameRegex = /filename=((['"]).*?\2|[^;\n]*)/i;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
    }
    console.log("Filename from disposition:", filename);

    if (!filename) {
      const isExcel = request.format === 'EXCEL';
      const extension = isExcel ? '.xlsx' : '.txt';
      filename = `baocao_${request.reportCode.toLowerCase()}_${Date.now()}${extension}`;
    }
    console.log("Final download filename:", filename);

    // Use application/octet-stream to override any MIME-type mismatch that would cause Chrome to drop the filename
    const blob = res.data instanceof Blob 
      ? res.data.slice(0, res.data.size, 'application/octet-stream') 
      : new Blob([res.data], { type: 'application/octet-stream' });
      
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Delay revocation to give browser download manager time to resolve blob details
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 15000);
  },
};
