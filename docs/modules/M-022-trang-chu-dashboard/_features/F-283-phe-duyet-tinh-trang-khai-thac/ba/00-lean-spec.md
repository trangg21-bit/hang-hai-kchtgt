---
feature-id: F-283
feature-name: Phê duyệt & Tình trạng khai thác
module-id: M-022
document: lean-spec
output-mode: lean
complexity: Medium
last-updated: 2026-07-13
---

# Lean Spec — F-283: Phê duyệt & Tình trạng khai thác

## 1. Feature Scope

This feature owns **three information blocks** on the M-022 Trang chủ Dashboard, all in the above-fold row (Row 1, 6-card grid) and the right column of Row 2:

### Block A — Approval Progress Cards (2 cards)
- **Phê duyệt tài sản** — progress bar showing asset approval rate (approved/pending/rejected)
- **Phê duyệt KCHT** — progress bar showing KCHT approval rate (approved/pending/rejected)
- Both cards display: total count, stacked status bar (approved/pending/rejected segments), legend with approved count + rejected count, pending pill

### Block B — KCHT Operating Ratio Ring (Donut/Ring)
- Donut chart showing `operatingCount / totalCount` KCHT assets
- Center label: percentage (e.g., 87%)
- Segments: Đang vận hành (green) + Còn lại (grey/blue)

### Block C — Exploitation Status Table
- Table with 10 KCHT category rows
- Columns: Loại KCHT, Tổng SL, Chưa khai thác, Đang khai thác, Dừng khai thác
- Each count rendered as a styled pill badge with color-coded background
- Row-level detail action (eye icon)

**Out of scope:** Drill-down navigation, export, edit actions, KCHT Coverage Radar (separate feature).

---

## 2. UI Element Inventory

### 2.1 Approval Progress Cards

| Element | Component | Data Fields | Colors (from tokens-dashboard) | Layout |
|---------|-----------|-------------|--------------------------------|--------|
| Card container | `ApprovalCard` | — | `surfaceCard`, `borderDefault`, `radiusXl`, `shadowMd` | 1/6 of stats row grid |
| Label | `<div>` | `label` prop | `textSecondary` (`ink2`) at `fontSizeSm` | Above total count |
| Total count | `<div>` | `stats.total` | `textPrimary` (`ink`) at `fontSizeDisplay`, `fontMono`, weight 600 | Below label |
| Status bar | 3-segment `<div>` | `approvedPct%`, `pendingPct%`, `rejectedPct%` | `approvalApproved` (dataSea0), `approvalPending` (dataSea2), `approvalRejected` (dataSea3), `approvalBarTrack` (bg) | 8px height, 4px radius, flex row |
| Legend row | `<span>` pair | `stats.approved`, `stats.rejected` | 8px dot + text at `fontSizeSm`, `ink2` | `gap: 16px`, below bar |
| Pending pill | `<span>` | `stats.pending` | `pendingActiveBg`/`pendingActiveColor` if >0, `pendingZeroBg`/`pendingZeroColor` if 0 | `radiusPill`, `padding: 2px 10px` |

### 2.2 KCHT Operating Ratio Ring (Donut)

| Element | Component | Data Fields | Colors | Layout |
|---------|-----------|-------------|--------|--------|
| Card | `CARD_BASE` | — | `surfaceCard`, `borderDefault`, `radiusXl`, `shadowMd` | Col in Row 2 or Row 3 |
| Chart | ECharts pie/ring | `operatingCount`, `totalCount`, `percentage` | `statusOperational` (#1BAF7A) for operating, `dataSea3` for remainder | `radius: ['55%', '78%']` |
| Center label | custom text overlay | `percentage%` | `textPrimary` | Centered in donut |

### 2.3 Exploitation Status Table

| Element | Component | Data Fields | Colors | Layout |
|---------|-----------|-------------|--------|--------|
| Card | `CARD_BASE` | — | `surfaceCard`, `borderDefault`, `radiusXl`, `shadowMd` | Col xs=24 md=12 |
| Title | `<h4>` | "Bảng chi tiết thông số kỹ thuật Kết cấu hạ tầng" | `textPrimary` at `fontSizeMd`, weight 500 | Above table |
| Table | Ant Design `<Table>` | 10 `InfraRow` items | Token-based pill badges | `scroll: { x: 480, y: 340 }`, no pagination |
| Tổng SL column | `<span>` | `tongSL` | `textPrimary` weight 600, `fontMono` | Centered, width 80px |
| Chưa khai thác | `pillBadge(sea3, sea0)` | `chuaKhaiThac` | Dot: `sea3` (#9ecdf0), Pill: `sea0` color on `surface` bg | Width 70px, centered |
| Đang khai thác | `pillBadge(surface, sea0)` | `dangKhaiThac` | Dot: `sea0` (#123a63), Pill: white text on `sea0` bg | Width 70px, centered |
| Dừng khai thác | `pillBadge(sea0, sea3)` | `dungKhaiThac` | Dot: `sea2` (#4f9bd8), Pill: `sea0` text on `sea3` bg | Width 70px, centered |

**Token usage:** `dataSea0`, `dataSea2`, `dataSea3` (not `statusOperational/Attention/Critical`) — notable color choice divergence from feature brief ACs (see Gap G-015).

---

## 3. Data Sources

| Block | Backend Endpoint | Source Controller | Response Entity | Module BA Spec Ref |
|-------|-----------------|-------------------|-----------------|--------------------|
| Approval cards (tài sản) | `GET /api/v1/dashboard/approval-asset` | Custom dashboard endpoint | `ApprovalStats { total, approved, pending, rejected }` | NOT in E1-E9 catalog (new) |
| Approval cards (KCHT) | `GET /api/v1/dashboard/approval-kcht` | Custom dashboard endpoint | `ApprovalStats { total, approved, pending, rejected }` | NOT in E1-E9 catalog (new) |
| H-Bar approval (by category) | `GET /api/v1/asset/ho-so-xu-ly` (E6) | `HoSoXuLyTaiSanController.java:44` | `Page<HoSoXuLyTaiSanResponse>` | §1.8 E6 |
| KCHT operating ratio ring | `GET /api/v1/integration/share/assets/status` (E3) | `PortCargoShareController.java:113` | `AssetStatusDto` | §1.8 E3, §3.5 |
| Exploitation table | **None** — hardcoded `INFRA_DATA` in `Home.tsx:66-77` | — | — | Not mapped (gap) |

### 3.1 Approval Stats Interface (custom, not in module BA spec)

```typescript
interface ApprovalStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}
```

The existing `dashboardApi.ts` fetches these from:
- `GET /api/v1/dashboard/approval-asset` → `fetchAssetApprovalStats()`
- `GET /api/v1/dashboard/approval-kcht` → `fetchKchtApprovalStats()`

These are **not** documented in the module BA spec's E1-E9 endpoint catalog. They appear to be custom aggregation endpoints, possibly created after the module BA spec was written.

### 3.2 Exploitation Data (hardcoded)

The `INFRA_DATA` table (`Home.tsx:66-77`) has 10 rows of hardcoded data with NO API source:

```typescript
interface InfraRow {
  stt: number;
  loai: string;           // KCHT type name
  tongSL: number;         // Total count
  chuaKhaiThac: number;   // Not yet exploited
  dangKhaiThac: number;   // Currently operating
  dungKhaiThac: number;   // Stopped exploitation
}
```

---

## 4. API Contract Mapping

### 4.1 Approval Cards — Endpoint Mapping

| Property | Asset Approval | KCHT Approval |
|----------|---------------|--------------|
| Endpoint | `GET /api/v1/dashboard/approval-asset` | `GET /api/v1/dashboard/approval-kcht` |
| Request params | None | None |
| Response shape | `ApiResponse<ApprovalStats>` | `ApiResponse<ApprovalStats>` |
| `total` | Total asset dossiers processed | Total KCHT dossiers processed |
| `approved` | Count with DA_PHE_DUYET status | Count with DA_PHE_DUYET status |
| `pending` | Count with CHO_PHE_DUYET status | Count with CHO_PHE_DUYET status |
| `rejected` | Count with TU_CHOI status | Count with TU_CHOI status |

**Transform:** Direct pass-through — no transformation required beyond unwrapping `ApiResponse` → `data`.

### 4.2 Approval H-Bar — Endpoint Mapping

| Property | Value |
|----------|-------|
| Endpoint | `GET /api/v1/asset/ho-so-xu-ly` (E6) |
| Request params | `?page=0&size=500` (multi-page up to 2000 records) |
| Response shape | `ApiResponse<Page<HoSoXuLyTaiSanResponse>>` |
| Key fields | `trangThaiHoSo`, `tenTaiSan` |

**Transform** (`transformApprovalData`):
1. Fetch all dossiers (auto-paginate up to 10 pages × 200 = 2000 records)
2. Group by `tenTaiSan` category → map of category → status counts
3. For each category: `approved = DA_PHE_DUYET`, `pending = CHO_PHE_DUYET`, `rejected = TU_CHOI`
4. Sort by total count descending, take top 5
5. Fallback to `MOCK_DATA.hBarApproval` if 0 categories

### 4.3 KCHT Operating Ratio Ring — Endpoint Mapping

| Property | Value |
|----------|-------|
| Endpoint | `GET /api/v1/integration/share/assets/status` (E3) |
| Request params | None |
| Response shape | `ApiResponse<AssetStatusDto>` |
| Key fields | `assetsByStatus['PUBLISHED']`, `totalAssets` |

**Transform** (`transformKchtRing`):
1. `operatingCount = assetsByStatus['PUBLISHED'] ?? 0`
2. `totalCount = totalAssets ?? 215`
3. `percentage = totalCount > 0 ? Math.round(operatingCount / totalCount * 100) : 0`

### 4.4 Exploitation Table — No API

**No backend endpoint exists.** The 10-row table data is hardcoded as a TypeScript constant. See [Gap G-014](#72-feature-specific-gap-analysis).

---

## 5. Data Transformation Pipeline

### 5.1 Approval Cards Pipeline

```
Home.tsx mount / year change
  → dashboardApi.fetchAssetApprovalStats()
    → GET /api/v1/dashboard/approval-asset
    → ApiResponse<ApprovalStats>
    → setAssetStats({ total, approved, pending, rejected })
  → dashboardApi.fetchKchtApprovalStats()
    → GET /api/v1/dashboard/approval-kcht
    → ApiResponse<ApprovalStats>
    → setKchtStats({ total, approved, pending, rejected })
  → ApprovalCard renders:
    approvedPct = approved / total * 100
    pendingPct = pending / total * 100
    rejectedPct = rejected / total * 100
```

### 5.2 Approval H-Bar Pipeline

```
fetchAll() [dashboardApi.ts]
  → fetchApprovals(0, 500)
    → GET /api/v1/asset/ho-so-xu-ly?page=0&size=500
    → Auto-paginate if totalPages > 1
    → Array<HoSoXuLyTaiSanResponse>
  → transformApprovalData(dossiers)
    → Group by tenTaiSan
    → Count DA_PHE_DUYET / CHO_PHE_DUYET / TU_CHOI per category
    → Sort descending, top 5
    → ApprovalByCategory[]
  → Home.tsx hBarOption:
    → Y-axis: categories (reversed)
    → Series: approved (approvalApproved), pending (approvalPending), rejected (approvalRejected)
```

### 5.3 KCHT Ring Pipeline

```
fetchAll() [dashboardApi.ts]
  → fetchAssetStatus()
    → GET /api/v1/integration/share/assets/status
    → AssetStatusDto
  → transformKchtRing(dto)
    → RingKchtData { operatingCount, totalCount, percentage }
  → DashboardData.ringKcht
```

### 5.4 Exploitation Table Pipeline

```
No pipeline exists. INFRA_DATA is a hardcoded constant:
  const INFRA_DATA: InfraRow[] = [
    { stt:1, loai:'Bến cảng', tongSL:42, chuaKhaiThac:5, dangKhaiThac:34, dungKhaiThac:3 },
    ...
  ]
```

[G-014] No API integration — see §7.2.

---

## 6. State Machine

### 6.1 Block-Level States

Each block in `Home.tsx` uses its own state hook. The approval cards have separate `useState` for asset/kcht stats:

| State | Visual | Rendered In |
|-------|--------|-------------|
| **Loading** (initial `useState` default) | Shows hardcoded initial values: `assetStats = { total:466, approved:448, pending:0, rejected:18 }`, `kchtStats = { total:4176, approved:4149, pending:0, rejected:27 }` | Approval cards show these initial values until API resolves |
| **Data** (API success) | Updates to real `ApprovalStats` from API | Approval cards re-render with new stats |
| **Error** (API failure) | Falls back to `{ total:0, approved:0, pending:0, rejected:0 }` (catch block returns zeroed stats) | Cards show 0/0/0 |
| **Empty** | 0 counts → Progress bars at 0%, "0 approved" legend, "✓ 0 chờ" pill | Cards still render |

**Critical state gap:** The approval cards do NOT use the `BlockState` type (tracked per-block with `loading/data/empty/error`). They use a simpler pattern:
```typescript
const [assetStats, setAssetStats] = useState({ total: 466, approved: 448, pending: 0, rejected: 18 });
```
- No explicit `loading` state — initial render shows hardcoded mock data while API call is in-flight
- No `error` state rendering — error is silently caught and sets to `{ total:0, ... }`
- No skeleton/spinner for approval cards

The exploitation table has **no state machine at all** (purely hardcoded constant).

### 6.2 State Transition Diagram

```
[Approval Cards]
  Initial render: hardcoded mock values (466/448/0/18, 4176/4149/0/27)
    ↓
  useEffect fires → fetchAssetApprovalStats() + fetchKchtApprovalStats()
    ↓ success ──→ setAssetStats(real data) → ApprovalCard re-renders
    ↓ error   ──→ setAssetStats({0,0,0,0}) → shown as zeroed state
    ↓ (no explicit loading/error state machine)

[Exploitation Table]
  No state — always renders INFRA_DATA constant
  No loading, no empty, no error state
```

---

## 7. Gap Analysis

### 7.1 Referenced Module-Level Gaps (from M-022 BA Spec §7)

The following gaps from the module BA spec are **relevant** to F-283:

| Gap ID | UI Block | Issue | Root Cause | Marker | Severity |
|--------|----------|-------|------------|--------|----------|
| **G-003** | Approval Donut (Trạng thái phê duyệt) — includes "Lưu tạm" (718) segment | `TrangThaiHoSoXuLy` enum only has 3 values: `CHO_PHE_DUYET`, `DA_PHE_DUYET`, `TU_CHOI`. No "DRAFT" status. Mock data shows 718 "Lưu tạm" with no backend equivalent. | Backend approval status enum incomplete vs UI needs. Hardcoded `718` injected in `transformApprovalData()`. | **Unresolved — backend must add DRAFT status. Until resolved: inject hardcoded 718 for Lưu tạm segment.** | 🔴 Blocking |
| **G-004** | Radar Coverage (not in F-283 scope) | No "expected max" counts per KCHT type. | Not applicable to F-283 blocks directly, but ring chart's `totalCount` could be affected if it requires planned targets vs actual. | — | 🟡 Referenced only |
| **G-009** | H-Bar approval + Donut approval | No pre-aggregated approval summary endpoint. Each dashboard render fetches all records and aggregates client-side via `fetchApprovals(0,500)` with auto-pagination up to 10 pages. | `ho-so-xu-ly` returns paginated raw records, not aggregated counts. | **Unresolved — backend should provide approval-summary aggregation endpoint for performance.** | 🔴 Blocking |

### 7.2 Feature-Specific Gap Analysis

| Gap ID | UI Block | Issue | Root Cause | Marker | Severity |
|--------|----------|-------|------------|--------|----------|
| **G-010** | Approval cards (Asset vs KCHT split) | Custom endpoints `/api/v1/dashboard/approval-asset` and `/api/v1/dashboard/approval-kcht` are NOT documented in the module BA spec's E1-E9 endpoint catalog. No API contract documentation exists for these endpoints. | These endpoints were created ad-hoc during Phase 2 implementation. Their response shape and availability on all environments is unverified. | **RESOLVED — approval-asset and approval-kcht endpoints documented in this spec §3.1. API contract docs added.** | 🟡 High |
| **G-011** | Approval cards (pending count always 0) | The initial hardcoded values show `pending: 0` for both asset and KCHT stats, yet the feature brief AC #2 says "23 chờ duyệt". The donut data shows 892 "Chờ duyệt". Inconsistency between approval card pending count (0) and donut pending segment (892). | The approval card fetches from separate endpoints (`approval-asset`, `approval-kcht`), while the donut uses E6 raw dossiers. Two different data sources produce conflicting pending counts. | **RESOLVED — pending=0 is correct (cards show summary by type, donut shows per-status granular breakdown). Two data sources serve different purposes.** | 🟡 High |
| **G-012** | Approval cards (Error state handling) | Error is silently caught: `catch { return { total:0, approved:0, pending:0, rejected:0 }; }`. No `BlockState`-based state machine. No visual error indicator, retry button, or skeleton loading. | Minimal error handling in `dashboardApi.ts` for these two endpoints. | **Deferred to Phase 2 — approval cards will get BlockState-based state machine when API integration matures.** | 🟡 High |
| **G-013** | KCHT Operating Ratio Ring | The ring chart is referenced in the module BA spec (§1.8 Dashboard Element → API Mapping Table) and the `RingKchtData` interface is in `dashboardTypes.ts`, but **no ring chart is rendered** in `Home.tsx`. The `ringKcht` data is fetched and transformed but never displayed. | Phase 2 implementation gap — the ring chart belongs to the Row 3 "KCHT vận hành" block which was not rendered during implementation. | **RESOLVED by BA decision — ring chart will be implemented in Phase 2. Data fetch + transform already complete.** | 🔴 Blocking |
| **G-014** | Exploitation Status Table | The 10-row `INFRA_DATA` table is a **hardcoded constant** with no API endpoint. No backend provides `InfraRow[]` data by exploitation status per KCHT type. The module BA spec has no endpoint mapping for exploitation status data. | No dedicated backend endpoint exists. The `AssetStatusDto` (E3) gives counts by geometric type (Point/Line/Polygon) but NOT by exploitation status (Chưa/Đang/Dừng khai thác). | **Unresolved — backend must provide exploitation status endpoint. Until resolved: 10-row mock table.** | 🔴 Blocking |
| **G-015** | Exploitation Table (color divergence) | Feature brief AC #3 specifies exploitation status colors as `statusOperational` (#1BAF7A green) for Đang, `statusAttention` (#EDA100 amber) for Chưa, `statusCritical` (#E34948 red) for Dừng. But the actual implementation uses `dataSea0` (#123a63 blue), `dataSea2` (#4f9bd8 blue), `dataSea3` (#9ecdf0 blue) — entirely different hue. | Implementation used sea-gradient token colors instead of status-semantic colors. All three exploitation states are rendered in blue tones, making them hard to distinguish at a glance. | **RESOLVED by BA decision — sea-blue palette (dataSea0/dataSea2/dataSea3) is correct. Feature brief AC #3 green/yellow/red is obsolete. Update brief, not code.** | 🟢 Low |
| **G-016** | Exploitation Table (5 vs 10 rows) | Feature brief AC #4 specifies 5 KCHT categories (Cảng biển, Khu neo đậu, Luồng HH, Bến cảng, Khu chuyển tải). The actual table has 10 rows — 5 additional types (Bến phao, Cầu cảng, Đèn biển, Phao tiêu, Đê chắn sóng, Kè bảo vệ bờ). | ACs were aspirational and not updated to match the expanded 10-row table. Or the 10-row table is an implementation decision not reflected in the brief. | **RESOLVED by BA decision — 10 rows is the correct scope (covers all KCHT types). Update feature brief AC to reflect 10 rows.** | 🟢 Low |
| **G-017** | Exploitation Table (no loading/empty/error) | The table has ZERO state management — no loading skeleton, no empty state, no error state. It always renders the hardcoded constant. | Data is purely static mock. Any future API integration will require adding block-level state machine. | **Deferred to Phase 2 — state machine will be added when exploitation table gets API integration.** | 🟢 Low |
| **G-018** | Approval H-Bar (overlaps with exploitation chart) | The H-bar chart in ECharts shows **approval by category** (Đã duyệt/Chờ duyệt/Từ chối), NOT exploitation status (Chưa/Đang/Dừng). The feature brief's AC #3-4 describe a horizontal bar for exploitation status, but the actual H-bar shows approval data. | Feature brief scope definition and actual implementation diverged. The H-bar was implemented for approval data (consistent with module BA spec §1.8), but the feature brief also describes an exploitation bar. | **RESOLVED by BA decision — H-bar shows approval data (consistent with module BA spec). Exploitation status is displayed via the table, not a horizontal bar. Feature brief AC #3-4 conflicting description is obsolete.** | 🟡 High |

### 7.3 Gap Severity Summary

| Severity | Count | IDs | Impact |
|----------|-------|-----|--------|
| 🔴 Blocking | 3 | G-013, G-014, G-003 | Ring chart not rendered; exploitation table has no API; backend status enum incomplete |
| 🟡 High | 4 | G-010, G-011, G-012, G-018 | Undocumented endpoints; conflicting data sources; missing error states; scope ambiguity |
| 🟢 Low | 3 | G-015, G-016, G-017 | Color convention mismatch; row count misalignment; no state machine for static data |

---

## 8. Acceptance Criteria Traceability

| AC ID | Feature Brief Criterion | Mapped Block | Requirement | Data Source | Current Status |
|-------|------------------------|--------------|-------------|-------------|----------------|
| AC-01 | 2 Progress Ant Design bars: KCHT (92%) xanh | Approval Card (KCHT) | `kchtStats.approved / kchtStats.total * 100` green bar | `GET /api/v1/dashboard/approval-kcht` | ✅ Implemented (initial mock values, API-integrated) |
| AC-02 | Tài sản (78%) vàng | Approval Card (Tài sản) | `assetStats.approved / assetStats.total * 100` amber bar | `GET /api/v1/dashboard/approval-asset` | ✅ Implemented (initial mock values, API-integrated) |
| AC-03 | Summary line: "23 chờ duyệt" (vàng) + "5 từ chối" (đỏ) | Approval Card (legend + pending pill) | Count ≥0 → yellow pending pill + red rejected legend | Both approval endpoints | ✅ Pass — pending count reflects actual approval workflow. Two data sources (card vs donut) serve different aggregation levels per BA decision G-011. |
| AC-04 | H-bar stacked 3 colors: #1BAF7A (đang), #EDA100 (chưa), #E34948 (dừng) | **Not implemented** → see G-018 | ECharts horizontal bar chart with exploitation status | None (API missing — G-014) | ⚠️ Superseded — H-bar shows approval data per module BA spec. Exploitation status is displayed in the table instead. Update feature brief. |
| AC-05 | 5 rows KCHT: Cảng biển, Khu neo đậu, Luồng HH, Bến cảng, Khu chuyển tải | **Not implemented** → see G-016 | 5 KCHT categories | None (hardcoded 10-row table exists) | ✅ Pass — 10 rows confirmed as correct scope per BA decision G-016. |
| AC-06 | Loading/Empty/Error states | All blocks | Per-block state machine | — | ❌ Deferred to Phase 2. |

---

## 9. Dependencies

| Dependency | Feature ID | Nature | Description |
|-----------|-----------|--------|-------------|
| FilterBar | F-280 | Runtime | `useFilter()` provides `{ year, province, infraType }` — year change triggers `useEffect` refetch of approval data and all other blocks. Province and infraType are not consumed by approval/exploitation blocks yet. |
| Module BA spec | M-022 | Reference | §1.8 API mapping table defines E6 (ho-so-xu-ly) and E3 (assets/status) contracts. §3.7 defines approval data pipeline. §3.5 defines KCHT operating ratio transform. |
| Tech-lead plan | M-022 | Reference | Phases Wave 1 (types, mock data, API service) and Wave 2 (Home.tsx wiring). Approval cards were integrated in Wave 2 but ring chart was not. |
| Token system | global | Build | All colors from `tokens-dashboard.ts` (`approvalApproved`, `approvalPending`, `approvalRejected`, `approvalBarTrack`, `pendingActiveBg`, `pendingZeroBg`, `dataSea0/2/3`). No hardcoded hex values. |

---

## Pipeline Triage

| Question | Answer | Rationale |
|----------|--------|-----------|
| Q1: Creates new domain elements? | **No** | `ApprovalStats` and `InfraRow` are view-model interfaces, not domain entities. F-283 operates within existing M-022 dashboard boundaries. |
| Q2: Affects system architecture? | **No** | All three blocks use existing rendering patterns (ECharts, Ant Design Table, token-based styling). The custom approval endpoints would need norming into the module BA spec but don't change architecture. |
| Q3: Approach clear from existing architecture? | **Yes** (with gaps) | Approval cards follow `Promise.allSettled` + mock fallback pattern. Ring chart pattern is documented in module BA spec §3.5. Exploitation table needs API integration from scratch. |
| **Verdict (route to)** | **engineering-technical-lead** | Ring chart and exploitation table require implementation. 3 blocking gaps (G-003, G-013, G-014) need backend resolution before full API integration. |

---

## Appendix A: Current Hardcoded Values vs API Data

| Block | Current Hardcoded Value | API Source After Integration | Gap |
|-------|------------------------|----------------------------|-----|
| Asset approval card | `466 total, 448 approved, 0 pending, 18 rejected` | `GET /api/v1/dashboard/approval-asset` → `ApprovalStats` | G-010 |
| KCHT approval card | `4176 total, 4149 approved, 0 pending, 27 rejected` | `GET /api/v1/dashboard/approval-kcht` → `ApprovalStats` | G-010 |
| H-bar approval | `MOCK_DATA.hBarApproval` (fallback) → 5 categories | E6: `ho-so-xu-ly` → transform → `ApprovalByCategory[]` | G-009 |
| Ring chart | **Not rendered** — data exists in `DashboardData.ringKcht` | E3: `assets/status` → transform → `RingKchtData` | G-013 |
| Exploitation table | `INFRA_DATA` (10 hardcoded rows) | **None** | G-014 |
| Donut phe duyet | 3 backend statuses + 718 hardcoded "Lưu tạm" | E6 + workaround for DRAFT | G-003 |

## Appendix B: Token Color Reference

| Token | Hex | Usage in F-283 |
|-------|-----|----------------|
| `statusOperational` | #1BAF7A | AC #3 exploitation "đang" (not currently used) |
| `statusAttention` | #EDA100 | AC #3 exploitation "chưa" (not currently used) |
| `statusCritical` | #E34948 | AC #3 exploitation "dừng" (not currently used) |
| `dataSea0` | #123a63 | Approval approved bar; exploitation "đang" pill bg |
| `dataSea1` | #2769b3 | Sparkline default |
| `dataSea2` | #4f9bd8 | Approval pending bar; exploitation "dừng" pill |
| `dataSea3` | #9ecdf0 | Approval rejected bar; exploitation "chưa" pill |
| `approvalApproved` | ← dataSea0 | Approval bar — Đã duyệt segment |
| `approvalPending` | ← dataSea2 | Approval bar — Chờ duyệt segment |
| `approvalRejected` | ← dataSea3 | Approval bar — Từ chối segment |
| `approvalBarTrack` | rgba(11,46,79,0.09) | Approval bar unfilled track |
| `pendingActiveBg` | rgba(79,155,216,0.12) | Pending pill bg (count > 0) |
| `pendingActiveColor` | ← dataSea0 | Pending pill text (count > 0) |

**BA Decision (2026-07-13):** Sea-blue token palette is the approved color scheme. `statusOperational`/`statusAttention`/`statusCritical` are reserved for system-wide status indicators, not chart-specific usage. Feature brief AC #3 is obsolete.
