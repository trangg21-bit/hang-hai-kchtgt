---
id: F-030
name: "Xem chi tiết Cảng cạn"
slug: xem-cct
module-id: M-002
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Xem chi tiết Cảng cạn

## Description
Màn hình hiển thị toàn bộ thông tin chi tiết của một Cảng cạn cụ thể, bao gồm dữ liệu kỹ thuật, diện tích, năng lực, dịch vụ cung cấp, trạng thái và các giấy tờ pháp lý liên quan, cho phép người dùng tra cứu nhanh chóng và đầy đủ.

## Business Intent
Cung cấp giao diện xem chi tiết để tất cả các bên liên quan — từ nhân viên vận hành logistics đến quản lý cảng — có thể tiếp cận thông tin chính xác và cập nhật nhất về từng Cảng cạn. Điều này hỗ trợ ra quyết định nhanh chóng trong vận chuyển liên quan đến cảng biển, kiểm toán tuân thủ và báo cáo quản lý, giúp giảm thiểu sai sót do thiếu thông tin về năng lực và tình trạng của Cảng cạn.

## Flow Summary
Người dùng truy cập vào danh sách Cảng cạn, chọn một Cảng cạn cần xem chi tiết. Hệ thống tải thông tin đầy đủ của Cảng cạn bao gồm: mã, tên, địa chỉ, tọa độ, loại hình, diện tích, năng lực xử lý, danh sách dịch vụ cung cấp, trạng thái (đã kích hoạt/chờ phê duyệt/bị đình chỉ), ngày tạo và ngày cập nhật gần nhất. Người dùng có thể xem các giấy tờ đính kèm (giấy phép thành lập, quyết định), lịch sử thay đổi và các yêu cầu phê duyệt liên quan.

## Acceptance Criteria
1. Người dùng có thể xem toàn bộ thông tin chi tiết của một Cảng cạn sau khi chọn từ danh sách
2. Các trường dữ liệu kỹ thuật, pháp lý và trạng thái được hiển thị đầy đủ và chính xác
3. Người dùng có thể xem các giấy tờ đính kèm liên quan đến Cảng cạn
4. Hệ thống cho phép tải/xuống các tài liệu đính kèm (nếu có)
5. Thông tin được làm mới tự động khi dữ liệu nguồn thay đổi

## In Scope
- Hiển thị thông tin chi tiết Cảng cạn (mã, tên, địa chỉ, diện tích, năng lực, trạng thái)
- Hiển thị các giấy tờ đính kèm liên quan
- Xem lịch sử thay đổi của Cảng cạn
- Xem các yêu cầu phê duyệt liên quan
- Tải/xuống tài liệu đính kèm

## Out of Scope
- Chỉnh sửa thông tin Cảng cạn (thuộc F-027)
- Khởi tạo hoặc xóa Cảng cạn (thuộc F-026, F-028)
- Xuất báo cáo định kỳ về Cảng cạn

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Nhân viên Cảng | Xem chi tiết, Tải tài liệu |
| Trưởng phòng QL Cảng | Xem chi tiết, Tải tài liệu |
| Quản trị viên | Xem chi tiết, Tải tài liệu |

## Entities
- **CangCan**: id, ma, ten, diaChi, toDo, loaiHinh, dienTich, nangLxuLy, dichVu, trangThai, ghiChu, createdAt, updatedAt
- **GiayTo**: id, cangCanId, tenGiayTo, loaiTaiLieu, duongDan, nguoiTanRieng, ngayCapNhat

## Business Rules
1. Mọi người dùng có vai trò trong hệ thống đều có thể xem chi tiết Cảng cạn
2. Chỉ người dùng có quyền quản lý mới có thể tải tài liệu đính kèm
3. Thông tin chi tiết luôn hiển thị trạng thái hiện tại, không phải lịch sử cũ
4. Các trường bắt buộc không được hiển thị trống

## Testing Strategy
Kiểm thử giao diện người dùng cho màn hình chi tiết, kiểm tra hiển thị đầy đủ các trường dữ liệu, kiểm tra tải tài liệu đính kèm, kiểm thử xem khi không có giấy tờ đính kèm, kiểm thử phân quyền xem chi tiết giữa các vai trò.
