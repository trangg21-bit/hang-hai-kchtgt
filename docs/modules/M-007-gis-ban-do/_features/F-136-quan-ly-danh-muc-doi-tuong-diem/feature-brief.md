---
id: F-136
name: Quản lý danh mục đối tượng điểm
slug: quan-ly-danh-muc-doi-tuong-diem
module-id: M-007
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý danh mục đối tượng điểm

## Description
Quản lý toàn bộ vòng đời của danh mục đối tượng điểm trên bản đồ GIS bao gồm cảng biển, đèn biển, phao tiêu và các đài quan trắc, cho phép tạo mới, chỉnh sửa thông tin thuộc tính và xóa dữ liệu điểm địa lý với đầy đủ kiểm tra tính toàn vẹn.

## Business Intent
Xây dựng hệ thống quản lý danh mục đối tượng điểm chuẩn hóa nhằm thay thế việc lưu trữ thủ công, đảm bảo dữ liệu địa lý về cơ sở hạ tầng hàng hải luôn chính xác, cập nhật và sẵn sàng cho phân tích không gian, phục vụ công tác quản lý nhà nước về giao thông vận tải biển.

## Flow Summary
Người dùng truy cập giao diện bản đồ GIS và chọn menu quản lý danh mục đối tượng điểm, sau đó thực hiện các thao tác: tạo mới điểm với tọa độ và thông tin thuộc tính; chỉnh sửa thông tin của điểm đã tồn tại; xem chi tiết điểm trên bản đồ; xóa hoặc vô hiệu hóa điểm khi không còn sử dụng. Mỗi thao tác được ghi nhận nhật ký và đồng bộ với cơ sở dữ liệu trung tâm, hỗ trợ xuất dữ liệu định dạng GeoJSON.

## Acceptance Criteria
- Người dùng có thể tạo mới một đối tượng điểm GIS với đầy đủ tọa độ (kinh độ, vĩ độ) và các trường thuộc tính (tên, loại, mô tả, trạng thái), hệ thống lưu thành công và hiển thị điểm trên bản đồ.
- Người dùng có thể chỉnh sửa thông tin thuộc tính của một đối tượng điểm đã tồn tại mà không làm thay đổi vị trí tọa độ, thay đổi được lưu chính xác.
- Người dùng có thể xóa một đối tượng điểm khỏi danh mục; hệ thống xác nhận trước khi xóa và điểm biến mất khỏi bản đồ sau khi xác nhận.
- Hệ thống không cho phép tạo mới hai điểm cùng loại tại cùng một vị trí tọa độ (kiểm tra trùng lặp).
- Dữ liệu điểm có thể xuất ra định dạng GeoJSON với đầy đủ metadata.

## In Scope
- Tạo mới, chỉnh sửa, xóa, xem chi tiết đối tượng điểm GIS
- Quản lý danh mục loại điểm: cảng biển, đèn biển, phao tiêu, đài quan trắc
- Hiển thị vị trí điểm trên bản đồ GIS tương tác
- Tìm kiếm và lọc đối tượng điểm theo loại, tên, trạng thái
- Xuất dữ liệu điểm định dạng GeoJSON
- Ghi nhật ký thao tác người dùng

## Out of Scope
- Quản lý đối tượng đường và vùng (thuộc F-137, F-138)
- Tính toán tuyến đường hoặc phân tích không gian nâng cao
- Tích hợp với hệ thống AIS (Automatic Identification System) thời gian thực
- Tự động hóa việc thu thập tọa độ từ thiết bị đo đạc thực địa

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Visitor | Xem, tìm kiếm điểm trên bản đồ |
| User | Xem, tạo mới, chỉnh sửa điểm |
| Admin | Tạo, chỉnh sửa, xóa điểm, quản lý danh mục loại điểm |

## Entities
- **PointObject**: id, name, pointType (port/lighthouse/buoy/station), latitude, longitude, description, status, createdById, createdAt, updatedAt

## Business Rules
1. Tên đối tượng điểm phải là duy nhất trong cùng một loại điểm.
2. Tọa độ latitude phải nằm trong khoảng -90 đến 90, longitude phải nằm trong khoảng -180 đến 180.
3. Trạng thái điểm có ba giá trị cho phép: hoạt động, bảo trì, ngừng hoạt động.
4. Chỉ Admin mới có quyền xóa đối tượng điểm khỏi hệ thống.
5. Khi thay đổi loại điểm, người dùng cần xác nhận vì có thể ảnh hưởng đến biểu tượng hiển thị trên bản đồ.

## Testing Strategy
Kiểm thử đơn vị các phương thức CRUD của service quản lý điểm, kiểm thử tích hợp API REST với Postman/Newman, kiểm thử E2E trên giao diện bản đồ bằng Playwright/Cypress, kiểm thử xác thực và phân quyền cho từng role, kiểm thử validation tọa độ và ràng buộc duy nhất tên điểm.
