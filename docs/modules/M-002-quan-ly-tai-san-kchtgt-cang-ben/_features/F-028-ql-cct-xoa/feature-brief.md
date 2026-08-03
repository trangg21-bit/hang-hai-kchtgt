---
id: F-028
name: Quản lý Cảng cạn - Xóa
slug: ql-cct-xoa
module-id: M-002
status: backend_done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-03
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Cảng cạn - Xóa

**Tài liệu:** BA Feature Brief
**Feature:** F-028 — Quản lý Cảng cạn - Xóa
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-03

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Xóa Cảng cạn cho phép người dùng có thẩm quyền loại bỏ một Cảng cạn khỏi danh sách hoạt động thông qua cơ chế **xóa mềm (soft-delete)**. Bản ghi không bị xóa vật lý khỏi database — thay vào đó, trường `deletedAt` được gán timestamp hiện tại. Cảng cạn đã xóa không còn xuất hiện trong danh sách mặc định nhưng vẫn tồn tại để phục vụ truy xuất lịch sử và kiểm toán.

Để ngăn chặn xóa nhầm, hệ thống yêu cầu người dùng **nhập lại chính xác mã cảng cạn (CC-XXXXXX)** trong hộp thoại xác nhận trước khi thực hiện.

### 1.2. Tại sao cần?

- Loại bỏ Cảng cạn không còn tồn tại hoặc đã sáp nhập khỏi giao diện hoạt động
- Soft-delete bảo toàn dữ liệu lịch sử — không mất dữ liệu vĩnh viễn
- Yêu cầu nhập mã xác nhận — chống xóa nhầm do thao tác vô ý
- DryPort không có thực thể con nên không cần kiểm tra ràng buộc (child guard)

### 1.3. Luồng chính

F-083 (Danh sách) hoặc F-084 (Chi tiết) → nút "Xóa" (chỉ hiển thị cho người có `dryport:delete`) → hộp thoại xác nhận: "Bạn có chắc chắn muốn xóa cảng cạn CC-XXXXXX — [Tên]? Hành động này không thể hoàn tác. Vui lòng nhập mã cảng cạn để xác nhận." → nhập đúng mã → "Xác nhận xóa" → `DELETE /api/v1/dry-ports/{id}` → `deletedAt = NOW()` → toast "Đã xóa thành công" → refresh danh sách.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Phân quyền theo chức năng

| Permission | Mô tả |
|---|---|
| `dryport:delete` | Xóa Cảng cạn — bắt buộc để thấy nút "Xóa" và gọi API |

> **Phân quyền do M-001 — Quản trị hệ thống quản lý.** Tài liệu này chỉ khai báo permission cần có.

> **Admin Cục (system-admin):** Khi được gán `dryport:delete`, xóa được toàn bộ Cảng cạn không giới hạn đơn vị. Vai trò khác bị giới hạn trong đơn vị quản lý của mình.

---

## 3. User Stories

### Must
- **US-028-01:** Là người dùng có `dryport:delete`, tôi muốn thấy nút "Xóa" trên dòng Cảng cạn trong F-083 và trên trang F-084.
- **US-028-02:** Là người dùng, tôi muốn hệ thống yêu cầu nhập mã CC-XXXXXX trước khi xóa để tránh xóa nhầm.
- **US-028-03:** Là người dùng, tôi muốn Cảng cạn bị xóa mềm — dữ liệu không mất, chỉ ẩn khỏi danh sách.

### Should
- **US-028-04:** Là người dùng, tôi muốn thấy toast "Đã xóa thành công" và danh sách tự động làm mới sau khi xóa.
- **US-028-05:** Là người dùng, tôi muốn hủy hộp thoại (Esc hoặc nút Hủy) để không thực hiện xóa.

### Could
- **US-028-06:** Là người dùng, tôi muốn xem danh sách Cảng cạn đã xóa (filter deletedAt != null) — chức năng khôi phục trong tương lai.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Hiển thị

**AC-028-01 — Hiển thị nút Xóa:** Người dùng có `dryport:delete` → thấy nút "Xóa" trên F-083 (dropdown hành động mỗi dòng) và F-084 (footer). Không có quyền → không thấy nút.

### Nhóm 2: Xác nhận

**AC-028-02 — Hộp thoại xác nhận:** Bấm "Xóa" → hộp thoại hiển thị: "Bạn có chắc chắn muốn xóa cảng cạn CC-XXXXXX — [Tên cảng cạn]? Hành động này không thể hoàn tác." + ô nhập mã + nút [Hủy] [Xác nhận xóa].

**AC-028-03 — Nhập mã:** Nút "Xác nhận xóa" chỉ enabled khi người dùng nhập đúng chính xác mã CC-XXXXXX (case-insensitive). Nhập sai → nút disabled, không gọi API.

**AC-028-04 — Hủy:** Bấm "Hủy" hoặc Esc → đóng hộp thoại, không thực hiện xóa.

### Nhóm 3: Thực hiện xóa

**AC-028-05 — Xóa mềm:** Nhập đúng mã → "Xác nhận xóa" → `DELETE /api/v1/dry-ports/{id}` → backend set `deletedAt = NOW()` → 200 → toast "Đã xóa thành công" → danh sách F-083 tự động làm mới (bản ghi biến mất).

**AC-028-06 — Không guard:** Cảng cạn không có thực thể con → không kiểm tra ràng buộc trước khi xóa.

**AC-028-07 — Ẩn khỏi danh sách:** Sau khi xóa mềm, bản ghi có `deletedAt != null` → không xuất hiện trong `GET /api/v1/dry-ports` mặc định.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

### 5.1. Cơ chế xóa

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-028-01 | **Xóa mềm (soft-delete)** — Không xóa vật lý bản ghi. Chỉ gán `deletedAt = NOW()`. Dữ liệu vẫn tồn tại trong DB để phục vụ kiểm toán và truy xuất lịch sử. | Xóa | Thiết kế | Không |
| BR-028-02 | **Không guard** — Cảng cạn (DryPort) không có thực thể con phụ thuộc. Không cần kiểm tra ràng buộc khóa ngoại trước khi xóa. Khác với Cảng biển có Bến cảng/Vùng nước. | Xóa | Thiết kế | Không |

### 5.2. Xác nhận xóa

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-028-03 | **Xác nhận bằng mã** — Bắt buộc nhập đúng mã CC-XXXXXX để xác nhận xóa. Ngăn chặn xóa nhầm do click vô ý. Mã so sánh case-insensitive. | Xóa | Nghiệp vụ | Không |
| BR-028-04 | **Không thể hoàn tác qua giao diện** — Sau khi xóa mềm, không có nút "Khôi phục" trên giao diện người dùng. Việc khôi phục (set deletedAt = null) chỉ thực hiện được qua database bởi quản trị viên hệ thống. | Xóa | Nghiệp vụ | Không |

### 5.3. Phân quyền

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-028-05 | **Phân quyền xóa** — Chỉ người dùng được gán `dryport:delete` mới thấy nút "Xóa" và gọi được API. | Xóa | RBAC | Không |
| BR-028-06 | **Phạm vi đơn vị** — Người dùng chỉ xóa được Cảng cạn trong đơn vị quản lý của mình. Admin Cục xóa được toàn bộ. | Xóa | RBAC | Admin Cục |
| BR-028-07 | **Audit log** — Mọi thao tác xóa được ghi nhận: ai xóa, thời gian, IP, mã cảng cạn bị xóa. | Audit | Bảo mật | Không |

---

## 6. Mô hình dữ liệu

> Không thêm bảng mới. Sử dụng cơ chế soft-delete có sẵn trong BaseEntity.

### 6.1. `dry_ports` — trường `deleted_at`

| Tên trường | Kiểu | Mô tả |
|---|---|---|
| deleted_at | TIMESTAMP | NULL = đang hoạt động; NOT NULL = đã xóa mềm, thời điểm xóa |

> Backend tự động filter `WHERE deleted_at IS NULL` trong tất cả truy vấn mặc định. Bản ghi đã xóa chỉ truy xuất được qua query đặc biệt (dành cho Admin Cục).

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| DELETE | `/api/v1/dry-ports/{id}` | Xóa mềm: set `deletedAt = NOW()`. Response 200. | `dryport:delete` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Kích hoạt xóa

Từ F-083: dropdown hành động trên mỗi dòng → "Xóa". Từ F-084: nút "Xóa" trên footer trang chi tiết. Cả hai chỉ hiển thị nếu người dùng có `dryport:delete`.

### 8.2. Hộp thoại xác nhận

Hiển thị tên và mã cảng cạn. Ô nhập mã: placeholder "Nhập mã cảng cạn". Nút "Xác nhận xóa" disabled (màu xám) cho đến khi người dùng nhập đúng mã. Nút "Hủy" luôn enabled.

### 8.3. Thực hiện xóa

Người dùng nhập đúng mã → nút "Xác nhận xóa" enabled (màu đỏ, destructive) → bấm → loading trên nút → `DELETE /api/v1/dry-ports/{id}` → backend set `deletedAt = NOW()`, trả về 200 → toast xanh "Đã xóa thành công" → danh sách F-083 reload (bản ghi biến mất).

### 8.4. Sau khi xóa

Bản ghi không còn xuất hiện trong danh sách mặc định. Lịch sử thay đổi (F-031) vẫn truy xuất được nếu biết ID. Admin Cục có thể xem bản ghi đã xóa qua filter đặc biệt.

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** DELETE ≤ 500ms; không lock bảng
- **Bảo mật:** RBAC `dryport:delete`; xác nhận 2 bước (nhập mã); HTTPS
- **Độ tin cậy:** Soft-delete trong transaction; không ảnh hưởng bảng khác
- **UX:** Destructive button màu đỏ; confirm rõ ràng; loading state
- **Pháp lý:** Dữ liệu không mất — đáp ứng yêu cầu kiểm toán; audit log ≥ 2 năm

---

## 10. Yêu cầu giao diện

> Token từ `theme.ts` + `tokens.ts`.

### 10.1. Nút Xóa
- F-083: trong dropdown hành động mỗi dòng, màu danger, icon `Trash2`
- F-084: footer, nút outlined danger, `borderRadius: radiusPill`, `height: 40`

### 10.2. Hộp thoại xác nhận
- **Tiêu đề:** "Xác nhận xóa"
- **Nội dung:** "Bạn có chắc chắn muốn xóa cảng cạn **[CC-XXXXXX]** — **[Tên]**? Hành động này không thể hoàn tác."
- **Ô nhập:** "Nhập mã cảng cạn để xác nhận", `borderRadius: radiusPill`, `height: 40`
- **Footer:** [Hủy] outlined + [Xác nhận xóa] danger primary, disabled đến khi nhập đúng mã

---

## Implementation Status

| Layer | Status | Notes |
|-------|--------|-------|
| Backend (API) | Done | `DELETE /api/v1/dry-ports/{id}` soft-delete đã triển khai |
| Frontend (UI) | Pending | Spec sẵn sàng, chờ implement |
