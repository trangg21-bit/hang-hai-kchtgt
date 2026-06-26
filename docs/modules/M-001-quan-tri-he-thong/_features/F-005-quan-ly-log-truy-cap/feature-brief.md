---
id: F-005
name: Quản lý log truy cập
slug: quan-ly-log-truy-cap
module-id: M-001
status: proposed
classification: local
priority: medium
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý log truy cập

## Description

Tra cứu, quản lý và phân tích 5 nhóm log hệ thống: log truy cập, đăng nhập, lỗi, tài khoản và cấu hình. Tính năng hỗ trợ lọc theo thời gian, người dùng, hành động, kết quả; xuất log ra CSV; xem thống kê aggregate; và tự động xóa log cũ theo retention policy (mặc định 90 ngày).

## Business Intent

Quản trị hệ thống và bảo mật cần khả năng giám sát, tra cứu và phân tích toàn bộ hoạt động hệ thống thông qua log truy cập — phục vụ nghiệp vụ kiểm toán, phát hiện bất thường, xử lý sự cố và tuân thủ các quy định bảo mật về lưu trữ và truy xuất nhật ký hoạt động.

## Flow Summary

Admin hoặc Security Admin truy cập module Quản lý log truy cập từ sidebar → chọn nhóm log cần xem (truy cập, đăng nhập, lỗi, tài khoản, cấu hình) → áp dụng bộ lọc (thời gian, người dùng, hành động, trạng thái) → hệ thống truy vấn log từ bảng AccessLog với chỉ số trên (userId, createdAt) và (action, createdAt) → hiển thị danh sách log phân trang với thông tin chi tiết (user agent, request path, response code, duration) → cho phép xuất log ra CSV (tối đa 10.000 rows/lần) hoặc xem báo cáo thống kê aggregate (tổng truy cập, số người dùng unique, tỷ lệ thành công, thời gian phản hồi trung bình). Quy trình bao gồm: (1) tra cứu log theo thời gian và đối tượng; (2) lọc nâng cao theo hành động và kết quả; (3) xuất CSV cho báo cáo; (4) xem thống kê aggregate hàng ngày/tháng; (5) tự động cleanup log cũ theo retention policy. Cảnh báo tự động khi ≥5 lần đăng nhập thất bại trong 1 giờ.

## Acceptance Criteria

- Tra cứu được đầy đủ 5 nhóm log (truy cập, đăng nhập, lỗi, tài khoản, cấu hình) với thông tin đủ 5 trường chính (userId, action, targetResource, responseCode, createdAt)
- Lọc và tìm kiếm log theo thời gian, người dùng, hành động, kết quả với kết quả phân trang chính xác
- Xuất log ra file CSV đúng định dạng, giới hạn tối đa 10.000 rows/lần, dữ liệu không bị mất mát

## In Scope

- Xem danh sách log truy cập (người dùng, thời gian, IP, hành động, kết quả)
- Lọc log theo thời gian, người dùng, hành động, kết quả
- Tìm kiếm log (theo tên người dùng hoặc IP)
- Xuất log ra file CSV (giới hạn 10.000 rows/lần)
- Xem chi tiết log (user agent, request path, response code, duration)
- Tự động xóa log cũ (dựa trên retention policy, mặc định 90 ngày)
- Báo cáo thống kê log (số lượng truy cập theo ngày/tháng, hành động phổ biến)
- Phân trang danh sách log
- UI: Sidebar cố định, header avatar, table sticky header, toast notification, modal xác nhận

## Out of Scope

- Real-time log monitoring (SIEM tích hợp ở F-012)
- Custom log format (mặc định dùng standard format)
- Log replication đến remote server

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Super Admin | Full access | Xem tất cả log, xuất, xóa |
| Security Admin | View + Export | Xem tất cả log, xuất CSV, không xóa |
| Admin | View (self only) | Chỉ xem log của mình |
| Lanh dao | Aggregated view | Chỉ xem báo cáo thống kê, không xem chi tiết |
| Can bo | Self only | Chỉ xem log của mình |
| Ca nhan | No access | Không xem được log hệ thống |

## Entities

- **AccessLog**: id(BIGINT PK), userId(BIGINT FK→UserAccount NULL), username(VARCHAR 50), action(VARCHAR 30 NOT NULL), targetResource(VARCHAR 100), ipAddress(VARCHAR 45), userAgent(TEXT), requestPath(VARCHAR 500 NULL), responseCode(INT), duration_ms(INT), status(VARCHAR 20 NOT NULL), createdAt(TIMESTAMP)
- **LogRetentionPolicy**: id(BIGINT PK), retentionDays(INT DEFAULT 90), maxExportRows(INT DEFAULT 10000), cleanupSchedule(VARCHAR 50 DEFAULT '0 0 2 * * ?'), isActive(BOOLEAN DEFAULT true), createdAt(TIMESTAMP), updatedAt(TIMESTAMP)
- **LogAggregate**: id(BIGINT PK), date(DATE UNIQUE), totalAccesses(INT DEFAULT 0), uniqueUsers(INT DEFAULT 0), successRate(DECIMAL 5,2), avgDuration(INT), createdAt(TIMESTAMP)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/logs | Danh sách log (phân trang) | Admin, Security |
| GET | /api/v1/logs/{id} | Chi tiết log | Admin, Security |
| GET | /api/v1/logs/export | Xuất log CSV | Admin, Security |
| POST | /api/v1/logs/aggregate | Thống kê log | Security Admin |
| GET | /api/v1/logs/aggregate | Báo cáo thống kê | Security Admin, Lanh dao |
| GET | /api/v1/users | Danh sách người dùng | JWT |
| GET | /api/v1/groups | Danh sách nhóm | JWT |
| GET | /api/v1/roles | Danh sách vai trò | JWT |
| GET | /api/v1/symbols | Danh sách biểu tượng bản đồ | JWT |
| GET | /api/v1/connections | Danh sách kết nối liên thông | Admin |

## Architecture Notes

- **Pattern**: Repository Pattern + CQRS (Command Query Responsibility Segregation)
- **Immutable Logs**: @Insert-only table, không UPDATE/DELETE (trừ retention policy cleanup)
- **Batch Insert**: @Async + BatchPreparedStatementSetter để ghi log nhanh (500-1000 records/batch)
- **Index**: INDEX trên (userId, createdAt), INDEX trên (action, createdAt) để query nhanh
- **Retention Cleanup**: @Scheduled(cleanupSchedule) tự động xóa log theo retentionDays
- **Export**: Streaming CSV writer (không load toàn bộ vào memory)
- **Alert**: SLF4J MDC để track request context, log4j2/Logback async appender

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-024 | Chỉ Admin/Security mới được xem toàn bộ log | Access Control | UC-020 |
| BR-025 | Log không được sửa đổi sau khi ghi (immutable) | Data Integrity | UC-020 |
| BR-026 | Tự động xóa log sau retentionDays ngày | Cleanup | UC-022 |
| BR-027 | Xuất CSV giới hạn 10.000 rows/lần | Export | UC-021 |
| BR-028 | Log failure login phải được cảnh báo (≥5 lần trong 1 giờ) | Alert | UC-020 |

## Testing Strategy

- Unit tests: Retention policy, export format, aggregation computation
- Integration tests: CRUD AccessLog with user associations
- E2E tests: User login → generate log → filter/export → verify
- UI tests: Responsive sidebar, sticky header, pagination, search, export button, toast notifications
