---
id: F-101
name: Báo cáo tổng hợp thủy văn
slug: bao-cao-tong-hop-thuy-van
module-id: M-008
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Báo cáo tổng hợp thủy văn

## Description
Báo cáo tổng hợp số liệu thủy văn bao gồm mực nước, lưu lượng dòng chảy, biên độ và thời gian thủy triều tại các trạm quan trắc dọc theo tuyến đường thủy nội địa và ven biển, phục vụ công tác quản lý an toàn giao thông đường thủy và quy hoạch hạ tầng giao thông. Báo cáo tuân thủ các quy chuẩn kỹ thuật theo thông tư 48/2015/TT-BGTVT, thông tư 67/2014/TT-BTNMT và nghị định 43/2022/NĐ-CP.

## Business Intent
Tạo báo cáo tổng hợp dữ liệu thủy văn định kỳ và theo yêu cầu, giúp cơ quan quản lý và đơn vị khai thác đường thủy nắm bắt tình hình diễn biến thủy văn tại các khu vực trọng điểm, từ đó hỗ trợ ra quyết định trong công tác điều hành giao thông đường thủy, cảnh báo thiên tai và quy hoạch hệ thống cảng biển theo các quy định hiện hành của Bộ Giao thông Vận tải và Bộ Tài nguyên Môi trường.

## Flow Summary
Hệ thống thu thập số liệu thủy văn từ các trạm quan trắc tự động và thủ công, bao gồm mực nước tức thời, lưu lượng trung bình ngày, chu kỳ triều lên/triều xuống. Người dùng truy cập giao diện báo cáo, chọn khung thời gian (ngày/tuần/tháng/quý/năm), khu vực địa lý và các trạm quan trắc cần phân tích. Hệ thống thực hiện tổng hợp, tính toán các chỉ tiêu thống kê (trung bình, tối đa, tối thiểu, độ lệch chuẩn) và hiển thị kết quả dưới dạng bảng số liệu kèm biểu đồ diễn biến theo thời gian. Người dùng có thể lọc, so sánh giữa các kỳ và xuất báo cáo định dạng PDF hoặc Excel để phục vụ công tác báo cáo quản lý nhà nước.

## Acceptance Criteria
1. Hệ thống hiển thị đầy đủ các chỉ tiêu thủy văn (mực nước, lưu lượng, triều) cho trạm được chọn trong khoảng thời gian người dùng yêu cầu, dữ liệu được cập nhật trong vòng 24 giờ kể từ thời điểm quan trắc.
2. Báo cáo tự động tính toán và hiển thị các thống kê mô tả (trung bình, max, min, độ lệch chuẩn) cho mỗi chỉ tiêu theo từng kỳ báo cáo được chọn.
3. Người dùng có thể xuất báo cáo ra định dạng PDF hoặc Excel theo mẫu chuẩn TT48/TT67/ND43, file xuất ra phải chứa đầy đủ thông tin tiêu đề báo cáo, đơn vị tính, đơn vị lập và ngày lập.
4. Giao diện cho phép người dùng chọn nhiều trạm quan trắc cùng lúc, so sánh diễn biến các chỉ tiêu trên cùng biểu đồ và lọc theo ngưỡng mực nước cảnh báo.

## In Scope
- Thu thập và lưu trữ dữ liệu thủy văn từ các trạm quan trắc
- Tính toán các chỉ tiêu thống kê thủy văn (trung bình, max, min, độ lệch chuẩn)
- Hiển thị biểu đồ diễn biến mực nước, lưu lượng và thủy triều theo thời gian
- Xuất báo cáo định dạng PDF và Excel theo quy chuẩn
- Bộ lọc theo thời gian, khu vực địa lý và trạm quan trắc

## Out of Scope
- Dữ liệu thời tiết (nhiệt độ, gió, mưa) thuộc về module khí tượng riêng
- Dữ liệu hải văn (sóng, dòng hải lưu biển khơi) thuộc module riêng
- Dự báo thủy văn dựa trên mô hình AI/ML thuộc module phân tích dự báo
- Tích hợp trực tiếp với hệ thống quan trắc tự động (chỉ xử lý dữ liệu đã có trong cơ sở dữ liệu)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Người dùng (User) | Xem báo cáo, lọc theo thời gian và khu vực, xuất PDF/Excel |
| Chuyên viên thủy văn | Tạo và điều chỉnh ngưỡng cảnh báo, xác thực dữ liệu quan trắc |
| Quản lý (Admin) | Quản lý trạm quan trắc, phân quyền người dùng, xem mọi báo cáo |
| Kế toán (Accountant) | Xem báo cáo thủy văn liên quan đến chi phí vận hành đường thủy |

## Entities
- **ThangQuanTrac**: id, tenThang, maThang, toaDo, khuVuc, trangThai, createdAt, updatedAt
- **SoLieuThuyVan**: id, thangQuanTracId, loaiSoLieu, giaTri, donViTinh, thoiGianQuanTrac, nguonDuLieu, createdAt
- **BaoCaoThuyVan**: id, tenBaoCao, khungThoiGianBatDau, khungThoiGianKetThuc, danhSachThangIds, trangThai, nguoiTao, createdAt, updatedAt
- **Ng Canh Bao Thuy Van**: id, thangQuanTracId, loaiSoLieu, ngCanh BaoYeu, ngCanh BaoCanh Bao, ngCanh BaoNguy Hai, createdAt, updatedAt

## Business Rules
1. Số liệu thủy văn được tính từ các trạm quan trắc đã được cấp phép và đăng ký trong hệ thống, loại trừ các trạm chưa được xác thực trạng thái hoạt động.
2. Báo cáo tổng hợp phải tuân thủ mẫu biểu theo thông tư 48/2015/TT-BGTVT cho báo cáo nội địa và thông tư 67/2014/TT-BTNMT cho báo cáo môi trường tài nguyên nước.
3. Các chỉ tiêu thống kê (trung bình, max, min) được tính dựa trên số liệu thực tế đã qua kiểm tra chất lượng, không tính các giá trị ngoại lai đã được đánh dấu.
4. Ngưỡng cảnh báo được phân thành 3 mức: mức 1 (cảnh báo nhẹ), mức 2 (cảnh báo nghiêm trọng), mức 3 (mức nguy hiểm), được điều chỉnh theo mùa và vị trí địa lý cụ thể.
5. Báo cáo phải ghi nhận đầy đủ ngày lập, đơn vị lập và người duyệt để đảm bảo tính pháp lý của báo cáo quản lý nhà nước.

## Testing Strategy
Kiểm thử đơn vị các hàm tính toán thống kê thủy văn (trung bình, max, min, độ lệch chuẩn) với các bộ dữ liệu mẫu đã được kiểm chứng. Kiểm thử tích hợp quy trình thu thập số liệu từ nhiều trạm quan trắc, tổng hợp theo kỳ và sinh báo cáo cuối cùng. Kiểm thử biên với các giá trị mực nước cực đại, cực tiểu và các khoảng thời gian đặc biệt (đầu/năm, cuối quý). Kiểm thử chấp nhận người dùng xác nhận giao diện lọc, so sánh và xuất báo cáo đáp ứng yêu cầu nghiệp vụ theo các quy chuẩn hiện hành.
