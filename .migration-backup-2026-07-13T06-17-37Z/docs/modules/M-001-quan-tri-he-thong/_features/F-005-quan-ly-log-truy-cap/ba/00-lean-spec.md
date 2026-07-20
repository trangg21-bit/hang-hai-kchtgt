---
feature-id: F-005
document: lean-spec
output-mode: lean
last-updated: 2026-06-28T00:00:00Z
---

# Feature F-005: Quản lý log truy cập — Lean Business Analysis Spec

## 1. Summary

| Field | Value |
|---|---|
| Feature ID | F-005 |
| Feature Name | Quản lý log truy cập |
| Slug | quan-ly-log-truy-cap |
| Module | M-001 (Quản trị hệ thống) |
| Classification | local |
| Priority | medium |
| Complexity | Medium (8 business rules, 6 actors) |
| Tech Stack | Spring Boot + Spring Security + JWT + ReactJS + MSSQL 2022 |

**Business Intent:** Quản trị hệ thống và bảo mật cần khả năng giám sát, tra cứu và phân tích toàn bộ hoạt động hệ thống thông qua log truy cập — phục vụ nghiệp vụ kiểm toán, phát hiện bất thường, xử lý sự cố và tuân thủ các quy định bảo mật về lưu trữ và truy xuất nhật ký hoạt động.

**Scope:** Tra cứu 5 nhóm log (truy cập, đăng nhập, lỗi, tài khoản, cấu hình) với lọc nâng cao, xuất CSV, xem chi tiết, và tự động cleanup theo retention policy.

---

## 2. Scope

### In Scope

| # | Capability | Description |
|---|---|---|
| 1 | Xem danh sách log | Hiển thị danh sách log phân trang với 5 nhóm (access, login, error, account, configuration) |
| 2 | Lọc theo thời gian | Lọc log theo khoảng ngày bắt đầu — ngày kết thúc |
| 3 | Lọc theo người dùng | Lọc theo user ID hoặc username |
| 4 | Lọc theo loại & mức độ | Lọc theo type (5 nhóm) và severity (info, warning, error, critical) |
| 5 | Tìm kiếm keyword | Tìm kiếm theo từ khóa trong trường message |
| 6 | Xem chi tiết log | Hiển thị toàn bộ thông tin log entry (userAgent, requestPath, responseCode, duration, metadata) |
| 7 | Xuất CSV | Export log ra file CSV (giới hạn 10.000 rows/lần, chỉ system-admin) |
| 8 | Thống kê aggregate | Báo cáo tổng truy cập, unique users, success rate, avgDuration theo ngày/tháng |
| 9 | Retention policy | Tự động xóa log cũ sau 90 ngày bởi cron job |
| 10 | Phân trang | Phân trang danh sách log với điều hướng trang |

### Out of Scope

| # | Capability | Reason |
|---|---|---|
| 1 | Real-time log monitoring | Tích hợp SIEM ở F-012 |
| 2 | Custom log format | Mặc định dùng standard format |
| 3 | Log replication đến remote server | Chỉ lưu trong DB |
| 4 | Log analytics / anomaly detection | Không thuộc phạm vi BA stage này |
| 5 | Chỉnh sửa/xóa log thủ công | Log là immutable (BR-005-02) |
| 6 | Gửi notification/alert bất thường | Không thuộc phạm vi |
| 7 | Tích hợp SIEM bên ngoài | Không thuộc phạm vi |

---

## 3. Actors & Permissions

| Role | Level | Access |
|---|---|---|
| system-admin (Super Admin) | Full access | Xem tất cả 5 nhóm log, xuất CSV, cấu hình retention policy |
| admin (Security Admin) | View + Export | Xem tất cả log, xuất CSV, không xóa |
| admin-operation | View (filter theo đơn vị) | Truy cập log trong phân hệ/đơn vị của mình; không xuất CSV |
| admin (standard) | View (self only) | Chỉ xem log của chính mình |
| Lanh dao | Aggregated view | Chỉ xem báo cáo thống kê aggregate, không xem chi tiết |
| Can bo | Self only | Chỉ xem log của chính mình |
| Ca nhan | No access | Không xem được log hệ thống |

---

## 4. User Stories (MoSCoW)

| ID | Story | Priority | Actor |
|---|---|---|---|
| US-005-01 | **As** system-admin, **I want to** view all 5 log groups (access, login, error, account, configuration) **so that** I can monitor system activity for audit and security purposes | Must | system-admin |
| US-005-02 | **As** system-admin, **I want to** filter logs by date range, user, type, and severity **so that** I can quickly find specific log entries | Must | system-admin |
| US-005-03 | **As** system-admin, **I want to** search logs by keyword in the message field **so that** I can find logs containing specific terms | Must | system-admin |
| US-005-04 | **As** system-admin, **I want to** view detailed information for each log entry (userAgent, requestPath, responseCode, duration, metadata) **so that** I can diagnose issues | Should | system-admin |
| US-005-05 | **As** system-admin, **I want to** export logs to CSV (max 10,000 rows) **so that** I can generate reports for external review | Must | system-admin |
| US-005-06 | **As** admin, **I want to** view logs within my unit/department **so that** I can monitor activity in my scope | Should | admin |
| US-005-07 | **As** admin-operation, **I want to** view only access and login logs **so that** I can monitor user activity without seeing sensitive error/account logs | Must | admin-operation |
| US-005-08 | **As** user, **I want to** view only my own logs **so that** I can see my own activity history | Should | user |
| US-005-09 | **As** Lanh dao, **I want to** view aggregate statistics (total accesses, unique users, success rate, avg duration) **so that** I can get a high-level overview of system usage | Could | Lanh dao |
| US-005-10 | **As** system-admin, **I want to** configure retention policy (default 90 days) **so that** old logs are automatically cleaned up | Should | system-admin |
| US-005-11 | **As** system-admin, **I want to** receive alerts when ≥5 login failures occur within 1 hour **so that** I can detect potential security breaches | Could | system-admin |

---

## 5. Acceptance Criteria

| ID | Acceptance Criterion | Linked BR | Negative Path |
|---|---|---|---|
| AC-005-01 | Hệ thống hiển thị đầy đủ 5 nhóm log (access, login, error, account, configuration) với 5 trường chính: userId, action, targetResource, responseCode, createdAt | BR-005-01 | Nếu database trống → hiển thị empty state với hướng dẫn filter |
| AC-005-02 | Người dùng có thể lọc log theo khoảng thời gian (ngày bắt đầu — ngày kết thúc) với kết quả phân trang chính xác | BR-005-01 | Nếu ngày bắt đầu > ngày kết thúc → hiển thị lỗi validation "Ngày bắt đầu phải nhỏ hơn ngày kết thúc" |
| AC-005-03 | Người dùng có thể lọc log theo người dùng (user ID hoặc username) và theo loại log (type) và mức độ (severity) | BR-005-01 | Nếu không có kết quả phù hợp → hiển thị empty state "Không có log nào phù hợp với bộ lọc" |
| AC-005-04 | Tìm kiếm theo keyword trong trường message trả về kết quả chính xác, không phân biệt hoa/thường | BR-005-01 | Nếu keyword rỗng → trả về toàn bộ kết quả (theo filter khác) |
| AC-005-05 | Xem chi tiết log entry hiển thị đầy đủ: timestamp, type, severity, userId, username, IP, userAgent, action, endpoint, method, message, metadata (JSON view) | BR-005-01 | Nếu metadata null → hiển thị "N/A" thay vì lỗi |
| AC-005-06 | Export CSV chỉ khả dụng cho system-admin; file CSV đúng định dạng, giới hạn tối đa 10.000 rows/lần, dữ liệu không mất mát | BR-005-08, BR-027 | Nếu >10.000 rows → chỉ xuất 10.000 rows đầu tiên + cảnh báo "Đã giới hạn 10.000 rows" |
| AC-005-07 | Log là immutable: không cho phép UPDATE/DELETE trên AccessLog (trừ retention cleanup) — attempt trả về 403 Forbidden | BR-005-02 | Nếu attempt UPDATE/DELETE → HTTP 403 + message "Log không thể sửa đổi" |
| AC-005-08 | Retention policy tự động xóa log sau 90 ngày bởi cron job (schedule mặc định: 0 0 2 * * ?) | BR-005-03 | Nếu cron job fail → ghi log lỗi vào system log, không xóa log |
| AC-005-09 | Login failure log ghi lại cả thành công và thất bại; log lỗi đăng nhập phải có IP và lý do | BR-005-04 | Nếu login success → severity = info; nếu login failure → severity = warning |
| AC-005-10 | Account log ghi lại mọi thay đổi: tạo, sửa, khóa/mở khóa, reset password | BR-005-05 | Nếu account action không hợp lệ → ghi log với severity = error |
| AC-005-11 | Configuration log ghi lại thay đổi config hệ thống, bao gồm user thay đổi và giá trị trước/sau | BR-005-06 | Nếu không có thay đổi giá trị → không tạo log configuration |
| AC-005-12 | Severity được tự động gán: login failure = warning, system error = error, security breach = critical | BR-005-07 | Nếu không thể xác định severity → default = info |
| AC-005-13 | Chỉ hệ thống tự tạo log; không cho phép người dùng hoặc admin tạo log thủ công qua API | BR-005-08 | Nếu attempt tạo log qua API → HTTP 403 + message "Log chỉ được tạo tự động bởi hệ thống" |
| AC-005-14 | Phân trang hiển thị số lượng record và điều hướng trang chính xác | BR-005-01 | Nếu dataset > 1000 entries → pagination hoạt động mượt mà, không lag |
| AC-005-15 | UI responsive: mobile hiển thị log dạng card với thông tin thu gọn (timestamp + type + message preview) | BR-005-01 | Nếu viewport < 768px → sidebar collapse thành hamburger menu |
| AC-005-16 | Thống kê aggregate hiển thị: tổng truy cập, số người dùng unique, tỷ lệ thành công, thời gian phản hồi trung bình theo ngày/tháng | BR-005-01 | Nếu không có dữ liệu trong khoảng thời gian → hiển thị 0 cho tất cả metrics |
| AC-005-17 | Cảnh báo tự động khi ≥5 lần đăng nhập thất bại trong 1 giờ | BR-028 | Nếu <5 lần fail trong 1 giờ → không trigger alert |

---

## 6. Business Rules

| ID | Rule | Applies-to | Source | Exception |
|---|---|---|---|---|
| BR-005-01 | Log thuộc 5 nhóm: access, login, error, account, configuration — mỗi nhóm có cấu trúc metadata riêng | Tất cả log | Thiết kế dữ liệu | Không có |
| BR-005-02 | Log là immutable: không cho phép sửa, xóa hoặc ghi đè log sau khi đã tạo | Xóa/Sửa log | Audit requirement | Retention policy cleanup (cron job) |
| BR-005-03 | Chính sách lưu trữ: log được giữ trong 90 ngày; sau 90 ngày tự động xóa bởi cron job | Retention policy | Chính sách lưu trữ | system-admin có thể cấu hình retentionDays khác |
| BR-005-04 | Log đăng nhập (login) ghi lại cả thành công và thất bại; log lỗi đăng nhập phải có IP và lý do | Login log | Security requirement | Không có |
| BR-005-05 | Log tài khoản (account) ghi lại mọi thay đổi: tạo, sửa, khóa/mở khóa, reset password | Account log | Audit requirement | Không có |
| BR-005-06 | Log cấu hình (configuration) ghi lại thay đổi config hệ thống, bao gồm user thay đổi và giá trị trước/sau | Configuration log | Audit requirement | Không có thay đổi giá trị → không tạo log |
| BR-005-07 | Severity được tự động gán: login failure = warning, system error = error, security breach = critical | Severity assignment | Business logic | Default = info nếu không xác định được |
| BR-005-08 | Chỉ hệ thống tự tạo log; không cho phép người dùng hoặc admin tạo log thủ công | Tạo log | Integrity constraint | Không có |
| BR-024 | Chỉ Admin/Security Admin mới được xem toàn bộ log | Access Control | UC-020 | Không có |
| BR-025 | Log không được sửa đổi sau khi ghi (immutable) | Data Integrity | UC-020 | Retention cleanup |
| BR-026 | Tự động xóa log sau retentionDays ngày | Cleanup | UC-022 | Không có |
| BR-027 | Xuất CSV giới hạn 10.000 rows/lần | Export | UC-021 | Không có |
| BR-028 | Log failure login phải được cảnh báo (≥5 lần trong 1 giờ) | Alert | UC-020 | Không có |

---

## 7. Entities

| Entity | Fields | Constraints | Notes |
|---|---|---|---|
| **AccessLog** | id (BIGINT PK), userId (BIGINT FK→UserAccount NULL), username (VARCHAR 50), action (VARCHAR 30 NOT NULL), targetResource (VARCHAR 100), ipAddress (VARCHAR 45), userAgent (TEXT), requestPath (VARCHAR 500 NULL), responseCode (INT), duration_ms (INT), status (VARCHAR 20 NOT NULL), type (ENUM: access, login, error, account, configuration), severity (ENUM: info, warning, error, critical), message (TEXT), metadata (JSON), createdAt (TIMESTAMP) | INDEX(userId, createdAt), INDEX(action, createdAt), INSERT-only (no UPDATE/DELETE) | Bảng log chính, immutable |
| **LogRetentionPolicy** | id (BIGINT PK), retentionDays (INT DEFAULT 90), maxExportRows (INT DEFAULT 10000), cleanupSchedule (VARCHAR 50 DEFAULT '0 0 2 * * ?'), isActive (BOOLEAN DEFAULT true), createdAt (TIMESTAMP), updatedAt (TIMESTAMP) | retentionDays > 0 | Cấu hình retention policy |
| **LogAggregate** | id (BIGINT PK), date (DATE UNIQUE), totalAccesses (INT DEFAULT 0), uniqueUsers (INT DEFAULT 0), successRate (DECIMAL 5,2), avgDuration (INT), createdAt (TIMESTAMP) | date UNIQUE | Thống kê aggregate hàng ngày |

---

## 8. API Endpoints

| Method | Endpoint | Description | Auth | Role |
|---|---|---|---|---|
| GET | /api/v1/logs | Danh sách log (phân trang, filter by date/user/type/severity/keyword) | JWT | Admin, Security |
| GET | /api/v1/logs/{id} | Chi tiết log entry | JWT | Admin, Security |
| GET | /api/v1/logs/export | Xuất log CSV (max 10.000 rows) | JWT | Admin, Security |
| POST | /api/v1/logs/aggregate | Tính toán thống kê log | JWT | Security Admin |
| GET | /api/v1/logs/aggregate | Báo cáo thống kê aggregate | JWT | Security Admin, Lanh dao |
| GET | /api/v1/logs/retention | Xem cấu hình retention policy | JWT | system-admin |
| PUT | /api/v1/logs/retention | Cập nhật cấu hình retention policy | JWT | system-admin |

**Note:** Các endpoint GET /api/v1/users, /api/v1/groups, /api/v1/roles, /api/v1/symbols, /api/v1/connections là endpoints chung của module M-001, không thuộc riêng F-005.

---

## 9. Log Types Detail

| Type | Description | Severity Mapping | Key Fields |
|---|---|---|---|
| **access** | Truy cập tài nguyên hệ thống (trang, API) | info | action, targetResource, requestPath, responseCode, duration_ms |
| **login** | Đăng nhập thành công/thất bại | success=info, failure=warning | username, ipAddress, userAgent, status, message |
| **error** | Lỗi hệ thống, ngoại lệ | error | message, stackTrace (metadata), requestPath |
| **account** | Thay đổi tài khoản (tạo, sửa, khóa/mở khóa, reset password) | info | action, username, metadata (before/after values) |
| **configuration** | Thay đổi cấu hình hệ thống | info | action, username, metadata (config key, before/after values) |

---

## 10. Non-Functional Requirements (NFRs)

| Area | Requirement | Target |
|---|---|---|
| **Performance** | Query log danh sách < 2 giây với dataset < 100.000 entries; pagination hỗ trợ 1000+ entries mượt mà | Response time < 2s |
| **Scalability** | Hỗ trợ batch insert 500-1000 records/batch cho auto-instrumentation; streaming CSV writer không load toàn bộ vào memory | Batch insert, streaming export |
| **Security** | RBAC enforcement trên tất cả endpoints; immutability (INSERT-only) trên AccessLog; log injection prevention trong message field; export CSV không tiết lộ sensitive data | 403 on unauthorized access |
| **Reliability** | Cron retention cleanup retry logic; async log appender (log4j2/Logback) không block main thread; MDC tracking request context | 99.9% uptime logging |
| **Usability** | Responsive UI (mobile < 768px collapse sidebar); loading skeleton/spinner; empty state với hướng dẫn; toast notification cho action feedback | WCAG 2.1 AA compliance |
| **Compliance** | Tuân thủ yêu cầu lưu trữ log kiểm toán theo quy định ATTT Việt Nam — log phải được giữ tối thiểu 90 ngày, không cho phép sửa/xóa log đã ghi, export CSV phục vụ thanh tra/kiểm toán | [CẦN BỔ SUNG: trích dẫn nghị định / thông tư cụ thể về lưu trữ log kiểm toán] |

---

## 10a. Compliance — Vietnamese Cybersecurity Regulations

> **Note:** KB returned no results for Vietnamese cybersecurity regulation entries. The following compliance requirements are derived from the feature brief's business intent and standard audit-log practices. Specific regulation citations must be verified and filled in by the system architect or legal reviewer.

| Regulation | Requirement | Implementation in F-005 | Status |
|---|---|---|---|
| [CẦN BỔ SUNG: Nghị định về ATTT mạng] | Lưu trữ log truy cập tối thiểu 90 ngày | Retention policy default 90 ngày (BR-005-03, BR-026) | [CẦN BỔ SUNG] |
| [CẦN BỔ SUNG: Nghị định về bảo vệ thông tin phân cấp] | Log không được sửa đổi sau khi ghi (immutability) | BR-005-02, BR-025 — INSERT-only table, 403 on UPDATE/DELETE | Covered |
| [CẦN BỔ SUNG: Thông tư kỹ thuật ATTT] | Log phải chứa đủ thông tin: userId, IP, timestamp, action, result | AccessLog entity fields: userId, username, ipAddress, action, responseCode, createdAt | Covered |
| [CẦN BỔ SUNG: Quy định thanh tra/kiểm toán] | Khả năng export log phục vụ thanh tra, kiểm toán | Export CSV endpoint (BR-027, AC-005-06) | Covered |
| [CẦN BỔ SUNG: Quy định cảnh báo an ninh] | Cảnh báo khi phát hiện bất thường (≥5 login failures/hour) | BR-028, AC-005-17 — alert trigger mechanism | [CẦN BỔ SUNG: xác định channel gửi alert] |

**Compliance Gaps:**
- `[CẦN BỔ SUNG: số cụ thể nghị định / thông tư về lưu trữ log kiểm toán]` — cần xác định văn bản pháp lý chính xác áp dụng cho hệ thống này
- `[CẦN BỔ SUNG: yêu cầu phân loại log theo mức độ nhạy cảm]` — cần xác định log nào thuộc thông tin nội bộ vs thông tin mật
- `[CẦN BỔ SUNG: yêu cầu lưu trữ log tại Việt Nam]` — cần xác định có yêu cầu data residency cho log hay không

---

## 11. Test Scenarios

| ID | Scenario | Type | Expected Result |
|---|---|---|---|
| TS-005-01 | Truy vấn 5 nhóm log với filter date range | E2E | Hiển thị đúng log trong khoảng thời gian, phân trang chính xác |
| TS-005-02 | Lọc theo user + type + severity | E2E | Kết quả đúng theo 3 filter đồng thời |
| TS-005-03 | Tìm kiếm keyword trong message | E2E | Kết quả chứa keyword (không phân biệt hoa/thường) |
| TS-005-04 | Xem chi tiết log entry | E2E | Hiển thị đầy đủ metadata (JSON view), userAgent, requestPath |
| TS-005-05 | Export CSV (system-admin) | E2E | File CSV đúng định dạng, ≤10.000 rows, dữ liệu không mất |
| TS-005-06 | Export CSV (non-admin) | Security | Button ẩn, attempt API → 403 Forbidden |
| TS-005-07 | Attempt UPDATE log entry | Security | HTTP 403 + message "Log không thể sửa đổi" |
| TS-005-08 | Attempt DELETE log entry | Security | HTTP 403 + message "Log không thể xóa" |
| TS-005-09 | Retention cleanup cron job | Unit | Log >90 ngày bị xóa, log ≤90 ngày được giữ |
| TS-005-10 | Severity auto-assignment (login failure) | Unit | severity = warning cho login failure |
| TS-005-11 | Severity auto-assignment (system error) | Unit | severity = error cho system error |
| TS-005-12 | Alert trigger (≥5 login failures/hour) | Integration | Alert được trigger khi ≥5 failures trong 1 giờ |
| TS-005-13 | Pagination với 1000+ entries | Performance | Pagination hoạt động mượt, response < 2s |
| TS-005-14 | Responsive UI (mobile) | UI | Sidebar collapse thành hamburger, log hiển thị dạng card |
| TS-005-15 | Empty state (không có log phù hợp) | UI | Hiển thị thông điệp "Không có log nào phù hợp với bộ lọc" |
| TS-005-16 | Aggregate statistics | Unit | Tổng truy cập, unique users, success rate, avgDuration chính xác |
| TS-005-17 | User chỉ xem log của chính mình | Security | Admin standard chỉ thấy log của mình, không thấy log người khác |
| TS-005-18 | admin-operation chỉ xem access + login | Security | Không thấy nhóm error, account, configuration |
| TS-005-19 | Lanh dao chỉ xem aggregate | Security | Không thấy chi tiết log, chỉ thấy báo cáo thống kê |
| TS-005-20 | Date validation (start > end) | UI | Hiển thị lỗi "Ngày bắt đầu phải nhỏ hơn ngày kết thúc" |

---

## 12. Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| **Q1: Creates new domain elements?** | **Yes** | Introduces 3 new domain entities: AccessLog, LogRetentionPolicy, LogAggregate. AccessLog is a new bounded context (audit logging) with immutable semantics. |
| **Q2: Affects system architecture?** | **Yes** | Requires new repository pattern for AccessLog, batch insert mechanism (@Async + BatchPreparedStatementSetter), scheduled cleanup job (@Scheduled), streaming CSV export, and aggregate computation. Changes to Spring Security filter chain for log auto-instrumentation. |
| **Q3: Approach clear from existing architecture?** | **No** | New domain entities and audit logging pattern require system architect to define bounded context boundaries, aggregate roots, domain events, and context map integration with existing UserAccount, Role, Group domains. |

**Triage Verdict:** Route to **engineering-system-architect** (Q1=Yes + Q3=No).

---

## 13. Ambiguities

| ID | Description | Impact | Question | Options |
|---|---|---|---|---|
| [AMBIGUITY-001] | Phân biệt giữa "admin" (Security Admin) và "admin" (standard) trong permission matrix — cùng tên nhưng khác quyền | Cao | Cần làm rõ role naming convention | Gộp thành "Security Admin" và "Admin" (như root feature-brief.md) |
| [AMBIGUITY-002] | Metadata format cho mỗi log type chưa được định nghĩa chi tiết | Trung | Cần spec metadata schema cho 5 log types | Định nghĩa JSON schema cho từng type trong domain model |
| [AMBIGUITY-003] | Alert mechanism cho BR-028 (≥5 login failures/hour) chưa rõ hình thức | Trung | Alert gửi qua đâu? (email, toast, system notification?) | Xác định channel gửi alert trong BA stage tiếp theo |
| [AMBIGUITY-004] | LogRetentionPolicy có thể cấu hình bởi ai? | Thấp | Chỉ system-admin hay admin cũng được? | Giới hạn ở system-admin (consistent với export CSV) |
