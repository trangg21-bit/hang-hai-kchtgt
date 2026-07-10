---
id: F-137
name: Quản lý danh mục đối tượng đường
slug: quan-ly-danh-muc-doi-tuong-duong
module-id: M-007
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý danh mục đối tượng đường

## Description
Quản lý toàn bộ vòng đời của danh mục đối tượng đường trên bản đồ GIS bao gồm luồng hàng hải và đê/kè bảo vệ bờ biển, cho phép tạo mới, chỉnh sửa đường địa lý đa điểm và xóa dữ liệu với đầy đủ kiểm tra tính toàn vẹn không gian.

## Business Intent
Xây dựng hệ thống quản lý danh mục đối tượng đường chuẩn hóa nhằm số hóa các tuyến luồng và công trình đê/kè phục vụ an toàn hàng hải, thay thế việc quản lý bản vẽ giấy, giúp người dùng cập nhật, tra cứu và phân tích các tuyến đường biển và công trình bảo vệ bờ biển một cách hiệu quả.

## Flow Summary
Người dùng truy cập giao diện bản đồ GIS và chọn menu quản lý danh mục đối tượng đường, sau đó thực hiện các thao tác: tạo mới đường với chuỗi tọa độ liên tiếp và thông tin thuộc tính; chỉnh sửa hình dạng hoặc thông tin của đường đã tồn tại; xem chi tiết đường trên bản đồ; xóa hoặc vô hiệu hóa đường khi cần. Mỗi đường được gắn thêm thông tin thuộc tính như loại, chiều dài và năm hoàn công, hệ thống còn hỗ trợ xem phân bố nhiều đường thông qua chồng lớp bản đồ.

## Acceptance Criteria
- Người dùng có thể tạo mới một đối tượng đường GIS với chuỗi tọa độ (≥ 2 điểm) và các trường thuộc tính (tên, loại luồng/đê, mô tả, trạng thái), hệ thống lưu thành công và hiển thị đường trên bản đồ.
- Người dùng có thể chỉnh sửa chuỗi tọa độ hoặc thông tin thuộc tính của một đối tượng đường đã tồn tại, thay đổi được lưu chính xác và hiển thị cập nhật trên bản đồ.
- Người dùng có thể xóa một đối tượng đường khỏi danh mục; hệ thống xác nhận trước khi xóa và đường biến mất khỏi bản đồ sau khi xác nhận.
- Hệ thống không cho phép tạo đường có ít hơn 2 điểm tọa độ.
- Dữ liệu đường có thể xuất ra định dạng GeoJSON với đầy đủ geometry và metadata.

## In Scope
- Tạo mới, chỉnh sửa, xóa, xem chi tiết đối tượng đường GIS
- Quản lý danh mục loại đường: luồng hàng hải, đê bảo vệ bờ, kè chống xói mòn
- Hiển thị vị trí đường trên bản đồ GIS tương tác
- Tìm kiếm và lọc đối tượng đường theo loại, tên, trạng thái
- Xuất dữ liệu đường định dạng GeoJSON
- Ghi nhật ký thao tác người dùng
- Tính toán chiều dài tự nhiên của đường

## Out of Scope
- Quản lý đối tượng điểm và vùng (thuộc F-136, F-138)
- Tính toán luồng chảy hoặc phân tích thủy văn
- Tích hợp dữ liệu đo đạc thực địa tự động
- Hiển thị bản đồ địa hình nền chi tiết (DEM)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Visitor | Xem, tìm kiếm đường trên bản đồ |
| User | Xem, tạo mới, chỉnh sửa đường |
| Admin | Tạo, chỉnh sửa, xóa đường, quản lý danh mục loại đường |

## Entities
- **LineObject**: id, name, lineType (channel/dike/revetment), coordinates (Point[]), lengthMeters, description, status, createdById, createdAt, updatedAt

## Business Rules
1. Chuỗi tọa độ của đường phải có ít nhất 2 điểm để tạo thành đoạn thẳng.
2. Loại đường chỉ được chọn từ danh mục đã được cấu hình (luồng, đê, kè).
3. Chiều dài tự nhiên của đường được tính từ chuỗi tọa độ và tự động cập nhật khi chỉnh sửa.
4. Chỉ Admin mới có quyền xóa đối tượng đường khỏi hệ thống.
5. Không cho phép đường cắt ngang qua đối tượng vùng đã được bảo vệ.

## Testing Strategy
Kiểm thử đơn vị các phương thức CRUD của service quản lý đường, kiểm thử tích hợp API REST với các payload geometry đa dạng, kiểm thử E2E trên giao diện bản đồ bằng Playwright/Cypress bao gồm vẽ đường mới và chỉnh sửa tọa độ, kiểm thử validation số lượng điểm tối thiểu, kiểm thử xuất GeoJSON đúng định thức.
