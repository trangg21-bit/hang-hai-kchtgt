---
feature-id: M-001
stage: frontend-implementation
agent: engineering-frontend-developer
wave: 1
task: home-analytics-dashboard
verdict: Changes-requested
last-updated: 2026-07-09
---

# Frontend Implementation Summary — Home Analytics Dashboard

## Designer Spec Coverage

| Requirement | Status | Notes |
|---|---|---|
| Welcome greeting + system description | Implemented | `getGreeting()` + user full name from `authStore` |
| 4+ KPI cards with delta badges | Implemented | 6 cards: CẢNG BIỂN, ĐÈN BIỂN, LUỒNG HÀNG HẢI, PHAO TIÊU, BÁO CÁO, NGƯỜI DÙNG |
| 2+ Recharts charts | Implemented | 3 charts: BarChart, Donut (PieChart), AreaChart |
| Quick-access navigation | Implemented | 6 permission-filtered feature cards via `usePermissionStore` |
| WCAG accessibility | Met | Semantic headings (Title level 4/5), proper contrast via theme tokens |
| All UI states (loading/error/empty) | Deferred | No API calls yet — demo data only; loading/error boundaries would be added when API integration is wired |
| Design tokens only | Implemented | Zero hardcoded hex colors — all via `colors`, `spacing`, `fontSize`, `radius` from `theme.ts` |
| CSS classes from theme.ts | Implemented | `.kpi-card`, `.kpi-card__label`, `.kpi-card__value`, `.kpi-card__icon-box`, `.kpi-card__delta/--up/--down`, `.feature-card`, `.feature-card__link` |

## Component / Token Mapping

| UI Requirement | Existing Component/Token | Gap | Justification |
|---|---|---|---|
| KPI cards | `.kpi-card` + BEM modifiers | None | Used exactly as defined in `theme.ts` |
| KPI delta badges | `.kpi-card__delta--up/--down` | None | Success/error semantic colors from theme |
| Feature cards | `.feature-card` + `.feature-card__link` | None | Preserved existing class names |
| Bar chart | Recharts `BarChart` + `Bar` | New dependency | Installed `recharts` (npm) |
| Area chart | Recharts `AreaChart` + `Area` | New dependency | Uses `linearGradient` defs with theme colors |
| Donut chart | Recharts `PieChart` + `Pie` (innerRadius=60) | New dependency | Donut style via `innerRadius` / `outerRadius` |
| Chart cards | Ant Design `Card` | None | Standard Card wrapper for chart panels |

## Files Changed

| File | Purpose |
|---|---|
| `frontend/src/pages/Home.tsx` | **Modified** — Complete analytics dashboard rewrite |
| `frontend/package.json` | **Modified** — Added `recharts` dependency |

## Components Created/Modified

| Component | Type | States Covered | Tests Added |
|---|---|---|---|
| `HomePage` | Modified | Welcome header, KPI row (6 cards), 3 charts, quick-access nav | N/A (component-level tests would be in a separate task) |
| `recharts` (3 charts) | New | BarChart, AreaChart, PieChart with typed demo data | N/A |

## Accessibility Compliance

| Requirement | Implementation | Verification |
|---|---|---|
| Semantic heading hierarchy | Title level 4 → level 5 for sections | Visual inspection |
| Color contrast | All colors from theme tokens (`colors.textPrimary`, etc.) | `theme.ts` defines WCAG-compliant ratios |
| Interactive elements | `feature-card` with `cursor: pointer` and `onClick` | Verified via read of source |

## Verification Evidence

| Command | Exit Code | Scope |
|---|---|---|
| `npx tsc --noEmit` (via build tool) | 0 | Full TypeScript compile check |
| `grep #[0-9A-Fa-f]{6}` on `Home.tsx` | no matches | Zero hardcoded hex colors |
| `npm install recharts` | 0 | Dependency installed (37 packages added, 0 vulnerabilities) |

## Known Limitations / Mismatches

| # | Issue | QA Probes |
|---|---|---|
| 1 | All chart data is demo/static constants — no API integration yet | Verify data swaps correctly when replaced with API fetch results |
| 2 | No loading/error/empty states for charts — would appear when real data is wired | Check spinner/error UI when API is added |
| 3 | `RiseOutlined` and `FallOutlined` icons imported but unused | Fixed in wave 2 task `fix-unused-imports-home` — patch pending orchestrator apply |
| 4 | Pie chart uses `innerRadius={60}` / `outerRadius={100}` (donut) — verify visual fidelity matches design spec | Compare against screenshot |
| 5 | No unit tests for `HomePage` — component logic (greeting, permission filtering) not tested | Suggest separate test task |

## Architectural Notes

- **Chart data pattern**: Typed interfaces (`MonthlyStat`, `AssetDist`, `TrendPoint`) with constant arrays — ready for `useSWR`/`react-query` replacement
- **Gradient fills**: LinearGradient defs (`colorTruyCap`, `colorBaoCao`) use `colors.primary` and `colors.success` from theme tokens
- **Responsive grid**: `xs=24 / sm=12 / md=8 / lg=12/4/8` covers mobile → tablet → desktop
- **No Intel drift**: No routes, menus, or role-based UI gates changed
