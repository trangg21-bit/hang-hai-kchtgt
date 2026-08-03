---
id: F-083
name: Danh sách Cảng cạn
slug: ui-ql-cct-danh-sach
module-id: M-002
status: proposed
classification: local
priority: medium
created: 2026-07-01T04:08:35Z
last-updated: 2026-08-03
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Danh sách Cảng cạn

**Tài liệu:** BA Feature Brief
**Feature:** F-083 — Danh sách Cảng cạn
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-03

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Trang Danh sách là **điểm vào chính** cho toàn bộ quy trình quản lý Cảng cạn. Hiển thị danh sách phân trang với tìm kiếm, lọc, và các hành động trên từng dòng theo phân quyền. Đặc biệt, đây là nơi thực hiện **"Gửi phê duyệt"** — chuyển bản ghi NHAP sang PENDING để vào queue duyệt (F-029).

### 1.2. Hành động trên mỗi dòng

| Hành động | Điều kiện hiển thị | Đích / API |
|-----------|-------------------|-----------|
| Xem chi tiết | Luôn (click dòng) | F-030 |
| Tiếp tục chỉnh sửa | `approvalStatus=NHAP` + `dryport:update` | F-027 |
| Chỉnh sửa | `approvalStatus != NHAP` + `dryport:update` | F-027 |
| **Gửi phê duyệt** | `approvalStatus=NHAP` | PUT → PENDING |
| Xóa | `dryport:delete` | F-028 |
| Phê duyệt / Từ chối | `approvalStatus=PENDING` + `dryport:approve` | F-029 |
| Lịch sử | `dryport:history` | F-031 |

### 1.3. Tại sao cần?

- Cửa ngõ duy nhất để xem và thao tác với tất cả Cảng cạn
- Tập trung mọi hành động: tạo mới, sửa, xóa, gửi duyệt, phê duyệt
- Tìm kiếm và lọc nhanh giúp quản lý số lượng lớn Cảng cạn

### 1.4. Luồng chính

Mở trang → `GET /api/v1/dry-ports?page=0&size=20&sortBy=updatedAt&sortOrder=DESC` → bảng 20 dòng. Header: nút "Tạo mới" (`dryport:create`) → F-026. FilterBar: ô search + dropdown Tỉnh/TP + dropdown Trạng thái. Mỗi dòng: click → F-030, dropdown → hành động khác.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Phân quyền theo chức năng

| Permission | Hiển thị / Hành động |
|---|---|
| `dryport:read` | Xem danh sách |
| `dryport:create` | Nút "Tạo mới" trên header |
| `dryport:update` | "Chỉnh sửa" / "Tiếp tục chỉnh sửa" trong dropdown |
| `dryport:delete` | "Xóa" trong dropdown |
| `dryport:approve` | "Phê duyệt" / "Từ chối" (nếu PENDING) |
| `dryport:history` | "Lịch sử" trong dropdown |

> M-001 quản lý. Admin Cục: không giới hạn đơn vị, xem được bản ghi đã xóa mềm.

---

## 3. User Stories

### Must
- **US-083-01:** Xem danh sách Cảng cạn phân trang 20 dòng, sắp xếp updatedAt DESC.
- **US-083-02:** Tìm kiếm theo mã, tên, địa chỉ (ô search + Enter).
- **US-083-03:** Lọc theo Tỉnh/TP và Trạng thái phê duyệt.
- **US-083-04:** **Gửi phê duyệt** bản ghi NHAP — kiểm tra đủ 6 trường → PENDING.
- **US-083-05:** Các nút hành động hiển thị theo phân quyền.

### Should
- **US-083-06:** Badge trạng thái màu trên mỗi dòng.
- **US-083-07:** Click dòng → F-030. Dropdown hành động đầy đủ.

### Could
- **US-083-08:** Xuất Excel danh sách Cảng cạn.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Danh sách

**AC-083-01:** Mở trang → GET page=0, size=20, sortBy=updatedAt, sortOrder=DESC → bảng 20 dòng.
**AC-083-02:** Cột: Mã CC-XXXXXX, Tên, Tỉnh/TP, Trạng thái (badge), Ngày cập nhật.
**AC-083-03:** Phân trang: tổng số trang, nút Previous/Next, nhập số trang.

### Nhóm 2: Tìm kiếm & Lọc

**AC-083-04:** Ô search → Enter → GET `?search=` (tìm trong mã, tên, địa chỉ). 0 kết quả → "Không tìm thấy Cảng cạn nào".
**AC-083-05:** Dropdown Tỉnh/TP + Trạng thái → GET với filter tương ứng. Kết hợp được với search.

### Nhóm 3: Gửi phê duyệt

**AC-083-06:** Bản ghi NHAP → dropdown có "Gửi phê duyệt" → hệ thống kiểm tra đủ 6 trường:
- **Đủ** → `PUT /api/v1/dry-ports/{id}?action=submit` → `approvalStatus=PENDING` → toast "Đã gửi phê duyệt" → refresh.
- **Thiếu** → toast "Vui lòng hoàn thiện thông tin trước khi gửi. Thiếu: [danh sách trường]".

### Nhóm 4: Hành động khác

**AC-083-07:** Nút "Tạo mới" (`dryport:create`) → F-026.
**AC-083-08:** Click dòng → F-030. Dropdown: theo bảng 1.2.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

### 5.1. Danh sách

| ID | Quy tắc | Nguồn |
|---|---|---|
| BR-083-01 | Mặc định 20 dòng/trang, tối đa 100. | UX |
| BR-083-02 | Sắp xếp mặc định updatedAt DESC — mới nhất lên đầu. | UX |
| BR-083-03 | Search không phân biệt hoa thường, tự động trim. | Kỹ thuật |

### 5.2. Gửi phê duyệt

| ID | Quy tắc | Nguồn |
|---|---|---|
| BR-083-04 | **Gửi phê duyệt yêu cầu đủ 6 trường bắt buộc** (như BR-026-03). Thiếu → thông báo rõ thiếu trường nào. | Nghiệp vụ |
| BR-083-05 | Sau Gửi phê duyệt → `approvalStatus=PENDING` → vào queue F-029. | Nghiệp vụ |
| BR-083-06 | Chỉ NHAP mới hiển thị nút "Gửi phê duyệt". | Nghiệp vụ |

### 5.3. Phân quyền

| ID | Quy tắc | Nguồn |
|---|---|---|
| BR-083-07 | Mỗi nút hành động kiểm tra permission độc lập — nút nào không có quyền thì ẩn. | RBAC |
| BR-083-08 | Bản ghi đã xóa mềm không xuất hiện (trừ Admin Cục). | Thiết kế |

---

## 6. Mô hình dữ liệu

> Kế thừa F-026. Không thêm bảng mới.

API trả về `Page<DryPortResponse>`: id, dryPortCode, dryPortName, province, approvalStatus, operationalStatus, updatedAt...

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/dry-ports?page=&size=&search=&status=&approvalStatus=&sortBy=&sortOrder=` | Danh sách | `dryport:read` |
| PUT | `/api/v1/dry-ports/{id}?action=submit` | Gửi phê duyệt (từ NHAP) | `dryport:update` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Header & FilterBar

Header: breadcrumb "Quản lý Cảng cạn" + nút [Tạo mới] (`dryport:create`). FilterBar: ô search (placeholder "Tìm theo mã, tên, địa chỉ...") + dropdown Tỉnh/TP + dropdown Trạng thái (Tất cả / NHAP / PENDING / APPROVED / REJECTED) + nút [Tìm] [Reload].

### 8.2. Bảng danh sách

Mỗi dòng: Mã (link → F-030), Tên, Tỉnh/TP, Badge trạng thái, Ngày cập nhật (dd/MM/yyyy), Dropdown hành động (icon ba chấm).

### 8.3. Gửi phê duyệt

Dropdown → "Gửi phê duyệt" → loading → kiểm tra 6 trường → PUT submit → toast → refresh. Đây là bước chuyển NHAP → PENDING, khác với "Lưu và phê duyệt" trên form (F-026/F-027) chuyển thẳng → APPROVED.

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** GET ≤1s với 1000 bản ghi; search ≤500ms; hỗ trợ ≥50 concurrent
- **Bảo mật:** HTTPS; RBAC từng nút; server-side pagination
- **UX:** Responsive; loading skeleton; giữ filter khi chuyển trang

---

## 10. Yêu cầu giao diện

> Token từ `theme.ts` + `tokens.ts`. Dùng ScreenHeader, FilterBar, StatusTabs, DataTable, Pagination từ `frontend/src/components/list-view/`.

- **ScreenHeader:** "Quản lý Cảng cạn" + breadcrumb + nút [Tạo mới] primary
- **FilterBar:** Ô search + dropdown Tỉnh/TP + dropdown Trạng thái + [Tìm] [Reload]
- **DataTable:** Mã | Tên | Tỉnh/TP | Trạng thái (badge) | Ngày cập nhật | Hành động (dropdown)
- **Badge:** NHAP (xám), PENDING (vàng), APPROVED (xanh), REJECTED (đỏ)
- **Pagination:** Component chuẩn
- `borderRadius: radiusPill`, `height:40`

---

## Implementation Status

| Layer | Status |
|-------|--------|
| Backend | Done |
| Frontend | Pending |
