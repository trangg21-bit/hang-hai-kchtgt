---
id: F-031
name: Quản lý Cảng cạn - Lịch sử
slug: ql-cct-lich-su
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-29T11:10:08Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Cảng cạn - Lịch sử

## Description
Theo dõi và hiển thị toàn bộ lịch sử thay đổi của Cảng cạn, bao gồm các lần cập nhật thông tin, thay đổi trạng thái, phê duyệt hoặc từ chối, giúp kiểm toán và追溯 nguồn gốc của mọi biến động.

## Business Intent
Cung cấp khả năng truy vết toàn bộ quá trình biến động của Cảng cạn theo thời gian, hỗ trợ công tác kiểm toán, giải trình khi có thắc mắc và phân tích xu hướng vận hành logistics. Đây là yêu cầu bắt buộc trong quản lý hạ tầng cảng biển để đảm bảo tính minh bạch và trách nhiệm giải trình đối với mọi thay đổi về Cảng cạn, đặc biệt quan trọng khi Cảng cạn liên quan đến nhiều bên tham gia logistics.

## Flow Summary
Người dùng chọn một Cảng cạn cụ thể và truy cập vào mục "Lịch sử". Hệ thống hiển thị danh sách các lần thay đổi theo thứ tự thời gian giảm dần, bao gồm: ngày giờ thay đổi, người thực hiện, loại thay đổi (cập nhật thông tin / thay đổi trạng thái / phê duyệt / từ chối), nội dung chi tiết trước và sau thay đổi. Người dùng có thể lọc theo ngày, theo người thực hiện hoặc theo loại thay đổi, và xem chi tiết từng lần thay đổi cụ thể.

## Acceptance Criteria
1. Người dùng có thể xem danh sách tất cả các lần thay đổi của một Cảng cạn theo thứ tự thời gian
2. Mỗi lần thay đổi hiển thị đầy đủ: ngày giờ, người thực hiện, loại thay đổi, nội dung trước và sau
3. Người dùng có thể lọc danh sách thay đổi theo ngày, người thực hiện hoặc loại thay đổi
4. Danh sách thay đổi cập nhật thời gian thực khi có thay đổi mới
5. Lịch sử không bao giờ bị xóa, chỉ bổ sung thêm

## In Scope
- Hiển thị danh sách lịch sử thay đổi Cảng cạn
- Hiển thị chi tiết từng lần thay đổi (trước/sau)
- Lọc và tìm kiếm theo ngày, người thực hiện, loại thay đổi
- Hiển thị theo thứ tự thời gian giảm dần
- Ghi nhật ký tự động cho mọi thay đổi

## Out of Scope
- Xóa hoặc sửa lịch sử thay đổi
- Xuất báo cáo lịch sử ra file
- So sánh đồng thời lịch sử của nhiều Cảng cạn

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Nhân viên Cảng | Xem lịch sử |
| Trưởng phòng QL Cảng | Xem lịch sử |
| Quản trị viên | Xem lịch sử, Xuất báo cáo |

## Entities
- **LichSuCangCan**: id, cangCanId, ngayThayDoi, nguoiThucHien, loaiThayDoi, noiDungTruoc, noiDungSau, ghiChu, createdAt

## Business Rules
1. Mọi thay đổi về Cảng cạn đều tự động được ghi nhận vào lịch sử
2. Lịch sử thay đổi không thể bị xóa hoặc sửa đổi, chỉ được bổ sung
3. Các thay đổi quan trọng (phê duyệt, từ chối, thay đổi trạng thái) phải được đánh dấu nổi bật
4. Thông tin người thực hiện được tự động lấy từ tài khoản đăng nhập
5. Lịch sử được lưu trữ vĩnh viễn và chỉ phục vụ mục đích tham khảo

## Testing Strategy
Kiểm thử ghi nhận tự động lịch sử thay đổi khi cập nhật Cảng cạn, kiểm thử hiển thị danh sách theo thứ tự thời gian, kiểm thử lọc theo các tiêu chí khác nhau, kiểm thử khi Cảng cạn chưa từng thay đổi, kiểm thử độ chính xác của thông tin trước/sau thay đổi.
