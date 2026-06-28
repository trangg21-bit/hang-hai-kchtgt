---
id: F-002
name: Quan ly nhom nguoi dung
slug: quan-ly-nhom-nguoi-dung
module-id: M-001
status: done
classification: local
priority: high
created: 2026-06-16T04:40:32Z
last-updated: 2026-06-17T01:35:44Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quan ly nhom nguoi dung

## Description

Quan ly nhom nguoi dung: tao, sua, xoa nhom, gan thanh vien

## Business Intent

Quan tri he thong - Tao/sua/xoa nhom, gan thanh vien

## Flow Summary

Quan tri he thong - Tao/sua/xoa nhom, gan thanh vien

## Acceptance Criteria

- Tao/sua/xoa nhom thanh cong
- Gan thanh vien vao nhom

## In Scope

- Tạo mới nhóm người dùng (tên, mô tả, đơn vị chủ quản)
- Cập nhật thông tin nhóm (tên, mô tả)
- Xóa nhóm người dùng
- Thêm thành viên vào nhóm
- Loại bỏ thành viên khỏi nhóm
- Hiển thị danh sách thành viên của từng nhóm
- Tìm kiếm và lọc nhóm theo tên, đơn vị chủ quản
- Hiển thị danh sách nhóm mà một người dùng tham gia

## Out of Scope

- Phân quyền tự động theo nhóm — việc gán quyền vẫn thực hiện qua Role (F-001)
- Quản lý nhóm phân cấp (nested/chồng nhóm)
- Tự nguyện tham gia/bỏ nhóm (group join/leave tự động)
- Nhóm hệ thống tự động được tạo theo quy tắc nghiệp vụ
- Quản lý phân cấp nhóm theo địa lý hoặc phòng ban chuyên môn
- Tích hợp nhóm với hệ thống phân loại nhân sự bên ngoài

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| system-admin | Full CRUD + Quản lý thành viên | Toàn quyền tạo/sửa/xóa nhóm, thêm/bớt thành viên, gán đơn vị chủ quản |
| admin | CRUD + Quản lý thành viên (trong đơn vị mình) | Quản lý nhóm trong phân hệ/đơn vị của mình; không được quản lý nhóm của đơn vị khác |
| user | Read-only | Chỉ có thể xem thông tin nhóm và danh sách thành viên; không có quyền chỉnh sửa |

## Entities

- **UserGroup**: Bảng chính quản lý nhóm người dùng (id, name, description, parentGroupId, createdBy, createdDate, updatedDate, status)
- **GroupMember**: Bảng trung gian giữa UserGroup và User (id, groupId, userId, joinedDate, addedBy, status)

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-002-01 | Tên nhóm phải là duy nhất trong toàn hệ thống; không cho phép trùng tên khi tạo mới hoặc sửa | Tạo/Sửa nhóm | Dữ liệu master |
| BR-002-02 | Mỗi nhóm phải có ít nhất 1 thành viên; không cho phép xóa nhóm khi vẫn còn thành viên | Xóa nhóm | Nghiệp vụ |
| BR-002-03 | Một người dùng có thể thuộc nhiều nhóm khác nhau cùng lúc | Thành viên | Thiết kế dữ liệu |
| BR-002-04 | Không được thêm cùng một người dùng vào cùng một nhóm hai lần; kiểm tra trùng lặp trước khi thêm | Thêm thành viên | Dữ liệu master |
| BR-002-05 | Người dùng bị khóa (blocked) vẫn được giữ trong nhóm nhưng không có hiệu lực thực thi | Thành viên khóa | Chính sách bảo mật |
| BR-002-06 | Khi xóa người dùng khỏi hệ thống, tự động xóa record tương ứng trong GroupMember | Xóa user cascade | Integrity constraint |
| BR-002-07 | Tên nhóm không được để trống và có tối đa 200 ký tự | Validation | UI/UX |

## Testing Strategy

- **Unit Testing (Backend)**:
  - Kiểm tra unique constraint trên tên nhóm (BR-002-01)
  - Kiểm tra min 1 member requirement (BR-002-02)
  - Kiểm tra không cho phép thêm duplicate member (BR-002-04)
  - Kiểm tra cascade delete khi xóa user (BR-002-06)
  - Authorization check cho các endpoint theo role

- **Integration Testing (Backend)**:
  - Test flow: tạo nhóm → thêm member → list members → remove member → xóa nhóm
  - Test foreign key integrity: GroupMember → UserGroup, GroupMember → User
  - Test DB constraints: duplicate name, delete with members (should fail)

- **E2E Testing (Frontend + Backend)**:
  - Test đầy đủ CRUD flow trên giao diện ReactJS
  - Test search/filter nhóm theo tên và đơn vị
  - Test thêm/bớt thành viên với autocomplete search user
  - Test permission UI: user thường không thấy nút "Thêm/Sửa/Xóa"
  - Test display danh sách nhóm của một user cụ thể

- **Security Testing**:
  - Kiểm tra RBAC enforcement: admin đơn vị khác không quản lý được nhóm của đơn vị mình
  - Kiểm tra blocked user vẫn được giữ trong group nhưng không login được

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
- Nút "Thêm nhóm" nổi bật ở góc trên bên phải bảng
- Toolbar tìm kiếm và lọc phía trên bảng

### States & Feedback
- **Loading**: Skeleton screen hoặc spinner khi đang tải dữ liệu
- **Empty State**: Thông điệp thân thiện + nút hành động (ví dụ: "Chưa có nhóm nào. Nhấn 'Thêm nhóm' để tạo nhóm mới.")
- **Error State**: Hiển thị thông báo lỗi rõ ràng + nút "Thử lại"
- **Action Feedback**: Toast notification ("Đã lưu thành công", "Đã xóa thành công") cho thao tác thành công; xác nhận modal cho xóa nhóm
- **Form**: Validation realtime, lỗi hiển thị dưới mỗi trường, nút Submit disabled khi có lỗi + loading indicator khi gửi

### Permission UI
- Ẩn/hiện nút hành động dựa trên vai trò của người dùng hiện tại
- Ví dụ: User thường chỉ thấy nút "Xem chi tiết nhóm", admin thấy "Thêm/Sửa/Xóa/Quản lý thành viên"
- Điều khiển quyền ở mức giao diện (interface-level permission control)
- Nút bị disabled với tooltip giải thích lý do khi user không có quyền

### Specific Features
- **Danh sách nhóm**: Bảng phân trang với search theo tên nhóm, filter theo đơn vị chủ quản; cột hiển thị tên, mô tả, số lượng thành viên, người tạo, ngày tạo
- **Chi tiết nhóm**: Tab view: Thông tin nhóm / Danh sách thành viên / Lịch sử thay đổi
- **Quản lý thành viên**: Modal/Drawer để thêm/bớt thành viên; search user với autocomplete, hiển thị danh sách thành viên hiện tại với nút "Rời nhóm"
- **Form tạo/sửa nhóm**: Validation realtime cho tên nhóm (duy nhất + tối đa 200 ký tự), mô tả (tùy chọn, tối đa 1000 ký tự)
- **Responsive**: Mobile hiển thị danh sách nhóm dạng card thay vì table

## Context

### Tech Stack
- Backend: Spring Boot + Spring Security + JWT
- Frontend: ReactJS
- Database: MSSQL 2022
