---
id: F-016
name: Quản lý Bến cảng - Xóa
slug: ql-bc-xoa
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-16T04:40:42Z
last-updated: 2026-07-30
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Bến cảng - Xóa

**Tài liệu:** BA Feature Brief
**Feature:** F-016 — Quản lý Bến cảng - Xóa
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-07-30

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Xóa Bến cảng là tính năng cho phép người dùng có thẩm quyền (Admin Cục, admin-operation) xóa mềm (soft-delete) một Bến cảng khỏi hệ thống. Trước khi xóa, hệ thống thực hiện **child guard check** — kiểm tra số lượng Cầu cảng (CauCang) và Vùng nước (VungNuoc) liên kết với bến. Nếu tồn tại con cháu chưa bị xóa, hệ thống từ chối xóa và hiển thị thông báo chi tiết. Người dùng phải xác nhận bằng cách nhập chính xác tên bến hoặc gõ "XÓA". Bến cảng bị xóa được đánh dấu `deletedAt`, không hiển thị trong danh sách hoạt động nhưng vẫn được lưu trữ để truy xuất lịch sử, có thể khôi phục trong 90 ngày.

### 1.2. Tại sao cần tính năng này?

Bến cảng chỉ bị xóa khi chấm dứt hoạt động vĩnh viễn, bị phá dỡ hoặc sáp nhập. Cơ chế xóa mềm đảm bảo:

- Dữ liệu lịch sử được bảo toàn phục vụ kiểm toán và báo cáo
- Child guard check ngăn chặn xóa nhầm bến đang có Cầu cảng/Vùng nước hoạt động
- Xác nhận bằng cách nhập tên bến hoặc "XÓA" đảm bảo hành động có chủ đích
- Cho phép khôi phục trong 90 ngày nếu có sai sót

### 1.3. Luồng hoạt động chính

Người dùng (Admin Cục / admin-operation) từ danh sách (F-018) hoặc chi tiết (F-018 detail) nhấn "Xóa". Hệ thống gọi `GET /api/v1/ben-cang/:id/children` để pre-check số lượng CauCang và VungNuoc có `deletedAt = NULL`. Nếu children > 0 → HTTP 409 + toast "Không thể xóa Bến cảng vì còn [n] Cầu cảng và [m] vùng nước liên kết". Nếu không có con → hiển thị confirmation dialog với thông tin bến, yêu cầu nhập chính xác tên bến hoặc "XÓA". Xác nhận đúng → `DELETE /api/v1/ben-cang/:id` → server set `deletedAt = now()` → toast "Đã xóa Bến cảng [maBen]" → về danh sách.

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung. Mỗi vai trò có phạm vi truy cập và thao tác khác nhau, kiểm soát bởi RBAC.

### 2.1. Logic phân quyền chung

| Vai trò | Quyền xem | Quyền thao tác | Phạm vi dữ liệu | Ghi chú |
|---|---|---|---|---|
| system-admin (Admin Cục) | Xem toàn bộ | Xóa, Khôi phục | Toàn bộ hệ thống | Toàn quyền |
| admin-operation | Xem toàn bộ | Xóa, Khôi phục | Toàn bộ hệ thống | Vai trò vận hành chính |
| admin | Xem trong đơn vị | Không | — | Không có quyền xóa |
| Chuyên viên / Lãnh đạo đơn vị | Xem trong đơn vị | Không | — | Không có quyền xóa |
| Lãnh đạo (cấp Cục) | Xem toàn bộ | Không | — | Chỉ phê duyệt từ F-017 |
| Cá nhân | Không có quyền | Không | — | Không áp dụng |

### 2.2. Logic phân quyền đặc biệt cho Admin Cục

- **Xem full dữ liệu** toàn hệ thống, kể cả bến đã xóa
- **Xem người xóa** (họ tên, username)
- **Xem thời gian xóa** (timestamp)
- **Xem người khôi phục** (họ tên, username)
- **Xem thời gian khôi phục** (timestamp)

Các trường này chỉ hiển thị với Admin Cục; các vai trò khác bị ẩn.

---

## 3. User Stories

### Mức Must (bắt buộc có)

- **US-016-01:** Là Admin Cục/admin-operation, tôi muốn thấy nút "Xóa" trên danh sách và trang chi tiết Bến cảng.
- **US-016-02:** Là Admin Cục, tôi muốn hệ thống tự động kiểm tra Cầu cảng/Vùng nước liên kết trước khi cho phép xóa.
- **US-016-03:** Là Admin Cục, tôi muốn thấy thông báo chi tiết số lượng con cháu nếu không thể xóa.
- **US-016-04:** Là Admin Cục, tôi muốn xác nhận xóa bằng cách nhập chính xác tên bến hoặc gõ "XÓA".
- **US-016-05:** Là Admin Cục, tôi muốn bến bị xóa không hiển thị trong danh sách hoạt động nhưng vẫn lưu trữ để truy xuất.

### Mức Should (nên có)

- **US-016-06:** Là Admin Cục, tôi muốn khôi phục Bến cảng đã xóa trong vòng 90 ngày.
- **US-016-07:** Là Admin Cục, tôi muốn xem danh sách Bến cảng đã xóa.

### Mức Could (có thể có sau)

- **US-016-08:** Là Admin Cục, tôi muốn xóa nhiều Bến cảng cùng lúc (bulk delete).

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Child guard check

**AC-016-01 — Kiểm tra con cháu trước xóa:** Khi nhấn "Xóa", hệ thống gọi `GET /api/v1/ben-cang/:id/children`. Nếu CauCang hoặc VungNuoc có `deletedAt = NULL` > 0 → HTTP 409 + toast "Không thể xóa Bến cảng vì còn [n] Cầu cảng và [m] vùng nước liên kết. Vui lòng xóa các dữ liệu liên quan trước." **Xử lý khi lỗi:** API children lỗi → toast "Không thể kiểm tra dữ liệu liên quan. Vui lòng thử lại."

**AC-016-02 — Cho phép xóa khi không có con:** Nếu children count = 0 → hiển thị confirmation dialog.

### Nhóm 2: Confirmation dialog

**AC-016-03 — Hiển thị dialog:** Dialog hiển thị: Mã bến, Tên bến, Cảng mẹ, cảnh báo "Dữ liệu sẽ được ẩn khỏi danh sách hoạt động nhưng vẫn được lưu trong lịch sử. Có thể khôi phục trong 90 ngày.", ô nhập liệu yêu cầu "Nhập tên bến hoặc gõ XÓA để xác nhận".

**AC-016-04 — Xác nhận hợp lệ:** Người dùng nhập đúng tên bến hoặc "XÓA" → nút "Xác nhận xóa" được enable. Nhập sai → nút disable. **Xử lý khi lỗi:** Không phân biệt hoa thường, bỏ khoảng trắng thừa (trim).

**AC-016-05 — Hủy dialog:** Nhấn "Hủy" hoặc click outside → đóng dialog, không thực hiện xóa.

### Nhóm 3: Thực hiện xóa

**AC-016-06 — Xóa mềm thành công:** Xác nhận đúng → `DELETE /api/v1/ben-cang/:id` → server set `deletedAt = now()`, `deletedBy = currentUser` → toast "Đã xóa Bến cảng [maBen]" → redirect về danh sách. Bến không còn hiển thị trong danh sách hoạt động.

**AC-016-07 — Xóa thất bại:** Bến không tồn tại → 404. Bến đã bị xóa → 409 "Bến cảng đã bị xóa trước đó". Lỗi server → toast "Không thể thực hiện thao tác. Vui lòng thử lại."

### Nhóm 4: Phân quyền

**AC-016-08 — Ẩn nút xóa:** Admin, Chuyên viên, Lãnh đạo đơn vị, Lãnh đạo (cấp Cục), Cá nhân → không thấy nút "Xóa".

**AC-016-09 — Từ chối truy cập trực tiếp:** Gọi DELETE không có quyền → HTTP 403.

### Nhóm 5: Khôi phục

**AC-016-10 — Khôi phục trong 90 ngày:** Admin Cục/admin-operation → danh sách bến đã xóa → "Khôi phục" → `POST /api/v1/ben-cang/:id/restore` → set `deletedAt = NULL` → bến hiển thị lại trong danh sách hoạt động.

**AC-016-11 — Quá hạn khôi phục:** Bến bị xóa > 90 ngày → nút "Khôi phục" bị ẩn hoặc disable với tooltip "Đã quá thời hạn khôi phục (90 ngày)".

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-016-01 | **Xóa mềm (soft-delete)** — `deletedAt = now()`, `deletedBy = currentUser`, bản ghi không bị xóa vật lý | Xóa | Thiết kế | Không |
| BR-016-02 | **Child guard** — không cho phép xóa nếu tồn tại CauCang hoặc VungNuoc có `deletedAt = NULL` | Xóa | Nghiệp vụ | Không |
| BR-016-03 | **Xác nhận có chủ đích** — bắt buộc nhập đúng tên bến hoặc gõ "XÓA" (không phân biệt hoa thường, trim) | Xóa | UX | Không |
| BR-016-04 | **Khôi phục trong 90 ngày** — kể từ `deletedAt`, có thể khôi phục; sau 90 ngày, không thể khôi phục | Khôi phục | Nghiệp vụ | Không |
| BR-016-05 | **Chỉ Admin Cục và admin-operation được xóa** — các vai trò khác không có quyền | RBAC | Bảo mật | Không |
| BR-016-06 | **Audit log mọi thao tác** — actor, thời gian, hành động (DELETE/RESTORE), IP | Audit | Bảo mật | Không |

---

## 6. Mô hình dữ liệu

> 🔴 = trường mới. ~~gạch ngang~~ = loại bỏ.

### 6.1. Bảng `ben_cang` — trường xóa mềm

- 🔴 **deleted_at:** TIMESTAMP, nullable — set khi xóa, NULL khi đang hoạt động/đã khôi phục
- 🔴 **deleted_by:** NVARCHAR(100), nullable — người thực hiện xóa

### 6.2. Bảng liên quan — child guard

- **CauCang:** `ben_cang_id` FK → BenCang, `deleted_at` — kiểm tra count khi child guard
- **VungNuoc:** `ben_cang_id` FK → BenCang, `deleted_at` — kiểm tra count khi child guard

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/ben-cang/{id}/children` | Kiểm tra số lượng CauCang, VungNuoc liên kết (có deletedAt = NULL) | `bencang:delete` |
| DELETE | `/api/v1/ben-cang/{id}` | Xóa mềm Bến cảng — set deletedAt = now() | `bencang:delete` |
| POST | `/api/v1/ben-cang/{id}/restore` | Khôi phục Bến cảng đã xóa — set deletedAt = NULL | `bencang:delete` |
| GET | `/api/v1/ben-cang?deleted=true` | Danh sách Bến cảng đã xóa (cho màn hình khôi phục) | `bencang:delete` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Child guard check

```
Người dùng nhấn "Xóa"
→ GET /api/v1/ben-cang/{id}/children
→ Server đếm: SELECT COUNT(*) FROM cau_cang WHERE ben_cang_id = :id AND deleted_at IS NULL
           + SELECT COUNT(*) FROM vung_nuoc WHERE ben_cang_id = :id AND deleted_at IS NULL
→ Nếu total > 0 → HTTP 409 { "cauCangCount": n, "vungNuocCount": m }
→ Toast: "Không thể xóa Bến cảng vì còn [n] Cầu cảng và [m] vùng nước liên kết"
→ Nếu total = 0 → hiển thị confirmation dialog
```

### 8.2. Luồng xóa mềm

```
Confirmation dialog → nhập tên bến hoặc "XÓA"
→ Validate: trim, lowercase, so sánh với tenBen.trim().toLowerCase() hoặc "xóa"
→ Đúng → enable nút "Xác nhận xóa"
→ Nhấn "Xác nhận xóa"
→ DELETE /api/v1/ben-cang/{id}
→ Server: UPDATE ben_cang SET deleted_at = NOW(), deleted_by = :currentUser WHERE id = :id
→ Audit log
→ Response 200 → toast "Đã xóa Bến cảng [maBen]" → redirect danh sách
```

### 8.3. Luồng khôi phục

```
Danh sách bến đã xóa → "Khôi phục"
→ Kiểm tra: deleted_at + 90 ngày > NOW()
→ Đúng → POST /api/v1/ben-cang/{id}/restore
→ Server: UPDATE ben_cang SET deleted_at = NULL, deleted_by = NULL WHERE id = :id
→ Audit log → toast "Đã khôi phục Bến cảng" → refresh
→ Sai (quá 90 ngày) → nút disable + tooltip
```

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** GET children ≤300ms, DELETE ≤500ms, ≥30 concurrent users
- **Mở rộng:** Child guard có thể mở rộng thêm loại con cháu mới
- **Bảo mật:** RBAC `bencang:delete`; không cho phép xóa cứng qua API; HTTPS
- **Độ tin cậy:** Transaction atomicity; audit log; không cascade delete
- **UX:** Confirmation dialog rõ ràng; toast thông báo; loading indicator
- **Pháp lý:** Dữ liệu đã xóa lưu trữ ≥2 năm; audit log ≥2 năm

---

## 10. Yêu cầu giao diện

> Token từ theme.ts và tokens.ts. Không hardcode.

### 10.1. Confirmation dialog

- **Tiêu đề:** "Xóa Bến cảng"
- **Thông tin:** Mã bến, Tên bến, Cảng mẹ
- **Cảnh báo:** "Dữ liệu sẽ được ẩn khỏi danh sách hoạt động nhưng vẫn được lưu trong lịch sử. Có thể khôi phục trong 90 ngày."
- **Ô nhập:** placeholder "Nhập tên bến hoặc gõ XÓA để xác nhận"
- **Nút:** "Hủy" (outlined) + "Xác nhận xóa" (danger, disable đến khi nhập đúng)

### 10.2. Danh sách bến đã xóa (khôi phục)

- Tab "Đã xóa" trong màn hình danh sách
- Cột: Mã bến, Tên bến, Cảng mẹ, Ngày xóa, Người xóa, Thao tác (Khôi phục)
- Bến quá 90 ngày: nút Khôi phục disable + tooltip

### 10.3. Trạng thái UI

- Đang kiểm tra children: spinner
- Có con cháu: toast cảnh báo cam + danh sách chi tiết
- Xóa thành công: toast xanh + redirect
- Xóa thất bại: toast đỏ
- Quá hạn khôi phục: tooltip "Đã quá thời hạn khôi phục (90 ngày)"

---

## Consolidation Note

Merged with UI feature F-095 (ui-ql-bc-xoa) — 2026-07-30
