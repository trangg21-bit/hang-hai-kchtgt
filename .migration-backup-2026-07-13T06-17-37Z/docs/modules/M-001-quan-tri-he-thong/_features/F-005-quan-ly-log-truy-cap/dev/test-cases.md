---
feature-id: F-005
stage: qa
agent: engineering-qa-engineer
verdict: Pass
last-updated: "2026-06-28T21:00:00Z"
---

# Feature F-005: Quản lý log truy cập — Test Cases

## Overview

Test cases mapped to 20 BA test scenarios (TS-005-01 through TS-005-20) plus security and NFR test cases.

---

## Group 1: Log Query & Filtering

### TC-005-01: Truy vấn 5 nhóm log với filter date range
- **TC ID**: TC-005-01
- **Source**: TS-005-01
- **Priority**: Critical
- **Preconditions**: Có ≥5 log entries trong database với các type khác nhau
- **Steps**:
  1. GET `/api/access-logs?from=2026-06-01T00:00:00&to=2026-06-28T23:59:59` với JWT admin
  2. Verify response code = 200
  3. Verify all returned logs have `createdAt` within range
  4. Verify pagination fields present
- **Expected**:
  - 200 OK với danh sách log trong khoảng thời gian
  - Phân trang chính xác (số record, điều hướng)
  - Mỗi log entry có đúng 5 trường chính: userId, action, type, severity, createdAt
- **Test Type**: E2E

### TC-005-02: Lọc theo user + type + severity đồng thời
- **TC ID**: TC-005-02
- **Source**: TS-005-02
- **Priority**: Major
- **Preconditions**: Có logs của nhiều user với các type/severity khác nhau
- **Steps**:
  1. GET `/api/access-logs?userId=1&type=login&severity=warning`
  2. Verify response code = 200
- **Expected**:
  - Kết quả đúng theo cả 3 filter đồng thời
  - Tất cả entries có `type=login` và `severity=warning`
  - Tất cả entries có `userId=1`
- **Test Type**: E2E

### TC-005-03: Tìm kiếm keyword trong message
- **TC ID**: TC-005-03
- **Source**: TS-005-03
- **Priority**: Major
- **Preconditions**: Có log với detail chứa từ "error" và "success"
- **Steps**:
  1. GET `/api/access-logs?keyword=ERROR`
  2. Verify response code = 200
- **Expected**:
  - Kết quả chứa keyword (không phân biệt hoa/thường)
  - Keyword "ERROR" tìm thấy trong cả "error" và "ERROR"
- **Test Type**: E2E

### TC-005-04: Xem chi tiết log entry
- **TC ID**: TC-005-04
- **Source**: TS-005-04
- **Priority**: Major
- **Preconditions**: Có log entry trong database
- **Steps**:
  1. GET `/api/access-logs/{id}` với id hợp lệ
  2. Verify response code = 200
  3. Check response fields
- **Expected**:
  - Hiển thị đầy đủ metadata (JSON view), userAgent, requestPath
  - Các trường mới: type, severity, targetResource, responseCode, durationMs, metadata
  - Nếu metadata null → hiển thị "N/A"
- **Test Type**: E2E

### TC-005-05: Export CSV (system-admin)
- **TC ID**: TC-005-05
- **Source**: TS-005-05
- **Priority**: Critical
- **Preconditions**: User có role system-admin, có ≥100 log entries
- **Steps**:
  1. GET `/api/logs/export/csv` với filter bất kỳ
  2. Download file CSV
  3. Validate CSV format
- **Expected**:
  - File CSV đúng định dạng với header: ID,Username,Action,Type,Severity,TargetResource,...
  - ≤10.000 rows
  - Dữ liệu không mất mát
  - Response có header `X-Max-Export-Rows: 10000`
- **Test Type**: E2E

### TC-005-06: Export CSV (non-admin)
- **TC ID**: TC-005-06
- **Source**: TS-005-06
- **Priority**: Critical
- **Preconditions**: User có role không phải admin
- **Steps**:
  1. Attempt GET `/api/logs/export/csv` với auth token non-admin
- **Expected**:
  - Button ẩn trong UI (nếu có frontend)
  - API → 403 Forbidden
- **Test Type**: Security

### TC-005-07: Attempt UPDATE log entry
- **TC ID**: TC-005-07
- **Source**: TS-005-07
- **Priority**: Critical
- **Preconditions**: Có log entry trong database
- **Steps**:
  1. PUT `/api/access-logs/{id}` với body sửa đổi dữ liệu
- **Expected**:
  - HTTP 403 + message "Log không thể sửa đổi"
  - Dữ liệu trong database không thay đổi
- **Test Type**: Security

### TC-005-08: Attempt DELETE log entry
- **TC ID**: TC-005-08
- **Source**: TS-005-08
- **Priority**: Critical
- **Preconditions**: Có log entry trong database
- **Steps**:
  1. DELETE `/api/access-logs/{id}`
- **Expected**:
  - HTTP 403 + message "Log không thể xóa"
  - Dữ liệu trong database không thay đổi
- **Test Type**: Security

### TC-005-09: Attempt POST tạo log thủ công
- **TC ID**: TC-005-09
- **Source**: TS-005-08
- **Priority**: Critical
- **Preconditions**: None
- **Steps**:
  1. POST `/api/access-logs` với body log entry
- **Expected**:
  - HTTP 403 + message "Log chỉ được tạo tự động bởi hệ thống"
  - Không có log entry mới trong database
- **Test Type**: Security

---

## Group 2: Retention Policy

### TC-005-10: Retention cleanup cron job
- **TC ID**: TC-005-10
- **Source**: TS-005-09
- **Priority**: Critical
- **Preconditions**: Có logs với createdAt > 90 ngày và ≤ 90 ngày
- **Steps**:
  1. Gọi `GET /api/logs/retention` → verify retentionDays = 90
  2. Gọi `LogService.cleanupOldLogs()` (direct call for testing)
  3. Verify log entries > 90 ngày bị xóa
  4. Verify log entries ≤ 90 ngày được giữ
- **Expected**:
  - Log >90 ngày bị xóa
  - Log ≤90 ngày được giữ
  - Scheduler đọc retentionDays từ entity (không hardcoded)
- **Test Type**: Unit

### TC-005-11: Cập nhật retention policy
- **TC ID**: TC-005-11
- **Source**: TS-005-09
- **Priority**: Major
- **Preconditions**: User có role system-admin
- **Steps**:
  1. GET `/api/logs/retention` → verify current policy
  2. PUT `/api/logs/retention` với `retentionDays=60`
  3. GET `/api/logs/retention` → verify updated
  4. Gọi cleanup → verify threshold dùng 60 ngày
- **Expected**:
  - Policy được cập nhật thành công
  - Cleanup sau đó dùng giá trị mới (60 ngày)
  - Non-admin → 403
- **Test Type**: Integration

---

## Group 3: Alerting

### TC-005-12: Alert trigger (≥5 login failures/hour)
- **TC ID**: TC-005-12
- **Source**: TS-005-12
- **Priority**: Critical
- **Preconditions**: Có 0 login failures trong giờ hiện tại
- **Steps**:
  1. Tạo 5 login log entries với type=login, severity=warning, createdAt trong 1 giờ qua
  2. Gọi `GET /api/logs/alerts/failures`
- **Expected**:
  - Response = 5 (≥5 → alert trigger)
  - Log warning: "ALERT: 5 login failures detected in the last 1 hour(s)"
- **Test Type**: Integration

### TC-005-13: Alert không trigger (<5 login failures)
- **TC ID**: TC-005-13
- **Source**: TS-005-12
- **Priority**: Major
- **Preconditions**: Có 4 login failures trong 1 giờ qua
- **Steps**:
  1. Gọi `GET /api/logs/alerts/failures`
- **Expected**:
  - Response = 4 (<5 → no alert trigger)
  - Không có log warning
- **Test Type**: Integration

---

## Group 4: RBAC & Authorization

### TC-005-14: Admin standard chỉ xem log của chính mình
- **TC ID**: TC-005-14
- **Source**: TS-005-17
- **Priority**: Critical
- **Preconditions**: Có logs của nhiều user khác nhau
- **Steps**:
  1. Auth as admin standard (userId=2)
  2. GET `/api/access-logs`
  3. Verify all returned logs có userId=2
- **Expected**:
  - Admin standard chỉ thấy log của mình
  - Không thấy log của user khác
- **Test Type**: Security

### TC-005-15: admin-operation chỉ xem access + login
- **TC ID**: TC-005-15
- **Source**: TS-005-18
- **Priority**: Critical
- **Preconditions**: Có logs của type access, login, error, account, configuration
- **Steps**:
  1. Auth as admin-operation
  2. GET `/api/access-logs`
  3. Verify all returned logs có type IN (access, login)
- **Expected**:
  - Không thấy nhóm error, account, configuration
  - Chỉ thấy access + login
- **Test Type**: Security

### TC-005-16: Lanh dao chỉ xem aggregate
- **TC ID**: TC-005-16
- **Source**: TS-005-19
- **Priority**: Critical
- **Preconditions**: Có aggregate data trong `log_aggregates` table
- **Steps**:
  1. Auth as Lanh dao
  2. GET `/api/logs/aggregate` → verify 200
  3. GET `/api/access-logs` → verify 403
- **Expected**:
  - Có thể xem aggregate statistics
  - Không thể xem chi tiết log entries
- **Test Type**: Security

### TC-005-17: Lanh dao chỉ xem aggregate (endpoint detail)
- **TC ID**: TC-005-17
- **Source**: TS-005-19
- **Priority**: Critical
- **Preconditions**: None
- **Steps**:
  1. Auth as Lanh dao
  2. GET `/api/access-logs/1`
- **Expected**:
  - 403 Forbidden — không thể xem chi tiết log
- **Test Type**: Security

---

## Group 5: NFR & Performance

### TC-005-18: Pagination với 1000+ entries
- **TC ID**: TC-005-18
- **Source**: TS-005-13
- **Priority**: Major
- **Preconditions**: Database có ≥1000 log entries
- **Steps**:
  1. GET `/api/access-logs?page=0&size=20`
  2. Measure response time
  3. Navigate to page 10
- **Expected**:
  - Pagination hoạt động mượt, response < 2s
  - Số record hiển thị chính xác
  - Không lag khi navigate
- **Test Type**: Performance

### TC-005-19: Async write không blocking
- **TC ID**: TC-005-19
- **Source**: TS-005-09
- **Priority**: Major
- **Preconditions**: Interceptor đang active, `AsyncLogAppender` đang chạy
- **Steps**:
  1. Trigger một controller method có `@AuditLog` annotation
  2. Measure time từ khi request bắt đầu đến khi response trả về
  3. Measure thời gian log entry xuất hiện trong database
  4. Verify response time < log appearance time
- **Expected**:
  - Request trả về trước khi log xuất hiện trong DB
  - Interceptor không gọi `repository.save()` trực tiếp
  - Log entry được batch insert bởi `AsyncLogAppender`
- **Test Type**: Performance

### TC-005-20: Log injection prevention
- **TC ID**: TC-005-20
- **Source**: NFR-Sec-02
- **Priority**: Major
- **Preconditions**: None
- **Steps**:
  1. Trigger một request với User-Agent chứa `\n`, `\r`, `\t`
  2. Trigger một request gây exception với `ex.getMessage()` chứa newline
  3. Verify log entry trong database
- **Expected**:
  - Log entry không chứa `\n`, `\r`, `\t` trong detail/userAgent
  - Giá trị bị thay thế bằng space hoặc bị truncate ở 1000 ký tự
- **Test Type**: Security

### TC-005-21: Streaming CSV không OOM với 10K+ rows
- **TC ID**: TC-005-21
- **Source**: TS-005-05
- **Priority**: Major
- **Preconditions**: Database có ≥15000 log entries
- **Steps**:
  1. GET `/api/logs/export/csv` (system-admin)
  2. Monitor JVM heap usage during export
- **Expected**:
  - Response completes without OOM
  - File contains ≤10.000 rows
  - Header `X-Max-Export-Rows: 10000` present
- **Test Type**: Performance

### TC-005-22: Severity auto-assignment (login failure)
- **TC ID**: TC-005-22
- **Source**: TS-005-10
- **Priority**: Major
- **Preconditions**: Controller với `@AuditLog(action="LOGIN", module="AUTH")`
- **Steps**:
  1. Gọi endpoint với 401 response
  2. Verify log entry trong database
- **Expected**:
  - severity = warning cho login failure
  - type = login
- **Test Type**: Unit

### TC-005-23: Severity auto-assignment (system error)
- **TC ID**: TC-005-23
- **Source**: TS-005-11
- **Priority**: Major
- **Preconditions**: Controller với `@AuditLog(action="VIEW_REPORT", module="SYSTEM")`
- **Steps**:
  1. Gọi endpoint với 500 response
  2. Verify log entry trong database
- **Expected**:
  - severity = error cho system error
  - type = error
- **Test Type**: Unit

### TC-005-24: Empty state (không có log phù hợp)
- **TC ID**: TC-005-24
- **Source**: TS-005-15
- **Priority**: Normal
- **Preconditions**: Database có logs, filter rất hẹp
- **Steps**:
  1. GET `/api/access-logs?userId=99999999&type=configuration`
- **Expected**:
  - Response 200 với empty page (0 records)
  - UI hiển thị "Không có log nào phù hợp với bộ lọc"
- **Test Type**: UI

### TC-005-25: Date validation (start > end)
- **TC ID**: TC-005-25
- **Source**: TS-005-20
- **Priority**: Normal
- **Preconditions**: None
- **Steps**:
  1. GET `/api/access-logs?from=2026-06-28&to=2026-06-01`
- **Expected**:
  - Response 400 + message "Ngày bắt đầu phải nhỏ hơn ngày kết thúc"
  - (Nếu backend validate date range)
- **Test Type**: UI

### TC-005-26: Aggregate statistics
- **TC ID**: TC-005-26
- **Source**: TS-005-16
- **Priority**: Major
- **Preconditions**: Có log entries trong ngày qua
- **Steps**:
  1. Gọi `POST /api/logs/aggregate/compute?date=2026-06-27`
  2. Gọi `GET /api/logs/aggregate`
- **Expected**:
  - totalAccesses, uniqueUsers, successRate, avgDuration chính xác
  - LogAggregate entity được populate
  - Scheduler chạy ở 3 AM mỗi ngày
- **Test Type**: Unit
