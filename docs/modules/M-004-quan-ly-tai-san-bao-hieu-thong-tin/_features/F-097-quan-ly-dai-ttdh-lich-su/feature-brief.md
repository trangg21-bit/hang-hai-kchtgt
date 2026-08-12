---
id: F-097
name: Quản lý Đài TTDH - Lịch sử
slug: quan-ly-dai-ttdh-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: 2026-07-07T03:32:57Z
last-updated: 2026-08-11
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Đài TTDH - Lịch sử

**Tài liệu:** BA Feature Brief | **Feature:** F-097 | **Mã chức năng:** TCKC-031 | **Ngày:** 2026-08-11

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Hiển thị lịch sử thay đổi của Đài TTDH dạng timeline. Mọi thao tác CREATE, UPDATE, DELETE, APPROVE_L1, APPROVE_L2, REJECT đều được ghi nhận với: ai thực hiện, hành động gì, trường nào thay đổi, giá trị cũ/mới, thời gian.

### 1.2. Luồng

Chọn "Lịch sử" → GET /{id}/history → Timeline sắp xếp giảm dần → HTTP 200. Có filter theo loại hành động và thời gian.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Cơ chế phân quyền

Xem lịch sử dùng chung cơ chế `PermissionMiddleware` — kiểm tra permission `data:read` theo từng tài khoản người dùng.

| Vai trò | Permission | Ghi chú |
|---|---|---|
| ROLE_SYSTEM_ADMIN | *(bypass)* | Xem đầy đủ changedBy |
| ROLE_ADMIN | `data:read` | Xem đầy đủ changedBy |
| ROLE_LEADER | `data:read` | Xem lịch sử |
| ROLE_SPECIALIST | `data:read` | Xem lịch sử |
| ROLE_PORT_OPERATOR | `data:read` | Xem lịch sử |
| ROLE_PUBLIC_USER | `data:read` | Xem lịch sử |
| ROLE_INTEGRATION | `data:read` | Xem qua API |

- Admin Cục (ROLE_ADMIN, ROLE_SYSTEM_ADMIN): xem đầy đủ changedBy.

> Xem F-092 section 2.1 để biết đầy đủ cơ chế PermissionMiddleware và ánh xạ vai trò → permission.

---

## 3. User Stories

- **US-097-01:** Là Cán bộ, tôi muốn xem toàn bộ lịch sử thay đổi của đài.
- **US-097-02:** Là Kiểm toán, tôi muốn xem giá trị cũ/mới của mỗi lần cập nhật.
- **US-097-03:** Là Admin, tôi muốn BE tự động ghi log mọi thao tác.

### Mức Should

- **US-097-04:** Là Kiểm toán, tôi muốn xem lịch sử DELETE khi bản ghi được chuyển từ Lưu tạm sang Lịch sử.

---

## 4. Acceptance Criteria

**AC-097-01 — Danh sách lịch sử:** GET /{id}/history → danh sách sắp xếp theo changedAt DESC.

**AC-097-02 — Đầy đủ action types:** CREATE, UPDATE, DELETE (cho DRAFT→Lịch sử), APPROVE_L1, APPROVE_L2, REJECT.

**AC-097-03 — UPDATE hiển thị diff:** changedField, previousValue, newValue.

**AC-097-04 — APPROVE/REJECT hiển thị nội dung:** approvalContent hoặc rejectionReason.

**AC-097-05 — Filter:** Theo action type, khoảng thời gian.

**AC-097-06 — BE audit log:** Tự động ghi trong mọi service method.

---

## 5. Business Rules

| ID | Rule |
|----|------|
| BR-097-01 | Mọi thao tác CRUD + APPROVE + REJECT đều ghi station_history |
| BR-097-02 | UPDATE ghi changedField/previousValue/newValue |
| BR-097-03 | Lịch sử immutable — không sửa, không xóa |
| BR-097-04 | Sắp xếp changedAt DESC |

---

## 6. Mô hình dữ liệu

Bảng station_history: id, entityId, actionType, changedField, previousValue, newValue, approvalLevel, rejectionReason, approvalContent, changedBy, changedAt, details (JSON).

---

## 7. API

| Method | Endpoint |
|---|---|
| GET | `/api/v1/stations/coastal/{id}/history` |

---

## 8. Chi tiết

Timeline dọc với dot màu: CREATE=`actionPrimary`, UPDATE=`textSecondary`, DELETE=`statusCritical` (ghi nhận DRAFT→Lịch sử), APPROVE=`statusOperational`, REJECT=`statusCritical`.

---

## 9. NFRs

< 500ms, index entityId+changedAt, phân trang nếu > 50 bản ghi.

---

## 10. UI

Drawer/Modal, Ant Design Timeline. Filter bar: select action type + date range. Mỗi mốc: `<badge actionType> bởi <changedBy> — <changedAt>`. UPDATE: bảng nhỏ | Trường | Cũ | Mới |.
