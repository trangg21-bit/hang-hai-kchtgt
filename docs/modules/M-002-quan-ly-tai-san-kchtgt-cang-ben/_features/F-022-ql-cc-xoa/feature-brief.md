---
id: F-022
name: Xóa Cầu cảng
slug: ql-cc-xoa
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-16
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Xóa Cầu cảng

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-022 — Xóa Cầu cảng
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng thường (xóa mềm, không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

---

## 1. Mô tả ngắn

Cho phép Admin và Lãnh đạo (`pier:delete`) xóa mềm một Cầu cảng: đánh dấu `deletedAt`/`deletedBy`, bản ghi vẫn tồn tại trong CSDL phục vụ kiểm toán nhưng không hiển thị ở bất kỳ đâu (danh sách, chi tiết, dropdown). Trước khi xóa, hệ thống kiểm tra ràng buộc dữ liệu liên quan (tài sản, vận hành, bảo trì, sự cố) — có dữ liệu liên quan thì chặn xóa và hiển thị danh sách cần xử lý; không tự động xóa cascade. Người dùng phải nhập chính xác tên cầu cảng để xác nhận. Theo quy trình chung, chỉ xóa được hồ sơ ở trạng thái Lưu tạm.

## 2. Trường dữ liệu

Không có form nhập liệu mới — thao tác trên bản ghi `Pier` hiện có.

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | id | Có | UUID | Khóa chính của cầu cảng cần xóa |
| 2 | pierCode, pierName, pierType | Có (hiển thị) | Text / Enum | Hiển thị trong dialog xác nhận; nhập lại tên để xác nhận |
| 3 | approvalStatus | Có (kiểm tra) | Enum `ApprovalStatus` | Chỉ xóa khi ở trạng thái Lưu tạm (`DRAFT`) — theo file chuẩn |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.4 (xóa mềm, ghi `deletedAt`/`deletedBy`) và mục 3.5 (trạng thái hồ sơ).
- Theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (mục 1): **chỉ xóa được hồ sơ đang ở trạng thái Lưu tạm**; sau khi xóa, hồ sơ chuyển trạng thái "Đã xóa (lịch sử)" — lưu để đối chiếu, không hiển thị trên màn hình.
- Không xóa khi hồ sơ đã gửi duyệt, đã duyệt hoặc bị từ chối; không xóa khi có dữ liệu liên quan chưa xử lý.
- Không có bước phê duyệt cho thao tác xóa; xóa là xóa mềm (không xóa cứng, không cascade delete).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-022-01 | Chỉ Admin và Lãnh đạo mới thấy nút "Xóa" và thực hiện được DELETE | Delete |
| BR-022-02 | Chỉ xóa được ở trạng thái Lưu tạm và chưa gửi duyệt — đã gửi duyệt/đã duyệt/bị từ chối không xóa | Delete |
| BR-022-03 | Xóa mềm: gán `deletedAt = now()` + `deletedBy` (operatorId), không xóa bản ghi vật lý | Delete |
| BR-022-04 | Kiểm tra dữ liệu liên quan trước khi xóa (tài sản, vận hành, bảo trì, sự cố) — có → chặn xóa, hiển thị danh sách cần xử lý | Delete |
| BR-022-05 | Không tự động xóa cascade dữ liệu liên quan | Delete |
| BR-022-06 | Xác nhận có chủ đích: nhập chính xác tên cầu cảng; ghi nhật ký (actionType = XOA_MEM) | Delete |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem cầu cảng | `pier:read` |
| Xóa mềm Cầu cảng | `pier:delete` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền |
| Admin, Lãnh đạo | Xóa, Xem |
| Quản lý tài sản / Nhân viên vận hành | Xem (không xóa) |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — full quyền + xem metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng trạng thái chung; chỉ xóa được ở trạng thái Lưu tạm |
| 2 | Có bước phê duyệt không | Không — xóa mềm trực tiếp, không qua phê duyệt |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị (orgUnitId — tài liệu nền mục 3.3) |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `pier:delete` (kèm `pier:read`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/pier/{id}/references` | Kiểm tra dữ liệu liên quan (tài sản, vận hành, bảo trì, sự cố) trước khi xóa | `pier:delete` |
| DELETE | `/api/v1/pier/{id}` | Xóa mềm: set `deletedAt = now()`, ghi nhật ký | `pier:delete` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `piers`:** không thêm/sửa trường ở F-022 — sử dụng cột xóa mềm từ `BaseEntity`: `deleted_at` (TIMESTAMP, nullable) + `deleted_by` (UUID, nullable); `@SQLRestriction("deleted_at IS NULL")` tự loại bản ghi đã xóa khỏi truy vấn mặc định. Không thêm cột trạng thái "đã xóa" riêng — trạng thái "Đã xóa (lịch sử)" theo tài liệu nền mục 3.5.
