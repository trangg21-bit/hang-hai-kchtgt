---
id: F-029
name: Phê duyệt Cảng cạn
slug: phe-duyet-cct
module-id: M-002
status: backend_done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-03
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Phê duyệt Cảng cạn

**Tài liệu:** BA Feature Brief
**Feature:** F-029 — Phê duyệt Cảng cạn
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-03

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Phê duyệt Cảng cạn cho phép **Lãnh đạo** (`dryport:approve`) xem danh sách Cảng cạn đang chờ duyệt (`approvalStatus = PENDING`) và thực hiện **Phê duyệt** hoặc **Từ chối**. Cảng cạn vào trạng thái PENDING khi được "Gửi phê duyệt" từ F-083 (Danh sách). Mỗi hành động phê duyệt/từ chối được ghi vào `approval_logs`.

### 1.2. Tại sao cần?

- Kiểm soát chất lượng dữ liệu trước khi Cảng cạn đi vào hoạt động chính thức
- Đảm bảo mọi Cảng cạn đều được Lãnh đạo xem xét trước khi phê duyệt
- Ghi nhận đầy đủ: ai duyệt, khi nào, lý do từ chối — phục vụ truy xuất trách nhiệm

### 1.3. Luồng chính

F-083 → tab "Chờ phê duyệt" hoặc menu riêng → danh sách PENDING → chọn bản ghi → xem chi tiết → **Phê duyệt** (xác nhận → APPROVED) hoặc **Từ chối** (nhập lý do ≥10 ký tự → REJECTED).

---

## 2. Ai dùng? Dùng như thế nào?

| Permission | Mô tả |
|---|---|
| `dryport:approve` | Xem danh sách chờ duyệt, thực hiện Phê duyệt / Từ chối |

> Phân quyền do M-001 quản lý. Admin Cục không giới hạn đơn vị.

---

## 3. User Stories

### Must
- **US-029-01:** Là Lãnh đạo, tôi muốn xem danh sách Cảng cạn đang PENDING.
- **US-029-02:** Là Lãnh đạo, tôi muốn "Phê duyệt" → APPROVED, ghi approval_logs.
- **US-029-03:** Là Lãnh đạo, tôi muốn "Từ chối" với lý do ≥10 ký tự → REJECTED.

### Should
- **US-029-04:** Toast "Phê duyệt thành công" / "Đã từ chối", danh sách tự động làm mới.
- **US-029-05:** Xem chi tiết Cảng cạn trước khi quyết định phê duyệt/từ chối.

### Could
- **US-029-06:** Lọc danh sách chờ duyệt theo tỉnh/thành, ngày gửi.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Danh sách chờ duyệt

**AC-029-01:** `dryport:approve` → thấy tab/menu "Phê duyệt" → `GET /api/v1/dry-ports?approvalStatus=PENDING` → danh sách các cột: Mã, Tên, Tỉnh/TP, Ngày gửi, Người gửi. Không có quyền → ẩn tab.

### Nhóm 2: Phê duyệt

**AC-029-02:** Chọn bản ghi → xem chi tiết → "Phê duyệt" → hộp thoại xác nhận "Phê duyệt CC-XXXXXX — [Tên]?" → "Xác nhận" → `POST /api/v1/dry-ports/{id}/approve` → `approvalStatus=APPROVED`, tạo `approval_logs` (action=APPROVE) → toast "Phê duyệt thành công" → bản ghi biến khỏi danh sách.

### Nhóm 3: Từ chối

**AC-029-03:** "Từ chối" → form nhập lý do (textarea, bắt buộc, ≥10 ký tự) → "Xác nhận" → `POST /api/v1/dry-ports/{id}/reject?reason=...` → `approvalStatus=REJECTED`, tạo `approval_logs` (action=REJECT, reason) → toast "Đã từ chối".
**AC-029-04:** Lý do <10 ký tự → lỗi "Lý do từ chối phải có ít nhất 10 ký tự", không gửi API.

### Nhóm 4: Trạng thái

**AC-029-05:** Bản ghi đã APPROVED hoặc REJECTED → không xuất hiện trong danh sách chờ duyệt. Không thể phê duyệt lại.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

### 5.1. Luồng phê duyệt

| ID | Quy tắc | Nguồn |
|---|---|---|
| BR-029-01 | **Chỉ PENDING mới được duyệt** — Bản ghi có `approvalStatus != PENDING` không xuất hiện trong danh sách chờ. | Nghiệp vụ |
| BR-029-02 | **Phê duyệt** → `approvalStatus=APPROVED`, tạo `approval_logs` (action=APPROVE, approvedBy, approvedAt). | Nghiệp vụ |
| BR-029-03 | **Từ chối bắt buộc lý do** — Phải nhập lý do ≥10 ký tự. `approvalStatus=REJECTED`, tạo `approval_logs` (action=REJECT, reason, approvedBy, approvedAt). | Nghiệp vụ |
| BR-029-04 | **Không duyệt lại** — APPROVED và REJECTED không thể duyệt/từ chối lần nữa qua màn này. Muốn thay đổi phải qua F-027 (Cập nhật → Lưu và phê duyệt). | Nghiệp vụ |
| BR-029-05 | **Phê duyệt đơn định** — Mỗi lần chỉ duyệt/từ chối 1 bản ghi. Không duyệt hàng loạt. | Thiết kế |

### 5.2. Phân quyền

| ID | Quy tắc | Nguồn |
|---|---|---|
| BR-029-06 | `dryport:approve` mới thấy tab Phê duyệt và gọi được API. | RBAC |
| BR-029-07 | Audit log mọi thao tác phê duyệt/từ chối. | Bảo mật |

---

## 6. Mô hình dữ liệu

### `approval_logs`

| Tên trường | Kiểu | Mô tả |
|---|---|---|
| id | UUID | PK |
| entity_id | UUID | FK → dry_ports.id |
| entity_type | NVARCHAR(50) | "DRY_PORT" |
| action | NVARCHAR(20) | APPROVE / REJECT |
| approved_by | UUID | Người thực hiện |
| approved_at | TIMESTAMP | Thời điểm |
| reason | NVARCHAR(500) | Lý do từ chối (NULL nếu APPROVE) |

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/dry-ports?approvalStatus=PENDING` | Danh sách chờ duyệt | `dryport:approve` |
| POST | `/api/v1/dry-ports/{id}/approve` | Phê duyệt | `dryport:approve` |
| POST | `/api/v1/dry-ports/{id}/reject?reason=` | Từ chối (reason ≥10 ký tự) | `dryport:approve` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Danh sách chờ duyệt

Tab "Phê duyệt" trên F-083 hoặc menu riêng. Gọi GET với filter `approvalStatus=PENDING`. Cột: Mã, Tên, Tỉnh/TP, Ngày gửi, Người gửi. Sắp xếp theo ngày gửi tăng dần (cũ nhất lên đầu).

### 8.2. Phê duyệt

Chọn bản ghi → xem chi tiết (có thể mở F-084) → "Phê duyệt" → confirm dialog → POST approve → APPROVED + approval_logs → toast → refresh list.

### 8.3. Từ chối

"Từ chối" → form nhập lý do → validate ≥10 ký tự → POST reject → REJECTED + approval_logs(reason) → toast → refresh list.

---

## 9. Yêu cầu phi chức năng

POST ≤1s; HTTPS; RBAC; audit log ≥2 năm.

---

## 10. Yêu cầu giao diện

Token từ `theme.ts` + `tokens.ts`.

- **Danh sách:** Bảng PENDING, cột Mã/Tên/Tỉnh/Ngày gửi/Người gửi + nút [Phê duyệt] [Từ chối]
- **Phê duyệt:** Confirm dialog "Phê duyệt CC-XXXXXX — [Tên]?" → [Hủy] [Xác nhận]
- **Từ chối:** Form lý do, textarea ≥10 ký tự, `borderRadius: radiusMd` → [Hủy] [Xác nhận]
- **Toast:** `statusOperational` (xanh) / `statusWarning` (vàng)
- Nút: `borderRadius: radiusPill`, `height: 40`

---

## Implementation Status

| Layer | Status |
|-------|--------|
| Backend | Done — approve/reject endpoints đã triển khai |
| Frontend | Pending |
