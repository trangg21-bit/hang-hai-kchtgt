---
id: F-024
name: "Xem chi tiết Cầu cảng"
slug: xem-cc
module-id: M-002
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Xem chi tiết Cầu cảng

## Description
Màn hình hiển thị toàn bộ thông tin chi tiết của một Cầu cảng cụ thể, bao gồm dữ liệu kỹ thuật, giấy tờ pháp lý, trạng thái hiện tại và các liên quan đến hoạt động cảng, cho phép người dùng tra cứu nhanh chóng và đầy đủ.

## Business Intent
Cung cấp giao diện xem chi tiết để tất cả các bên liên quan — từ nhân viên vận hành đến quản lý — có thể tiếp cận thông tin chính xác và cập nhật nhất về từng cầu cảng. Điều này hỗ trợ ra quyết định nhanh chóng trong vận hành cảng, kiểm toán tuân thủ và báo cáo quản lý, giúp giảm thiểu sai sót do thiếu thông tin.

## Flow Summary
Người dùng truy cập vào danh sách cầu cảng, chọn một cầu cảng cần xem chi tiết. Hệ thống tải thông tin đầy đủ của cầu cảng bao gồm: mã, tên, địa chỉ, tọa độ, kích thước, loại cầu, khả năng tiếp nhận tàu, trạng thái (đã kích hoạt/chờ phê duyệt/bị đình chỉ), ngày tạo và ngày cập nhật gần nhất. Người dùng có thể xem các giấy tờ đính kèm, lịch sử thay đổi và các yêu cầu phê duyệt liên quan đến cầu cảng.

## Acceptance Criteria
1. Người dùng có thể xem toàn bộ thông tin chi tiết của một cầu cảng sau khi chọn từ danh sách
2. Các trường dữ liệu kỹ thuật, pháp lý và trạng thái được hiển thị đầy đủ và chính xác
3. Người dùng có thể xem các giấy tờ đính kèm liên quan đến cầu cảng
4. Hệ thống cho phép tải/xuống các tài liệu đính kèm (nếu có)
5. Thông tin được làm mới tự động khi dữ liệu nguồn thay đổi

## In Scope
- Hiển thị thông tin chi tiết cầu cảng (mã, tên, địa chỉ, kích thước, trạng thái)
- Hiển thị các giấy tờ đính kèm liên quan
- Xem lịch sử thay đổi của cầu cảng
- Xem các yêu cầu phê duyệt liên quan
- Tải/xuống tài liệu đính kèm

## Out of Scope
- Chỉnh sửa thông tin cầu cảng (thuộc F-027)
- Khởi tạo hoặc xóa cầu cảng (thuộc F-020, F-022)
- Xuất báo cáo định kỳ về cầu cảng

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Nhân viên Cảng | Xem chi tiết, Tải tài liệu |
| Trưởng phòng QL Cảng | Xem chi tiết, Tải tài liệu |
| Quản trị viên | Xem chi tiết, Tải tài liệu |

## Entities
- **CauCang**: id, ma, ten, diaChi, toDo, kichThuoc, loaiCau, khaNangTiepNhan, trangThai, ghiChu, createdAt, updatedAt
- **GiayTo**: id, cauCangId, tenGiayTo, loaiTaiLieu, duongDan, nguoiTanRieng, ngayCapNhat

## Business Rules
1. Mọi người dùng có vai trò trong hệ thống đều có thể xem chi tiết cầu cảng
2. Chỉ người dùng có quyền quản lý mới có thể tải tài liệu đính kèm
3. Thông tin chi tiết luôn hiển thị trạng thái hiện tại, không phải lịch sử cũ
4. Các trường bắt buộc không được hiển thị trống

## Testing Strategy
Kiểm thử giao diện người dùng cho màn hình chi tiết, kiểm tra hiển thị đầy đủ các trường dữ liệu, kiểm tra tải tài liệu đính kèm, kiểm thử xem khi không có giấy tờ đính kèm, kiểm thử phân quyền xem chi tiết giữa các vai trò.
