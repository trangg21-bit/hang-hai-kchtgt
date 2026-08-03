---
id: F-031
name: Quản lý Cảng cạn - Lịch sử thay đổi
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
**Feature:** F-031 — Lịch sử thay đổi Cảng cạn
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-03

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Tự động ghi nhận mọi thay đổi dữ liệu Cảng cạn vào bảng `change_history` ở tầng backend. Mỗi khi người dùng thực hiện thao tác **Lưu và phê duyệt** (F-026, F-027) hoặc **Xóa** (F-028), hệ thống ghi lại: hành động (CREATE/UPDATE/DELETE), trường bị thay đổi, giá trị cũ → giá trị mới, người thực hiện, thời gian.

> **Lưu ý:** F-031 là **backend-only** — chỉ có bảng `change_history` và API nội bộ phục vụ ghi log. **Không có giao diện người dùng (UI) riêng** cho chức năng này. Việc hiển thị lịch sử thay đổi sẽ được bổ sung trong tương lai nếu có yêu cầu.

### 1.2. Tại sao cần?

- Truy xuất mọi thay đổi của Cảng cạn — minh bạch, giải trình được
- Hỗ trợ kiểm toán: ai sửa, sửa gì, khi nào
- Dữ liệu lịch sử là bất biến, không thể xóa hoặc sửa

### 1.3. Luồng chính

Người dùng thao tác trên F-026/F-027/F-028 → backend xử lý → **tự động** ghi vào `change_history` → không có UI riêng cho người dùng xem.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Phân quyền theo chức năng

Không có quyền riêng cho F-031. Bảng `change_history` được ghi tự động bởi backend khi người dùng thực hiện các thao tác trong F-026, F-027, F-028. Không có API công khai cho end-user.

| Vai trò | Tương tác với change_history | Ghi chú |
|---|---|---|
| Tất cả vai trò | Không tương tác trực tiếp | Backend tự động ghi log |
| Admin Cục | Có thể truy vấn qua DB (nội bộ) | Phục vụ kiểm toán nếu cần |

> Phân quyền do M-001 quản lý.

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

Đối với tài khoản **Admin Cục**:

- **Truy vấn dữ liệu kiểm toán:** Admin Cục có thể truy xuất dữ liệu từ bảng `change_history` qua các công cụ quản trị nội bộ (không qua UI công khai).
- **Dữ liệu không giới hạn:** Admin Cục xem được toàn bộ lịch sử thay đổi trên mọi đơn vị, không giới hạn phạm vi.

> Hiện tại chưa có UI cho chức năng này kể cả với Admin Cục.

---

## 3. User Stories

### Must
- **US-031-01:** Là hệ thống, tôi tự động ghi lại mọi thay đổi dữ liệu Cảng cạn khi người dùng Lưu và phê duyệt hoặc Xóa.
- **US-031-02:** Là hệ thống, tôi ghi nhận đầy đủ: hành động, trường thay đổi, giá trị cũ, giá trị mới, người thực hiện, thời gian.

### Should
- **US-031-03:** Là hệ thống, tôi đảm bảo dữ liệu lịch sử là bất biến — không ai có thể sửa hoặc xóa.

### Could
- Không áp dụng (backend-only, không có nhu cầu người dùng cuối trong scope hiện tại).

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Ghi nhận tự động

**AC-031-01:** Khi người dùng "Lưu và phê duyệt" trong F-026 (Tạo mới) → backend tạo 1 bản ghi CREATE trong `change_history` cho mỗi trường được điền.
**AC-031-02:** Khi người dùng "Lưu và phê duyệt" trong F-027 (Cập nhật) → backend so sánh payload với DB, tạo 1 bản ghi UPDATE trong `change_history` cho mỗi trường có thay đổi (old_value → new_value).
**AC-031-03:** Khi người dùng "Xóa" trong F-028 → backend ghi 1 bản ghi DELETE vào `change_history` với `deletedBy` và `deletedAt`.

### Nhóm 2: Toàn vẹn dữ liệu

**AC-031-04:** Ghi `change_history` và thao tác chính (tạo/cập nhật/xóa) trong cùng một transaction — nếu lỗi thì rollback toàn bộ.
**AC-031-05:** Dữ liệu trong `change_history` là read-only — không có API nào cho phép sửa hoặc xóa.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn |
|---|---|---|---|
| BR-031-01 | **Lịch sử thay đổi là bất biến** — không thể xóa hoặc sửa bản ghi trong `change_history`. | Backend | Thiết kế |
| BR-031-02 | **Bản ghi CREATE** được tạo khi Cảng cạn được tạo mới và Lưu và phê duyệt (F-026). Mỗi trường được điền tạo 1 dòng CREATE. | F-026 | Nghiệp vụ |
| BR-031-03 | **Bản ghi UPDATE** được tạo mỗi lần Lưu và phê duyệt trong F-027. Chỉ ghi những trường thực sự thay đổi (old_value ≠ new_value). | F-027 | Nghiệp vụ |
| BR-031-04 | **Bản ghi DELETE** được tạo khi xóa Cảng cạn trong F-028. Ghi nhận `deletedBy` và `deletedAt`. | F-028 | Nghiệp vụ |
| BR-031-05 | **Transaction atomic** — thao tác chính và ghi `change_history` trong cùng transaction. Nếu ghi history thất bại → rollback thao tác chính. | Backend | Kỹ thuật |
| BR-031-06 | **Không có UI** — F-031 là backend-only. Không có trang, popup, hay API công khai cho người dùng cuối xem lịch sử. | Toàn bộ | Thiết kế |

---

## 6. Mô hình dữ liệu

### 6.1. `change_history`

| Tên trường | Kiểu | Mô tả |
|---|---|---|
| id | UUID | PK |
| entity_id | UUID | FK → dry_ports.id |
| entity_type | NVARCHAR(50) | "DRY_PORT" |
| action_type | NVARCHAR(20) | CREATE / UPDATE / DELETE |
| field_name | NVARCHAR(100) | Tên trường thay đổi |
| old_value | NVARCHAR(1000) | Giá trị cũ (null nếu CREATE) |
| new_value | NVARCHAR(1000) | Giá trị mới (null nếu DELETE) |
| changed_by | UUID | Người thực hiện |
| changed_at | TIMESTAMP | Thời điểm |

---

## 7. API Endpoints

> Không có API công khai cho end-user. Backend nội bộ ghi trực tiếp vào `change_history` trong cùng transaction với thao tác chính.

| Method | Endpoint | Mô tả | Ghi chú |
|---|---|---|---|
| — | — | Không có API công khai | Ghi tự động trong F-026, F-027, F-028 |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Ghi CREATE (từ F-026)

Khi người dùng bấm "Lưu và phê duyệt" trên form Tạo mới (F-026), backend:
1. INSERT vào `dry_ports`
2. Với mỗi trường được người dùng điền (khác null/empty):
   - INSERT vào `change_history`: `action_type=CREATE`, `field_name=<tên trường>`, `old_value=null`, `new_value=<giá trị>`, `changed_by=<currentUser>`, `changed_at=NOW()`

### 8.2. Ghi UPDATE (từ F-027)

Khi người dùng bấm "Lưu và phê duyệt" trên form Cập nhật (F-027), backend:
1. SELECT bản ghi hiện tại từ DB
2. So sánh từng trường trong payload với DB
3. Với mỗi trường có thay đổi:
   - INSERT vào `change_history`: `action_type=UPDATE`, `field_name=<tên trường>`, `old_value=<giá trị cũ>`, `new_value=<giá trị mới>`, `changed_by=<currentUser>`, `changed_at=NOW()`
4. UPDATE `dry_ports`

### 8.3. Ghi DELETE (từ F-028)

Khi người dùng xác nhận Xóa (F-028), backend:
1. INSERT vào `change_history`: `action_type=DELETE`, `field_name=null`, `old_value=null`, `new_value=null`, `changed_by=<currentUser>`, `changed_at=NOW()`
2. Cập nhật `dry_ports`: `approval_status=Lịch sử`, `deleted_by=<currentUser>`, `deleted_at=NOW()`

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** Ghi `change_history` không được làm chậm thao tác chính quá 100ms
- **Độ tin cậy:** Transaction atomic — nếu ghi history thất bại, toàn bộ thao tác rollback
- **Bảo mật:** Dữ liệu `change_history` là read-only, không có API sửa/xóa
- **Lưu trữ:** Dữ liệu lịch sử được giữ vĩnh viễn, không tự động xóa

---

## 10. Yêu cầu giao diện

> **Không áp dụng** — F-031 là backend-only, không có giao diện người dùng.

---

## Implementation Status

| Layer | Status | Notes |
|-------|--------|-------|
| Backend | Done | Bảng `change_history` + ghi tự động trong F-026/F-027/F-028 |
| Frontend | Không áp dụng | Backend-only, không có UI |
