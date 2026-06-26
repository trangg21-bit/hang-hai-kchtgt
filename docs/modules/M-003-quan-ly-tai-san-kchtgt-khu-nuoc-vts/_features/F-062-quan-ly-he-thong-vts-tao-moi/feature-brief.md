---
id: F-062
name: Quản lý Hệ thống VTS - Tạo mới
slug: quan-ly-he-thong-vts-tao-moi
module-id: M-003
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Hệ thống VTS - Tạo mới

## Description
Chuyên viên cho phép nhập liệu và tạo mới một bản ghi thông tin về hệ thống VTS (Vessel Traffic Service) vào hệ thống quản lý tài sản KCHTGT khu nước VTS, bao gồm các thông tin về tên hệ thống, vị trí lắp đặt, loại thiết bị, phạm vi bao phủ, công suất hoạt động và các thông số kỹ thuật vận hành liên quan.

## Business Intent
Hệ thống cần ghi nhận chính xác và đầy đủ thông tin về các hệ thống VTS trong khu nước VTS để phục vụ công tác quản lý, giám sát và lập kế hoạch đầu tư nâng cấp, đảm bảo hoạt động dịch vụ thông tin giao thông đường thủy được vận hành hiệu quả và an toàn trong khu vực quản lý.

## Flow Summary
Chuyên viên đăng nhập hệ thống, truy cập mục Hệ thống VTS, chọn chức năng Tạo mới, điền đầy đủ các trường thông tin bắt buộc bao gồm tên hệ thống, vị trí lắp đặt, loại thiết bị VTS, phạm vi bao phủ (nm), công suất hoạt động, ngày đưa vào vận hành và các thông số kỹ thuật khác. Hệ thống kiểm tra tính hợp lệ của dữ liệu, sau khi lưu thành công bản ghi sẽ ở trạng thái chờ phê duyệt và gửi thông báo cho cấp phê duyệt.

## Acceptance Criteria
- Chuyên viên có thể tạo thành công bản ghi hệ thống VTS với đầy đủ thông tin bắt buộc
- Hệ thống tự động kiểm tra tính hợp lệ của các trường dữ liệu (phạm vi bao phủ, tọa độ, định dạng dữ liệu)
- Bản ghi mới được lưu ở trạng thái "chờ phê duyệt" và không hiển thị trong báo cáo tổng hợp
- Hệ thống gửi thông báo tự động đến cấp phê duyệt (trưởng phòng) khi có bản ghi mới được tạo
- Giao diện hiển thị lỗi rõ ràng khi người dùng nhập thiếu hoặc nhập sai định dạng dữ liệu

## In Scope
- Form nhập liệu hệ thống VTS với các trường thông tin cơ bản và mở rộng
- Kiểm tra định dạng và tính hợp lệ của dữ liệu đầu vào (tọa độ, phạm vi bao phủ, công suất)
- Chuyển trạng thái bản ghi sang "chờ phê duyệt" sau khi tạo
- Gửi thông báo đến người có thẩm quyền phê duyệt

## Out of Scope
- Quy trình phê duyệt (thuộc tính năng F-065)
- Chỉnh sửa hoặc hủy bản ghi sau khi tạo (thuộc tính năng F-063)
- Xuất báo cáo thống kê hệ thống VTS
- Tích hợp dữ liệu từ hệ thống giám sát VTS thực tế

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Tạo mới, Xem chi tiết |
| Trưởng phòng | Xem chi tiết, Phê duyệt |
| Cục trưởng | Xem chi tiết, Phê duyệt cấp 2 |
| Admin | Quản lý hệ thống, Xem toàn bộ |

## Entities
- **HeThongVTS**: id, tenHeThong, viTri, loaiThietBi, phamViBaoPhu, congSuat, ngayVaoVanhHan, heSoHieuQua, nguoiQuanLy, ghiChu, trangThai, NguoiTao, ngayTao, nguoiCapNhat, ngayCapNhat

## Business Rules
1. Bản ghi hệ thống VTS phải có tên hệ thống duy nhất trong khu vực quản lý
2. Phạm vi bao phủ phải là số dương, không vượt quá 999 nm (dặm hải lý)
3. Công suất hoạt động phải là số dương và không vượt quá 99999 W
4. Các bản ghi mới tạo luôn ở trạng thái "chờ phê duyệt" trước khi được đưa vào sử dụng
5. Dữ liệu phải được lưu vào bảng lịch sử thay đổi để đảm bảo truy vết

## Testing Strategy
Kiểm thử đơn vị (unit test) các quy tắc nghiệp vụ trên entity HeThongVTS. Kiểm thử chức năng tạo mới với dữ liệu hợp lệ và không hợp lệ (thiếu trường, sai định dạng tọa độ, phạm vi âm, công suất âm). Kiểm thử tự động hóa các kịch bản tạo bản ghi với các trường hợp biên (phạm vi tối đa, công suất lớn nhất).
