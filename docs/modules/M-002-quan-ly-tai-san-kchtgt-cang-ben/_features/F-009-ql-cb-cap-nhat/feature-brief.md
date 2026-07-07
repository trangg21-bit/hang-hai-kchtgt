---
id: F-009
name: Quản lý Cảng biển - Cập nhật
slug: ql-cb-cap-nhat
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:19Z
last-updated: 2026-06-29T11:09:58Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Cảng biển - Cập nhật

## Description

Tính năng cho phép người dùng có thẩm quyền cập nhật thông tin của một Cảng biển đã tồn tại trong hệ thống, bao gồm thay đổi tên cảng, vị trí địa lý, diện tích, khả năng tiếp nhận tàu và các thuộc tính kỹ thuật khác, với cơ chế kiểm tra trùng lặp và ghi nhật ký thay đổi đầy đủ.

## Business Intent

Thông tin Cảng biển thay đổi theo thời gian do quá trình mở rộng, cải tạo hoặc tái cấu trúc hạ tầng; việc cho phép cập nhật thông tin chính xác giúp đảm bảo cơ sở dữ liệu cảng luôn phản ánh đúng tình trạng thực tế, hỗ trợ hiệu quả cho công tác quy hoạch, điều phối hoạt động cảng và báo cáo theo yêu cầu của cơ quan quản lý nhà nước.

## Flow Summary

Người dùng đăng nhập vào hệ thống, tìm kiếm và chọn Cảng biển cần cập nhật từ danh sách. Hệ thống hiển thị biểu mẫu với tất cả thông tin hiện tại được điền sẵn. Người dùng chỉnh sửa các trường cần thay đổi, bao gồm tên cảng, tọa độ GPS, diện tích, hoặc khả năng tiếp nhận tàu. Hệ thống tự động kiểm tra tính hợp lệ của các trường đã thay đổi và phát hiện xung đột nếu mã cảng (không thể thay đổi) bị trùng với Cảng biển khác. Sau khi lưu, hệ thống ghi nhận nhật ký thay đổi, cập nhật trường updatedAt và gửi thông báo cập nhật thành công cho người dùng.

## Acceptance Criteria

1. Người dùng có vai trò "Admin" hoặc "Quản lý cảng" có thể truy cập chức năng cập nhật Cảng biển từ danh sách hoặc từ trang chi tiết Cảng biển.
2. Các trường không thể thay đổi: mã cảng; tất cả các trường khác đều có thể chỉnh sửa với điều kiện tuân thủ validation rules.
3. Hệ thống hiển thị cảnh báo khi người dùng cố gắng cập nhật Cảng biển đang trong quá trình phê duyệt hoặc đã bị xóa mềm.
4. Mỗi lần cập nhật thành công, hệ thống tự động ghi nhận nhật ký thay đổi với thông tin: trường nào thay đổi, giá trị cũ, giá trị mới, người cập nhật và thời gian cập nhật.

## In Scope

- Giao diện tra cứu và chọn Cảng biển cần cập nhật
- Biểu mẫu cập nhật với dữ liệu hiện tại được điền sẵn
- Validation cho các trường có thể thay đổi
- Kiểm tra xung đột dữ liệu trước khi lưu
- Ghi nhật ký thay đổi vào bảng lịch sử
- Thông báo kết quả cập nhật cho người dùng

## Out of Scope

- Thay đổi mã Cảng biển sau khi đã tạo (không cho phép)
- Quy trình phê duyệt thay đổi lớn (thuộc F-011)
- Xóa Cảng biển (thuộc F-010)
- Lịch sử xem lại tất cả phiên bản cập nhật (thuộc F-013)
- Xuất báo cáo lịch sử cập nhật

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Quản trị viên | Cập nhật, Xem, Xóa |
| Quản lý cảng | Cập nhật, Xem |
| Nhân viên vận hành | Xem |
| KháchExternal | Không có quyền truy cập |

## Entities

- **CangBien**: id (UUID), maCang (string, unique, read-only), tenCang (string), tinhThanh (string), toDo (JSON: {lat, lng}), dienTich (decimal), khaNangTiepNhanTau (string), trangThai (enum: cho_phe_duyet, hien_hanh, tam_ngung, da_xoa), ghiChu (text), createdAt (timestamp), updatedAt (timestamp)
- **LichSuThayDoi**: id (UUID), cangBienId (UUID), truongDuocCapNhat (string), giaTriCu (text), giaTriMoi (text), nguoiCapNhat (UUID), thoiGianCapNhat (timestamp)

## Business Rules

1. Mã cảng không được phép cập nhật sau khi Cảng biển đã được tạo; mọi yêu cầu thay đổi mã cảng phải thông qua quy trình hủy bỏ và tạo lại.
2. Tọa độ GPS phải nằm trong khoảng chấp nhận được: vĩ độ -90 đến 90, kinh độ -180 đến 180.
3. Diện tích cảng phải là giá trị dương, đơn vị km², không vượt quá 5000 km².
4. Nhật ký thay đổi phải được ghi nhận tự động cho mọi lần cập nhật, không cho phép xóa hoặc sửa nhật ký.

## Testing Strategy

Kiểm thử đơn vị cho các quy tắc validation của từng trường có thể cập nhật; kiểm thử tích hợp cho luồng cập nhật Cảng biển qua API với các trường hợp cập nhật hợp lệ, không hợp lệ, và xung đột; kiểm thử giao diện cho biểu mẫu cập nhật bao gồm validation thời gian thực; kiểm thử nhật ký thay đổi bằng cách xác nhận dữ liệu được ghi đầy đủ sau mỗi lần cập nhật.
