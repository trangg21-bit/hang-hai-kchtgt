---
id: F-005
name: Quản lý log truy cập
slug: quan-ly-log-truy-cap
module-id: M-001
status: proposed
classification: local
priority: medium
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-17
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý log truy cập

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-005
**Module:** M-001 — Quản trị hệ thống
**Loại:** chức năng thường (chỉ xem và tra cứu — không có bước phê duyệt, không tạo/sửa/xóa)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

---

## 1. Mô tả ngắn

Tra cứu, quản lý và phân tích nhật ký hoạt động hệ thống gồm **5 nhóm log**: truy cập (access/Thao tác), đăng nhập (login), lỗi hệ thống (error), tài khoản (account) và cấu hình (configuration). Tính năng hỗ trợ lọc theo thời gian, đơn vị, email, từ khóa; xem chi tiết từng dòng log; xuất log ra CSV (tối đa 10.000 rows/lần); xem thống kê aggregate (tổng truy cập, số người dùng unique, tỷ lệ thành công, thời gian phản hồi trung bình); và tự động xóa log cũ theo retention policy (mặc định 90 ngày, cron job). **Log là immutable** — chỉ hệ thống tự ghi, không cho người dùng tạo/sửa/xóa (ngoại lệ duy nhất: retention cleanup). Cảnh báo tự động khi ≥5 lần đăng nhập thất bại trong 1 giờ. Màn hình chỉ xem và tra cứu (tài liệu nền mục 3.5).

## 2. Trường dữ liệu

### 2.1. Bộ lọc trên màn danh sách

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Ngày truy cập | Không | Date range (Từ ngày — Đến ngày) | Ngày bắt đầu > ngày kết thúc → lỗi validation |
| 2 | Đơn vị | Không | TreeSelect dạng cây (orgUnitId) | Lọc theo đơn vị/phòng ban của người dùng |
| 3 | Email | Không | Text (email) | Lọc theo email người dùng |
| 4 | Từ khóa | Không | Text | Tìm kiếm không phân biệt hoa/thường trong nội dung log; rỗng → trả về toàn bộ theo filter khác |

### 2.2. Các cột danh sách và chi tiết log

| # | Trường | Ghi chú |
|---|---|---|
| 1 | STT | Số thứ tự theo trang |
| 2 | Đơn vị | donVi (denormalized tại thời điểm ghi log) |
| 3 | Email | email |
| 4 | Chức năng | targetResource/action |
| 5 | Địa chỉ IP | ipAddress |
| 6 | Trình duyệt | userAgent |
| 7 | Phiên đăng nhập | sessionId |
| 8 | Ngày truy cập | createdAt |
| 9 | Thao tác | Xem chi tiết |
| Chi tiết (popup) | timestamp, type (5 nhóm), severity, userId, username, email, donVi, IP, userAgent, sessionId, action, endpoint (requestPath + method), responseCode, duration_ms, message, metadata (JSON view) | metadata null → hiển thị "N/A" |

## 3. Trạng thái và phê duyệt

Theo tài liệu nền (mục 3.7) — các giá trị phân loại lưu dạng **số** (INT) và map Enum ở backend:

- **Nhóm log (type):** access (Thao tác), login (Đăng nhập), error (Lỗi hệ thống), account (Tài khoản), configuration (Cấu hình).
- **Mức độ (severity):** info, warning, error, critical — tự động gán (BR-005-07).
- **Kết quả (status):** thành công / thất bại.

**Không có bước phê duyệt.** Log là dữ liệu immutable do hệ thống tự ghi (mục 3.8 nền: mọi thao tác ghi ai làm, lúc nào); chỉ hệ thống tạo log, người dùng chỉ xem và tra cứu; việc xóa log cũ do cron retention cleanup tự động thực hiện theo policy.

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (BR-005-01..BR-005-08 + BR-024..BR-028 — kế thừa từ brief cũ + lean-spec)

- BR-005-01 — Log thuộc 5 nhóm: access, login, error, account, configuration — mỗi nhóm có cấu trúc metadata riêng.
- BR-005-02 (BR-025) — Log là immutable: không cho phép sửa, xóa hoặc ghi đè log sau khi đã tạo; ngoại lệ duy nhất là retention policy cleanup (cron job). Attempt UPDATE/DELETE qua API → 403 "Log không thể sửa đổi".
- BR-005-03 (BR-026) — Retention policy: log được giữ 90 ngày (mặc định); sau 90 ngày tự động xóa bởi cron job (schedule mặc định `0 0 2 * * ?`); nếu cron fail → ghi log lỗi vào system log, không xóa log. Có thể cấu hình retentionDays khác (bởi tài khoản quản trị hệ thống).
- BR-005-04 — Log đăng nhập ghi lại cả thành công và thất bại; log lỗi đăng nhập phải có IP và lý do; login success → severity = info, login failure → severity = warning.
- BR-005-05 — Log tài khoản ghi lại mọi thay đổi: tạo, sửa, khóa/mở khóa, reset password.
- BR-005-06 — Log cấu hình ghi lại thay đổi config hệ thống, bao gồm user thay đổi và giá trị trước/sau; không có thay đổi giá trị → không tạo log configuration.
- BR-005-07 — Severity tự động gán: login failure = warning, system error = error, security breach = critical; không xác định được → default = info.
- BR-005-08 — Chỉ hệ thống tự tạo log; không cho phép người dùng hoặc admin tạo log thủ công qua API (attempt → 403 "Log chỉ được tạo tự động bởi hệ thống").
- BR-024 — Chỉ tài khoản có quyền xem toàn bộ log (`log:manage` + phạm vi toàn hệ thống) mới được xem toàn bộ log; tài khoản khác xem theo phạm vi quyền của mình (brief cũ: "Chỉ Admin/Security mới được xem toàn bộ log").
- BR-028 — Cảnh báo tự động khi ≥5 lần đăng nhập thất bại trong 1 giờ; <5 lần → không trigger.

### 4.2. Acceptance criteria kế thừa (AC-005-01..AC-005-17)

- AC-005-01 — Danh sách đầy đủ 5 nhóm log, 9 cột (STT, Đơn vị, Email, Chức năng, IP, Trình duyệt, Phiên đăng nhập, Ngày truy cập, Thao tác); DB trống → empty state.
- AC-005-02 — Lọc theo khoảng thời gian với phân trang chính xác; ngày bắt đầu > ngày kết thúc → lỗi "Ngày bắt đầu phải nhỏ hơn ngày kết thúc".
- AC-005-03 — Lọc theo đơn vị, email và từ khóa; không có kết quả → "Không có log nào phù hợp với bộ lọc".
- AC-005-04 — Tìm kiếm keyword không phân biệt hoa/thường; keyword rỗng → trả về toàn bộ theo filter khác.
- AC-005-05 — Popup "Chi tiết log truy cập" hiển thị đầy đủ: timestamp, type, severity, userId, username, donVi, IP, userAgent, sessionId, action, endpoint, method, message, metadata (JSON view); metadata null → "N/A".
- AC-005-07 — Log immutable: không cho UPDATE/DELETE trên AccessLog (trừ retention cleanup); attempt → 403 + "Log không thể sửa đổi".
- AC-005-08 — Retention policy tự động xóa log sau 90 ngày bởi cron (schedule mặc định `0 0 2 * * ?`); cron fail → ghi log lỗi, không xóa.
- AC-005-09 — Login log ghi cả thành công và thất bại; log lỗi đăng nhập có IP và lý do; success → info, failure → warning.
- AC-005-10 — Account log ghi mọi thay đổi: tạo, sửa, khóa/mở khóa, reset password; action không hợp lệ → severity = error.
- AC-005-11 — Configuration log ghi thay đổi config (user + giá trị trước/sau); không đổi giá trị → không tạo log.
- AC-005-12 — Severity tự gán: login failure = warning, system error = error, security breach = critical; không xác định → info.
- AC-005-13 — Chỉ hệ thống tự tạo log; attempt tạo log qua API → 403 "Log chỉ được tạo tự động bởi hệ thống".
- AC-005-14 — Phân trang chính xác; dataset > 1000 entries vẫn mượt mà.
- AC-005-15 — UI responsive: mobile hiển thị log dạng card (timestamp + type + message preview); viewport < 768px → sidebar collapse.
- AC-005-16 — Thống kê aggregate: tổng truy cập, số người dùng unique, tỷ lệ thành công, thời gian phản hồi trung bình theo ngày/tháng; không có dữ liệu → 0 cho tất cả metrics.
- AC-005-17 — Cảnh báo tự động khi ≥5 lần đăng nhập thất bại trong 1 giờ; <5 lần → không trigger.
- (Brief cũ) — Xuất log CSV đúng định dạng, tối đa 10.000 rows/lần, dữ liệu không bị mất mát; nút Xuất CSV chỉ hiển thị khi có quyền xuất.

### 4.3. User stories kế thừa (US-005-01..US-005-11, MoSCoW)

- US-005-01 (Must) — Xem đầy đủ 5 nhóm log để giám sát hoạt động hệ thống phục vụ kiểm toán và bảo mật.
- US-005-02 (Must) — Lọc log theo khoảng thời gian, đơn vị, email, từ khóa. US-005-03 (Must) — Tìm kiếm theo từ khóa.
- US-005-04 (Should) — Xem chi tiết từng log entry (userAgent, requestPath, responseCode, duration, metadata, sessionId). US-005-06 (Should) — Xem log trong đơn vị/phân hệ của mình. US-005-07 (Must) — Tài khoản vận hành chỉ xem nhóm Thao tác + Đăng nhập (không xem log lỗi/tài khoản nhạy cảm). US-005-08 (Should) — Người dùng chỉ xem log của chính mình.
- US-005-09 (Could) — Lãnh đạo xem thống kê aggregate (tổng truy cập, unique users, success rate, avg duration) không xem chi tiết.
- US-005-10 (Should) — Quản trị hệ thống cấu hình retention policy (mặc định 90 ngày).
- US-005-11 (Could) — Nhận cảnh báo khi ≥5 lần đăng nhập thất bại trong 1 giờ.
- (Brief cũ) — Xuất log ra CSV phục vụ báo cáo (Should, cần quyền xuất).

### 4.4. Phân quyền riêng

Quyền theo mẫu `<resource>:<action>`, gán động qua nhóm/tài khoản (tài liệu nền mục 3.2); quyền mới phải đăng ký trong `PermissionSeeder.java`.

| Thao tác | Quyền cần có | Ghi chú |
|---|---|---|
| Xem danh sách / chi tiết / tra cứu log | `log:manage` | Phạm vi dữ liệu (toàn hệ thống / đơn vị / bản thân) theo tổ hợp quyền + đơn vị trực thuộc (mục 3.2 nền) |
| Xuất log CSV | `log:manage` | Tối đa 10.000 rows/lần; xuất CSV tạm dùng `log:manage` — SA có thể seed `log:export` sau; nút chỉ hiện khi có quyền |
| Xem thống kê aggregate | `log:manage` (báo cáo tổng hợp) | Tài khoản chỉ được cấp quyền xem tổng hợp thì không thấy chi tiết log |
| Cấu hình retention policy | Quyền quản trị hệ thống (ROLE_SYSTEM_ADMIN) | Cấu hình retentionDays/schedule |
| Không có quyền `log:manage` | — | Không thấy menu log hệ thống (brief cũ: Ca nhan no access) |

Bảng vai trò × thao tác (mô hình cũ — **đã thay thế** bằng bảng trên): Super Admin full access (xem tất cả, xuất, xóa — "xóa" chỉ qua retention cleanup vì log immutable); Security Admin view + export; Admin view (self only); Lãnh đạo aggregated view; Cán bộ self only; Cá nhân no access. Trong mô hình động, các phạm vi này thể hiện qua tổ hợp quyền + đơn vị trực thuộc (tài liệu nền 3.2); ROLE_SYSTEM_ADMIN / ROLE_SUPER_ADMIN vượt qua mọi kiểm tra quyền.

**Admin Cục:** mặc định theo tài liệu nền mục 3.8 — full quyền + xem thêm metadata (người tạo, người sửa cuối, thời gian tạo/cập nhật); không có gì đặc biệt ngoài mặc định.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 5 nhóm log (type: access/login/error/account/configuration) + mức độ (severity: info/warning/error/critical) + kết quả (thành công/thất bại); lưu dạng số (INT) |
| 2 | Có bước phê duyệt không | Không — log chỉ xem và tra cứu; không có phê duyệt |
| 3 | Lọc cha-con / theo đơn vị | Có — lọc theo đơn vị (TreeSelect); phạm vi xem log theo đơn vị/quyền của tài khoản |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — nút Xuất CSV chỉ hiện khi có quyền xuất (`log:manage` — tạm dùng, SA có thể seed `log:export` sau); báo cáo aggregate chỉ hiện với tài khoản có quyền xem tổng hợp; chi tiết metadata null → "N/A" |
| 5 | Quyền riêng | `log:manage`; cấu hình retention: giới hạn tài khoản có quyền đặc biệt ROLE_SYSTEM_ADMIN (admin-only) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không (ngược lại có tải xuống: xuất CSV) |
| 8 | Giao diện khác mẫu chung | Có — chức năng chỉ-xem: không có nút Thêm/Sửa/Xóa trên màn hình; có nút xuất CSV; có báo cáo thống kê aggregate; mobile hiển thị log dạng card |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/access-logs` (+ `/api/v1/audit-logs`) | Danh sách log (phân trang, filter theo khoảng thời gian/đơn vị/email/từ khóa) | `log:manage` |
| GET | `/api/access-logs/{id}` | Chi tiết log entry | `log:manage` |
| GET | `/api/logs/export/csv` | Xuất log CSV (tối đa 10.000 rows/lần) | `log:manage` — xuất CSV tạm dùng `log:manage`; SA có thể seed `log:export` sau |
| POST | `/api/logs/aggregate/compute` | Tính toán thống kê log | `log:manage` |
| GET | `/api/logs/aggregate` | Báo cáo thống kê aggregate (tổng truy cập, unique users, success rate, avg duration) | `log:manage` (báo cáo tổng hợp) |
| GET | `/api/logs/retention` | Xem cấu hình retention policy | `log:manage` — giới hạn ROLE_SYSTEM_ADMIN (admin-only) |
| PUT | `/api/logs/retention` | Cập nhật cấu hình retention policy (retentionDays, schedule) | `log:manage` — giới hạn ROLE_SYSTEM_ADMIN (admin-only) |

Ghi chú: log do hệ thống tự ghi (không có API tạo log cho người dùng — BR-005-08); không có API UPDATE/DELETE log (BR-005-02). Endpoint chung `/api/v1/roles` không còn — bảng Role đã bị loại bỏ.

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `AccessLog` (INSERT-only — immutable):** id (PK), userId (FK → UserAccount, NULL), username (VARCHAR(50)), 🔴 email (VARCHAR(100)), 🔴 donVi (VARCHAR(100) — denormalized để tránh join khi truy vấn), action (VARCHAR(30) NOT NULL), targetResource (VARCHAR(100)), ipAddress (VARCHAR(45)), userAgent (TEXT), 🔴 sessionId (VARCHAR(50)), requestPath (VARCHAR(500) NULL), responseCode (INT), duration_ms (INT), status (VARCHAR(20) NOT NULL — thành công/thất bại), type (INT — access/login/error/account/configuration), severity (INT — info/warning/error/critical), message (TEXT), metadata (JSON), createdAt (TIMESTAMP). Index: (userId, createdAt), (action, createdAt), (donVi, createdAt), (sessionId, createdAt). Không cho UPDATE/DELETE (BR-005-02) trừ retention cleanup.

**Bảng `LogRetentionPolicy`:** id, retentionDays (INT DEFAULT 90), maxExportRows (INT DEFAULT 10000), cleanupSchedule (VARCHAR(50) DEFAULT '0 0 2 * * ?'), isActive (BOOLEAN DEFAULT true), createdAt, updatedAt.

**Bảng `LogAggregate`:** id, date (DATE UNIQUE), totalAccesses (INT DEFAULT 0), uniqueUsers (INT DEFAULT 0), successRate (DECIMAL(5,2)), avgDuration (INT), createdAt.

**Ghi chú:** 3 trường 🔴 email, donVi, sessionId chưa có trong code hiện tại — cần bổ sung (theo lean-spec); nên lưu denormalized tại thời điểm ghi log.
