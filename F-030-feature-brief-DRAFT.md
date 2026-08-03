---
id: F-030
name: Xem chi tiết Cảng cạn
slug: xem-cct
module-id: M-002
status: backend_done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-03
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Xem chi tiết Cảng cạn

**Tài liệu:** BA Feature Brief
**Feature:** F-030 — Xem chi tiết Cảng cạn
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-03

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Trang chi tiết hiển thị **toàn bộ 25 trường** của một Cảng cạn dưới dạng read-only, chia 4 tab giống F-026 (Thông tin chung | Công bố | Vị trí | File đính kèm). Badge màu cho trạng thái hoạt động và phê duyệt. Các nút hành động trong footer hiển thị theo phân quyền.

### 1.2. Tại sao cần?

- Cung cấp góc nhìn tổng quan, đầy đủ về một Cảng cạn
- Điểm trung tâm để điều hướng đến các chức năng khác: Chỉnh sửa, Xóa, Lịch sử, Phê duyệt
- Hiển thị trực quan trạng thái qua badge màu

### 1.3. Luồng chính

F-083 → click dòng hoặc "Xem chi tiết" → `GET /api/v1/dry-ports/{id}` → 4 tab read-only. Breadcrumb: "Quản lý Cảng cạn > CC-XXXXXX". Footer: nút hành động theo permission.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Phân quyền theo chức năng

| Permission | Hiển thị / Hành động |
|---|---|
| `dryport:read` | Xem trang chi tiết |
| `dryport:update` | Nút "Chỉnh sửa" → F-027 |
| `dryport:delete` | Nút "Xóa" → F-028 |
| `dryport:approve` | Nút "Phê duyệt" / "Từ chối" (chỉ khi PENDING) |
| `dryport:history` | Nút "Lịch sử" → F-031 |

> Phân quyền do M-001 quản lý. Admin Cục: xem thêm createdBy, createdAt, updatedBy, updatedAt.

---

## 3. User Stories

### Must
- **US-030-01:** Xem toàn bộ 25 trường Cảng cạn, chia 4 tab.
- **US-030-02:** Badge trạng thái: CHUA_KHAI_THAC / VAN_HANH và NHAP / PENDING / APPROVED / REJECTED.
- **US-030-03:** Breadcrumb "Quản lý Cảng cạn > CC-XXXXXX", bấm quay lại F-083.

### Should
- **US-030-04:** Danh sách file đính kèm với nút tải xuống.
- **US-030-05:** Nút hành động footer theo phân quyền.

### Could
- **US-030-06:** Xem tọa độ trên bản đồ preview nhúng.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Hiển thị

**AC-030-01:** `GET /api/v1/dry-ports/{id}` → hiển thị đủ 25 trường, 4 tab giống F-026 Section 10.
**AC-030-02:** Badge màu: CHUA_KHAI_THAC (xám), VAN_HANH (xanh lá) cho tinhTrang; NHAP (xám), PENDING (vàng), APPROVED (xanh đậm), REJECTED (đỏ) cho approvalStatus.
**AC-030-03:** Breadcrumb: "Quản lý Cảng cạn > CC-XXXXXX" — bấm "Quản lý Cảng cạn" → F-083.

### Nhóm 2: Hành động

**AC-030-04:** Footer hiển thị nút theo permission: [Chỉnh sửa] nếu `dryport:update`, [Xóa] nếu `dryport:delete`, [Lịch sử] nếu `dryport:history`.
**AC-030-05:** Nếu `approvalStatus=PENDING` + `dryport:approve` → thêm [Phê duyệt] [Từ chối] (gọi trực tiếp API của F-029).

### Nhóm 3: File & Lỗi

**AC-030-06:** File đính kèm: danh sách tên, kích thước, ngày upload, nút [Tải xuống].
**AC-030-07:** ID không tồn tại → 404. ID đã xóa mềm → 404 (trừ Admin Cục — hiển thị kèm badge "Đã xóa").

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Nguồn |
|---|---|---|
| BR-030-01 | Hiển thị đầy đủ 25 trường — không ẩn trường nào với người có `dryport:read`. | Nghiệp vụ |
| BR-030-02 | Badge màu nhất quán toàn hệ thống. | UX |
| BR-030-03 | Admin Cục: xem thêm createdBy, createdAt, updatedBy, updatedAt. Vai trò khác: ẩn. | RBAC |
| BR-030-04 | Bản ghi deletedAt != null → 404 với vai trò thường; Admin Cục xem được kèm badge "Đã xóa". | Nghiệp vụ |
| BR-030-05 | Trang chi tiết là read-only — mọi chỉnh sửa phải qua F-027. | Thiết kế |

---

## 6. Mô hình dữ liệu

> Kế thừa toàn bộ F-026 Section 6. Không thêm bảng mới.

Trang chi tiết gọi `GET /api/v1/dry-ports/{id}` trả về DryPortResponse gồm 25 trường + danh sách tọa độ + danh sách file đính kèm.

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/dry-ports/{id}` | Lấy chi tiết Cảng cạn | `dryport:read` |
| POST | `/api/v1/dry-ports/{id}/approve` | Phê duyệt (từ F-030, nếu PENDING) | `dryport:approve` |
| POST | `/api/v1/dry-ports/{id}/reject?reason=` | Từ chối (từ F-030, nếu PENDING) | `dryport:approve` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Mở trang chi tiết

Từ F-083: click dòng hoặc dropdown → "Xem chi tiết". GET trả về toàn bộ dữ liệu. Hiển thị 4 tab. Tab đầu tiên (Thông tin chung) active mặc định.

### 8.2. Badge trạng thái

Hiển thị ở đầu trang, bên cạnh tên cảng cạn. 2 badge: tinhTrang + approvalStatus.

### 8.3. Hành động footer

Nút hiển thị động theo permission. Phê duyệt/Từ chối gọi API trực tiếp (không cần chuyển trang) → toast → refresh trạng thái.

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** GET ≤500ms; approve/reject ≤1s
- **Bảo mật:** HTTPS; RBAC từng nút hành động
- **UX:** Responsive; loading skeleton; breadcrumb điều hướng

---

## 10. Yêu cầu giao diện

> Token từ `theme.ts` + `tokens.ts`.

- **Layout:** Header "CC-XXXXXX — [Tên]" + badge trạng thái. Body 4 tab read-only (giống F-026 Section 10). Footer: nút hành động `radiusPill`, `height:40`.
- **Breadcrumb:** "Quản lý Cảng cạn > CC-XXXXXX"
- **Badge:** `statusOperational` (APPROVED/VAN_HANH), `statusWarning` (PENDING), `statusDanger` (REJECTED), `textTertiary` (NHAP/CHUA_KHAI_THAC)

---

## Implementation Status

| Layer | Status |
|-------|--------|
| Backend | Done |
| Frontend | Pending |
