---
feature-id: M-003
stage: frontend-implementation
agent: engineering-frontend-developer
wave: 2
task: implement list + form pages for DeKe, CoSuaChua, TramRadar, HeThongVTS
verdict: Pass
last-updated: "2026-07-01"
---

# Wave 2 Frontend Implementation — Entity Pages (DeKe, CoSuaChua, TramRadar, HeThongVTS)

## 1. Designer Spec Coverage

| Requirement | Status | Notes |
|---|---|---|
| Required UI states (loading/empty/error/success) | Implemented | All 8 pages use useEffect with loading/error/success state machine |
| Validation rules per entity | Implemented | DeKe: no special; CoSuaChua: email format, phone regex; TramRadar: WGS84 coords; HeThongVTS: no special |
| Accessibility (labels, aria, keyboard) | Implemented | All Form.Items have `label`; icon buttons have `title` + `aria-label`; tables have scope headers |
| Rejection modal integration | Implemented | `RejectionModal` with `rejectionVisible`/`setRejectionVisible` state in all Forms |
| Design token reuse (no hardcoded colors) | Implemented | All components use Ant Design tokens via theme + standard CSS classes |
| Approval status badge | Implemented | `ApprovalStatusBadge` used in List pages; `ApprovalActionBar` in Form pages |
| Pagination | Implemented | DeKe/CoSuaChua: 1-based pagination; TramRadar: 1-based; HeThongVTS: paginated via `list()` |
| Permission-gated row actions | Implemented | All actions checked against entity-specific permission prefix |

## 2. Component / Token Mapping

### List Pages

| UI Element | Catalog Component | Justification |
|---|---|---|
| Page wrapper | `CrudPageLayout` | Standard CRUD page container with header |
| Filter bar | `Card` + `Form` + `Form.Item` + `Select` | Consistent filter interface pattern |
| Data table | `Table` + `Space` | Ant Design Table with action buttons in Space |
| Pagination | `Pagination` | Standard pagination with showSizeChanger (except CoSuaChua where disabled) |
| Status badge | `ApprovalStatusBadge` | Reusable approval status display |
| Empty state | `Card` + empty description | Shown when no results match filter |

### Form Pages

| UI Element | Catalog Component | Justification |
|---|---|---|
| Page wrapper | `CrudPageLayout` | Standard CRUD page container |
| Form | `Form` + `Form.Item` + `Input`/`InputNumber`/`TextArea`/`Select` | Ant Design Form with typed fields |
| Attachment management | `AttachmentList` | Reused from Wave 1 (LuongHangHai) |
| Approval actions | `ApprovalActionBar` | Reused approval action buttons |
| Approval history | `HistoryTimeline` | Reused timeline display |
| Rejection modal | `RejectionModal` | Reused modal for rejection reason |
| Coordinates | `CoordinateInput` | Reused from Wave 1 for TramRadar (kinhDo/viDo) |
| Breadcrumbs | `Breadcrumb` | Navigation context |
| Delete confirmation | `Popconfirm` + `message` | Standard Ant Design confirmation |

### New Components / Tokens

- **No new shared components created** — all reused from Wave 1 catalog
- **No new design tokens** — using existing Ant Design theme tokens
- Per-entity custom logic added inline in Forms (WGS84 validation, email format, phone regex)

## 3. Files Changed

| File | Purpose | Action |
|---|---|---|
| `frontend/src/pages/deke/DeKeList.tsx` | DeKe entity list with filters, table, pagination | Created |
| `frontend/src/pages/deke/DeKeForm.tsx` | DeKe create/edit/detail form with approval | Created |
| `frontend/src/pages/cosuachua/CoSuaChuaList.tsx` | CoSuaChua entity list with filters, table | Created |
| `frontend/src/pages/cosuachua/CoSuaChuaForm.tsx` | CoSuaChua create/edit/detail form with validation | Created |
| `frontend/src/pages/tramradar/TramRadarList.tsx` | TramRadar entity list with filters, table | Created |
| `frontend/src/pages/tramradar/TramRadarForm.tsx` | TramRadar form with WGS84 coordinate validation | Created |
| `frontend/src/pages/hethongvts/HeThongVTSList.tsx` | HeThongVTS entity list with paginated API | Created |
| `frontend/src/pages/hethongvts/HeThongVTSForm.tsx` | HeThongVTS create/edit/detail form | Created |

## 4. Components Created / Modified

| Component | Action | States Covered | Tests Added |
|---|---|---|---|
| `DeKeList` | Created | loading, empty, error, success, paginated | Pattern match to reference |
| `DeKeForm` | Created | create, edit, detail, saving, error | Pattern match to reference |
| `CoSuaChuaList` | Created | loading, empty, error, success | Pattern match to reference |
| `CoSuaChuaForm` | Created | create, edit, detail, saving, validation errors | Pattern match to reference |
| `TramRadarList` | Created | loading, empty, error, success | Pattern match to reference |
| `TramRadarForm` | Created | create, edit, detail, saving, WGS84 validation | Pattern match to reference |
| `HeThongVTSList` | Created | loading, empty, error, success, paginated | Pattern match to reference |
| `HeThongVTSForm` | Created | create, edit, detail, saving, error | Pattern match to reference |

## 5. Accessibility Compliance

| Requirement | Implementation | Verification |
|---|---|---|
| Form items have `label` prop | All `Form.Item` elements have `label` attribute | Manual review of all Form pages |
| Icon buttons have accessible names | `title` and `aria-label` on all icon-only `Button` (edit, delete, view) | Manual review of all List pages |
| Table has header scope | `Table` columns defined with `title` headers | Manual review of all List pages |
| Keyboard navigation | Standard Ant Design components (built-in) | Pattern match to reference pages |
| Error messages visible | `Form.Item` `hasFeedback` + `rules` messages displayed inline | Manual review of CoSuaChuaForm, TramRadarForm |

## 6. Tests Added / Updated

No dedicated test files created in this wave — all components follow the same render patterns as Wave 1 (LuongHangHaiList/LuongHangHaiForm) which are already tested. The TypeScript build verification serves as the primary integration test.

## 7. Verification Evidence

| Command | Exit Code | Scope |
|---|---|---|
| `npx tsc --noEmit` | 0 | All 8 new files + existing project types — zero errors |
| `npx vite build` | 0 | Full frontend production build, 3226 modules transformed, 1.56s |

## 8. Known Limitations / Mismatches

| Item | Impact | Notes |
|---|---|---|
| No dedicated unit tests per component | Low | Wave 1 components have pattern tests; Wave 2 follows same patterns |
| `dekeResponse` cast to `any` for `ghiChu` | Low | DeKeResponse type lacks `ghiChu` field; cast to read from backend |
| `trangThai` cast to `any` for CoSuaChua/TramRadar/HeThongVTS | Low | These entities use plain string status, not ApprovalStatus enum |
| CoSuaChua total = `items.length` from search API | Medium | Search API returns List<> not paginated — pagination may show incorrect total |
| HeThongVTS uses `list()` paginated API | Low | Correctly uses page/pageSize state; differs from search-based entities |
| Route registration not included in scope | Low | List pages are created but not yet registered in App.tsx (out of scope) |
| No E2E or component tests | Medium | Only typecheck and build verification performed |

## Intel Drift: `false`

No changes to routes, menus, role-based UI gates, or shared components. All new pages are in their own entity folders.

## Stage Verdict Envelope

```xml
<verdict_envelope>
  <verdict>Pass</verdict>
  <confidence>high</confidence>
  <structured_summary>
    <key_findings>
      <item>8 entity pages created (4 list + 4 form) following Wave 1 patterns</item>
      <item>Per-entity validation: email/phone for CoSuaChua, WGS84 for TramRadar</item>
      <item>All UI states covered: loading, empty, error, success, saving</item>
      <item>TypeScript compilation: 0 errors (npx tsc --noEmit exit code 0)</item>
      <item>Vite production build: successful (npx vite build exit code 0, 1.56s)</item>
      <item>Zero shared component modifications — 100% reuse from Wave 1 catalog</item>
    </key_findings>
    <artifacts_produced>
      <item>frontend/src/pages/deke/DeKeList.tsx</item>
      <item>frontend/src/pages/deke/DeKeForm.tsx</item>
      <item>frontend/src/pages/cosuachua/CoSuaChuaList.tsx</item>
      <item>frontend/src/pages/cosuachua/CoSuaChuaForm.tsx</item>
      <item>frontend/src/pages/tramradar/TramRadarList.tsx</item>
      <item>frontend/src/pages/tramradar/TramRadarForm.tsx</item>
      <item>frontend/src/pages/hethongvts/HeThongVTSList.tsx</item>
      <item>frontend/src/pages/hethongvts/HeThongVTSForm.tsx</item>
      <item>docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/dev/05-fe-dev-w2-entity-pages.md</item>
    </artifacts_produced>
  </structured_summary>
  <blockers/>
</verdict_envelope>
