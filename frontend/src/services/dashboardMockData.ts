// ============================================================
// dashboardMockData.ts — All hardcoded mock data extracted from Home.tsx
// Preserves every constant from Home.tsx lines ~20-86 as typed DashboardData
// Source colors: tokens-dashboard.ts (sea0-sea3, stApproved, stPending, etc.)
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

// --- Color tokens from tokens-dashboard.ts ---
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
// HERO KPI — Sản lượng chủ đạo
// ============================================================
const heroKpi: KpiWithSparkline = {
  label: 'Sản lượng chủ đạo',
  value: 112480,
  unit: 'nghìn tấn',
  year: 2026,
  deltaPercent: 13.9,
  deltaDirection: 'up',
  previousYearValue: 98750,
  sparklineData: [6.2, 6.5, 7.1, 7.8, 8.4, 9.0, 9.6, 10.2, 10.8, 11.2, 11.6, 12.0],
};

// ============================================================
// KPI CARDS — 4 standard cards with sparklines
// ============================================================
const kpiCards: KpiCardData[] = [
  {
    label: 'Lượt tàu qua cảng',
    value: '28.450',
    deltaPercent: 8.9,
    deltaDirection: 'up',
    sparklineData: [18500, 19200, 21000, 22800, 23500, 24800, 25500, 25200, 24000, 26200, 27000, 28450],
    sparklineType: 'line',
  },
  {
    label: 'Lượt hành khách',
    value: '345.200',
    deltaPercent: 15.6,
    deltaDirection: 'up',
    sparklineData: [245000, 260000, 275000, 285000, 298000, 305000, 315000, 310000, 320000, 330000, 338000, 345200],
    sparklineType: 'line',
  },
  {
    label: 'KCHT đang vận hành',
    value: '187/215',
    deltaPercent: 87,
    deltaDirection: 'up',
    isRatio: true,
    numerator: 187,
    denominator: 215,
    sparklineData: [145, 152, 158, 163, 168, 172, 175, 178, 180, 183, 185, 187],
    sparklineType: 'line',
  },
  {
    label: 'Tổng lượt tàu & PT thủy',
    value: '75.877',
    deltaPercent: 6.2,
    deltaDirection: 'up',
    sparklineData: [58000, 59500, 61200, 63800, 65000, 66800, 68200, 67500, 69000, 71500, 73800, 75877],
    sparklineType: 'bar',
  },
];

// ============================================================
// ALERT CARD — Hồ sơ chờ duyệt
// ============================================================
const alertCard: AlertCardData = {
  pendingCount: 23,
  urgencyLabel: 'Cần xử lý hôm nay',
  navigateTo: '/asset/increase',
};

// ============================================================
// STACKED BAR — Hàng hóa thông qua cảng theo tháng
// ============================================================
const stackedBar: MonthlyCargoSeries = {
  months: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
  series: [
    { name: 'Nội địa', data: [5800, 5200, 6100, 6300, 6500, 6700, 6800, 6650, 6400, 6900, 7100, 7300], color: dataSea0 },
    { name: 'Xuất khẩu', data: [3400, 3000, 3600, 3800, 3900, 4000, 4100, 3950, 3800, 4200, 4300, 4500], color: dataSea1 },
    { name: 'Nhập khẩu', data: [2300, 2100, 2500, 2600, 2700, 2800, 2850, 2780, 2650, 2900, 3000, 3100], color: dataSea2 },
    { name: 'Chuyển tải', data: [1250, 1100, 1350, 1400, 1450, 1500, 1520, 1480, 1420, 1580, 1620, 1700], color: dataSea3 },
  ],
};

// ============================================================
// LINE PASSENGER — Hành khách Đến/Rời theo tháng
// ============================================================
const linePassenger: PassengerMonthlySeries = {
  months: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
  arrival: [26800, 22500, 28500, 29200, 30500, 31800, 32800, 32200, 30300, 33500, 34200, 35500],
  departure: [24200, 20500, 26000, 26800, 28000, 29300, 30200, 29700, 27800, 31000, 31800, 32800],
  peak: { month: 'T12', value: 35500 },
};

// ============================================================
// DONUT PHƯƠNG TIỆN — Cơ cấu lượt phương tiện
// ============================================================
const donutPhuongTien: DonutSegment[] = [
  { value: 12850, name: 'Tàu biển (cỡ lớn)', color: dataSea0 },
  { value: 9200, name: 'Tàu biển (cỡ nhỏ)', color: dataSea1 },
  { value: 15630, name: 'PT thủy NĐ (hàng hóa)', color: dataSea2 },
  { value: 12197, name: 'PT thủy NĐ (hành khách)', color: dataSea3 },
];

// ============================================================
// RING KCHT — Tỷ lệ KCHT vận hành
// ============================================================
const ringKcht: RingKchtData = {
  operatingCount: 187,
  totalCount: 215,
  percentage: 87,
};

// ============================================================
// RADAR — Mức độ bao phủ KCHT
// ============================================================
const radarCoverage: RadarIndicator[] = [
  { name: 'Cảng biển', value: 85, max: 100 },
  { name: 'Khu neo đậu', value: 62, max: 100 },
  { name: 'Luồng HH', value: 78, max: 100 },
  { name: 'Bến cảng', value: 90, max: 100 },
  { name: 'Khu chuyển tải', value: 45, max: 100 },
];

// ============================================================
// H-BAR — Phê duyệt theo hạng mục
// ============================================================
const hBarApproval: ApprovalByCategory[] = [
  { category: 'Cảng biển', approved: 15, pending: 8, rejected: 3 },
  { category: 'Khu neo đậu', approved: 22, pending: 5, rejected: 2 },
  { category: 'Luồng HH', approved: 28, pending: 3, rejected: 1 },
  { category: 'Bến cảng', approved: 18, pending: 6, rejected: 3 },
  { category: 'Khu chuyển tải', approved: 7, pending: 4, rejected: 2 },
];

// ============================================================
// DONUT PHÊ DUYỆT — Trạng thái đề nghị phê duyệt
// ============================================================
const donutPheDuyet: DonutSegment[] = [
  { value: 2140, name: 'Đã duyệt', color: approvalApproved },
  { value: 892, name: 'Chờ duyệt', color: approvalPending },
  { value: 426, name: 'Từ chối', color: approvalRejected },
  { value: 718, name: 'Lưu tạm', color: statusDraft },
];

// ============================================================
// MASTER MOCK_DATA EXPORT
// ============================================================

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
