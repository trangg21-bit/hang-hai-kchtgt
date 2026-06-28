---
id: F-003
name: Quản lý đơn vị
slug: quan-ly-don-vi
module-id: M-001
status: done
classification: local
priority: high
created: 2026-06-16T04:40:53Z
last-updated: 2026-06-28T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý đơn vị

## Description

Quan ly don vi Cuc, Chi cuc, Cang vu, TCT theo he thung cap phat

## Business Intent

Quan tri he thong - Quan ly don vi Cuc, Chi cuc, Cang vu, TCT

## Flow Summary

Quan tri he thong - Quan ly don vi Cuc, Chi cuc, Cang vu, TCT

## Acceptance Criteria

- Quan ly thong tin don vi
- Phan cap quyen don vi

## In Scope

- Tạo mới đơn vị tổ chức (Cục, Chi cục, Cục vụ, TCT)
- Cập nhật thông tin đơn vị (tên, mã đơn vị, mô tả, cấp bậc)
- Xóa đơn vị tổ chức
- Phân cấp hierarchical (cha-con) giữa các đơn vị
- Hiển thị cây cấu trúc đơn vị (org tree)
- Quản lý hệ thống mã đơn vị (code) duy nhất
- Phân quyền/delegation ở cấp đơn vị
- Tìm kiếm và lọc đơn vị theo tên, mã, cấp bậc
- Di chuyển đơn vị sang cấp bậc hoặc đơn vị cha khác

## Out of Scope

- Quản lý nhân sự trực thuộc đơn vị — thuộc F-001 (User Management)
- Tự động gán quyền dựa trên đơn vị — quyền vẫn do admin hệ thống quản lý
- Tích hợp với hệ thống danh mục tổ chức của Bộ/Cơ quan cấp trên
- Xuất báo cáo cấu trúc tổ chức (org chart) dạng đồ họa
- Lịch sử thay đổi cơ cấu tổ chức theo thời gian
- Phân cấp đơn vị sâu hơn 3 cấp (ví dụ: phòng, tổ trong Chi cục)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| system-admin | Full CRUD + Quản lý cấu trúc | Toàn quyền tạo/sửa/xóa đơn vị, di chuyển đơn vị, phân cấp; không thể xóa đơn vị hệ thống gốc |
| admin | CRUD + Phân cấp (trong phạm vi) | Quản lý đơn vị trong phân hệ được giao; không được xóa đơn vị cấp cao hơn mình |
| user | Read-only | Chỉ có thể xem cây cấu trúc đơn vị và thông tin chi tiết; không có quyền chỉnh sửa |

## Entities

- **Organization**: Bảng chính quản lý đơn vị tổ chức (id, name, code, type, parentId, level, description, createdBy, createdDate, updatedDate, status)
- **OrgHierarchy**: Bảng hỗ trợ duy trì quan hệ phân cấp và path cho việc traverse cây (id, orgId, parentId, level, fullPath, sortOrder, effectiveDate, expiryDate)

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-003-01 | Mã đơn vị (code) phải là duy nhất trong toàn hệ thống; không được phép trùng mã | Tạo/Sửa đơn vị | Dữ liệu master |
| BR-003-02 | Không cho phép tạo vòng lặp phân cấp (circular reference): đơn vị A không thể là con của chính nó hoặc của đơn vị con mình | Phân cấp hierarchical | Integrity constraint |
| BR-003-03 | Đơn vị gốc (root) không có parentId; tất cả đơn vị phải có tối thiểu một đường dẫn (path) về root | Cấu trúc cây | Thiết kế dữ liệu |
| BR-003-04 | Loại đơn vị được giới hạn trong các loại: Cục, Chi cục, Cục vụ, TCT; không cho phép thêm loại mới | Tạo/Sửa đơn vị | Nghiệp vụ hành chính |
| BR-003-05 | Khi di chuyển đơn vị con sang đơn vị cha mới, toàn bộ cây con của đơn vị đó cũng được di chuyển theo | Di chuyển đơn vị | Nghiệp vụ |
| BR-003-06 | Không cho phép xóa đơn vị còn có đơn vị con hoặc có người dùng thuộc quyền | Xóa đơn vị | Integrity constraint |
| BR-003-07 | Cấp bậc đơn vị (level) được tính tự động theo độ sâu trong cây phân cấp | Tính toán level | Business logic |
| BR-003-08 | Tên đơn vị không được để trống và có tối đa 200 ký tự | Validation | UI/UX |

## Testing Strategy

- **Unit Testing (Backend)**:
  - Kiểm tra circular reference detection khi phân cấp (BR-003-02)
  - Kiểm tra unique constraint trên code đơn vị (BR-003-01)
  - Kiểm tra tự động tính level (BR-003-07)
  - Kiểm tra cascade di chuyển đơn vị (BR-003-05)
  - Authorization check cho các endpoint theo role

- **Integration Testing (Backend)**:
  - Test flow: tạo root → tạo children → tree traversal → move child
  - Test DB constraints: duplicate code, delete with children, circular ref
  - Test OrgHierarchy table consistency after move/create/delete operations
  - Test DB constraint for valid org types (BR-003-04)

- **E2E Testing (Frontend + Backend)**:
  - Test đầy đủ CRUD flow trên giao diện ReactJS
  - Test hiển thị cây phân cấp (org tree) với expand/collapse
  - Test search/filter đơn vị theo tên, mã, cấp bậc
  - Test di chuyển đơn vị sang cấp cha khác với validation
  - Test permission UI: user thường không thấy nút "Thêm/Sửa/Xóa"
  - Test form tạo đơn vị với validation realtime

- **Security Testing**:
  - Kiểm tra RBAC enforcement cho phân cấp: admin đơn vị thấp không quản lý được đơn vị cao hơn
  - Kiểm tra cascade delete protection (BR-003-06)

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
- Nút "Thêm đơn vị" nổi bật ở góc trên bên phải bảng
- Toolbar tìm kiếm và lọc phía trên bảng

### States & Feedback
- **Loading**: Skeleton screen hoặc spinner khi đang tải dữ liệu
- **Empty State**: Thông điệp thân thiện + nút hành động (ví dụ: "Chưa có đơn vị nào. Nhấn 'Thêm đơn vị' để bắt đầu.")
- **Error State**: Hiển thị thông báo lỗi rõ ràng + nút "Thử lại"
- **Action Feedback**: Toast notification ("Đã lưu thành công", "Đã xóa thành công") cho thao tác thành công; xác nhận modal cho xóa đơn vị
- **Form**: Validation realtime, lỗi hiển thị dưới mỗi trường, nút Submit disabled khi có lỗi + loading indicator khi gửi

### Permission UI
- Ẩn/hiện nút hành động dựa trên vai trò của người dùng hiện tại
- Ví dụ: User thường chỉ thấy nút "Xem chi tiết", admin thấy "Thêm/Sửa/Xóa/Di chuyển"
- Điều khiển quyền ở mức giao diện (interface-level permission control)
- Nút bị disabled với tooltip giải thích lý do khi user không có quyền

### Specific Features
- **Cấu trúc cây đơn vị (Org Tree)**: Hiển thị dạng cây phân cấp với expand/collapse; icon phân biệt loại đơn vị (Cục/Chi cục/Cục vụ/TCT); breadcrumb path cho mỗi đơn vị
- **Danh sách đơn vị**: Bảng phân trang với search theo tên/mã, filter theo loại và cấp bậc; cột hiển thị mã, tên, loại, cấp bậc, số lượng đơn vị con
- **Form tạo/sửa đơn vị**: Validation realtime cho mã đơn vị (duy nhất), tên (bắt buộc + tối đa 200 ký tự), chọn loại đơn vị (dropdown), chọn đơn vị cha (tree selector)
- **Di chuyển đơn vị**: Modal chọn đơn vị cha mới với validation circular reference; auto-rebuild org tree sau khi di chuyển
- **Responsive**: Mobile hiển thị org tree dạng list với indentation thay vì tree đồ họa

## Context

### Tech Stack
- Backend: Spring Boot + Spring Security + JWT
- Frontend: ReactJS
- Database: MSSQL 2022
