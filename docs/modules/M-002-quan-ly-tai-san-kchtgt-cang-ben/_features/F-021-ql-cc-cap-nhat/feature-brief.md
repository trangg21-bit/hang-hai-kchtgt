---
id: F-021
name: Quản lý Cầu cảng - Cập nhật
slug: ql-cc-cap-nhat
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:41:01Z
last-updated: 2026-06-29T11:10:03Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Cầu cảng - Cập nhật

## Description

Tính năng cho phép người dùng có thẩm quyền cập nhật thông tin của một Cầu cảng đã tồn tại trong hệ thống, bao gồm thay đổi tên cầu, kích thước, loại kết cấu, vật liệu, tải trọng thiết kế, mực nước cao nhất và các thuộc tính kỹ thuật khác, với cơ chế kiểm tra trùng lặp, ràng buộc Bến cảng mẹ và ghi nhật ký thay đổi đầy đủ.

## Business Intent

Cầu cảng thường xuyên trải qua quá trình bảo trì, cải tạo gia cố hoặc nâng cấp tải trọng theo thời gian khai thác; việc cho phép cập nhật thông tin kỹ thuật chính xác giúp đảm bảo cơ sở dữ liệu cầu cảng luôn phản ánh đúng tình trạng hiện tại, hỗ trợ công tác đánh giá an toàn kết cấu, lập kế hoạch sửa chữa và điều phối hoạt động bốc xếp hàng hóa hiệu quả.

## Flow Summary

Người dùng đăng nhập vào hệ thống, tìm kiếm và chọn Cầu cảng cần cập nhật từ danh sách hoặc từ trang chi tiết Cầu cảng. Hệ thống hiển thị biểu mẫu với tất cả thông tin kỹ thuật hiện tại được điền sẵn. Người dùng chỉnh sửa các trường cần thay đổi như tên cầu, kích thước, loại kết cấu, tải trọng thiết kế hoặc Bến cảng mẹ (có điều kiện). Hệ thống tự động kiểm tra tính hợp lệ của các trường đã thay đổi và phát hiện xung đột nếu mã cầu bị trùng. Sau khi lưu, hệ thống ghi nhận nhật ký thay đổi, cập nhật trường updatedAt và gửi thông báo cập nhật thành công.

## Acceptance Criteria

1. Người dùng có vai trò "Admin" hoặc "Quản lý cảng" có thể truy cập chức năng cập nhật Cầu cảng từ danh sách hoặc từ trang chi tiết.
2. Các trường không thể thay đổi: mã cầu; các trường khác đều có thể chỉnh sửa với điều kiện tuân thủ validation rules.
3. Hệ thống hiển thị cảnh báo khi người dùng cố gắng thay đổi Bến cảng mẹ của Cầu cảng đang có dữ liệu liên quan (lượt tàu neo đậu, lịch sử kiểm tra kết cấu).
4. Mỗi lần cập nhật thành công, hệ thống tự động ghi nhận nhật ký thay đổi với thông tin: trường nào thay đổi, giá trị cũ, giá trị mới, người cập nhật và thời gian.

## In Scope

- Giao diện tra cứu và chọn Cầu cảng cần cập nhật
- Biểu mẫu cập nhật với dữ liệu hiện tại được điền sẵn
- Validation cho các trường kỹ thuật (kích thước, tải trọng, vật liệu)
- Kiểm tra xung đột dữ liệu trước khi lưu
- Ràng buộc cập nhật Bến cảng mẹ (không cho phép nếu có dữ liệu liên quan)
- Ghi nhật ký thay đổi vào bảng lịch sử
- Thông báo kết quả cập nhật cho người dùng

## Out of Scope

- Thay đổi mã Cầu cảng sau khi đã tạo (không cho phép)
- Quy trình phê duyệt thay đổi lớn (thuộc F-023)
- Xóa Cầu cảng (thuộc F-022)
- Lịch sử xem lại tất cả phiên bản cập nhật (thuộc F-025)
- Xuất báo cáo lịch sử cập nhật
- Tính toán an toàn kết cấu lại sau cập nhật

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Quản trị viên | Cập nhật, Xem, Xóa |
| Quản lý cảng | Cập nhật, Xem |
| Nhân viên vận hành | Xem |
| KháchExternal | Không có quyền truy cập |

## Entities

- **CauCang**: id (UUID), maCau (string, unique, read-only), tenCau (string), benCangMeId (UUID, FK → BenCang), loaiKetCau (enum: be_tong_co_thep, thep, go, to_hop), vatLieuChinh (string), taiTrongThietKe (decimal, T/m²), chieuDaiCau (decimal, m), chieuRongCau (decimal, m), mucNuocCaoNhat (decimal, m), trangThai (enum: cho_phe_duyet, hien_hanh, tam_ngung, da_xoa), ghiChu (text), createdAt (timestamp), updatedAt (timestamp)
- **LichSuThayDoi**: id (UUID), cauCangId (UUID), truongDuocCapNhat (string), giaTriCu (text), giaTriMoi (text), nguoiCapNhat (UUID), thoiGianCapNhat (timestamp)

## Business Rules

1. Mã cầu không được phép cập nhật sau khi Cầu cảng đã được tạo; mọi yêu cầu thay đổi mã cầu phải thông qua quy trình hủy bỏ và tạo lại.
2. Tải trọng thiết kế phải là giá trị dương, đơn vị T/m², không vượt quá 20 T/m².
3. Chiều dài và chiều rộng cầu phải là giá trị dương, không vượt quá 500m.
4. Việc thay đổi Bến cảng mẹ chỉ được cho phép nếu Cầu cảng chưa có dữ liệu liên quan; nếu có, hệ thống yêu cầu quy trình phê duyệt đặc biệt.
5. Nhật ký thay đổi phải được ghi nhận tự động cho mọi lần cập nhật.

## Testing Strategy

Kiểm thử đơn vị cho các quy tắc validation của từng trường kỹ thuật có thể cập nhật; kiểm thử tích hợp cho luồng cập nhật Cầu cảng qua API với các trường hợp cập nhật hợp lệ, không hợp lệ và xung đột; kiểm thử giao diện cho biểu mẫu cập nhật bao gồm validation thời gian thực; kiểm thử ràng buộc thay đổi Bến cảng mẹ khi có dữ liệu liên quan; kiểm thử nhật ký thay đổi.
