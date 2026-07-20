# Home.tsx Metronic 8 Theme Compliance Fix

## Summary
Fixed `frontend/src/pages/Home.tsx` to comply with Metronic 8 theme standards.

## Changes

### Issue 1: Hardcoded hex color removed
- `connect` module: `#009ef7` → `var(--color-primary)`

### Issue 2: CSS variable composition fixed
- Added `iconBg` key to all 6 module entries (gis, beacon, port, vts, reports, connect)
- Changed JSX from `background: m.color + '20'` → `background: m.iconBg`

## iconBg Mapping

| Module | color | iconBg |
|--------|-------|--------|
| gis | var(--color-primary) | var(--icon-bg-blue) |
| beacon | var(--color-success) | var(--icon-bg-green) |
| port | var(--color-warning) | var(--icon-bg-orange) |
| vts | var(--color-error) | var(--icon-bg-red) |
| reports | var(--color-info) | var(--icon-bg-purple) |
| connect | var(--color-primary) | var(--icon-bg-blue) |

## Verification
- `npm run build` → exit code 0, built in 1.17s
- No TypeScript errors
- All 6 modules have both `color` and `iconBg` keys
- Zero hardcoded hex colors remain
