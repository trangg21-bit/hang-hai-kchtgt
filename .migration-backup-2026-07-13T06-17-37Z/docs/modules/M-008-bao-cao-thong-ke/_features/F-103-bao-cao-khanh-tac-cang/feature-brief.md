---
id: F-103
name: Báo cáo khánh tác cảng
slug: bao-cao-khanh-tac-cang
module-id: M-008
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Báo cáo khánh tác cảng

## Description
Báo cáo hiệu suất hoạt động cảng bao gồm thời gian tàu chờ tại cảng, thời gian bốc dỡ hàng, tỷ lệ sử dụng bến cảng và các chỉ số hiệu suất vận hành then chốt (KPIs) giúp đánh giá năng lực khai thác và chất lượng dịch vụ của hệ thống cảng biển theo các kỳ báo cáo định kỳ, phục vụ công tác quản lý và cải tiến quy trình khai thác cảng biển.

## Business Intent
Cung cấp báo cáo định lượng về hiệu suất vận hành cảng, giúp lãnh đạo đơn vị khai thác cảng và cơ quan quản lý nhà nước đánh giá tình hình khai thác bến cảng, phát hiện các điểm nghẽn trong quy trình vận hành, so sánh hiệu suất giữa các bến và các kỳ thời gian để từ đó có biện pháp cải tiến hiệu quả, tối ưu hóa lịch tàu neo đậu và nâng cao chất lượng dịch vụ theo tiêu chuẩn ngành hàng hải quốc tế.

## Flow Summary
Hệ thống thu thập dữ liệu vận hành cảng từ các hệ thống đăng ký tàu thuyền, hệ thống quản lý cảng (Terminal Operating System) và các nguồn ghi nhận thủ công. Người dùng lựa chọn cảng cần phân tích, kỳ báo cáo và các chỉ số KPI quan tâm (thời gian chờ trung bình, thời gian bốc dỡ trung bình, tỷ lệ utilization, số lượt tàu trung bình/ngày). Hệ thống truy xuất dữ liệu thô, thực hiện các phép tính tổng hợp và so sánh (tương quan, tăng trưởng theo kỳ), sau đó hiển thị kết quả dưới dạng bảng số liệu kèm biểu đồ đường và cột, đồng thời đánh dấu các chỉ số vượt ngưỡng cảnh báo hoặc dưới mức mục tiêu. Người dùng có thể tạo báo cáo tự động theo chu kỳ, chia sẻ với các bên liên quan và xuất báo cáo ra PDF hoặc Excel.

## Acceptance Criteria
1. Thời gian chờ tàu trung bình tại cảng được tính chính xác từ thời điểm tàu thông báo đến (ARR) đến thời điểm tàu có thể neo đậu tại bến (BERTH), với sai số không quá 15 phút so với hồ sơ đi tàu thực tế.
2. Tỷ lệ sử dụng bến cảng được tính đúng theo công thức (thời gian tàu neo đậu / tổng thời gian ca làm việc) × 100%, hiển thị chính xác 2 chữ số thập phân và có thể lọc theo từng bến cụ thể.
3. Hệ thống tự động đánh dấu cảnh báo khi thời gian chờ tàu vượt quá ngưỡng quy định (tùy cảng) hoặc khi tỷ lệ utilization của bến xuống dưới 50% trong 2 kỳ liên tiếp.
4. Báo cáo có thể được xuất dưới định dạng PDF và Excel, trong đó bao gồm đầy đủ các chỉ số KPI, biểu đồ diễn biến theo thời gian và phần nhận định ngắn gọn về hiệu suất của kỳ báo cáo.

## In Scope
- Thống kê thời gian chờ tàu trung bình theo ngày, tuần, tháng, quý, năm
- Thống kê thời gian bốc/dỡ hàng trung bình theo loại tàu và loại hàng hóa
- Tính toán tỷ lệ sử dụng (utilization) của từng bến cảng theo kỳ
- Báo cáo hiệu suất tổng hợp với các chỉ số KPI chính của cảng
- Export báo cáo định dạng PDF và Excel với định dạng theo quy chuẩn
- Hệ thống cảnh báo tự động khi các chỉ số vượt ngưỡng quy định

## Out of Scope
- Dữ liệu AIS real-time và hệ thống theo dõi tàu trực tiếp (thuộc M-009)
- Hệ thống VTS (Vessel Traffic Service) và điều độ tàu trực tiếp
- Dashboard điều độ cảng với cập nhật từng giây
- Tích hợp trực tiếp với Terminal Operating System của từng cảng riêng lẻ

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Người dùng (User) | Xem báo cáo hiệu suất, lọc theo thời gian và bến cảng |
| Giám đốc vận hành | Tạo báo cáo KPI, điều chỉnh ngưỡng cảnh báo, phân tích nguyên nhân |
| Quản lý cảng | Xem mọi báo cáo, xuất báo cáo tổng hợp, phân quyền người dùng |
| Giám đốc điều hành | Xem báo cáo hiệu suất tổng hợp, so sánh giữa các cảng, phê duyệt |

## Entities
- **BenCang**: id, tenBen, maBen, cangId, doDai, chieuRong, doSauToiDa, trangThai, createdAt, updatedAt
- **TuaNeBo**: id, tuaId, benCangId, thoiGianDen, thoiGianRa, loaiTua, loaiHangHoa, trangThai, createdAt, updatedAt
- **HoatDongBocDo**: id, tuaNeBoId, loaiHangHoa, khoiLuong, thoiGianBatDau, thoiGianKetThuc, donViThucHien, createdAt
- **KPI_Cang**: id, cangId, kyBaoCao, thoiGianChoTrungBinh, thoiGianBocDoTrungBinh, tyLeUtilization, soLuotTua, createdAt, updatedAt

## Business Rules
1. Thời gian chờ tàu chỉ được tính cho các tàu đã hoàn tất quá trình neo đậu và rời cảng, không tính các trường hợp hủy chuyến hoặc tàu chuyển sang cảng khác.
2. Tỷ lệ sử dụng bến cảng tính theo ca làm việc thực tế, loại trừ các ngày nghỉ lễ, tết và thời gian bảo dưỡng định kỳ của bến đã được ghi nhận.
3. Các chỉ số KPI của cảng được tổng hợp theo tháng và quý, so sánh với chỉ tiêu kế hoạch đã được phê duyệt trong năm tài chính.
4. Ngưỡng cảnh báo thời gian chờ tàu và tỷ lệ utilization được điều chỉnh theo đặc thù từng cảng và mùa vụ khai thác, được quản lý bởi ban giám đốc.
5. Báo cáo hiệu suất phải ghi nhận rõ nguồn dữ liệu, thời điểm tổng hợp và người phê duyệt để đảm bảo tính pháp lý và trách nhiệm giải trình.

## Testing Strategy
Kiểm thử đơn vị các hàm tính toán KPI (thời gian chờ trung bình, thời gian bốc dỡ trung bình, tỷ lệ utilization) với các bộ dữ liệu mẫu đã được kiểm chứng. Kiểm thử tích hợp toàn bộ quy trình từ khi dữ liệu tàu neo đậu và hoạt động bốc dỡ được ghi nhận đến khi báo cáo KPI được sinh ra và hiển thị đúng định dạng. Kiểm thử các trường hợp biên: cảng không có hoạt động trong kỳ, thời gian chờ bằng 0, tỷ lệ utilization đạt 100% hoặc 0%. Kiểm thử cảnh báo tự động xác nhận hệ thống kích hoạt đúng ngưỡng và gửi thông báo theo cấu hình. Kiểm thử chấp nhận người dùng xác nhận chất lượng báo cáo và khả năng xuất file theo các định dạng yêu cầu.
