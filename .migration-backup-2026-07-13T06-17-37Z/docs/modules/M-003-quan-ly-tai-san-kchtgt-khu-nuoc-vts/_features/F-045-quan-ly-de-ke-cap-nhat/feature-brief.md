---
id: F-045
name: Quản lý Đê/kè - Cập nhật
slug: quan-ly-de-ke-cap-nhat
module-id: M-003
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Đê/kè - Cập nhật

## Description
Chuyên viên có quyền cập nhật, điều chỉnh các thông tin của bản ghi đê/kè đã tồn tại trong hệ thống, bao gồm thay đổi chiều dài, vật liệu, trạng thái công trình và các thông số kỹ thuật khác phù hợp với tình trạng thực tế của công trình.

## Business Intent
Việc cập nhật thông tin đê/kè giúp duy trì tính chính xác, kịp thời của dữ liệu khi công trình được sửa chữa, cải tạo hoặc khi có sai sót trong nhập liệu ban đầu, đảm bảo cơ sở dữ liệu phản ánh đúng tình trạng kỹ thuật của các công trình bảo vệ bờ trong khu nước VTS.

## Flow Summary
Chuyên viên chọn bản ghi đê/kè cần cập nhật từ danh sách hoặc tra cứu, hệ thống hiển thị form điền thông tin hiện tại. Người dùng chỉnh sửa các trường cần thay đổi, hệ thống kiểm tra tính hợp lệ của dữ liệu mới. Sau khi lưu, bản ghi được cập nhật trạng thái sang "chờ phê duyệt lại" và gửi thông báo cho cấp phê duyệt xác nhận thay đổi.

## Acceptance Criteria
- Chuyên viên có thể mở form cập nhật cho một bản ghi đê/kè đã tồn tại
- Hệ thống cho phép thay đổi các trường dữ liệu hợp lệ và hiển thị giá trị cũ so với mới
- Sau khi lưu, bản ghi quay lại trạng thái "chờ phê duyệt" và gửi thông báo cho cấp phê duyệt
- Hệ thống ghi nhận lịch sử thay đổi từng trường trước và sau khi cập nhật
- Không cho phép cập nhật bản ghi đã bị từ chối phê duyệt (cần tạo mới)

## In Scope
- Form cập nhật đê/kè với hiển thị giá trị cũ và mới
- Kiểm tra tính hợp lệ của dữ liệu cập nhật (chiều dài, năm xây dựng cải tạo)
- Chuyển trạng thái bản ghi sang "chờ phê duyệt lại" sau khi cập nhật
- Ghi nhận lịch sử thay đổi chi tiết

## Out of Scope
- Xóa bản ghi đê/kè (thuộc tính năng F-046)
- Phê duyệt bản ghi cập nhật (thuộc tính năng F-047)
- Sao chép bản ghi đê/kè
- Xuất excel dữ liệu đã cập nhật

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Cập nhật bản ghi của mình, Xem chi tiết |
| Trưởng phòng | Xem chi tiết, Phê duyệt thay đổi |
| Cục trưởng | Xem chi tiết, Phê duyệt cấp 2 |
| Admin | Cập nhật toàn bộ, Xem toàn bộ |

## Entities
- **DeKe**: id, tenCongTrinh, viTri, loaiDeKe, chieuDai, namXayDung, vatLieu, dienTich, doUng, trangThai, NguoiTao, ngayTao, nguoiCapNhat, ngayCapNhat
- **DeKeLichSu**: id, deKeId, truongThayDoi, giaTriCu, giaTriMoi, nguoiCapNhat, ngayCapNhat

## Business Rules
1. Chỉ bản ghi ở trạng thái "chờ phê duyệt" hoặc "đã phê duyệt" mới được phép cập nhật
2. Khi cập nhật bản ghi đã phê duyệt, trạng thái phải quay lại "chờ phê duyệt"
3. Mọi thay đổi phải được ghi nhận vào bảng lịch sử với thông tin trường thay đổi, giá trị cũ, giá trị mới
4. Không cho phép cập nhật bản ghi đã bị từ chối (trạng thái "từ chối")
5. Thời gian cập nhật cuối cùng (ngayCapNhat) phải được tự động cập nhật

## Testing Strategy
Kiểm thử các kịch bản cập nhật với dữ liệu hợp lệ, dữ liệu không hợp lệ, và các trường hợp biên. Kiểm thử xác minh rằng lịch sử thay đổi được ghi nhận chính xác sau mỗi lần cập nhật. Kiểm thử quyền hạn: chuyên viên không thể cập nhật bản ghi đã bị từ chối, trưởng phòng chỉ xem không cập nhật được.
