---
id: F-140
name: Tra cứu KCHT trên bản đồ
slug: tra-cuu-kcht-tren-ban-do
module-id: M-007
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-09-03T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Tra cứu KCHT trên bản đồ

## Description
Tra cứu và tìm kiếm thông tin cơ sở hạ tầng giao thông đường biển (KCHT) trên bản đồ GIS tương tác, cho phép người dùng khám phá, lọc, xem chi tiết và phân tích vị trí các đối tượng KCHT trực tiếp trên nền bản đồ với các công cụ hiển thị theo lớp thông tin, hỗ trợ ra quyết định nhanh trong quản lý và vận hành hệ thống hạ tầng hàng hải.

## Business Intent
Xây dựng hệ thống tra cứu KCHT trên bản đồ GIS nhằm cung cấp công cụ trực quan, nhanh chóng cho cán bộ quản lý tra cứu thông tin cơ sở hạ tầng tại hiện trường hoặc tại văn phòng, thay thế việc phải mở nhiều hồ sơ riêng lẻ, giúp tăng tốc độ ra quyết định, giảm thiểu sai sót do thiếu thông tin và hỗ trợ công tác phối hợp giữa các đơn vị liên quan trong quản lý hạ tầng hàng hải.

## Flow Summary
Người dùng truy cập giao diện bản đồ GIS và chọn mục tra cứu KCHT, sau đó thực hiện các thao tác: nhập từ khóa tìm kiếm (tên, mã, loại) hoặc chọn bộ lọc theo loại đối tượng, khu vực địa lý, tình trạng; hệ thống hiển thị đối tượng điểm bằng marker, đối tượng đường/vùng bằng hình học thật và danh sách bên cạnh; click trực tiếp vào marker hoặc hình học để xem popup thông tin; phóng to/thu nhỏ, di chuyển bản đồ để khám phá KCHT trong khu vực quan tâm; xuất kết quả tra cứu ra PDF hoặc Excel; lưu các bộ lọc yêu thích để tra cứu nhanh sau này.

## Acceptance Criteria
- Người dùng có quyền xem dữ liệu nhìn thấy nhóm menu "Quản lý KCHT trên nền bản đồ (GIS)" và có thể mở màn tra cứu bản đồ từ thanh menu chính.
- Người dùng có thể nhập từ khóa hoặc chọn bộ lọc để tìm kiếm KCHT trên bản đồ; đối tượng điểm hiển thị bằng marker, đối tượng đường/vùng hiển thị bằng hình học thật và tất cả kết quả xuất hiện trong danh sách bên cạnh.
- Người dùng có thể click vào marker điểm hoặc bất kỳ vị trí hợp lệ trên đường/vùng để xem thông tin tóm tắt trong popup. Nếu KCHT chồng lên quy hoạch cảng biển hoặc có nhiều KCHT cùng vị trí, hệ thống hiển thị danh sách nguồn/đối tượng để người dùng chọn; cả hai loại dữ liệu đều phải truy cập được, không phụ thuộc thứ tự lớp hiển thị.
- Khi mới mở màn hình, bộ lọc Đơn vị quản lý giữ giá trị "Tất cả đơn vị" như logic cũ và hệ thống tự tải danh sách KCHT thuộc phạm vi quyền của tài khoản. Sau khi Đặt lại, hệ thống khôi phục "Tất cả đơn vị" và tự tải lại danh sách. Lớp Quy hoạch cảng biển vẫn được điều khiển độc lập trong Quản lý lớp bản đồ.
- Bộ lọc Loại kết cấu hạ tầng hỗ trợ chọn nhiều nhưng luôn giữ một dòng; tối đa hai thẻ được hiển thị trực tiếp, phần còn lại thu gọn thành `+N` và có nội dung đầy đủ khi hover.
- Bảng kết quả dùng cỡ chữ nội dung chuẩn; nhóm phóng to, thu nhỏ và toàn màn hình nằm dọc ở góc phải. Nhóm vẽ nhanh đa giác, vùng tròn và chỉnh sửa nằm ở góc trái dưới, không bị panel tra cứu che.
- Click chuột phải trên bản đồ hiển thị kinh độ, vĩ độ, mức thu phóng và cho phép sao chép đường dẫn mở lại đúng vị trí đó.
- Popup Quy hoạch cảng biển ưu tiên chiều ngang để hạn chế xuống dòng, dùng cỡ chữ nội dung chuẩn 13px và tiêu đề 15px; không lặp nhãn loại đối tượng và chỉ cuộn khi nội dung vượt quá vùng hiển thị.
- Popup KCHT hiển thị nhãn nghiệp vụ thay cho mã thô đối với tỉnh/thành phố, loại kết cấu, trạng thái hoạt động và luồng hàng hải; marker ưu tiên biểu tượng được gán cho bản ghi, sau đó mới dùng biểu tượng mặc định theo loại KCHT.
- Chú giải bản đồ liệt kê biểu tượng của từng loại KCHT và quy ước màu/đường của lớp Quy hoạch cảng biển.
- Người dùng có thể lọc KCHT theo loại đối tượng (điểm/đường/vùng), danh mục, tình trạng và khu vực địa lý (bounding box), kết quả được cập nhật ngay lập tức trên bản đồ.
- Người dùng có thể xuất kết quả tra cứu ra định dạng PDF hoặc Excel với thông tin đầy đủ.
- Các bộ lọc tìm kiếm được lưu và có thể tái sử dụng trong các lần tra cứu sau.

## In Scope
- Tìm kiếm KCHT trên bản đồ GIS bằng từ khóa hoặc bộ lọc
- Hiển thị kết quả tra cứu dưới dạng marker điểm, hình học đường/vùng và danh sách song song
- Xem thông tin chi tiết KCHT qua popup hoặc panel bên phải
- Lọc theo loại đối tượng, danh mục, tình trạng, khu vực địa lý
- Phóng to/thu nhỏ, di chuyển bản đồ để khám phá
- Xem toàn màn hình, sao chép liên kết vị trí và dùng các công cụ vẽ nhanh trên bản đồ
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
2. Marker điểm và hình học đường/vùng trên bản đồ phải được mã màu theo tình trạng: xanh (tốt), vàng (bình thường), đỏ (kém).
3. Tìm kiếm không phân biệt chữ hoa/thường và hỗ trợ tìm kiếm tiếng Việt có dấu.
4. Kết quả tra cứu không được vượt quá 1000 bản ghi trong một lần tìm kiếm.
5. Bộ lọc yêu thích chỉ được lưu tối đa 10 bộ lọc cho mỗi người dùng.

## Testing Strategy
Kiểm thử đơn vị các phương thức tìm kiếm, lọc và hit-test Point/LineString/Polygon; kiểm thử tích hợp API REST với các query param khác nhau; kiểm thử E2E trên giao diện bản đồ bằng Playwright/Cypress bao gồm click marker điểm, click đường, click vùng, chọn được cả quy hoạch cảng biển và KCHT khi chồng lấn, xem chi tiết, lọc, xuất kết quả và lưu bộ lọc; kiểm thử sắp xếp kết quả theo match score, phân trang khi kết quả > 1000, mã màu theo tình trạng và bảo mật API tra cứu không trả dữ liệu ngoài phạm vi người dùng.
