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

Cập nhật Cảng cạn cho phép chỉnh sửa thông tin Cảng cạn đã tồn tại. **Form giống hệt F-026 (Tạo mới)** — 4 tab, 25 trường — với các khác biệt sau:

| Khác biệt | F-026 (Tạo mới) | F-027 (Cập nhật) |
|-----------|----------------|-------------------|
| Dữ liệu ban đầu | Trống / mặc định | **Pre-filled từ DB** qua `GET /api/v1/dry-ports/{id}` |
| Mã CC-XXXXXX | Tự sinh, RO | **Hiển thị từ DB, RO — không bao giờ đổi** |
| Đơn vị quản lý | Chọn tự do | **Khóa cứng, không sửa được** (giống mã CC-XXXXXX) |

Form có 2 nút: **Lưu tạm** và **Lưu và phê duyệt** (nếu có `dryport:approve`). Mọi thay đổi được ghi vào `change_history`.

> **Quy tắc đặc biệt với bản ghi đã APPROVED:** Vẫn cho phép mở form cập nhật. Nút "Lưu tạm" bị ẩn — người dùng **bắt buộc** dùng nút "Lưu và phê duyệt" để phê duyệt lại. Nếu không có `dryport:approve` thì không được sửa bản ghi APPROVED.

> **Gửi phê duyệt** là hành động trên F-083 (Danh sách), không có trên form này.

### 1.2. Tại sao cần?

- Cập nhật dữ liệu Cảng cạn theo thực tế vận hành
- Bổ sung thông tin dần: nháp (F-026) → sửa tiếp (F-027) → gửi duyệt (F-083)
- Mọi thay đổi được ghi lịch sử đầy đủ

### 1.3. Luồng chính

F-083/F-084 → "Chỉnh sửa" → `GET /api/v1/dry-ports/{id}` → form pre-filled → sửa → **Lưu tạm** (giữ trạng thái, ở lại form; không áp dụng cho APPROVED) hoặc **Lưu và phê duyệt** (`approvalStatus=APPROVED`, `change_history`, redirect F-083). Với bản ghi APPROVED: chỉ có **Lưu và phê duyệt**.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Phân quyền theo chức năng

Các thao tác trong tính năng được bảo vệ bởi các quyền (permissions) tương ứng. Người dùng chỉ có thể thực hiện những thao tác mà vai trò của họ được cấp quyền:

| Vai trò | Quyền xem | Quyền thao tác | Phạm vi dữ liệu | Ghi chú |
|---|---|---|---|---|
| system-admin | `dryport:read` | Tất cả thao tác nếu được gán quyền | Toàn bộ hệ thống | |
| admin (Security) | `dryport:read` | Theo permission được gán | Theo đơn vị được phân công | |
| admin-operation | `dryport:read` | Theo permission được gán | Theo đơn vị được phân công | |
| admin | `dryport:read` | Theo permission được gán | Theo đơn vị quản lý | |
| Lãnh đạo | `dryport:read` | Không có quyền thao tác | Theo đơn vị được phân công | Chỉ xem |
| Cán bộ | `dryport:read` | Theo permission được gán | Theo đơn vị công tác | |
| Cá nhân | Không có quyền | Không có quyền | Không | Không truy cập được |

Chi tiết permission:

| Permission | Mô tả |
|---|---|
| `dryport:update` | Thấy nút "Chỉnh sửa", gọi PUT |
| `dryport:approve` | Thấy thêm nút "Lưu và phê duyệt". **Bắt buộc để sửa bản ghi APPROVED** |

> Phân quyền do M-001 quản lý. Các permission trên được gán động cho vai trò thông qua module M-001.

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

Đối với tài khoản **Admin Cục**, áp dụng logic phân quyền đặc biệt sau:

- **Xem full dữ liệu:** Admin Cục có quyền xem và cập nhật toàn bộ dữ liệu Cảng cạn, không giới hạn phạm vi đơn vị hay khu vực.
- **Xem thông tin người tạo:** Admin Cục thấy được `createdBy` (họ tên, tên đăng nhập) của bản ghi Cảng cạn.
- **Xem thời gian tạo:** Admin Cục thấy được `createdAt` (timestamp) của bản ghi.
- **Xem thông tin người chỉnh sửa:** Admin Cục thấy được `updatedBy` (họ tên, tên đăng nhập) của lần cập nhật cuối cùng.
- **Xem thời gian cập nhật:** Admin Cục thấy được `updatedAt` (timestamp) của lần cập nhật cuối cùng.

> Các trường audit này chỉ hiển thị với tài khoản Admin Cục. Với các vai trò khác, các trường này bị ẩn khỏi giao diện.

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

**AC-027-01:** `dryport:update` → "Chỉnh sửa" → `GET /api/v1/dry-ports/{id}` → pre-fill 25 trường giống F-026.
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

### 5.1. Trường bị khóa khi cập nhật

| ID | Quy tắc | Áp dụng cho | Nguồn |
|---|---|---|---|
| BR-027-01 | **Mã CC-XXXXXX bất biến vĩnh viễn** — Được sinh khi tạo mới (F-026), không bao giờ sửa được trong suốt vòng đời. Form cập nhật hiển thị read-only. Backend từ chối nếu payload gửi mã khác với DB. | Form cập nhật | Thiết kế |
| BR-027-01a | **Đơn vị quản lý bất biến** — `orgUnitId` được gán khi tạo mới (F-026), không bao giờ sửa được trong suốt vòng đời, giống `dryPortCode`. Form cập nhật hiển thị disabled. Backend từ chối nếu payload gửi giá trị khác với DB. | Form cập nhật | Nghiệp vụ |

### 5.2. Luồng cập nhật

| ID | Quy tắc | Áp dụng cho | Nguồn |
|---|---|---|---|
| BR-027-02 | **Lưu tạm giữ nguyên trạng thái** — `approvalStatus` không đổi. Tối thiểu: Tên. Không tạo change_history. **Không áp dụng cho bản ghi APPROVED** (xem BR-027-03a). | Form cập nhật | Nghiệp vụ |
| BR-027-03 | **Lưu và phê duyệt** — Cần `dryport:approve`. Đầy đủ 6 trường bắt buộc (như F-026). `approvalStatus=APPROVED`, tạo `change_history` + `approval_logs`. | Form cập nhật | Nghiệp vụ |
| BR-027-03a | **Bản ghi APPROVED — bắt buộc phê duyệt lại:** Khi sửa bản ghi đã APPROVED, nút "Lưu tạm" bị ẩn. Người dùng chỉ có một lựa chọn: **"Lưu và phê duyệt"** để cập nhật và phê duyệt lại. Nếu người dùng không có `dryport:approve` → không thể sửa bản ghi APPROVED (nút "Chỉnh sửa" bị ẩn trên F-083). | Form cập nhật | Nghiệp vụ |
| BR-027-04 | **Ghi nhận lịch sử** — Backend so sánh payload với DB, tạo `change_history` cho từng trường có thay đổi (old_value → new_value). | Backend | Thiết kế |

### 5.3. Kế thừa từ F-026

| ID | Quy tắc | Áp dụng cho | Nguồn |
|---|---|---|---|
| BR-027-05 | Validate dữ liệu như F-026: GPS, diện tích/công suất ≥0, định dạng file. | Form cập nhật | F-026 |
| BR-027-06 | `dryport:update` mới thấy nút sửa. `dryport:approve` mới thấy nút Lưu và phê duyệt. | UI | RBAC |
| BR-027-07 | Phạm vi đơn vị — chỉ sửa trong đơn vị của mình. Admin Cục toàn bộ. | Backend | RBAC |
| BR-027-08 | Audit log mọi thao tác. | Backend | Bảo mật |

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

Từ F-083: NHAP, PENDING, REJECTED → "Chỉnh sửa"; APPROVED → "Chỉnh sửa" (chỉ khi có `dryport:approve`, nếu không nút bị ẩn). Từ F-084: nút "Chỉnh sửa". GET pre-fill toàn bộ 25 trường. `dryPortCode` RO.

### 8.2. Sửa và lưu

Người dùng sửa bất kỳ trường nào (trừ mã và `orgUnitId` — hai trường này luôn bị khóa) → tùy trạng thái hiện tại:

| Trạng thái hiện tại | Nút hiển thị | Hành vi |
|---|---|---|
| NHAP | [Lưu tạm] [Lưu và phê duyệt] | Lưu tạm: giữ NHAP, ở lại form. Lưu & duyệt: → APPROVED, redirect |
| PENDING | [Lưu tạm] [Lưu và phê duyệt] | Lưu tạm: giữ PENDING, ở lại form. Lưu & duyệt: → APPROVED, redirect |
| REJECTED | [Lưu tạm] [Lưu và phê duyệt] | Lưu tạm: giữ REJECTED, ở lại form. Lưu & duyệt: → APPROVED, redirect |
| **APPROVED** | **[Lưu và phê duyệt]** | **Chỉ có nút này. Người dùng phải có `dryport:approve`.** Sau lưu → APPROVED (phê duyệt lại), redirect |

Form, tab, trường giống hệt F-026 Section 10.

### 8.3. Mã không đổi

Dù sửa gì, lưu kiểu gì, mã CC-XXXXXX không bao giờ thay đổi. Backend bảo vệ: nếu payload.dryPortCode ≠ DB.dryPortCode → 400 "Mã cảng cạn không được phép thay đổi".

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** PUT ≤2s; GET pre-fill ≤500ms
- **Bảo mật:** HTTPS; RBAC từng nút hành động; transaction atomic
- **Độ tin cậy:** Transaction atomic (ports + change_history + approval_logs)
- **UX:** Responsive; loading skeleton; toast thành công/lỗi
- **Pháp lý:** Audit log ≥ 2 năm

---

## 10. Yêu cầu giao diện

> Token từ `theme.ts` + `tokens.ts`. KHÔNG hardcode.

### 10.1. Layout tổng thể

- **Header:** "Cập nhật Cảng cạn — CC-XXXXXX" + nút X đóng
- **Body:** 4 tab giống hệt F-026 (Thông tin chung | Công bố | Vị trí | File đính kèm), dữ liệu pre-filled từ DB
- **Khác biệt với F-026:**
  - `dryPortCode`: hiển thị read-only, không focus được
  - `orgUnitId`: hiển thị disabled, không sửa được
  - Tab Thông tin chung active mặc định
- **Footer:** [Hủy] outlined + [Lưu tạm] outlined (trái) + [Lưu và phê duyệt] primary (phải). Với bản ghi APPROVED: ẩn [Lưu tạm]
- Tất cả nút `borderRadius: radiusPill`, `height: 40`

### 10.2. Form chi tiết

> Tham chiếu F-026 Section 10.2–10.5 để biết danh sách đầy đủ 25 trường và cách bố trí từng tab.

### 10.3. Phân quyền hiển thị

| Vai trò | Thấy thành phần nào | Ghi chú |
|---|---|---|
| system-admin | Nút "Chỉnh sửa" + form đầy đủ + cả 2 nút lưu | Có tất cả quyền nếu được gán |
| admin (Security) | Nút "Chỉnh sửa" + form + nút theo permission | |
| admin-operation | Nút "Chỉnh sửa" + form + nút theo permission | |
| admin | Nút "Chỉnh sửa" + form + nút theo permission | |
| Lãnh đạo | Không thấy nút "Chỉnh sửa" | Chỉ có quyền xem |
| Cán bộ | Nút "Chỉnh sửa" nếu có `dryport:update` | |
| Admin Cục | Toàn bộ + không giới hạn đơn vị | Xem thêm audit fields |

### 10.4. Giao diện trên điện thoại

Khi màn hình nhỏ hơn 768px:

- Layout 2 cột chuyển thành 1 cột
- Tab điều hướng thu nhỏ, scroll ngang
- Modal full màn hình
- Nút footer xếp dọc

### 10.5. UX

- `marginBottom: spaceFormField`, `borderRadius: radiusPill`, `height:40` cho mọi input, select, button
- Loading skeleton khi GET pre-fill đang chạy
- Toast `statusOperational` khi lưu thành công, `statusDanger` khi lỗi
- Focus field đầu tiên khi mở form

---

## Implementation Status

| Layer | Status |
|-------|--------|
| Backend | Partial — PUT có, cần `?action=` + change_history |
| Frontend | Pending |
