---
id: F-027
name: Quản lý Cảng cạn - Cập nhật
slug: ql-cct-cap-nhat
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-29T11:10:06Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Cảng cạn - Cập nhật

## Description
Cập nhật thông tin của Cảng cạn đã tồn tại trong hệ thống, bao gồm thay đổi địa chỉ, năng lực, dịch vụ, các trường kỹ thuật và giấy tờ pháp lý liên quan, với lịch sử biến động được ghi nhận tự động.

## Business Intent
Cho phép cập nhật thông tin Cảng cạn khi có thay đổi về điều kiện vận hành, mở rộng năng lực, thay đổi địa chỉ hoặc điều chỉnh giấy tờ pháp lý. Việc cập nhật đúng quy trình đảm bảo cơ sở dữ liệu luôn chính xác và cập nhật, hỗ trợ công tác quản lý và ra quyết định. Mọi thay đổi đều được ghi nhận lịch sử để phục vụ kiểm toán và追溯 nguồn gốc.

## Flow Summary
Người dùng chọn một Cảng cạn từ danh sách, truy cập giao diện "Cập nhật" và điền thông tin cần thay đổi. Hệ thống so sánh giá trị trước và sau khi cập nhật, ghi nhận lịch sử thay đổi chi tiết. Sau khi lưu, nếu thay đổi ảnh hưởng đến điều kiện phê duyệt (ví dụ: thay đổi năng lực xử lý), hệ thống tự động chuyển trạng thái sang "cần phê duyệt lại" và gửi yêu cầu phê duyệt mới. Người dùng có thể cập nhật nhiều trường cùng lúc trong một lần.

## Acceptance Criteria
1. Người dùng có thể chọn một Cảng cạn và truy cập giao diện cập nhật
2. Hệ thống hiển thị giá trị hiện tại và cho phép chỉnh sửa các trường cần thay đổi
3. Hệ thống tự động ghi nhận lịch sử thay đổi sau khi lưu
4. Thay đổi quan trọng kích hoạt yêu cầu phê duyệt lại
5. Dữ liệu được kiểm tra hợp lệ trước khi lưu

## In Scope
- Form cập nhật thông tin Cảng cạn
- Hiển thị giá trị hiện tại và giá trị mới
- Ghi nhận lịch sử thay đổi tự động
- Kiểm tra hợp lệ dữ liệu trước khi lưu
- Kích hoạt phê duyệt lại khi thay đổi quan trọng

## Out of Scope
- Tạo mới Cảng cạn (thuộc F-026)
- Xóa Cảng cạn (thuộc F-028)
- Xem chi tiết Cảng cạn (thuộc F-030)
- Xem lịch sử thay đổi (thuộc F-031)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Nhân viên Cảng | Cập nhật (khi Cảng cạn không khóa) |
| Trưởng phòng QL Cảng | Cập nhật, Phê duyệt lại |
| Quản trị viên | Cập nhật, Khóa/Mở khóa |

## Entities
- **CangCan**: id, ma, ten, diaChi, toDo, loaiHinh, dienTich, nangLxuLy, dichVu, trangThai, ghiChu, createdAt, updatedAt
- **LichSuCangCan**: id, cangCanId, ngayThayDoi, nguoiThucHien, loaiThayDoi, noiDungTruoc, noiDungSau, ghiChu, createdAt

## Business Rules
1. Chỉ Cảng cạn ở trạng thái "chờ phê duyệt", "bị từ chối" hoặc "đã kích hoạt" mới được cập nhật
2. Các trường: tên, địa chỉ và loại hình là bắt buộc khi cập nhật
3. Thay đổi năng lực xử lý hoặc loại hình phải được phê duyệt lại
4. Lịch sử thay đổi được ghi nhận tự động cho mọi cập nhật
5. Người cập nhật được ghi nhận tự động từ tài khoản đăng nhập

## Testing Strategy
Kiểm thử cập nhật từng trường đơn lẻ và nhiều trường cùng lúc, kiểm thử ghi nhận lịch sử thay đổi, kiểm thử kích hoạt phê duyệt lại khi thay đổi quan trọng, kiểm thử hợp lệ dữ liệu đầu vào, kiểm thử khi Cảng cạn bị khóa.
