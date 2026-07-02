---
feature-id: M-003
stage: design-review
agent: sdlc-designer
verdict: Ready for handoff
last-updated: 2026-07-01
---

# UI/UX Spec — M-003: Quản lý Tài sản KCHTGT — Khu nước & VTS

## Component Vocabulary Built (from component-catalog.md)

> Component catalog not available at `docs/ui-library/component-catalog.md`. Vocabulary built from direct FE reference scan (BeaconList.tsx / BeaconForm.tsx / beaconService.ts). This is valid per lifecycle contract fallback: source scan mode.

- **Kit source:** source scan (BeaconList, BeaconForm, beaconService, api)
- **Categories enumerated:** Layout (Card, Row, Col, Space, Divider), Navigation (Breadcrumb, Menu), Forms (Form, Input, InputNumber, Select, DatePicker, Switch, Upload), Data Display (Table, Descriptions, Tag, Badge, Timeline, Tooltip), Actions (Button, Dropdown, Popconfirm), Feedback (message, Modal, Spin, Empty, Alert), Overlay (Modal, Drawer)
- **Total components in vocabulary:** 27 (AntD 6 core components confirmed in use)

### Screen Compositions

| Screen | Type | Components used | Gaps |
|---|---|---|---|
| LuongHangHai List | list | Table, Card, Select (filter), Input (search), Tag (status), Button, Popconfirm | None |
| LuongHangHai Form/Detail | form-create/edit + detail | Form, Input, InputNumber, Select, DatePicker, Upload, Descriptions, Timeline, Divider, Button | None |
| DeKe List | list | Same as LuongHangHai List | None |
| DeKe Form/Detail | form-create/edit + detail | Form, Input, InputNumber (chieuDai/Rong/Cao), Select, Upload | None |
| CoSuaChuaDongTau List | list | Same pattern | None |
| CoSuaChuaDongTau Form/Detail | form-create/edit + detail | Form, Input, Select (loaiCoSo, tinhThanh), Upload | None |
| TramRadar List | list | Same pattern | None |
| TramRadar Form/Detail | form-create/edit + detail | Form, Input, InputNumber (kinhDo/viDo WGS84), Select, Upload | Coordinate validation range display |
| HeThongVTS List | list | Same pattern | None |
| HeThongVTS Form/Detail | form-create/edit + detail | Form, Input, Select, Upload | None |
| Shared: ApprovalActionBar | Overlay | Button group, Modal (rejection reason), Tag (status) | Replaces `window.prompt` in BeaconForm |
| Shared: HistoryTimeline | Data Display | Timeline, Descriptions | None |
| Shared: AttachmentList | Data Display + Actions | Upload, Table (file list), Button (download) | None |

### Gaps Requiring Custom Work

| Element | Why no catalog component covers it | Proposed approach |
|---|---|---|
| ApprovalStatusBadge | AntD Tag exists but approval state color mapping is domain-specific | Custom wrapper around `<Tag>` with PROPOSED/UNDER_REVIEW/APPROVED/REJECTED → color map |
| ApprovalActionBar | Multi-state conditional button bar (C1/C2/reject per role) | Custom component with permission-gated rendering |
| HistoryTimeline | AntD Timeline exists but needs domain event formatting | Custom wrapper around `<Timeline>` |
| AttachmentList | AntD Upload exists but needs download + view mode | Custom component handling view-only + edit modes |
| CoordinateInput | Standard InputNumber but needs WGS84 range validation | Custom Form.Item with validator |
| RejectionModal | `window.prompt` (BeaconForm) must be replaced | `<Modal>` with `<Form>` + required textarea |

---

## 1. Shared Components (build once, reuse across all 5 entities)

These components are **mandatory** — all 5 entity groups share identical approval mechanics, history structure, and attachment handling.

### 1.1 `ApprovalStatusBadge`

```
Props: status: 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
       size?: 'default' | 'small'
```

| Status value | AntD Tag color | Label (Vietnamese) |
|---|---|---|
| PROPOSED | default (gray) | Chờ duyệt |
| UNDER_REVIEW | processing (blue) | Đang xem xét |
| APPROVED | success (green) | Đã phê duyệt |
| REJECTED | error (red) | Từ chối |

Note: `CoSuaChuaDongTau`, `TramRadar`, `HeThongVTS` return `trangThai` as a raw String from BE — normalize to enum values before passing to this component. `LuongHangHai` and `DeKe` return the enum directly as `approvalStatus`.

### 1.2 `ApprovalActionBar`

Displayed at the bottom of the Detail/Form page. Conditional rendering driven by `(record.status, userPermissions)`.

```
Props:
  entityId: string
  currentStatus: ApprovalStatus
  permissions: string[]          // from auth store
  entityPermissionPrefix: string // e.g. 'luonghanghai', 'deke', etc.
  onAction: (action: 'submit' | 'approveC1' | 'approveC2' | 'reject', payload?) => void
```

Visibility rules (gates are additive — all conditions must be true):

| Button | Label | Visible when status | Required permission |
|---|---|---|---|
| Gửi phê duyệt | Gửi duyệt | PROPOSED | `{prefix}:create` OR `{prefix}:update` |
| Phê duyệt C1 | Phê duyệt C1 | UNDER_REVIEW | `{prefix}:approvec1` |
| Phê duyệt C2 | Phê duyệt C2 | UNDER_REVIEW | `{prefix}:approvec2` |
| Từ chối | Từ chối | UNDER_REVIEW | `{prefix}:approvec1` OR `{prefix}:approvec2` |

Self-approval guard: if `nguoiPheDuyet` on the record matches the current user, the Phê duyệt C2 button is disabled with Tooltip: "Bạn không thể tự phê duyệt hồ sơ do mình xét duyệt C1".

Rejection flow: clicking "Từ chối" opens `RejectionModal` (Modal with required textarea for `lyDo`). Confirmation disabled until at least 10 characters entered.

Loading state: all buttons enter `loading` state during pending API call; show `Spin` overlay if full-page save.

### 1.3 `HistoryTimeline`

```
Props: history: HistoryEntry[]
```

Fetched from `GET /{id}/history`. Each entry renders in AntD `<Timeline>`:
- Icon color: green for APPROVED, red for REJECTED, blue for UNDER_REVIEW, gray for PROPOSED
- Content: `{action} — {nguoiThucHien} — {thoiGian formatted dd/MM/yyyy HH:mm}` + optional `lyDo` in subdued text
- Empty state: `<Empty description="Chưa có lịch sử phê duyệt" />`
- Loading state: `<Spin />` while fetching
- Error state: `<Alert type="error" message="Không tải được lịch sử" showIcon />` with Retry button

Required permission: `{prefix}:history` (only `cosuachua`, `tramradar`, `vts` declare this; `luonghanghai` and `deke` use generic `read` — see Contract Gaps §7).

### 1.4 `AttachmentList`

```
Props:
  attachments: Attachment[]
  entityId: string
  readonly: boolean
  onUpload: (file: File) => Promise<void>
  onDelete: (attachmentId: string) => Promise<void>
```

- In readonly=true (detail view): renders file list with download/preview button only
- In readonly=false (form edit): renders AntD `<Upload>` dragger + existing file list with delete
- File types allowed: as per existing beacon pattern (PDF, DOC, DOCX, XLS, XLSX, image)
- Max file size: 10MB per file (match existing beacon behavior unless BE specifies otherwise — see Contract Gaps §7)
- Empty state: "Chưa có tài liệu đính kèm"

### 1.5 `CrudPageLayout` (generic wrapper)

Shared page layout for all 5 List pages:

```
Structure:
  Breadcrumb
  Card (filter bar)
    Row: [search Input] [filter Selects...] [Tìm kiếm Button] [Xóa bộ lọc Button]
  Card (table area)
    [Thêm mới Button — permission gated]
    Table (paginated, rowKey="id")
    pagination: showSizeChanger, showTotal
```

---

## 2. Entity: Luồng Hàng Hải (F-038..F-043)

**Base route:** `/api/v1/luong-hang-hai`  
**Frontend route prefix:** `/luong-hang-hai`  
**Permission prefix:** `luonghanghai`

### 2.1 List Page — `/luong-hang-hai`

**Route registration:**
```tsx
<Route path="/luong-hang-hai"
  element={<PermissionGuard permission="luonghanghai:read"><LuongHangHaiList /></PermissionGuard>} />
```

**Filter bar (maps to `GET /search` params):**

| UI control | Type | BE param | Notes |
|---|---|---|---|
| Ô tìm kiếm | Input | `keyword` | Debounced 400ms |
| Giờ điện | Select | `gioDien` | Options: values from BE enum or free text |
| Tải trọng | InputNumber range | `taiTrong` | Single max value (BE takes single numeric) |
| Trạng thái phê duyệt | Select | `trangThaiPheDuyet` | Options: PROPOSED/UNDER_REVIEW/APPROVED/REJECTED |

**Table columns:**

| Column | Source field | Render | Sortable |
|---|---|---|---|
| STT | row index | number | No |
| Loại tàu | `loaiTau` | Text | Yes |
| Số lượng | `soLuong` | number | No |
| Giờ điện | `gioDien` | Text | No |
| Tải trọng (DWT) | `taiTrong` | number | No |
| Diện tích đăng bộ | `dienTichDangBo` | number | No |
| Ngày ghi nhận | `ngayGhiNhan` | dd/MM/yyyy | Yes |
| Trạng thái | `approvalStatus` | `<ApprovalStatusBadge>` | Yes |
| Thao tác | — | Icon buttons | No |

**Row action buttons (permission-gated):**

| Action | Permission | Condition |
|---|---|---|
| Xem chi tiết | `luonghanghai:read` | Always |
| Chỉnh sửa | `luonghanghai:update` | status == PROPOSED only (APPROVED records are locked) |
| Xóa | `luonghanghai:delete` | status == APPROVED (soft-delete per DESIGN.md) |

Pagination: `page` + `size` params. Default `size=20`. Show `showTotal={(total) => \`Tổng ${total} bản ghi\`}`.

Empty state: `<Empty description="Không có dữ liệu luồng hàng hải" />`.

### 2.2 Create Form — `/luong-hang-hai/create`

**Route:**
```tsx
<Route path="/luong-hang-hai/create"
  element={<PermissionGuard permission="luonghanghai:create"><LuongHangHaiForm /></PermissionGuard>} />
```

**Form fields (maps to `CreateLuongHangHaiRequest` DTO):**

| Field label | Field key | Input type | Required | Validation |
|---|---|---|---|---|
| Loại tàu | `loaiTau` | Select or Input | Yes | Not empty |
| Số lượng | `soLuong` | InputNumber | No | >= 0, integer |
| Ngày ghi nhận | `ngayGhiNhan` | DatePicker | No | Not future date |
| Giờ điện | `gioDien` | Input | No | — |
| Tải trọng (DWT) | `taiTrong` | InputNumber | No | >= 0 |
| Diện tích đăng bộ | `dienTichDangBo` | InputNumber | No | >= 0 |
| Ghi chú | `ghiChu` | TextArea | No | max 500 chars |
| Tài liệu đính kèm | `attachments` | `<AttachmentList readonly=false>` | No | — |

Submit behavior: POST `/api/v1/luong-hang-hai` → on success: `message.success("Tạo mới thành công")` + navigate to detail page. On error: `message.error(BE message or generic)`.

### 2.3 Detail + Edit Page — `/luong-hang-hai/:id`

**Route:**
```tsx
<Route path="/luong-hang-hai/:id"
  element={<PermissionGuard permission="luonghanghai:read"><LuongHangHaiForm /></PermissionGuard>} />
```

Same component handles both view and edit mode. URL parameter `?mode=edit` or default view.

**Sections:**
1. `<Descriptions>` — display all fields (same as form fields, read-only)
2. `<AttachmentList readonly={!canEdit}>` — loaded from `record.attachments`
3. `<ApprovalActionBar>` — rendered per status/permission
4. `<Divider>` + `<HistoryTimeline>` — loaded from `GET /{id}/history`

Loading state: full-page `<Spin />` while initial data loads.  
Error state: `<Alert type="error">` + "Quay lại" button if 404 or 403.

### 2.4 Approval Flow

C1 approval: POST `/{id}/approve/c1`  
C2 approval: POST `/{id}/approve/c2`  
Both accept `PheDuyetRequest`:

```ts
// LuongHangHai PheDuyetRequest
{
  capPheDuyet: string        // required
  nguoiPheDuyet: string      // required
  trangThai: string          // required ('APPROVED' | 'REJECTED')
  lyDo?: string              // required only when trangThai == 'REJECTED'
}
```

State machine enforced in UI:
- PROPOSED → clicking "Gửi duyệt" sets to UNDER_REVIEW (no C1/C2 needed for submit action — this is the create-then-submit pattern)
- UNDER_REVIEW → C1 can approve or reject; C2 can approve or reject independently
- APPROVED → no further actions available; all edit/delete locked except soft-delete

---

## 3. Entity: Đê/Kè (F-044..F-049)

**Base route:** `/api/v1/de-ke`  
**Frontend route prefix:** `/de-ke`  
**Permission prefix:** `deke`

### 3.1 Deviations from LuongHangHai reference

1. **PheDuyetRequest field name difference:** uses `quyetDinh` instead of `trangThai`. Map accordingly in service call.
2. **Search response shape:** `KetQuaTimKiemResponse` wraps results with `results`, `totalElements`, `totalPages`, `currentPage`, `pageSize` — different field names. Service layer must map to standard pagination shape `{ items, total, page, size }`.
3. **Create DTO includes nested attachment objects** — attachments can be sent inline with create request (not a separate upload step). Service must handle multipart/form-data if needed.
4. **Search filter params:** `loaiDe` (type filter), `tinhTrang` (condition filter) instead of `gioDien`/`taiTrong`.

### 3.2 List Page — `/de-ke`

**Filter bar:**

| UI control | BE param | Notes |
|---|---|---|
| Ô tìm kiếm | `keyword` | — |
| Loại đê | `loaiDe` | Select, options from BE enum |
| Tình trạng | `tinhTrang` | Select: Tốt / Xuống cấp / Hư hỏng (verify with BE) |
| Trạng thái phê duyệt | `trangThaiPheDuyet` | Same as LuongHangHai |

**Table columns:**

| Column | Source field | Render |
|---|---|---|
| STT | row index | number |
| Loại đê | `loaiDe` | Tag |
| Vị trí | `viTri` | Text |
| Chiều dài (m) | `chieuDai` | number, 2dp |
| Chiều rộng (m) | `chieuRong` | number, 2dp |
| Chiều cao (m) | `chieuCao` | number, 2dp |
| Mặt vật liệu | `matVatLieu` | Text |
| Tình trạng | `tinhTrang` | Tag |
| Trạng thái | approval status | `<ApprovalStatusBadge>` |
| Thao tác | — | Icon buttons |

### 3.3 Create/Edit Form fields (maps to `CreateDeKeRequest`):

| Field label | Field key | Input type | Required | Validation |
|---|---|---|---|---|
| Loại đê | `loaiDe` | Select | Yes | Not empty |
| Vị trí | `viTri` | Input | Yes | Not empty |
| Chiều dài (m) | `chieuDai` | InputNumber | No | >= 0 |
| Chiều rộng (m) | `chieuRong` | InputNumber | No | >= 0 |
| Chiều cao (m) | `chieuCao` | InputNumber | No | >= 0 |
| Mặt vật liệu | `matVatLieu` | Input | No | — |
| Tình trạng | `tinhTrang` | Select | No | — |
| Ghi chú | `ghiChu` | TextArea | No | max 500 |
| Tài liệu đính kèm | `attachments` | `<AttachmentList>` | No | — |

### 3.4 Approval

Same `ApprovalActionBar` — but POST body uses `quyetDinh` field (not `trangThai`). The service layer for `deke` must construct the correct request body.

---

## 4. Entity: Cơ sở Sửa chữa / Đóng tàu (F-050..F-055)

**Base route:** `/api/v1/co-so-sua-chua`  
**Frontend route prefix:** `/co-so-sua-chua`  
**Permission prefix:** `cosuachua`

### 4.1 Deviations from LuongHangHai reference

1. **Status field:** response uses `trangThai` (String) — NOT the approval enum. Must normalize to display with `<ApprovalStatusBadge>`.
2. **Audit field naming:** `nguoiTao`, `ngayTao`, `nguoiSuaDoi`, `ngaySuaDoi` (vs `createdBy`/`createdAt` pattern in LuongHangHai). FE must use these exact field names.
3. **No `approvalHistory` in response** — only `attachments`. History endpoint exists (`GET /{id}/history`) but response lacks the embedded `approvalHistory` array.
4. **Search response:** `List<>` not paginated wrapper — response is a plain array. Service must handle non-paginated response shape and set `total = items.length`.
5. **PheDuyetRequest:** uses `quyetDinh` (required) + `lyDo` (optional).
6. **Additional permission:** `cosuachua:history` required for `/history` endpoint.

### 4.2 List Page — `/co-so-sua-chua`

**Filter bar:**

| UI control | BE param | Notes |
|---|---|---|
| Ô tìm kiếm | `keyword` | — |
| Tỉnh/thành | `tinhThanh` | Select (province list or free text) |
| Trạng thái | `trangThai` | Select |
| Trạng thái phê duyệt | `trangThaiPheDuyet` | Select |

**Table columns:**

| Column | Source field | Render |
|---|---|---|
| STT | row index | number |
| Tên cơ sở | `tenCoSo` | Text, bold |
| Địa chỉ | `diaChi` | Text |
| Tỉnh/thành | `tinhThanh` | Text |
| Loại cơ sở | `loaiCoSo` | Tag |
| Điện thoại | `soDienThoai` | Text |
| Chủ quản | `chuQuan` | Text |
| Trạng thái | `trangThai` | `<ApprovalStatusBadge>` |
| Thao tác | — | Icon buttons |

### 4.3 Create/Edit Form fields (`CreateCoSuaChuaDongTauRequest`):

| Field label | Field key | Input type | Required | Validation |
|---|---|---|---|---|
| Tên cơ sở | `tenCoSo` | Input | Yes | Not empty |
| Địa chỉ | `diaChi` | Input | Yes | Not empty |
| Tỉnh/thành | `tinhThanh` | Select or Input | Yes | Not empty |
| Số điện thoại | `soDienThoai` | Input | No | Phone format validation |
| Email | `email` | Input | No | Email format |
| Loại cơ sở | `loaiCoSo` | Select | Yes | Not empty |
| Khả năng | `khaNang` | TextArea | No | — |
| Chủ quản | `chuQuan` | Input | No | — |
| Tài liệu đính kèm | `attachments` | `<AttachmentList>` | No | — |

---

## 5. Entity: Trạm Radar (F-056..F-061)

**Base route:** `/api/v1/tram-radar`  
**Frontend route prefix:** `/tram-radar`  
**Permission prefix:** `tramradar`

### 5.1 Deviations from LuongHangHai reference

1. **Coordinate fields:** `kinhDo` and `viDo` are `BigDecimal` with WGS84 range validation from BE:
   - `kinhDo`: range -180.0 to 180.0
   - `viDo`: range -90.0 to 90.0
   - UI must add matching client-side validation with `validator` in Form.Item.
2. **Search response:** `KetQuaTimKiemResponse` with fields `total`, `searchTerm`, `items` (different from DeKe's shape). Service must map `items` → display array, `total` → pagination total.
3. **PheDuyetResponse:** uses `user`, `time`, `decision`, `reason` field names. HistoryTimeline adapter must map these fields.
4. **Status field:** `trangThai` (String), same as CoSuaChuaDongTau.
5. **Additional permission:** `tramradar:history`.

### 5.2 List Page — `/tram-radar`

**Filter bar:**

| UI control | BE param | Notes |
|---|---|---|
| Ô tìm kiếm | `keyword` | — |
| Tình trạng | `tinhTrang` | Select |
| Trạng thái | `trangThai` | Select |

**Table columns:**

| Column | Source field | Render |
|---|---|---|
| STT | row index | number |
| Tên trạm | `tenTram` | Text, bold |
| Vị trí | `viTri` | Text |
| Kinh độ | `kinhDo` | number, 6dp |
| Vĩ độ | `viDo` | number, 6dp |
| Loại trạm | `loaiTram` | Tag |
| Tình trạng | `tinhTrang` | Tag |
| Trạng thái | `trangThai` | `<ApprovalStatusBadge>` |
| Thao tác | — | Icon buttons |

### 5.3 Create/Edit Form fields (`CreateTramRadarRequest`):

| Field label | Field key | Input type | Required | Validation |
|---|---|---|---|---|
| Tên trạm | `tenTram` | Input | No | — |
| Vị trí | `viTri` | Input | Yes | Not empty |
| Kinh độ | `kinhDo` | InputNumber | No | -180 to 180 (WGS84) |
| Vĩ độ | `viDo` | InputNumber | No | -90 to 90 (WGS84) |
| Loại trạm | `loaiTram` | Select | No | — |
| Cơ trình | `coTrinh` | Input | No | — |
| Diện tích phá xạ (m²) | `dienTichPhaXa` | InputNumber | No | > 0 (Positive constraint) |
| Nguồn gốc | `nguonGoc` | Input | No | — |
| Tình trạng | `tinhTrang` | Select | No | — |
| Tài liệu đính kèm | `attachments` | `<AttachmentList>` | No | — |

Coordinate field-level validation error messages:
- `kinhDo` out of range: "Kinh độ phải trong khoảng -180 đến 180"
- `viDo` out of range: "Vĩ độ phải trong khoảng -90 đến 90"

---

## 6. Entity: Hệ thống VTS (F-062..F-067)

**Base route:** `/api/v1/he-thong-vts`  
**Frontend route prefix:** `/he-thong-vts`  
**Permission prefix:** `vts`

### 6.1 Deviations from LuongHangHai reference

1. **GET / returns `Page<HeThongVTSResponse>`** — paginated at the list endpoint. Service uses the same pagination pattern as LuongHangHai list.
2. **Search response:** same `KetQuaTimKiemResponse` shape as TramRadar (`total`, `searchTerm`, `items`).
3. **PheDuyetResponse:** same shape as TramRadar (`user`, `time`, `decision`, `reason`).
4. **Status field:** `trangThai` (String).
5. **Additional permission:** `vts:history`.
6. **Extra field `doiTac`** (partner/đối tác) — text field not present in other entities.

### 6.2 List Page — `/he-thong-vts`

**Filter bar:**

| UI control | BE param | Notes |
|---|---|---|
| Ô tìm kiếm | `keyword` | — |
| Tình trạng | `tinhTrang` | Select |
| Trạng thái | `trangThai` | Select |

**Table columns:**

| Column | Source field | Render |
|---|---|---|
| STT | row index | number |
| Tên hệ thống | `tenHeThong` | Text, bold |
| Vị trí | `viTri` | Text |
| Tình trạng | `tinhTrang` | Tag |
| Mức độ phủ trách | `mucDoPhuTrach` | Text |
| Đối tác | `doiTac` | Text |
| Trạng thái | `trangThai` | `<ApprovalStatusBadge>` |
| Thao tác | — | Icon buttons |

### 6.3 Create/Edit Form fields (`CreateHeThongVTSRequest`):

| Field label | Field key | Input type | Required | Validation |
|---|---|---|---|---|
| Tên hệ thống | `tenHeThong` | Input | No | — |
| Vị trí | `viTri` | Input | Yes | Not empty |
| Tình trạng | `tinhTrang` | Select | No | — |
| Mức độ phủ trách | `mucDoPhuTrach` | Input | No | — |
| Nguồn gốc | `nguonGoc` | Input | No | — |
| Đối tác | `doiTac` | Input | No | — |
| Tài liệu đính kèm | `attachments` | `<AttachmentList>` | No | — |

---

## 7. Approval Flow — Cross-entity State Machine

All 5 entities share this state machine (per DESIGN.md):

```
PROPOSED → (submit action) → UNDER_REVIEW
UNDER_REVIEW → (C1 approve/reject) → UNDER_REVIEW stays or REJECTED
UNDER_REVIEW → (C2 approve/reject) → APPROVED or REJECTED
APPROVED → (soft-delete only, no edit)
REJECTED → (user can edit + resubmit → back to PROPOSED)
```

**UI enforcement of state transitions:**

| Current status | Edit enabled | Delete enabled | Submit visible | C1 visible | C2 visible |
|---|---|---|---|---|---|
| PROPOSED | Yes (`{prefix}:update`) | No | Yes | No | No |
| UNDER_REVIEW | No | No | No | Yes (`approvec1`) | Yes (`approvec2`) |
| APPROVED | No | Yes (`{prefix}:delete`) | No | No | No |
| REJECTED | Yes (`{prefix}:update`) | No | Yes (re-submit) | No | No |

**Self-approval guard:** checked when `nguoiPheDuyetC1 === currentUser.id`. If true, disable C2 button and show Tooltip message.

**Rejection Modal (RejectionModal component):**
- Title: "Từ chối phê duyệt"
- TextArea label: "Lý do từ chối" — required, minLength 10
- Buttons: "Xác nhận từ chối" (danger), "Hủy"
- On confirm: call reject endpoint with `{ quyetDinh: 'REJECTED', lyDo: textValue }` (or `trangThai` for LuongHangHai)

---

## 8. UX States — All Screens

### Loading states

| Context | Implementation |
|---|---|
| Page initial load | Full `<Spin size="large" tip="Đang tải...">` wrapping content |
| Table loading | `Table loading={true}` built-in spinner |
| Form submit | Button `loading={true}` + disable all inputs |
| Approval action | Button `loading={true}` for active action button only |
| History panel | `<Spin>` inside timeline container |

### Empty states

| Context | Message |
|---|---|
| Table with no results | `<Empty description="Không tìm thấy dữ liệu" />` |
| History with no history | `<Empty description="Chưa có lịch sử phê duyệt" />` |
| Attachments empty | `<Empty description="Chưa có tài liệu đính kèm" image={Empty.PRESENTED_IMAGE_SIMPLE} />` |

### Error states

| Context | Implementation |
|---|---|
| API call fails (list) | `<Alert type="error" message="Lỗi tải dữ liệu" description={errorMessage} showIcon />` + Retry |
| Form submit fails | `message.error(BE message)` — field-level errors if BE returns field validation map |
| 404 (detail page) | `<Result status="404" title="Không tìm thấy" extra={<Button onClick={navigate(-1)}>Quay lại</Button>} />` |
| 403 (permission denied) | `<Result status="403" title="Không có quyền truy cập" />` |
| Approval action fails | `message.error("Không thể thực hiện phê duyệt: " + errorMessage)` |

### Field-level validation (all forms)

- Validation triggers: `validateTrigger="onBlur"` for most fields; `onChange` for real-time format checks (email, coordinate ranges)
- Error placement: below each field (AntD default `Form.Item` help text)
- Form-level error: not used — all errors are field-level or toast-level

---

## 9. Routing & Menu Integration

### 9.1 Routes to add to `App.tsx`

```tsx
{/* Khu nước & VTS — M-003 */}

{/* Luồng hàng hải */}
<Route path="/luong-hang-hai"
  element={<PermissionGuard permission="luonghanghai:read"><LuongHangHaiList /></PermissionGuard>} />
<Route path="/luong-hang-hai/create"
  element={<PermissionGuard permission="luonghanghai:create"><LuongHangHaiForm /></PermissionGuard>} />
<Route path="/luong-hang-hai/:id"
  element={<PermissionGuard permission="luonghanghai:read"><LuongHangHaiForm /></PermissionGuard>} />

{/* Đê/kè */}
<Route path="/de-ke"
  element={<PermissionGuard permission="deke:read"><DeKeList /></PermissionGuard>} />
<Route path="/de-ke/create"
  element={<PermissionGuard permission="deke:create"><DeKeForm /></PermissionGuard>} />
<Route path="/de-ke/:id"
  element={<PermissionGuard permission="deke:read"><DeKeForm /></PermissionGuard>} />

{/* Cơ sở sửa chữa/đóng tàu */}
<Route path="/co-so-sua-chua"
  element={<PermissionGuard permission="cosuachua:read"><CoSuaChuaList /></PermissionGuard>} />
<Route path="/co-so-sua-chua/create"
  element={<PermissionGuard permission="cosuachua:create"><CoSuaChuaForm /></PermissionGuard>} />
<Route path="/co-so-sua-chua/:id"
  element={<PermissionGuard permission="cosuachua:read"><CoSuaChuaForm /></PermissionGuard>} />

{/* Trạm radar */}
<Route path="/tram-radar"
  element={<PermissionGuard permission="tramradar:read"><TramRadarList /></PermissionGuard>} />
<Route path="/tram-radar/create"
  element={<PermissionGuard permission="tramradar:create"><TramRadarForm /></PermissionGuard>} />
<Route path="/tram-radar/:id"
  element={<PermissionGuard permission="tramradar:read"><TramRadarForm /></PermissionGuard>} />

{/* Hệ thống VTS */}
<Route path="/he-thong-vts"
  element={<PermissionGuard permission="vts:read"><HeThongVTSList /></PermissionGuard>} />
<Route path="/he-thong-vts/create"
  element={<PermissionGuard permission="vts:create"><HeThongVTSForm /></PermissionGuard>} />
<Route path="/he-thong-vts/:id"
  element={<PermissionGuard permission="vts:read"><HeThongVTSForm /></PermissionGuard>} />
```

### 9.2 Menu entries to add to `AppLayout.tsx`

New menu group **"Khu nước & VTS"** inserted after "Báo hiệu hàng hải" group:

```tsx
{
  key: 'khu-nuoc-vts',
  icon: <ApartmentOutlined />,   // or appropriate icon
  label: 'Khu nước & VTS',
  children: [
    canAccessMenu('/luong-hang-hai') ? { key: '/luong-hang-hai', label: 'Luồng hàng hải' } : null,
    canAccessMenu('/de-ke') ? { key: '/de-ke', label: 'Đê/Kè' } : null,
    canAccessMenu('/co-so-sua-chua') ? { key: '/co-so-sua-chua', label: 'Cơ sở sửa chữa & đóng tàu' } : null,
    canAccessMenu('/tram-radar') ? { key: '/tram-radar', label: 'Trạm Radar' } : null,
    canAccessMenu('/he-thong-vts') ? { key: '/he-thong-vts', label: 'Hệ thống VTS' } : null,
  ].filter(Boolean),
}
```

Entries for `MENU_PERMISSION_MAP`:

```ts
'/luong-hang-hai': 'luonghanghai:read',
'/de-ke': 'deke:read',
'/co-so-sua-chua': 'cosuachua:read',
'/tram-radar': 'tramradar:read',
'/he-thong-vts': 'vts:read',
```

Entries for `pageTitles`:

```ts
'/luong-hang-hai': 'Luồng hàng hải',
'/de-ke': 'Đê/Kè',
'/co-so-sua-chua': 'Cơ sở sửa chữa & đóng tàu',
'/tram-radar': 'Trạm Radar',
'/he-thong-vts': 'Hệ thống VTS',
```

---

## 10. Service Layer Conventions

Each entity gets one service file at `frontend/src/services/{entity}Service.ts`, matching the `beaconService.ts` pattern. Each service exports:

```ts
export const {entity}CRUD = {
  list: (params: ListParams) => api.get('/api/v1/{base-route}', { params }),
  search: (params: SearchParams) => api.get('/api/v1/{base-route}/search', { params }),
  getById: (id: string) => api.get(`/api/v1/{base-route}/${id}`),
  create: (data: CreateDto) => api.post('/api/v1/{base-route}', data),
  update: (id: string, data: UpdateDto) => api.put(`/api/v1/{base-route}/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/{base-route}/${id}`),
  getByStatus: (status: string) => api.get(`/api/v1/{base-route}/status-phe-duyet/${status}`),
};

export const {entity}Approval = {
  approveC1: (id: string, data: PheDuyetRequest) =>
    api.post(`/api/v1/{base-route}/${id}/approve/c1`, data),
  approveC2: (id: string, data: PheDuyetRequest) =>
    api.post(`/api/v1/{base-route}/${id}/approve/c2`, data),
  getHistory: (id: string) => api.get(`/api/v1/{base-route}/${id}/history`),
};
```

**Per-entity field name differences in PheDuyetRequest:**

| Entity | Approval decision field | Notes |
|---|---|---|
| luonghanghai | `trangThai` | LuongHangHai uses `trangThai` |
| deke | `quyetDinh` | DeKe uses `quyetDinh` |
| cosuachua | `quyetDinh` | CoSuaChua uses `quyetDinh` |
| tramradar | — | Verify with BE (see Contract Gaps) |
| vts | — | Verify with BE (see Contract Gaps) |

---

## 11. Frontend File Structure

```
frontend/src/
├── components/
│   └── shared/
│       ├── ApprovalStatusBadge.tsx
│       ├── ApprovalActionBar.tsx
│       ├── HistoryTimeline.tsx
│       ├── AttachmentList.tsx
│       ├── RejectionModal.tsx
│       └── CoordinateInput.tsx
├── pages/
│   ├── luonghanghai/
│   │   ├── LuongHangHaiList.tsx
│   │   └── LuongHangHaiForm.tsx
│   ├── deke/
│   │   ├── DeKeList.tsx
│   │   └── DeKeForm.tsx
│   ├── cosuachua/
│   │   ├── CoSuaChuaList.tsx
│   │   └── CoSuaChuaForm.tsx
│   ├── tramradar/
│   │   ├── TramRadarList.tsx
│   │   └── TramRadarForm.tsx
│   └── hethongvts/
│       ├── HeThongVTSList.tsx
│       └── HeThongVTSForm.tsx
├── services/
│   ├── luongHangHaiService.ts
│   ├── deKeService.ts
│   ├── coSuaChuaService.ts
│   ├── tramRadarService.ts
│   └── heThongVTSService.ts
└── types/
    ├── luongHangHai.ts
    ├── deKe.ts
    ├── coSuaChua.ts
    ├── tramRadar.ts
    └── heThongVTS.ts
```

---

## 12. Accessibility / Basic Usability Notes

- All `<Form.Item>` must have `label` prop set (renders `<label for>` association automatically in AntD).
- Error messages in `Form.Item` use `help` prop — AntD renders `role="alert"` compatible output.
- `<ApprovalActionBar>` buttons use `aria-disabled` (not `disabled`) when permission-blocked, with Tooltip explaining why, so screen readers can still focus and read the reason.
- Focus order: Filter bar → Table → Pagination. On form pages: top-to-bottom field order.
- Keyboard nav: AntD Table supports arrow-key navigation; forms are standard tab order.
- All icon-only buttons (row actions) must have `title` prop for tooltip and `aria-label` for screen readers.
- `RejectionModal` sets `autoFocus` on the TextArea when opened.
- `<Upload>` component: add `aria-label="Tải lên tài liệu đính kèm"`.

---

## 13. Contract Gaps / Ambiguities (Questions for BE)

| # | Entity | Gap | Impact on UI | Severity |
|---|---|---|---|---|
| CG-01 | luonghanghai, deke | History endpoint permission: `luonghanghai:history` and `deke:history` permission codes are NOT declared in controllers (only C1/C2/create/read/update/delete/approvec1/approvec2). Are history endpoints open to anyone with `:read`? | `HistoryTimeline` permission gate: must know which permission to check | High |
| CG-02 | tramradar, vts | PheDuyetRequest field name: TramRadar and VTS controllers not confirmed — do they use `quyetDinh` (like deke/cosuachua) or `trangThai` (like luonghanghai)? | Service layer constructs wrong request body | High |
| CG-03 | cosuachua | Search returns `List<>` (not paginated). Is this intentional? A large dataset without pagination will cause performance issues. | Cannot implement pagination UI for CoSuaChua search | Medium |
| CG-04 | all | Attachment upload endpoint: no explicit `POST /{id}/attachments` endpoint visible in controllers. Are attachments submitted inline with create/update DTOs as multipart, or is there a separate upload endpoint? | AttachmentList component upload behavior | High |
| CG-05 | all | Allowed file types and max file size for attachments: no BE constraint declared. UI needs this to show proper validation messages. | Upload validation | Low |
| CG-06 | tramradar | `viTri` is marked `@NotBlank` (required) but `tenTram` is NOT required (no `@NotBlank`). Confirm: is a radar station allowed to have no name? | Form required field marking | Low |
| CG-07 | luonghanghai | `loaiTau` is `@NotBlank` — what are the allowed values? Is it a free-text field or a SELECT from a fixed enum? BE DTO shows it as String. | Filter and form input type | Medium |

---

## Designer → Handoff Summary

**Verdict:** Ready for handoff — all 5 entity groups fully specified with screens, fields, permission gates, shared components, routing, and UX states.

**Critical findings tech-lead / dev must implement:**
- [High] PheDuyetRequest field naming inconsistency (`trangThai` vs `quyetDinh`) across entities — service layer must handle per-entity difference (CG-02 needs BE confirmation for tramradar/vts)
- [High] Search response shape varies across entities (3 different pagination wrapper shapes) — service layer must normalize all to a single `{ items, total, page, size }` shape before passing to table
- [High] Attachment upload endpoint unknown (CG-04) — blocks `AttachmentList` write mode implementation
- [High] `window.prompt` in BeaconForm is an existing defect — new entities must use `RejectionModal` instead

**UX states that must be handled in code:**
- Loading: page-level Spin, table loading prop, button loading during mutations
- Empty: table empty, history empty, attachments empty
- Error: API failure Alert + retry, 404 Result, 403 Result, form validation field-level
- Approval disabled states: permission-blocked buttons with aria-disabled + Tooltip, self-approval guard

**Form behavior rules:**
- validateTrigger onBlur (most fields); onChange for coordinates and email
- Field-level errors only — no form-level summary
- Coordinate validation: kinhDo -180..180, viDo -90..90 (TramRadar only)
- Rejection text: required, minLength 10

**Accessibility requirements:**
- All Form.Item must have label (AntD auto-associates)
- Icon-only buttons need title + aria-label
- Permission-blocked buttons: aria-disabled + Tooltip (not hard disabled)
- RejectionModal autoFocus on TextArea

**Out-of-scope design items (defer to future):** Map/GIS view for coordinate entities (TramRadar), bulk approval actions, export to Excel.

**Assumptions requiring user confirmation:**
- CG-01 through CG-07 listed above. CG-02 (PheDuyetRequest field for tramradar/vts) and CG-04 (attachment upload endpoint) are blockers for partial implementation.

---

```json
{
  "agent": "sdlc-designer",
  "stage": "design-review",
  "verdict": "Ready for handoff",
  "confidence": "high",
  "next_owner": "sdlc-tech-lead",
  "missing_artifacts": [],
  "blockers": [],
  "risk_score": 2,
  "risk_level": "low",
  "evidence_refs": [
    "docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/designer/ui-spec.md",
    "frontend/src/pages/beacons/BeaconList.tsx",
    "frontend/src/pages/beacons/BeaconForm.tsx",
    "frontend/src/services/beaconService.ts",
    "frontend/src/services/api.ts",
    "frontend/src/App.tsx",
    "frontend/src/components/AppLayout.tsx"
  ],
  "token_usage": {
    "input": "3800",
    "output": "3200",
    "this_agent": "7000",
    "pipeline_total": "7000"
  }
}
```
