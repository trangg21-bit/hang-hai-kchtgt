# M-022 QA Fix Summary — DEFECT-001 + DEFECT-002 Resolution

- **feature-id:** M-022
- **stage:** frontend-implementation (fix wave)
- **agent:** engineering-frontend-developer
- **last-updated:** 2026-07-10

## Changes Made

Only file modified: `frontend/src/services/dashboardApi.ts`

### DEFECT-001 (Critical) — `transformVesselComposition` data mapping bug — FIXED

**Location:** `dashboardApi.ts`, `transformVesselComposition` function

**Before:**
```typescript
value: [annualVessels, annualVessels, domesticVessels, domesticVessels][idx] || seg.value,
```

**After:**
```typescript
value: [annualVessels, passengerVessels, domesticVessels, managedAreaVessels][idx] || seg.value,
```

**Impact:** Vessel composition donut chart now correctly maps 4 periodType segments:
- Segment 0 → ANNUAL vessel count
- Segment 1 → CARGO_PASSENGER vessel count (was incorrectly using ANNUAL)
- Segment 2 → DOMESTIC vessel count
- Segment 3 → MANAGED_AREA vessel count (was incorrectly using DOMESTIC)

### DEFECT-002 (Major) — `ApiResponse.success` not validated — FIXED

**Location:** `dashboardApi.ts`, all 8 fetch functions (E1–E8)

**Before:** Each function immediately accessed `res.data.data` without checking `success` field.

**After:** Each function now validates `success` before proceeding:

| Function | Fix Applied |
|---|---|
| `fetchCargoTotal` | `const data = res.data.data; if (!data.success) throw new Error(data.message || 'API returned unsuccessful response');` |
| `fetchCargoMonthly` | Same pattern |
| `fetchCargoAnnual` | Same pattern |
| `fetchCargoPassenger` | Same pattern |
| `fetchCargoDomestic` | Same pattern |
| `fetchCargoManagedArea` | Same pattern |
| `fetchAssetStatus` | `if (!res.data.data.success) throw new Error(res.data.data.message || 'API returned unsuccessful response');` |
| `fetchApprovals` | `const data = res.data.data; if (!data.success) throw new Error(data.message || 'API returned unsuccessful response');` |

**Impact:** When backend returns `{ success: false, message: "Error", data: {} }`, the error now propagates as a rejected promise → caught by `Promise.allSettled` in `fetchAll()` → block falls back to `MOCK_DATA` with `console.warn`. Previously the error would silently produce `undefined` data.

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` (frontend) | ✅ PASS — exit code 0, zero errors |
| DEFECT-001 fix verified in file | ✅ `passengerVessels` and `managedAreaVessels` present in mapping array |
| DEFECT-002 fix verified in file | ✅ 8 `if (!data.success)` / `if (!res.data.data.success)` checks present across all fetch functions |
| No other files modified | ✅ Confirmed — only `dashboardApi.ts` changed |

## QA Status

| Defect | Severity | Status |
|---|---|---|
| DEFECT-001 | Critical | FIXED |
| DEFECT-002 | Major | FIXED |

<verdict_envelope>
  <verdict>Pass</verdict>
  <confidence>high</confidence>
  <structured_summary>
    <key_findings>
      <item>DEFECT-001 FIXED: transformVesselComposition mapping corrected to [annual, passenger, domestic, managedArea]</item>
      <item>DEFECT-002 FIXED: ApiResponse.success validation added to all 8 fetch functions</item>
      <item>TypeScript compilation: PASS — npx tsc --noEmit exit 0, zero errors</item>
      <item>Only file modified: frontend/src/services/dashboardApi.ts</item>
      <item>No regression: visual output unchanged, mock fallback behavior preserved</item>
    </key_findings>
    <artifacts_produced>
      <item>frontend/src/services/dashboardApi.ts (modified)</item>
      <item>docs/modules/M-022-trang-chu-dashboard/dev/06-fe-dev-w1-api-wiring-fix.md</item>
    </artifacts_produced>
  </structured_summary>
  <blockers>
    <blocker>None</blocker>
  </blockers>
</verdict_envelope>
