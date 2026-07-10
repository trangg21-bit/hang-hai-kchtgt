---
id: F-281
name: "Phục hồi dữ liệu"
slug: phuc-hoi-du-lieu
module-id: M-011
status: proposed
classification: local
priority: high
created: "2026-06-16T04:42:24Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Phục hồi dữ liệu

## Description

Cơ chế khôi phục cơ sở dữ liệu từ bản sao lưu (backup) đã được tạo trước đó, hỗ trợ cả hai nền tảng H2 (dùng lệnh `RUNSCRIPT FROM '...'`) và PostgreSQL (dùng công cụ `pg_restore`). Hệ thống xác minh sự tồn tại của file backup trước khi thực hiện khôi phục, ghi nhận kết quả vào bản ghi `DatabaseBackup` và yêu cầu quyền quản trị cao để thực thi — đây là thao tác phá hủy dữ liệu hiện tại.

## Business Intent

- Cho phép phục hồi hệ thống sau sự cố (mất dữ liệu, lỗi nghiệp vụ, tấn công) trong thời gian RPO mục tiêu dưới 8 giờ.
- Đảm bảo thao tác khôi phục được thực hiện một cách có kiểm soát, chỉ cho phép người dùng có vai trò quản trị cao nhất thực hiện.
- Cung cấp khả năng lựa chọn chính xác bản backup cần khôi phục dựa trên ngày giờ và loại backup.

## Flow Summary

1. **Chọn backup cần khôi phục**: Quản trị viên truy cập danh sách backup (qua API `GET /api/backups` hoặc màn hình quản trị) và chọn một bản ghi có trạng thái `SUCCESS`.
2. **Gửi yêu cầu khôi phục**: REST API `POST /api/backups/{id}/restore` được gọi với ID của bản backup mục tiêu. Controller kiểm tra quyền `ROLE_ADMIN` hoặc `ROLE_SYSTEM_ADMIN`.
3. **Xác minh backup**: `BackupService.restoreBackup(id)` tìm bản ghi `DatabaseBackup` theo ID, kiểm tra trạng thái phải là `SUCCESS` và file backup phải tồn tại trên disk. Nếu không thỏa mãn, ném `IllegalArgumentException`.
4. **Thực hiện khôi phục**: Dựa trên JDBC URL của datasource, hệ thống chọn đường dẫn khôi phục — H2 dùng `jdbcTemplate.execute("RUNSCRIPT FROM '...'")`; PostgreSQL dùng `ProcessBuilder` gọi `pg_restore -c -v` với biến môi trường `PGPASSWORD`.
5. **Ghi nhận kết quả**: Sau khi khôi phục, hệ thống ghi log kết quả. (Chưa có xác minh sau khôi phục như kiểm tra số lượng bảng/dòng.)

## Acceptance Criteria

- **Khôi phục H2 thành công**: Khi gọi `POST /api/backups/{id}/restore` với bản backup H2, file backup được load qua `RUNSCRIPT FROM` và dữ liệu được khôi phục chính xác về trạng thái tại thời điểm backup.
- **Khôi phục PostgreSQL thành công**: Khi gọi API với bản backup PostgreSQL, lệnh `pg_restore -c -v` thực thi thành công, dữ liệu được khôi phục về trạng thái tại thời điểm backup.
- **Xác minh file tồn tại**: Khi file backup không còn trên disk, hệ thống ném `IllegalArgumentException` với thông báo rõ ràng và không thực hiện thao tác khôi phục.
- **Chỉ khôi phục backup hợp lệ**: Không thể khôi phục từ bản backup có trạng thái `FAILED` — hệ thống trả về lỗi 400 với thông báo bản backup không hợp lệ.
- **Bảo vệ bằng quyền hạn**: Chỉ người dùng có vai trò `ROLE_ADMIN` hoặc `ROLE_SYSTEM_ADMIN` mới có thể kích hoạt khôi phục; người dùng bình thường nhận lỗi 403.

## In Scope

- Khôi phục dữ liệu từ file backup H2 (RUNSCRIPT).
- Khôi phục dữ liệu từ file backup PostgreSQL (pg_restore).
- Xác minh trạng thái backup (`SUCCESS`) và sự tồn tại file trước khi khôi phục.
- API `POST /api/backups/{id}/restore` với xác thực quyền.
- `@AuditLog` ghi lại hành động khôi phục vào access logs.
- Giới hạn chỉ hỗ trợ H2 và PostgreSQL.

## Out of Scope

- Khôi phục điểm thời gian (point-in-time recovery) — chỉ khôi phục theo bản backup cuối cùng.
- Khôi phục từ file backup đã nén (chưa hỗ trợ giải nén trước khi restore).
- Khôi phục từ kho lưu trữ từ xa (remote/offsite) — chỉ hỗ trợ file trên cùng máy chủ.
- Sao lưu cơ sở dữ liệu tạm thời (staging database) trước khi khôi phục để phòng ngừa mất dữ liệu.
- Xác minh tính toàn vẹn file backup (checksum) trước khi khôi phục.
- Xác minh sau khôi phục (kiểm tra số bảng, số dòng dữ liệu).
- Thông báo xác nhận hai bước trước khi khôi phục.

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Admin | Xem danh sách backup, khôi phục backup |
| System Admin | Xem danh sách backup, khôi phục backup |
| User | Không có quyền truy cập API khôi phục |

## Entities

- **DatabaseBackup**: id (UUID), filename, filePath (varchar 500), fileSize (Long), backupType (MANUAL/AUTOMATIC), status (SUCCESS/FAILED), errorDetail (varchar 4000), createdAt (LocalDateTime)
- **BackupStatus**: enum { SUCCESS, FAILED }

## Business Rules

1. Chỉ người dùng có vai trò `ROLE_ADMIN` hoặc `ROLE_SYSTEM_ADMIN` mới được phép khôi phục dữ liệu từ bản backup.
2. Chỉ các bản backup có trạng thái `SUCCESS` mới được phép khôi phục; bản backup `FAILED` bị từ chối ngay lập tức.
3. File backup phải tồn tại trên disk tại đường dẫn `filePath` trước khi khôi phục; nếu không tồn tại, yêu cầu bị từ chối với lỗi 400.
4. Thao tác khôi phục là phá hủy dữ liệu hiện tại — dữ liệu hiện tại sẽ bị ghi đè hoàn toàn bởi dữ liệu trong bản backup.
5. Hành động khôi phục được ghi lại vào access logs qua annotation `@AuditLog(module="BACKUP", action="RESTORE_BACKUP")`.

## Testing Strategy

- **Unit test (BackupService.restoreBackup)**: Khôi phục H2 thành công, khôi phục PostgreSQL thành công, xử lý khi file backup không tồn tại, xử lý khi backup status là `FAILED`, xử lý khi backup ID không tồn tại.
- **Integration test (BackupController)**: POST /backups/{id}/restore với quyền Admin, POST với quyền User bị từ chối (403), POST với ID không hợp lệ (400).
- Tối thiểu 5 test cases cho các kịch bản khôi phục, bao gồm cả test với database thực (Testcontainers).
