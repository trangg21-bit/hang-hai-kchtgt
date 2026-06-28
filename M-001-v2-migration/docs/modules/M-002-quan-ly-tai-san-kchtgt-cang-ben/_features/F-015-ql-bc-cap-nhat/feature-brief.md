---
id: F-015
name: "Quản lý Bến cảng - Cập nhật"
slug: ql-bc-cap-nhat
module-id: M-002
status: proposed
classification: local
priority: critical
created: "2026-06-16T04:40:42Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Bến cảng - Cập nhật

## Description

Tính năng cho phép người dùng có thẩm quyền cập nhật thông tin của một Bến cảng đã tồn tại trong hệ thống, bao gồm thay đổi tên bến, vị trí, kích thước, loại bến, độ sâu luồng và các thuộc tính kỹ thuật khác, với cơ chế kiểm tra trùng lặp, ràng buộc Cảng mẹ và ghi nhật ký thay đổi đầy đủ.

## Business Intent

Bến cảng thường xuyên trải qua quá trình cải tạo, nạo vét luồng hoặc thay đổi công năng theo nhu cầu vận tải; việc cho phép cập nhật thông tin chính xác giúp đảm bảo cơ sở dữ liệu bến cảng luôn phản ánh đúng tình trạng hạ tầng thực tế, hỗ trợ công tác lập kế hoạch sửa chữa, mở rộng bến và điều phối hoạt động tàu bè hiệu quả.

## Flow Summary

Người dùng đăng nhập vào hệ thống, tìm kiếm và chọn Bến cảng cần cập nhật từ danh sách hoặc từ trang chi tiết Bến cảng. Hệ thống hiển thị biểu mẫu với tất cả thông tin hiện tại được điền sẵn. Người dùng chỉnh sửa các trường cần thay đổi như tên bến, kích thước, loại bến, độ sâu luồng trước bến hoặc Cảng mẹ (có điều kiện). Hệ thống tự động kiểm tra tính hợp lệ của các trường đã thay đổi và phát hiện xung đột nếu mã bến bị trùng. Sau khi lưu, hệ thống ghi nhận nhật ký thay đổi, cập nhật trường updatedAt và gửi thông báo cập nhật thành công.

## Acceptance Criteria

1. Người dùng có vai trò "Admin" hoặc "Quản lý cảng" có thể truy cập chức năng cập nhật Bến cảng từ danh sách hoặc từ trang chi tiết.
2. Các trường không thể thay đổi: mã bến; các trường khác đều có thể chỉnh sửa với điều kiện tuân thủ validation rules.
3. Hệ thống hiển thị cảnh báo khi người dùng cố gắng thay đổi Cảng mẹ của Bến cảng đang có dữ liệu liên quan (lượt tàu, lịch sử phục vụ).
4. Mỗi lần cập nhật thành công, hệ thống tự động ghi nhận nhật ký thay đổi với thông tin: trường nào thay đổi, giá trị cũ, giá trị mới, người cập nhật và thời gian.

## In Scope

- Giao diện tra cứu và chọn Bến cảng cần cập nhật
- Biểu mẫu cập nhật với dữ liệu hiện tại được điền sẵn
- Validation cho các trường có thể thay đổi (kích thước, độ sâu, loại bến)
- Kiểm tra xung đột dữ liệu trước khi lưu
- Ràng buộc cập nhật Cảng mẹ (không cho phép nếu có dữ liệu liên quan)
- Ghi nhật ký thay đổi vào bảng lịch sử
- Thông báo kết quả cập nhật cho người dùng

## Out of Scope

- Thay đổi mã Bến cảng sau khi đã tạo (không cho phép)
- Quy trình phê duyệt thay đổi lớn (thuộc F-017)
- Xóa Bến cảng (thuộc F-016)
- Lịch sử xem lại tất cả phiên bản cập nhật (thuộc F-019)
- Xuất báo cáo lịch sử cập nhật

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Quản trị viên | Cập nhật, Xem, Xóa |
| Quản lý cảng | Cập nhật, Xem |
| Nhân viên vận hành | Xem |
| KháchExternal | Không có quyền truy cập |

## Entities

- **BenCang**: id (UUID), maBen (string, unique, read-only), tenBen (string), cangMeId (UUID, FK → CangBien), tuyensDuongThuy (string), toDo (JSON: {lat, lng}), chieuDaiBen (decimal, m), chieuRongBen (decimal, m), loaiBen (enum: hang_containers, hang_kho, dau_khi, dich_vu), doSauLuongTruocBen (decimal, m), trangThai (enum: cho_phe_duyet, hien_hanh, tam_ngung, da_xoa), ghiChu (text), createdAt (timestamp), updatedAt (timestamp)
- **LichSuThayDoi**: id (UUID), benCangId (UUID), truongDuocCapNhat (string), giaTriCu (text), giaTriMoi (text), nguoiCapNhat (UUID), thoiGianCapNhat (timestamp)

## Business Rules

1. Mã bến không được phép cập nhật sau khi Bến cảng đã được tạo; mọi yêu cầu thay đổi mã bến phải thông qua quy trình hủy bỏ và tạo lại.
2. Chiều dài và chiều rộng bến phải là giá trị dương, không vượt quá 2000m.
3. Độ sâu luồng trước bến phải là giá trị dương, không nhỏ hơn 3m.
4. Việc thay đổi Cảng mẹ chỉ được cho phép nếu Bến cảng chưa có dữ liệu liên quan (lượt tàu, lịch sử phục vụ); nếu có, hệ thống yêu cầu quy trình phê duyệt đặc biệt.
5. Nhật ký thay đổi phải được ghi nhận tự động cho mọi lần cập nhật.

## Testing Strategy

Kiểm thử đơn vị cho các quy tắc validation của từng trường có thể cập nhật; kiểm thử tích hợp cho luồng cập nhật Bến cảng qua API với các trường hợp cập nhật hợp lệ, không hợp lệ và xung đột; kiểm thử giao diện cho biểu mẫu cập nhật bao gồm validation thời gian thực; kiểm thử ràng buộc thay đổi Cảng mẹ khi có dữ liệu liên quan; kiểm thử nhật ký thay đổi.
