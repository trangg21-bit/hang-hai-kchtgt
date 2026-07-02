---
feature-id: M-003
stage: frontend-implementation
agent: engineering-frontend-developer
wave: hotfix
task: fix-resilient-api-extraction
verdict: Pass
last-updated: 2026-07-02T00:00:00Z
---

# Frontend Implementation Summary — Hotfix: Resilient API Response Extraction

## Root Cause

All 5 M-003 List pages crashed with `dataSource.map is not a function` because the service layer read `res.data.data` from the backend's `ApiResponse<KetQuaTimKiemResponse>` payload. The backend returns `{ results: [...], totalElements, totalPages, currentPage, pageSize }` directly at `res.data`, making `res.data.data` equal to `undefined`. When this `undefined` value reached state setters expecting arrays, `map()` threw.

## Fix Applied

Replaced every instance of `res.data.data` with `res.data` across all 5 service files. The resilient utilities (`toArray`, `toSingle`, `toTotalCount` at `frontend/src/services/resilient.ts`) already handle null/undefined, direct arrays, and objects with known array fields (`results`, `items`, `data`) — so passing the correct payload object allows them to extract data correctly.

## Files Modified

| # | File | Replacements |
|---|------|-------------|
| 1 | `frontend/src/services/luongHangHaiService.ts` | 10 occurrences |
| 2 | `frontend/src/services/deKeService.ts` | 10 occurrences |
| 3 | `frontend/src/services/coSuaChuaService.ts` | 10 occurrences |
| 4 | `frontend/src/services/tramRadarService.ts` | 10 occurrences |
| 5 | `frontend/src/services/heThongVtsService.ts` | 10 occurrences |

**Total replacements: 50** (all `res.data.data` → `res.data`)

## Component / Token Mapping

Not applicable — this is a service-layer data extraction fix, not a component change. No design tokens or UI components were modified.

## Designer Spec Coverage

- Required UI states: Covered — the `toArray` utility now receives the correct payload object, enabling proper array handling for loading/empty/success states.
- Validation: Not applicable — no input validation changed.
- Accessibility: Not applicable — no UI elements changed.

## Files Changed Summary

| File | Purpose |
|------|---------|
| `frontend/src/services/luongHangHaiService.ts` | 10x `res.data.data` → `res.data` |
| `frontend/src/services/deKeService.ts` | 10x `res.data.data` → `res.data` |
| `frontend/src/services/coSuaChuaService.ts` | 10x `res.data.data` → `res.data` |
| `frontend/src/services/tramRadarService.ts` | 10x `res.data.data` → `res.data` |
| `frontend/src/services/heThongVtsService.ts` | 10x `res.data.data` → `res.data` |

No files created, deleted, or modified outside the 5 listed above.

## Components Created or Modified

None. This is purely a service-layer fix. No component files (.tsx) were touched.

## Tests Added or Updated

None. This is a data extraction pattern fix with no new logic to test. The resilient utilities (`resilient.ts`) already have their own test coverage for handling `toArray`, `toSingle`, and `toTotalCount` with various input types.

## Accessibility Compliance

Not applicable — no UI components were modified.

## Verification Evidence

| Command | Exit Code | Scope |
|---------|-----------|-------|
| `npx tsc --noEmit` | 0 (zero errors) | Full frontend project |
| `npm run build` (vite build) | 0 (success) | Full frontend project |

**Post-fix verification:**
- `grep res.data.data` on all 5 target files: **0 matches** (confirmed clean)
- `grep res.data.data` on out-of-scope files: 84 matches retained (intentional, not in scope)

## Known Limitations / Mismatches

- **Out-of-scope files:** 84 additional `res.data.data` occurrences exist in other service files (`beaconService.ts`, `mapLayerService.ts`, `connectionService.ts`, `polygonObjectService.ts`, `lineObjectService.ts`, `pointObjectService.ts`, `chartService.ts`, `gisSearchService.ts`, `reportService.ts`). These are NOT addressed in this hotfix and may cause similar crashes if those services are called. Flag for potential follow-on fix.
- **No runtime tests:** This fix was verified at the typecheck and build level only. No E2E or integration tests were run. QA should smoke-test all 5 List pages in a running environment to confirm the crash is eliminated.
- **resilient.ts unchanged:** The utilities were already in place and correct. If future services need the same pattern, they should import and use these utilities consistently.

## intel-drift

`false` — no routes, menus, or role-based UI gates were modified.
