# Pier Management Pages — Wave 1 Implementation Summary

## Task
Rewrite Pier management pages (PierList, PierForm, create PierDetailContent) by cloning the PortListPage/PortFormContent/PortDetailContent pattern using FilterTableLayout, Drawer, and token-based styling.

## Files Modified / Created

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/pages/port/PierList.tsx` | **REWRITE** | Full rewrite following BerthList pattern: FilterTableLayout with filter sidebar, StatusTabs, DataTable, Pagination, Drawer for create/edit/detail, History/Delete/Reject/Submit modals |
| `frontend/src/pages/port/PierForm.tsx` | **REWRITE** | forwardRef component (Drawer-compatible), Tabs with Card sections, all Pier fields, cascading orgUnit→port→berth, auto-generate pierCode, file upload, 3 save actions |
| `frontend/src/pages/port/PierDetailContent.tsx` | **NEW** | Detail component with Tabs (general, GIS, files, system), detail-grid CSS pattern, GPS coordinates table, all Pier entity fields |
| `frontend/src/App.tsx` | **EDIT** | Changed 3 route paths from `/Pier` to `/pier` (lowercase) |

## Key Design Decisions

1. **FilterTableLayout pattern** — PierList uses the shared `FilterTableLayout` component with vertical filter sidebar left + DataTable right, matching BerthList and PortListPage
2. **Drawer instead of Modal** — Create/Edit and Detail use Ant Design `Drawer` (not Modal) with configurable width
3. **forwardRef form** — PierForm uses `forwardRef` + `useImperativeHandle` to expose `submit(saveAction)` for parent Drawer footer buttons
4. **Cascading selects** — orgUnitId → portId → berthId with auto-reset on parent change
5. **Auto-generate pierCode** — calls `GET /v1/piers/generate-code?berthId=` when berthId changes
6. **All CRUD via pierCRUD** — search, findById, create, update, delete via `pierCRUD.*` from `portService`
7. **Approval via pierApproval** — approve/reject via `pierApproval.approve(id)` / `pierApproval.reject(id, reason)`
8. **History modal** — calls `GET /v1/piers/{id}/history`, renders changeHistory + approvalLog in a table with field-name translation

## Theme Compliance

- **Zero hardcoded colors** — all colors from `tokens.ts` (`actionPrimary`, `statusOperational`, `textPrimary`, etc.) or `theme.ts` (`colors.sidebarBg`)
- **Token spacing** — all margins/padding from token scale: `spaceXs`(4), `spaceSm`(8), `spaceFormField`(12), `spaceMd`(16), `spaceLg`(24), `spaceXl`(32)
- **Token font-sizes** — `fontSizeSm`(10), `fontSizeMd`(13), `fontSizeLg`(15), `fontSizeXl`(20)
- **Token border-radius** — `radiusPill`(999) for inputs/buttons, `radiusMd`(8) for textareas, `radiusSm`(4) for badges
- **All Input/Select** — `borderRadius: radiusPill, height: 40`
- **All Form.Item** — `marginBottom: spaceFormField`
- **ScreenHeader** breadcrumb: "Tài sản KCHTGT > Cầu cảng"
- **StatusTabs**: All / DRAFT / PENDING / APPROVED / REJECTED with counts

## Preserved Pier-Specific Business Logic

- `PIER_TYPE_MAP` — 6 pier types (CONTAINER, TONG_HOP, HANH_KHACH, CHUYEN_DUNG_XANG_DAU, CHUYEN_DUNG_ROI_QUANG, KHAC)
- `LOAI_CAU_OPTIONS` — 5 structure types (CAU_TAU_THANG, CAU_TAU_GOC, CAU_DAN, CAU_CHU_T, KHAC)
- `OPERATIONAL_STYLE_MAP` — HIEN_HANH/OPERATIONAL → green, TAM_NGUNG/SUSPENDED → red
- `APPROVAL_STYLE_MAP` — DRAFT → gray, PENDING → blue, APPROVED → green, REJECTED → red
- `trangThaiPheDuyetBadge` from `../../services/port/schema` for approval status rendering

## Verification

- `npx tsc --noEmit` — **PASSED** with zero errors (exit code 0)

## Out of Scope (not modified)

- `PortListPage.tsx`, `PortFormContent.tsx`, `PortDetailContent.tsx` — untouched
- `portService.ts` — pierCRUD/pierApproval already existed
- `AppLayout.tsx` — not modified
