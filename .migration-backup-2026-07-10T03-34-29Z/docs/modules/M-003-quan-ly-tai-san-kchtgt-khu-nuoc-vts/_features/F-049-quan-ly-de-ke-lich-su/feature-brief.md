---
id: F-049
name: Quản lý Đê/kè - Lịch sử
slug: quan-ly-de-ke-lich-su
module-id: M-003
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Đê/kè - Lịch sử

## Description
Chuyên viên và các quản trị viên có quyền xem lịch sử thay đổi của từng bản ghi đê/kè, bao gồm danh sách tất cả các lần cập nhật trước đó với thông tin chi tiết về trường thay đổi, giá trị cũ, giá trị mới, người thực hiện và thời gian thực hiện.

## Business Intent
Theo dõi và kiểm soát toàn bộ quá trình thay đổi dữ liệu đê/kè theo thời gian, đảm bảo tính minh bạch, truy vết được mọi thao tác và hỗ trợ công tác kiểm toán, đánh giá chất lượng dữ liệu trong hệ thống quản lý tài sản hạ tầng hàng hải khu nước VTS.

## Flow Summary
Chuyên viên truy cập vào trang chi tiết của một bản ghi đê/kè, chọn tab hoặc mục "Lịch sử thay đổi". Hệ thống hiển thị danh sách theo thời gian tất cả các lần cập nhật đã được thực hiện trên bản ghi này, mỗi lần cập nhật hiển thị trường thay đổi, giá trị trước và sau thay đổi, tên người thực hiện, ngày giờ thực hiện. Người dùng có thể lọc theo ngày, theo người thực hiện hoặc theo trường dữ liệu.

## Acceptance Criteria
- Lịch sử thay đổi hiển thị đầy đủ các lần cập nhật theo thứ tự thời gian
- Mỗi lần thay đổi hiển thị: trường thay đổi, giá trị cũ, giá trị mới, người thực hiện, thời gian
- Có thể lọc lịch sử theo ngày, theo người thực hiện và theo trường dữ liệu
- Người dùng không thể xóa hoặc chỉnh sửa lịch sử thay đổi
- Lịch sử được hiển thị phân trang khi có nhiều hơn 50 thay đổi

## In Scope
- Giao diện hiển thị danh sách lịch sử thay đổi của một bản ghi
- Hiển thị chi tiết từng lần thay đổi với giá trị cũ và mới
- Bộ lọc theo ngày, theo người thực hiện, theo trường thay đổi
- Phân trang kết quả lịch sử thay đổi
- Xuất danh sách lịch sử thay đổi ra file Excel

## Out of Scope
- Khôi phục dữ liệu từ lịch sử thay đổi
- Tự động tạo bản ghi từ lịch sử
- Xóa hoặc chỉnh sửa lịch sử thay đổi
- Thông báo khi có thay đổi (trừ thông báo phê duyệt)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Xem lịch sử thay đổi bản ghi của mình và bản ghi đã tạo |
| Trưởng phòng | Xem lịch sử thay đổi mọi bản ghi cấp phòng |
| Cục trưởng | Xem lịch sử thay đổi mọi bản ghi |
| Admin | Xem lịch sử thay đổi toàn bộ và quản nhật ký hệ thống |

## Entities
- **DeKe**: id, tenCongTrinh, viTri, loaiDeKe, chieuDai, namXayDung, vatLieu, dienTich, doUng, trangThai, NguoiTao, ngayTao, nguoiCapNhat, ngayCapNhat
- **DeKeLichSu**: id, deKeId, truongThayDoi, giaTriCu, giaTriMoi, nguoiCapNhat, ngayCapNhat, lyDo

## Business Rules
1. Hệ thống tự động ghi nhận mọi thay đổi vào bảng lịch sử khi bản ghi được cập nhật
2. Không cho phép người dùng xóa hoặc chỉnh sửa lịch sử thay đổi
3. Lịch sử thay đổi hiển thị theo thứ tự thời gian giảm dần (mới nhất trước)
4. Giá trị cũ và giá trị mới được hiển thị dạng so sánh trực quan
5. Lý do thay đổi (nếu có) được hiển thị bên cạnh mỗi lần cập nhật

## Testing Strategy
Kiểm thử ghi nhận lịch sử thay đổi khi cập nhật từng trường khác nhau. Kiểm thử hiển thị danh sách lịch sử với bộ lọc theo ngày, người thực hiện, trường thay đổi. Kiểm thử phân trang khi có nhiều thay đổi. Kiểm thử các trường hợp biên: bản ghi chưa từng thay đổi, bản ghi có rất nhiều thay đổi.
