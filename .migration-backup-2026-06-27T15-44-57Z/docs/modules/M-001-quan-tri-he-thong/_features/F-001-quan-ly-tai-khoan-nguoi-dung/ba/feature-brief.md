---
status: proposed
last-updated: 2026-06-17T03:23:15Z
---
---
id: F-001
name: Quan ly tai khoan nguoi dung
slug: quan-ly-tai-khoan-nguoi-dung
module-id: M-001
status: done
classification: local
priority: high
created: 2026-06-16T04:40:32Z
last-updated: 2026-06-17T01:35:44Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quan ly tai khoan nguoi dung

## Description

Quan tri tai khoan: tao, sua, xoa, khoa/mo khoa tai khoan theo vai tro

## Business Intent

Quan tri he thong, Lanh dao, Chuyen vien - Tao, sua, xoa, khoa/mo khoa tai khoan

## Flow Summary

Quan tri he thong, Lanh dao, Chuyen vien - Tao, sua, xoa, khoa/mo khoa tai khoan

## Acceptance Criteria

- Tao tai khoan thanh cong
- Cap quyen theo vai tro
- Khoa/mo khoa tai khoan

## In Scope

- Tạo mới tài khoản người dùng (CRUD)
- Cập nhật thông tin tài khoản (họ tên, email, số điện thoại, vai trò)
- Khóa/mở khóa tài khoản
- Đặt lại mật khẩu (reset password)
- Tìm kiếm và lọc người dùng theo tên, email, vai trò, trạng thái (active/blocked)
- Phân quyền theo vai trò (system-admin, admin, user)
- Quản lý danh sách vai trò và phân quyền chi tiết
- Nhật ký thay đổi trạng thái tài khoản (UserStatusLog)

## Out of Scope

- Quản lý xác thực hai yếu tố (2FA/TOTP) — thuộc module bảo mật độc lập
- Quản lý phiên đăng nhập (session management) — thuộc module session
- Đồng bộ tài khoản với hệ thống LDAP/Active Directory bên ngoài
- Tự đăng ký tài khoản mới qua giao diện công khai (public self-registration)
- Tự xóa tài khoản (self-delete) — thuộc quy trình bảo mật riêng
- Tích hợp SSO với bên thứ ba

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| system-admin | Full (CRUD + Lock/Unlock + Reset Password) | Có toàn quyền quản lý người dùng, vai trò, phân quyền; tạo/xóa tài khoản system-admin |
| admin | CRUD + Lock/Unlock | Quản lý người dùng trong đơn vị/phân hệ của mình; không được tạo tài khoản system-admin |
| user | Read-only | Chỉ có thể xem thông tin người dùng; không có quyền chỉnh sửa hoặc khóa tài khoản |

## Entities

- **User**: Bảng chính quản lý thông tin tài khoản người dùng (id, username, email, passwordHash, displayName, phone, status, roleId, createdAt, updatedAt)
- **Role**: Danh sách các vai trò hệ thống (id, name, code, description, isSystem, createdAt)
- **Permission**: Quyền chi tiết được gán cho từng vai trò (id, name, code, module, action, description)
- **UserRole**: Bảng trung gian giữa User và Role (userId, roleId, assignedBy, assignedAt, expiresAt)
- **UserStatusLog**: Nhật ký thay đổi trạng thái tài khoản (id, userId, previousStatus, newStatus, changedBy, changedAt, reason)

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001-01 | Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt | Tạo/Sửa user | PDPD §24, Chính sách mật khẩu |
| BR-001-02 | Tài khoản bị khóa sau 5 lần đăng nhập thất bại liên tiếp; tự mở khóa sau 30 phút hoặc do admin thao tác thủ công | Đăng nhập/Status | Chính sách bảo mật |
| BR-001-03 | Email phải là duy nhất trong hệ thống; không cho phép trùng email khi tạo mới hoặc sửa | Tạo/Sửa user | Dữ liệu master |
| BR-001-04 | Chỉ role `system-admin` mới được tạo hoặc xóa tài khoản `system-admin` | Role assignment | Phân quyền hệ thống |
| BR-001-05 | Khi khóa tài khoản, mọi session đang hoạt động của user đó sẽ bị vô hiệu hóa ngay lập tức | Khóa tài khoản | Security module |
| BR-001-06 | Khi tạo/reset password, mật khẩu mới phải khác 3 mật khẩu gần nhất của user | Reset password | Chính sách mật khẩu |
| BR-001-07 | Mọi thay đổi trạng thái tài khoản (active/blocked) phải được ghi vào UserStatusLog với lý do | Lock/Unlock | Audit requirement |
| BR-001-08 | User không thể tự thay đổi vai trò (role) của chính mình; chỉ admin/system-admin được phép gán/hủy vai trò | Role assignment | Phân quyền |

## Testing Strategy

- **Unit Testing (Backend)**:
  - Kiểm tra validation rules cho password policy (BR-001-01)
  - Kiểm tra logic lockout sau N lần đăng nhập sai (BR-001-02)
  - Kiểm tra unique constraint trên email (BR-001-03)
  - Kiểm tra Authorization cho các endpoint tạo/xóa user theo role
  - Kiểm tra UserStatusLog được ghi đầy đủ khi lock/unlock (BR-001-07)

- **Integration Testing (Backend)**:
  - Test flow đầy đủ: tạo user → login → lock → unlock → reset password
  - Test tích hợp Spring Security + JWT: verify authorization headers
  - Test DB constraints: duplicate email, cascade delete, foreign key integrity

- **E2E Testing (Frontend + Backend)**:
  - Test đầy đủ CRUD flow trên giao diện ReactJS
  - Test filter/search theo name/email/role/status với pagination
  - Test lock/unlock với confirmation modal và toast feedback
  - Test password reset flow với validation realtime
  - Test permission UI: ẩn/nút disabled theo role hiện tại

- **Security Testing**:
  - Kiểm tra rate limiting trên endpoint login (50/15 phút) và password reset (3/15 phút)
  - Kiểm tra JWT không tiết lộ thông tin nhạy cảm trong payload
  - Kiểm tra password hash (bcrypt/argon2) không lưu plaintext
  - Kiểm tra session invalidation khi lock account (BR-001-05)

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
- Cột hành động (Sửa/Xóa) luôn nằm cuối bảng
- Phân trang (pagination) hiển thị số lượng record và điều hướng trang
- Nút "Thêm mới" nổi bật ở góc trên bên phải bảng
- Toolbar tìm kiếm và lọc phía trên bảng

### States & Feedback
- **Loading**: Skeleton screen hoặc spinner khi đang tải dữ liệu
- **Empty State**: Thông điệp thân thiện + nút hành động (ví dụ: "Chưa có người dùng nào. Nhấn 'Thêm mới' để bắt đầu.")
- **Error State**: Hiển thị thông báo lỗi rõ ràng + nút "Thử lại"
- **Action Feedback**: Toast notification ("Đã lưu thành công", "Đã xóa thành công") cho thao tác thành công; xác nhận modal cho xóa/khóa tài khoản
- **Form**: Validation realtime, lỗi hiển thị dưới mỗi trường, nút Submit disabled khi có lỗi + loading indicator khi gửi

### Permission UI
- Ẩn/hiện nút hành động dựa trên vai trò của người dùng hiện tại
- Ví dụ: User thường chỉ thấy nút "Xem chi tiết", admin thấy "Thêm/Sửa/Xóa"
- Điều khiển quyền ở mức giao diện (interface-level permission control)
- Nút bị disabled với tooltip giải thích lý do khi user không có quyền

### Specific Features
- **Danh sách người dùng**: Bảng phân trang với search theo tên/email, filter theo vai trò và trạng thái, cột hiển thị avatar, tên, email, vai trò, trạng thái
- **Form tạo/sửa user**: Validation realtime cho email (định dạng + duy nhất), mật khẩu (yêu cầu độ phức tạp), họ tên (bắt buộc)
- **Role management**: Danh sách vai trò, tạo/sửa vai trò, gán quyền qua checkbox theo nhóm chức năng
- **Lock/Unlock**: Modal xác nhận với lý do khóa/mở khóa, hiển thị trạng thái badge (màu xanh cho active, đỏ cho blocked)
- **Password reset**: Modal nhập mật khẩu mới với validation strength indicator (mạnh/yếu/đạm)

## Context

### Tech Stack
- Backend: Spring Boot + Spring Security + JWT
- Frontend: ReactJS
- Database: MSSQL 2022
