---
id: F-039
name: Quản lý Lượng hàng hải - Cập nhật
slug: quan-ly-luong-hang-hai-cap-nhat
module-id: M-003
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Lượng hàng hải - Cập nhật

## Description
Chuyên viên có quyền cập nhật, điều chỉnh các thông tin của bản ghi lượng hàng hải đã tồn tại trong hệ thống, bao gồm thay đổi số lượng tàu, ngày giờ ghi nhận, loại tàu, tải trọng và các thông số chi tiết khác phù hợp với thực tế hoạt động.

## Business Intent
Việc cập nhật thông tin lượng hàng hải giúp duy trì tính chính xác, kịp thời của dữ liệu khi có sai sót trong nhập liệu hoặc khi thông tin thực tế thay đổi sau khi ghi nhận ban đầu, đảm bảo cơ sở dữ liệu phản ánh đúng tình hình hoạt động giao thông thủy trong khu nước VTS.

## Flow Summary
Chuyên viên chọn bản ghi lượng hàng hải cần cập nhật từ danh sách hoặc tra cứu, hệ thống hiển thị form điền thông tin hiện tại. Người dùng chỉnh sửa các trường cần thay đổi, hệ thống kiểm tra tính hợp lệ của dữ liệu mới. Sau khi lưu, bản ghi được cập nhật trạng thái sang "chờ phê duyệt lại" và gửi thông báo cho cấp phê duyệt xác nhận thay đổi.

## Acceptance Criteria
- Chuyên viên có thể mở form cập nhật cho một bản ghi lượng hàng hải đã tồn tại
- Hệ thống cho phép thay đổi các trường dữ liệu hợp lệ và hiển thị giá trị cũ so với mới
- Sau khi lưu, bản ghi quay lại trạng thái "chờ phê duyệt" và gửi thông báo cho cấp phê duyệt
- Hệ thống ghi nhận lịch sử thay đổi từng trường trước và sau khi cập nhật
- Không cho phép cập nhật bản ghi đã bị từ chối phê duyệt (cần tạo mới)

## In Scope
- Form cập nhật lượng hàng hải với hiển thị giá trị cũ và mới
- Kiểm tra tính hợp lệ của dữ liệu cập nhật
- Chuyển trạng thái bản ghi sang "chờ phê duyệt lại" sau khi cập nhật
- Ghi nhận lịch sử thay đổi chi tiết

## Out of Scope
- Xóa bản ghi lượng hàng hải (thuộc tính năng F-040)
- Phê duyệt bản ghi cập nhật (thuộc tính năng F-041)
- Sao chép bản ghi lượng hàng hải
- Xuất excel dữ liệu đã cập nhật

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Cập nhật bản ghi của mình, Xem chi tiết |
| Trưởng phòng | Xem chi tiết, Phê duyệt thay đổi |
| Cục trưởng | Xem chi tiết, Phê duyệt cấp 2 |
| Admin | Cập nhật toàn bộ, Xem toàn bộ |

## Entities
- **LuongHangHai**: id, loaiTau, soLuong, ngayGhiNhan, gioDien, taiTrong, dienTichDangBo, ghiChu, trangThai, NguoiTao, ngayTao, nguoiCapNhat, ngayCapNhat
- **LuongHangHaiLichSu**: id, luongHangHaiId, truongThayDoi, giaTriCu, giaTriMoi, nguoiCapNhat, ngayCapNhat

## Business Rules
1. Chỉ bản ghi ở trạng thái "chờ phê duyệt" hoặc "đã phê duyệt" mới được phép cập nhật
2. Khi cập nhật bản ghi đã phê duyệt, trạng thái phải quay lại "chờ phê duyệt"
3. Mọi thay đổi phải được ghi nhận vào bảng lịch sử với thông tin trường thay đổi, giá trị cũ, giá trị mới
4. Không cho phép cập nhật bản ghi đã bị từ chối (trạng thái "từ chối")
5. Thời gian cập nhật cuối cùng (ngayCapNhat) phải được tự động cập nhật

## Testing Strategy
Kiểm thử các kịch bản cập nhật với dữ liệu hợp lệ, dữ liệu không hợp lệ, và các trường hợp biên. Kiểm thử xác minh rằng lịch sử thay đổi được ghi nhận chính xác sau mỗi lần cập nhật. Kiểm thử quyền hạn: chuyên viên không thể cập nhật bản ghi đã bị từ chối, trưởng phòng chỉ xem không cập nhật được.
