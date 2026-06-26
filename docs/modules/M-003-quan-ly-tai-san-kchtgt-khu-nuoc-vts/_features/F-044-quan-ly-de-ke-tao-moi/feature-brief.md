---
id: F-044
name: Quản lý Đê/kè - Tạo mới
slug: quan-ly-de-ke-tao-moi
module-id: M-003
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Đê/kè - Tạo mới

## Description
Chuyên viên cho phép nhập liệu và tạo mới một bản ghi thông tin về đê/kè vào hệ thống quản lý tài sản KCHTGT khu nước VTS, bao gồm các thông tin về vị trí, loại đê/kè, chiều dài, năm xây dựng, vật liệu và các thông số kỹ thuật liên quan đến công trình bảo vệ bờ.

## Business Intent
Hệ thống cần ghi nhận chính xác và đầy đủ thông tin về các công trình đê/kè trong khu nước VTS để phục vụ công tác quản lý, bảo trì và lập kế hoạch đầu tư cải tạo, đảm bảo an toàn cho hoạt động hàng hải và khai thác cảng trong khu vực.

## Flow Summary
Chuyên viên đăng nhập hệ thống, truy cập mục Đê/kè, chọn chức năng Tạo mới, điền đầy đủ các trường thông tin bắt buộc bao gồm tên công trình, vị trí địa lý, loại đê/kè, chiều dài, năm xây dựng, vật liệu cấu tạo và các thông số kỹ thuật khác. Hệ thống kiểm tra tính hợp lệ của dữ liệu, sau khi lưu thành công bản ghi sẽ ở trạng thái chờ phê duyệt và gửi thông báo cho cấp phê duyệt.

## Acceptance Criteria
- Chuyên viên có thể tạo thành công bản ghi đê/kè với đầy đủ thông tin bắt buộc
- Hệ thống tự động kiểm tra tính hợp lệ của các trường dữ liệu (chiều dài, năm xây dựng, định dạng tọa độ)
- Bản ghi mới được lưu ở trạng thái "chờ phê duyệt" và không hiển thị trong báo cáo tổng hợp
- Hệ thống gửi thông báo tự động đến cấp phê duyệt (trưởng phòng) khi có bản ghi mới được tạo
- Giao diện hiển thị lỗi rõ ràng khi người dùng nhập thiếu hoặc nhập sai định dạng dữ liệu

## In Scope
- Form nhập liệu đê/kè với các trường thông tin cơ bản và mở rộng
- Kiểm tra định dạng và tính hợp lệ của dữ liệu đầu vào (tọa độ, chiều dài, diện tích)
- Chuyển trạng thái bản ghi sang "chờ phê duyệt" sau khi tạo
- Gửi thông báo đến người có thẩm quyền phê duyệt

## Out of Scope
- Quy trình phê duyệt (thuộc tính năng F-047)
- Chỉnh sửa hoặc hủy bản ghi sau khi tạo (thuộc tính năng F-045)
- Xuất báo cáo thống kê đê/kè
- Tích hợp dữ liệu từ hệ thống đo đạc địa chính

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Tạo mới, Xem chi tiết |
| Trưởng phòng | Xem chi tiết, Phê duyệt |
| Cục trưởng | Xem chi tiết, Phê duyệt cấp 2 |
| Admin | Quản lý hệ thống, Xem toàn bộ |

## Entities
- **DeKe**: id, tenCongTrinh, viTri, loaiDeKe, chieuDai, namXayDung, vatLieu, dienTich, doUng, trangThai, NguoiTao, ngayTao, nguoiCapNhat, ngayCapNhat

## Business Rules
1. Bản ghi đê/kè phải có tên công trình duy nhất trong khu vực quản lý
2. Chiều dài đê/kè phải là số dương, không vượt quá 99999 mét
3. Năm xây dựng phải là năm trong khoảng từ 1900 đến năm hiện tại
4. Các bản ghi mới tạo luôn ở trạng thái "chờ phê duyệt" trước khi được đưa vào sử dụng
5. Dữ liệu phải được lưu vào bảng lịch sử thay đổi để đảm bảo truy vết

## Testing Strategy
Kiểm thử đơn vị (unit test) các quy tắc nghiệp vụ trên entity DeKe. Kiểm thử chức năng tạo mới với dữ liệu hợp lệ và không hợp lệ (thiếu trường, sai định dạng tọa độ, chiều dài âm). Kiểm thử tự động hóa các kịch bản tạo bản ghi với các trường hợp biên (chiều dài tối đa, năm xây dựng lớn nhất).
