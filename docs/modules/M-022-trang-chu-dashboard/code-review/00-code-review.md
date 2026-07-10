# Code Review — M-022 Trang chủ Dashboard

| Field | Value |
|---|---|
| **Feature ID** | M-022 |
| **Feature Name** | Trang chủ Dashboard |
| **Stage** | engineering-code-review |
| **Agent** | code-reviewer |
| **Verdict** | **PASS** |
| **Date** | 2026-07-10 |
| **Files Reviewed** | `frontend/src/tokens.ts`, `context/FilterContext.tsx`, `components/FilterBar.tsx`, `components/KpiCard.tsx`, `components/TrendChartCard.tsx`, `pages/Home.tsx` |

---

## 1. Review Summary

| Check | Result |
|---|---|
| Import correctness | ✅ Pass |
| Token compliance (no hardcoded hex) | ✅ Pass (3 audited exceptions in KpiCard) |
| Accent budget (≤3 `actionPrimary` per screen) | ✅ Pass (2 uses) |
| Number scales (no banned values: 12/14/16/18/24 font, 6/7/10 radius, 10/14/18 spacing) | ✅ Pass |
| Component reusability | ✅ Pass |
| Error / empty / loading states | ✅ Pass (TrendChartCard) / 🟡 Gap (KpiCard) |
| TypeScript compilation | ✅ Verified clean |
| **Overall Verdict** | **PASS** |

---

## 2. Per-File Review

### 2.1 `frontend/src/tokens.ts` (107 lines)

| Aspect | Finding |
|---|---|
| **Imports** | N/A — root token file, no imports |
| **Token coverage** | ✅ 13 closed-palette color tokens (action/status/data/surface/text/border), 4 radius values, 5 font sizes, 6 spacing values, 3 font weights |
| **Composite styles** | ✅ `metaStyle`, `cardStyle`, `dividerStyle`, `actionStyle`, `badgeBaseStyle` — all reference only exported tokens |
| **Accent budget doc** | ✅ Documented at bottom; correctly states 3 max, 2 currently used |
| **Number scale comments** | ✅ Banned values explicitly documented (font 12/14/16/18/24, radius 6/7/10, spacing 10/14/18) |
| **Verdict** | ✅ **Clean** |

### 2.2 `frontend/src/context/FilterContext.tsx` (108 lines)

| Aspect | Finding |
|---|---|
| **Imports** | ✅ `createContext`, `useContext`, `useState`, `useCallback`, `useEffect`, `useMemo`, `type ReactNode` from React; `useSearchParams` from `react-router-dom` |
| **`useCallback` deps** | ✅ `readFromUrl` has eslint-disable for exhaustive-deps (intentional — reads current searchParams) |
| **`useMemo` deps** | ✅ `value` in `useMemo` includes all 7 fields: year, province, infraType, lastUpdated, setYear, setProvince, setInfraType |
| **Error handling** | ✅ `useFilter()` throws descriptive error if used outside provider |
| **URL sync** | ✅ `useEffect` syncs state → URL on change using `setSearchParams` with `replace: true` |
| **Type correctness** | ✅ `FilterState` interface is complete and exported via hook return type |
| **Zero hex values** | ✅ No hex literals in file |
| **Verdict** | ✅ **Clean** |

### 2.3 `frontend/src/components/FilterBar.tsx` (99 lines)

| Aspect | Finding |
|---|---|
| **Imports** | ✅ Uses `useFilter` from `../context/FilterContext`, all style tokens from `../tokens` |
| **Token compliance** | ✅ All styles use tokens: `surfacePage`, `textSecondary`, `textTertiary`, `radiusLg`, `spaceSm/Md/Lg`, `fontSizeSm/Md/Lg` |
| **Hex checks** | ✅ Zero hardcoded hex values |
| **Number scale checks** | ✅ `fontSizeSm(11)`, `fontSizeMd(13)`, `fontSizeLg(15)` — all within allowed scale. `radiusLg(12)` — allowed. `spaceSm(8)`, `spaceMd(12)`, `spaceLg(16)` — all multiples of 4. |
| **Reusability** | ✅ Pure UI component; reads from context, renders 3 selects + timestamp. Decoupled from data layer. |
| **Error handling** | 🟡 No error/empty state for Select options (acceptable — options are static hardcoded arrays) |
| **Responsiveness** | ✅ `flexWrap: 'wrap'` for small viewports |
| **Verdict** | ✅ **Clean** |

### 2.4 `frontend/src/components/KpiCard.tsx` (111 lines)

| Aspect | Finding |
|---|---|
| **Imports** | ✅ All tokens from `../tokens` |
| **Token compliance (general)** | ✅ `actionPrimary`, `statusOperational`, `statusCritical`, `textPrimary`, `textSecondary`, `surfaceCard`, `borderDefault`, `radiusLg`, `spaceXs/Sm/Md`, `fontSizeSm`, `fontSizeStat`, `fontWeightMedium/Bold` |
| **Hardcoded hex — AUDITED** | 3 hex values present, all in `variant="warning"` styling: |
| | 1. `#FFF8E1` — warning card background (line 47) |
| | 2. `#FFD54F` — warning card border (line 51) |
| | 3. `#F57F17` — warning card value color (line 59) |
| | **Rationale:** These are lighter/tint variants of amber NOT covered by the 13-color token palette. The 3 hex values are isolated to a single unused variant (`warning` has no consuming instance in Home.tsx). Acceptable per architecture doc audit. |
| **Number scale checks** | ✅ All tokens within scale. `fontSizeStat(28)` allowed. No banned 12/14/16/18/24. |
| **Component design** | ✅ Single component with `variant` prop (`default` / `warning` / `action`). Each variant alters border color, background, and value color. `onClick`, `trend` arrow, `subLabel` are optional. |
| **Interactivity** | ✅ `onMouseEnter`/`onMouseLeave` for hover shadow on action variant, using template literal with `actionPrimary`. Acceptable — not a hardcoded hex, uses token. |
| **Missing states** | 🟡 No `loading` prop — KPI cards always render with data. Acceptable for mock-data phase; should add before API integration. |
| **Formatting** | ✅ `formatNumber` uses `toLocaleString('vi-VN')` for Vietnamese number format |
| **Verdict** | ✅ **Clean** (3 hex values pre-audited and accepted) |

### 2.5 `frontend/src/components/TrendChartCard.tsx` (130 lines)

| Aspect | Finding |
|---|---|
| **Imports** | ✅ All tokens from `../tokens` |
| **Token compliance** | ✅ `statusCritical`, `radiusSm/Md`, `spaceSm/Md/Lg`, `fontSizeSm/Md/Lg/Xl`, `fontWeightMedium`, `textSecondary`, `cardStyle` |
| **Hex checks** | ✅ Zero hardcoded hex values |
| **Number scale checks** | ✅ `fontSizeSm(11)`, `fontSizeMd(13)`, `fontSizeLg(15)`, `fontSizeXl(20)` — all within allowed scale. `radiusSm(4)`, `radiusMd(8)` — allowed. `spaceSm(8)`, `spaceMd(12)`, `spaceLg(16)` — multiples of 4. |
| **State handling** | ✅ 4 states: `loading` (Ant Skeleton), `empty` (emoji + message), `error` (WarningOutlined + message + retry button), normal (renders children) |
| **Accent budget** | ✅ `actionPrimary` not directly used. The "Thử lại" `Button type="primary"` uses Ant Design's theme primary color — does NOT count as `actionPrimary` from tokens. Even if counted, total screen uses ≤ 2. |
| **Custom legend** | ✅ Renders horizontal legend items with colored dots + labels. `key={idx}` acceptable since items are static. |
| **Reusability** | ✅ Generic chart wrapper: accepts `title`, `legendItems`, `loading`/`empty`/`error`/`onRetry` flags, `height`, and `children`. Used twice in Home.tsx (BarChart + LineChart). |
| **Verdict** | ✅ **Clean** |

### 2.6 `frontend/src/pages/Home.tsx` (336 lines)

| Aspect | Finding |
|---|---|
| **Imports** | ✅ Ant Design (Row, Col, Typography, Card, Progress, Table, Tag), icons, Recharts (BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer), all dashboard components, 21 token imports |
| **Token compliance** | ✅ All styles use tokens: every color, fontSize, spacing, radius, fontWeight references a token constant |
| **Hex checks** | ✅ Zero hardcoded hex values in Home.tsx |
| **Number scale checks** | ✅ All font sizes use token constants (fontSizeSm/Md/Lg/Stat). The inline `radius={[4, 4, 0, 0]}` on the last Bar is a chart API level which is acceptable — it's a Recharts prop, not a CSS radius. All CSS border radii use `radiusLg`/`radiusMd`. Spacing uses `spaceSm/Md/Lg`. |
| **Accent budget** | ✅ Screen-wide count: `actionPrimary` appears in KpiCard variant="action" (border + value color) — **1 screen use**. TrendChartCard's `<Button type="primary">` uses Ant Design theme primary color, not `actionPrimary` token — **0 additional**. Total: ≤ 2. ✅ Under budget. |
| **Component reuse** | ✅ `KpiCard` × 5, `TrendChartCard` × 2, `FilterBar` × 1 |
| **Data layer** | ✅ All mock data typed with interfaces (`CargoMonth`, `PassengerMonth`, `ExploitationItem`, `InfraRow`) |
| **Error handling** | 🟡 No error state for Table (mock data only). Table uses `dataSource={infraData}` with no loading/error prop — acceptable for mock phase. |
| **Map section** | ✅ Placeholder div with no map library dependency — uses `surfacePage`, `fontSizeStat`, `textTertiary`, `metaStyle` tokens |
| **Table** | ✅ Uses Ant Design `Table` with `size="small"`, `scroll={{ y: 300 }}`, `pagination={false}`. Status column uses `<Tag color={STATUS_COLOR[status]}>` — the color values `'green'`, `'gold'`, `'red'` are Ant Design built-in tag colors, not CSS hex values. Acceptable. |
| **Component architecture** | ✅ Clean separation: `HomePage` wrapper → `FilterProvider` → `HomeDashboard`. `FilterBar`, `KpiCard`, `TrendChartCard` are independent, reusable components. |
| **Verdict** | ✅ **Clean** |

---

## 3. Token Compliance Audit

| File | Hardcoded Hex | Banned Font Sizes | Banned Radius | Banned Spacing | Status |
|---|---|---|---|---|---|
| `tokens.ts` | 13 exact values (definition file — SSOT) | N/A (defines the banned sets) | N/A (defines allowed values) | N/A (defines allowed values) | ✅ |
| `FilterContext.tsx` | 0 | 0 | 0 | 0 | ✅ |
| `FilterBar.tsx` | 0 | 0 | 0 | 0 | ✅ |
| `KpiCard.tsx` | 3 (audited: `#FFF8E1`, `#FFD54F`, `#F57F17`) | 0 | 0 | 0 | ✅* |
| `TrendChartCard.tsx` | 0 | 0 | 0 | 0 | ✅ |
| `Home.tsx` | 0 | 0 | 0 | 0 | ✅ |

*\*3 hex values in `KpiCard.tsx` are lighter/tint variants of amber for the `variant="warning"` styling. These are pre-audited and approved by the architecture doc. No consuming instance of `variant="warning"` exists in Home.tsx, so the hex values have zero visual impact on the current UI.*

---

## 4. Accent Budget Audit

Per `tokens.ts` rule: `actionPrimary` may appear **max 3 times** per screen.

| Usage Location | Counts? | Notes |
|---|---|---|
| KpiCard.tsx — `variant="action"` border (`0.5px solid ${actionPrimary}`) | ✅ Yes (1) | "Hồ sơ chờ duyệt" card |
| KpiCard.tsx — `variant="action"` value color | 🟡 Same instance | Both on same card; counts as 1 screen use |
| KpiCard.tsx — `variant="action"` hover shadow (`${actionPrimary}33`) | 🟡 Same instance | Same card hover effect |
| TrendChartCard.tsx — `Button type="primary"` | ❌ No | Uses Ant Design theme primary, not `actionPrimary` token |
| **Total** | **1 (or ≤ 2 if Button counted)** | **✅ Under budget of 3** |

---

## 5. Component Reusability Assessment

| Component | Instances | Reusable? | Notes |
|---|---|---|---|
| `FilterBar` | 1 | ✅ Yes | Self-contained; reads context; no props needed |
| `KpiCard` | 5 | ✅ Yes | Variant/trend/onClick system supports diverse use cases |
| `TrendChartCard` | 2 | ✅ Yes | Generic wrapper; accepts any chart as children |

---

## 6. Gaps & Recommendations

| Gap | Location | Severity | Recommendation |
|---|---|---|---|
| KpiCard has no `loading` prop | `KpiCard.tsx` | Low | Add `loading` prop (Ant Skeleton) before API integration phase |
| KpiCard warning variant hex values | `KpiCard.tsx:47,51,59` | Info | Consider adding amber tint tokens to `tokens.ts` if warning variant becomes used on screen |
| Table has no loading/error state | `Home.tsx` | Low | Add `loading` prop to Ant Table before real API data |
| Filter state is URL-visible but not validated against allowed values | `FilterContext.tsx:23-29` | Info | Add validation for province/type against allowed options set |
| TrendChartCard uses `key={idx}` for legend rendering | `TrendChartCard.tsx:121` | Info | If legend items become dynamic (API-driven), replace with stable `id` key |

---

## 7. Final Verdict

| Check | Verdict |
|---|---|
| Import correctness | ✅ All imports resolve correctly. No circular dependencies. |
| Token compliance (no hardcoded hex) | ✅ Zero violations beyond 3 pre-audited KpiCard warning tints |
| Accent budget (≤3 actionPrimary) | ✅ ≤ 2 uses on screen. Under budget. |
| Number scales (no banned values) | ✅ All font/radius/spacing values within allowed sets |
| Component reusability | ✅ KpiCard (5×), TrendChartCard (2×), FilterBar (1×) |
| Error/loading/empty states | ✅ TrendChartCard handles all 4 states; 🟡 KpiCard and Table missing loading state (acceptable for mock phase) |
| Code quality | ✅ Clean component separation, typed interfaces, token-consistent styling |

**Verdict: PASS**

The codebase demonstrates strong design token discipline, clean component architecture, and well-structured TypeScript. All 6 files compile clean. The only hardcoded hex values (3 in KpiCard.tsx for the warning variant) are pre-audited and non-impacting. The accent budget is respected. Number scales are enforced. Component reusability is demonstrated with 5+2+1 instances across the dashboard.
