---
id: F-140
name: Tra cứu KCHT trên bản đồ
slug: tra-cuu-kcht-tren-ban-do
module-id: M-007
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Tra cứu KCHT trên bản đồ

## Description
Tra cứu và tìm kiếm thông tin cơ sở hạ tầng giao thông đường biển (KCHT) trên bản đồ GIS tương tác, cho phép người dùng khám phá, lọc, xem chi tiết và phân tích vị trí các đối tượng KCHT trực tiếp trên nền bản đồ với các công cụ hiển thị theo lớp thông tin, hỗ trợ ra quyết định nhanh trong quản lý và vận hành hệ thống hạ tầng hàng hải.

## Business Intent
Xây dựng hệ thống tra cứu KCHT trên bản đồ GIS nhằm cung cấp công cụ trực quan, nhanh chóng cho cán bộ quản lý tra cứu thông tin cơ sở hạ tầng tại hiện trường hoặc tại văn phòng, thay thế việc phải mở nhiều hồ sơ riêng lẻ, giúp tăng tốc độ ra quyết định, giảm thiểu sai sót do thiếu thông tin và hỗ trợ công tác phối hợp giữa các đơn vị liên quan trong quản lý hạ tầng hàng hải.

## Flow Summary
Người dùng truy cập giao diện bản đồ GIS và chọn mục tra cứu KCHT, sau đó thực hiện các thao tác: nhập từ khóa tìm kiếm (tên, mã, loại) hoặc chọn bộ lọc theo loại đối tượng, khu vực địa lý, tình trạng; hệ thống hiển thị kết quả dưới dạng các marker trên bản đồ và danh sách bên cạnh; click vào marker trên bản đồ để xem popup thông tin tóm tắt hoặc mở panel chi tiết; phóng to/thu nhỏ, di chuyển bản đồ để khám phá KCHT trong khu vực quan tâm; xuất kết quả tra cứu ra PDF hoặc Excel; lưu các bộ lọc yêu thích để tra cứu nhanh sau này.

## Acceptance Criteria
- Người dùng có thể nhập từ khóa hoặc chọn bộ lọc để tìm kiếm KCHT trên bản đồ, hệ thống hiển thị kết quả chính xác dưới dạng marker trên bản đồ và danh sách kết quả bên cạnh.
- Người dùng có thể click vào marker trên bản đồ để xem thông tin tóm tắt trong popup và mở panel chi tiết với đầy đủ thuộc tính, hình ảnh và hồ sơ kỹ thuật của đối tượng KCHT.
- Người dùng có thể lọc KCHT theo loại đối tượng (điểm/đường/vùng), danh mục, tình trạng và khu vực địa lý (bounding box), kết quả được cập nhật ngay lập tức trên bản đồ.
- Người dùng có thể xuất kết quả tra cứu ra định dạng PDF hoặc Excel với thông tin đầy đủ.
- Các bộ lọc tìm kiếm được lưu và có thể tái sử dụng trong các lần tra cứu sau.

## In Scope
- Tìm kiếm KCHT trên bản đồ GIS bằng từ khóa hoặc bộ lọc
- Hiển thị kết quả tra cứu dưới dạng marker và danh sách song song
- Xem thông tin chi tiết KCHT qua popup hoặc panel bên phải
- Lọc theo loại đối tượng, danh mục, tình trạng, khu vực địa lý
- Phóng to/thu nhỏ, di chuyển bản đồ để khám phá
- Xuất kết quả tra cứu PDF/Excel
- Lưu và tải lại bộ lọc yêu thích

## Out of Scope
- Chỉnh sửa thông tin KCHT (thuộc F-139)
- Quản lý danh mục đối tượng điểm, đường, vùng (thuộc F-136, F-137, F-138)
- Tính toán tuyến đường hoặc phân tích tối ưu hóa
- Tích hợp định vị GPS thời gian thực từ thiết bị di động
- Chia sẻ bản đồ theo thời gian thực với nhiều người dùng đồng thời

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Visitor | Tìm kiếm, xem thông tin tóm tắt, xuất kết quả |
| User | Tìm kiếm, xem chi tiết, lọc, xuất kết quả, lưu bộ lọc |
| Admin | Tất cả quyền của User, quản lý hiển thị lớp thông tin trên bản đồ |

## Entities
- **SearchResult**: kchtId, kchtCode, kchtName, objectType, category, conditionRating, latitude, longitude, matchScore
- **SavedFilter**: id, userId, filterCriteria (JSON), name, createdAt, lastUsedAt
- **MapViewport**: id, userId, centerLat, centerLng, zoomLevel, savedAt

## Business Rules
1. Kết quả tìm kiếm phải được sắp xếp theo mức độ phù hợp (match score) giảm dần.
2. Marker trên bản đồ phải được mã màu theo tình trạng: xanh (tốt), vàng (bình thường), đỏ (kém).
3. Tìm kiếm không phân biệt chữ hoa/thường và hỗ trợ tìm kiếm tiếng Việt có dấu.
4. Kết quả tra cứu không được vượt quá 1000 bản ghi trong một lần tìm kiếm.
5. Bộ lọc yêu thích chỉ được lưu tối đa 10 bộ lọc cho mỗi người dùng.

## Testing Strategy
Kiểm thử đơn vị các phương thức tìm kiếm và lọc của service tra cứu, kiểm thử tích hợp API REST với các query param khác nhau, kiểm thử E2E trên giao diện bản đồ bằng Playwright/Cypress bao gồm tìm kiếm, click marker, xem chi tiết, lọc, xuất kết quả và lưu bộ lọc, kiểm thử sắp xếp kết quả theo match score, kiểm thử phân trang khi kết quả > 1000, kiểm thử mã màu marker theo tình trạng, kiểm thử bảo mật API tra cứu không trả dữ liệu của đối tượng người dùng khác.
