// ============================================================
// dashboardApi.ts — Dashboard API integration with mock fallback
// Backend: M-009 integration endpoints
// Response shape: { success, message, data, timestamp } (NOT { ok, data })
// Entity field: totalTons (NOT totalTonnage)
// ============================================================

import api from './api';
import type {
  ApiResponse,
  Page,
  CargoAggregate,
  PeriodType,
  AssetStatusDto,
  HoSoXuLyTaiSanResponse,
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
  YearOverYearDelta,
  BlockState,
  DataState,
} from './dashboardTypes';
import { MOCK_DATA } from './dashboardMockData';

// ============================================================
// Base URLs
// ============================================================
const INTEGRATION_BASE = '/api/v1/integration/share';
const ASSET_BASE = '/api/v1/asset';

// ============================================================
// 8 Fetch Functions
// ============================================================

/**
 * Fetch annual cargo totals (E1: ports/cargo-total)
 * Returns: Page<CargoAggregate> with periodType=ANNUAL
 */
async function fetchCargoTotal(year: number): Promise<CargoAggregate[]> {
  const res = await api.get<ApiResponse<Page<CargoAggregate>>>(
    `${INTEGRATION_BASE}/ports/cargo-total?page=0&size=50`
  );
  if (!res.data.success) throw new Error(res.data.message || 'API returned unsuccessful response');
  const data = res.data.data;
  return data.content.filter((c) => c.periodStart.startsWith(String(year)));
}

/**
 * Fetch monthly cargo aggregates (E2: cargo/summary?periodType=MONTHLY)
 * Returns: Page<CargoAggregate> with periodType=MONTHLY
 */
async function fetchCargoMonthly(year: number): Promise<CargoAggregate[]> {
  const res = await api.get<ApiResponse<Page<CargoAggregate>>>(
    `${INTEGRATION_BASE}/cargo/summary?periodType=MONTHLY&page=0&size=50`
  );
  if (!res.data.success) throw new Error(res.data.message || 'API returned unsuccessful response');
  const data = res.data.data;
  return data.content.filter((c) => c.periodStart.startsWith(String(year)));
}

/**
 * Fetch annual cargo aggregates (E2: cargo/summary?periodType=ANNUAL)
 * Returns: Page<CargoAggregate> with periodType=ANNUAL
 */
async function fetchCargoAnnual(year: number): Promise<CargoAggregate[]> {
  const res = await api.get<ApiResponse<Page<CargoAggregate>>>(
    `${INTEGRATION_BASE}/cargo/summary?periodType=ANNUAL&page=0&size=200`
  );
  if (!res.data.success) throw new Error(res.data.message || 'API returned unsuccessful response');
  const data = res.data.data;
  return data.content.filter((c) => c.periodStart.startsWith(String(year)));
}

/**
 * Fetch passenger cargo aggregates (E2: cargo/summary?periodType=CARGO_PASSENGER)
 * Returns: Page<CargoAggregate> with periodType=CARGO_PASSENGER
 */
async function fetchCargoPassenger(year: number): Promise<CargoAggregate[]> {
  const res = await api.get<ApiResponse<Page<CargoAggregate>>>(
    `${INTEGRATION_BASE}/cargo/summary?periodType=CARGO_PASSENGER&page=0&size=200`
  );
  if (!res.data.success) throw new Error(res.data.message || 'API returned unsuccessful response');
  const data = res.data.data;
  return data.content.filter((c) => c.periodStart.startsWith(String(year)));
}

/**
 * Fetch domestic cargo aggregates (E2: cargo/summary?periodType=DOMESTIC)
 * Returns: Page<CargoAggregate> with periodType=DOMESTIC
 */
async function fetchCargoDomestic(year: number): Promise<CargoAggregate[]> {
  const res = await api.get<ApiResponse<Page<CargoAggregate>>>(
    `${INTEGRATION_BASE}/cargo/summary?periodType=DOMESTIC&page=0&size=200`
  );
  if (!res.data.success) throw new Error(res.data.message || 'API returned unsuccessful response');
  const data = res.data.data;
  return data.content.filter((c) => c.periodStart.startsWith(String(year)));
}

/**
 * Fetch managed area cargo aggregates (E2: cargo/summary?periodType=MANAGED_AREA)
 * Returns: Page<CargoAggregate> with periodType=MANAGED_AREA
 */
async function fetchCargoManagedArea(year: number): Promise<CargoAggregate[]> {
  const res = await api.get<ApiResponse<Page<CargoAggregate>>>(
    `${INTEGRATION_BASE}/cargo/summary?periodType=MANAGED_AREA&page=0&size=200`
  );
  if (!res.data.success) throw new Error(res.data.message || 'API returned unsuccessful response');
  const data = res.data.data;
  return data.content.filter((c) => c.periodStart.startsWith(String(year)));
}

/**
 * Fetch asset status summary (E3: assets/status)
 * Returns: AssetStatusDto
 */
async function fetchAssetStatus(): Promise<AssetStatusDto> {
  const res = await api.get<ApiResponse<AssetStatusDto>>(
    `${INTEGRATION_BASE}/assets/status`
  );
  if (!res.data.success) throw new Error(res.data.message || 'API returned unsuccessful response');
  return res.data.data;
}

/**
 * Fetch approval dossiers (E6: asset/ho-so-xu-ly)
 * Returns: Page<HoSoXuLyTaiSanResponse>
 */
async function fetchApprovals(
  page: number = 0,
  size: number = 200
): Promise<HoSoXuLyTaiSanResponse[]> {
  const res = await api.get<ApiResponse<Page<HoSoXuLyTaiSanResponse>>>(
    `${ASSET_BASE}/ho-so-xu-ly?page=${page}&size=${size}`
  );
  if (!res.data.success) throw new Error(res.data.message || 'API returned unsuccessful response');
  const data = res.data.data;
  // If there are more pages, fetch them (up to a reasonable limit of 2000 records)
  if (data.totalPages > 1 && page + 1 < data.totalPages && page < 10) {
    const nextBatch = await fetchApprovals(page + 1, size);
    return [...data.content, ...nextBatch];
  }
  return data.content;
}

interface ApprovalStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

/**
 * Fetch asset approval breakdown (Đã duyệt / Chờ duyệt / Từ chối)
 */
async function fetchAssetApprovalStats(): Promise<ApprovalStats> {
  try {
    const res = await api.get('/api/v1/dashboard/approval-asset');
    return res.data?.data || { total: 0, approved: 0, pending: 0, rejected: 0 };
  } catch { return { total: 0, approved: 0, pending: 0, rejected: 0 }; }
}

/**
 * Fetch KCHT approval breakdown (Đã duyệt / Chờ duyệt / Từ chối)
 */
async function fetchKchtApprovalStats(): Promise<ApprovalStats> {
  try {
    const res = await api.get('/api/v1/dashboard/approval-kcht');
    return res.data?.data || { total: 0, approved: 0, pending: 0, rejected: 0 };
  } catch { return { total: 0, approved: 0, pending: 0, rejected: 0 }; }
}

/**
 * Fetch year-over-year delta for a given metric
 * Returns: YearOverYearDelta
 */
async function fetchYearOverYear(
  year: number,
  periodType: PeriodType
): Promise<YearOverYearDelta> {
  const currentRes = await api.get<ApiResponse<Page<CargoAggregate>>>(
    `${INTEGRATION_BASE}/cargo/summary?periodType=${periodType}&page=0&size=200`
  );
  const currentData = currentRes.data.data.content.filter((c) =>
    c.periodStart.startsWith(String(year))
  );
  const previousRes = await api.get<ApiResponse<Page<CargoAggregate>>>(
    `${INTEGRATION_BASE}/cargo/summary?periodType=${periodType}&page=0&size=200`
  );
  const previousData = previousRes.data.data.content.filter((c) =>
    c.periodStart.startsWith(String(year - 1))
  );

  const currentTotal = currentData.reduce((sum, c) => sum + c.totalTons, 0);
  const previousTotal = previousData.reduce((sum, c) => sum + c.totalTons, 0);

  const deltaPercent =
    previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : 0;

  return {
    currentYear: year,
    previousYear: year - 1,
    currentValue: currentTotal,
    previousValue: previousTotal,
    deltaPercent: Math.round(deltaPercent * 10) / 10,
    deltaDirection: deltaPercent > 0 ? 'up' : deltaPercent < 0 ? 'down' : 'flat',
    confidence: currentData.length > 0 && previousData.length > 0 ? 'high' : 'mock-fallback',
  };
}

// ============================================================
// 6 Transform Functions
// ============================================================

/**
 * Transform cargo aggregates to hero KPI + KPI Card 1 data
 * Sums totalTons for hero KPI, vesselCount for KPI Card 1
 */
function transformCargoTotals(
  aggregates: CargoAggregate[],
  year: number
): { heroKpi: KpiWithSparkline; kpiCard1: KpiCardData } {
  const totalTons = aggregates.reduce((sum, c) => sum + c.totalTons, 0);
  const vesselCount = aggregates.reduce((sum, c) => sum + c.vesselCount, 0);

  return {
    heroKpi: {
      ...MOCK_DATA.heroKpi,
      value: totalTons || MOCK_DATA.heroKpi.value,
    },
    kpiCard1: {
      label: 'Lượt tàu qua cảng',
      value: vesselCount ? vesselCount.toLocaleString('vi-VN') : MOCK_DATA.kpiCards[0].value,
      deltaPercent: 8.9, // mock — needs previous year data for accurate YoY
      deltaDirection: 'up',
      sparklineData: MOCK_DATA.kpiCards[0].sparklineData,
      sparklineType: 'line',
    },
  };
}

/**
 * Transform monthly cargo aggregates to stacked bar series
 * Group by month and assign to 4 cargo types using mock ratios
 * (G-001: CargoAggregate has no cargo-type breakdown field)
 */
function transformMonthlyCargo(
  aggregates: CargoAggregate[],
  year: number
): MonthlyCargoSeries {
  const monthlyMap = new Map<number, CargoAggregate[]>();
  aggregates.forEach((c) => {
    const month = parseInt(c.periodStart.split('-')[1], 10);
    if (!monthlyMap.has(month)) monthlyMap.set(month, []);
    monthlyMap.get(month)!.push(c);
  });

  const mockRatios = { noiDia: 0.58, xuatKhau: 0.27, nhapKhau: 0.15, chuyenTai: 0.1 };
  const months = MOCK_DATA.stackedBar.months;

  const series = MOCK_DATA.stackedBar.series.map((orig, idx) => {
    const ratios = [0.58, 0.27, 0.15, 0.1];
    const data = months.map((_, mIdx) => {
      const monthData = monthlyMap.get(mIdx + 1);
      const monthTotal = monthData
        ? monthData.reduce((sum, c) => sum + c.totalTons, 0)
        : 0;
      return monthTotal > 0 ? Math.round(monthTotal * ratios[idx]) : orig.data[mIdx];
    });
    return { ...orig, data };
  });

  return { months, series };
}

/**
 * Transform passenger cargo aggregates to arrival/departure line series
 * (G-002: No direction field — uses portCode convention as fallback)
 */
function transformPassengerData(
  aggregates: CargoAggregate[],
  year: number
): PassengerMonthlySeries {
  const monthlyMap = new Map<number, CargoAggregate[]>();
  aggregates.forEach((c) => {
    const month = parseInt(c.periodStart.split('-')[1], 10);
    if (!monthlyMap.has(month)) monthlyMap.set(month, []);
    monthlyMap.get(month)!.push(c);
  });

  const months = MOCK_DATA.linePassenger.months;
  const arrival = months.map((_, mIdx) => {
    const monthData = monthlyMap.get(mIdx + 1);
    const totalVessels = monthData
      ? monthData.reduce((sum, c) => sum + c.vesselCount, 0)
      : 0;
    return totalVessels > 0 ? Math.round(totalVessels * 0.53) : MOCK_DATA.linePassenger.arrival[mIdx];
  });

  const departure = months.map((_, mIdx) => {
    const monthData = monthlyMap.get(mIdx + 1);
    const totalVessels = monthData
      ? monthData.reduce((sum, c) => sum + c.vesselCount, 0)
      : 0;
    return totalVessels > 0 ? Math.round(totalVessels * 0.47) : MOCK_DATA.linePassenger.departure[mIdx];
  });

  const peakMonthIdx = arrival.indexOf(Math.max(...arrival));
  return {
    months,
    arrival,
    departure,
    peak: { month: months[peakMonthIdx], value: arrival[peakMonthIdx] },
  };
}

/**
 * Transform asset status DTO to ring chart data
 * operating = assetsByStatus['PUBLISHED'], total = totalAssets
 */
function transformKchtRing(dto: AssetStatusDto): RingKchtData {
  const operatingCount = dto.assetsByStatus['PUBLISHED'] || 0;
  const totalCount = dto.totalAssets || 215;
  const percentage = totalCount > 0 ? Math.round((operatingCount / totalCount) * 100) : 0;

  return {
    operatingCount: operatingCount || MOCK_DATA.ringKcht.operatingCount,
    totalCount: totalCount || MOCK_DATA.ringKcht.totalCount,
    percentage: percentage || MOCK_DATA.ringKcht.percentage,
  };
}

/**
 * Transform vessel composition from multiple periodType aggregates
 * Group by periodType as donut segments
 */
function transformVesselComposition(
  annual: CargoAggregate[],
  passenger: CargoAggregate[],
  domestic: CargoAggregate[],
  managedArea: CargoAggregate[]
): DonutSegment[] {
  const annualVessels = annual.reduce((sum, c) => sum + c.vesselCount, 0);
  const passengerVessels = passenger.reduce((sum, c) => sum + c.vesselCount, 0);
  const domesticVessels = domestic.reduce((sum, c) => sum + c.vesselCount, 0);
  const managedAreaVessels = managedArea.reduce((sum, c) => sum + c.vesselCount, 0);

  return MOCK_DATA.donutPhuongTien.map((seg, idx) => ({
    ...seg,
    value: [annualVessels, passengerVessels, domesticVessels, managedAreaVessels][idx] || seg.value,
  }));
}

/**
 * Transform approval dossiers to H-Bar and Donut data
 * Group by tenTaiSan category + trangThaiHoSo
 * (G-009: No pre-aggregated endpoint — client-side grouping)
 */
function transformApprovalData(
  dossiers: HoSoXuLyTaiSanResponse[]
): { hBar: ApprovalByCategory[]; donut: DonutSegment[] } {
  const categoryMap = new Map<string, Map<string, number>>();
  dossiers.forEach((d) => {
    const cat = d.tenTaiSan || 'Khác';
    if (!categoryMap.has(cat)) categoryMap.set(cat, new Map());
    const statusCount = categoryMap.get(cat)!;
    statusCount.set(d.trangThaiHoSo, (statusCount.get(d.trangThaiHoSo) || 0) + 1);
  });

  const hBar: ApprovalByCategory[] = Array.from(categoryMap.entries())
    .map(([cat, statusMap]) => ({
      category: cat,
      approved: statusMap.get('DA_PHE_DUYET') || 0,
      pending: statusMap.get('CHO_PHE_DUYET') || 0,
      rejected: statusMap.get('TU_CHOI') || 0,
    }))
    .sort((a, b) => b.approved + b.pending + b.rejected - (a.approved + a.pending + a.rejected))
    .slice(0, 5);

  if (hBar.length === 0) {
    return { hBar: MOCK_DATA.hBarApproval, donut: MOCK_DATA.donutPheDuyet };
  }

  const statusCounts = { DA_PHE_DUYET: 0, CHO_PHE_DUYET: 0, TU_CHOI: 0 };
  dossiers.forEach((d) => {
    if (statusCounts.hasOwnProperty(d.trangThaiHoSo)) {
      statusCounts[d.trangThaiHoSo as keyof typeof statusCounts]++;
    }
  });

  const donut: DonutSegment[] = [
    {
      value: statusCounts.DA_PHE_DUYET || MOCK_DATA.donutPheDuyet[0].value,
      name: 'Đã duyệt',
      color: MOCK_DATA.donutPheDuyet[0].color,
    },
    {
      value: statusCounts.CHO_PHE_DUYET || MOCK_DATA.donutPheDuyet[1].value,
      name: 'Chờ duyệt',
      color: MOCK_DATA.donutPheDuyet[1].color,
    },
    {
      value: statusCounts.TU_CHOI || MOCK_DATA.donutPheDuyet[2].value,
      name: 'Từ chối',
      color: MOCK_DATA.donutPheDuyet[2].color,
    },
    {
      value: 718, // G-003: No DRAFT status in backend
      name: 'Lưu tạm',
      color: MOCK_DATA.donutPheDuyet[3].color,
    },
  ];

  return { hBar, donut };
}

// ============================================================
// Core: fetchAll with Promise.allSettled
// ============================================================

/**
 * Fetch all dashboard data in parallel with per-block fallback to mock data.
 * Each API call is independent — failure in one block does not affect others.
 */
async function fetchAll(
  filters: { year: number; province: string | null; infraType: string | null }
): Promise<{ data: DashboardData; states: Record<string, BlockState> }> {
  const { year } = filters;
  const states: Record<string, BlockState> = {};

  const [
    cargoTotal,
    cargoMonthly,
    cargoAnnual,
    cargoPassenger,
    cargoDomestic,
    cargoManagedArea,
    assetStatus,
    approvals,
  ] = await Promise.allSettled([
    fetchCargoTotal(year),
    fetchCargoMonthly(year),
    fetchCargoAnnual(year),
    fetchCargoPassenger(year),
    fetchCargoDomestic(year),
    fetchCargoManagedArea(year),
    fetchAssetStatus(),
    fetchApprovals(0, 500),
  ]);

  const data: Partial<DashboardData> = {};

  // Hero KPI + KPI Card 1 (from cargoTotal or cargoAnnual)
  if (cargoTotal.status === 'fulfilled') {
    const transformResult = transformCargoTotals(cargoTotal.value, year);
    data.heroKpi = transformResult.heroKpi;
    states.heroKpi = { state: 'data', isMockFallback: false };
  } else {
    data.heroKpi = MOCK_DATA.heroKpi;
    states.heroKpi = {
      state: 'error',
      isMockFallback: true,
      lastError: cargoTotal.reason?.message || 'API unavailable',
    };
    console.warn(
      `[Dashboard] Block 'heroKpi' falling back to mock data: ${cargoTotal.reason?.message || 'API unavailable'}`
    );
  }

  // KPI Cards
  const kpiCards: KpiCardData[] = [];

  if (cargoAnnual.status === 'fulfilled') {
    const transformResult = transformCargoTotals(cargoAnnual.value, year);
    kpiCards.push(transformResult.kpiCard1);
    states.kpiCard1 = { state: 'data', isMockFallback: false };
  } else {
    kpiCards.push(MOCK_DATA.kpiCards[0]);
    states.kpiCard1 = {
      state: 'error',
      isMockFallback: true,
      lastError: cargoAnnual.reason?.message || 'API unavailable',
    };
    console.warn(
      `[Dashboard] Block 'kpiCard1' falling back to mock data: ${cargoAnnual.reason?.message || 'API unavailable'}`
    );
  }

  // KPI Card 2 (Passenger)
  if (cargoPassenger.status === 'fulfilled') {
    const totalVessels = cargoPassenger.value.reduce((sum, c) => sum + c.vesselCount, 0);
    kpiCards.push({
      label: 'Lượt hành khách',
      value: totalVessels > 0 ? totalVessels.toLocaleString('vi-VN') : MOCK_DATA.kpiCards[1].value,
      deltaPercent: 15.6, // mock — needs previous year
      deltaDirection: 'up',
      sparklineData: MOCK_DATA.kpiCards[1].sparklineData,
      sparklineType: 'line',
    });
    states.kpiCard2 = { state: 'data', isMockFallback: false };
  } else {
    kpiCards.push(MOCK_DATA.kpiCards[1]);
    states.kpiCard2 = {
      state: 'error',
      isMockFallback: true,
      lastError: cargoPassenger.reason?.message || 'API unavailable',
    };
    console.warn(
      `[Dashboard] Block 'kpiCard2' falling back to mock data: ${cargoPassenger.reason?.message || 'API unavailable'}`
    );
  }

  // KPI Card 3 (KCHT operating ratio)
  if (assetStatus.status === 'fulfilled') {
    const ring = transformKchtRing(assetStatus.value);
    kpiCards.push({
      label: 'KCHT đang vận hành',
      value: `${ring.operatingCount}/${ring.totalCount}`,
      deltaPercent: ring.percentage,
      deltaDirection: 'up',
      isRatio: true,
      numerator: ring.operatingCount,
      denominator: ring.totalCount,
      sparklineData: MOCK_DATA.kpiCards[2].sparklineData, // G-005
      sparklineType: 'line',
    });
    states.kpiCard3 = { state: 'data', isMockFallback: false };
  } else {
    kpiCards.push(MOCK_DATA.kpiCards[2]);
    states.kpiCard3 = {
      state: 'error',
      isMockFallback: true,
      lastError: assetStatus.reason?.message || 'API unavailable',
    };
    console.warn(
      `[Dashboard] Block 'kpiCard3' falling back to mock data: ${assetStatus.reason?.message || 'API unavailable'}`
    );
  }

  // KPI Card 4 (Domestic vessels)
  if (cargoDomestic.status === 'fulfilled') {
    const totalVessels = cargoDomestic.value.reduce((sum, c) => sum + c.vesselCount, 0);
    kpiCards.push({
      label: 'Tổng lượt tàu & PT thủy',
      value: totalVessels > 0 ? totalVessels.toLocaleString('vi-VN') : MOCK_DATA.kpiCards[3].value,
      deltaPercent: 6.2, // mock
      deltaDirection: 'up',
      sparklineData: MOCK_DATA.kpiCards[3].sparklineData,
      sparklineType: 'bar',
    });
    states.kpiCard4 = { state: 'data', isMockFallback: false };
  } else {
    kpiCards.push(MOCK_DATA.kpiCards[3]);
    states.kpiCard4 = {
      state: 'error',
      isMockFallback: true,
      lastError: cargoDomestic.reason?.message || 'API unavailable',
    };
    console.warn(
      `[Dashboard] Block 'kpiCard4' falling back to mock data: ${cargoDomestic.reason?.message || 'API unavailable'}`
    );
  }

  data.kpiCards = kpiCards;

  // Alert Card
  const alertCount =
    approvals.status === 'fulfilled'
      ? approvals.value.filter((d) => d.trangThaiHoSo === 'CHO_PHE_DUYET').length
      : 0;

  data.alertCard = {
    pendingCount: alertCount > 0 ? alertCount : MOCK_DATA.alertCard.pendingCount,
    urgencyLabel: MOCK_DATA.alertCard.urgencyLabel,
    navigateTo: MOCK_DATA.alertCard.navigateTo,
  };
  states.alertCard = {
    state: approvals.status === 'fulfilled' ? 'data' : 'empty',
    isMockFallback: approvals.status !== 'fulfilled',
    lastError: approvals.status !== 'fulfilled' ? approvals.reason?.message : undefined,
  };

  // Stacked Bar (monthly cargo)
  if (cargoMonthly.status === 'fulfilled') {
    data.stackedBar = transformMonthlyCargo(cargoMonthly.value, year);
    states.stackedBar = { state: 'data', isMockFallback: false };
  } else {
    data.stackedBar = MOCK_DATA.stackedBar;
    states.stackedBar = {
      state: 'error',
      isMockFallback: true,
      lastError: cargoMonthly.reason?.message || 'API unavailable',
    };
    console.warn(
      `[Dashboard] Block 'stackedBar' falling back to mock data: ${cargoMonthly.reason?.message || 'API unavailable'}`
    );
  }

  // Donut Phuong Tien
  if (
    cargoAnnual.status === 'fulfilled' &&
    cargoPassenger.status === 'fulfilled' &&
    cargoDomestic.status === 'fulfilled' &&
    cargoManagedArea.status === 'fulfilled'
  ) {
    data.donutPhuongTien = transformVesselComposition(
      cargoAnnual.value,
      cargoPassenger.value,
      cargoDomestic.value,
      cargoManagedArea.value
    );
    states.donutPhuongTien = { state: 'data', isMockFallback: false };
  } else {
    data.donutPhuongTien = MOCK_DATA.donutPhuongTien;
    states.donutPhuongTien = {
      state: 'error',
      isMockFallback: true,
      lastError: 'One or more periodType APIs unavailable',
    };
    console.warn(
      "[Dashboard] Block 'donutPhuongTien' falling back to mock data: One or more periodType APIs unavailable"
    );
  }

  // Line Passenger
  if (cargoPassenger.status === 'fulfilled') {
    data.linePassenger = transformPassengerData(cargoPassenger.value, year);
    states.linePassenger = { state: 'data', isMockFallback: false };
  } else {
    data.linePassenger = MOCK_DATA.linePassenger;
    states.linePassenger = {
      state: 'error',
      isMockFallback: true,
      lastError: cargoPassenger.reason?.message || 'API unavailable',
    };
    console.warn(
      `[Dashboard] Block 'linePassenger' falling back to mock data: ${cargoPassenger.reason?.message || 'API unavailable'}`
    );
  }

  // Ring KCHT
  if (assetStatus.status === 'fulfilled') {
    data.ringKcht = transformKchtRing(assetStatus.value);
    states.ringKcht = { state: 'data', isMockFallback: false };
  } else {
    data.ringKcht = MOCK_DATA.ringKcht;
    states.ringKcht = {
      state: 'error',
      isMockFallback: true,
      lastError: assetStatus.reason?.message || 'API unavailable',
    };
    console.warn(
      `[Dashboard] Block 'ringKcht' falling back to mock data: ${assetStatus.reason?.message || 'API unavailable'}`
    );
  }

  // Radar Coverage (stays mock — G-004)
  data.radarCoverage = MOCK_DATA.radarCoverage;
  states.radarCoverage = {
    state: 'data',
    isMockFallback: true,
    lastError: 'G-004: No coverage endpoint',
  };

  // H-Bar Approval + Donut Phe Duyet
  if (approvals.status === 'fulfilled') {
    const { hBar, donut } = transformApprovalData(approvals.value);
    data.hBarApproval = hBar;
    data.donutPheDuyet = donut;
    states.hBarApproval = { state: 'data', isMockFallback: false };
    states.donutPheDuyet = { state: 'data', isMockFallback: false };
  } else {
    data.hBarApproval = MOCK_DATA.hBarApproval;
    data.donutPheDuyet = MOCK_DATA.donutPheDuyet;
    states.hBarApproval = {
      state: 'error',
      isMockFallback: true,
      lastError: approvals.reason?.message || 'API unavailable',
    };
    states.donutPheDuyet = {
      state: 'error',
      isMockFallback: true,
      lastError: approvals.reason?.message || 'API unavailable',
    };
    console.warn(
      `[Dashboard] Block 'hBarApproval' falling back to mock data: ${approvals.reason?.message || 'API unavailable'}`
    );
  }

  return { data: data as DashboardData, states };
}

// ============================================================
// fetchWithFallback — wrapper for direct usage
// ============================================================

/**
 * Wrapper for fetchAll — on top-level error, ALL blocks fall back to MOCK_DATA.
 */
async function fetchWithFallback(
  filters: { year: number; province: string | null; infraType: string | null },
  mockData: DashboardData
): Promise<{ data: DashboardData; states: Record<string, BlockState> }> {
  try {
    return await fetchAll(filters);
  } catch (error) {
    console.warn('[Dashboard] Global fetchAll error — falling back to mock data:', error);
    const states: Record<string, BlockState> = {};
    (Object.keys(mockData) as Array<keyof DashboardData>).forEach((key) => {
      states[key] = {
        state: 'error' as DataState,
        isMockFallback: true,
        lastError: 'Global fetchAll error',
      };
    });
    return { data: mockData, states };
  }
}

// ============================================================
// Public exports
// ============================================================

export const dashboardApi = {
  fetchAll,
  fetchWithFallback,
  fetchCargoTotal,
  fetchCargoMonthly,
  fetchCargoAnnual,
  fetchCargoPassenger,
  fetchCargoDomestic,
  fetchCargoManagedArea,
  fetchAssetStatus,
  fetchApprovals,
  fetchYearOverYear,
  fetchAssetApprovalStats,
  fetchKchtApprovalStats,
  transformCargoTotals,
  transformMonthlyCargo,
  transformPassengerData,
  transformKchtRing,
  transformVesselComposition,
  transformApprovalData,
};

export { MOCK_DATA };
