---
id: F-102
name: Biểu thống kê hàng hải
slug: bieu-thong-ke-hang-hai
module-id: M-008
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Biểu thống kê hàng hải

## Description
Biểu đồ và bảng thống kê hoạt động hàng hải tại các cảng biển và khu vực giao thông đường thủy, bao gồm số lượng tàu ra vào cảng, khối lượng hàng hóa thông qua, tỷ lệ sử dụng bến cảng và các chỉ số hiệu suất khai thác cảng theo các kỳ báo cáo định kỳ. Hệ thống hỗ trợ trực quan hóa dữ liệu dưới dạng biểu đồ đường, cột, tròn và bảng tổng hợp, đáp ứng yêu cầu thống kê theo thông tư 48/2015/TT-BGTVT và các quy định về thống kê ngành giao thông vận tải.

## Business Intent
Cung cấp công cụ trực quan hóa dữ liệu hàng hải giúp lãnh đạo cơ quan quản lý và đơn vị khai thác cảng nắm bắt nhanh chóng tình hình hoạt động vận tải biển, đánh giá hiệu suất khai thác cảng, xác định xu hướng biến động lưu lượng hàng hóa và phương tiện từ đó tối ưu hóa kế hoạch khai thác bến cảng và phân bổ nguồn lực vận hành theo đúng quy định thống kê của ngành hàng hải.

## Flow Summary
Hệ thống kết nối với cơ sở dữ liệu lưu trữ thông tin tàu thuyền ra vào cảng và giao dịch hàng hóa thông qua. Người dùng lựa chọn kỳ báo cáo (tháng/quý/năm), cảng hoặc khu vực cần thống kê và loại biểu đồ mong muốn (đường, cột, tròn, kết hợp). Hệ thống truy xuất dữ liệu, thực hiện các phép tính aggregations (tổng, trung bình, tỷ lệ phần trăm) theo các tiêu chí đã chọn, sau đó hiển thị kết quả dưới dạng biểu đồ tương tác cho phép phóng to, thu nhỏ, di chuyển con trỏ để xem giá trị cụ thể. Người dùng có thể lưu lại biểu đồ dưới dạng hình ảnh hoặc xuất dữ liệu thô ra Excel để phân tích tiếp.

## Acceptance Criteria
1. Biểu đồ số lượng tàu ra/vào cảng được cập nhật tự động khi có dữ liệu mới từ hệ thống đăng ký tàu thuyền, đảm bảo độ trễ không quá 1 giờ so với thời điểm giao dịch thực tế.
2. Người dùng có thể chọn nhiều kỳ báo cáo để so sánh trên cùng một biểu đồ, với các mức granular (ngày, tuần, tháng, quý, năm) và tùy chọn lọc theo loại tàu, cảng hoặc hàng hóa.
3. Dữ liệu thống kê hàng hóa thông qua hiển thị chính xác khối lượng (tấn), số lượng container (TEU) và tỷ lệ tăng trưởng so với kỳ trước, được làm tròn đúng 2 chữ số thập phân.
4. Hệ thống xuất được biểu đồ dưới định dạng PNG hoặc PDF có kích thước phù hợp cho in ấn (tối thiểu 300 DPI) và bảng dữ liệu số kèm theo trong file Excel.

## In Scope
- Thống kê số lượng tàu ra/vào cảng theo ngày, tuần, tháng, quý, năm
- Thống kê khối lượng hàng hóa thông qua theo loại hàng và cảng
- Tính toán tỷ lệ sử dụng bến cảng và các chỉ số hiệu suất khai thác
- Hiển thị biểu đồ đường, cột, tròn và kết hợp với các tùy chọn tương tác
- Xuất dữ liệu biểu đồ và bảng số liệu sang PNG, PDF và Excel
- Bộ lọc theo thời gian, cảng, loại tàu và loại hàng hóa

## Out of Scope
- Dữ liệu thủy văn (thuộc F-101 Báo cáo tổng hợp thủy văn)
- Hệ thống giám sát AIS real-time và VTS (thuộc module M-009)
- Dashboard điều độ cảng trực tuyến với cập nhật từng giây
- Phân tích dự báo vận tải biển dựa trên AI/machine learning

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Người dùng (User) | Xem biểu thống kê, lọc theo thời gian và cảng, xuất PNG/PDF |
| Chuyên viên thống kê | Tạo và điều chỉnh chỉ tiêu thống kê, xác nhận độ chính xác dữ liệu |
| Quản lý cảng | Xem mọi biểu thống kê, xuất báo cáo tổng hợp, phân quyền người dùng |
| Giám đốc (Director) | Xem báo cáo tổng hợp, so sánh hiệu suất giữa các cảng, nhận cảnh báo |

## Entities
- **CangBien**: id, tenCang, maCang, diaChi, khuVuc, congSuattTiepNhan, trangThai, createdAt, updatedAt
- **TuaThuyen**: id, tenTua, maTua, loaiTua, tongTai, kichThuoc, quocTich, createdAt, updatedAt
- **GiaoDichHangHoa**: id, cangId, tuaId, loaiHangHoa, khoiLuong, donViTinh, thoiGianGiaoDich, huongDi, createdAt
- **BieuThongKeHangHai**: id, tenBieuThongKe, loaiBieuDo, khungThoiGian, cangIds, trangThai, nguoiTao, createdAt, updatedAt

## Business Rules
1. Số liệu thống kê tàu thuyền chỉ tính các chuyến đã hoàn tất (đã cập cảng và đã rời cảng), loại trừ các tàu đang trong quá trình neo đậu hoặc chờ xếp dỡ.
2. Khối lượng hàng hóa thông qua được tính theo trọng lượng thực tế đã cân xác nhận, không dùng giá trị ước tính từ khai đơn.
3. Tỷ lệ sử dụng bến cảng được tính bằng tỷ số giữa thời gian tàu thực tế neo đậu và tổng thời gian ca làm việc trong kỳ báo cáo.
4. Các biểu đồ so sánh giữa các kỳ phải sử dụng cùng một thang đo và cùng một bộ tiêu chí thống kê để đảm bảo tính so sánh công bằng.
5. Dữ liệu xuất báo cáo phải ghi nhận nguồn gốc, thời điểm xuất và người yêu cầu để phục vụ công tác thẩm tra, kiểm toán.

## Testing Strategy
Kiểm thử đơn vị các hàm aggregations (SUM, AVG, COUNT, tỷ lệ phần trăm) trên tập dữ liệu mẫu đã được kiểm chứng độ chính xác. Kiểm thử tích hợp quy trình từ khi dữ liệu tàu thuyền/hàng hóa được nhập vào đến khi biểu đồ và bảng thống kê được hiển thị hoàn chỉnh. Kiểm thử các trường hợp biên: kỳ báo cáo rỗng dữ liệu, dữ liệu không đồng đều giữa các tháng, khoảng thời gian dài (nhiều năm) với khối lượng lớn. Kiểm thử giao diện người dùng xác nhận khả năng tương tác với biểu đồ (phóng to, hover xem giá trị, chọn nhiều kỳ) và chất lượng file xuất (độ phân giải, định dạng).
