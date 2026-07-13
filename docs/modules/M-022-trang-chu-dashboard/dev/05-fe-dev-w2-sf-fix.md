# SF Fix Wave 2 — M-022 Trang chủ Dashboard

> **Module:** M-022 (Trang chủ Dashboard)
> **Stage:** frontend-implementation (wave 2)
> **Agent:** engineering-frontend-developer
> **Date:** 2026-07-13

## Fix Summary

4 fixes applied to `frontend/src/pages/Home.tsx` and `frontend/src/services/dashboardApi.ts`.

---

## Fix 1 — DEFECT-003: Split MOCK_DATA import

**File:** `frontend/src/pages/Home.tsx`

**Before:**
```typescript
import { dashboardApi, MOCK_DATA } from '../services/dashboardApi';
import type { DashboardData } from '../services/dashboardTypes';
```

**After:**
```typescript
import { dashboardApi } from '../services/dashboardApi';
import { MOCK_DATA } from '../services/dashboardMockData';
import type { DashboardData, BlockState } from '../services/dashboardTypes';
```

**Rationale:** `MOCK_DATA` is now defined in its own module (`dashboardMockData.ts`) to keep `dashboardApi.ts` clean and avoid circular imports. The `BlockState` type import is added to support Fix 4's block-state rendering.

---

## Fix 2 — SF-001: Add ApiResponse.success validation in fetchYearOverYear

**File:** `frontend/src/services/dashboardApi.ts`

**Before:**
```typescript
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
  // ...
}
```

**After:**
```typescript
async function fetchYearOverYear(
  year: number,
  periodType: PeriodType
): Promise<YearOverYearDelta> {
  const currentRes = await api.get<ApiResponse<Page<CargoAggregate>>>(
    `${INTEGRATION_BASE}/cargo/summary?periodType=${periodType}&page=0&size=200`
  );
  if (!currentRes.data.success) throw new Error(currentRes.data.message || 'API returned unsuccessful response');
  const currentData = currentRes.data.data.content.filter((c) =>
    c.periodStart.startsWith(String(year))
  );
  const previousRes = await api.get<ApiResponse<Page<CargoAggregate>>>(
    `${INTEGRATION_BASE}/cargo/summary?periodType=${periodType}&page=0&size=200`
  );
  if (!previousRes.data.success) throw new Error(previousRes.data.message || 'API returned unsuccessful response');
  const previousData = previousRes.data.data.content.filter((c) =>
    c.periodStart.startsWith(String(year - 1))
  );
  // ...
}
```

**Rationale:** Consistency with all other fetch functions in `dashboardApi.ts` which validate `res.data.success` before accessing `.data.data`. Without this check, a non-success API response would crash with `TypeError: Cannot read property 'content' of undefined`.

---

## Fix 3 — DEFECT-004: Integrate fetchYearOverYear into fetchAll

**File:** `frontend/src/services/dashboardApi.ts`

**Changes to Promise.allSettled array (9 items):**
```typescript
const [
  cargoTotal,
  cargoMonthly,
  cargoAnnual,
  cargoPassenger,
  cargoDomestic,
  cargoManagedArea,
  assetStatus,
  approvals,
  yearOverYear,  // <-- NEW 9th item
] = await Promise.allSettled([
  fetchCargoTotal(year),
  fetchCargoMonthly(year),
  fetchCargoAnnual(year),
  fetchCargoPassenger(year),
  fetchCargoDomestic(year),
  fetchCargoManagedArea(year),
  fetchAssetStatus(),
  fetchApprovals(0, 500),
  fetchYearOverYear(year, 'ANNUAL'),  // <-- NEW 9th item
]);
```

**Hero KPI block (when cargoTotal succeeds AND yearOverYear succeeds):**
```typescript
// Hero KPI + KPI Card 1 (from cargoTotal or cargoAnnual)
if (cargoTotal.status === 'fulfilled') {
  const transformResult = transformCargoTotals(cargoTotal.value, year);
  if (yearOverYear.status === 'fulfilled') {
    data.heroKpi = {
      ...transformResult.heroKpi,
      deltaPercent: yearOverYear.value.deltaPercent,
      deltaDirection: yearOverYear.value.deltaDirection,
      previousYearValue: yearOverYear.value.previousValue,
    };
  } else {
    data.heroKpi = transformResult.heroKpi;
  }
  states.heroKpi = { state: 'data', isMockFallback: false };
} else {
  // ... fallback to mock data
}
```

**Rationale:** When both `cargoTotal` and `yearOverYear` succeed, the hero KPI now uses the actual YoY delta from the live API instead of mock values. If `yearOverYear` fails but `cargoTotal` succeeds, the hero KPI still gets live data (value) but falls back to mock delta values.

---

## Fix 4 — SF-002: Render per-block mock indicators in Home.tsx

**File:** `frontend/src/pages/Home.tsx`

### Import changes
```typescript
// Before
import { Tag } from 'antd';  // Tag already imported
import type { DashboardData } from '../services/dashboardTypes';

// After
import type { DashboardData, BlockState } from '../services/dashboardTypes';
// Tag is already imported from antd (no change needed)
```

### State addition
```typescript
const [dashboardData, setDashboardData] = useState<DashboardData>(MOCK_DATA);
const [blockStates, setBlockStates] = useState<Record<string, BlockState>>({}); // NEW
```

### useEffect change
```typescript
// Before
dashboardApi
  .fetchWithFallback({ year, province: null, infraType: null }, MOCK_DATA)
  .then(({ data }) => setDashboardData(data))

// After
dashboardApi
  .fetchWithFallback({ year, province: null, infraType: null }, MOCK_DATA)
  .then(({ data, states }) => { setDashboardData(data); setBlockStates(states || {}); })
```

### Tag indicators added to chart block titles

| Block | Condition | Location |
|---|---|---|
| `stackedBar` | `blockStates.stackedBar?.isMockFallback` | "Hàng hóa thông qua cảng theo tháng" |
| `linePassenger` | `blockStates.linePassenger?.isMockFallback` | "Lượt hành khách qua cảng" |
| `hBarApproval` | `blockStates.hBarApproval?.isMockFallback` | "Phê duyệt theo hạng mục" |
| `donutPheDuyet` | `blockStates.donutPheDuyet?.isMockFallback` | "Trạng thái phê duyệt" |
| `infraTable` | `blockStates.infraTable?.isMockFallback` | "Bảng chi tiết thông số kỹ thuật" |

### Pattern used for each Tag:
```tsx
<Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>Dữ liệu mẫu</Tag>
```

### Additional structural change — Row 3 added

The original layout had only 2 rows. Fix 4 adds **Row 3** containing the approval H-Bar and Donut charts, each with mock data indicators:
```tsx
{/* Row 3 — Approval chart + Donut */}
<Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
  <Col xs={24} md={12}>
    <div style={{ ...CARD_BASE, height: '100%' }}>
      <h4 style={CHART_TITLE_STYLE}>
        Phê duyệt theo hạng mục
        {blockStates.hBarApproval?.isMockFallback && <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>Dữ liệu mẫu</Tag>}
      </h4>
      <ReactECharts option={hBarOption} style={{ height: 320 }} notMerge />
    </div>
  </Col>
  <Col xs={24} md={12}>
    <div style={{ ...CARD_BASE, height: '100%' }}>
      <h4 style={CHART_TITLE_STYLE}>
        Trạng thái phê duyệt
        {blockStates.donutPheDuyet?.isMockFallback && <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>Dữ liệu mẫu</Tag>}
      </h4>
      <ReactECharts option={donutOption} style={{ height: 320 }} notMerge />
    </div>
  </Col>
</Row>
```

**Rationale:** Provides visual feedback to users when a chart block is rendered from mock data instead of live API data. The `BlockState` tracking from `fetchAll` propagates through `fetchWithFallback`, making this information available to the UI.

---

## Files Modified

| File | Changes |
|---|---|
| `frontend/src/pages/Home.tsx` | Import split, `BlockState` type, `blockStates` state, Tag indicators, Row 3 layout |
| `frontend/src/services/dashboardApi.ts` | Validation in `fetchYearOverYear`, integration into `fetchAll` |
