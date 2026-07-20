---
id: F-104
name: Báo cáo hàng hóa xuất nhập khẩu
slug: bao-cao-hang-hoa-xuat-nhap-khau
module-id: M-008
status: proposed
classification: local
priority: medium
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Báo cáo hàng hóa xuất nhập khẩu

## Description
Báo cáo thống kê hàng hóa xuất nhập khẩu qua hệ thống cảng biển, bao gồm khối lượng, giá trị và loại hàng hóa xuất khẩu, nhập khẩu theo từng cảng, khu vực địa lý, đối tác thương mại và khoảng thời gian xác định. Báo cáo cung cấp cái nhìn toàn diện về tình hình thương mại biển, hỗ trợ công tác phân tích thị trường và ra quyết định chiến lược trong quản lý vận tải đường biển.

## Business Intent
Cung cấp báo cáo tổng hợp về hoạt động xuất nhập khẩu hàng hóa qua cảng, giúp cơ quan quản lý nhà nước và doanh nghiệp khai thác cảng theo dõi, đánh giá tình hình thương mại biển theo từng kỳ, xác định các mặt hàng chủ lực, các thị trường xuất nhập khẩu trọng điểm và xu hướng biến động để từ đó xây dựng chiến lược khai thác cảng và phát triển thương mại phù hợp với tình hình thực tế.

## Flow Summary
Hệ thống truy xuất dữ liệu giao dịch hàng hóa từ cơ sở dữ liệu lưu trữ thông tin nhập khẩu và xuất khẩu qua cảng, bao gồm mã hàng hóa, khối lượng, giá trị ước tính, cảng đi/cảng đến và đối tác thương mại. Người dùng chọn khoảng thời gian, cảng hoặc nhóm cảng cần phân tích, loại hàng hóa và hướng giao dịch (xuất khẩu, nhập khẩu hoặc cả hai). Hệ thống thực hiện tổng hợp số liệu theo từng nhóm hàng, từng cảng và từng hướng giao dịch, tính toán các chỉ tiêu so sánh (tổng khối lượng, tổng giá trị, tỷ lệ tăng trưởng so với kỳ trước). Kết quả được hiển thị dưới dạng bảng số liệu phân tích kèm biểu đồ cột và biểu đồ đường cho phép trực quan hóa xu hướng biến động. Người dùng có thể tạo báo cáo theo chu kỳ, lọc theo nhiều tiêu chí và xuất ra định dạng PDF hoặc Excel.

## Acceptance Criteria
1. Báo cáo hiển thị chính xác tổng khối lượng và tổng giá trị hàng hóa xuất nhập khẩu qua từng cảng trong khoảng thời gian được chọn, với độ sai số không vượt quá 0,1% so với hồ sơ giao dịch thực tế.
2. Người dùng có thể phân tích và so sánh khối lượng hàng hóa xuất khẩu với nhập khẩu theo từng loại hàng, từng cảng và từng tháng/quý/năm trong cùng một báo cáo.
3. Hệ thống tính toán và hiển thị chính xác tỷ lệ tăng trưởng (%) so với kỳ trước cho từng chỉ tiêu, làm tròn đến 2 chữ số thập phân và có cảnh báo khi tăng trưởng vượt quá ±20%.
4. Báo cáo có thể được xuất ra định dạng PDF và Excel, trong đó bao gồm bảng số liệu phân tích chi tiết, biểu đồ diễn biến và phần tóm tắt nhận định về tình hình thương mại trong kỳ.

## In Scope
- Thống kê tổng khối lượng và giá trị hàng hóa xuất khẩu theo loại hàng, cảng và thời gian
- Thống kê tổng khối lượng và giá trị hàng hóa nhập khẩu theo loại hàng, cảng và thời gian
- Phân tích so sánh xuất khẩu và nhập khẩu theo từng nhóm hàng và khu vực địa lý
- Tính toán và hiển thị xu hướng biến động (tăng trưởng %) so với kỳ trước
- Biểu đồ cột so sánh xuất nhập khẩu và biểu đồ đường diễn biến theo thời gian
- Xuất báo cáo định dạng PDF và Excel theo quy chuẩn

## Out of Scope
- Dữ liệu thương mại quốc tế qua các hình thức vận tải khác (đường bộ, đường sắt, hàng không)
- Dữ liệu hải quan chi tiết về tờ khai và thông quan (thuộc module quản lý hải quan)
- Hệ thống dự báo thương mại dựa trên AI hoặc machine learning
- Tích hợp trực tiếp với hệ thống thống kê thương mại của các cơ quan nhà nước

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Người dùng (User) | Xem báo cáo xuất nhập khẩu, lọc theo thời gian và cảng, xuất PDF/Excel |
| Chuyên viên phân tích | Tạo báo cáo chuyên sâu, điều chỉnh nhóm hàng và tiêu chí phân tích |
| Quản lý (Admin) | Quản lý phân loại hàng hóa, phân quyền người dùng, xem mọi báo cáo |
| Lãnh đạo (Leader) | Xem báo cáo tổng hợp, so sánh hiệu suất, nhận cảnh báo biến động |

## Entities
- **LoaiHangHoa**: id, maHang, tenHang, nhomHang, donViTinh, trangThai, createdAt, updatedAt
- **GiaoDichXNK**: id, cangId, loaiHangHoaId, soLuong, donViTinh, giaTriUSD, huongDi (xuat/nhap), thoiGianGiaoDich, doiTac, createdAt, updatedAt
- **DoiTacThuongMai**: id, tenDoiTac, quocGia, loaiDoiTac (xuat/nhap/ca2), diaChi, trangThai, createdAt, updatedAt
- **BaoCaoHangHoa**: id, tenBaoCao, khungThoiGian, cangIds, loaiHangHoaIds, huongDi, trangThai, nguoiTao, createdAt, updatedAt

## Business Rules
1. Dữ liệu giao dịch xuất nhập khẩu chỉ tính các lượt hàng hóa đã hoàn tất thủ tục giao nhận tại cảng, không tính hàng hóa đang trong quá trình vận chuyển hoặc chưa thông quan.
2. Loại hàng hóa được phân loại theo phân loại hàng hóa quốc gia (VN), với mã hàng tối thiểu 4 chữ số để đảm bảo tính đồng nhất giữa các cảng.
3. Tỷ lệ tăng trưởng được tính dựa trên so sánh cùng kỳ (tháng này so với tháng cùng năm trước) để loại trừ ảnh hưởng của yếu tố mùa vụ.
4. Giá trị USD được quy đổi theo tỷ giá trung tâm của Ngân hàng Nhà nước tại ngày giao dịch hoặc ngày cuối kỳ báo cáo, được ghi nhận rõ trong báo cáo.
5. Báo cáo xuất nhập khẩu phải đảm bảo tính pháp lý khi phục vụ công tác báo cáo thống kê thương mại của ngành giao thông vận tải và bộ công thương.

## Testing Strategy
Kiểm thử đơn vị các hàm tổng hợp và tính toán tỷ lệ tăng trưởng xuất nhập khẩu với các bộ dữ liệu mẫu đã được kiểm chứng độ chính xác. Kiểm thử tích hợp quy trình từ khi dữ liệu giao dịch XNK được ghi nhận đến khi báo cáo phân tích được hiển thị đúng cấu trúc và định dạng. Kiểm thử các trường hợp biên: không có giao dịch trong kỳ, chỉ có xuất khẩu hoặc chỉ có nhập khẩu, khoảng thời gian dài với nhiều biến động. Kiểm thử phân quyền xác nhận mỗi role chỉ có thể truy cập các mức độ báo cáo phù hợp với chức năng. Kiểm thử chấp nhận người dùng xác nhận chất lượng biểu đồ, bảng số liệu và khả năng xuất báo cáo theo định dạng yêu cầu.
