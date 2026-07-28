// ============================================================
// dashboardTypes.ts — All TypeScript interfaces for M-022 Dashboard
// Source: BA spec §2.1 (API client) and §2.2 (Dashboard view model)
// ============================================================

// ============================================================
// 1. API Response Envelope
// ============================================================

/** Standard API response envelope from Spring Boot backend */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string; // ISO 8601 LocalDateTime
}

/** Spring Boot Page wrapper for paginated responses */
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ============================================================
// 2. Domain Entities (from M-009 backend)
// ============================================================

/** Cargo aggregate — matches Java CargoAggregate entity fields */
export interface CargoAggregate {
  id?: string;       // UUID
  portCode: string;  // e.g. "PIER-HPH-001"
  periodType: PeriodType;
  periodStart: string; // ISO date, e.g. "2026-01-01"
  periodEnd: string;   // ISO date, e.g. "2026-12-31"
  totalTons: number;   // BigDecimal mapped to number (**NOT totalTonnage**)
  totalTeus: number;   // total TEUs
  vesselCount: number; // total vessel count
}

export type PeriodType =
  | 'MONTHLY'
  | 'ANNUAL'
  | 'CARGO_PASSENGER'
  | 'DOMESTIC'
  | 'MANAGED_AREA';

/** Asset status summary — counts of all GIS assets */
export interface AssetStatusDto {
  totalPoints: number;
  totalLines: number;
  totalPolygons: number;
  totalAssets: number;
  pointsByType: Record<string, number>;
  linesByType: Record<string, number>;
  polygonsByType: Record<string, number>;
  assetsByStatus: Record<string, number>;
  breakdown?: Array<{
    sequenceNo: number;
    type: string;
    total: number;
    pending: number;
    operating: number;
    suspended: number;
  }>;
}

/**
 * Asset processing dossier — mirrors AssetProcessingRecordResponse.
 * Field names and enum values follow what the backend actually serialises;
 * the previous Vietnamese names never matched, so every lookup came back
 * undefined and the approval widgets silently read as zero.
 * assetName and createdByName are declared nullable because the backend
 * currently hardcodes both to null in AssetProcessingRecordService.toResponse.
 */
export interface AssetProcessingRecordResponse {
  id: string;
  assetId: string;
  assetName: string | null;
  processingType: ProcessingType;
  description: string;
  documentStatus: DocumentStatus;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ProcessingType = 'TRANSFER' | 'HANDOVER' | 'LIQUIDATION' | 'DEMOLITION';
export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Comprehensive system info — from E4 endpoint */
export interface ComprehensiveInfoDto {
  totalAssets: number;
  totalDataConnections: number;
  connectionsByStatus: Record<string, number>;
  totalSyncJobsRun: number;
  syncJobsByStatus: Record<string, number>;
  systemTime: string;
}

// ============================================================
// 3. Dashboard View Model Interfaces
// ============================================================

/** Complete dashboard data model — shape consumed by Home.tsx */
export interface DashboardData {
  heroKpi: KpiWithSparkline;
  kpiCards: KpiCardData[];
  alertCard: AlertCardData;
  stackedBar: MonthlyCargoSeries;
  donutPhuongTien: DonutSegment[];
  linePassenger: PassengerMonthlySeries;
  ringKcht: RingKchtData;
  radarCoverage: RadarIndicator[];
  hBarApproval: ApprovalByCategory[];
  donutPheDuyet: DonutSegment[];
}

/** Hero KPI with sparkline */
export interface KpiWithSparkline {
  label: string;
  value: number;
  unit: string;
  year: number;
  deltaPercent: number;
  deltaDirection: 'up' | 'down';
  previousYearValue: number;
  sparklineData: number[];
}

/** Standard KPI card */
export interface KpiCardData {
  label: string;
  value: string | number;
  deltaPercent?: number;
  deltaDirection?: 'up' | 'down';
  isRatio?: boolean;
  numerator?: number;
  denominator?: number;
  sparklineData?: number[];
  sparklineType?: 'line' | 'bar';
}

/** Alert card — pending approvals */
export interface AlertCardData {
  pendingCount: number;
  urgencyLabel: string;
  navigateTo: string;
}

/** Monthly cargo series for stacked bar chart */
export interface MonthlyCargoSeries {
  months: string[];
  series: {
    name: string;
    data: number[];
    color: string;
  }[];
}

/** Passenger monthly series for line chart */
export interface PassengerMonthlySeries {
  months: string[];
  arrival: number[];
  departure: number[];
  peak?: { month: string; value: number };
}

/** Donut/ring chart segment */
export interface DonutSegment {
  value: number;
  name: string;
  color: string;
}

/** Ring chart data — KCHT operating ratio */
export interface RingKchtData {
  operatingCount: number;
  totalCount: number;
  percentage: number;
}

/** Radar coverage indicator */
export interface RadarIndicator {
  name: string;
  value: number;
  max: number;
}

/** Approval H-Bar data by category */
export interface ApprovalByCategory {
  category: string;
  approved: number;
  pending: number;
  rejected: number;
}

// ============================================================
// 4. Year-over-Year Delta
// ============================================================

/** Year-over-year delta result */
export interface YearOverYearDelta {
  currentYear: number;
  previousYear: number;
  currentValue: number;
  previousValue: number;
  deltaPercent: number;
  deltaDirection: 'up' | 'down' | 'flat';
  confidence: 'high' | 'partial' | 'mock-fallback';
}

// ============================================================
// 5. State Types
// ============================================================

/** Block-level data state */
export type DataState = 'loading' | 'data' | 'empty' | 'error';

/** Block-level state tracker */
export interface BlockState {
  state: DataState;
  lastError?: string;
  isMockFallback: boolean;
}
