---
status: proposed
last-updated: 2026-06-17T03:23:18Z
---
---
id: F-007
name: Quan ly ket noi lien thong chia du lieu
slug: quan-ly-ket-noi-lien-thong-chia-du-lieu
module-id: M-001
status: done
classification: local
priority: medium
created: 2026-06-16T04:40:32Z
last-updated: 2026-06-17T01:35:44Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quan ly ket noi lien thong chia du lieu

## Description

Cau hinh ket noi LGSP, NDXP, API qua HTTPS/TLS, JWT, IP whitelist

## Business Intent

Quan tri he thong - Cau hinh ket noi LGSP, NDXP, API

## Flow Summary

Quan tri he thong - Cau hinh ket noi LGSP, NDXP, API

## Acceptance Criteria

- Cau hinh ket noi thanh cong
- Xem lich su ket noi
- Cap nhat thong tin ket noi

## In Scope

- Tạo mới kết nối liên thông (LGSP, NDXP, API)
- Cập nhật thông tin kết nối (URL, authentication, credentials)
- Xóa kết nối liên thông
- Kiểm tra kết nối (connection test) và health check định kỳ
- Hiển thị lịch sử kết nối (ConnectionLog) — thành công/thất bại
- Quản lý cấu hình bảo mật: HTTPS/TLS (tối thiểu TLS 1.2), JWT token, IP whitelist
- Lưu trữ credentials mã hóa (encrypted at rest)
- Theo dõi trạng thái kết nối (ConnectionHealth) — online/offline/error
- Tìm kiếm và lọc kết nối theo tên, loại, trạng thái

## Out of Scope

- Tự động đồng bộ dữ liệu từ các hệ thống liên thông — chỉ quản lý cấu hình kết nối
- Quản lý mapping field giữa các hệ thống — thuộc module ETL/Integration độc lập
- Monitoring nâng cao (Prometheus/Grafana) — chỉ hiển thị health status đơn giản
- Quản lý queue/message broker (RabbitMQ/Kafka) cho async integration
- Retry mechanism policy configuration — retry tự động với backoff mặc định
- Dashboard phân tích hiệu năng kết nối (latency, throughput)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| system-admin | Full CRUD + Test + Health Check | Toàn quyền tạo/sửa/xóa kết nối, test kết nối, xem tất cả lịch sử, cấu hình TLS/IP whitelist |
| admin | CRUD + Test (trong phạm vi) | Quản lý kết nối trong phân hệ được giao; không được cấu hình TLS/IP whitelist toàn cục |
| admin-operation | CRUD + Test (operation only) | Chỉ quản lý kết nối phục vụ vận hành; không được xóa kết nối |
| user | Read-only | Chỉ có thể xem danh sách kết nối và trạng thái; không có quyền chỉnh sửa hoặc test |

## Entities

- **ConnectionConfig**: Bảng chính quản lý cấu hình kết nối (id, name, description, type, baseUrl, authType, apiKey, apiSecret, jwtSecret, tlsVersion, ipWhitelist, status, createdBy, createdDate, updatedDate, lastTestDate, lastTestResult)
  - `type` enum: `LGSP`, `NDXP`, `API`
  - `authType` enum: `JWT`, `API-Key`, `Basic-Auth`, `OAuth2`
  - `status` enum: `active`, `inactive`, `error`
- **ConnectionLog**: Lịch sử kết nối (id, connectionId, testType, status, responseTime, errorMessage, triggeredBy, triggeredAt)
- **ConnectionHealth**: Trạng thái sức khỏe kết nối (id, connectionId, status, lastChecked, nextScheduledCheck, uptimePercentage, errorCount)

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-007-01 | TLS tối thiểu 1.2: không cho phép cấu hình TLS < 1.2 cho kết nối HTTPS | TLS config | Chính sách bảo mật |
| BR-007-02 | IP whitelist phải là danh sách IP hợp lệ (IPv4 hoặc IPv6); không cho phép IP 0.0.0.0 hoặc 127.0.0.1 | IP whitelist | Chính sách bảo mật |
| BR-007-03 | Credentials (apiKey, apiSecret, jwtSecret) phải được mã hóa khi lưu trữ trong database | Storage | Bảo mật dữ liệu |
| BR-007-04 | Mỗi kết nối phải có thể được test (connection test) trước khi kích hoạt | Connection test | Nghiệp vụ |
| BR-007-05 | Health check được chạy tự động định kỳ (mỗi 5 phút); cập nhật ConnectionHealth table | Health check | Tự động |
| BR-007-06 | Lịch sử kết nối (ConnectionLog) không được xóa thủ công — chỉ xóa tự động theo retention policy | Retention | Audit requirement |
| BR-007-07 | Khi xóa kết nối, tự động tạo log "deleted" trong ConnectionLog | Audit trail | Audit requirement |
| BR-007-08 | Tên kết nối phải là duy nhất trong toàn hệ thống | Tạo/Sửa | Dữ liệu master |
| BR-007-09 | Base URL phải là URL hợp lệ (bắt đầu với https:// hoặc http://) | URL validation | Technical requirement |
| BR-007-10 | Khi thay đổi credentials, tự động chạy health check để xác nhận kết nối vẫn hoạt động | Credential change | Nghiệp vụ |

## Testing Strategy

- **Unit Testing (Backend)**:
  - Kiểm tra TLS version validation (≥ 1.2) (BR-007-01)
  - Kiểm tra IP whitelist validation (IPv4/IPv6 format) (BR-007-02)
  - Kiểm tra credentials encryption at rest (BR-007-03)
  - Kiểm tra URL format validation (BR-007-09)
  - Kiểm tra unique connection name (BR-007-08)
  - Kiểm tra auto health check schedule (BR-007-05)
  - Authorization check cho các endpoint theo role

- **Integration Testing (Backend)**:
  - Test flow: tạo connection → test connection → verify health check → update credential → auto health check → delete
  - Test credentials encryption: verify encrypted/decrypted correctly (AES-256)
  - Test DB constraints: duplicate name, invalid TLS version, invalid IP whitelist
  - Test ConnectionLog creation on delete (BR-007-07)
  - Test health check: simulate API endpoint down → verify status = error

- **E2E Testing (Frontend + Backend)**:
  - Test đầy đủ CRUD flow trên giao diện ReactJS
  - Test connection test với thực tế gọi API đến endpoint
  - Test xem lịch sử kết nối với filter theo date/status
  - Test health check status display (online/offline/error badge)
  - Test permission UI: user thường không thấy nút "Thêm/Sửa/Xóa/Test"
  - Test form tạo connection với credential fields (masked display)
  - Test export connection config (không export sensitive credentials)

- **Security Testing**:
  - Kiểm tra credentials encryption: verify no plaintext in DB
  - Kiểm tra credential masking in UI: never display full apiSecret/jwtSecret
  - Kiểm tra IP whitelist validation server-side (reject malformed IPs)
  - Kiểm tra TLS version enforced server-side (reject < 1.2)
  - Kiểm tra RBAC: admin không quản lý được connection của admin khác

- **UI/UX Testing**:
  - Responsive sidebar trên mobile (collapse hamburger)
  - Data table sticky header, hover row, action column positioned last
  - Loading skeleton/spinner, empty state, error state với retry
  - Form validation realtime với error message dưới mỗi trường
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
- Cột hành động (Sửa/Xóa/Test) luôn nằm cuối bảng
- Phân trang (pagination) hiển thị số lượng record và điều hướng trang
- Nút "Thêm kết nối" nổi bật ở góc trên bên phải bảng
- Toolbar tìm kiếm và lọc phía trên bảng

### States & Feedback
- **Loading**: Skeleton screen hoặc spinner khi đang tải dữ liệu
- **Empty State**: Thông điệp thân thiện + nút hành động (ví dụ: "Chưa có kết nối nào. Nhấn 'Thêm kết nối' để cấu hình.")
- **Error State**: Hiển thị thông báo lỗi rõ ràng + nút "Thử lại"
- **Action Feedback**: Toast notification ("Đã lưu thành công", "Kết nối thành công", "Đã xóa thành công") cho thao tác thành công; xác nhận modal cho xóa kết nối
- **Form**: Validation realtime, lỗi hiển thị dưới mỗi trường, nút Submit disabled khi có lỗi + loading indicator khi gửi

### Permission UI
- Ẩn/hiện nút hành động dựa trên vai trò của người dùng hiện tại
- Ví dụ: User thường chỉ thấy nút "Xem chi tiết/Test", admin thấy "Thêm/Sửa/Xóa/Test"
- Điều khiển quyền ở mức giao diện (interface-level permission control)
- Nút bị disabled với tooltip giải thích lý do khi user không có quyền

### Specific Features
- **Danh sách kết nối**: Bảng phân trang với search theo tên, filter theo type (LGSP/NDXP/API) và status; cột hiển thị tên, loại, URL (truncated), loại auth, trạng thái (badge online/offline/error), lần kiểm tra cuối
- **Chi tiết kết nối**: Tab view: Thông tin / Lịch sử kết nối / Health check; hiển thị thông tin chi tiết nhưng credentials được mask (••••••)
- **Form tạo/sửa kết nối**: Dropdown chọn type (LGSP/NDXP/API), input URL với format validation, dropdown auth type, conditional credential fields (API-Key: apiKey/apiSecret, JWT: jwtSecret), IP whitelist textarea (one IP per line), TLS version dropdown (1.2/1.3), validation realtime
- **Connection test**: Nút "Test kết nối" → loading spinner → kết quả (thành công/thất bại) + response time + thông báo chi tiết
- **Credential display**: Hiển thịmasked (••••••) với nút "Hiện/Ẩn" để toggle; không bao giờ hiển thị full credential
- **Health status**: Badge indicator: xanh (online), vàng (warning), đỏ (error); hiển thị uptime percentage và lần kiểm tra cuối
- **Responsive**: Mobile hiển thị danh sách connection dạng card với thông tin thu gọn

## Context

### Tech Stack
- Backend: Spring Boot + Spring Security + JWT
- Frontend: ReactJS
- Database: MSSQL 2022
