---
id: F-050
name: Quản lý Cơ sở sửa chữa, đóng tàu - Tạo mới
slug: quan-ly-co-so-sua-chua-dong-tau-tao-moi
module-id: M-003
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Cơ sở sửa chữa, đóng tàu - Tạo mới

## Description
Chuyên viên cho phép nhập liệu và tạo mới một bản ghi thông tin về cơ sở sửa chữa, đóng tàu vào hệ thống quản lý tài sản KCHTGT khu nước VTS, bao gồm các thông tin về tên cơ sở, địa chỉ, loại hình dịch vụ, năng lực tiếp nhận, trang thiết bị và các thông số kỹ thuật liên quan.

## Business Intent
Hệ thống cần ghi nhận chính xác và đầy đủ thông tin về các cơ sở sửa chữa, đóng tàu trong khu nước VTS để phục vụ công tác quản lý, đánh giá năng lực và lập kế hoạch hợp tác, đảm bảo hỗ trợ tốt nhất cho hoạt động bảo trì, sửa chữa tàu thuyền trong khu vực.

## Flow Summary
Chuyên viên đăng nhập hệ thống, truy cập mục Cơ sở sửa chữa, đóng tàu, chọn chức năng Tạo mới, điền đầy đủ các trường thông tin bắt buộc bao gồm tên cơ sở, địa chỉ, loại hình dịch vụ (sửa chữa hoặc đóng mới), năng lực tiếp nhận tàu, trang thiết bị chính và các thông số kỹ thuật khác. Hệ thống kiểm tra tính hợp lệ của dữ liệu, sau khi lưu thành công bản ghi sẽ ở trạng thái chờ phê duyệt và gửi thông báo cho cấp phê duyệt.

## Acceptance Criteria
- Chuyên viên có thể tạo thành công bản ghi cơ sở sửa chữa, đóng tàu với đầy đủ thông tin bắt buộc
- Hệ thống tự động kiểm tra tính hợp lệ của các trường dữ liệu (số điện thoại, email, năng lực tàu)
- Bản ghi mới được lưu ở trạng thái "chờ phê duyệt" và không hiển thị trong báo cáo tổng hợp
- Hệ thống gửi thông báo tự động đến cấp phê duyệt (trưởng phòng) khi có bản ghi mới được tạo
- Giao diện hiển thị lỗi rõ ràng khi người dùng nhập thiếu hoặc nhập sai định dạng dữ liệu

## In Scope
- Form nhập liệu cơ sở sửa chữa, đóng tàu với các trường thông tin cơ bản và mở rộng
- Kiểm tra định dạng và tính hợp lệ của dữ liệu đầu vào (số điện thoại, email, diện tích)
- Chuyển trạng thái bản ghi sang "chờ phê duyệt" sau khi tạo
- Gửi thông báo đến người có thẩm quyền phê duyệt

## Out of Scope
- Quy trình phê duyệt (thuộc tính năng F-053)
- Chỉnh sửa hoặc hủy bản ghi sau khi tạo (thuộc tính năng F-051)
- Xuất báo cáo thống kê cơ sở sửa chữa
- Tích hợp dữ liệu từ hệ thống đăng ký doanh nghiệp

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Tạo mới, Xem chi tiết |
| Trưởng phòng | Xem chi tiết, Phê duyệt |
| Cục trưởng | Xem chi tiết, Phê duyệt cấp 2 |
| Admin | Quản lý hệ thống, Xem toàn bộ |

## Entities
- **CoSoSuaChua**: id, tenCoSo, diaChi, loaiHinhDV, nangLucTiepNhan, trangBiChinh, dienTich, soDienThoai, email, trangThai, NguoiTao, ngayTao, nguoiCapNhat, ngayCapNhat

## Business Rules
1. Bản ghi cơ sở sửa chữa phải có tên cơ sở duy nhất trong khu vực quản lý
2. Năng lực tiếp nhận tàu phải là số nguyên dương, không vượt quá 99999 DWT
3. Số điện thoại và email phải đúng định dạng quốc tế (nếu có)
4. Các bản ghi mới tạo luôn ở trạng thái "chờ phê duyệt" trước khi được đưa vào sử dụng
5. Dữ liệu phải được lưu vào bảng lịch sử thay đổi để đảm bảo truy vết

## Testing Strategy
Kiểm thử đơn vị (unit test) các quy tắc nghiệp vụ trên entity CoSoSuaChua. Kiểm thử chức năng tạo mới với dữ liệu hợp lệ và không hợp lệ (thiếu trường, sai định dạng điện thoại/email, năng lực âm). Kiểm thử tự động hóa các kịch bản tạo bản ghi với các trường hợp biên (năng lực tối đa, diện tích lớn nhất).
