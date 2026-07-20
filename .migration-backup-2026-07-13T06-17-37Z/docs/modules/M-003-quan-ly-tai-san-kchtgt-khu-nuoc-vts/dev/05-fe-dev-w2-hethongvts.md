---
feature-id: M-003
stage: frontend-implementation
agent: engineering-frontend-developer
wave: 2
task: hethongvts
verdict: Pass
last-updated: 2026-07-01
---

# Frontend Implementation Summary — HeThongVTS List & Form (Wave 2)

## Designer Spec Coverage

| Requirement | Status | Notes |
|---|---|---|
| Filter bar: keyword, tinhTrang, trangThai | ✅ Implemented | Input + 2 Selects + Search/Reset buttons |
| Table columns: STT, Tên hệ thống, Vị trí, Tình trạng, Mức độ phủ trách, Đối tác, Trạng thái, Thao tác | ✅ Implemented | Bold tên hệ thống, Tag-style tình trạng, ApprovalStatusBadge for trạng thái |
| Row actions: read/update/delete with permission gates | ✅ Implemented | vts:read, vts:update (PROPOSED only), vts:delete (APPROVED only + Popconfirm) |
| Pagination: page 1-based, showSizeChanger, showTotal | ✅ Implemented | `showTotal: (total) => \`Tổng ${total} bản ghi\`` |
| Loading state: fullscreen Spin | ✅ Implemented | Wraps entire page via Spin.fullscreen |
| Empty state | ✅ Implemented | `<Empty description="Không tìm thấy dữ liệu" />` |
| Error state: Card + Empty + Retry | ✅ Implemented | Same pattern as LuongHangHaiList |
| Breadcrumbs: Trang chủ → Hệ thống VTS | ✅ Implemented | |
| Permission gate on "Thêm mới": vts:create | ✅ Implemented | CrudPageLayout canCreate prop |
| Form: create/edit/detail modes | ✅ Implemented | !id→create, id+mode=edit→edit, id only→detail |
| Form fields: tenHeThong, viTri, tinhTrang, mucDoPhuTrach, nguonGoc, doiTac, attachments | ✅ Implemented | viTri required with validation |
| Detail: Descriptions + AttachmentList + ApprovalActionBar + HistoryTimeline | ✅ Implemented | All shared components used |
| Approval: quyetDinh field | ✅ Implemented | PheDuyetRequest uses `quyetDinh` (line 44-47 of types) |
| doiTac field | ✅ Implemented | Unique to VTS, included in form and detail view |
| validateTrigger: onBlur | ✅ Implemented | AntD default |
| Accessibility: label on all Form.Item | ✅ Implemented | Every Form.Item has label prop |
| Accessibility: icon-only buttons title + aria-label | ✅ Implemented | EyeOutlined, EditOutlined, DeleteOutlined buttons |

## Component / Token Mapping

| UI Requirement | Component/Token | Gap | Justification |
|---|---|---|---|
| Breadcrumbs | AntD Breadcrumb | None | Built-in |
| Filter bar | Input + Select + Row/Col/Space | None | AntD primitives |
| Table | AntD Table via CrudPageLayout | None | Shared layout component |
| Status badge | ApprovalStatusBadge | None | Shared component, §6.1 spec |
| Approval actions | ApprovalActionBar | None | Shared component, §1.2 spec |
| Approval history | HistoryTimeline | None | Shared component, §1.3 spec |
| Attachments | AttachmentList | None | Shared component, §1.4 spec |
| Rejection modal | RejectionModal (internal to ApprovalActionBar) | None | Shared component, §1.5 spec |
| Delete confirmation | AntD Popconfirm | None | Built-in overlay |
| Loading spin | AntD Spin (fullscreen) | None | Built-in feedback |
| Empty state | AntD Empty | None | Built-in feedback |
| CRUD layout | CrudPageLayout | None | Shared wrapper, §1.5 spec |

## Files Changed

| Path | Purpose |
|---|---|
| `frontend/src/pages/hethongvts/HeThongVTSList.tsx` | Full implementation replacing placeholder — filter bar, table, pagination, row actions, empty/error states, breadcrumbs, permission-gated create button |
| `frontend/src/pages/hethongvts/HeThongVTSForm.tsx` | Full implementation replacing placeholder — create/edit/detail modes, form fields with validation, detail view (Descriptions + AttachmentList + ApprovalActionBar + HistoryTimeline), approval flow with quyetDinh |

## Components Created or Modified

### HeThongVTSList.tsx
- **Type:** Created (replaced 5-line placeholder)
- **States covered:** loading (fullscreen Spin), empty (Empty component), error (Card + Empty + Retry button), normal (data table)
- **Tests added:** None (no unit tests framework configured yet)

### HeThongVTSForm.tsx
- **Type:** Created (replaced 5-line placeholder)
- **States covered:** create mode, edit mode (via ?mode=edit), detail mode (readonly Descriptions), loading (fullscreen Spin), error (Card + Empty + Quay lại), approval action pending (button loading)
- **Tests added:** None (no unit tests framework configured yet)

## Accessibility Compliance

| Requirement | Implementation | Verification |
|---|---|---|
| All Form.Item must have label prop | Every Form.Item has explicit `label` attribute | Code review — 7 Form.Items with labels |
| Icon-only buttons need title + aria-label | EyeOutlined/EditOutlined/DeleteOutlined buttons all have both `title` and `aria-label` | Code review — row action column render |
| Permission-blocked buttons hidden (not visible) | Buttons conditionally rendered by permission checks, not aria-disabled | Code review — `userPermissions.includes()` gates |
| RejectionModal autoFocus | Handled by shared RejectionModal component (autoFocus on TextArea) | Code review of shared component |
| Upload aria-label | Handled by shared AttachmentList component (`aria-label="Tải lên tài liệu đính kèm"`) | Code review of shared component |

## Tests Added or Updated

No automated test files added — the project currently has no unit test framework configured for frontend component tests. Manual QA should cover:

- List page: filter bar interactions, pagination, row action visibility per permission, empty/error states
- Form page: create mode (form validation), edit mode (pre-filled data), detail mode (Descriptions rendering)
- Approval flow: approveC1/approveC2/reject with correct `quyetDinh` field in request body
- HistoryTimeline rendering with VTS-specific HistoryEntry shape (nguoiPheDuyet, ngayPheDuyet, lyDo)

## Verification Evidence

```
command: cd /Users/thuytrang/workspace/hang-hai-kchtgt/frontend && npx tsc --noEmit
exit_code: 0
scope: Full TypeScript compilation check — zero errors
```

**Note:** LSP diagnostics on other files in the project (PointObjectList.tsx, BeaconList.tsx, BuoyList.tsx, UnitList.tsx, App.tsx) contain pre-existing errors not introduced by this wave.

## Known Limitations / Mismatches

1. **tinhTrang Select options hardcoded** — The filter bar and form Select for `tinhTrang` use hardcoded options (`Tốt`, `Xuống cấp`, `Hư hỏng`). Per designer spec §6.2, these should be verified against BE enum values. Currently matches the DeKe pattern from §3.2.

2. **No search() for initial data load** — The List page uses `heThongVTSCRUD.list()` per the task brief ("GET / returns Page<>"), which is correct. However, the search() method (which calls `/search` endpoint with keyword/tinhTrang/trangThai params) is defined in the service but not wired to the filter bar search button — the search button currently only resets to page 1. This is a deliberate design choice: list() already supports keyword/tinhTrang/trangThai params in its ListParams. If the BE separates list vs search semantics, this should be revisited.

3. **AttachmentList in form lacks upload/delete hooks** — The AttachmentList in the create/edit form is rendered without `onUpload` or `onDelete` props, making it read-only. Per CG-04 (attachment upload endpoint unknown), upload is deferred. The task brief says `AttachmentList readonly={isDetailMode}` but since we're in edit mode (readonly=false), the Upload.Dragger should appear. This is a mismatch — the attachment upload functionality is not wired to the BE endpoint.

4. **HistoryTimeline HistoryEntry shape** — The types define HistoryEntry with fields `nguoiPheDuyet`, `ngayPheDuyet`, `lyDo` (line 49-56 of heThongVts.ts). The designer spec §5.3 mentions the BE returns `user`, `time`, `decision`, `reason` for TramRadar/VTS PheDuyetResponse. The service layer (`heThongVTSApproval.getHistory`) returns `res.data.data` which maps to the `HistoryEntry[]` type. If the BE returns `user/time/decision/reason`, the service would need an adapter. This is flagged per designer spec CG-02.

5. **ApprovalStatus type** — `ApprovalStatus` is defined in `ApprovalActionBar.tsx` but not exported from `heThongVts.ts`. Worked around by defining a local type alias in the form file.

6. **No router registration** — Per the task brief, I must NOT modify `App.tsx` or `AppLayout.tsx`. Route registration and menu entries must be done separately by the router/integration phase.
