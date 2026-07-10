---
id: F-026
name: Quản lý Cảng cạn - Tạo mới
slug: ql-cct-tao-moi
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-29T11:10:06Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Cảng cạn - Tạo mới

## Description
Tạo mới Cảng cạn (Cảng nội địa, kho trung chuyển liên quan đến logistics hàng hải) trong hệ thống quản lý tài sản KCHTGT, bao gồm điền đầy đủ thông tin kỹ thuật, địa lý, năng lực và các giấy tờ pháp lý liên quan.

## Business Intent
Cho phép nhân viên có thẩm quyền đăng ký và khởi tạo Cảng cạn mới vào hệ thống, phục vụ công tác quản lý hạ tầng cảng biển và logistics liên quan. Việc tạo mới đúng quy trình đảm bảo mọi cảng cạn đều được thu thập đầy đủ thông tin, sẵn sàng cho quy trình phê duyệt và đưa vào khai thác, góp phần hoàn thiện cơ sở dữ liệu tài sản quốc gia về cảng biển.

## Flow Summary
Nhân viên Cảng truy cập giao diện "Tạo mới Cảng cạn", điền đầy đủ các trường thông tin bắt buộc: mã cảng, tên cảng, địa chỉ, tọa độ, loại hình, diện tích, năng lực xử lý, dịch vụ cung cấp. Hệ thống kiểm tra tính hợp lệ của các trường, tạo mã tự động nếu chưa cung cấp và lưu Cảng cạn ở trạng thái "chờ phê duyệt". Sau khi lưu, người dùng có thể đính kèm giấy tờ liên quan (giấy phép thành lập, quyết định chủ trương) và gửi yêu cầu phê duyệt để đưa Cảng cạn vào khai thác.

## Acceptance Criteria
1. Nhân viên Cảng có thể điền đầy đủ thông tin bắt buộc để tạo mới Cảng cạn
2. Hệ thống kiểm tra hợp lệ dữ liệu và báo lỗi rõ ràng cho các trường không hợp lệ
3. Cảng cạn mới được lưu với trạng thái "chờ phê duyệt" và không hiển thị trong danh sách khai thác
4. Mã Cảng cạn được tự động sinh theo quy tắc nếu người dùng chưa nhập
5. Người dùng có thể đính kèm tối thiểu một giấy tờ pháp lý khi tạo mới

## In Scope
- Form tạo mới Cảng cạn với các trường bắt buộc
- Kiểm tra hợp lệ dữ liệu đầu vào
- Tự động sinh mã Cảng cạn
- Lưu ở trạng thái "chờ phê duyệt"
- Đính kèm giấy tờ pháp lý liên quan
- Chuyển sang quy trình phê duyệt (F-029)

## Out of Scope
- Chỉnh sửa Cảng cạn sau khi tạo (thuộc F-027)
- Xóa Cảng cạn (thuộc F-028)
- Phê duyệt Cảng cạn (thuộc F-029)
- Xuất báo cáo danh sách Cảng cạn

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Nhân viên Cảng | Tạo mới, Chỉnh sửa (khi chờ phê duyệt) |
| Trưởng phòng QL Cảng | Xem, Phê duyệt |
| Quản trị viên | Tạo mới, Chỉnh sửa, Xóa |

## Entities
- **CangCan**: id, ma, ten, diaChi, toDo, loaiHinh, dienTich, nangLxuLy, dichVu, trangThai, ghiChu, createdAt, updatedAt
- **GiayTo**: id, cangCanId, tenGiayTo, loaiTaiLieu, duongDan, nguoiTanRieng, ngayCapNhat

## Business Rules
1. Mã Cảng cạn phải là duy nhất trên toàn hệ thống
2. Tên Cảng cạn không được trùng với Cảng cạn đã tồn tại
3. Cảng cạn mới luôn ở trạng thái "chờ phê duyệt" khi được tạo
4. Các trường: mã, tên, địa chỉ và loại hình là bắt buộc khi tạo mới
5. Chỉ Cảng cạn ở trạng thái "chờ phê duyệt" hoặc "bị từ chối" mới được chỉnh sửa

## Testing Strategy
Kiểm thử form tạo mới với đầy đủ dữ liệu hợp lệ và không hợp lệ, kiểm thử sinh mã tự động, kiểm thử lưu dữ liệu ở trạng thái "chờ phê duyệt", kiểm thử đính kèm giấy tờ, kiểm thử xác thực quyền tạo mới, kiểm thử trùng mã và trùng tên.
