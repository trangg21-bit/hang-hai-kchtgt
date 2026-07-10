# MF-001 Critical Fix — ApiResponse.success Validation on Wrong Object

- **feature-id:** M-022
- **stage:** frontend-implementation (fix wave)
- **agent:** engineering-frontend-developer
- **last-updated:** 2026-07-10

## Defect Description (MF-001)

The 8 fetch functions in `dashboardApi.ts` validated `ApiResponse.success` on the **wrong object level**. The code checked `data.success` where `data = res.data.data` (which is `Page<T>` or `AssetStatusDto`), not the `ApiResponse<T>` wrapper (`res.data`) where `success` actually exists.

**Root cause:** Since `Page<T>` and `AssetStatusDto` have no `success` field, `data.success` is always `undefined`. Because `!undefined === true`, **every API call threw an error**, causing the dashboard to **always show mock data** and never fetch real data.

## Fix Applied

**File:** `frontend/src/services/dashboardApi.ts` (only file modified)

**Pattern change — paginated endpoints (E1–E6, E8):**

```typescript
// BEFORE (WRONG — checks Page<T> which has no success field):
const data = res.data.data;        // data = Page<CargoAggregate> — no success!
if (!data.success) throw new Error(...);
return data.content.filter(...);

// AFTER (CORRECT — checks ApiResponse<T> where success exists):
if (!res.data.success) throw new Error(res.data.message || '...');
const data = res.data.data;
return data.content.filter(...);
```

**Pattern change — non-paginated endpoint (E7 — `fetchAssetStatus`):**

```typescript
// BEFORE (WRONG):
if (!res.data.data.success) throw new Error(res.data.data.message || '...');
return res.data.data;

// AFTER (CORRECT):
if (!res.data.success) throw new Error(res.data.message || '...');
return res.data.data;
```

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` (frontend) | ✅ PASS — exit code 0, zero errors |
| All 8 fetch functions check `res.data.success` | ✅ Confirmed via grep: 8 occurrences of `if (!res.data.success)` |
| No `data.success` or `res.data.data.success` in dashboardApi.ts | ✅ Confirmed: only `res.data.success` remains |
| No other files modified | ✅ Confirmed |

## Affected Functions (all 8)

| Function | Line | Fix Applied |
|---|---|---|
| `fetchCargoTotal` | 50 | `if (!res.data.success) throw` before extracting inner data |
| `fetchCargoMonthly` | 63 | Same |
| `fetchCargoAnnual` | 76 | Same |
| `fetchCargoPassenger` | 89 | Same |
| `fetchCargoDomestic` | 102 | Same |
| `fetchCargoManagedArea` | 115 | Same |
| `fetchAssetStatus` | 128 | Same (non-paginated — returns `res.data.data` directly) |
| `fetchApprovals` | 143 | Same (uses `data.content` and `data.totalPages`) |

## Impact

**Before fix:** All 8 API calls immediately threw because `!undefined === true`. The `Promise.allSettled` in `fetchAll()` caught all 8 as rejected → every block fell back to `MOCK_DATA`. The dashboard **always** displayed mock data, completely defeating the Phase 2 API integration goal.

**After fix:** API responses with `success: false` now correctly throw and trigger per-block mock fallback. Responses with `success: true` proceed to extract inner data as intended.

<verdict_envelope>
  <verdict>Pass</verdict>
  <confidence>high</confidence>
  <structured_summary>
    <key_findings>
      <item>MF-001 FIXED: success validation moved from res.data.data (Page/AssetStatusDto) to res.data (ApiResponse)</item>
      <item>All 8 fetch functions (E1–E8) now correctly check res.data.success on the ApiResponse envelope</item>
      <item>TypeScript compilation: PASS — npx tsc --noEmit exit 0, zero errors</item>
      <item>Only file modified: frontend/src/services/dashboardApi.ts</item>
      <item>Dashboard now capable of displaying real API data instead of permanent mock fallback</item>
    </key_findings>
    <artifacts_produced>
      <item>frontend/src/services/dashboardApi.ts (modified)</item>
      <item>docs/modules/M-022-trang-chu-dashboard/dev/05-fe-dev-w1-mf-001-fix.md</item>
    </artifacts_produced>
  </structured_summary>
  <blockers>
    <blocker>None</blocker>
  </blockers>
</verdict_envelope>
