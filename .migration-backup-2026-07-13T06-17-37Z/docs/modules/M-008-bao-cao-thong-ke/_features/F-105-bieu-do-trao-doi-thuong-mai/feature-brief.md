---
id: F-105
name: Biểu đồ trao đổi thương mại
slug: bieu-do-trao-doi-thuong-mai
module-id: M-008
status: proposed
classification: local
priority: medium
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Biểu đồ trao đổi thương mại

## Description
Biểu đồ trực quan hóa dữ liệu trao đổi thương mại giữa các cảng biển, các vùng kinh tế và các quốc gia, bao gồm biểu đồ Sankey thể hiện luồng hàng hóa, biểu đồ cột so sánh khối lượng trao đổi và bản đồ nhiệt (heatmap) thể hiện mật độ thương mại theo khu vực địa lý, giúp người dùng nắm bắt nhanh cấu trúc và quy mô hoạt động thương mại biển trong hệ thống cảng.

## Business Intent
Cung cấp công cụ trực quan hóa mạnh mẽ để lãnh đạo cơ quan quản lý và doanh nghiệp khai thác cảng nhận diện các tuyến hàng hóa trọng điểm, xác định các đối tác thương mại chủ lực và xu hướng dịch chuyển luồng hàng hóa giữa các cảng và vùng lãnh thổ, từ đó hỗ trợ chiến lược phát triển hạ tầng cảng, marketing dịch vụ và phân bổ nguồn lực khai thác hiệu quả theo từng khu vực kinh tế trọng điểm.

## Flow Summary
Hệ thống truy xuất dữ liệu trao đổi thương mại từ cơ sở dữ liệu lưu trữ thông tin giao dịch hàng hóa giữa các cảng, kết hợp với dữ liệu địa lý để xác định vị trí và vùng kinh tế của từng cảng và đối tác thương mại. Người dùng chọn khung thời gian cần phân tích, loại hình biểu đồ mong muốn (Sankey, cột, heatmap), phạm vi địa lý (toàn hệ thống, theo vùng hoặc theo quốc gia). Hệ thống tính toán các luồng trao đổi theo từng cặp cảng hoặc vùng, xác định trọng lượng luồng (khối lượng hàng hóa hoặc giá trị giao dịch), sau đó hiển thị kết quả dưới dạng biểu đồ tương tác với khả năng phóng to, lọc theo loại hàng hóa hoặc đối tác, di chuyển con trỏ để xem chi tiết từng luồng. Người dùng có thể lưu lại hình ảnh biểu đồ và xuất dữ liệu thô ra Excel.

## Acceptance Criteria
1. Biểu đồ Sankey hiển thị chính xác các luồng trao đổi hàng hóa giữa các cảng với chiều rộng luồng tỷ lệ thuận với khối lượng hoặc giá trị giao dịch, đảm bảo tổng luồng đầu vào bằng tổng luồng đầu ra cho mỗi cảng.
2. Bản đồ nhiệt (heatmap) thể hiện mật độ thương mại giữa các cặp cảng hoặc vùng kinh tế, sử dụng thang màu rõ ràng từ thấp đến cao với các mức ngưỡng được quy định và có chú thích đi kèm.
3. Người dùng có thể lọc và phân tích trao đổi thương mại theo loại hàng hóa, theo quốc gia/vùng lãnh thổ và theo khoảng thời gian cụ thể, kết quả được cập nhật ngay lập tức trên biểu đồ.
4. Hệ thống xuất được biểu đồ dưới định dạng PNG hoặc PDF có chất lượng cao (tối thiểu 300 DPI) cùng với bảng dữ liệu nguồn trong file Excel để phục vụ công tác phân tích và báo cáo.

## In Scope
- Biểu đồ Sankey thể hiện luồng trao đổi hàng hóa giữa các cảng và vùng kinh tế
- Biểu đồ cột so sánh khối lượng/giá trị trao đổi theo quốc gia, vùng hoặc loại hàng hóa
- Bản đồ nhiệt (heatmap) thể hiện mật độ và cường độ trao đổi thương mại
- Lọc và phân tích theo loại hàng hóa, quốc gia, vùng lãnh thổ và khoảng thời gian
- Lưu và chia sẻ biểu đồ dưới định dạng hình ảnh và file dữ liệu
- Bộ lọc tương tác trên biểu đồ (phóng to, thu nhỏ, hover xem chi tiết)

## Out of Scope
- Dữ liệu thương mại quốc tế thô từ các nguồn bên ngoài chưa được xác thực
- Dữ liệu hải quan chi tiết về tờ khai, thông quan và thuế (thuộc module hải quan)
- Mô hình dự báo thương mại dựa trên AI, machine learning hoặc phân tích chuỗi thời gian
- Tích hợp trực tiếp với hệ thống thống kê thương mại của các cơ quan nhà nước

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Người dùng (User) | Xem biểu đồ trao đổi, lọc theo thời gian và đối tác, xuất PNG/PDF |
| Chuyên viên phân tích | Tạo và tùy chỉnh biểu đồ, xác thực dữ liệu nguồn, điều chỉnh thang màu |
| Quản lý (Admin) | Quản lý phân vùng địa lý, phân quyền người dùng, xem mọi biểu đồ |
| Lãnh đạo (Leader) | Xem báo cáo tổng hợp, so sánh giữa các khu vực, nhận cảnh báo biến động |

## Entities
- **CangBien**: id, tenCang, maCang, diaChi, toaDo, khuVuc, trangThai, createdAt, updatedAt
- **LuongThuongMai**: id, cangGoId, cangDenId, loaiHangHoa, khoiLuong, giaTri, thoiGian, doiTac, createdAt, updatedAt
- **KhuVucKinhTe**: id, tenKhuVuc, maKhuVuc, danhSachCangIds, phamViDiaLy, createdAt, updatedAt
- **BieuDoThuongMai**: id, tenBieuDo, loaiBieuDo, khungThoiGian, khuVucIds, trangThai, nguoiTao, createdAt, updatedAt

## Business Rules
1. Các luồng trao đổi thương mại chỉ tính các giao dịch đã hoàn tất tại cảng, không tính hàng hóa đang trong quá trình vận chuyển hoặc chuyển tải qua cảng trung gian.
2. Biểu đồ Sankey phải đảm bảo nguyên tắc cân bằng luồng: tổng lượng hàng hóa vào mỗi cảng phải bằng tổng lượng hàng hóa ra khỏi cảng đó trong kỳ báo cáo.
3. Bản đồ nhiệt sử dụng thang màu đồng nhất từ 5 đến 7 mức, với các ngưỡng được xác định dựa trên phân vị của dữ liệu (quartile hoặc decile) để đảm bảo tính so sánh giữa các kỳ.
4. Dữ liệu trao đổi thương mại phải được phân loại theo vùng kinh tế và quốc gia chuẩn theo phân loại của Tổng cục Thống kê và Tổ chức Thương mại Thế giới (WTO).
5. Biểu đồ phải ghi nhận rõ khoảng thời gian phân tích, nguồn dữ liệu và người yêu cầu tạo để đảm bảo tính minh bạch và trách nhiệm giải trình.

## Testing Strategy
Kiểm thử đơn vị các hàm tính toán luồng trao đổi và xác nhận nguyên tắc cân bằng luồng đầu vào/đầu ra cho từng cảng trong biểu đồ Sankey. Kiểm thử tích hợp quy trình từ khi dữ liệu giao dịch thương mại được ghi nhận đến khi các biểu đồ Sankey, cột và heatmap được hiển thị đúng cấu trúc và tương tác mượt mà. Kiểm thử các trường hợp biên: một cảng chỉ có xuất khẩu hoặc chỉ có nhập khẩu, dữ liệu thương mại tập trung vào một cặp cảng duy nhất, khoảng thời gian ngắn với ít giao dịch. Kiểm thử giao diện người dùng xác nhận khả năng lọc theo nhiều tiêu chí, phóng to/thu nhỏ, hover xem chi tiết từng luồng và chất lượng file xuất ảnh. Kiểm thử chấp nhận người dùng xác nhận tính trực quan, chính xác và hữu ích của các biểu đồ thương mại đối với công tác ra quyết định.
