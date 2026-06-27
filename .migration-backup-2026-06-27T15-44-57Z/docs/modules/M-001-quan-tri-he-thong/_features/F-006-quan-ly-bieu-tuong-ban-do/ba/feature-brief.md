---
status: proposed
last-updated: 2026-06-17T03:23:17Z
---
---
id: F-006
name: Quan ly bieu tuong ban do
slug: quan-ly-bieu-tuong-ban-do
module-id: M-001
status: done
classification: local
priority: medium
created: 2026-06-16T04:40:32Z
last-updated: 2026-06-17T01:35:44Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quan ly bieu tuong ban do

## Description

Quan ly bieu tuong doi tuong GIS tren ban do theo tung loai

## Business Intent

Quan tri he thong - Quan ly bieu tuong doi tuong GIS tren ban do

## Flow Summary

Quan tri he thong - Quan ly bieu tuong doi tuong GIS tren ban do

## Acceptance Criteria

- Them/sua/xoa bieu tuong
- Gan bieu tuong cho doi tuong GIS

## In Scope

- Tạo mới biểu tượng bản đồ (tên, mô tả, danh mục, file hình ảnh)
- Cập nhật thông tin biểu tượng (tên, mô tả, file hình ảnh)
- Xóa biểu tượng bản đồ
- Quản lý danh mục biểu tượng (SymbolCategory)
- Gán biểu tượng cho đối tượng GIS (ObjectSymbolMapping)
- Tìm kiếm và lọc biểu tượng theo tên, danh mục
- Phân loại biểu tượng theo nhóm đối tượng GIS
- Xem trước biểu tượng (image preview) trong danh sách
- Validate file hình ảnh khi upload (loại file, kích thước)
- Ngắt liên kết giữa biểu tượng và đối tượng GIS

## Out of Scope

- Chỉnh sửa hình ảnh biểu tượng (image editing) — chỉ cho phép upload file mới
- Tạo biểu tượng SVG bằng công cụ vector — chỉ hỗ trợ upload file PNG/JPG
- Tự động gán biểu tượng dựa trên nội suy từ dữ liệu GIS
- Tích hợp trực tiếp với GeoServer publish layer — chỉ lưu metadata trong DB
- Quản lý style layer trong GeoServer (SLD/CSS) — thuộc module GIS độc lập
- Quản lý coordinate reference system (CRS) — không thuộc phạm vi quản trị hệ thống

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| system-admin | Full CRUD + Quản lý danh mục | Toàn quyền tạo/sửa/xóa biểu tượng, quản lý danh mục, gán/ngắt liên kết với đối tượng GIS |
| admin | CRUD + Gán biểu tượng | Tạo/sửa/xóa biểu tượng trong danh mục được phân quyền; gán biểu tượng cho đối tượng GIS |
| user | Read-only | Chỉ có thể xem danh sách biểu tượng và hình ảnh preview; không có quyền chỉnh sửa hoặc gán |

## Entities

- **MapSymbol**: Bảng chính quản lý biểu tượng (id, name, description, categoryId, imageFileUrl, imageFileSize, mimeType, createdBy, createdDate, updatedDate, status)
- **SymbolCategory**: Danh mục biểu tượng (id, name, code, description, sortOrder, createdBy, createdDate)
- **ObjectSymbolMapping**: Bảng ánh xạ biểu tượng vào đối tượng GIS (id, symbolId, objectType, objectId, assignedBy, assignedDate, effectiveDate, expiryDate)

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-006-01 | Tên biểu tượng phải là duy nhất trong cùng một danh mục; có thể trùng tên khác danh mục | Tạo/Sửa biểu tượng | Dữ liệu master |
| BR-006-02 | File hình ảnh biểu tượng chỉ chấp nhận định dạng PNG, JPG, GIF, SVG; tối đa 5MB | Upload file | Validation |
| BR-006-03 | Mỗi danh mục phải có ít nhất một biểu tượng; không cho phép xóa danh mục khi vẫn còn biểu tượng | Xóa danh mục | Integrity constraint |
| BR-006-04 | Khi xóa biểu tượng, tự động xóa các mapping (ObjectSymbolMapping) liên quan | Xóa symbol cascade | Integrity constraint |
| BR-006-05 | Biểu tượng đã được gán cho đối tượng GIS vẫn được giữ trong hệ thống; chỉ xóa mapping khi không cần | Mapping lifecycle | Nghiệp vụ |
| BR-006-06 | File hình ảnh phải được lưu tại thư mục được chỉ định; tên file được sinh tự động để tránh trùng | Storage | Infrastructure |
| BR-006-07 | Tên danh mục phải là duy nhất trong toàn hệ thống | Tạo/Sửa category | Dữ liệu master |
| BR-006-08 | Tên biểu tượng không được để trống và có tối đa 200 ký tự | Validation | UI/UX |

## Testing Strategy

- **Unit Testing (Backend)**:
  - Kiểm tra unique constraint tên symbol trong cùng category (BR-006-01)
  - Kiểm tra file validation: MIME type, file size ≤ 5MB (BR-006-02)
  - Kiểm tra cascade delete: symbol deletion → mapping deletion (BR-006-04)
  - Kiểm tra unique category name (BR-006-07)
  - Kiểm tra authorization cho các endpoint theo role

- **Integration Testing (Backend)**:
  - Test flow: tạo category → tạo symbol upload → mapping → unmapping → delete symbol
  - Test file upload/retrieval: verify imageFileUrl, mimeType, fileSize persisted correctly
  - Test DB constraints: duplicate symbol name in same category, delete category with symbols
  - Test cascade delete for symbol mapping on symbol deletion (BR-006-04)

- **E2E Testing (Frontend + Backend)**:
  - Test đầy đủ CRUD flow trên giao diện ReactJS
  - Test upload hình ảnh với preview trước khi lưu
  - Test search/filter symbol theo tên và category
  - Test gán biểu tượng cho đối tượng GIS với autocomplete search
  - Test permission UI: user thường không thấy nút "Thêm/Sửa/Xóa"
  - Test form tạo symbol với file upload validation realtime

- **Security Testing**:
  - Kiểm tra file upload vulnerability: validate MIME type server-side (không chỉ client)
  - Kiểm tra path traversal prevention trong file upload naming (BR-006-06)
  - Kiểm tra file size validation (reject > 5MB)
  - Kiểm tra RBAC: admin không quản lý được category của admin khác

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
- Nút "Thêm biểu tượng" nổi bật ở góc trên bên phải bảng
- Toolbar tìm kiếm và lọc phía trên bảng

### States & Feedback
- **Loading**: Skeleton screen hoặc spinner khi đang tải dữ liệu
- **Empty State**: Thông điệp thân thiện + nút hành động (ví dụ: "Chưa có biểu tượng nào. Nhấn 'Thêm biểu tượng' để bắt đầu.")
- **Error State**: Hiển thị thông báo lỗi rõ ràng + nút "Thử lại"
- **Action Feedback**: Toast notification ("Đã lưu thành công", "Đã xóa thành công") cho thao tác thành công; xác nhận modal cho xóa biểu tượng
- **Form**: Validation realtime, lỗi hiển thị dưới mỗi trường, nút Submit disabled khi có lỗi + loading indicator khi gửi

### Permission UI
- Ẩn/hiện nút hành động dựa trên vai trò của người dùng hiện tại
- Ví dụ: User thường chỉ thấy nút "Xem chi tiết", admin thấy "Thêm/Sửa/Xóa/Gán biểu tượng"
- Điều khiển quyền ở mức giao diện (interface-level permission control)
- Nút bị disabled với tooltip giải thích lý do khi user không có quyền

### Specific Features
- **Danh sách biểu tượng**: Bảng phân trang với search theo tên, filter theo category; cột hiển thị thumbnail (image preview), tên, category, kích thước file, người tạo, ngày tạo
- **Danh mục biểu tượng**: Sidebar/tab view để quản lý categories; tạo/sửa/xóa category với validation unique name
- **Upload hình ảnh**: Drag-and-drop zone hoặc file picker với preview thumbnail trước khi upload; hiển thị validation error nếu file quá lớn (5MB) hoặc sai định dạng
- **Form tạo/sửa biểu tượng**: Validation realtime cho tên (duy nhất trong category), mô tả (tùy chọn, tối đa 1000 ký tự), chọn category (dropdown), upload file (PNG/JPG/GIF/SVG ≤ 5MB)
- **Gán biểu tượng**: Modal chọn đối tượng GIS (objectType + objectId), hiển thị mapping hiện tại với nút "Ngắt liên kết"
- **Responsive**: Mobile hiển thị danh sách biểu tượng dạng grid cards với thumbnail

## Context

### Tech Stack
- Backend: Spring Boot + Spring Security + JWT
- Frontend: ReactJS
- Database: MSSQL 2022
- GIS: GeoServer (chỉ dùng cho F-006 map symbols context, không trực tiếp tích hợp trong feature này)
