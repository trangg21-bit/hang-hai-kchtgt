---
id: F-038
name: Quản lý Lượng hàng hải - Tạo mới
slug: quan-ly-luong-hang-hai-tao-moi
module-id: M-003
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Lượng hàng hải - Tạo mới

## Description
Chuyên viên cho phép nhập liệu và tạo mới một bản ghi thông tin lượng hàng hải vào hệ thống quản lý tài sản KCHTGT khu nước VTS, bao gồm các thông tin về loại tàu, số lượng, thời gian cập bến, xuất bến và các thông số liên quan đến hoạt động giao thông thủy trong khu vực.

## Business Intent
Hệ thống cần ghi nhận chính xác và đầy đủ thông tin lượng hàng hải để phục vụ công tác quản lý, thống kê và báo cáo về hoạt động giao thông tàu thuyền trong khu nước VTS, làm cơ sở cho việc lập kế hoạch và ra quyết định quản lý tài sản hạ tầng hàng hải.

## Flow Summary
Chuyên viên đăng nhập hệ thống, truy cập mục Lượng hàng hải, chọn chức năng Tạo mới, điền đầy đủ các trường thông tin bắt buộc bao gồm ngày giờ ghi nhận, loại tàu, số lượng tàu đi qua, tải trọng, và các thông số phụ trợ khác. Hệ thống kiểm tra tính hợp lệ của dữ liệu, sau khi lưu thành công bản ghi sẽ ở trạng thái chờ phê duyệt và gửi thông báo cho cấp phê duyệt.

## Acceptance Criteria
- Chuyên viên có thể tạo thành công bản ghi lượng hàng hải với đầy đủ thông tin bắt buộc
- Hệ thống tự động kiểm tra tính hợp lệ của các trường dữ liệu (ngày giờ, số lượng, định dạng)
- Bản ghi mới được lưu ở trạng thái "chờ phê duyệt" và không hiển thị trong báo cáo tổng hợp
- Hệ thống gửi thông báo tự động đến cấp phê duyệt (trưởng phòng) khi có bản ghi mới được tạo
- Giao diện hiển thị lỗi rõ ràng khi người dùng nhập thiếu hoặc nhập sai định dạng dữ liệu

## In Scope
- Form nhập liệu lượng hàng hải với các trường thông tin cơ bản và mở rộng
- Kiểm tra định dạng và tính hợp lệ của dữ liệu đầu vào
- Chuyển trạng thái bản ghi sang "chờ phê duyệt" sau khi tạo
- Gửi thông báo đến người có thẩm quyền phê duyệt

## Out of Scope
- Quy trình phê duyệt (thuộc tính năng F-041)
- Chỉnh sửa hoặc hủy bản ghi sau khi tạo (thuộc tính năng F-039)
- Xuất báo cáo thống kê lượng hàng hải
- Tích hợp tự động dữ liệu lượng hàng hải từ hệ thống AIS

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Tạo mới, Xem chi tiết |
| Trưởng phòng | Xem chi tiết, Phê duyệt |
| Cục trưởng | Xem chi tiết, Phê duyệt cấp 2 |
| Admin | Quản lý hệ thống, Xem toàn bộ |

## Entities
- **LuongHangHai**: id, loaiTau, soLuong, ngayGhiNhan, gioDien, taiTrong, dienTichDangBo, ghiChu, trangThai,NguoiTao, ngayTao, nguoiCapNhat, ngayCapNhat

## Business Rules
1. Bản ghi lượng hàng hải phải có ngày giờ ghi nhận không vượt quá thời điểm hiện tại
2. Số lượng tàu phải là số nguyên dương, không âm và không vượt quá 9999
3. Các bản ghi mới tạo luôn ở trạng thái "chờ phê duyệt" trước khi được đưa vào sử dụng
4. Một ngày trong một khu vực chỉ được phép tạo một bản ghi lượng hàng hải tổng hợp duy nhất
5. Dữ liệu phải được lưu vào bảng lịch sử thay đổi để đảm bảo truy vết

## Testing Strategy
Kiểm thử đơn vị (unit test) các quy tắc nghiệp vụ trên entity LuongHangHai. Kiểm thử chức năng tạo mới với dữ liệu hợp lệ và không hợp lệ (thiếu trường, sai định dạng, giá trị âm). Kiểm thử tự động hóa các kịch bản tạo bản ghi với các trường hợp biên (số lượng tối đa, ngày giờ lớn nhất).
