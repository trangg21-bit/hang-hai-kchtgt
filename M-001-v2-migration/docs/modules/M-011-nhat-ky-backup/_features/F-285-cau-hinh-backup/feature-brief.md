---
id: F-285
name: "Cấu hình backup"
slug: cau-hinh-backup
module-id: M-011
status: proposed
classification: local
priority: medium
created: "2026-06-26T00:00:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Cấu hình backup

## Description

Hệ thống cấu hình các tham số điều khiển hành vi sao lưu cơ sở dữ liệu, bao gồm: lịch trình tự động (cron expression), số lượng bản backup giữ lại (retention count), loại cơ sở dữ liệu mục tiêu (H2 hoặc PostgreSQL), và đường dẫn lưu trữ file backup. Các giá trị cấu hình được đọc từ biến môi trường hoặc file cấu hình Spring Boot (`application.yml`/`application.properties`), cho phép điều chỉnh mà không cần thay đổi mã nguồn.

## Business Intent

- Cho phép quản trị viên tùy chỉnh chính sách sao lưu phù hợp với yêu cầu nghiệp vụ và dung lượng lưu trữ của từng môi trường (development, staging, production).
- Đảm bảo tính linh hoạt khi di chuyển hệ thống giữa các môi trường có cấu hình khác nhau — ví dụ: staging có thể dùng H2 với retention thấp, production dùng PostgreSQL với retention cao hơn.
- Centralize tất cả tham số sao lưu vào một vị trí cấu hình duy nhất, dễ dàng quản lý và thay đổi.

## Flow Summary

1. **Đọc cấu hình**: `BackupService` đọc các tham số cấu hình từ Spring Boot environment:
   - Cron expression cho scheduled backup: biến môi trường `cron.database-backup` (mặc định `0 0 0 * * SUN`).
   - Retention count: biến môi trường hoặc thuộc tính cấu hình `backup.retention-count` (mặc định 5).
   - Database type: tự động xác định từ JDBC URL của datasource.
   - Backup path: đường dẫn lưu trữ file backup, xác định dựa trên loại database (H2: file `.sql`, PostgreSQL: file `.dump` từ pg_dump).
2. **Áp dụng khi sao lưu**: Khi scheduler trigger hoặc người dùng kích hoạt backup thủ công, `BackupService` sử dụng các tham số cấu hình để xác định loại backup, đường dẫn lưu trữ, và số lượng backup giữ lại sau khi hoàn tất.
3. **Cập nhật cấu hình**: Thay đổi các biến môi trường hoặc file cấu hình Spring Boot yêu cầu restart ứng dụng để áp dụng (không có hot-reload cấu hình runtime).

## Acceptance Criteria

- **Cron mặc định đúng**: Khi không cấu hình `cron.database-backup`, scheduled backup chạy mỗi Chủ nhật nửa đêm với cron `0 0 0 * * SUN`.
- **Retention default**: Khi không cấu hình retention count, hệ thống giữ lại 5 bản backup SUCCESS mới nhất và xóa các bản cũ hơn.
- **Tự động xác định database type**: BackupService tự động xác định loại database từ JDBC URL — nếu chứa `h2` dùng backup H2, nếu chứa `postgresql` dùng backup PostgreSQL.
- **Backup path khác biệt theo DB**: H2 lưu file SQL (định dạng script), PostgreSQL lưu file dump (định dạng custom từ pg_dump -F c).
- **Cấu hình qua biến môi trường**: Thay đổi biến môi trường `cron.database-backup` và `backup.retention-count` (hoặc thuộc tính tương ứng) cho phép điều chỉnh lịch backup và số lượng giữ lại mà không cần thay đổi mã nguồn.

## In Scope

- Đọc cron expression cho scheduled backup từ biến môi trường `cron.database-backup` (default `0 0 0 * * SUN`).
- Đọc retention count cho số lượng backup giữ lại (default 5).
- Tự động xác định loại database từ JDBC URL (H2 hoặc PostgreSQL).
- Hỗ trợ cấu hình backup path khác nhau cho từng loại database.
- Cấu hình qua biến môi trường và Spring Boot configuration properties.

## Out of Scope

- Cấu hình runtime hot-reload (không thay đổi cấu hình được mà không restart).
- Cấu hình backup compression (không hỗ trợ `gzip` hoặc `pg_dump --compress`).
- Cấu hình backup từ xa (không hỗ trợ remote/offsite backup target).
- Cấu hình backup incremental (chỉ hỗ trợ full backup).
- Backup scheduling với multiple cron expressions (chỉ hỗ trợ một lịch duy nhất).
- GUI cấu hình backup trong màn hình quản trị (chỉ qua biến môi trường / config file).
- Backup encryption configuration (không có tính năng mã hóa file backup).

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Admin | Đọc và thay đổi cấu hình backup qua biến môi trường / config file |
| System Admin | Đọc và thay đổi cấu hình backup qua biến môi trường / config file |
| User | Không có quyền truy cập hoặc thay đổi cấu hình backup |

## Entities

- **BackupConfig**: cronExpression (String, default `0 0 0 * * SUN`), retentionCount (Integer, default 5), backupType (H2/PostgreSQL — auto-detected from JDBC URL), backupPath (String — determined by database type)
- **DatabaseType**: enum { H2, POSTGRESQL } (auto-detected, not stored in DB)

## Business Rules

1. Cron expression cho scheduled backup mặc định là `0 0 0 * * SUN` (mỗi Chủ nhật nửa đêm) khi biến môi trường `cron.database-backup` không được cấu hình.
2. Retention count mặc định là 5 — hệ thống tự động xóa các bản backup SUCCESS cũ nhất khi số lượng vượt quá ngưỡng này.
3. Loại database được tự động xác định từ JDBC URL của Spring DataSource — không cần cấu hình thủ công.
4. H2 backup sử dụng JDBC `SCRIPT TO '...'` lưu file SQL; PostgreSQL backup sử dụng `pg_dump -F c -b` lưu file custom format.
5. Tất cả thay đổi cấu hình yêu cầu restart ứng dụng để áp dụng — không có hot-reload.
6. Chỉ người dùng có vai trò `ROLE_ADMIN` hoặc `ROLE_SYSTEM_ADMIN` mới có quyền thay đổi cấu hình backup.

## Testing Strategy

- **Unit test (BackupService configuration)**: Kiểm tra default cron expression khi không có cấu hình, kiểm tra default retention count, kiểm tra tự động xác định database type từ JDBC URL cho H2 và PostgreSQL.
- **Integration test**: Kiểm tra scheduled backup chạy đúng theo cron expression cấu hình, kiểm tra cleanup đúng retention count khi thay đổi tham số.
- Tối thiểu 5 test cases bao gồm: default cron, default retention, auto-detect H2, auto-detect PostgreSQL, custom cron expression.
