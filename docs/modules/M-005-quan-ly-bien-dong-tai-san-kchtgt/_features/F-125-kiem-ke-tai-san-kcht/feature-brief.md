---
id: F-125
name: "Kiểm kê tài sản KCHT"
slug: kiem-ke-tai-san-kcht
module-id: M-005
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:41:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Kiểm kê tài sản KCHT

## Description
Quản lý hoạt động kiểm kê tài sản kết cấu hạ tầng công nghệ giao thông (KCHTGT) định kỳ hoặc đột xuất theo chuẩn mực kế toán và quản lý tài sản nhà nước. Hệ thống hỗ trợ lập kế hoạch kiểm kê, tạo danh sách tài sản cần kiểm kê, ghi nhận kết quả đối chiếu thực tế với sổ sách và xử lý chênh lệch nếu có.

## Business Intent
Đảm bảo tính chính xác và trung thực của hồ sơ quản lý tài sản so với thực tế, phát hiện kịp thời các sai sót, mất mát hoặc chênh lệch giữa sổ sách và hiện trạng. Hỗ trợ tuân thủ quy định kiểm kê tài sản định kỳ theo pháp luật hiện hành và cung cấp cơ sở cho việc điều chỉnh sổ sách, xử lý vi phạm nếu phát hiện.

## Flow Summary
Quy trình bắt đầu khi bộ phận quản lý lập kế hoạch kiểm kê tài sản, xác định phạm vi (theo đơn vị, loại tài sản, khu vực), thời gian và tổ chức thực hiện. Hệ thống tự động sinh danh sách tài sản cần kiểm kê dựa trên phạm vi đã chọn, sau đó phân công cho từng bộ phận, tổ kiểm kê tiến hành đối chiếu thực tế với thông tin trên sổ sách. Kết quả kiểm kê được ghi nhận trực tiếp trên hệ thống, tự động phát hiện các chênh lệch giữa sổ sách và thực tế (tài sản thừa, thiếu, hư hỏng không ghi nhận). Hệ thống lập báo cáo tổng hợp kiểm kê và chuyển sang quy trình phê duyệt (F-127) để lãnh đạo xác nhận trước khi điều chỉnh sổ sách.

## Acceptance Criteria
1. Người dùng có thể lập kế hoạch kiểm kê với đầy đủ thông tin (phạm vi, thời gian, tổ kiểm kê).
2. Hệ thống tự động sinh danh sách tài sản cần kiểm kê dựa trên phạm vi đã chọn và đối chiếu với sổ sách.
3. Hệ thống tự động phát hiện và cảnh báo các chênh lệch giữa sổ sách và kết quả kiểm kê thực tế.
4. Báo cáo kiểm kê được tổng hợp tự động và chuyển sang quy trình phê duyệt F-127.

## In Scope
- Lập kế hoạch kiểm kê tài sản (định kỳ, đột xuất)
- Sinh danh sách tài sản cần kiểm kê theo phạm vi
- Phân công tổ kiểm kê và theo dõi tiến độ
- Ghi nhận kết quả kiểm kê thực tế
- Tự động phát hiện chênh lệch giữa sổ sách và thực tế
- Lập báo cáo kiểm kê tổng hợp
- Chuyển báo cáo kiểm kê sang quy trình phê duyệt

## Out of Scope
- Quy trình xử lý tài sản thừa, thiếu (F-124)
- Tính toán hao mòn tài sản
- Sửa đổi thông tin cơ bản của tài sản
- Tích hợp với hệ thống thanh tra, kiểm toán nội bộ

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Kế toán trưởng | Lập kế hoạch, Xem, Phê duyệt báo cáo kiểm kê |
| Nhân viên kiểm kê | Xem danh sách, Ghi nhận kết quả kiểm kê |
| Trưởng phòng | Xem, Sửa kế hoạch kiểm kê chưa phê duyệt |
| Lãnh đạo | Xem, Phê duyệt báo cáo kiểm kê |
| Admin hệ thống | Quản lý phân quyền, cấu hình mẫu báo cáo |

## Entities
- **KeHoachKiemKe**: id, loaiKiemKe, PhamVi, NgayBatDau, NgayKetThuc, ToTruongKiemKe, trangThai, createdAt, updatedAt
- **TaiSanKiemKe**: id, keHoachId, taiSanId, giaTriSach, giaTriThucTe, ChenhLech, trangThaiKiemKe, createdAt, updatedAt
- **BaoCaoKiemKe**: id, keHoachId, TongSoTaiSan, SoThua, SoThieu, SoKhacThuong, trangThai, createdAt, updatedAt

## Business Rules
1. Kế hoạch kiểm kê phải xác định rõ phạm vi (tất cả tài sản, theo đơn vị, theo loại tài sản).
2. Kết quả kiểm kê thực tế phải được ghi nhận trước ngày kết thúc kế hoạch kiểm kê.
3. Chênh lệch giữa sổ sách và thực tế phải được giải trình và có bằng chứng xác nhận.
4. Báo cáo kiểm kê chỉ được phê duyệt khi tất cả các đơn vị trong phạm vi đã hoàn thành kiểm kê.
5. Mọi chênh lệch phải được xử lý theo quy định về quản lý tài sản nhà nước.

## Testing Strategy
Kiểm thử tạo kế hoạch kiểm kê với các phạm vi khác nhau (tất cả, theo đơn vị, theo loại). Kiểm thử chức năng sinh danh sách đối chiếu và phát hiện chênh lệch với dữ liệu mẫu có cài sẵn sai lệch. Kiểm thử báo cáo tổng hợp với các tình huống: không có chênh lệch, chỉ thừa, chỉ thiếu, cả thừa và thiếu. Kiểm thử trường hợp biên: kiểm kê khi có tài sản đang trong quá trình xử lý hoặc phê duyệt.
