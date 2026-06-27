---
status: proposed
last-updated: 2026-06-17T03:23:16Z
---
---
id: F-004
name: Quan ly tai khoan admin
slug: quan-ly-tai-khoan-admin
module-id: M-001
status: done
classification: local
priority: high
created: 2026-06-16T04:40:32Z
last-updated: 2026-06-17T01:35:44Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quan ly tai khoan admin

## Description

Quan ly tai khoan admin 3 muc: thuong, su dung, van hanh

## Business Intent

Quan tri he thong - Tao, phe duyet, khoa, phan quyen admin

## Flow Summary

Quan tri he thong - Tao, phe duyet, khoa, phan quyen admin

## Acceptance Criteria

- Quan ly toan bo tai khoan admin
- Phan quyen theo muc

## In Scope

- Tạo mới tài khoản admin 3 mức: thường (regular), tiện ích (utility), vận hành (operation)
- Duyệt từ chối yêu cầu tạo tài khoản admin (approval workflow)
- Khóa/mở khóa tài khoản admin
- Phân quyền theo mức admin
- Tìm kiếm và lọc tài khoản admin theo tên, mức, trạng thái
- Cập nhật thông tin tài khoản admin
- Xem lịch sử phê duyệt tài khoản admin

## Out of Scope

- Quản lý tài khoản user thường — thuộc F-001 (User Management)
- Tự phê duyệt yêu cầu tạo tài khoản của chính mình (self-approval)
- Quản lý quyền chi tiết ở mức permission — chỉ phân quyền theo tier (mức)
- Tích hợp với hệ thống SSO cho admin
- Quản lý phiên làm việc (session) của admin
- Tự động revoke quyền admin khi hết thời hạn hợp đồng

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| system-admin | Full CRUD + Duyệt + Khóa/Mở khóa | Toàn quyền quản lý tài khoản admin ở mọi mức; tự phê duyệt yêu cầu tạo tài khoản |
| admin | CRUD (regular utility) + Khóa/Mở khóa | Quản lý tài khoản admin mức regular và utility; không được tạo/xóa tài khoản operation |
| admin-operation | CRUD (operation) + Khóa/Mở khóa | Chỉ quản lý tài khoản admin mức operation; không can thiệp vào tài khoản regular/utility |
| user | Read-only | Chỉ có thể xem danh sách tài khoản admin; không có quyền chỉnh sửa hoặc phê duyệt |

## Entities

- **AdminAccount**: Bảng chính quản lý tài khoản admin (id, username, displayName, email, passwordHash, tier, status, assignedOrgId, assignedBy, approvedBy, createdAt, updatedAt)
- **AdminTier**: Danh sách các mức admin (id, code, name, description, permissions, createdAt)
- **ApprovalWorkflow**: Quy trình phê duyệt tài khoản admin (id, adminAccountId, requestedBy, approvedBy, status, requestedAt, approvedAt, rejectionReason, tierRequested)

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-004-01 | Có 3 mức admin: Regular (thường), Utility (tiện ích), Operation (vận hành); mỗi mức có phạm vi quyền khác nhau | Tất cả | Quy định quản trị hệ thống |
| BR-004-02 | Mọi yêu cầu tạo tài khoản admin mức Regular và Operation phải được phê duyệt trước khi kích hoạt | Tạo admin | Quy trình phê duyệt |
| BR-004-03 | Chỉ `system-admin` mới được tạo tài khoản admin mức Operation | Tạo admin | Phân quyền hệ thống |
| BR-004-04 | Admin không thể tự phê duyệt yêu cầu tạo tài khoản của chính mình (anti-self-approval) | Phê duyệt | Kiểm soát nội bộ |
| BR-004-05 | Khi khóa tài khoản admin, toàn bộ session đang hoạt động bị vô hiệu hóa ngay lập tức | Khóa tài khoản | Security module |
| BR-004-06 | Tài khoản admin bị khóa không thể thực hiện thao tác phê duyệt | Phê duyệt | Nghiệp vụ |
| BR-004-07 | Khi tạo tài khoản admin, phải chỉ định mức (tier) và đơn vị chủ quản (nếu có) | Tạo admin | Nghiệp vụ |
| BR-004-08 | Lịch sử phê duyệt (ApprovalWorkflow) không được sửa hoặc xóa sau khi hoàn thành | Audit trail | Audit requirement |

## Testing Strategy

- **Unit Testing (Backend)**:
  - Kiểm tra validation cho 3 tier types (BR-004-01)
  - Kiểm tra approval workflow: required approval cho regular/operation (BR-004-02)
  - Kiểm tra self-approval prevention (BR-004-04)
  - Kiểm tra tier-based authorization cho creation (BR-004-03)
  - Kiểm tra ApprovalWorkflow immutability (BR-004-08)
  - Authorization check cho các endpoint theo tier

- **Integration Testing (Backend)**:
  - Test flow: yêu cầu tạo admin → phê duyệt → kích hoạt → khóa → mở khóa
  - Test approval workflow: create request → approve/reject → status update
  - Test DB constraints: foreign key AdminTier, AdminAccount.status cascade
  - Test anti-self-approval constraint in workflow

- **E2E Testing (Frontend + Backend)**:
  - Test đầy đủ CRUD flow admin account trên giao diện ReactJS
  - Test approval workflow UI: danh sách yêu cầu, duyệt/từ chối, lý do từ chối
  - Test search/filter admin theo tên, tier, trạng thái
  - Test permission UI: ẩn/nút disabled theo tier hiện tại
  - Test lock/unlock admin với confirmation modal và toast feedback
  - Test form tạo admin với tier selection và validation realtime

- **Security Testing**:
  - Kiểm tra RBAC: admin tier thấp không quản lý được tier cao hơn
  - Kiểm tra anti-self-approval enforcement
  - Kiểm tra session invalidation khi lock admin account (BR-004-05)
  - Kiểm tra ApprovalWorkflow không thể sửa/xóa (BR-004-08)

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
- Nút "Tạo tài khoản admin" nổi bật ở góc trên bên phải bảng
- Toolbar tìm kiếm và lọc phía trên bảng

### States & Feedback
- **Loading**: Skeleton screen hoặc spinner khi đang tải dữ liệu
- **Empty State**: Thông điệp thân thiện + nút hành động (ví dụ: "Chưa có tài khoản admin nào. Nhấn 'Tạo tài khoản admin' để bắt đầu.")
- **Error State**: Hiển thị thông báo lỗi rõ ràng + nút "Thử lại"
- **Action Feedback**: Toast notification ("Đã lưu thành công", "Đã xóa thành công") cho thao tác thành công; xác nhận modal cho xóa/khóa tài khoản
- **Form**: Validation realtime, lỗi hiển thị dưới mỗi trường, nút Submit disabled khi có lỗi + loading indicator khi gửi

### Permission UI
- Ẩn/hiện nút hành động dựa trên tier của người dùng hiện tại
- Ví dụ: Regular admin chỉ thấy "Xem chi tiết", system-admin thấy "Tạo/Duyệt/Khóa/Mở khóa"
- Điều khiển quyền ở mức giao diện (interface-level permission control)
- Nút bị disabled với tooltip giải thích lý do khi user không có quyền

### Specific Features
- **Danh sách tài khoản admin**: Bảng phân trang với search theo tên/email, filter theo tier (regular/utility/operation) và trạng thái; cột hiển thị avatar, tên, tier badge (màu khác nhau cho mỗi tier), trạng thái
- **Approval workflow**: Tab/View riêng cho danh sách yêu cầu phê duyệt; card view cho mỗi yêu cầu với thông tin người yêu cầu, tier, thời gian; nút "Phê duyệt" / "Từ chối" với modal nhập lý do
- **Form tạo admin**: Dropdown chọn tier (regular/utility/operation), validation realtime cho email, họ tên (bắt buộc), chỉ định đơn vị chủ quản (tree selector)
- **Form phê duyệt/từ chối**: Modal với lý do từ chối (bắt buộc khi từ chối), hiển thị thông tin chi tiết yêu cầu
- **Responsive**: Mobile hiển thị danh sách admin dạng card thay vì table

## Context

### Tech Stack
- Backend: Spring Boot + Spring Security + JWT
- Frontend: ReactJS
- Database: MSSQL 2022
