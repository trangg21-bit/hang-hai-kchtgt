---
id: F-138
name: Quản lý danh mục đối tượng vùng
slug: quan-ly-danh-muc-doi-tuong-vung
module-id: M-007
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý danh mục đối tượng vùng

## Description
Quản lý toàn bộ vòng đời của danh mục đối tượng vùng trên bản đồ GIS bao gồm vùng nước và khu neo đậu, cho phép tạo mới, chỉnh sửa vùng địa lý đa giác (polygon) và xóa dữ liệu với đầy đủ kiểm tra tính toàn vẹn không gian và chồng lấn.

## Business Intent
Xây dựng hệ thống quản lý danh mục đối tượng vùng chuẩn hóa nhằm số hóa các vùng nước và khu vực neo đậu tàu thuyền, hỗ trợ công tác quy hoạch cảng biển và quản lý không gian biển, giúp người dùng xác định ranh giới vùng, kiểm tra chồng lấn và phân tích khả năng sử dụng khu vực neo đậu.

## Flow Summary
Người dùng truy cập giao diện bản đồ GIS và chọn menu quản lý danh mục đối tượng vùng, sau đó thực hiện các thao tác: tạo mới vùng đa giác bằng cách click các đỉnh trên bản đồ hoặc nhập tọa độ, thêm thông tin thuộc tính (tên, loại vùng, diện tích, mục đích sử dụng); chỉnh sửa hình dạng hoặc thông tin của vùng đã tồn tại; xem chi tiết vùng trên bản đồ với thông tin diện tích và danh giới; xóa hoặc vô hiệu hóa vùng khi cần. Hệ thống tự động tính diện tích vùng và kiểm tra chồng lấn với các vùng đã tồn tại.

## Acceptance Criteria
- Người dùng có thể tạo mới một đối tượng vùng GIS với đa giác đóng (≥ 3 điểm) và các trường thuộc tính (tên, loại vùng, diện tích, mô tả, trạng thái), hệ thống lưu thành công và hiển thị vùng trên bản đồ.
- Người dùng có thể chỉnh sửa đa giác hoặc thông tin thuộc tính của một đối tượng vùng đã tồn tại, thay đổi được lưu chính xác và hiển thị cập nhật trên bản đồ với diện tích tự động tính lại.
- Người dùng có thể xóa một đối tượng vùng khỏi danh mục; hệ thống xác nhận trước khi xóa và vùng biến mất khỏi bản đồ sau khi xác nhận.
- Hệ thống không cho phép tạo vùng có ít hơn 3 điểm tọa độ và cảnh báo khi vùng bị tự cắt (self-intersecting polygon).
- Dữ liệu vùng có thể xuất ra định dạng GeoJSON với đầy đủ geometry và metadata.

## In Scope
- Tạo mới, chỉnh sửa, xóa, xem chi tiết đối tượng vùng GIS
- Quản lý danh mục loại vùng: vùng nước, khu neo đậu, khu chờ tàu
- Hiển thị vùng trên bản đồ GIS tương tác với màu sắc phân biệt theo loại
- Tìm kiếm và lọc đối tượng vùng theo loại, tên, trạng thái
- Xuất dữ liệu vùng định dạng GeoJSON
- Ghi nhật ký thao tác người dùng
- Tính toán diện tích tự động của vùng
- Kiểm tra chồng lấn giữa các vùng

## Out of Scope
- Quản lý đối tượng điểm và đường (thuộc F-136, F-137)
- Phân tích độ sâu nước hoặc bản đồ địa hình đáy biển
- Tích hợp với hệ thống AIS để hiển thị vị trí tàu trong vùng neo đậu
- Quản lý cho thuê hoặc phân bổ vùng cho doanh nghiệp

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Visitor | Xem, tìm kiếm vùng trên bản đồ |
| User | Xem, tạo mới, chỉnh sửa vùng |
| Admin | Tạo, chỉnh sửa, xóa vùng, quản lý danh mục loại vùng |

## Entities
- **RegionObject**: id, name, regionType (water_area/anchorage/waiting_zone), polygonCoordinates (Point[]), areaSquareMeters, description, status, createdById, createdAt, updatedAt

## Business Rules
1. Đa giác vùng phải có ít nhất 3 điểm và điểm cuối phải trùng điểm đầu để tạo vùng đóng.
2. Loại vùng chỉ được chọn từ danh mục đã được cấu hình (vùng nước, khu neo đậu, khu chờ tàu).
3. Diện tích tự động tính từ đa giác tọa độ và tự động cập nhật khi chỉnh sửa.
4. Hệ thống cảnh báo khi vùng mới chồng lấn với vùng đã tồn tại ≥ 10% diện tích.
5. Chỉ Admin mới có quyền xóa đối tượng vùng khỏi hệ thống.

## Testing Strategy
Kiểm thử đơn vị các phương thức CRUD của service quản lý vùng, kiểm thử tích hợp API REST với các payload polygon phức tạp, kiểm thử E2E trên giao diện bản đồ bằng Playwright/Cypress bao gồm vẽ đa giác mới và chỉnh sửa đỉnh, kiểm thử validation số lượng điểm tối thiểu và phát hiện self-intersecting, kiểm thử tính diện tích chính xác, kiểm thử cảnh báo chồng lấn.
