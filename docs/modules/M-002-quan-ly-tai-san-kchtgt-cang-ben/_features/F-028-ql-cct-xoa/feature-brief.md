---
id: F-028
name: Quản lý Cảng cạn - Xóa
slug: ql-cct-xoa
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Cảng cạn - Xóa

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-028 — Quản lý Cảng cạn - Xóa
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng thường (xóa mềm, không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

---

## 1. Mô tả ngắn

Cho phép người dùng có thẩm quyền (`dryport:delete`) xóa một Cảng cạn đang ở trạng thái **Lưu tạm** trên màn hình danh sách. Theo tài liệu nền (mục 3.4/3.5) và quy trình chung, xóa là **xóa mềm**: bản ghi chuyển trạng thái "Đã xóa (lịch sử)" — vẫn được lưu để đối chiếu, chỉ xem lại được (chế độ chỉ xem), không ai thao tác gì thêm. Các trạng thái khác (chờ duyệt, đã duyệt, từ chối) **không được phép xóa**. Mọi thao tác xóa ghi nhận người xóa, thời gian xóa (phục vụ kiểm toán).

## 2. Trường dữ liệu

Không có form nhập liệu mới — thao tác trên bản ghi `DryPort` hiện có.

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | id | Có | UUID | Khóa chính của cảng cạn cần xóa |
| 2 | dryPortCode, dryPortName | Có (hiển thị) | Text | Hiển thị trong hộp thoại xác nhận |
| 3 | approvalStatus | Có (kiểm tra) | Enum `ApprovalStatus` | Chỉ xóa khi ở trạng thái Lưu tạm (`DRAFT`) — theo file chuẩn |
| 4 | deletedBy, deletedAt | Có (hệ thống) | UUID / TIMESTAMP | Ghi nhận người xóa, thời gian xóa |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.4 (xóa mềm, ghi `deletedAt`/`deletedBy`) và mục 3.5 (trạng thái hồ sơ).
- Theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (mục 1): **chỉ xóa được hồ sơ đang ở trạng thái Lưu tạm**; sau khi xóa, hồ sơ chuyển trạng thái "Đã xóa (lịch sử)" — lưu để đối chiếu, không hiển thị trên màn hình chính.
- Bản ghi ở trạng thái "Đã xóa (lịch sử)": chỉ xem (read-only), không có nút Chỉnh sửa / Xóa / Phê duyệt / Gửi phê duyệt.
- Không có bước phê duyệt cho thao tác xóa; xóa là xóa mềm (không xóa cứng).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-028-01 | Chỉ xóa được bản ghi đang ở trạng thái Lưu tạm — các trạng thái khác (chờ duyệt, đã duyệt, từ chối, lịch sử) không xóa | Delete |
| BR-028-02 | Xác nhận trước khi xóa (hộp thoại xác nhận, cảnh báo không thể hoàn tác) | Delete |
| BR-028-03 | Sau xóa: trạng thái "Đã xóa (lịch sử)" — bản ghi không bị xóa vật lý, chỉ để tra cứu | Delete |
| BR-028-04 | Bản ghi ở trạng thái lịch sử là chỉ xem — mọi nút hành động bị ẩn | View |
| BR-028-05 | Chỉ người có `dryport:delete` mới thấy nút Xóa và thực hiện được | RBAC |
| BR-028-06 | Ghi nhận thao tác: ai xóa, xóa lúc nào, mã cảng cạn bị xóa | Audit |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem cảng cạn (kể cả bản ghi lịch sử) | `dryport:read` |
| Xóa (chuyển trạng thái lịch sử) | `dryport:delete` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền (xóa mọi đơn vị) |
| admin / admin-operation / Cán bộ | Xóa theo `dryport:delete` được gán |
| Lãnh đạo | Xem (không xóa) |
| Cá nhân | Không truy cập |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — xóa bản ghi nháp mọi đơn vị + xem metadata người tạo, người xóa, thời gian xóa.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng trạng thái chung; chỉ xóa được ở trạng thái Lưu tạm |
| 2 | Có bước phê duyệt không | Không — xóa mềm trực tiếp, không qua phê duyệt |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị (orgUnitId — tài liệu nền mục 3.3) |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `dryport:delete` (kèm `dryport:read`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| PUT | `/api/v1/dry-ports/{id}/archive` | Chuyển trạng thái thành "Đã xóa (lịch sử)" — chỉ áp dụng bản ghi Lưu tạm | `dryport:delete` |
| GET | `/api/v1/dry-ports/{id}` | Xem chi tiết Cảng cạn, kể cả bản ghi ở trạng thái lịch sử (chế độ chỉ xem) | `dryport:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `dry_ports`:** không thêm bảng mới; sử dụng cột xóa mềm từ `BaseEntity` — `deleted_at` (TIMESTAMP, nullable) + `deleted_by` (UUID, nullable) — và trạng thái "Đã xóa (lịch sử)" theo tài liệu nền mục 3.5; `@SQLRestriction("deleted_at IS NULL")` loại bản ghi đã xóa khỏi truy vấn mặc định. Ghi nhận thao tác xóa vào `change_history` (actionType = DELETE).
