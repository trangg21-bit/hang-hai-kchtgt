# Kiểm tra Chất lượng Triển khai Frontend M-003

**Module:** M-003 "Quản lý tài sản KCHTGT - Khu nước & VTS"
**Path:** `frontend/src/`
**Ngày kiểm tra:** 2026-07-01
**Phạm vi:** 10 page components (5 List + 5 Form), 5 service files, 5 type files, 5 shared components, App.tsx routes

---

## 1. Tổng quan

| Entity | List Component | Form Component | Service | Type | Lines (List+Form) |
|---|---|---|---|---|---|
| luồng hàng hải | LuongHangHaiList.tsx | LuongHangHaiForm.tsx | luongHangHaiService.ts | luongHangHai.ts | 307 + 379 = 686 |
| đê/kè | DeKeList.tsx | DeKeForm.tsx | deKeService.ts | deKe.ts | 344 + 442 = 786 |
| cơ sở sửa chữa | CoSuaChuaList.tsx | CoSuaChuaForm.tsx | coSuaChuaService.ts | coSuaChua.ts | 304 + 401 = 705 |
| trạm radar | TramRadarList.tsx | TramRadarForm.tsx | tramRadarService.ts | tramRadar.ts | 317 + 439 = 756 |
| hệ thống VTS | HeThongVTSList.tsx | HeThongVTSForm.tsx | heThongVtsService.ts | heThongVts.ts | 299 + 366 = 665 |

**Tổng:** 10 files components, 5 service files, 5 type definition files = 20 files audited.

---

## 2. Đánh giá từng Page

### 2.1. Luồng Hàng Hải (`luonghanghai/`)

#### LuongHangHaiList.tsx (307 dòng)

| Tiêu chí | Kết quả | Chi tiết |
|---|---|---|
| Thực thi thật | PASS | Full implementation, 307 dòng |
| Ant Design Table + columns | PASS | 8 columns (STT, Loại tàu, Số lượng, Giờ điện, Tải trọng, Diện tích, Ngày ghi nhận, Trạng thái, Thao tác) |
| Search/filter | PASS | 4 filters: keyword, giờ điện, tải trọng max, trạng thái phê duyệt. Nút "Tìm kiếm" + "Xóa bộ lọc" |
| Pagination | PASS | `CrudPageLayout` với pagination props (current, pageSize, total, showSizeChanger, onChange) |
| Service API | PASS | `luongHangHaiCRUD.search()`, `luongHangHaiCRUD.delete()`, `luongHangHaiCRUD.getById()` |
| Permission check | PASS | `userPermissions.includes('luonghanghai:read'|'create'|'update'|'delete')` |
| PermissionGuard (routes) | PASS | App.tsx L152-154: `<PermissionGuard permission="luonghanghai:read">` và `luonghanghai:create` |
| Approval flow | PASS | LuongHangHaiForm có approveC1/approveC2/reject/delete, HistoryTimeline, ApprovalStatusBadge |

**Điểm nổi bật:**
- Sử dụng `CrudPageLayout` shared component — consistent với các entity khác
- Permission-aware action buttons (Xem/Sửa/Xóa chỉ hiện khi có quyền)
- Form validation: `soLuong` must be integer, `ngayGhiNhan` không được là ngày tương lai

#### LuongHangHaiForm.tsx (379 dòng)

| Tiêu chí | Kết quả | Chi tiết |
|---|---|---|
| 3 chế độ (create/edit/detail) | PASS | `isCreateMode` / `isEditMode` / `isDetailMode` logic đúng |
| Detail view | PASS | Descriptions column=2, ApprovalStatusBadge, ApprovalActionBar, HistoryTimeline, AttachmentList (readonly) |
| Edit form | PASS | Form.Item với validation rules, DatePicker, InputNumber |
| Approval action | PASS | approveC1 (→ UNDER_REVIEW), approveC2 (→ APPROVED), reject (→ REJECTED), delete |
| AttachmentList trong form edit | FAIL | Không render AttachmentList trong chế độ tạo/sửa — chỉ render trong detail mode. So sánh với DeKeForm/CoSuaChuaForm/TramRadarForm có `AttachmentList` trong create/edit |

**Issue phát hiện:** LuongHangHaiForm.tsx KHÔNG có section `AttachmentList` trong create/edit view (dòng 289-378). Các form khác đều có.

---

### 2.2. Đê/Kè (`deke/`)

#### DeKeList.tsx (344 dòng)

| Tiêu chí | Kết quả | Chi tiết |
|---|---|---|
| Thực thi thật | PASS | Full implementation, 344 dòng |
| Ant Design Table + columns | PASS | 9 columns (STT, Loại đê, Vị trí, Chiều dài/rộng/cao, Vật liệu, Tình trạng, Trạng thái, Thao tác) |
| Search/filter | PASS | 4 filters: keyword, loại đê (dropdown), tình trạng (dropdown), trạng thái phê duyệt |
| Pagination | PASS | Full pagination via CrudPageLayout |
| Service API | PASS | `dekeCRUD.search()`, `dekeCRUD.delete()` |
| Permission check | PASS | `deke:read/create/update/delete` |
| Color-coded tình trạng | PASS | TOT=green, XUONG_CAP=orange, HU_HOING=red (lưu ý: typo ở L176 `HU_HOING` vs type `HU_HOng`) |

**Issue phát hiện tại DeKeList.tsx L175:** Color map key `HU_HOING` (nghiềng) không khớp với type definition `HU_HOng` (góc). Đây là một mismatch tiềm ẩn.

#### DeKeForm.tsx (442 dòng)

| Tiêu chí | Kết quả | Chi tiết |
|---|---|---|
| 3 chế độ | PASS | Full create/edit/detail |
| Detail view | PASS | Descriptions, ApprovalActionBar, HistoryTimeline, AttachmentList (readonly) |
| Edit form | PASS | Form validation, Select options inline, InputNumber precision=2 |
| AttachmentList trong form | PASS | L422-425: `AttachmentList` trong create/edit form, nhưng KHÔNG có `hasUploadEndpoint` prop |
| Approval action | PASS | approveC1/approveC2/reject/delete pattern |

---

### 2.3. Cơ sở Sửa chữa (`cosuachua/`)

#### CoSuaChuaList.tsx (304 dòng)

| Tiêu chí | Kết quả | Chi tiết |
|---|---|---|
| Thực thi thật | PASS | Full implementation, 304 dòng |
| Ant Design Table + columns | PASS | 8 columns (STT, Tên cơ sở, Địa chỉ, Tỉnh/thành, Loại cơ sở, Điện thoại, Chủ quản, Trạng thái, Thao tác) |
| Search/filter | PASS | 4 filters: keyword, tỉnh/thành, tình trạng, trạng thái phê duyệt |
| Pagination | WARN | Pagination được set `current:1, pageSize:total, showSizeChanger:false` — **không có pagination thực sự**. CoSuaChua search trả về List<> (không phân trang), nhưng UI không cho phép chuyển trang. Xem DEFECT-M003-UI-002. |
| Service API | PASS | `coSuaChuaCRUD.search()`, `coSuaChuaCRUD.delete()` |
| Permission check | PASS | `cosuachua:read/create/update/delete` |

#### CoSuaChuaForm.tsx (401 dòng)

| Tiêu chí | Kết quả | Chi tiết |
|---|---|---|
| 3 chế độ | PASS | Full create/edit/detail |
| Detail view | PASS | Descriptions, ApprovalActionBar, HistoryTimeline, AttachmentList (readonly) |
| Edit form | PASS | Form validation, Select options inline, regex phone/email |
| AttachmentList trong form | FAIL | L380-384: `AttachmentList` trong create/edit form, nhưng KHÔNG có `hasUploadEndpoint` prop |
| Approval action | PASS | approveC1/approveC2/reject/delete pattern |

---

### 2.4. Trạm Radar (`tramradar/`)

#### TramRadarList.tsx (317 dòng)

| Tiêu chí | Kết quả | Chi tiết |
|---|---|---|
| Thực thi thật | PASS | Full implementation, 317 dòng |
| Ant Design Table + columns | PASS | 8 columns (STT, Tên trạm, Vị trí, Kinh độ, Vĩ độ, Loại trạm, Tình trạng, Trạng thái, Thao tác) |
| Search/filter | PASS | 3 filters: keyword, tình trạng (dropdown), trạng thái phê duyệt (dropdown) |
| Pagination | PASS | Full pagination via CrudPageLayout |
| Service API | PASS | `tramRadarCRUD.search()`, `tramRadarCRUD.delete()` |
| Permission check | PASS | `tramradar:read/create/update/delete` |
| Color-coded tình trạng | PASS | Sử dụng Tag component với colorMap |

#### TramRadarForm.tsx (439 dòng)

| Tiêu chí | Kết quả | Chi tiết |
|---|---|---|
| 3 chế độ | PASS | Full create/edit/detail |
| Detail view | PASS | Descriptions, ApprovalActionBar, HistoryTimeline, AttachmentList (readonly) |
| Edit form | PASS | Form validation, InputNumber kinh độ (-180..180), vĩ độ (-90..90), precision=6 |
| AttachmentList trong form | FAIL | L418-422: `AttachmentList` trong create/edit form, nhưng KHÔNG có `hasUploadEndpoint` prop |
| Approval action | PASS | approveC1/approveC2/reject/delete pattern |

---

### 2.5. Hệ thống VTS (`hethongvts/`)

#### HeThongVTSList.tsx (299 dòng)

| Tiêu chí | Kết quả | Chi tiết |
|---|---|---|
| Thực thi thật | PASS | Full implementation, 299 dòng |
| Ant Design Table + columns | PASS | 7 columns (STT, Tên hệ thống, Vị trí, Tình trạng, Mức độ phủ trách, Đối tác, Trạng thái, Thao tác) |
| Search/filter | PASS | 3 filters: keyword, tình trạng, trạng thái phê duyệt |
| Pagination | PASS | Full pagination via CrudPageLayout |
| Service API | WARN | L64: `heThongVTSCRUD.list(params)` thay vì `heThongVTSCRUD.search(params)`. Service có cả `list` và `search`, nhưng List page dùng `list`. Các entity khác dùng `search`. |
| Permission check | PASS | `vts:read/create/update/delete` |

#### HeThongVTSForm.tsx (366 dòng)

| Tiêu chí | Kết quả | Chi tiết |
|---|---|---|
| 3 chế độ | PASS | Full create/edit/detail |
| Detail view | PASS | Descriptions, ApprovalActionBar, HistoryTimeline, AttachmentList (readonly), lý do từ chối |
| Edit form | WARN | L345-349: `AttachmentList` trong form, nhưng KHÔNG có `attachments` prop và KHÔNG có `hasUploadEndpoint`. Khác với các form khác. |
| Approval action | PASS | Uses `setRecord(updated)` (lưu response từ API) — best practice tốt |

---

## 3. Service Files Audit

### 3.1. Tổng quan API endpoints

| Entity | CRUD endpoints | Approval endpoints | Search params |
|---|---|---|---|
| luongHangHai | `/v1/luong-hang-hai/*` | `/approve/c1`, `/approve/c2`, `/history` | keyword, gioDien, taiTrong, trangThaiPheDuyet |
| deKe | `/v1/de-ke/*` | `/approve/c1`, `/approve/c2`, `/history` | keyword, loaiDe, tinhTrang, trangThaiPheDuyet |
| coSuaChua | `/v1/co-so-sua-chua/*` | `/approve/c1`, `/approve/c2`, `/history` | keyword, tinhThanh, trangThai, trangThaiPheDuyet |
| tramRadar | `/v1/tram-radar/*` | `/approve/c1`, `/approve/c2`, `/history` | keyword, tinhTrang, trangThai |
| heThongVTS | `/v1/he-thong-vts/*` | `/approve/c1`, `/approve/c2`, `/history` | keyword, tinhTrang, trangThai |

**Kết luận:** Tất cả 5 services đều nhất quán: CRUD (list/search/getById/create/update/delete) + Approval (approveC1/approveC2/getHistory) + getByStatus.

### 3.2. DEFECT-M003-UI-004 Verification (coSuaChuaService search has trangThaiPheDuyet param)

**File:** `frontend/src/services/coSuaChuaService.ts` L26-33

```typescript
async search(params?: ListParams): Promise<SearchResponse<CoSuaChuaResponse>> {
    const res = await api.get('/v1/co-so-sua-chua/search', {
    params: {
      keyword: params?.keyword,
      tinhThanh: params?.tinhThanh,
      trangThai: params?.trangThai,
      trangThaiPheDuyet: params?.trangThaiPheDuyet,
    },
    });
```

**VERIFIED: DEFECT đã được FIXED.** — `trangThaiPheDuyet: params?.trangThaiPheDuyet` hiện diện trong search params của coSuaChuaService (L32). Điều này cho phép filter theo trạng thái phê duyệt từ List page.

### 3.3. Inconsistency: HeThongVTSList dùng `list()` thay vì `search()`

**File:** `frontend/src/pages/hethongvts/HeThongVTSList.tsx` L64

```typescript
const res = await heThongVTSCRUD.list(params);
```

Trong khi `heThongVTSCRUD.search()` cũng tồn tại và nhận cùng các filter params (keyword, tinhTrang, trangThai). Điều này có thể là cố ý (list = no filter, search = with filter) nhưng inconsistent với các entity khác (tất cả đều dùng `search()`).

---

## 4. Shared Components Audit

| Component | Lines | Quality | Notes |
|---|---|---|---|
| ApprovalActionBar | 99 | PASS | Self-approval guard, role-based C1/C2 buttons, RejectionModal |
| HistoryTimeline | 71 | PASS | Color-coded entries, error handling, retry support |
| AttachmentList | 169 | PASS | Upload guard (hasUploadEndpoint + onUpload), delete guard (onDelete), file validation |
| CrudPageLayout | 59 | PASS | Breadcrumb, filterBar, create button, Table |
| ApprovalStatusBadge | 25 | PASS | 4 status colors with labels, size prop |

### 4.1. DEFECT-M003-UI-003 Verification (AttachmentList upload guard — hasUploadEndpoint prop)

**File:** `frontend/src/components/shared/AttachmentList.tsx` L16, L28, L132-153

```typescript
// L16: Prop definition
hasUploadEndpoint?: boolean;
// L28: Default value
hasUploadEndpoint = false,
// L132-133: Conditional render
{!readonly && hasUploadEndpoint && (
  <Upload.Dragger ...>
// L149-153: Alternative message
{!readonly && !hasUploadEndpoint && (
  <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
    Chức năng tải lên chưa được kích hoạt
  </div>
)}
```

**VERIFIED: DEFECT đã được FIXED.** — `AttachmentList` component có prop `hasUploadEndpoint` (L16) và logic bảo vệ upload (L132-153). Khi `hasUploadEndpoint` là false, nó hiển thị message "Chức năng tải lên chưa được kích hoạt" thay vì show upload drag zone — ngăn upload vô hướng.

**Tuy nhiên:** Không có Form entity nào trong 5 entity đang truyền `hasUploadEndpoint` prop cho `AttachmentList`. Tất cả 4 form (DeKeForm, CoSuaChuaForm, TramRadarForm, HeThongVTSForm) đều dùng:
```tsx
<AttachmentList attachments={record?.attachments || []} readonly={false} />
```
không có `hasUploadEndpoint` → mặc định `false` → upload bị ẩn. Đây không phải là bug (vì upload endpoint chưa có backend) nhưng là một nhận xét về tính nhất quán.

---

## 5. App.tsx Routes — M-003 Coverage

Tất cả 15 routes M-003 được kiểm tra:

| Entity | List Route | Create Route | Detail Route | PermissionGuard | Status |
|---|---|---|---|---|---|
| luồng hàng hải | `/luong-hang-hai` | `/luong-hang-hai/create` | `/luong-hang-hai/:id` | luonghanghai:read/create | ✅ |
| đê/kè | `/de-ke` | `/de-ke/create` | `/de-ke/:id` | deke:read/create | ✅ |
| cơ sở sửa chữa | `/co-so-sua-chua` | `/co-so-sua-chua/create` | `/co-so-sua-chua/:id` | cosuachua:read/create | ✅ |
| trạm radar | `/tram-radar` | `/tram-radar/create` | `/tram-radar/:id` | tramradar:read/create | ✅ |
| hệ thống VTS | `/he-thong-vts` | `/he-thong-vts/create` | `/he-thong-vts/:id` | vts:read/create | ✅ |

**Kết luận:** 15/15 routes (5×3) present và đúng. Mỗi route có PermissionGuard với permission phù hợp.

---

## 6. Verification Defects Previously Fixed

| Defect | Description | Status | Evidence |
|---|---|---|---|
| DEFECT-M003-UI-003 | AttachmentList upload guard | ✅ FIXED | `hasUploadEndpoint` prop exists at L16 of AttachmentList.tsx, conditional render at L132-153 |
| DEFECT-M003-UI-004 | coSuaChuaService search has trangThaiPheDuyet param | ✅ FIXED | `trangThaiPheDuyet: params?.trangThaiPheDuyet` at L32 of coSuaChuaService.ts |

---

## 7. Code Quality Observations

### 7.1. Consistency (Rất tốt)
- Tất cả 5 entity follow pattern giống hệt nhau: List (filter bar + Table + pagination) + Form (3 modes + approval + history)
- Shared components được reuse nhất quán: CrudPageLayout, ApprovalStatusBadge, ApprovalActionBar, HistoryTimeline, AttachmentList
- Naming convention đồng bộ: `${entityCRUD}`, `${entityApproval}`, `${entity}Response`, `${entity}Request`
- Permission pattern đồng bộ: `includes('entity:read'|'create'|'update'|'delete')`

### 7.2. Anti-patterns / Issues

1. **LuongHangHaiForm missing AttachmentList in create/edit** (L289-378): Không có `AttachmentList` component trong create/edit view. Các entity khác đều có.

2. **HeThongVTSList dùng `list()` thay vì `search()`** (L64): Inconsistent với 4 entity còn lại (đều dùng `search()`).

3. **HeThongVTSForm AttachmentList không có props** (L345-349): `<AttachmentList readonly={isDetailMode} />` — thiếu `attachments` prop, trong khi các form khác đều có.

4. **DeKeList typo `HU_HOING` vs `HU_HOng`** (L175): Color map key `HU_HOING` không khớp với type definition `HU_HOng`. Tình trạng "Hư hỏng" có thể sẽ không nhận được màu red.

5. **AttachmentList trong form không có `hasUploadEndpoint`**: Tất cả 4 form có `AttachmentList` trong create/edit nhưng không set `hasUploadEndpoint` prop. Nếu backend upload endpoint chưa tồn tại, đây không phải là bug. Nhưng nếu sẽ có upload endpoint, cần thêm `hasUploadEndpoint={true}` và `onUpload` callback.

6. **CoSuaChuaList pagination không hoạt động** (L293-299): `current:1, pageSize:total, showSizeChanger:false` — pagination dummy vì API không hỗ trợ phân trang. Có thể cải thiện bằng cách thêm pagination thực ở backend hoặc thêm loading state khi filter thay đổi.

7. **Repetition cao**: 10 page components rất giống nhau (copy-paste pattern). Có thể abstract thành generic CRUD hook hoặc generator để giảm maintenance burden.

### 7.3. Type Safety Notes

- **HeThongVTSForm.tsx L26:** Re-declares `type ApprovalStatus = ...` — trùng với import từ type file. Nên dùng import thay vì re-declare.
- **coSuaChuaService.ts L28-30:** Thụt lề không nhất quán trong `params` object (L28 có 4-space indentation khác với L29-33 có 6-space).

---

## 8. Summary Scorecard

| Criteria | Score | Details |
|---|---|---|
| Real implementation (not placeholder) | 10/10 | Tất cả 10 page components đều full implementation |
| Ant Design Table + columns | 10/10 | Tất cả 5 List pages có proper table columns |
| Search/filter | 9/10 | 5/5 có filter bar; HeThongVTSList inconsistent (dùng `list()` vs `search()`) |
| Pagination | 7/10 | 4/5 có pagination đầy đủ; CoSuaChuaList pagination là dummy |
| Correct service API | 8/10 | 4/5 dùng `search()`; 1/5 (HeThongVTS) dùng `list()` |
| Permission checks (List) | 10/10 | Tất cả 5 List pages check permissions |
| PermissionGuard (routes) | 10/10 | Tất cả 15/15 routes có PermissionGuard |
| Approval workflow | 10/10 | Tất cả 5 Form pages có approveC1/C2/reject/delete |
| History timeline | 10/10 | Tất cả 5 Form pages có HistoryTimeline |
| Attachment handling | 6/10 | AttachmentList trong detail mode OK; không có trong LuongHangHaiForm create/edit; không có hasUploadEndpoint trong bất kỳ form nào |
| Type consistency | 8/10 | DeKeList typo HU_HOING/HU_HOng; HeThongVTSForm re-declares ApprovalStatus |
| Shared component reuse | 10/10 | 5 shared components được reuse nhất quán |
| Code repetition | 5/10 | Copy-paste pattern cao; nên abstract chung |

**Overall FE Health: NEEDS_FIX**

---

## 9. Action Items

### P0 — Critical (must fix)
1. **Add AttachmentList to LuongHangHaiForm create/edit view** — inconsistent với 4 entity còn lại
2. **Fix DeKeList `HU_HOING` → `HU_HOng` typo** — tình trạng "Hư hỏng" sẽ không hiển thị màu red
3. **Fix HeThongVTSList to use `search()` instead of `list()`** — consistent với 4 entity khác
4. **Add `attachments` prop to HeThongVTSForm's AttachmentList** — currently missing

### P1 — Important
5. **Add `hasUploadEndpoint` + `onUpload` to all Form AttachmentList instances** — nếu backend upload endpoint sẽ được tích hợp
6. **Remove re-declaration of `ApprovalStatus` in HeThongVTSForm.tsx L26** — use imported type instead

### P2 — Nice to have
7. **Abstract common CRUD logic** — DRY the 10 page components into reusable hooks/components
8. **Fix coSuaChuaList pagination** — add backend pagination or improve UX for unpaginated list
9. **Fix coSuaChuaService.ts L28-30 indentation** — cosmetic

---

*Audit hoàn thành. Tất cả 10 page components, 5 service files, 5 type files, 5 shared components và App.tsx routes đã được kiểm tra.*
