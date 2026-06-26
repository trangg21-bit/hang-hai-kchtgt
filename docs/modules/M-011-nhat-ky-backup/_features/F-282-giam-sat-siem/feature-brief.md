---
id: F-282
name: "Giám sát SIEM"
slug: giam-sat-siem
module-id: M-011
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:42:24Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Giám sát SIEM

## Description

Dịch vụ giám sát an ninh thông tin tập hợp và tính toán các chỉ số hiệu suất (metrics) từ nhiều nguồn log nội bộ: nhật ký truy cập hệ thống (`AccessLog`), nhật ký kiểm toán đăng nhập (`LoginAuditLog`), và cơ chế khóa tài khoản bảo mật (`UserLockout`). Dịch vụ tính toán tổng số sự kiện, tốc độ sự kiện mỗi giây (EPS), tỷ lệ lỗi, số lượng cảnh báo an ninh đang hoạt động, và trả về dưới dạng đối tượng `SiemMetricsResponse`.

## Business Intent

- Cung cấp cái nhìn tổng quan theo thời gian thực về tình trạng an ninh hệ thống, giúp quản trị viên phát hiện sớm các hoạt động bất thường như brute force đăng nhập, tỷ lệ lỗi cao, hoặc sự gia tăng đột biến lưu lượng truy cập.
- Hỗ trợ công tác kiểm toán và tuân thủ bảo mật bằng cách tổng hợp dữ liệu từ nhiều nguồn log khác nhau vào một giao diện thống nhất.
- Là nền tảng cho việc xuất báo cáo an ninh (F-283) với dữ liệu đã được xử lý và tính toán sẵn.

## Flow Summary

1. **Thu thập dữ liệu**: `SiemService.getMetrics()` gọi đồng thời 3 repository để lấy dữ liệu từ `AccessLogRepository` (tất cả access logs), `LoginAuditLogRepository` (tất cả login attempts), và `UserLockoutRepository` (các lockout đang hoạt động).
2. **Tính toán tổng số sự kiện**: `totalEventsCount = accessLogsCount + loginAttemptsCount`.
3. **Tính EPS (Events Per Second)**: Tính tổng sự kiện trong 1 phút gần nhất (gọi `countByCreatedAtAfter` cho cả access log và login audit với tham số `now.minusMinutes(1)`), chia cho 60 để có EPS.
4. **Tính tỷ lệ lỗi**: Đếm số access log có `status = FAILED` và login log có `result = FAILURE` trong 1 phút gần nhất, chia cho tổng sự kiện trong cùng khoảng thời gian và nhân 100 để ra phần trăm.
5. **Đếm cảnh báo an ninh**: Gọi `countActiveLockouts(now)` trên `UserLockoutRepository` để lấy số tài khoản đang bị khóa do vi phạm bảo mật, và `countByResultAndAttemptedAtAfter` trên `LoginAuditLogRepository` để lấy số login failure gần đây.
6. **Trả về kết quả**: Đóng gói các chỉ số vào `SiemMetricsResponse` và trả về qua API `GET /api/siem/metrics`.

## Acceptance Criteria

- **Aggregation chính xác**: API `GET /api/siem/metrics` trả về `SiemMetricsResponse` với `totalEventsCount` bằng tổng số access logs và login attempts, `eventsPerSecond` được tính chính xác từ 1 phút gần nhất.
- **Failure rate chính xác**: `failureRate` phản ánh đúng tỷ lệ phần trăm các sự kiện FAILED/FAILURE trên tổng sự kiện trong khoảng 1 phút gần nhất, không chia cho 0 khi không có sự kiện nào.
- **Active alerts đúng**: `activeAlertsCount` bằng số lượng tài khoản đang bị khóa trong `UserLockoutRepository` tại thời điểm gọi API.
- **EPS calculation test**: EPS được kiểm tra với dữ liệu mẫu — ví dụ 10 access log + 5 login attempt trong 1 phút cho EPS = 0.25.

## In Scope

- Tổng hợp và tính toán metrics từ 3 nguồn: access logs, login audit logs, user lockouts.
- Tính toán EPS (Events Per Second) với cửa sổ 1 phút.
- Tính toán failure rate (tỷ lệ lỗi) dựa trên FAILED/FAILURE status.
- Đếm số lượng cảnh báo an ninh đang hoạt động (active lockouts + recent login failures).
- REST API `GET /api/siem/metrics` trả về `SiemMetricsResponse`.
- Controller có `@PreAuthorize` yêu cầu vai trò ADMIN hoặc SYSTEM_ADMIN.

## Out of Scope

- Thu thập sự kiện an ninh từ nguồn bên ngoài (Firewall, Switch, syslog, CEF) — feature brief đề cập "500 EPS" nhưng chưa được triển khai.
- Rule engine cho correlation security events (ví dụ: "5 failed logins từ cùng IP trong 10 phút = alert").
- Cảnh báo real-time push (email, SMS, Slack) khi phát hiện bất thường.
- Lưu trữ metrics lâu dài vào bảng riêng cho trend analysis.
- Dashboard trực quan hóa metrics trên giao diện người dùng (chỉ có API).
- Streaming event ingestion qua Kafka hoặc syslog UDP/TCP.

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Admin | Xem metrics SIEM |
| System Admin | Xem metrics SIEM |
| User | Không có quyền truy cập API SIEM |

## Entities

- **SiemMetricsResponse**: totalEventsCount (Long), eventsPerSecond (Double), failureRate (Double), activeAlertsCount (Integer), accessLogsCount (Long), loginAttemptsCount (Long), securityAlertsCount (Long)
- **AccessLog**: id, username, userId, ipAddress, userAgent, action, module, status (SUCCESS/FAILED), createdAt
- **LoginAuditLog**: id, username, result (SUCCESS/FAILURE), attemptedAt, failedAttempts, ipAddress, userAgent
- **UserLockout**: id, username, lockedAt, unlockAt, reason

## Business Rules

1. EPS được tính dựa trên cửa sổ thời gian 1 phút gần nhất: `EPS = (accessLogsInLast1Min + loginAttemptsInLast1Min) / 60.0`.
2. Failure rate được tính phần trăm: `(failedAccess + failedLogin) / totalEvents * 100`, và không bao giờ trả về NaN hoặc Infinity khi totalEvents = 0.
3. Active alerts được xác định bằng số lượng lockout có `unlockAt` còn trong tương lai (chưa hết hạn) tại thời điểm gọi API.
4. Security alerts được tính bằng số login failures trong 1 phút gần nhất từ `LoginAuditLogRepository.countByResultAndAttemptedAtAfter("FAILURE", now.minusMinutes(1))`.
5. API metrics chỉ yêu cầu quyền đọc — `@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")` ở mức controller class.

## Testing Strategy

- **Unit test (SiemService.getMetrics)**: Kiểm tra tổng hợp metrics từ 3 nguồn, kiểm tra EPS calculation với dữ liệu mẫu (10+5=15 events, EPS=0.25), kiểm tra failure rate calculation và edge case khi totalEvents=0.
- **Export format tests (5 formats)**: WORD (POI XWPFDocument), EXCEL (POI XSSFWorkbook), PDF (iText7), HTML (StringBuilder), XML (với escapeXml). Mỗi format assert non-empty byte array.
- Tổng cộng 6 test cases trong SiemServiceTest + 5 export format tests.
