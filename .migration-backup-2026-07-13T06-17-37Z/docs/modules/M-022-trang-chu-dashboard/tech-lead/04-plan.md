---
feature-id: M-022
stage: execution-planning
agent: engineering-technical-lead
verdict: Pass
waves: 2
last-updated: 2026-07-10
---

# M-022 Trang chủ Dashboard — Execution Plan (API Integration Phase 2)

## Change Overview

Replace 100% hardcoded inline mock data in `frontend/src/pages/Home.tsx` with real backend API calls from M-009 integration endpoints, using a typed service layer (`dashboardTypes.ts` + `dashboardMockData.ts` + `dashboardApi.ts`). The approach uses per-block `Promise.allSettled` with graceful degradation: on any API failure, that block falls back to preserved mock data. Only the frontend data layer changes; no backend modifications, no new React components, no refactoring of ECharts rendering.

Current state (`Home.tsx`) imports `fetchYearOverYear` and `YearOverYearData` from `../services/dashboardApi` but only uses it for the Hero KPI's tonnage/vessel/passenger values and their deltas — all 9 chart blocks (stacked bar, line, donut×2, ring, radar, H-bar, alert card, sparklines) remain 100% inline mock constants.

---

## Requirement-to-Execution Mapping

| BA Spec § | Requirement | Execution Task |
|-----------|------------|----------------|
| §1.4 | CargoAggregate interface (totalTons, not totalTonnage) | T1: dashboardTypes.ts |
| §1.5 | AssetStatusDto interface | T1: dashboardTypes.ts |
| §1.6 | HoSoXuLyTaiSanResponse interface | T1: dashboardTypes.ts |
| §1.7 | ComprehensiveInfoDto interface | T1: dashboardTypes.ts |
| §2.1 | API client interfaces (ApiResponse<T>, Page<T>) | T1: dashboardTypes.ts |
| §2.2 | Dashboard view model interfaces (DashboardData, KpiWithSparkline, etc.) | T1: dashboardTypes.ts |
| §6.2 | BlockState, DataState types | T1: dashboardTypes.ts |
| §7.4 | MOCK_DATA constant preserving all hardcoded values | T2: dashboardMockData.ts |
| §1.8 | API fetch functions for E1-E6 | T3: dashboardApi.ts |
| §3.1 | Data pipeline — FilterContext → useEffect → dashboardApi.fetchAll() | T4: Home.tsx wiring |
| §3.2-3.7 | Transform functions (per-block data transformation) | T3: dashboardApi.ts |
| §4.1-4.3 | Year-over-Year delta computation | T3: dashboardApi.ts |
| §5.3 | useFilter() + useState<DashboardData> + useEffect pattern | T4: Home.tsx wiring |
| §6.2 | Per-block state visualization (loading/empty/error/mock badge) | T4: Home.tsx wiring |
| §6.3 | Per-block independent loading with Promise.allSettled | T3: dashboardApi.ts + T4 |
| §7.3 | Fallback strategy — attempt API → on failure → mock fallback | T3: dashboardApi.ts |

---

## Implementation Scope

### Files to CREATE (3)

| File | Purpose | Owner |
|------|---------|-------|
| `frontend/src/services/dashboardTypes.ts` | All TypeScript interfaces (API response wrappers, domain entities, dashboard view models, state types) | Wave 1 — engineering-frontend-developer |
| `frontend/src/services/dashboardMockData.ts` | All pre-existing mock data organized as typed `DashboardData` object preserving every hardcoded array/constant from Home.tsx | Wave 1 — engineering-frontend-developer |
| `frontend/src/services/dashboardApi.ts` | Typed fetch functions, transform pipelines, `fetchAll()`, `fetchWithFallback()` | Wave 1 — engineering-frontend-developer |

### Files to MODIFY (1)

| File | Change scope | Owner |
|------|-------------|-------|
| `frontend/src/pages/Home.tsx` | Replace 100% of inline mock constants with `useFilter()` + `useEffect` + `dashboardApi.fetchAll()`. Remove ~120 lines of constants, keep ECharts option builders and JSX rendering | Wave 2 — engineering-frontend-developer |

### Files NOT to touch

- `frontend/src/context/FilterContext.tsx` — Already correct (provides `{year, province, infraType, setYear, setProvince, setInfraType}`)
- `frontend/src/components/FilterBar.tsx` — Works correctly
- `frontend/src/components/KpiCard.tsx` — Not used by Home.tsx (Home uses inline cards); keep as-is
- `frontend/src/components/TrendChartCard.tsx` — Already handles loading/empty/error onRetry props
- `frontend/src/tokens-dashboard.ts` — Design tokens are correct and stable
- Any backend code

---

## Impacted Areas

| Area | Impact | Detail |
|------|--------|--------|
| `frontend/src/services/dashboardApi.ts` | **EXISTING FILE — REWRITE** | Current file uses `totalTonnage` (wrong field), different response shape `{ok, data}`, and only implements 3 fetch functions. Must be fully replaced with BA-spec-compliant version |
| `frontend/src/services/` | **3 new files** | Add `dashboardTypes.ts`, `dashboardMockData.ts` |
| `frontend/src/pages/Home.tsx` | **~40% code change** | Remove all inline constants (MOCK_TONNAGE, SPARK_LUOT_TAU, CARGO_NOI_DIA, HBAR_DA_DUYET, etc.), add 3 state hooks |
| `frontend/src/context/FilterContext.tsx` | **No change** | Already exports `useFilter()` with `year, province, infraType` |
| Backend / DevOps | **No change required** | All APIs from M-009 should already be deployed. No new env vars, schema migrations, or infra changes needed. **DevOps review: NOT required** |

---

## Data Flow Architecture

```
FilterBar.onChange()
  → FilterContext.setState({ year, province, infraType })
    → Home.tsx re-renders
      → useEffect([year, province, infraType])
        → setBlockStates({ all: 'loading' })
        → const result = await dashboardApi.fetchAll({ year, province, infraType })
          ┌─ Promise.allSettled([
          │     fetchCargoTotal(year),           // E1 → Hero KPI + sparkline
          │     fetchCargoMonthly(year),          // E2(MONTHLY) → Stacked Bar sparklines
          │     fetchCargoAnnual(year),           // E2(ANNUAL) → KPI Card 1 + YoY
          │     fetchCargoPassenger(year),        // E2(CARGO_PASSENGER) → KPI Card 2 + Line chart
          │     fetchCargoDomestic(year),          // E2(DOMESTIC) → KPI Card 4
          │     fetchCargoManagedArea(year),      // E2(MANAGED_AREA) → Donut segment
          │     fetchAssetStatus(),               // E3 → KPI Card 3 + Ring
          │     fetchApprovals(page, size),       // E6 → Alert card + H-Bar + Donut
          │   ])
          │   → For each settled result:
          │     fulfilled → transformCargoTotals(value)  → DashboardData.heroKpi
          │     fulfilled → transformMonthlyCargo(value) → DashboardData.stackedBar
          │     fulfilled → transformPassengerData(value)→ DashboardData.linePassenger
          │     fulfilled → transformKchtRing(value)     → DashboardData.ringKcht + kpiCard3
          │     fulfilled → transformApprovalData(value) → DashboardData.hBarApproval + donutPheDuyet
          │     rejected → MOCK_DATA[block] + setBlockState[block] = { isMockFallback: true }
          └─ → setDashboardData(result) + setBlockStates(all 'data'/'mock')
            → ECharts re-renders from dashboardData
```

### Priority Order (Load Sequence)

| Priority | Block | API | Visual Position |
|----------|-------|-----|-----------------|
| P0 (above-fold) | Hero KPI (Sản lượng) | E1 | Row 1, Card 1 |
| P0 (above-fold) | KPI Card 1 (Lượt tàu) | E2 ANNUAL | Row 1, Card 2 |
| P0 (above-fold) | KPI Card 2 (Hành khách) | E2 CARGO_PASSENGER | Row 1, Card 3 |
| P0 (above-fold) | KPI Card 3 (KCHT) | E3 | Row 1, Card 4 |
| P0 (above-fold) | KPI Card 4 (PT thủy) | E2 DOMESTIC | Row 1, Card 5 |
| P0 (above-fold) | Alert Card | E6 | Row 1, Card 6 |
| P1 (below-fold) | Stacked Bar (Hàng hóa) | E2 MONTHLY | Row 2 |
| P1 (below-fold) | Donut (Cơ cấu phương tiện) | E2 all periodTypes | Row 2 |
| P1 (below-fold) | Line Chart (Hành khách) | E2 CARGO_PASSENGER | Row 3 |
| P1 (below-fold) | Ring (KCHT vận hành) | E3 | Row 3 |
| P1 (below-fold) | Radar (Độ bao phủ) | E3 + E7-E9 | Row 4 |
| P1 (below-fold) | H-Bar (Phê duyệt) | E6 | Row 4 |
| P1 (below-fold) | Donut (Trạng thái phê duyệt) | E6 | Row 4 |

All P0 and P1 blocks are fetched in a single `Promise.allSettled` call. P0 blocks receive CSS `content-visibility: auto` priority from the browser's rendering pipeline (they're in the initial viewport). The `Promise.allSettled` approach means partial results render as soon as each promise settles — not waiting for all.

---

## Gap-Aware Design

### Blocking Gaps (blocks stay mock until backend resolves)

| Gap ID | Block | Issue | Fallback Behavior |
|--------|-------|-------|-------------------|
| G-001 | Stacked Bar (4 cargo types) | CargoAggregate has no cargo-type breakdown | Call E2 MONTHLY, then split totalTons using hardcoded mock ratios (58% Nội địa, 27% Xuất khẩu, 15% Nhập khẩu → actual import from MOCK_DATA.stackedBar) |
| G-003 | Donut "Lưu tạm" (718) | No DRAFT status in backend enum | Donut shows 3 backend statuses + hardcoded 718 from MOCK_DATA for "Lưu tạm" |
| G-004 | Radar (coverage %) | No "expected max" endpoint | Hardcoded [85, 62, 78, 90, 45] from MOCK_DATA |
| G-009 | H-Bar + Donut (aggregation) | No pre-aggregated approval endpoint | Fetch all records from E6 with page=0&size=500, group by tenTaiSan + trangThaiHoSo client-side |

### High Gaps (degraded but functional)

| Gap ID | Block | Issue | Degraded Behavior |
|--------|-------|-------|-------------------|
| G-002 | Line Chart (arrival/departure) | No direction field | Show single line from passenger data; arrival/departure split stays mock |
| G-005 | KPI Card 3 sparkline | No monthly KCHT trend | Sparkline stays mock |
| G-007 | Province filter | No province→portCode mapping | Province filter degrades gracefully (deps include province but APIs don't use it yet) |

---

## Task Breakdown

### Wave 1 — Foundation (API Service Layer)

*Parallelizable: all 3 tasks can be done simultaneously by a single developer (they share types via dashboardTypes.ts which is created first).*

| Task ID | Task | Description | Files | Owner | Effort | Wave | Parallel | Risk |
|---------|------|-------------|-------|-------|--------|------|----------|------|
| T1 | Create `dashboardTypes.ts` | Define ~20 TypeScript interfaces + types: ApiResponse<T>, Page<T>, CargoAggregate, PeriodType, AssetStatusDto, HoSoXuLyTaiSanResponse, TrangThaiHoSo, ComprehensiveInfoDto, DashboardData, KpiWithSparkline, KpiCardData, AlertCardData, MonthlyCargoSeries, PassengerMonthlySeries, DonutSegment, RingKchtData, RadarIndicator, ApprovalByCategory, YearOverYearDelta, DataState, BlockState | `frontend/src/services/dashboardTypes.ts` | engineering-frontend-developer | S | 1 | Yes (with T2) | Low — pure types |
| T2 | Create `dashboardMockData.ts` | Extract all inline mock constants from Home.tsx (MOCK_TONNAGE, SPARK_LUOT_TAU, CARGO_NOI_DIA, HBAR_DA_DUYET, PASS_DEN_CANG, etc.) into a single `export const MOCK_DATA: DashboardData = { ... }` object. Every hardcoded array preserved exactly. | `frontend/src/services/dashboardMockData.ts` | engineering-frontend-developer | S | 1 | Yes (depends T1) | Low — pure data |
| T3 | Create `dashboardApi.ts` | Typed fetch functions for E1-E6, 8 fetch functions, 6 transform functions, `fetchAll()` with Promise.allSettled, `fetchWithFallback()`, YoY delta computation. Must use `totalTons` (not `totalTonnage`). Uses `api` from `../api.ts` (axios) or plain `fetch`. Must handle ApiResponse wrapper. | `frontend/src/services/dashboardApi.ts` | engineering-frontend-developer | M | 1 | No (depends T1, T2) | Medium — response shape matching |

### Wave 2 — Integration (Home.tsx Wiring)

| Task ID | Task | Description | Files | Owner | Effort | Wave | Parallel | Risk |
|---------|------|-------------|-------|-------|--------|------|----------|------|
| T4 | Wire `Home.tsx` to API layer | Replace all inline mock constants with `useFilter()` + `useEffect` + `dashboardApi.fetchAll()`. Add state hooks: `const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)`, `const [blockStates, setBlockStates] = useState<Record<string, BlockState>>({})`. Add per-block rendering with BlockState visualization (Skeleton for loading, Empty for empty, Badge+ECharts for mock/error). | `frontend/src/pages/Home.tsx` | engineering-frontend-developer | M | 2 | No (depends Wave 1) | High — touches live rendering path |

### Task Dependencies

```
T1 (types) ──→ T2 (mock data) ──→ T3 (api) ──→ T4 (Home.tsx)
                   ↕ (shared types)
```

---

## Execution Sequence

1. **Wave 1 — Create T1**: Developer creates `dashboardTypes.ts` with all BA-spec interfaces. This is the dependency for T2 and T3.
2. **Wave 1 — Create T2 and T3**: After T1, developer creates `dashboardMockData.ts` (moves inline mock data) and `dashboardApi.ts` (all fetch + transform + fallback functions). T2 and T3 are independent of each other.
3. **Wave 2 — Modify Home.tsx**: Developer rewrites Home.tsx data layer. No visual change — only data source changes.

---

## File Change Specifications

### T1: `frontend/src/services/dashboardTypes.ts` (CREATE — new file)

**Exports** (all interfaces/types — ~25 named exports):

```typescript
// API Response Envelope
export interface ApiResponse<T> { success: boolean; message: string; data: T; timestamp: string; }
export interface Page<T> { content: T[]; page: number; size: number; totalElements: number; totalPages: number; }

// Domain Entities
export interface CargoAggregate { id?: string; portCode: string; periodType: PeriodType; periodStart: string; periodEnd: string; totalTons: number; totalTeus: number; vesselCount: number; }
export type PeriodType = 'MONTHLY' | 'ANNUAL' | 'CARGO_PASSENGER' | 'DOMESTIC' | 'MANAGED_AREA';
export interface AssetStatusDto { totalPoints: number; totalLines: number; totalPolygons: number; totalAssets: number; pointsByType: Record<string, number>; linesByType: Record<string, number>; polygonsByType: Record<string, number>; assetsByStatus: Record<string, number>; }
export interface HoSoXuLyTaiSanResponse { id: string; taiSanId: string; tenTaiSan: string; loaiXuLy: string; moTa: string; trangThaiHoSo: TrangThaiHoSo; createdBy: string; createdByName: string; createdAt: string; updatedAt: string; }
export type TrangThaiHoSo = 'CHO_PHE_DUYET' | 'DA_PHE_DUYET' | 'TU_CHOI';
export interface ComprehensiveInfoDto { totalAssets: number; totalDataConnections: number; connectionsByStatus: Record<string, number>; totalSyncJobsRun: number; syncJobsByStatus: Record<string, number>; systemTime: string; }

// Dashboard View Models
export interface DashboardData { heroKpi: KpiWithSparkline; kpiCards: KpiCardData[]; alertCard: AlertCardData; stackedBar: MonthlyCargoSeries; donutPhuongTien: DonutSegment[]; linePassenger: PassengerMonthlySeries; ringKcht: RingKchtData; radarCoverage: RadarIndicator[]; hBarApproval: ApprovalByCategory[]; donutPheDuyet: DonutSegment[]; }
export interface KpiWithSparkline { label: string; value: number; unit: string; year: number; deltaPercent: number; deltaDirection: 'up' | 'down'; previousYearValue: number; sparklineData: number[]; }
export interface KpiCardData { label: string; value: string | number; deltaPercent?: number; deltaDirection?: 'up' | 'down'; isRatio?: boolean; numerator?: number; denominator?: number; sparklineData?: number[]; sparklineType?: 'line' | 'bar'; }
export interface AlertCardData { pendingCount: number; urgencyLabel: string; navigateTo: string; }
export interface MonthlyCargoSeries { months: string[]; series: { name: string; data: number[]; color: string; }[]; }
export interface PassengerMonthlySeries { months: string[]; arrival: number[]; departure: number[]; peak?: { month: string; value: number; }; }
export interface DonutSegment { value: number; name: string; color: string; }
export interface RingKchtData { operatingCount: number; totalCount: number; percentage: number; }
export interface RadarIndicator { name: string; value: number; max: number; }
export interface ApprovalByCategory { category: string; approved: number; pending: number; rejected: number; }

// Year-over-Year
export interface YearOverYearDelta { currentYear: number; previousYear: number; currentValue: number; previousValue: number; deltaPercent: number; deltaDirection: 'up' | 'down' | 'flat'; confidence: 'high' | 'partial' | 'mock-fallback'; }

// State Types
export type DataState = 'loading' | 'data' | 'empty' | 'error';
export interface BlockState { state: DataState; lastError?: string; isMockFallback: boolean; }
```

### T2: `frontend/src/services/dashboardMockData.ts` (CREATE — new file)

**Imports**: `DashboardData` from `./dashboardTypes`, and color tokens from `../tokens-dashboard`

**Exports**: `export const MOCK_DATA: DashboardData = { heroKpi, kpiCards, alertCard, stackedBar, donutPhuongTien, linePassenger, ringKcht, radarCoverage, hBarApproval, donutPheDuyet }`

**Content**: Every hardcoded value from Home.tsx lines ~20-86 must be preserved exactly:
- `HERO_SPARK` → `MOCK_DATA.heroKpi.sparklineData`
- `SPARK_LUOT_TAU` → `MOCK_DATA.kpiCards[0].sparklineData`
- `SPARK_HANH_KHACH` → `MOCK_DATA.kpiCards[1].sparklineData`
- `SPARK_KCHT` → `MOCK_DATA.kpiCards[2].sparklineData`
- `SPARK_PT_THUY` → `MOCK_DATA.kpiCards[3].sparklineData`
- `CARGO_NOI_DIA` → `MOCK_DATA.stackedBar.series[0].data`
- `CARGO_XUAT_KHAU` → `MOCK_DATA.stackedBar.series[1].data`
- `CARGO_NHAP_KHAU` → `MOCK_DATA.stackedBar.series[2].data`
- `CARGO_CHUYEN_TAI` → `MOCK_DATA.stackedBar.series[3].data`
- `PASS_DEN_CANG` → `MOCK_DATA.linePassenger.arrival`
- `PASS_ROI_CANG` → `MOCK_DATA.linePassenger.departure`
- `HBAR_CATEGORIES` + `HBAR_DA_DUYET`/`HBAR_CHO_DUYET`/`HBAR_TU_CHOI` → `MOCK_DATA.hBarApproval`
- Donut data (12850, 9200, 15630, 12197) → `MOCK_DATA.donutPhuongTien`
- Donut phê duyệt (2140, 892, 426, 718) → `MOCK_DATA.donutPheDuyet`
- Radar [85, 62, 78, 90, 45] → `MOCK_DATA.radarCoverage`
- Ring 87/187/215 → `MOCK_DATA.ringKcht`
- Alert 23 → `MOCK_DATA.alertCard`
- Hero value 112480, 13.9% delta → `MOCK_DATA.heroKpi`

Each donut segment and stacked bar series must reference the actual color constants from `../tokens-dashboard` (sea0, sea1, stApproved, etc.) — do NOT hardcode hex values.

### T3: `frontend/src/services/dashboardApi.ts` (REWRITE — existing file at same path)

**Current file removed; replaced with BA-spec-compliant version.**

**Imports**: `ApiResponse, Page, CargoAggregate, AssetStatusDto, HoSoXuLyTaiSanResponse, DashboardData, KpiWithSparkline, KpiCardData, AlertCardData, MonthlyCargoSeries, PassengerMonthlySeries, DonutSegment, RingKchtData, RadarIndicator, ApprovalByCategory, YearOverYearDelta, BlockState, DataState, PeriodType` from `./dashboardTypes`, `MOCK_DATA` from `./dashboardMockData`

**Exports**:
```typescript
export const dashboardApi = {
  async fetchAll(filters: { year: number; province: string | null; infraType: string | null }): Promise<{ data: DashboardData; states: Record<string, BlockState> }>,
  async fetchCargoTotal(year: number): Promise<CargoAggregate[]>,
  async fetchCargoMonthly(year: number): Promise<CargoAggregate[]>,
  async fetchCargoAnnual(year: number): Promise<CargoAggregate[]>,
  async fetchCargoPassenger(year: number): Promise<CargoAggregate[]>,
  async fetchCargoDomestic(year: number): Promise<CargoAggregate[]>,
  async fetchCargoManagedArea(year: number): Promise<CargoAggregate[]>,
  async fetchAssetStatus(): Promise<AssetStatusDto>,
  async fetchApprovals(page?: number, size?: number): Promise<HoSoXuLyTaiSanResponse[]>,
  async fetchWithFallback(filters: { year: number; province: string | null; infraType: string | null }, mockData: DashboardData): Promise<{ data: DashboardData; states: Record<string, BlockState> }>,
}

// Transform functions (internal — not exported)
function transformCargoTotals(aggregates: CargoAggregate[], year: number): { heroKpi: KpiWithSparkline; kpiCard1: KpiCardData }
function transformMonthlyCargo(aggregates: CargoAggregate[], year: number): MonthlyCargoSeries
function transformPassengerData(aggregates: CargoAggregate[], year: number): PassengerMonthlySeries
function transformKchtRing(dto: AssetStatusDto): RingKchtData
function transformAssetStatusToKpiCard3(dto: AssetStatusDto): KpiCardData
function transformApprovalData(dossiers: HoSoXuLyTaiSanResponse[]): { hBar: ApprovalByCategory[]; donut: DonutSegment[] }
function computeYearOverYear(current: CargoAggregate[], previous: CargoAggregate[]): number
function computeDelta(current: number, previous: number): { deltaPercent: number; deltaDirection: 'up' | 'down' | 'flat' }
```

**Key implementation details for T3**:
1. Use `api` (axios instance from `../api.ts`) for consistency with the rest of the app — it auto-attaches auth token and handles 401/403 globally. If `api` breaks on the integration endpoints, fall back to `fetch()`.
2. All fetch functions MUST unwrap `ApiResponse<Page<T>>` → extract `response.data.content`
3. The `transformCargoTotals` function sums `totalTons` (NOT `totalTonnage`) from all entries where `periodStart.startsWith(String(year))`
4. For KPI Card 3 (KCHT): operating = `assetsByStatus["PUBLISHED"]`, total = `totalAssets`
5. For Alert Card: pendingCount = Page.totalElements from E6 with `trangThaiHoSo=CHO_PHE_DUYET` filter (if supported) or first page
6. G-001 affected blocks (Stacked Bar): attempt MONTHLY call, split by mock ratios if no cargo-type field
7. G-002 affected blocks (Line Chart): attempt CARGO_PASSENGER, show single line, arrival/departure split stays mock
8. G-003 affected blocks (Donut 2): 3 backend statuses + hardcoded 718 for "Lưu tạm"
9. G-004 affected blocks (Radar): stays 100% mock
10. G-009 affected blocks (H-Bar + Donut 2): fetch all from E6 (page 0, size 500), group client-side
11. `fetchAll()` uses `Promise.allSettled` with 8 parallel calls
12. `fetchWithFallback()` processes each settled result: fulfilled → transform → data, rejected → MOCK_DATA[block]

### T4: `frontend/src/pages/Home.tsx` (MODIFY — existing file)

**Current imports to REMOVE** (~8 lines):
```typescript
import { fetchYearOverYear, type YearOverYearData } from '../services/dashboardApi';
```

**New imports to ADD**:
```typescript
import { dashboardApi } from '../services/dashboardApi';
import type { DashboardData, BlockState, DataState } from '../services/dashboardTypes';
import { MOCK_DATA } from '../services/dashboardMockData';
```

**Current constants to REMOVE** (lines ~20-86 — ~15 named constants):
- `MOCK_TONNAGE`, `MOCK_VESSELS`, `MOCK_PASSENGERS`, `MOCK_TONNAGE_DELTA`, `MOCK_VESSEL_DELTA`, `MOCK_PASSENGER_DELTA`
- `SPARK_LUOT_TAU`, `SPARK_HANH_KHACH`, `SPARK_KCHT`, `SPARK_PT_THUY`
- `HERO_SPARK`
- `CARGO_NOI_DIA`, `CARGO_XUAT_KHAU`, `CARGO_NHAP_KHAU`, `CARGO_CHUYEN_TAI`
- `PASS_DEN_CANG`, `PASS_ROI_CANG`
- `HBAR_CATEGORIES`, `HBAR_DA_DUYET`, `HBAR_CHO_DUYET`, `HBAR_TU_CHOI`

**Current state to REPLACE** (lines ~91-125):
```typescript
// REMOVE the entire useState + useEffect block starting at:
// "const [yoyData, setYoyData] = useState<YearOverYearData | null>(null);"
// "const [loading, setLoading] = useState(true);"
// and the associated useEffect + derived KPI values

// REPLACE WITH:
const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
const [blockStates, setBlockStates] = useState<Record<string, BlockState>>({});
const [isInitialLoading, setIsInitialLoading] = useState(true);

useEffect(() => {
  let cancelled = false;
  setIsInitialLoading(true);

  dashboardApi.fetchAll({ year, province, infraType })
    .then((result) => {
      if (!cancelled) {
        setDashboardData(result.data);
        setBlockStates(result.states);
        setIsInitialLoading(false);
      }
    })
    .catch(() => {
      if (!cancelled) {
        setDashboardData(MOCK_DATA);
        setBlockStates(Object.fromEntries(
          Object.keys(MOCK_DATA).map(k => [k, { state: 'error' as DataState, isMockFallback: true, lastError: 'API unavailable' }])
        ));
        setIsInitialLoading(false);
      }
    });

  return () => { cancelled = true; };
}, [year, province, infraType]);
```

**Current derived KPI values to REMOVE** (lines ~128-137):
```typescript
// const tonnageValue = yoyData?.current.totalTonnage || MOCK_TONNAGE;
// const tonnageDelta = yoyData?.deltas.tonnage ?? MOCK_TONNAGE_DELTA;
// const vesselValue = yoyData?.current.totalVessels || MOCK_VESSELS;
// ...
// REPLACE: read from dashboardData.heroKpi and dashboardData.kpiCards[...]
```

**Existing chart data references to UPDATE** — every inline mock constant reference must be replaced:

| Old Reference | New Reference |
|---------------|--------------|
| `HERO_SPARK` | `dashboardData?.heroKpi.sparklineData || MOCK_DATA.heroKpi.sparklineData` |
| `tonnageValue` | `dashboardData?.heroKpi.value ?? 0` |
| `tonnageDelta` | `dashboardData?.heroKpi.deltaPercent ?? 0` |
| `vesselValue` | `dashboardData?.kpiCards[0].value ?? '0'` |
| `vesselDelta` | `dashboardData?.kpiCards[0].deltaPercent ?? 0` |
| `passengerValue` | `dashboardData?.kpiCards[1].value ?? '0'` |
| `passengerDelta` | `dashboardData?.kpiCards[1].deltaPercent ?? 0` |
| `SPARK_LUOT_TAU` | `dashboardData?.kpiCards[0].sparklineData ?? MOCK_DATA.kpiCards[0].sparklineData` |
| `SPARK_HANH_KHACH` | `dashboardData?.kpiCards[1].sparklineData ?? MOCK_DATA.kpiCards[1].sparklineData` |
| `SPARK_KCHT` | `dashboardData?.kpiCards[2].sparklineData ?? MOCK_DATA.kpiCards[2].sparklineData` |
| `SPARK_PT_THUY` | `dashboardData?.kpiCards[3].sparklineData ?? MOCK_DATA.kpiCards[3].sparklineData` |
| `CARGO_NOI_DIA` | `dashboardData?.stackedBar.series[0].data ?? MOCK_DATA.stackedBar.series[0].data` |
| `CARGO_XUAT_KHAU` | `dashboardData?.stackedBar.series[1].data ?? MOCK_DATA.stackedBar.series[1].data` |
| `CARGO_NHAP_KHAU` | `dashboardData?.stackedBar.series[2].data ?? MOCK_DATA.stackedBar.series[2].data` |
| `CARGO_CHUYEN_TAI` | `dashboardData?.stackedBar.series[3].data ?? MOCK_DATA.stackedBar.series[3].data` |
| `PASS_DEN_CANG` | `dashboardData?.linePassenger.arrival ?? MOCK_DATA.linePassenger.arrival` |
| `PASS_ROI_CANG` | `dashboardData?.linePassenger.departure ?? MOCK_DATA.linePassenger.departure` |
| `HBAR_DA_DUYET` | `dashboardData?.hBarApproval.map(a => a.approved) ?? MOCK_DATA.hBarApproval.map(a => a.approved)` |
| `HBAR_CHO_DUYET` | `dashboardData?.hBarApproval.map(a => a.pending) ?? MOCK_DATA.hBarApproval.map(a => a.pending)` |
| `HBAR_TU_CHOI` | `dashboardData?.hBarApproval.map(a => a.rejected) ?? MOCK_DATA.hBarApproval.map(a => a.rejected)` |
| `HBAR_CATEGORIES` | `dashboardData?.hBarApproval.map(a => a.category) ?? MOCK_DATA.hBarApproval.map(a => a.category)` |
| Donut data [12850,...] | `dashboardData?.donutPhuongTien.map(s => s.value) ?? MOCK_DATA.donutPhuongTien.map(s => s.value)` |
| Donut colors | `dashboardData?.donutPhuongTien.map(s => ({...s})) ?? MOCK_DATA.donutPhuongTien` |
| Donut 2 [2140,892,...] | `dashboardData?.donutPheDuyet.map(s => s.value) ?? MOCK_DATA.donutPheDuyet.map(s => s.value)` |
| Radar [85,62,78,90,45] | `dashboardData?.radarCoverage.map(r => r.value) ?? MOCK_DATA.radarCoverage.map(r => r.value)` |
| Ring hardcoded 87/187/215 | `dashboardData?.ringKcht ?? MOCK_DATA.ringKcht` |
| Alert Card "23" | `dashboardData?.alertCard.pendingCount ?? MOCK_DATA.alertCard.pendingCount` |

**Loading state to ADD**: When `isInitialLoading` (all blocks) is true, show `Skeleton` placeholders matching each block's dimensions:
- Hero card row: 2 skeletons (1 large + 4 small) in a grid
- Chart rows: 4 skeleton cards (2fr+1fr for row 2, 1fr+1fr+1fr for row 3-4)

---

## Error Handling Strategy

### Per-Block `Promise.allSettled` (implemented in T3)

Each of the 8 fetch calls in `fetchAll()` is independent:

```
fetchAll() calls:
  Promise.allSettled([
    dashboardApi.fetchCargoTotal(year),       // E1
    dashboardApi.fetchCargoMonthly(year),      // E2 MONTHLY
    dashboardApi.fetchCargoAnnual(year),       // E2 ANNUAL
    dashboardApi.fetchCargoPassenger(year),    // E2 CARGO_PASSENGER
    dashboardApi.fetchCargoDomestic(year),     // E2 DOMESTIC
    dashboardApi.fetchCargoManagedArea(year),  // E2 MANAGED_AREA
    dashboardApi.fetchAssetStatus(),           // E3
    dashboardApi.fetchApprovals(),             // E6
  ])
```

For each settled result:
- `status: 'fulfilled'` → call the corresponding `transform*()` function → set into DashboardData
- `status: 'rejected'` → log `[Dashboard] Block 'X' falling back to mock data: {reason}` → set `MOCK_DATA.block` → set `blockState.isMockFallback = true`

### Global Error Handler (in T4)

A top-level `try/catch` in the `useEffect` provides an additional safety net:
- If `fetchAll()` itself throws (network offline before any promise), set ALL blocks to mock data immediately

### Per-Block Rendering (in T4)

Each block in Home.tsx consults `blockStates[blockName]` to determine rendering:

| BlockState.state | Visual | Implementation |
|-----------------|--------|----------------|
| `loading` | Ant Design `Skeleton` | `<Skeleton active paragraph={{ rows: 3 }} />` matching block height |
| `data` | Normal ECharts | `<ReactECharts option={...} />` using dashboardData values |
| `empty` | "Không có dữ liệu" | `<Empty description="Không có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />` |
| `error` | Error alert + Retry | `<Alert message="Lỗi tải dữ liệu" type="error" action={<Button onClick={retryBlock}>Thử lại</Button>} />` |

When `isMockFallback: true`, wrap the ECharts component in `<Badge count="Dữ liệu mẫu" style={{ backgroundColor: stPending }}>` to visually indicate fallback data.

---

## Implementation Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API response shape doesn't match BA spec (different field names, nesting) | Medium | High (TypeScript errors) | Use `dashboardTypes.ts` as the source of truth; add runtime response validation in T3 |
| Backend returns `totalTonnage` instead of `totalTons` | Low | Medium | BA spec says `totalTons` (matches Java entity); developer must verify with actual backend responses |
| CORS/network issues during development | Medium | Medium | Mock data fallback ensures the page always renders; developer can toggle `useMockOnly` flag for development |
| Large dataset pagination (E6: 500+ approval records) | Medium | Medium | `fetchApprovals()` should respect pagination; for H-Bar/Dount aggregation, fetch multiple pages if `totalPages > 1` with a reasonable limit (max 2000 records) |
| Gap resolutions from M-009 team not aligned with M-022 schedule | Low | Low | All blocked blocks (G-001, G-003, G-004, G-009) gracefully fall back to mock data — no critical path dependency |
| Province/infraType filters not supported by APIs | High | Low | No-op today; filter values are available in FilterContext but APIs don't use them yet (noted as G-007, G-008) |

---

## Developer Guidance

### Stack & Framework

This is a **React + TypeScript** frontend. The project uses:
- **Vite** build tool (confirmed by AGENTS.md + project structure)
- **Ant Design** for UI components (Button, Skeleton, Empty, Alert, Badge)
- **ECharts** via `echarts-for-react` for all charts
- **axios** for HTTP (via `../api.ts` which auto-attaches auth tokens and handles 401/403 globally)

### Scaffold-First Approach

No framework generator required — these are TypeScript files added to an existing service folder and one modified page. Do NOT use any code generator for these tasks.

### Before Starting T3

1. Read `frontend/src/services/api.ts` to understand the axios instance and its auth token + error handling behavior
2. Confirm the actual backend API response shape by testing one endpoint via curl or browser dev tools:
   - `GET /api/v1/integration/share/ports/cargo-total?page=0&size=10`
   - Check whether the envelope is `{ success, message, data, timestamp }` or `{ ok, data, message }`
3. Confirm the Java entity field is `totalTons` (BigDecimal) — the BA spec says `totalTons`, but the existing `dashboardApi.ts` uses `totalTonnage`. The correct TypeScript field is `totalTons` per BA spec §1.4.
4. Run `cd frontend && npx tsc --noEmit` before and after to verify TypeScript compilation

### Color Token Usage

All chart colors must use tokens from `frontend/src/tokens-dashboard.ts`:
- Data visualization: `sea0`, `sea1`, `sea2`, `sea3`, `teal`, `navy`
- Status/workflow: `stApproved`, `stPending`, `stRejected`, `stDraft`
- NEVER hardcode hex values in chart option objects

### Import Patterns

```typescript
// ✅ Use the centralized API client
import api from '../api';
const response = await api.get('/v1/integration/share/ports/cargo-total?page=0&size=200');

// ✅ Use design tokens
import { sea0, sea1, stApproved } from '../tokens-dashboard';

// ✅ Use dashboard types
import type { CargoAggregate, DashboardData, BlockState } from './dashboardTypes';
```

### Testing Guidance for Developer

1. Run `cd frontend && npx tsc --noEmit` — must compile cleanly with zero errors
2. Run `cd frontend && npx vitest run` — all existing tests must pass
3. In browser: open Home page, verify:
   - All 6 cards and 7 charts render identically to pre-change
   - FilterBar year change triggers refetch (visible in Network tab)
   - Mock fallback (disconnect network) still renders all blocks
   - Console shows `[Dashboard]` log messages for mock fallback blocks

---

## QA Guidance

### Validation Areas

| QA Area | Scope | Pass Criteria |
|---------|-------|---------------|
| Type correctness | All dashboardTypes.ts interfaces | TypeScript compiles with `tsc --noEmit` - zero errors |
| Mock data preservation | dashboardMockData.ts exports | Every hardcoded value from pre-change Home.tsx is preserved identically in MOCK_DATA object |
| API response parsing | dashboardApi.ts fetch functions | All 8 fetch functions correctly unwrap ApiResponse → Page → content |
| Data transformation | All transform* functions | Summation, grouping, delta computation produces correct values from known inputs |
| Fallback behavior | dashboardApi.fetchAll() | Simulate each API failure (404/500) → block falls back to MOCK_DATA, Console warning logged |
| Home.tsx rendering | Visual regression | All 13 UI blocks render with correct data, colors, sparklines — visually identical to pre-change |
| Filter responsiveness | Home.tsx useEffect | Changing year in FilterBar triggers 8 API calls (verified via Network tab) |
| Loading states | Home.tsx | Initial load shows Skeleton placeholders; per-block loading states visible |
| Error states | Home.tsx | Disconnect network → all blocks show Badge "Dữ liệu mẫu" or error alert + retry button |

### Blocks Requiring Human Review

| Block | Reason | QA Action |
|-------|--------|-----------|
| Stacked Bar (4 cargo types) | G-001 — cargo-type breakdown doesn't exist; uses mock ratio split | Verify the mock split logic doesn't produce negative or NaN values |
| Line Chart (arrival/departure) | G-002 — arrival/departure split stays mock | Verify single line renders correctly |
| Donut Phe Duyet ("Lưu tạm") | G-003 — DRAFT status added from mock data | Verify 718 "Lưu tạm" segment is visually distinct |
| Radar Coverage | G-004 — stays 100% mock | Verify hardcoded values match pre-change |
| H-Bar aggregation | G-009 — client-side grouping | Verify with 10+ mock records that grouping works correctly |

---

## Migration / Rollout / Rollback Notes

### Migration

No data migration needed. This is purely a frontend code change. All backend APIs are expected to be already deployed as part of M-009 integration module.

### Rollout

1. Merge T1 (types) + T2 (mock data) first — no behavioral change, safe to deploy
2. Merge T3 (API service) — safe to deploy independently (no callers yet)
3. Merge T4 (Home.tsx wiring) — this is the behavioral change. Deploy in low-traffic window.
4. Post-deploy monitor: browser console for `[Dashboard]` mock fallback warnings, API error rates on `/api/v1/integration/share/*` endpoints

### Rollback

If issues occur:
- **Rollback method**: Revert the Home.tsx change (T4). The old inline mock data from git history will render the dashboard as before.
- **Partial rollback**: If individual APIs fail but UI renders, no action needed — per-block fallback handles it gracefully.
- **Full rollback**: `git revert <commit>` for the Home.tsx change. The old `fetchYearOverYear` + inline mock pattern will be restored.

---

## Verify Commands

```bash
# TypeScript compilation check
cd frontend && npx tsc --noEmit

# Run existing tests
cd frontend && npx vitest run --reporter=verbose

# Optional: lint check
cd frontend && npx eslint src/services/dashboardTypes.ts src/services/dashboardMockData.ts src/services/dashboardApi.ts src/pages/Home.tsx
```

---

## Open Execution Questions

| Question | Raised by | Status |
|----------|-----------|--------|
| Does E6 (`/api/v1/asset/ho-so-xu-ly`) support filtering by `trangThaiHoSo` query parameter? If yes, approval aggregation becomes single-call. | T3 — engineering-frontend-developer | To verify during development |
| Is the backend API envelope `{ success, message, data, timestamp }` or `{ ok, data }` as the existing dashboardApi.ts uses? | T3 — engineering-frontend-developer | To verify during development (existing file uses `{ ok, data }`; BA spec says `{ success, message, data, timestamp }`) |
| Does E1 (`ports/cargo-total`) require pagination (page+size params) or is it a single-summary endpoint? | T3 — engineering-frontend-developer | To verify during development |

---

## Execution Readiness Verdict

**Verdict: Pass** — BA spec is complete, architecture is clear, task decomposition is feasible, all gaps have graceful fallbacks, and no blockers prevent execution.

`implementations.yaml` already has `services[]` populated with `dashboard-ui` (path: `frontend/src`) and packages for context/components/pages. No update needed.

```
<verdict_envelope>
  <verdict>Pass</verdict>
  <confidence>high</confidence>
  <structured_summary>
    <key_findings>
      <item>2 waves planned: Wave 1 (3 new service files), Wave 2 (1 modified page)</item>
      <item>Owner split: all frontend-developer (no backend, no infra changes)</item>
      <item>implementations.yaml services[] already populated — no update needed</item>
      <item>4 blocking gaps identified with graceful mock fallback strategy documented</item>
      <item>Existing TotalTonnage → TotalTons field migration properly handled</item>
      <item>Per-block Promise.allSettled with independent loading states</item>
    </key_findings>
    <artifacts_produced>
      <item>docs/modules/M-022-trang-chu-dashboard/tech-lead/04-plan.md</item>
    </artifacts_produced>
  </structured_summary>
  <blockers>
  </blockers>
</verdict_envelope>
```
