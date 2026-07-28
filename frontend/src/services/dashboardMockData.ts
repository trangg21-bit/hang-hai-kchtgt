// ============================================================
// dashboardMockData.ts — Zero-value fallback data.
// BA spec G-001..G-009 gaps are backend limitations — frontend
// shows 0 rather than fabricated numbers. Real data comes from
// M-009 integration APIs (kchtgt_cargo_aggregates) and
// asset-processing endpoints.
// ============================================================

import type {
  DashboardData,
  KpiWithSparkline,
  KpiCardData,
  AlertCardData,
  MonthlyCargoSeries,
  PassengerMonthlySeries,
  DonutSegment,
  RingKchtData,
  RadarIndicator,
  ApprovalByCategory,
} from './dashboardTypes';

// --- Color tokens (keep for chart rendering structure) ---
import {
  dataSea0,
  dataSea1,
  dataSea2,
  dataSea3,
  approvalApproved,
  approvalPending,
  approvalRejected,
  statusDraft,
} from '../tokens-dashboard';

// ============================================================
// All values are 0 — no fabricated data.
// ============================================================

const EMPTY_MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
const ZERO12 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const heroKpi: KpiWithSparkline = {
  label: 'Sản lượng chủ đạo',
  value: 0,
  unit: 'nghìn tấn',
  year: 2026,
  deltaPercent: 0,
  deltaDirection: 'up',
  previousYearValue: 0,
  sparklineData: ZERO12,
};

const kpiCards: KpiCardData[] = [
  { label: 'Lượt tàu qua cảng', value: '0', deltaPercent: 0, deltaDirection: 'up', sparklineData: ZERO12, sparklineType: 'line' },
  { label: 'Lượt hành khách', value: '0', deltaPercent: 0, deltaDirection: 'up', sparklineData: ZERO12, sparklineType: 'line' },
  { label: 'KCHT đang vận hành', value: '0/0', deltaPercent: 0, deltaDirection: 'up', isRatio: true, numerator: 0, denominator: 0, sparklineData: ZERO12, sparklineType: 'line' },
  { label: 'Tổng lượt tàu & PT thủy', value: '0', deltaPercent: 0, deltaDirection: 'up', sparklineData: ZERO12, sparklineType: 'bar' },
];

const alertCard: AlertCardData = {
  pendingCount: 0,
  urgencyLabel: 'Cần xử lý',
  navigateTo: '/asset/increase',
};

const stackedBar: MonthlyCargoSeries = {
  months: EMPTY_MONTHS,
  series: [
    { name: 'Nội địa', data: ZERO12, color: dataSea0 },
    { name: 'Xuất khẩu', data: ZERO12, color: dataSea1 },
    { name: 'Nhập khẩu', data: ZERO12, color: dataSea2 },
    { name: 'Chuyển tải', data: ZERO12, color: dataSea3 },
  ],
};

const linePassenger: PassengerMonthlySeries = {
  months: EMPTY_MONTHS,
  arrival: ZERO12,
  departure: ZERO12,
};

const donutPhuongTien: DonutSegment[] = [
  { value: 0, name: 'Tàu biển (cỡ lớn)', color: dataSea0 },
  { value: 0, name: 'Tàu biển (cỡ nhỏ)', color: dataSea1 },
  { value: 0, name: 'PT thủy NĐ (hàng hóa)', color: dataSea2 },
  { value: 0, name: 'PT thủy NĐ (hành khách)', color: dataSea3 },
];

const ringKcht: RingKchtData = {
  operatingCount: 0,
  totalCount: 0,
  percentage: 0,
};

const radarCoverage: RadarIndicator[] = [
  { name: 'Cảng biển', value: 0, max: 100 },
  { name: 'Khu neo đậu', value: 0, max: 100 },
  { name: 'Luồng HH', value: 0, max: 100 },
  { name: 'Bến cảng', value: 0, max: 100 },
  { name: 'Khu chuyển tải', value: 0, max: 100 },
];

const hBarApproval: ApprovalByCategory[] = [];

const donutPheDuyet: DonutSegment[] = [
  { value: 0, name: 'Đã duyệt', color: approvalApproved },
  { value: 0, name: 'Chờ duyệt', color: approvalPending },
  { value: 0, name: 'Từ chối', color: approvalRejected },
  { value: 0, name: 'Lưu tạm', color: statusDraft },
];

export const MOCK_DATA: DashboardData = {
  heroKpi,
  kpiCards,
  alertCard,
  stackedBar,
  donutPhuongTien,
  linePassenger,
  ringKcht,
  radarCoverage,
  hBarApproval,
  donutPheDuyet,
};
