---
id: F-280
name: "Sao lưu CSDL tự động"
slug: sao-lu-c-sdl-tu-dong
module-id: M-011
status: proposed
classification: local
priority: high
created: "2026-06-16T04:42:24Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Sao lưu CSDL tự động

## Description

Cơ chế sao lưu cơ sở dữ liệu tự động (theo lịch cron hàng tuần) và thủ công (do người dùng kích hoạt) cho cả hai môi trường H2 (file-based) và PostgreSQL (dùng pg_dump). Hệ thống ghi nhận mọi lần sao lưu vào bảng `database_backups`, lưu trữ đường dẫn file backup trên disk, kiểm tra dung lượng và thực hiện dọn dẹp các bản ghi cũ vượt ngưỡng giữ lại (retention).

## Business Intent

- Đảm bảo dữ liệu hệ thống luôn có bản sao dự phòng, giảm thiểu rủi ro mất mát dữ liệu do sự cố phần cứng, lỗi hệ thống hoặc tấn công xâm nhập.
- Tự động hóa quy trình sao lưu để loại bỏ phụ thuộc vào thao tác thủ công, đảm bảo tính nhất quán và tần suất sao lưu theo chính sách.
- Cung cấp khả năng khôi phục dữ liệu nhanh chóng khi cần, với RPO mục tiêu dưới 8 giờ.

## Flow Summary

1. **Sao lưu tự động**: Scheduler (`@Scheduled` cron) kích hoạt mỗi Chủ nhật nửa đêm (mặc định `0 0 0 * * SUN`). Nếu cấu hình cron khác, giá trị được đọc từ biến môi trường `cron.database-backup`.
2. **Sao lưu thủ công**: Quản trị viên gửi yêu cầu qua REST API `POST /api/backups`. Controller kiểm tra quyền `ROLE_ADMIN` hoặc `ROLE_SYSTEM_ADMIN` rồi gọi `BackupService.performBackup(BackupType.MANUAL)`.
3. **Xác định loại DB**: `BackupService` kiểm tra JDBC URL — nếu chứa `h2` dùng cơ chế `SCRIPT TO '...'`; nếu chứa `postgresql` dùng `ProcessBuilder` gọi `pg_dump -F c -b` với biến môi trường `PGPASSWORD`.
4. **Ghi nhận kết quả**: Bản ghi `DatabaseBackup` được tạo với trạng thái `SUCCESS` hoặc `FAILED` cùng thông tin lỗi (nếu có). `errorDetail` lưu tối đa 4000 ký tự.
5. **Dọn dẹp tự động**: Sau khi sao lưu thành công, `cleanupOldBackupFiles()` lọc các bản ghi `SUCCESS` theo `createdAt` giảm dần, xóa các file backup cũ nhất khi số lượng vượt `retentionCount` (mặc định 5), đồng thời xóa bản ghi trong DB.

## Acceptance Criteria

- **Sao lưu H2 thành công**: Khi gọi API `POST /api/backups` với DB H2, file backup được tạo dưới dạng SQL script, bản ghi `DatabaseBackup` có trạng thái `SUCCESS`, dung lượng file được ghi nhận chính xác.
- **Sao lưu PostgreSQL thành công**: Khi gọi API với DB PostgreSQL, lệnh `pg_dump -F c -b` thực thi thành công, file backup ở định dạng custom, bản ghi `DatabaseBackup` có trạng thái `SUCCESS` và `filePath` trỏ đến đường dẫn đúng.
- **Sao lưu tự động theo lịch**: Scheduler kích hoạt sao lưu tự động đúng theo cron expression cấu hình (`0 0 0 * * SUN` mặc định), tạo bản ghi `DatabaseBackup` với `backupType = AUTOMATIC`.
- **Dọn dẹp theo retention**: Khi số lượng bản ghi backup `SUCCESS` vượt quá ngưỡng retention (mặc định 5), hệ thống tự động xóa các file backup và bản ghi DB cũ nhất, giữ lại đúng `retentionCount` bản ghi gần nhất.
- **Xử lý lỗi đúng quy cách**: Khi sao lưu thất bại, bản ghi `DatabaseBackup` có trạng thái `FAILED`, trường `errorDetail` chứa mô tả lỗi chi tiết, file backup không tồn tại hoặc đã được dọn dẹp.

## In Scope

- Sao lưu cơ sở dữ liệu H2 (file-based) và PostgreSQL (client `pg_dump`).
- Sao lưu tự động (scheduled) và thủ công (manual trigger qua API).
- Dọn dẹp file backup cũ theo ngưỡng giữ lại (retention count).
- Ghi nhận nhật ký backup: trạng thái, loại backup, dung lượng, đường dẫn, thời gian, chi tiết lỗi.
- Controller API có `@AuditLog` ghi lại hành động tạo backup và khôi phục.
- Bảo mật: yêu cầu quyền `ROLE_ADMIN` hoặc `ROLE_SYSTEM_ADMIN` để trigger backup.

## Out of Scope

- Sao lưu cơ sở dữ liệu khác (MySQL, Oracle) — chỉ hỗ trợ H2 và PostgreSQL.
- Nén file backup (không dùng `gzip` cho file SQL, `pg_dump --compress` chưa được áp dụng).
- Sao lưu từ xa (remote/offsite backup) — file lưu trữ trên cùng máy chủ.
- Snapshot cơ sở dữ liệu trước khi khôi phục (H2 RUNSCRIPT sẽ ghi đè dữ liệu hiện tại).
- Thông báo qua email hoặc Slack khi sao lưu thất bại.
- Kiểm tra tính toàn vẹn file backup bằng checksum (MD5/SHA256).

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Admin | Trigger backup (manual), xem danh sách backup |
| System Admin | Trigger backup (manual), xem danh sách backup, khôi phục backup |
| User | Không có quyền truy cập API backup |

## Entities

- **DatabaseBackup**: id (UUID), filename, filePath (varchar 500), fileSize (Long), backupType (MANUAL/AUTOMATIC), status (SUCCESS/FAILED), errorDetail (varchar 4000), createdAt (LocalDateTime)
- **BackupType**: enum { MANUAL, AUTOMATIC }
- **BackupStatus**: enum { SUCCESS, FAILED }

## Business Rules

1. Chỉ người dùng có vai trò `ROLE_ADMIN` hoặc `ROLE_SYSTEM_ADMIN` mới được phép kích hoạt sao lưu thủ công.
2. Sao lưu tự động chỉ chạy theo lịch cron đã cấu hình, mặc định mỗi Chủ nhật nửa đêm (`0 0 0 * * SUN`).
3. Hệ thống tự động xóa file backup và bản ghi DB cũ nhất khi số lượng backup `SUCCESS` vượt quá ngưỡng giữ lại (retention count, mặc định 5).
4. File backup được lưu trên cùng máy chủ với đường dẫn lưu trong trường `filePath` của `DatabaseBackup`.
5. Khi sao lưu thất bại, bản ghi `DatabaseBackup` vẫn được tạo với trạng thái `FAILED` và thông tin lỗi trong `errorDetail` để phục vụ phân tích sự cố.

## Testing Strategy

- **Unit test (BackupService)**: Sao lưu H2 thành công, sao lưu PostgreSQL thành công, xử lý lỗi khi pg_dump thất bại, kiểm tra cleanup đúng retention count, kiểm tra scheduledBackup trigger.
- **Integration test (BackupController)**: POST /api/backups với quyền Admin tạo backup thành công, POST với quyền User bị từ chối (403), POST khi DB đang bận.
- **Tối thiểu 10 test cases** được yêu cầu cho infrastructure code quan trọng, bao gồm cả test với database thực (Testcontainers H2/PostgreSQL).
