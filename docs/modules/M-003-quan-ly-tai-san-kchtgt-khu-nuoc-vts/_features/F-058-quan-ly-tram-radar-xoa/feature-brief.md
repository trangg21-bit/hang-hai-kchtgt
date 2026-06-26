---
id: F-058
name: Quản lý Trạm radar - Xóa
slug: quan-ly-tram-radar-xoa
module-id: M-003
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Trạm radar - Xóa

## Description
Chuyên viên có quyền xóa các bản ghi trạm radar đã được phê duyệt nhưng không còn phù hợp hoặc bị trùng lặp trong hệ thống. Việc xóa phải tuân theo quy trình kiểm soát và ghi nhận đầy đủ vào nhật ký hệ thống để đảm bảo truy vết.

## Business Intent
Cho phép loại bỏ các bản ghi không chính xác, sai sót hoặc trùng lặp trong hệ thống quản lý trạm radar, duy trì chất lượng dữ liệu tổng thể. Việc xóa có kiểm soát giúp ngăn chặn mất dữ liệu quan trọng và đảm bảo tính minh bạch trong quá trình quản lý tài sản hạ tầng hàng hải khu nước VTS.

## Flow Summary
Chuyên viên chọn bản ghi trạm radar cần xóa từ danh sách tra cứu. Hệ thống xác nhận bản ghi đó đã ở trạng thái "đã phê duyệt" trước khi cho phép xóa. Người dùng phải xác nhận xóa bằng thao tác xác nhận kép (confirm dialog). Hệ thống xóa bản ghi và ghi nhận thao tác vào bảng lịch sử hệ thống, bao gồm thông tin người thực hiện, thời gian xóa và lý do.

## Acceptance Criteria
- Chỉ cho phép xóa bản ghi trạm radar đã ở trạng thái "đã phê duyệt"
- Hệ thống yêu cầu xác nhận xóa bằng dialog xác nhận trước khi thực hiện
- Sau khi xóa, bản ghi được loại bỏ khỏi danh sách hiển thị và không thể khôi phục
- Hệ thống ghi nhận đầy đủ thông tin người xóa, thời gian xóa và lý do vào nhật ký
- Không cho phép xóa bản ghi ở trạng thái "chờ phê duyệt" (cần từ chối thay vì xóa)

## In Scope
- Tìm kiếm, chọn bản ghi trạm radar để xóa
- Kiểm tra điều kiện cho phép xóa (phải đã phê duyệt)
- Xác nhận xóa với dialog thông báo
- Ghi nhận thao tác xóa vào nhật ký hệ thống
- Cập nhật lại các thống kê liên quan sau khi xóa

## Out of Scope
- Xóa hàng loạt nhiều bản ghi cùng lúc
- Khôi phục bản ghi đã xóa (soft delete không được áp dụng)
- Phê duyệt xóa (chuyên viên tự thực hiện)
- Xuất báo cáo trước khi xóa

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Xóa bản ghi đã phê duyệt, Xem chi tiết |
| Trưởng phòng | Xem chi tiết, Xóa bản ghi cấp phòng |
| Cục trưởng | Xem chi tiết, Xóa mọi bản ghi |
| Admin | Xóa toàn bộ, Xem toàn bộ, Quản lý nhật ký |

## Entities
- **TramRadar**: id, tenTram, viTri, loaiRadar, phamViHoatDong, trangThaiKyThuat, ngayVaoVanhHan, heSoTruyenDan, nguoiQuanLy, ghiChu, trangThai, daXoa, ngayXoa, nguoiXoa, lyDoXoa
- **NhatKyHeThong**: id, loaiThaoTac, entity, entityId, thongTin, nguoiThucHien, ngayThucHien

## Business Rules
1. Chỉ bản ghi ở trạng thái "đã phê duyệt" mới được phép xóa
2. Bắt buộc xác nhận xóa bằng dialog với thông báo về hậu quả của việc xóa
3. Thao tác xóa phải được ghi nhận vào nhật ký hệ thống với đầy đủ thông tin truy vết
4. Không cho phép xóa bản ghi ở trạng thái "chờ phê duyệt" hoặc "từ chối"
5. Sau khi xóa, bản ghi không còn xuất hiện trong bất kỳ danh sách hoặc báo cáo nào

## Testing Strategy
Kiểm thử xóa với bản ghi đã phê duyệt thành công và bản ghi không phê duyệt bị từ chối. Kiểm thử xác nhận xóa (click cancel không xóa, click confirm xóa). Kiểm thử nhật ký hệ thống ghi nhận đúng thao tác xóa. Kiểm thử quyền hạn: vai trò khác nhau có quyền xóa khác nhau.
