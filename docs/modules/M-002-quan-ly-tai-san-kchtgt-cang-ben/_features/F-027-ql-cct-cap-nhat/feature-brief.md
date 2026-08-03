---
id: F-027
name: Quản lý Cảng cạn - Cập nhật
slug: ql-cct-cap-nhat
module-id: M-002
status: backend_done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-03
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Cảng cạn - Cập nhật

**Tài liệu:** BA Feature Brief
**Feature:** F-027 — Quản lý Cảng cạn - Cập nhật
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-03

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Cập nhật Cảng cạn cho phép chỉnh sửa thông tin Cảng cạn đã tồn tại. **Form giống hệt F-026 (Tạo mới)** — 4 tab, 25 trường — với 2 khác biệt duy nhất:

| Khác biệt | F-026 (Tạo mới) | F-027 (Cập nhật) |
|-----------|----------------|-------------------|
| Dữ liệu ban đầu | Trống / mặc định | **Pre-filled từ DB** qua `GET /api/v1/dry-ports/{id}` |
| Mã CC-XXXXXX | Tự sinh, RO | **Hiển thị từ DB, RO — không bao giờ đổi** |

Form vẫn có 2 nút như F-026: **Lưu tạm** và **Lưu và phê duyệt** (nếu có `dryport:approve`). Mọi thay đổi được ghi vào `change_history`.

> **Gửi phê duyệt** là hành động trên F-083 (Danh sách), không có trên form này.

### 1.2. Tại sao cần?

- Cập nhật dữ liệu Cảng cạn theo thực tế vận hành
- Bổ sung thông tin dần: nháp (F-026) → sửa tiếp (F-027) → gửi duyệt (F-083)
- Mọi thay đổi được ghi lịch sử đầy đủ

### 1.3. Luồng chính

F-083/F-084 → "Chỉnh sửa" hoặc "Tiếp tục chỉnh sửa" → `GET /api/v1/dry-ports/{id}` → form pre-filled → sửa → **Lưu tạm** (giữ trạng thái, ở lại form) hoặc **Lưu và phê duyệt** (`approvalStatus=APPROVED`, `change_history`, redirect F-083).

---

## 2. Ai dùng? Dùng như thế nào?

| Permission | Mô tả |
|---|---|
| `dryport:update` | Thấy nút "Chỉnh sửa"/"Tiếp tục chỉnh sửa", gọi PUT |
| `dryport:approve` | Thấy thêm nút "Lưu và phê duyệt" |

> Phân quyền do M-001 quản lý. Admin Cục không giới hạn đơn vị.

---

## 3. User Stories

### Must
- **US-027-01:** Mở form cập nhật từ F-083/F-084, dữ liệu pre-filled đầy đủ.
- **US-027-02:** Mã CC-XXXXXX hiển thị read-only — thấy nhưng không sửa được.
- **US-027-03:** "Lưu tạm" giữ nguyên trạng thái, form ở lại để sửa tiếp.
- **US-027-04:** "Lưu và phê duyệt" (`dryport:approve`) duyệt ngay, ghi change_history.

### Should
- **US-027-05:** Toast "Cập nhật thành công", redirect F-083.
- **US-027-06:** Hủy/Esc đóng form, không lưu.

### Could
- **US-027-07:** Link xem lịch sử thay đổi → F-031.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Mở form

**AC-027-01:** `dryport:update` → "Chỉnh sửa"/"Tiếp tục chỉnh sửa" → `GET /api/v1/dry-ports/{id}` → pre-fill 25 trường giống F-026.
**AC-027-02:** `dryPortCode` hiển thị CC-XXXXXX, disabled, không focus được, không sửa được.

### Nhóm 2: Lưu tạm

**AC-027-03:** Sửa → "Lưu tạm" → `PUT /api/v1/dry-ports/{id}?action=draft` → `approvalStatus` giữ nguyên → toast "Đã lưu nháp" → ở lại form. Tối thiểu: Tên.

### Nhóm 3: Lưu và phê duyệt

**AC-027-04:** Có `dryport:approve` → thấy nút "Lưu và phê duyệt". Đầy đủ 6 trường bắt buộc (giống F-026) → `PUT ?action=approve` → `approvalStatus=APPROVED`, `change_history` ghi nhận từng trường thay đổi → toast "Cập nhật thành công" → redirect F-083.
**AC-027-05:** Thiếu trường bắt buộc → lỗi từng trường, không gửi API.

### Nhóm 4: Hủy

**AC-027-06:** Hủy/Esc → đóng form, không lưu, không tạo change_history.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

### 5.1. Mã cảng cạn — KHÔNG ĐỔI

| ID | Quy tắc | Nguồn |
|---|---|---|
| BR-027-01 | **Mã CC-XXXXXX bất biến vĩnh viễn** — Được sinh khi tạo mới (F-026), không bao giờ sửa được trong suốt vòng đời. Form cập nhật hiển thị read-only. Backend từ chối nếu payload gửi mã khác với DB. | Thiết kế |

### 5.2. Luồng cập nhật

| ID | Quy tắc | Nguồn |
|---|---|---|
| BR-027-02 | **Lưu tạm giữ nguyên trạng thái** — `approvalStatus` không đổi. Tối thiểu: Tên. Không tạo change_history. | Nghiệp vụ |
| BR-027-03 | **Lưu và phê duyệt** — Cần `dryport:approve`. Đầy đủ 6 trường bắt buộc (như F-026). `approvalStatus=APPROVED`, tạo `change_history` + `approval_logs`. | Nghiệp vụ |
| BR-027-04 | **Ghi nhận lịch sử** — Backend so sánh payload với DB, tạo `change_history` cho từng trường có thay đổi (old_value → new_value). | Thiết kế |

### 5.3. Kế thừa từ F-026

| ID | Quy tắc |
|---|---|
| BR-027-05 | Validate dữ liệu như F-026: GPS, diện tích/công suất ≥0, định dạng file. |
| BR-027-06 | `dryport:update` mới thấy nút sửa. `dryport:approve` mới thấy nút Lưu và phê duyệt. |
| BR-027-07 | Phạm vi đơn vị — chỉ sửa trong đơn vị của mình. Admin Cục toàn bộ. |
| BR-027-08 | Audit log mọi thao tác. |

---

## 6. Mô hình dữ liệu

> Kế thừa toàn bộ từ F-026 Section 6. Không thêm bảng mới.

`change_history`: entity_id, entity_type="DRY_PORT", action_type=UPDATE, field_name, old_value, new_value, changed_by, changed_at. Mỗi lần Lưu và phê duyệt tạo 1 record cho mỗi trường thay đổi.

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/dry-ports/{id}` | Lấy chi tiết pre-fill form | `dryport:read` |
| PUT | `/api/v1/dry-ports/{id}` | Cập nhật. `?action=draft` hoặc `?action=approve` | `dryport:update` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Mở form

Từ F-083: NHAP → "Tiếp tục chỉnh sửa"; PENDING/APPROVED/REJECTED → "Chỉnh sửa". Từ F-084: nút "Chỉnh sửa". GET pre-fill toàn bộ 25 trường. `dryPortCode` RO.

### 8.2. Sửa và lưu

Người dùng sửa bất kỳ trường nào (trừ mã) → Lưu tạm (giữ trạng thái, ở lại) hoặc Lưu và phê duyệt (APPROVED, history, redirect). Form, tab, trường giống hệt F-026 Section 10.

### 8.3. Mã không đổi

Dù sửa gì, lưu kiểu gì, mã CC-XXXXXX không bao giờ thay đổi. Backend bảo vệ: nếu payload.dryPortCode ≠ DB.dryPortCode → 400 "Mã cảng cạn không được phép thay đổi".

---

## 9. Yêu cầu phi chức năng

PUT ≤2s; HTTPS; RBAC; transaction atomic; audit log ≥2 năm.

---

## 10. Yêu cầu giao diện

> **Form giống hệt F-026 Section 10** — 4 tab, 25 trường, token từ `theme.ts` + `tokens.ts`.
>
> Khác biệt duy nhất: dữ liệu pre-filled, mã RO (không tự sinh), footer [Hủy] [Lưu tạm] [Lưu và phê duyệt].

---

## Implementation Status

| Layer | Status |
|-------|--------|
| Backend | Partial — PUT có, cần `?action=` + change_history |
| Frontend | Pending |
