---
id: F-057
name: Quản lý Trạm radar - Cập nhật
slug: quan-ly-tram-radar-cap-nhat
module-id: M-003
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Trạm radar - Cập nhật

## Description
Chuyên viên có quyền cập nhật, điều chỉnh các thông tin của bản ghi trạm radar đã tồn tại trong hệ thống, bao gồm thay đổi phạm vi hoạt động, trạng thái kỹ thuật, hệ số truyền dẫn và các thông số vận hành khác phù hợp với tình trạng thực tế của trạm.

## Business Intent
Việc cập nhật thông tin trạm radar giúp duy trì tính chính xác, kịp thời của dữ liệu khi trạm được nâng cấp, thay đổi thông số kỹ thuật hoặc khi có sai sót trong nhập liệu ban đầu, đảm bảo cơ sở dữ liệu phản ánh đúng tình trạng vận hành của các trạm radar trong khu nước VTS.

## Flow Summary
Chuyên viên chọn bản ghi trạm radar cần cập nhật từ danh sách hoặc tra cứu, hệ thống hiển thị form điền thông tin hiện tại. Người dùng chỉnh sửa các trường cần thay đổi, hệ thống kiểm tra tính hợp lệ của dữ liệu mới. Sau khi lưu, bản ghi được cập nhật trạng thái sang "chờ phê duyệt lại" và gửi thông báo cho cấp phê duyệt xác nhận thay đổi.

## Acceptance Criteria
- Chuyên viên có thể mở form cập nhật cho một bản ghi trạm radar đã tồn tại
- Hệ thống cho phép thay đổi các trường dữ liệu hợp lệ và hiển thị giá trị cũ so với mới
- Sau khi lưu, bản ghi quay lại trạng thái "chờ phê duyệt" và gửi thông báo cho cấp phê duyệt
- Hệ thống ghi nhận lịch sử thay đổi từng trường trước và sau khi cập nhật
- Không cho phép cập nhật bản ghi đã bị từ chối phê duyệt (cần tạo mới)

## In Scope
- Form cập nhật trạm radar với hiển thị giá trị cũ và mới
- Kiểm tra tính hợp lệ của dữ liệu cập nhật (phạm vi, tọa độ, trạng thái)
- Chuyển trạng thái bản ghi sang "chờ phê duyệt lại" sau khi cập nhật
- Ghi nhận lịch sử thay đổi chi tiết

## Out of Scope
- Xóa bản ghi trạm radar (thuộc tính năng F-058)
- Phê duyệt bản ghi cập nhật (thuộc tính năng F-059)
- Sao chép bản ghi trạm radar
- Xuất excel dữ liệu đã cập nhật

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Cập nhật bản ghi của mình, Xem chi tiết |
| Trưởng phòng | Xem chi tiết, Phê duyệt thay đổi |
| Cục trưởng | Xem chi tiết, Phê duyệt cấp 2 |
| Admin | Cập nhật toàn bộ, Xem toàn bộ |

## Entities
- **TramRadar**: id, tenTram, viTri, loaiRadar, phamViHoatDong, trangThaiKyThuat, ngayVaoVanhHan, heSoTruyenDan, nguoiQuanLy, ghiChu, trangThai, NguoiTao, ngayTao, nguoiCapNhat, ngayCapNhat
- **TramRadarLichSu**: id, tramRadarId, truongThayDoi, giaTriCu, giaTriMoi, nguoiCapNhat, ngayCapNhat

## Business Rules
1. Chỉ bản ghi ở trạng thái "chờ phê duyệt" hoặc "đã phê duyệt" mới được phép cập nhật
2. Khi cập nhật bản ghi đã phê duyệt, trạng thái phải quay lại "chờ phê duyệt"
3. Mọi thay đổi phải được ghi nhận vào bảng lịch sử với thông tin trường thay đổi, giá trị cũ, giá trị mới
4. Không cho phép cập nhật bản ghi đã bị từ chối (trạng thái "từ chối")
5. Thời gian cập nhật cuối cùng (ngayCapNhat) phải được tự động cập nhật

## Testing Strategy
Kiểm thử các kịch bản cập nhật với dữ liệu hợp lệ, dữ liệu không hợp lệ, và các trường hợp biên. Kiểm thử xác minh rằng lịch sử thay đổi được ghi nhận chính xác sau mỗi lần cập nhật. Kiểm thử quyền hạn: chuyên viên không thể cập nhật bản ghi đã bị từ chối, trưởng phòng chỉ xem không cập nhật được.
