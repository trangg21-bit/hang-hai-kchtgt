---
id: F-037
name: Quản lý Vùng nước - Lịch sử
slug: ql-vn-lich-su
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-29T11:10:11Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Vùng nước - Lịch sử

## Description
Theo dõi và hiển thị toàn bộ lịch sử thay đổi của Vùng nước, bao gồm các lần cập nhật thông tin, thay đổi trạng thái, phê duyệt hai cấp (phòng → Cục) hoặc từ chối, giúp kiểm toán và追溯 nguồn gốc của mọi biến động.

## Business Intent
Cung cấp khả năng truy vết toàn bộ quá trình biến động của Vùng nước theo thời gian, hỗ trợ công tác kiểm toán, giải trình khi có thắc mắc và phân tích xu hướng thay đổi điều kiện tự nhiên hoặc phân vùng khai thác biển. Đây là yêu cầu bắt buộc trong quản lý tài sản vùng nước biển để đảm bảo tính minh bạch và trách nhiệm giải trình đối với mọi thay đổi, đặc biệt quan trọng khi Vùng nước liên quan đến nhiều bên liên quan và quy trình phê duyệt hai cấp.

## Flow Summary
Người dùng chọn một Vùng nước cụ thể và truy cập vào mục "Lịch sử". Hệ thống hiển thị danh sách các lần thay đổi theo thứ tự thời gian giảm dần, bao gồm: ngày giờ thay đổi, người thực hiện, loại thay đổi (cập nhật thông tin / thay đổi trạng thái / phê duyệt Cấp 1 / phê duyệt Cấp 2 / từ chối), nội dung chi tiết trước và sau thay đổi. Người dùng có thể lọc theo ngày, theo người thực hiện hoặc theo loại thay đổi, và xem chi tiết từng lần thay đổi cụ thể. Các lần phê duyệt hai cấp được đánh dấu nổi bật để dễ dàng追溯.

## Acceptance Criteria
1. Người dùng có thể xem danh sách tất cả các lần thay đổi của một Vùng nước theo thứ tự thời gian
2. Mỗi lần thay đổi hiển thị đầy đủ: ngày giờ, người thực hiện, loại thay đổi, nội dung trước và sau
3. Người dùng có thể lọc danh sách thay đổi theo ngày, người thực hiện hoặc loại thay đổi
4. Danh sách thay đổi cập nhật thời gian thực khi có thay đổi mới
5. Lịch sử không bao giờ bị xóa, chỉ bổ sung thêm

## In Scope
- Hiển thị danh sách lịch sử thay đổi Vùng nước
- Hiển thị chi tiết từng lần thay đổi (trước/sau)
- Lọc và tìm kiếm theo ngày, người thực hiện, loại thay đổi
- Hiển thị theo thứ tự thời gian giảm dần
- Ghi nhật ký tự động cho mọi thay đổi
- Đánh dấu nổi bật các lần phê duyệt hai cấp

## Out of Scope
- Xóa hoặc sửa lịch sử thay đổi
- Xuất báo cáo lịch sử ra file
- So sánh đồng thời lịch sử của nhiều Vùng nước

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên Cảng | Xem lịch sử |
| Trưởng phòng QL Cảng | Xem lịch sử |
| Cục | Xem lịch sử |
| Quản trị viên | Xem lịch sử, Xuất báo cáo |

## Entities
- **LichSuVungNuoc**: id, vungNuocId, ngayThayDoi, nguoiThucHien, loaiThayDoi, noiDungTruoc, noiDungSau, ghiChu, createdAt

## Business Rules
1. Mọi thay đổi về Vùng nước đều tự động được ghi nhận vào lịch sử
2. Lịch sử thay đổi không thể bị xóa hoặc sửa đổi, chỉ được bổ sung
3. Các lần phê duyệt Cấp 1 và Cấp 2 phải được đánh dấu nổi bật trong danh sách
4. Thông tin người thực hiện được tự động lấy từ tài khoản đăng nhập
5. Lịch sử được lưu trữ vĩnh viễn và chỉ phục vụ mục đích tham khảo

## Testing Strategy
Kiểm thử ghi nhận tự động lịch sử thay đổi khi cập nhật Vùng nước, kiểm thử hiển thị danh sách theo thứ tự thời gian, kiểm thử lọc theo các tiêu chí khác nhau, kiểm thử khi Vùng nước chưa từng thay đổi, kiểm thử độ chính xác của thông tin trước/sau thay đổi, kiểm thử đánh dấu nổi bật các lần phê duyệt hai cấp.
