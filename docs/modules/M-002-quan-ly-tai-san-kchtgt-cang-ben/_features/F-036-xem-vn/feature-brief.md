---
id: F-036
name: Xem danh sách & Chi tiết Vùng nước
slug: xem-vn
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-04
locked-fields: []
consumed_by_modules: []
merged-from: [F-036-BE, F-088-UI, F-089-UI]
---
# Đặc tả nghiệp vụ: Xem danh sách & Chi tiết Vùng nước

**Tài liệu:** BA Feature Brief (merged BE+UI)
**Feature:** F-036 — Xem danh sách & Chi tiết Vùng nước
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-04

> Tài liệu merge từ F-036 (BE) + F-088 (UI Danh sách) + F-089 (UI Chi tiết) + designer specs 01-list + 02-detail.

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Tính năng gồm 2 màn hình: **Danh sách** và **Chi tiết**, là hub trung tâm của toàn bộ nhóm Quản lý Vùng nước.

- **Danh sách (VungNuocListPage):** hiển thị toàn bộ Vùng nước với tìm kiếm, lọc (trạng thái hoạt động, phê duyệt, cảng mẹ), sắp xếp, phân trang. Mỗi dòng có các hành động theo phân quyền.
- **Chi tiết (VungNuocDetailPage):** hiển thị toàn bộ thông tin một Vùng nước, 5 card layout (Info, Stats, Status, Audit, Documents) + ActionFooter với nút hành động theo phân quyền.

Tất cả thao tác — Tạo mới (F-032), Cập nhật (F-033), Xóa (F-034), Phê duyệt (F-035), Lịch sử (F-037) — đều khởi tạo từ F-036 và quay về F-036 sau khi hoàn thành.

### 1.2. Tại sao cần?

- Danh sách tập trung giúp quản lý toàn bộ Vùng nước trên một màn hình, lọc và tìm kiếm linh hoạt
- Trang chi tiết cung cấp cái nhìn toàn diện, làm cơ sở cho các thao tác tiếp theo
- Hỗ trợ quy hoạch, thẩm định, kiểm toán và ra quyết định về phân vùng biển

### 1.3. Luồng chính

1. Menu → "Quản lý Vùng nước" → Danh sách với tìm kiếm, lọc, phân trang
2. Click dòng → Chi tiết Vùng nước (5-card layout)
3. Từ Danh sách: "Thêm mới" → modal F-032 → lưu → refresh
4. Từ Danh sách/Chi tiết: Chỉnh sửa (F-033), Xóa (F-034), Phê duyệt (F-035), Lịch sử (F-037)

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Phân quyền theo chức năng

Tính năng được bảo vệ bởi các permission. Chỉ người dùng được gán quyền mới thấy nút tương ứng và gọi được API:

| Permission | Mô tả |
|---|---|
| `vungnuoc:read` | Xem danh sách, chi tiết Vùng nước |
| `vungnuoc:create` | Tạo mới Vùng nước |
| `vungnuoc:update` | Cập nhật Vùng nước |
| `vungnuoc:delete` | Xóa Vùng nước |
| `vungnuoc:approve` | Phê duyệt / Từ chối Vùng nước |
| `vungnuoc:history` | Xem lịch sử thay đổi Vùng nước |

> **Phân quyền do M-001 — Quản trị hệ thống quản lý.** Các permission trên được gán động cho vai trò thông qua module M-001. Tài liệu này chỉ khai báo permission cần có; việc gán vai trò nào có quyền nào thuộc về cấu hình RBAC trong M-001.

> **Admin Cục (system-admin):** Khi được gán `vungnuoc:read`, xem toàn bộ dữ liệu không giới hạn đơn vị. Xem thêm audit fields.

### 2.2. Bảng phân quyền hiển thị

| Vai trò | List | Detail | Delete | Approve | Reject | History |
|---|---|---|---|---|---|---|
| system-admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| LeDuan (Lãnh đạo) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Doanh nghiệp cảng | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Nhân viên vận hành | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### 2.3. Logic Admin Cục

- Xem full dữ liệu, không giới hạn đơn vị
- Xem `createdBy`, `createdAt`, `updatedBy`, `updatedAt`
- Các vai trò khác: ẩn các trường audit này

---

## 3. User Stories

### Must
- **US-036-01:** Xem danh sách Vùng nước với đầy đủ cột (STT, Mã, Tên, Cảng biển chủ, Diện tích, Độ sâu max, Độ sâu TB, Loại, Trạng thái HĐ, Phê duyệt, Ngày tạo, Hành động).
- **US-036-02:** Tìm kiếm theo mã hoặc tên Vùng nước.
- **US-036-03:** Lọc theo trạng thái hoạt động (HIỆN_HÀNH/TẠM_NGƯNG), trạng thái phê duyệt, cảng mẹ.
- **US-036-04:** Click dòng → xem chi tiết Vùng nước (5-card layout).
- **US-036-05:** Badge trạng thái màu sắc để nhận diện nhanh.

### Should
- **US-036-06:** Phân trang 20/100 mục, sắp xếp theo nhiều tiêu chí.
- **US-036-07:** Danh sách tài liệu đính kèm với nút tải xuống từ trang chi tiết.

### Could
- **US-036-08:** Điều hướng bàn phím (Tab/Enter) trên bảng danh sách.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Danh sách

**AC-036-01:** Mở trang → `GET /api/v1/vung-nuoc?page=0&size=20&sortBy=updatedAt&sortDir=DESC` → hiển thị 20 mục.
**AC-036-02:** Tìm kiếm → khớp `maVungNuoc` hoặc `tenVungNuoc` → kết quả phù hợp.
**AC-036-03:** Lọc trạng thái HĐ: HIỆN_HÀNH / TẠM_NGƯNG. Lọc phê duyệt: CHỜ_PHÊ_DUYỆT / ĐƯỢC_PHÊ_DUYỆT / TỪ_CHỐI.
**AC-036-04:** Lọc cảng mẹ → `?cangBienId={id}` (INT-004).
**AC-036-05:** Sắp xếp `updatedAt` DESC. Phân trang đúng tổng số trang.
**AC-036-06:** Hành động (Xem, Sửa, Xóa, Phê duyệt, Lịch sử) hiển thị theo RBAC + trạng thái.
**AC-036-07:** Không có kết quả → empty state "Không có dữ liệu".

### Nhóm 2: Chi tiết

**AC-036-08:** Click dòng → `GET /api/v1/vung-nuoc/{id}` → hiển thị đủ thông tin.
**AC-036-09:** Breadcrumb: "Danh sách Vùng nước > Chi tiết {tenVungNuoc}". Tên cảng mẹ → link Cảng biển.
**AC-036-10:** Số: dienTich, doSauMax, doSauTrungBinh đúng precision/scale.
**AC-036-11:** Badge: HIỆN_HÀNH (xanh lá), TẠM_NGƯNG (đỏ), CHỜ_PHÊ_DUYỆT (vàng), ĐƯỢC_PHÊ_DUYỆT (xanh dương), TỪ_CHỐI (đỏ).
**AC-036-12:** Attachment: danh sách file + [Tải xuống] [In].
**AC-036-13:** `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT` + `vungnuoc:approve` → hiện [Phê duyệt] [Từ chối].

### Nhóm 3: Lỗi

**AC-036-14:** 404 → "Không tìm thấy vùng nước". 403 → "Bạn không có quyền".

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-036-01 | `maVungNuoc` duy nhất toàn hệ thống | POST, PUT | Entity | Không |
| BR-036-02 | `cangBienId` phải tồn tại, `trangThaiHoatDong = HIEN_HANH` | POST | Parent guard | Không |
| BR-036-03 | `dienTich` (15,2), `doSauMax` (10,2), `doSauTrungBinh` (10,2) phải là số hợp lệ | POST, PUT | Type validation | Không |
| BR-036-04 | Trạng thái phê duyệt mặc định: `CHỜ_PHÊ_DUYỆT` | POST | Default | Không |
| BR-036-05 | Xóa: soft-delete (`deletedAt = now()`), không child guard (leaf entity) | DELETE | Soft-delete | Không |
| BR-036-06 | Badge màu nhất quán toàn hệ thống | Display | UX | Không |
| BR-036-07 | Admin Cục: xem thêm createdBy, createdAt, updatedBy, updatedAt; vai trò khác: ẩn | Display | RBAC | Không |

---

## 6. Mô hình dữ liệu

> ✅ = đã có trong code. 🔴 = cần thêm vào DB.

### 6.1. `vung_nuoc` — Chính

| # | Tên trường | Kiểu | Bắt buộc | Mô tả | Status |
|---|---|---|---|---|---|
| 1 | id | UUID | Có | PK | ✅ |
| 2 | ma_vung_nuoc | NVARCHAR(50) | Có | Mã, unique, immutable | ✅ |
| 3 | ten_vung_nuoc | NVARCHAR(255) | Có | Tên | ✅ |
| 4 | cang_bien_id | UUID | Có | FK → Cảng biển | ✅ |
| 5 | dien_tich | DECIMAL(15,2) | Không | Diện tích (m²) | ✅ |
| 6 | do_sau_max | DECIMAL(10,2) | Không | Độ sâu tối đa (m) | ✅ |
| 7 | do_sau_trung_binh | DECIMAL(10,2) | Không | Độ sâu trung bình (m) | ✅ |
| 8 | loai_vung_nuoc | NVARCHAR(100) | Không | Loại, free text | ✅ |
| 9 | trang_thai_hoat_dong | NVARCHAR(50) | Có | HIỆN_HÀNH / TẠM_NGƯNG | ✅ |
| 10 | trang_thai_phe_duyet | NVARCHAR(50) | Có | CHỜ_PHÊ_DUYỆT / ĐƯỢC_PHÊ_DUYỆT / TỪ_CHỐI | ✅ |
| 11 | org_unit_id | UUID | Không | Đơn vị quản lý | ✅ |

### 6.2. `vung_nuoc` — Audit

| # | Tên trường | Kiểu | Status |
|---|---|---|---|
| 12 | created_by | NVARCHAR(100) | ✅ |
| 13 | created_at | TIMESTAMP | ✅ |
| 14 | updated_by | NVARCHAR(100) | ✅ |
| 15 | updated_at | TIMESTAMP | ✅ |
| 16 | deleted_at | TIMESTAMP (nullable) | ✅ |

### 6.3. `vung_nuoc_attachments` (🔴 mới — nếu dùng bảng riêng)

| Tên trường | Kiểu | Mô tả |
|---|---|---|
| id | UUID | PK |
| vung_nuoc_id | UUID | FK |
| ten_file | NVARCHAR(255) | Tên file |
| loai_file | NVARCHAR(50) | MIME |
| kich_thuoc | BIGINT | Bytes |
| duong_dan | NVARCHAR(500) | Path |
| created_at | TIMESTAMP | |

> ⚠️ Hiện tại dùng chung entity `GiayTo` với `entityType = "vung-nuoc"`. Bảng riêng có thể bổ sung sau.

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/vung-nuoc` | Danh sách (phân trang, lọc, sắp xếp) | `vungnuoc:read` |
| GET | `/api/v1/vung-nuoc/{id}` | Chi tiết một Vùng nước | `vungnuoc:read` |
| GET | `/api/v1/vung-nuoc/code/{maVungNuoc}` | Tìm theo mã | `vungnuoc:read` |
| GET | `/api/v1/giay-to/entity/vung-nuoc/{id}` | DS tài liệu đính kèm | `vungnuoc:read` |

### Query Parameters cho GET List

| Param | Kiểu | Mặc định | Mô tả |
|---|---|---|---|
| page | int | 0 | Trang (0-based) |
| size | int | 20 | Số mục (max 100) |
| sortBy | string | updatedAt | maVungNuoc / tenVungNuoc / createdAt / updatedAt |
| sortDir | string | DESC | asc / desc |
| search | string | | Tìm trong maVungNuoc hoặc tenVungNuoc |
| trangThaiHoatDong | string | | HIỆN_HÀNH / TẠM_NGƯNG |
| trangThaiPheDuyet | string | | CHỜ_PHÊ_DUYỆT / ĐƯỢC_PHÊ_DUYỆT / TỪ_CHỐI |
| cangBienId | UUID | | Lọc theo cảng mẹ (INT-004) |
| orgUnitId | UUID | | Lọc theo đơn vị |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Mở danh sách

Menu → "Quản lý Vùng nước" → `GET /api/v1/vung-nuoc` với default params → hiển thị bảng 20 dòng, sắp xếp updatedAt DESC. FiltersBar gồm: ô tìm kiếm (search maVungNuoc/tenVungNuoc, debounce 300ms), dropdown trạng thái HĐ, dropdown phê duyệt, dropdown cảng mẹ (chỉ CangBien HIEN_HANH). Nút "Tìm kiếm" + "Reload".

### 8.2. Tìm kiếm & Lọc

Người dùng nhập từ khóa, chọn filter → hệ thống gọi API với params tương ứng → refresh bảng. Debounce 300ms cho ô tìm kiếm. Dropdown cảng mẹ gọi `GET /api/v1/cang-bien?trangThaiHoatDong=HIEN_HANH`. Lọc trạng thái phê duyệt: Tất cả / CHỜ_PHÊ_DUYỆT / ĐƯỢC_PHÊ_DUYỆT / TỪ_CHỐI.

### 8.3. Mở chi tiết

Click dòng hoặc nút "Xem chi tiết" → `GET /api/v1/vung-nuoc/{id}` → 5-card layout. Tab mặc định hiển thị toàn bộ thông tin. Breadcrumb: "Danh sách Vùng nước > Chi tiết {tenVungNuoc}". Tên cảng mẹ là link → Chi tiết Cảng biển.

### 8.4. Hành động từ danh sách

RowActions dropdown: 👁 Detail (luôn hiện) | ✏ Edit (nếu `vungnuoc:update`) | ✅ Approve (nếu `vungnuoc:approve` + CHỜ_PHÊ_DUYỆT) | ❌ Reject | 🗑 Delete (nếu `vungnuoc:delete`) | 📋 History (nếu `vungnuoc:history`).

### 8.5. Hành động từ chi tiết

ActionFooter sticky bottom: [Chỉnh sửa] nếu `vungnuoc:update`, [Xóa] nếu `vungnuoc:delete`, [Phê duyệt] [Từ chối] nếu `vungnuoc:approve` + CHỜ_PHÊ_DUYỆT, [Lịch sử] nếu `vungnuoc:history`.

### 8.6. Badge trạng thái

Hiển thị trong bảng danh sách và trang chi tiết. 2 badge: `trangThaiHoatDong` + `trangThaiPheDuyet`.

| Badge | Giá trị | Màu |
|---|---|---|
| Hoạt động | HIỆN_HÀNH | `statusOperational` (xanh lá) |
| Hoạt động | TẠM_NGƯNG | `statusDanger` (đỏ) |
| Phê duyệt | CHỜ_PHÊ_DUYỆT | `statusWarning` (vàng) |
| Phê duyệt | ĐƯỢC_PHÊ_DUYỆT | `statusOperational` (xanh dương) |
| Phê duyệt | TỪ_CHỐI | `statusDanger` (đỏ) |

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** List GET ≤ 2s với 1000+ bản ghi (index `cangBienId`, `trangThaiHoatDong`, `trangThaiPheDuyet`). Debounce 300ms tìm kiếm.
- **Bảo mật:** HTTPS; RBAC từng nút hành động.
- **UX:** Responsive; loading skeleton; breadcrumb; toast sau mỗi hành động; empty state "Không có dữ liệu".
- **Accessibility:** Keyboard Tab/Enter; ARIA `role="grid"`, `aria-sort`; badge màu + text label (WCAG 2.1 AA ≥ 4.5:1).

---

## 10. Yêu cầu giao diện

> Token: `theme.ts` + `tokens.ts`. KHÔNG hardcode.

### 10.1. Màn hình Danh sách — Component Structure

```
VungNuocListPage
├── PageHeader (title, breadcrumbs)
├── FiltersBar (searchInput, statusFilter, approvalFilter, cangBienFilter)
├── DataTable
│   ├── columns: STT | Mã VN | Tên VN | Cảng biển chủ | Diện tích | Độ sâu max | Độ sâu TB | Loại VN | Trạng thái HĐ | Phê duyệt | Ngày tạo | Hành động
│   ├── RowActions (view, edit, approve, reject, delete, history)
│   └── Pagination
├── ApproveRejectModal
└── DeleteConfirmModal
```

### 10.2. Màn hình Danh sách — Field Mapping

| BE Field | React Component | Validation |
|---|---|---|
| id | (internal key) | Required |
| maVungNuoc | TextCell | Immutable, unique |
| tenVungNuoc | TextCell (clickable → Detail) | Required |
| cangBienId | TextCell (shows tenCang, → CangBien) | Required FK |
| dienTich | NumberCell | Optional |
| doSauMax | NumberCell | Optional |
| doSauTrungBinh | NumberCell | Optional |
| loaiVungNuoc | TextCell (truncate) | Optional, free text |
| trangThaiHoatDong | Badge | HIỆN_HÀNH / TẠM_NGƯNG |
| trangThaiPheDuyet | Badge | CHỜ_PHÊ_DUYỆT / ĐƯỢC_PHÊ_DUYỆT / TỪ_CHỐI |
| createdAt | DateTimeCell (dd/MM/yyyy HH:mm) | Read-only |

### 10.3. Màn hình Danh sách — Cột bảng

| STT | Tên cột | Rộng | Ghi chú |
|---|---|---|---|
| 1 | STT | 50px | Số thứ tự |
| 2 | Mã vùng nước | 140px | |
| 3 | Tên vùng nước | 250px | Truncate, click → Detail |
| 4 | Cảng biển chủ | 180px | Click → CangBien detail |
| 5 | Diện tích | 110px | Right-align |
| 6 | Độ sâu max | 110px | Right-align |
| 7 | Độ sâu TB | 120px | Right-align |
| 8 | Loại vùng nước | 130px | Truncate |
| 9 | Trạng thái HĐ | 100px | Badge |
| 10 | Phê duyệt | 110px | Badge |
| 11 | Ngày tạo | 140px | |
| 12 | Hành động | 120px | Sticky right |

### 10.4. Màn hình Chi tiết — Component Structure

```
VungNuocDetailPage
├── PageHeader (title, breadcrumbs, backBtn, actionButtons)
├── InfoCard (maVungNuoc, tenVungNuoc, cangBienId → link)
├── StatsCard (dienTich, doSauMax, doSauTrungBinh, loaiVungNuoc)
├── StatusCard (trangThaiHoatDong Badge, trangThaiPheDuyet Badge)
├── AuditCard (createdBy, updatedBy, createdAt, updatedAt, orgUnitId)
├── DocumentsSection (GiayTo list + download/delete)
└── ActionFooter (sticky: Edit, Delete, Approve, Reject, History)
```

### 10.5. Màn hình Chi tiết — Layout

| Card | Vị trí | Nội dung |
|---|---|---|
| PageHeader | Top | Breadcrumb + Title "[maVungNuoc] — [tenVungNuoc]" + Back |
| InfoCard | Left 2/3 | Mã (large), Tên, Cảng biển chủ (link) |
| StatsCard | Left | Diện tích (m²), Độ sâu max (m), Độ sâu TB (m), Loại |
| StatusCard | Right 1/3 | 2 Badge: trạng thái HĐ + phê duyệt |
| AuditCard | Bottom full | createdBy, updatedBy, createdAt, updatedAt, orgUnitId (chỉ Admin Cục) |
| DocumentsSection | Full width | Danh sách GiayTo + [Tải xuống] [Xóa] |
| ActionFooter | Sticky bottom | Nút hành động `borderRadius: radiusPill`, `height: 40` |

### 10.6. Audit (chỉ Admin Cục)

| Trường | Nguồn |
|---|---|
| Người tạo | `createdBy` → resolve username |
| Ngày tạo | `createdAt` (dd/MM/yyyy HH:mm) |
| Cập nhật lần cuối | `updatedBy` → resolve username |
| Ngày cập nhật | `updatedAt` (dd/MM/yyyy HH:mm) |

### 10.7. UX

- `marginBottom: spaceFormField`, `borderRadius: radiusPill`, `height: 40` cho mọi nút
- Loading skeleton khi GET đang chạy
- Toast lỗi `statusDanger` nếu GET thất bại
- Empty state với icon khi không có dữ liệu

---

## 11. Xử lý lỗi

| Tình huống | Xử lý |
|---|---|
| 404 | "Không tìm thấy vùng nước với ID [id]" |
| 403 | "Bạn không có quyền xem thông tin này" |
| 409 (duplicate) | Toast "Mã vùng nước 'X' đã tồn tại" + inline error |
| 422 Validation | Map BE errors → inline field messages |
| Network timeout | Toast "Kết nối thất bại. Vui lòng thử lại" + retry |
| Soft-delete confirm | Modal "Bạn có chắc chắn muốn xóa vùng nước '[maVungNuoc]'?" |
| Attachment empty | "Không có tài liệu đính kèm" |

## Testing Strategy

Unit: Business rules (mã duy nhất, validation). Integration: API GET list + detail với params. E2E: Danh sách hiển thị đúng, phân trang, tìm kiếm/lọc, hành động chuyển hướng đúng, badge màu, breadcrumb. RBAC: hành động chỉ hiển thị khi có quyền.

---

## Implementation Status

| Layer | Status | Notes |
|---|---|---|
| Backend (API) | Done | 10 endpoints sẵn sàng |
| Frontend (UI) | Pending | Spec sẵn sàng, chờ implement |
