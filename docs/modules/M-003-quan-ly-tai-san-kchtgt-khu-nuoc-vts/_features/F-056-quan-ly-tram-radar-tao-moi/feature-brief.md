---
id: F-056
name: Quản lý Trạm radar - Tạo mới
slug: quan-ly-tram-radar-tao-moi
module-id: M-003
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Trạm radar - Tạo mới

## Description
Chuyên viên cho phép nhập liệu và tạo mới một bản ghi thông tin về trạm radar vào hệ thống quản lý tài sản KCHTGT khu nước VTS, bao gồm các thông tin về tên trạm, vị trí, loại radar, phạm vi hoạt động, trạng thái kỹ thuật và các thông số vận hành liên quan.

## Business Intent
Hệ thống cần ghi nhận chính xác và đầy đủ thông tin về các trạm radar trong khu nước VTS để phục vụ công tác quản lý, giám sát và lập kế hoạch bảo trì, đảm bảo hoạt động giám sát hàng hải được liên tục và hiệu quả trong khu vực quản lý.

## Flow Summary
Chuyên viên đăng nhập hệ thống, truy cập mục Trạm radar, chọn chức năng Tạo mới, điền đầy đủ các trường thông tin bắt buộc bao gồm tên trạm, vị trí địa lý, loại radar, phạm vi hoạt động (km), trạng thái kỹ thuật, ngày đưa vào vận hành và các thông số kỹ thuật khác. Hệ thống kiểm tra tính hợp lệ của dữ liệu, sau khi lưu thành công bản ghi sẽ ở trạng thái chờ phê duyệt và gửi thông báo cho cấp phê duyệt.

## Acceptance Criteria
- Chuyên viên có thể tạo thành công bản ghi trạm radar với đầy đủ thông tin bắt buộc
- Hệ thống tự động kiểm tra tính hợp lệ của các trường dữ liệu (phạm vi, tọa độ, định dạng dữ liệu)
- Bản ghi mới được lưu ở trạng thái "chờ phê duyệt" và không hiển thị trong báo cáo tổng hợp
- Hệ thống gửi thông báo tự động đến cấp phê duyệt (trưởng phòng) khi có bản ghi mới được tạo
- Giao diện hiển thị lỗi rõ ràng khi người dùng nhập thiếu hoặc nhập sai định dạng dữ liệu

## In Scope
- Form nhập liệu trạm radar với các trường thông tin cơ bản và mở rộng
- Kiểm tra định dạng và tính hợp lệ của dữ liệu đầu vào (tọa độ, phạm vi hoạt động)
- Chuyển trạng thái bản ghi sang "chờ phê duyệt" sau khi tạo
- Gửi thông báo đến người có thẩm quyền phê duyệt

## Out of Scope
- Quy trình phê duyệt (thuộc tính năng F-059)
- Chỉnh sửa hoặc hủy bản ghi sau khi tạo (thuộc tính năng F-057)
- Xuất báo cáo thống kê trạm radar
- Tích hợp dữ liệu từ hệ thống giám sát radar thực tế

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Tạo mới, Xem chi tiết |
| Trưởng phòng | Xem chi tiết, Phê duyệt |
| Cục trưởng | Xem chi tiết, Phê duyệt cấp 2 |
| Admin | Quản lý hệ thống, Xem toàn bộ |

## Entities
- **TramRadar**: id, tenTram, viTri, loaiRadar, phamViHoatDong, trangThaiKyThuat, ngayVaoVanhHan, heSoTruyenDan, nguoiQuanLy, ghiChu, trangThai, NguoiTao, ngayTao, nguoiCapNhat, ngayCapNhat

## Business Rules
1. Bản ghi trạm radar phải có tên trạm duy nhất trong khu vực quản lý
2. Phạm vi hoạt động phải là số dương, không vượt quá 999 km
3. Trạng thái kỹ thuật phải thuộc các giá trị: hoạt động, bảo trì, ngừng hoạt động
4. Các bản ghi mới tạo luôn ở trạng thái "chờ phê duyệt" trước khi được đưa vào sử dụng
5. Dữ liệu phải được lưu vào bảng lịch sử thay đổi để đảm bảo truy vết

## Testing Strategy
Kiểm thử đơn vị (unit test) các quy tắc nghiệp vụ trên entity TramRadar. Kiểm thử chức năng tạo mới với dữ liệu hợp lệ và không hợp lệ (thiếu trường, sai định dạng tọa độ, phạm vi âm). Kiểm thử tự động hóa các kịch bản tạo bản ghi với các trường hợp biên (phạm vi tối đa, ngày vận hành lớn nhất).
