# Frontend Implementation Summary — Dashboard ECharts Redesign

- **feature-id:** M-022-trang-chu-dashboard
- **stage:** frontend-implementation
- **agent:** engineering-frontend-developer
- **wave:** 1
- **task:** dashboard-echarts-redesign
- **verdict:** Blocked
- **last-updated:** 2026-07-10

## Designer Spec Coverage

| Requirement | Status | Notes |
|---|---|---|
| Hero ribbon with gradient | Partial | 2-color gradient (`navy → sea0`) vs spec 3-color (`#0b2e4f → #123a63 → #1a4f82`) |
| Hero left: mono label, big KPI, unit, green delta pill | Partial | Delta badge uses `stApproved` green bg + white text; spec wants `rgba(22,163,122,0.12)` bg + `#16a37a` text |
| Hero right: 3 readouts + alert box | Implemented | Readout layout is value-first then label (vs spec label-first then value) |
| 4 KPI sparkline cards | Implemented | Card 4 sparkline uses `sea1` (blue) for bar type; spec requires `stPending` (orange) |
| Stacked bar cargo chart | Implemented | 4 series with sea gradient colors, rounded top corners on last series |
| Donut vehicle types | Implemented | Same radius/border/typography as spec |
| Line passenger chart | Implemented | 2 series with area fills, markPoint at max (uses stPending — **exceeds accent budget**) |
| Ring KCHT operating | Partial | Uses `roundCap: true` (invalid for ECharts pie) instead of two-pie track approach |
| Radar coverage chart | Implemented | 5 axes, single series |
| H-bar approval by category | Implemented | 3 segments, status colors consistent |
| Donut approval status | Implemented | 4 slices, same status colors as H-bar |
| Responsive ≤1080px stacking | Partial | Uses AntD `xs`/`lg`/`md` breakpoints (responsive but not CSS grid `≤1080px` as specified) |
| WCAG accessibility | Partial | Basic contrast met; no explicit aria attributes beyond alt text |
| Design tokens (zero hardcoded hex) | Partial | Uses tokens from `tokens-dashboard.ts`; hero gradient uses hardcoded 3-color string |

## Component / Token Mapping

| UI Element | Component/Token | Gap |
|---|---|---|
| FilterBar | `<FilterBar />` imported from `../components/FilterBar` | Still imports from `../tokens` (not `../tokens-dashboard`) |
| Hero ribbon | Token: `rCard`, `shadowLg`, `navy`, `sea0` | Gradient string is hardcoded 3-color |
| Hero delta badge | Token: `rPill` | Uses `stApproved` bg; spec wants `rgba(22,163,122,0.12)` |
| Sparkline cards | Token: `surface`, `shadowMd`, `rCard`, `navy`, `sea1`, `stPending` | Card 4 should use `stPending` color |
| Cargo stacked bar | Token: `sea0`, `sea1`, `sea2`, `sea3` | Correct |
| Vehicle donut | Token: `CIRCLE_RADIUS`, `CIRCLE_ITEM_STYLE` | Same radius/border as spec |
| Passenger line | Token: `sea1`, `teal`, `stPending` | **stPending exceeds budget** |
| KCHT ring | Token: `sea2`, `sea0`, `bgTint` | Needs two-pie approach instead of `roundCap` |
| Radar | Token: `sea1`, `bg`, `bgTint`, `line` | Correct |
| H-bar approval | Token: `stApproved`, `stPending`, `stRejected` | Correct |
| Status donut | Token: `stApproved`, `stPending`, `stRejected`, `stDraft` | Correct |

## Files Changed

| Path | Action | Purpose |
|---|---|---|
| `frontend/src/tokens-dashboard.ts` | Already exists | Dashboard tokens + chart helpers |
| `frontend/src/pages/Home.tsx` | Rewritten (prior session) | ECharts dashboard replacing Recharts |
| `frontend/src/components/FilterBar.tsx` | **NOT modified** | Tool constraint prevented edit |

## Components Created / Modified

| Component | Status | Notes |
|---|---|---|
| `Home.tsx` (full page) | Rewritten | 10 ECharts charts + hero ribbon + 4 KPI sparkline cards |
| `FilterBar.tsx` | Not modified | Tool blocked edit to `frontend/src/` path |

## Accessibility Compliance

| Requirement | Implementation | Verification |
|---|---|---|
| Color contrast on light text | Hero uses white text on navy gradient (meets WCAG AA) | Visual check |
| Interactive elements have focus styles | Alert button uses native `<button>` element | TypeScript compile |
| No color-only information | Hero delta badge has both color and text ▲ symbol | Visual check |

## Tests Added / Updated

No test files were added. The existing `KpiCard.test.tsx`, `TrendChartCard.test.tsx`, and other test files were not modified.

## Verification Evidence

| Command | Exit Code | Scope |
|---|---|---|
| `npx tsc --noEmit` | 0 | TypeScript compile — clean |
| `npm install echarts echarts-for-react` | 0 | ECharts dependencies installed |

## Orange Accent Budget Check

| Placement | Current | Spec |
|---|---|---|
| 1. Hero alert box | ✅ Uses `stPending` (lines 560-567) | ✅ |
| 2. H-bar "Chờ duyệt" | ✅ Uses `stPending` (line 439) | ✅ |
| 3. Donut "Chờ duyệt" | ✅ Uses `stPending` (line 469) | ✅ |
| **EXTRA: Passenger line markPoint** | ❌ Uses `stPending` (line 323) | **FAIL** — exceeds budget |

**Total non-import stPending references: 6** (spec requires exactly 3 placements, with ≤3 logical uses)

## Known Limitations / Mismatches for QA

1. **stPending accent budget exceeded:** The passenger line chart has a markPoint annotation (pin) using `stPending` orange at the max value. This is a 4th usage beyond the 3 allowed.

2. **Hero gradient is 2-color, not 3-color:** Uses `linear-gradient(135deg, navy 0%, sea0 100%)` — missing the intermediate `#1a4f82` at 40%.

3. **Hero delta badge style:** Uses `stApproved` (green) solid background with white text. Spec requires `rgba(22,163,122,0.12)` light background with `#16a37a` green text.

4. **Hero readout order:** Value displayed first, then label. Spec says label-first, then value.

5. **KPI card #4 sparkline:** Uses `sea1` (blue) for bar chart. Spec requires `stPending` (orange) for this card.

6. **Ring chart implementation:** Uses `roundCap: true` (invalid for ECharts pie type). Should use two-pie approach (track + progress) with white borders matching other circular charts.

7. **Responsive breakpoints:** Uses AntD grid (`xs`/`lg`/`md`) rather than CSS grid `≤1080px` media query specified in the brief.

8. **FilterBar not restyled:** Tool constraint prevented editing `frontend/src/components/FilterBar.tsx`. It still imports from `../tokens` instead of `../tokens-dashboard`.

9. **Donut center graphic spacing:** Uses 43%/57% vertical centering. Spec says 40%/52%.

10. **Status donut values differ:** Current file has 2140/892/426/718 = 4176. Spec says 2456/893/512/315 = 4176. Totals match but individual values differ.

## Blockers

1. **Tool permission constraint:** The `edit` and `write` tools do not accept paths under `frontend/src/` (matching only `src/**` which points to SDLC docs directory). This prevented fixing 10 specification deviations listed above, including FilterBar restyle, stPending budget fix, hero styling, and ring chart correction.

2. **Ring chart `roundCap`:** The `roundCap` property is not supported for ECharts `pie` type — it only works with `gauge` type. The chart will render without rounded arc ends.

<verdict_envelope>
  <verdict>Blocked</verdict>
  <confidence>medium</confidence>
  <structured_summary>
    <key_findings>
      <item>ECharts npm package installed (echarts + echarts-for-react)</item>
      <item>tokens-dashboard.ts already exists with correct token values</item>
      <item>Home.tsx already has complete ECharts rewrite from prior session — compiles clean (tsc exit 0)</item>
      <item>0 Recharts imports remain in Home.tsx</item>
      <item>stPending accent budget exceeded by 1 extra usage (passenger line markPoint)</item>
      <item>10 spec deviations remain: hero gradient, delta badge, readout order, card 4 sparkline color, ring chart, responsive breakpoints, FilterBar tokens, donut spacing, donut values</item>
    </key_findings>
    <artifacts_produced>
      <item>docs/modules/M-022-trang-chu-dashboard/dev/05-fe-dev-w1-dashboard-echarts-redesign.md</item>
    </artifacts_produced>
  </structured_summary>
  <blockers>
    <item>Tool permission blocks edit/write to frontend/src/ — 10 spec deviations unfixable without human intervention</item>
    <item>Ring chart uses roundCap (invalid for pie) — requires two-pie track approach</item>
    <item>stPending accent budget exceeded (line 323 markPoint)</item>
  </blockers>
</verdict_envelope>
