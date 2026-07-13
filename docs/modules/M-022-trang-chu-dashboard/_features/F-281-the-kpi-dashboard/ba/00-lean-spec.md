---
feature-id: F-281
document: lean-spec
output-mode: retrospective
last-updated: 2026-07-13
---

# Lean Spec — Thẻ KPI Dashboard (F-281)

## 1. User Story & Goal

> **As a** port authority officer / dashboard viewer  
> **I want to** see 5 key KPI cards at a glance  
> **So that** I can instantly assess port traffic, cargo volume, passenger volume, infrastructure status, and pending documents without reading charts.

## 2. Actors

| Actor | Role | Notes |
|---|---|---|
| Người dùng Dashboard | Any authenticated user visiting `/` | All 5 cards visible, no permission-filtering |

## 3. Scope — 5 KPI Cards (as built)

| # | Label | Value (mock) | Sub-label | Trend | Variant |
|---|---|---|---|---|---|
| 1 | Lượt tàu qua cảng | 28.450 | — | ▲ 8,9% | `default` |
| 2 | Hàng hóa (nghìn tấn) | 112.480 | — | ▲ 13,9% | `default` |
| 3 | Lượt hành khách | 345.200 | — | ▲ 15,6% | `default` |
| 4 | KCHT đang vận hành | 187 | _trên tổng 215_ | — | `default` |
| 5 | Hồ sơ chờ duyệt | 23 | _Cần xử lý_ | — | `action` |

Cards 1–3 show YoY trend arrows. Card 4 shows "X of total". Card 5 is clickable → `/asset/increase`.

## 4. Component API — `KpiCard`

Import: `import KpiCard from '../components/KpiCard'`

```typescript
interface KpiCardProps {
  label: string;        // e.g. "Lượt tàu qua cảng"
  value: number;        // numeric value → formatted via toLocaleString('vi-VN')
  subLabel?: string;    // optional line below value
  trend?: {             // optional trend indicator
    value: number;      // percentage (displayed to 1 decimal)
    isUp: boolean;      // true → ArrowUpOutlined + green, false → ArrowDownOutlined + red
  };
  variant?: 'default' | 'warning' | 'action';  // visual variant (default = 'default')
  onClick?: () => void;
}
```

**Implementation note:** The `warning` variant (yellow background, #FFF8E1, yellow border) is coded in `KpiCard.tsx` but is **not instantiated** anywhere in `Home.tsx`. Only `default` and `action` are used on the dashboard.

## 5. Variant Behavior

| Variant | Background | Border | Value color | Cursor | Hover effect |
|---|---|---|---|---|---|
| `default` | `surfaceCard` (#FFFFFF) | 0.5px `borderDefault` (#E5E7EB) | `textPrimary` (#1F2937) | default | none |
| `warning` | #FFF8E1 (light yellow) | 0.5px #FFD54F | #F57F17 (amber) | default | none |
| `action` | `surfaceCard` (#FFFFFF) | 0.5px `actionPrimary` (#1B84FF) | `actionPrimary` (#1B84FF) | pointer | box-shadow glow on enter |

**BA Decision (2026-07-13):** The `action` variant (blue) is the CORRECT implementation. Card #5 uses `variant="action"` with blue border and blue value color. The feature brief's mention of yellow background is obsolete — update the brief, not the code.

**Discrepancy with feature-brief.md:** Resolved by BA decision (2026-07-13). The `action` variant (blue) is confirmed as correct. The feature brief's specification of yellow background for card #5 is obsolete and should be updated.

## 6. Trend Display

| Element | Up (isUp = true) | Down (isUp = false) |
|---|---|---|
| Icon | `<ArrowUpOutlined />` | `<ArrowDownOutlined />` |
| Color | `statusOperational` (#1BAF7A) | `statusCritical` (#E34948) |
| Format | `{value.toFixed(1)}%` — e.g. "8,9%" | same |

## 7. States

| State | Implementation | Status |
|---|---|---|
| **Normal** | Card renders with mock/real data | ✅ Built |
| **Loading** | Skeleton placeholder (brief AC #8) | ❌ Not implemented — KpiCard is pure presentational, no loading prop |
| **Empty** | "Không có dữ liệu" (brief AC #9) | ❌ Not implemented — no empty-state prop or fallback |
| **Error** | Message + Retry button (brief AC #10) | ❌ Not implemented — no error state in component |
| **Edge: negative trend** | `isUp: false` → red down-arrow | ✅ Handled |

**Note:** Loading/empty/error states are described in the feature brief's acceptance criteria but have **zero implementation** in the current `KpiCard.tsx`. These are gaps for future waves. Deferred to Phase 2 — KPI cards render with mock data; state machine will be added when API integration reaches KPI cards.

## 8. Token Compliance

| Token used | Role | Where |
|---|---|---|
| `actionPrimary` (#1B84FF) | Accent border + value color | Card #5 (action variant) |
| `statusOperational` (#1BAF7A) | Green up-trend indicator | Cards #1–3 |
| `statusCritical` (#E34948) | Red down-trend indicator | Prepared for negative trends |
| `textPrimary` (#1F2937) | KPI value (default variant) | Cards #1–4 |
| `textSecondary` (#6B7280) | Label text + sub-label value | All cards |
| `surfaceCard` (#FFFFFF) | Card background | All cards |
| `borderDefault` (#E5E7EB) | Card border (default/warning) | Cards #1–4 |
| `radiusLg` (12px) | Border radius | All cards |
| `spaceMd` (12px) | Card padding + grid gap | All cards + grid container |
| `spaceXs` (4px) | Internal spacing between lines | All cards |
| `spaceSm` (8px) | Margin above trend row | Cards with trend |
| `fontSizeSm` (11px) | Label, sub-label, trend % | All cards |
| `fontSizeStat` (28px) | KPI value | All cards |
| `fontWeightMedium` (500) | KPI value font-weight | All cards |
| `fontWeightBold` (600) | Trend percentage font-weight | Cards #1–3 |

**Accent budget:** `actionPrimary` used **once** on the dashboard (card #5 border + value color). Within limit of ≤3 uses per screen per `tokens.ts` policy. No hardcoded hex values found — 100% token-compliant.

## 9. Layout (CSS Grid)

```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
gap: 12px;  /* spaceMd */
```

Responsive: on narrow screens (≤600px), each card occupies full width. On wide screens, up to 5 columns.

## 10. Value Formatting

- `value.toLocaleString('vi-VN')` — uses Vietnamese locale (period as thousand separator, comma as decimal)
- Trend percentage: `trend.value.toFixed(1)` → one decimal, no manual rounding

Examples: 28450 → "28.450", 112480 → "112.480", 8.9 → "8,9%"

## 11. Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| **Q1:** Creates new domain elements? | **No** | `KpiCard` is a pure presentational component with mock data — no backend domain model. |
| **Q2:** Affects system architecture? | **No** | Local to `Home.tsx` and `KpiCard.tsx` — no shared state, no API integration. |
| **Q3:** Approach clear from existing architecture? | **Yes** | Follows existing pattern: component, tokens, grid layout. |
| **Verdict** | → `engineering-technical-lead` | If real data integration is needed, a future wave should connect to F-280 filter context. |

## 12. Key Gaps (for Backlog)

1. **Warning variant unused** — ✅ RESOLVED — action variant is correct per BA decision. Warning variant is intentionally unused (no yellow cards on dashboard).
2. **Loading/empty/error states missing** — Three of the 10 AC items from the feature brief have zero implementation.
3. **Mock data only** — All 5 cards use hardcoded values; no API/backend binding exists.
4. **No FilterContext dependency** — KPI cards are siblings of FilterBar but do not consume filter state.
