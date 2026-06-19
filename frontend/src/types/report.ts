export interface ReportRequest {
  reportCode: string;
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string;   // Format: YYYY-MM-DD
  orgUnitId?: string;
  format?: 'PREVIEW' | 'EXCEL' | 'PDF';
}

export interface ReportResponse {
  reportCode: string;
  reportName: string;
  headers: string[];
  rows: Record<string, any>[];
  summary?: Record<string, any>;
}
