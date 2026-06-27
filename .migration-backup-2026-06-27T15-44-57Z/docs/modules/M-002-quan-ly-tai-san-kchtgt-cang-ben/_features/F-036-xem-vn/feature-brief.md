---
id: F-036
name: "Xem chi tiết Vùng nước"
slug: xem-vn
module-id: M-002
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Xem chi tiết Vùng nước

## Description
Màn hình hiển thị toàn bộ thông tin chi tiết của một Vùng nước cụ thể, bao gồm tọa độ, diện tích, độ sâu, điều kiện hải văn, khả năng thông hành, trạng thái phê duyệt hai cấp, văn bản đính kèm và lịch sử biến động KCHTGT của Vùng nước.

## Business Intent
Cung cấp giao diện xem chi tiết để tất cả các bên liên quan — từ chuyên viên kỹ thuật đến quản lý cảng — có thể tiếp cận thông tin chính xác và cập nhật nhất về từng Vùng nước. Điều này hỗ trợ công tác quy hoạch, thẩm định điều kiện khai thác, kiểm toán và ra quyết định về phân vùng biển. Thông tin chi tiết đầy đủ giúp đánh giá đúng tiềm năng và hạn chế của từng Vùng nước trong khai thác cảng biển và vận tải hàng hải.

## Flow Summary
Người dùng truy cập vào danh sách Vùng nước, chọn một Vùng nước cần xem chi tiết. Hệ thống tải thông tin đầy đủ của Vùng nước bao gồm: mã, tên, vị trí, tọa độ biên giới, diện tích mặt nước, độ sâu trung bình, điều kiện hải văn (thủy triều, sóng, dòng chảy), khả năng thông hành tàu thuyền, trạng thái phê duyệt (chờ cấp 1 / chờ cấp 2 / đã phê duyệt / bị từ chối), ngày tạo và ngày cập nhật. Người dùng có thể xem các văn bản, giấy tờ đính kèm, tải/xuống tài liệu và truy cập lịch sử KCHTGT của Vùng nước.

## Acceptance Criteria
1. Người dùng có thể xem toàn bộ thông tin chi tiết của một Vùng nước sau khi chọn từ danh sách
2. Các trường dữ liệu địa lý, hải văn, pháp lý và trạng thái phê duyệt được hiển thị đầy đủ
3. Người dùng có thể xem các văn bản, giấy tờ đính kèm liên quan
4. Hệ thống cho phép tải/xuống các tài liệu đính kèm (nếu có)
5. Người dùng có thể truy cập lịch sử KCHTGT của Vùng nước từ màn hình chi tiết

## In Scope
- Hiển thị thông tin chi tiết Vùng nước (mã, tên, vị trí, diện tích, độ sâu, điều kiện hải văn)
- Hiển thị trạng thái phê duyệt (Cấp 1, Cấp 2)
- Hiển thị các văn bản, giấy tờ đính kèm liên quan
- Xem lịch sử KCHTGT của Vùng nước
- Tải/xuống tài liệu đính kèm

## Out of Scope
- Chỉnh sửa thông tin Vùng nước (thuộc F-033)
- Khởi tạo hoặc xóa Vùng nước (thuộc F-032, F-034)
- Phê duyệt Vùng nước (thuộc F-035)
- Xem lịch sử thay đổi chi tiết (thuộc F-037)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên Cảng | Xem chi tiết, Tải tài liệu |
| Trưởng phòng QL Cảng | Xem chi tiết, Tải tài liệu |
| Cục | Xem chi tiết, Tải tài liệu |
| Quản trị viên | Xem chi tiết, Tải tài liệu |

## Entities
- **VungNuoc**: id, ma, ten, viTri, toDo, dienTich, doSau, dieuKienHaiVan, khaNangThongHanh, loaiVungNuoc, trangThai, createdAt, updatedAt
- **VanBan**: id, vungNuocId, tenVanBan, loaiTaiLieu, duongDan, nguoiTanRieng, ngayBanHanh

## Business Rules
1. Mọi người dùng có vai trò trong hệ thống đều có thể xem chi tiết Vùng nước
2. Chỉ người dùng có quyền quản lý mới có thể tải tài liệu đính kèm
3. Thông tin chi tiết luôn hiển thị trạng thái hiện tại và tiến trình phê duyệt
4. Các trường bắt buộc không được hiển thị trống

## Testing Strategy
Kiểm thử giao diện người dùng cho màn hình chi tiết, kiểm tra hiển thị đầy đủ các trường dữ liệu địa lý và hải văn, kiểm tra tải tài liệu đính kèm, kiểm thử xem trạng thái phê duyệt hai cấp, kiểm thử khi không có giấy tờ đính kèm, kiểm thử phân quyền xem chi tiết giữa các vai trò.
