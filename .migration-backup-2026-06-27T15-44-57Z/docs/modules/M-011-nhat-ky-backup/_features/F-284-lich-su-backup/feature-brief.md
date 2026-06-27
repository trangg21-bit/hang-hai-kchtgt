---
id: F-284
name: "Lịch sử backup"
slug: lich-su-backup
module-id: M-011
status: proposed
classification: local
priority: medium
created: "2026-06-26T00:00:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Lịch sử backup

## Description

Giao diện tra cứu và lọc lịch sử sao lưu cơ sở dữ liệu, cho phép quản trị viên xem danh sách các bản backup đã thực hiện với thông tin chi tiết: tên file, dung lượng, loại backup (tự động/thủ công), trạng thái (thành công/thất bại), thời gian tạo, và mô tả lỗi (nếu có). Dữ liệu được truy xuất từ bảng `database_backups` thông qua `DatabaseBackupRepository.findAllByOrderByCreatedAtDesc()`, hiển thị dưới dạng danh sách phân trang hoặc toàn bộ tùy cấu hình.

## Business Intent

- Cung cấp khả năng kiểm toán và truy vết lịch sử sao lưu hệ thống, giúp quản trị viên xác định các lần backup thành công hoặc thất bại trong quá khứ.
- Hỗ trợ quyết định khôi phục dữ liệu bằng cách hiển thị đầy đủ thông tin về từng bản backup: dung lượng, thời gian, trạng thái, và lý do lỗi.
- Là nguồn dữ liệu cho API khôi phục dữ liệu (F-281), cho phép người dùng chọn chính xác bản backup cần phục hồi.

## Flow Summary

1. **Tra cứu danh sách backup**: Quản trị viên truy cập màn hình "Lịch sử backup" hoặc gọi API `GET /api/backups`.
2. **Hiển thị dữ liệu**: `BackupController.getAllBackups()` gọi `DatabaseBackupRepository.findAllByOrderByCreatedAtDesc()` để lấy toàn bộ bản ghi, sắp xếp theo thời gian tạo giảm dần (mới nhất trước).
3. **Lọc theo trạng thái**: Người dùng có thể lọc danh sách theo `status` (SUCCESS hoặc FAILED) để tập trung vào các lần backup thành công hoặc các lần thất bại cần phân tích.
4. **Xem chi tiết backup**: Mỗi bản ghi hiển thị `filename`, `filePath`, `fileSize`, `backupType` (MANUAL/AUTOMATIC), `status` (SUCCESS/FAILED), `errorDetail` (nếu có), `createdAt`.
5. **Tiếp cận khôi phục**: Đối với bản backup có status `SUCCESS`, người dùng có thể gọi API `POST /api/backups/{id}/restore` (F-281) để khôi phục dữ liệu từ bản backup đó.

## Acceptance Criteria

- **Hiển thị danh sách phân trang**: API `GET /api/backups` trả về danh sách bản backup sắp xếp theo `createdAt` giảm dần, bao gồm tất cả các thông tin: filename, filePath, fileSize, backupType, status, errorDetail, createdAt.
- **Lọc theo trạng thái**: Danh sách backup có thể lọc theo status SUCCESS hoặc FAILED, trả về đúng các bản ghi khớp điều kiện lọc.
- **Hiển thị chi tiết lỗi**: Các bản backup có status FAILED hiển thị trường `errorDetail` chứa mô tả lỗi chi tiết (tối đa 4000 ký tự).
- **Dung lượng chính xác**: Trường `fileSize` trả về giá trị Long chính xác, đại diện cho kích thước file backup trên disk (byte).
- **Kiểm tra file tồn tại**: API không trả về lỗi khi file backup đã bị xóa khỏi disk — thông tin `filePath` vẫn được hiển thị đầy đủ cho mục đích tra cứu.

## In Scope

- Tra cứu danh sách tất cả bản backup (`GET /api/backups`).
- Hiển thị thông tin chi tiết mỗi bản backup: filename, filePath, fileSize, backupType, status, errorDetail, createdAt.
- Sắp xếp kết quả theo `createdAt` giảm dần (mới nhất trước).
- Hỗ trợ lọc theo status (SUCCESS / FAILED).
- Tích hợp với API khôi phục (F-281): mỗi bản backup SUCCESS có thể được chọn để khôi phục.
- Backup type phân biệt MANUAL (do người dùng kích hoạt) và AUTOMATIC (do scheduler kích hoạt).

## Out of Scope

- Tìm kiếm theo tên file hoặc khoảng thời gian (chỉ hỗ trợ lọc theo status).
- Xuất danh sách backup ra file CSV hoặc Excel.
- Thống kê số lượng backup theo ngày/tuần/tháng.
- Biểu đồ xu hướng dung lượng backup theo thời gian.
- Backup versioning (không có phân biệt multiple versions cho cùng một lần backup).
- Sao lưu từ xa — không hỗ trợ hiển thị thông tin backup từ kho lưu trữ offsite.

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Admin | Xem danh sách backup, xem chi tiết backup |
| System Admin | Xem danh sách backup, xem chi tiết backup |
| User | Không có quyền truy cập API lịch sử backup |

## Entities

- **DatabaseBackup**: id (UUID), filename, filePath (varchar 500), fileSize (Long), backupType (MANUAL/AUTOMATIC), status (SUCCESS/FAILED), errorDetail (varchar 4000), createdAt (LocalDateTime)
- **BackupType**: enum { MANUAL, AUTOMATIC }
- **BackupStatus**: enum { SUCCESS, FAILED }

## Business Rules

1. Danh sách backup luôn được trả về sắp xếp theo `createdAt` giảm dần (mới nhất trước) — không có tùy chọn sắp xếp khác.
2. Không có phân trang mặc định — `findAllByOrderByCreatedAtDesc()` trả về toàn bộ bản ghi; cần thận trọng khi số lượng backup lớn.
3. Bản backup có status `FAILED` vẫn được lưu giữ vĩnh viễn trong lịch sử (không bị xóa bởi cơ chế retention).
4. Trường `errorDetail` chỉ được điền khi status là `FAILED`; bản backup `SUCCESS` có thể có `errorDetail = null`.
5. Chỉ người dùng có vai trò `ROLE_ADMIN` hoặc `ROLE_SYSTEM_ADMIN` mới có thể truy cập danh sách backup.

## Testing Strategy

- **Unit test (BackupController)**: GET /api/backups trả về danh sách không rỗng khi có dữ liệu, trả về danh sách rỗng khi không có backup, phân biệt kết quả theo backupType.
- **Integration test**: Kiểm tra sắp xếp đúng thứ tự `createdAt` giảm dần, kiểm tra hiển thị đầy đủ các trường thông tin.
- Tối thiểu 5 test cases bao gồm: hiển thị danh sách đầy đủ, lọc theo status SUCCESS, lọc theo status FAILED, danh sách rỗng, hiển thị errorDetail cho backup FAILED.
