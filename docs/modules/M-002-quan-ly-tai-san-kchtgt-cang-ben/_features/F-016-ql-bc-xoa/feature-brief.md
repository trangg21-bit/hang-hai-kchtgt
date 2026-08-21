---
id: F-016
name: Quản lý Bến cảng - Xóa
slug: ql-bc-xoa
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-16T04:40:42Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Bến cảng - Xóa

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-016 — Quản lý Bến cảng - Xóa
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng thường (xóa mềm, không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

---

## 1. Mô tả ngắn

Cho phép người dùng có thẩm quyền (`berth:delete`) xóa mềm (soft delete) một Bến cảng: đánh dấu `deletedAt`/`deletedBy`, không xóa bản ghi khỏi DB. Trước khi xóa, hệ thống thực hiện **child guard** — kiểm tra dữ liệu con (Cầu cảng) liên kết; nếu còn con chưa xóa, từ chối xóa với thông báo chi tiết. Người dùng phải xác nhận có chủ đích (nhập chính xác tên bến hoặc "XÓA"). Bến đã xóa không hiển thị trong danh sách hoạt động, có thể **khôi phục trong 90 ngày**. Theo quy trình chung, chỉ xóa được hồ sơ ở trạng thái Lưu tạm.

## 2. Trường dữ liệu

Không có form nhập liệu mới — thao tác trên bản ghi `Berth` hiện có.

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | id | Có | UUID | Khóa chính của bến cần xóa |
| 2 | berthCode, berthName, portId | Có (hiển thị) | Text / UUID | Hiển thị trong dialog xác nhận; người dùng nhập lại tên hoặc "XÓA" |
| 3 | approvalStatus | Có (kiểm tra) | Enum `ApprovalStatus` | Chỉ xóa khi ở trạng thái Lưu tạm (`DRAFT`) — theo file chuẩn |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.4 (xóa mềm, ghi `deletedAt`/`deletedBy`) và mục 3.5 (trạng thái hồ sơ).
- Theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (mục 1): **chỉ xóa được hồ sơ đang ở trạng thái Lưu tạm**; sau khi xóa, hồ sơ chuyển trạng thái "Đã xóa (lịch sử)" — lưu để đối chiếu, không hiển thị trên màn hình.
- Không cho phép xóa khi bến đang trong quá trình phê duyệt hoặc có dữ liệu con chưa xử lý.
- Không có bước phê duyệt cho thao tác xóa; xóa là xóa mềm (không xóa cứng, không cascade delete).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-016-01 | Xóa mềm: gán `deletedAt = now()` + `deletedBy` (operatorId), không xóa bản ghi vật lý | Delete |
| BR-016-02 | Child guard: không xóa nếu còn Cầu cảng (`pier.berthId`) chưa xóa — HTTP 409 kèm số lượng | Delete |
| BR-016-03 | Chỉ xóa được hồ sơ ở trạng thái Lưu tạm (`DRAFT`) — theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` | Delete |
| BR-016-04 | Xác nhận có chủ đích: nhập chính xác tên bến hoặc "XÓA" (không phân biệt hoa/thường, trim) | Delete |
| BR-016-05 | Khôi phục trong 90 ngày kể từ `deletedAt`; quá hạn không khôi phục được | Restore |
| BR-016-06 | Không xóa cứng, không xóa hàng loạt, không cascade delete | Delete |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem bến (danh sách/chi tiết) | `berth:read` |
| Xóa mềm Bến cảng | `berth:delete` |
| Khôi phục bến đã xóa | `berth:delete` (hoặc quyền khôi phục riêng do SA chốt) |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin (Admin Cục) | Xóa, Khôi phục — toàn quyền |
| admin-operation | Xóa, Khôi phục |
| admin | Không có quyền xóa |
| Chuyên viên / Lãnh đạo đơn vị | Không có quyền xóa |
| Lãnh đạo (cấp Cục) | Không xóa — chỉ phê duyệt từ F-017 |
| Cá nhân | Không |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — xem full dữ liệu kể cả bến đã xóa + người xóa, thời gian xóa, người khôi phục, thời gian khôi phục.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng trạng thái chung; chỉ xóa được ở trạng thái Lưu tạm |
| 2 | Có bước phê duyệt không | Không — xóa mềm trực tiếp, không qua phê duyệt |
| 3 | Lọc cha-con / theo đơn vị | Có — theo đơn vị (orgUnitId) + child guard theo Cảng biển/Cầu cảng |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `berth:delete` (kèm `berth:read`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/berths/{id}/children` | Kiểm tra dữ liệu con (pier theo berthId) trước khi xóa | `berth:delete` |
| DELETE | `/api/v1/berths/{id}` | Xóa mềm: set `deletedAt = now()`, ghi nhật ký | `berth:delete` |
| POST | `/api/v1/berths/{id}/restore` | Khôi phục: set `deletedAt = NULL`, `deletedBy = NULL` | `berth:delete` |
| GET | `/api/v1/berths?deleted=true` | Danh sách bến đã xóa (màn hình khôi phục) | `berth:delete` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `berths`:** không thêm/sửa trường ở F-016 — sử dụng cột xóa mềm từ `BaseEntity`: `deleted_at` (TIMESTAMP, nullable) + `deleted_by` (UUID, nullable); `@SQLRestriction("deleted_at IS NULL")` tự loại bản ghi đã xóa khỏi truy vấn mặc định. Không thêm cột trạng thái "đã xóa" riêng — trạng thái "Đã xóa (lịch sử)" theo tài liệu nền mục 3.5.
