---
feature-id: M-022-trang-chu-dashboard
wave: 2
stage: code-reviewer
agent: engineering-code-reviewer
last-updated: 2026-07-13
---

# Code Review Report — M-022 Trang chủ Dashboard Wave 2

## 1. Review Scope

**Module:** M-022 Trang chủ Dashboard
**Wave:** 2 (post-fix re-test — SF-001, SF-002, DEFECT-003, DEFECT-004)
**Reviewer Type:** Final code review (independent of SA, Dev, QA)
**Date:** 2026-07-13

### Files Reviewed

| File | Path | Role |
|---|---|---|
| Home.tsx | `frontend/src/pages/Home.tsx` | Dashboard page — 4 KPI cards, 2 ApprovalCards, HeroCard, 5 charts, infrastructure table, Leaflet map |
| dashboardApi.ts | `frontend/src/services/dashboardApi.ts` | API integration — 8 fetch functions, 6 transforms, `fetchAll`, `fetchWithFallback` |
| dashboardTypes.ts | `frontend/src/services/dashboardTypes.ts` | All TypeScript interfaces (API envelope, domain entities, view model, state types) |
| dashboardMockData.ts | `frontend/src/services/dashboardMockData.ts` | Mock data constants for fallback (referenced but not re-reviewed) |
| tokens-dashboard.ts | `frontend/src/tokens-dashboard.ts` | Dashboard-specific semantic token aliases |
| 05-fe-dev-w2-sf-fix.md | `docs/modules/.../dev/` | Dev fix specification |
| 05-fe-dev-w2-verification.md | `docs/modules/.../dev/` | Dev AC verification report |
| 07-qa-report-w2.md | `docs/modules/.../qa/` | QA re-test report |
| 00-lean-spec.md | `docs/modules/.../ba/` | BA lean spec (all 5 features F-280–F-284) |

### Checks Performed

1. **Source-code verification** of 4 fixes against actual files
2. **BA spec alignment** — all acceptance criteria for F-280 through F-284
3. **TypeScript compilation** — `npx tsc --noEmit` (clean)
4. **Vite production build** — `npm run build` (exit 0)
5. **Hardcoded hex audit** — grep for `#[0-9a-fA-F]{3,8}` in Home.tsx
6. **Token compliance** — all color/spacing/font from `tokens-dashboard.ts`
7. **Import integrity** — MOCK_DATA imports from correct module
8. **Data flow integrity** — `Promise.allSettled` array, heroKpi population

---

## 2. Fix Verification Results

### SF-001: Success-gate in `fetchYearOverYear`

**Claim:** Both `currentRes` and `previousRes` responses are validated with `if (!res.data.success) throw new Error(...)` before accessing `.data.data.content`.

**Evidence:** `dashboardApi.ts` lines ~561, ~567:
```typescript
const currentRes = await api.get<...>(...);
if (!currentRes.data.success) throw new Error(currentRes.data.message || 'API returned unsuccessful response');
// ...filter on currentData...
const previousRes = await api.get<...>(...);
if (!previousRes.data.success) throw new Error(previousRes.data.message || 'API returned unsuccessful response');
```

**Verdict: ✅ PASS** — Two guard clauses present, consistent with all other fetch functions in `dashboardApi.ts`. Pattern matches `fetchCargoTotal`, `fetchCargoMonthly`, etc.

---

### SF-002: `blockStates` useState + orange tag rendering

**Claim:** `blockStates` state is declared, populated from `fetchWithFallback`, and 5+ orange `<Tag color="orange">Dữ liệu mẫu</Tag>` tags render conditionally.

**Evidence:** `Home.tsx`:
- Line ~472: `const [blockStates, setBlockStates] = useState<Record<string, BlockState>>({});`
- Lines ~476–479: `fetchWithFallback(...).then(({ data, states }) => { setDashboardData(data); setBlockStates(states || {}); })`
- Tags at lines:
  - ~749: `stackedBar` — `blockStates.stackedBar?.isMockFallback`
  - ~757: `linePassenger` — `blockStates.linePassenger?.isMockFallback`
  - ~782: `infraTable` — `blockStates.infraTable?.isMockFallback`
  - ~799: `hBarApproval` — `blockStates.hBarApproval?.isMockFallback`
  - ~806: `donutPheDuyet` — `blockStates.donutPheDuyet?.isMockFallback`

Total: **5 blocks** with conditional orange tags. Tag styling: `<Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>Dữ liệu mẫu</Tag>`. BlockState type is imported from `../services/dashboardTypes` (line 23).

**Verdict: ✅ PASS** — All 5 tags present. No hardcoded hex in tag styling (Ant Design `color="orange"` uses built-in AntD palette, not a hex value).

---

### DEFECT-003: MOCK_DATA import from wrong module

**Claim:** `MOCK_DATA` is imported from `dashboardMockData`, NOT from `dashboardApi`.

**Evidence:** `Home.tsx` lines 21–23:
```typescript
import { dashboardApi } from '../services/dashboardApi';
import { MOCK_DATA } from '../services/dashboardMockData';
import type { DashboardData, BlockState } from '../services/dashboardTypes';
```

**Negative evidence:** `grep` for `MOCK_DATA.*from.*dashboardApi` in `frontend/src/pages` returns **0 matches**.

**Verdict: ✅ PASS** — Split import is correct. `dashboardApi` from `dashboardApi`, `MOCK_DATA` from `dashboardMockData`. No orphan `import ... from '../services/dashboardApi'` carrying `MOCK_DATA`.

---

### DEFECT-004: `fetchYearOverYear` in `fetchAll` Promise.allSettled

**Claim:** `fetchYearOverYear(year, 'ANNUAL')` is the 9th item in the `Promise.allSettled` array; its result populates `heroKpi.deltaPercent`.

**Evidence:** `dashboardApi.ts`:
- Lines ~304–321 — destructuring includes `yearOverYear` as 9th element
- Lines ~323–331 — `Promise.allSettled` includes `fetchYearOverYear(year, 'ANNUAL')` as 9th call
- Lines ~346–354 — heroKpi block checks `yearOverYear.status === 'fulfilled'` and populates:
  ```typescript
  if (yearOverYear.status === 'fulfilled') {
    data.heroKpi = {
      ...transformResult.heroKpi,
      deltaPercent: yearOverYear.value.deltaPercent,
      deltaDirection: yearOverYear.value.deltaDirection === 'flat' ? 'up' : yearOverYear.value.deltaDirection,
      previousYearValue: yearOverYear.value.previousValue,
    };
  } else {
    data.heroKpi = transformResult.heroKpi; // fallback to mock delta
  }
  ```
- The `flat` → `up` coercion is noted as a design choice: if delta is exactly 0%, it renders as ▲ 0% instead of no arrow. Acceptable UX (HeroCard only shows ▲ or ▼, no `→` glyph).

**Verdict: ✅ PASS** — `fetchYearOverYear` is correctly integrated. Destructuring, array, and result-population all align.

---

## 3. BA Spec Alignment (F-280 through F-284)

### F-280 — FilterBar

| AC | Description | Status | Source Evidence |
|----|-------------|--------|-----------------|
| AC1 | Full width, token-based | ✅ | FilterBar.tsx: `surfacePage`, `radiusSm`, `borderDefault` tokens |
| AC2 | Year dropdown [2020..2026] default 2026 | ✅ | FilterBar.tsx: YEAR_OPTIONS hardcoded, from FilterContext |
| AC3 | Province "Tất cả" sets null | ✅ | FilterBar: `setProvince(val === 'Tất cả' ? null : val)` |
| AC4 | InfraType "Tất cả" sets null | ✅ | FilterBar: `setInfraType(val === 'Tất cả' ? null : val)` |
| AC5 | Timestamp right-aligned | ✅ | FilterBar: `marginLeft: 'auto'`, ClockCircleOutlined |
| AC6 | URL sync via useSearchParams | ✅ | FilterContext.tsx |
| AC7 | Province/infraType → data (DEFERRED) | ⚠️ | Known: `province: null, infraType: null` in API call |
| AC8 | Responsive wrap | ✅ | FilterBar: `flexWrap: 'wrap'` |
| AC9 | No loading needed (static) | ✅ | Static options — no API |
| AC10 | Error+retry (v2 aspirational) | ❌ | Not implemented |

**F-280 Verdict: ✅ PASS** — 8/10 ACs implemented, 1 deferred, 1 v2 aspirational not expected in this wave.

### F-281 — 6 Cards Grid

| AC | Description | Status | Source Evidence |
|----|-------------|--------|-----------------|
| AC1 | 6-card grid | ✅ | `Home.tsx`: `display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'` with 6 children |
| AC2 | HeroCard blue gradient | ✅ | `background: linear-gradient(135deg, ${navy}, ${sea0})` — both from tokens |
| AC3 | Action variant blue | ✅ | ApprovalCard uses `approvalApproved` (dataSea0) token |
| AC4 | Token compliance | ✅ | All colors from `tokens-dashboard.ts` — 0 hardcoded hex (see §4) |

**F-281 Verdict: ✅ PASS** — 4/4 ACs met.

### F-282 — Cargo & Passenger Charts

| AC | Description | Status | Source Evidence |
|----|-------------|--------|-----------------|
| AC1 | Stacked bar 6 series token colors | ✅ | CARGO_SERIES: `cargoSeriesColors[0..5]` |
| AC2 | Polar bar passenger | ✅ | polarOption: `coordinateSystem: 'polar'`, 2 series (arrival/departure) |
| AC3 | ECharts (not Recharts) | ✅ | `import ReactECharts from 'echarts-for-react'` |
| AC4 | Null → 0 rendering | ✅ | `p.value ?? 0` in tooltip formatter |

**F-282 Verdict: ✅ PASS** — 4/4 ACs met.

### F-283 — KCHT Table

| AC | Description | Status | Source Evidence |
|----|-------------|--------|-----------------|
| AC1 | Sea-blue pills (dataSea0/2/3) | ✅ | `pillBadge()` uses `sea0`, `sea3`, `sea2` tokens |
| AC2 | 10 rows | ✅ | INFRA_DATA: 10 InfraRow entries |
| AC3 | 2-line headers no dots | ✅ | `<span>Chưa khai thác/<br/>vận hành</span>` |
| AC4 | ApprovalCard components | ✅ | 2 ApprovalCard instances in stats row |

**F-283 Verdict: ✅ PASS** — 4/4 ACs met.

### F-284 — DashboardMap + Table

| AC | Description | Status | Source Evidence |
|----|-------------|--------|-----------------|
| AC1 | Leaflet DashboardMap | ✅ | `DashboardMap.tsx`: Leaflet loaded dynamically, Google tiles |
| AC2 | 6 columns | ✅ | infraColumns: 6 columns (loai, tongSL, chuaKhaiThac, dangKhaiThac, dungKhaiThac, action) |
| AC3 | 2-line headers no dots | ✅ | Same column headers as F-283 AC3 |
| AC4 | Sea-blue pills | ✅ | `pillBadge` uses `sea0`, `sea2`, `sea3` tokens |

**F-284 Verdict: ✅ PASS** — 4/4 ACs met.

### Overall Feature Alignment

| Feature | Verdict | AC Met | AC Total |
|---------|---------|--------|----------|
| F-280: FilterBar | PASS | 8 | 10 (2 aspirational/deferred) |
| F-281: 6 Cards Grid | PASS | 4 | 4 |
| F-282: Cargo/Passenger Charts | PASS | 4 | 4 |
| F-283: KCHT Table | PASS | 4 | 4 |
| F-284: Leaflet Map | PASS | 4 | 4 |
| **Total** | **PASS** | **24** | **26** |

---

## 4. Hardcoded Hex Color Audit

**Scope:** `frontend/src/pages/Home.tsx`

**Method:** Regex `#[0-9a-fA-F]{3,8}` via `grep`

**Result: 1 match**

| Line | Code | Status |
|------|------|--------|
| 338 | `color: '#eaf4fc', /* one-off: light text on dark gradient */` | ✅ **Documented exception** — Light text on `linear-gradient(135deg, ${navy}, ${sea0})` dark gradient. No token exists for this specific light shade. Comment explains intention. |

**No other hex values found.** All colors in Home.tsx use semantic tokens from `tokens-dashboard.ts`:

- `surfaceCard`, `borderDefault`, `shadowMd` — card container
- `textPrimary`, `textSecondary`, `textTertiary` — text hierarchy
- `dataNavy`, `dataSea0–3` — chart series, badges, pills
- `statusOperational`, `statusCritical` — delta arrows
- `cargoSeriesColors[0..5]` — 6 cargo chart series
- `approvalApproved/Pending/Rejected` — approval bar segments
- `approvalBarTrack`, `pendingActiveBg/Color`, `pendingZeroBg/Color` — pills
- `chartGrid`, `chartTooltip`, `chartTextStyle` — ECharts configuration

**Hex Audit Verdict: ✅ PASS** — 0 violations, 1 documented exception.

---

## 5. Token Compliance Assessment

All tokens used match the closed palette defined in `tokens.ts` and re-exported from `tokens-dashboard.ts`:

| Category | Tokens Used | Compliant |
|----------|-------------|-----------|
| Action | None in scope | ✅ |
| Status | `statusOperational`, `statusCritical` | ✅ |
| Data series | `dataNavy`, `dataSea0–3`, `cargoSeriesColors[]` | ✅ |
| Surface | `surfaceCard`, `borderDefault`, `shadowMd` | ✅ |
| Text | `textPrimary`, `textSecondary`, `textTertiary` | ✅ |
| Radius | `radiusXl`, `radiusSm`, `radiusPill` | ✅ |
| Spacing | Used via `CARD_BASE` composition (16px 20px), `gap` in grid (16px) | ✅ |
| Font | `fontSizeSm/Md/Lg/Heading/Display`, `fontMono`, `fontWeight` | ✅ |

**Accent budget check:** `actionPrimary` is not used in any of the Wave 2 changes. No accent-budget violation.

**Token Compliance Verdict: ✅ PASS** — All tokens from `tokens-dashboard.ts`, no token violations.

---

## 6. Build Verification

### TypeScript Compilation

```bash
$ cd frontend && npx tsc --noEmit
Exit code: 0
Output: (none)
```

**Verdict: ✅ PASS** — Zero errors, zero warnings.

### Vite Production Build

```bash
$ cd frontend && npm run build
Exit code: 0
Output: built in 1.59s
```

Build output:
| Asset | Size |
|-------|------|
| `dist/index.html` | 0.80 kB |
| `dist/assets/index-CtPvmpe1.css` | 0.65 kB |
| `dist/assets/index-Bwy2y0la.js` | 3,529.82 kB (1,015.98 kB gzip) |

**Warnings:** All pre-existing — chunk size warning (3.5 MB) and `INEFFECTIVE_DYNAMIC_IMPORT` warnings for other modules (`ben-cang`, `cau-cang`, `cang-can`, `vung-nuoc`). None from M-022 code.

**Verdict: ✅ PASS**

---

## 7. Regression Impact Assessment

| Area | Risk | Assessment |
|------|------|------------|
| HeroKpi delta computation | **Low** | `fetchYearOverYear` runs in parallel; on failure falls back to mock delta via `transformResult.heroKpi` (which uses `MOCK_DATA.heroKpi`). Behavior consistent with existing per-block fallback pattern. |
| MOCK_DATA import path | **None** | Same constant, different file. No behavioral change. |
| blockStates tracking | **Low** | Adds 5 orange tags conditionally. New rendering paths tested structurally. No interaction with other components. |
| Success-gate in fetchYearOverYear | **None** | Pure defensive addition — identical pattern to all 7 other fetch functions. Cannot cause regression. |
| `flat` → `up` coercion | **Low** | `flat` delta (0%) coerced to `up` — HeroCard shows ▲ 0% instead of no arrow. Acceptable UX (no `→` glyph in HeroCard). |
| Overall | **None identified** | All changes are localized to 2 files. No component API changes. No filtering/data-flow changes outside scope. |

---

## 8. Defects Found

**No new defects** were identified during this final code review.

All 4 fixes (SF-001, SF-002, DEFECT-003, DEFECT-004) are correctly implemented and verified in source code. The changes are coherent with existing patterns in `dashboardApi.ts` and `Home.tsx`.

### Pre-Existing Gaps (acknowledged, not introduced by Wave 2)

| Gap | Feature | Status |
|-----|---------|--------|
| F-280-G002 | Province/infraType cosmetic-only (v1) | Known, deferred to v2 |
| F-280-G001 | Static dropdown options | Known, v2 improvement |
| G-001 | No cargo-type field in CargoAggregate | Known backend gap |
| G-002 | No passenger direction field | Known backend gap |
| G-003 | No DRAFT status in backend approval enum | Known backend gap |
| G-004 | No coverage endpoint for radar | Known backend gap |

---

## 9. Observations

### Positive

1. **Consistent error handling** — `fetchYearOverYear` success-gate pattern matches all 7 other fetch functions exactly. No inventiveness.
2. **Clean data flow** — `fetchAll` is well-structured: 9 parallel Promise.allSettled calls, independent per-block fallback, per-block `BlockState` tracking.
3. **Token discipline** — Zero hardcoded hex (1 documented exception). All imports from `tokens-dashboard.ts`.
4. **Minimal diff** — Only 2 files modified with focused changes. No refactoring beyond the 4 fixes.
5. **Type safety** — `BlockState` type imported and used correctly. TypeScript compiles clean.

### Minor

1. **`flat` → `up` coercion** (dashboardApi.ts ~350): `deltaDirection === 'flat' ? 'up' : ...` is a pragmatic design choice to avoid a missing `→` glyph in HeroCard. If a future version adds a `→` trend icon, this coercion should be removed. Low priority.

---

## 10. Summary

### Verdict: ✅ **PASS**

| Check | Result |
|-------|--------|
| SF-001: fetchYearOverYear success validation | ✅ PASS |
| SF-002: blockStates + orange tags (5 blocks) | ✅ PASS |
| DEFECT-003: MOCK_DATA import corrected | ✅ PASS |
| DEFECT-004: fetchYearOverYear in fetchAll | ✅ PASS |
| F-280 FilterBar compliance | ✅ PASS (8/10 ACs) |
| F-281 6 Cards Grid compliance | ✅ PASS (4/4 ACs) |
| F-282 Cargo/Passenger Charts compliance | ✅ PASS (4/4 ACs) |
| F-283 KCHT Table compliance | ✅ PASS (4/4 ACs) |
| F-284 DashboardMap compliance | ✅ PASS (4/4 ACs) |
| TypeScript compilation (`tsc --noEmit`) | ✅ PASS (exit 0) |
| Vite production build (`npm run build`) | ✅ PASS (exit 0, 1.59s) |
| Hardcoded hex count | ✅ PASS (1 documented exception: `#eaf4fc`) |
| Token compliance (tokens-dashboard.ts) | ✅ PASS |
| New defects found | **0** |

**Recommendation:** All 4 fixes are verified correct. TypeScript and Vite builds pass. BA specs met. No blocking defects. Proceed to release.

---

*Report generated by engineering-code-reviewer, 2026-07-13.*
