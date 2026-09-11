export interface ReportRequest {
  reportCode: string;
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string;   // Format: YYYY-MM-DD
  orgUnitId?: string;
  format?: 'PREVIEW' | 'EXCEL' | 'PDF';
  bcNoiDung?: string;
  portGroup?: number;
  dataSource?: string;
  processingMethods?: string[];
  reportPeriod?: string;
}

export interface ReportResponse {
  reportCode: string;
  reportName: string;
  headers: string[];
  rows: Record<string, string | number | boolean | null>[];
  summary?: Record<string, number>;
}
