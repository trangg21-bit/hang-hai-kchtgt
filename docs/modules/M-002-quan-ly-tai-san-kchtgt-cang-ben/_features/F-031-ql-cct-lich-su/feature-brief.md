---
id: F-031
name: Quản lý Cảng cạn - Lịch sử
slug: ql-cct-lich-su
module-id: M-002
status: backend_done
classification: local
priority: medium
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-03
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Cảng cạn - Lịch sử thay đổi

**Tài liệu:** BA Feature Brief
**Feature:** F-031 — Lịch sử Cảng cạn
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-03

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Hiển thị toàn bộ lịch sử thay đổi của một Cảng cạn từ bảng `change_history`. Mỗi dòng thể hiện: loại hành động (Tạo mới / Cập nhật), trường bị thay đổi, giá trị cũ → giá trị mới, người thực hiện, thời gian. Dữ liệu sắp xếp mới nhất lên đầu. Có bộ lọc theo tên trường.

### 1.2. Tại sao cần?

- Truy xuất mọi thay đổi của Cảng cạn — minh bạch, giải trình được
- Hỗ trợ kiểm toán: ai sửa, sửa gì, khi nào
- Phát hiện sai sót: so sánh oldValue → newValue

### 1.3. Luồng chính

F-083 (dropdown) hoặc F-084 (nút "Lịch sử") → `GET /api/v1/dry-ports/{id}/history` → bảng change_history phân trang. Breadcrumb: "Chi tiết > Lịch sử". Filter dropdown: chọn tên trường → chỉ hiện thay đổi của trường đó.

---

## 2. Ai dùng? Dùng như thế nào?

| Permission | Mô tả |
|---|---|
| `dryport:history` | Xem lịch sử thay đổi |

> M-001 quản lý. Tất cả vai trò (trừ Cá nhân) thường được gán quyền này. Admin Cục: không giới hạn đơn vị.

---

## 3. User Stories

### Must
- **US-031-01:** Xem danh sách thay đổi, sắp xếp mới nhất lên đầu.
- **US-031-02:** Phân biệt Tạo mới (badge xanh) và Cập nhật (badge vàng).
- **US-031-03:** Xem chi tiết từng thay đổi: trường nào, giá trị cũ → mới.

### Should
- **US-031-04:** Lọc theo tên trường (Field filter dropdown).
- **US-031-05:** Phân trang 20 dòng/trang.

### Could
- **US-031-06:** Xuất Excel lịch sử thay đổi.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Hiển thị

**AC-031-01:** `GET /api/v1/dry-ports/{id}/history` → bảng các cột: Hành động (badge), Trường, Giá trị cũ, Giá trị mới, Người thay đổi, Thời gian.
**AC-031-02:** Sắp xếp `changedAt` DESC (mới nhất lên đầu).
**AC-031-03:** CREATE = badge xanh "Tạo mới", UPDATE = badge vàng "Cập nhật".

### Nhóm 2: Lọc & Phân trang

**AC-031-04:** Dropdown "Trường" → chọn tên trường → GET `?field=` → chỉ hiện thay đổi của trường đó. Chọn "Tất cả" → hiện toàn bộ.
**AC-031-05:** Phân trang 20 dòng/trang.

### Nhóm 3: Dữ liệu

**AC-031-06:** `oldValue` hoặc `newValue` null → hiển thị "—".
**AC-031-07:** `changedBy` hiển thị tên người dùng (resolve UUID → tên qua M-001), không hiển thị UUID.
**AC-031-08:** `changedAt` hiển thị định dạng dd/MM/yyyy HH:mm:ss.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Nguồn |
|---|---|---|
| BR-031-01 | Lịch sử thay đổi là bất biến — không thể xóa hoặc sửa. | Thiết kế |
| BR-031-02 | Bản ghi CREATE đầu tiên được tạo khi Cảng cạn được tạo mới (F-026 Lưu và phê duyệt). | Nghiệp vụ |
| BR-031-03 | Bản ghi UPDATE được tạo mỗi lần Lưu và phê duyệt trong F-027. | Nghiệp vụ |
| BR-031-04 | `changedBy` resolve UUID → tên hiển thị từ M-001. Nếu user đã bị xóa → hiển thị "Người dùng không xác định". | Kỹ thuật |

---

## 6. Mô hình dữ liệu

### `change_history`

| Tên trường | Kiểu | Mô tả |
|---|---|---|
| id | UUID | PK |
| entity_id | UUID | FK → dry_ports.id |
| entity_type | NVARCHAR(50) | "DRY_PORT" |
| action_type | NVARCHAR(20) | CREATE / UPDATE |
| field_name | NVARCHAR(100) | Tên trường thay đổi |
| old_value | NVARCHAR(1000) | Giá trị cũ (null nếu CREATE) |
| new_value | NVARCHAR(1000) | Giá trị mới |
| changed_by | UUID | Người thực hiện |
| changed_at | TIMESTAMP | Thời điểm |

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/dry-ports/{id}/history?field=&page=&size=` | Lấy lịch sử thay đổi | `dryport:history` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Truy cập lịch sử

Từ F-083: dropdown hành động → "Lịch sử". Từ F-084: nút "Lịch sử" trong footer. Cả hai truyền `id` → GET history.

### 8.2. Bảng lịch sử

Dòng đầu tiên luôn là CREATE (từ F-026). Các dòng sau là UPDATE (từ F-027). Mỗi lần Lưu và phê duyệt tạo N dòng UPDATE (N = số trường thay đổi).

### 8.3. Lọc

Dropdown chứa tất cả tên trường của DryPort (25 trường). Chọn 1 trường → filter. Mặc định: "Tất cả".

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** GET ≤500ms; hỗ trợ ≥50 concurrent
- **Bảo mật:** HTTPS; RBAC; dữ liệu read-only
- **UX:** Responsive; loading skeleton; phân trang mượt

---

## 10. Yêu cầu giao diện

> Token từ `theme.ts` + `tokens.ts`.

- **Layout:** Breadcrumb "Quản lý Cảng cạn > CC-XXXXXX > Lịch sử". Bảng lịch sử + filter dropdown + phân trang.
- **Badge:** CREATE = `statusOperational` (xanh), UPDATE = `statusWarning` (vàng)
- **Bảng:** cột rõ ràng, oldValue → newValue hiển thị dạng "A → B"
- `borderRadius: radiusPill`, `height:40` cho dropdown

---

## Implementation Status

| Layer | Status |
|-------|--------|
| Backend | Done |
| Frontend | Pending |
