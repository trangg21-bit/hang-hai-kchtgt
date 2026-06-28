---
status: proposed
last-updated: 2026-06-17T03:23:17Z
---
---
id: F-005
name: Quan ly log truy cap
slug: quan-ly-log-truy-cap
module-id: M-001
status: done
classification: local
priority: medium
created: 2026-06-16T04:40:57Z
last-updated: 2026-06-17T01:35:44Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quan ly log truy cap

## Description

Tra cuu 5 nhom log: truy cap, dang nhap, loi, tai khoan, cau hinh

## Business Intent

Quan tri he thong - Tra cuu 5 nhom log (truy cap, dang nhap, loi, tai khoan, cau hinh)

## Flow Summary

Quan tri he thong - Tra cuu 5 nhom log (truy cap, dang nhap, loi, tai khoan, cau hinh)

## Acceptance Criteria

- Tra cuu duoc 5 nhom log
- Hien thi du 5 truong log

## In Scope

- Truy vấn và hiển thị 5 nhóm log: truy cập (access), đăng nhập (login), lỗi (error), tài khoản (account), cấu hình (configuration)
- Lọc log theo khoảng thời gian (ngày bắt đầu — ngày kết thúc)
- Lọc log theo người dùng (user ID hoặc username)
- Lọc log theo loại log (type) và mức độ nghiêm trọng (severity)
- Tìm kiếm log theo từ khóa (keyword search trong message)
- Hiển thị thông tin chi tiết của từng log entry
- Xuất log ra file CSV (chỉ system-admin)
- Tự động xóa log cũ theo chính sách lưu trữ (retention policy) —后台 cron job
- Không cho phép xóa hoặc sửa log (read-only)

## Out of Scope

- Tạo log mới qua API — log được tạo tự động bởi hệ thống (auto-instrumentation)
- Lưu trữ log ra file system hoặc external log server (Splunk, ELK) — chỉ lưu trong DB
- Phân tích log nâng cao (log analytics, anomaly detection, ML-based alerting)
- Chỉnh sửa nội dung log — log là immutable (không thay đổi được)
- Gửi notification/alert khi phát hiện log bất thường
- Tích hợp với hệ thống SIEM bên ngoài

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| system-admin | Read + Export CSV | Truy cập tất cả 5 nhóm log, xuất file CSV, cấu hình retention policy |
| admin | Read (filter theo đơn vị) | Truy cập log trong phân hệ/đơn vị của mình; không được xuất CSV |
| admin-operation | Read (chỉ nhóm login + access) | Chỉ truy cập nhóm log access và login; không xem được nhóm error, account, configuration |
| user | Read-only (log của chính mình) | Chỉ có thể xem log của chính mình; không thấy log của người khác |

## Entities

- **AccessLog**: Bảng log chung với 5 nhóm (id, type, userId, username, ipAddress, userAgent, action, endpoint, method, severity, message, metadata, createdAt, createdAt)
  - `type` enum: `access`, `login`, `error`, `account`, `configuration`
  - `severity` enum: `info`, `warning`, `error`, `critical`

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-005-01 | Log thuộc 5 nhóm: access, login, error, account, configuration — mỗi nhóm có cấu trúc metadata riêng | Tất cả log | Thiết kế dữ liệu |
| BR-005-02 | Log là immutable: không cho phép sửa, xóa hoặc ghi đè log sau khi đã tạo | Xóa/Sửa log | Audit requirement |
| BR-005-03 | Chính sách lưu trữ: log được giữ trong 90 ngày; sau 90 ngày tự động xóa bởi cron job | Retention policy | Chính sách lưu trữ |
| BR-005-04 | Log đăng nhập (login) ghi lại cả thành công và thất bại; log lỗi đăng nhập phải có IP và lý do | Login log | Security requirement |
| BR-005-05 | Log tài khoản (account) ghi lại mọi thay đổi: tạo, sửa, khóa/mở khóa, reset password | Account log | Audit requirement |
| BR-005-06 | Log cấu hình (configuration) ghi lại thay đổi config hệ thống, bao gồm user thay đổi và giá trị trước/sau | Configuration log | Audit requirement |
| BR-005-07 | Severity được tự động gán: login failure = warning, system error = error, security breach = critical | Severity assignment | Business logic |
| BR-005-08 | Chỉ hệ thống tự tạo log; không cho phép người dùng hoặc admin tạo log thủ công | Tạo log | Integrity constraint |

## Testing Strategy

- **Unit Testing (Backend)**:
  - Kiểm tra validation cho 5 log types (BR-005-01)
  - Kiểm tra immutability: không cho phép UPDATE/DELETE trên AccessLog (BR-005-02)
  - Kiểm tra retention policy auto-delete cron (BR-005-03)
  - Kiểm tra severity auto-assignment logic (BR-005-07)
  - Kiểm tra auto-instrumentation không cho phép manual log creation (BR-005-08)
  - Authorization check cho các endpoint xem log theo role

- **Integration Testing (Backend)**:
  - Test auto-logging: trigger login → verify login log created; trigger action → verify access log created
  - Test DB write operations: INSERT-only constraint trên AccessLog
  - Test retention cron: simulate time advancement → verify old logs deleted
  - Test query performance: large dataset filtering by date/user/type/severity

- **E2E Testing (Frontend + Backend)**:
  - Test search/filter log theo ngày, user, type, severity trên giao diện ReactJS
  - Test keyword search trong log message
  - Test chi tiết log entry view
  - Test export CSV (chỉ system-admin mới thấy nút)
  - Test permission UI: user thường chỉ thấy log của chính mình
  - Test pagination với dataset lớn (1000+ log entries)

- **Security Testing**:
  - Kiểm tra RBAC: admin không xem được log của đơn vị khác
  - Kiểm tra immutability: attempt UPDATE/DELETE → returns 403
  - Kiểm tra log injection prevention trong message field
  - Kiểm tra export CSV không tiết lộ sensitive data

- **UI/UX Testing**:
  - Responsive sidebar trên mobile (collapse hamburger)
  - Data table sticky header, hover row, action column positioned last
  - Loading skeleton/spinner, empty state, error state với retry
  - Filter form với date range picker, dropdown type/severity, text search
  - Toast notification cho action thành công/thất bại

## UI/UX Requirements

### Layout & Navigation
- Bố cục cố định: Sidebar trái cố định (menu điều hướng), Header trên cùng (tên admin, avatar, nút logout), Khu vực nội dung chính phía dưới
- Sidebar hiển thị menu: "Quản lý người dùng", "Quản lý nhóm", "Quản lý đơn vị", "Tài khoản Admin", "Log truy cập", "Biểu tượng bản đồ", "Kết nối liên thông"
- Sidebar thu gọn thành icon/hamburger menu trên thiết bị di động (breakpoint < 768px)

### Design Style
- Giao diện dashboard admin hiện đại, tối giản
- Bảng màu trung tính (xám/xanh dương), màu nhấn cho các hành động chính
- Typography: font sans-serif (Inter hoặc Roboto), kích thước chữ rõ ràng
- Card-based layout cho form và thông tin chi tiết

### Data Tables
- Sticky header, hover effect cho từng hàng
- Cột hành động (Sửa/Xóa) luôn nằm cuối bảng — **không hiển thị** vì log là read-only
- Phân trang (pagination) hiển thị số lượng record và điều hướng trang
- Nút "Xuất CSV" (chỉ system-admin) ở góc trên bên phải
- Toolbar tìm kiếm, lọc theo type/severity/date range phía trên bảng

### States & Feedback
- **Loading**: Skeleton screen hoặc spinner khi đang tải dữ liệu
- **Empty State**: Thông điệp thân thiện + hướng dẫn filter (ví dụ: "Không có log nào phù hợp với bộ lọc. Thử thay đổi tiêu chí tìm kiếm.")
- **Error State**: Hiển thị thông báo lỗi rõ ràng + nút "Thử lại"
- **Action Feedback**: Toast notification ("Đã xuất CSV thành công") cho thao tác xuất file; không có nút xóa/sửa
- **Form**: Filter form với date range picker, dropdown, text search — không có nút submit (filter realtime)

### Permission UI
- Ẩn/hiện nút hành động dựa trên vai trò của người dùng hiện tại
- Ví dụ: system-admin thấy "Xuất CSV", admin chỉ thấy "Xem chi tiết", user chỉ thấy log của chính mình
- Điều khiển quyền ở mức giao diện (interface-level permission control)
- Không có nút Sửa/Xóa cho bất kỳ role nào (log là read-only)

### Specific Features
- **Danh sách log**: Bảng phân trang với 5 tab filter (Access, Login, Error, Account, Configuration); columns: timestamp, type, severity, user, action, IP, message
- **Chi tiết log**: Modal/Drawer hiển thị toàn bộ thông tin: timestamp, type, severity, userId, username, IP, userAgent, action, endpoint, method, message, metadata (JSON view)
- **Filter form**: Date range picker, dropdown type (5 groups), dropdown severity (4 levels), text search input, filter button
- **Responsive**: Mobile hiển thị log dạng card với thông tin thu gọn (timestamp + type + message preview)
- **Export CSV**: Button chỉ visible cho system-admin; loading state khi xuất file lớn

## Context

### Tech Stack
- Backend: Spring Boot + Spring Security + JWT
- Frontend: ReactJS
- Database: MSSQL 2022
