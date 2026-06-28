---
id: F-028
name: "Quản lý Cảng cạn - Xóa"
slug: ql-cct-xoa
module-id: M-002
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Cảng cạn - Xóa

## Description
Xóa Cảng cạn khỏi hệ thống khi không còn sử dụng, với cơ chế xóa mềm (soft delete) để bảo tồn dữ liệu lịch sử và hỗ trợ khôi phục nếu cần. Quy trình xóa yêu cầu xác nhận và được ghi nhận đầy đủ vào nhật ký hệ thống.

## Business Intent
Cho phép loại bỏ Cảng cạn không còn hoạt động hoặc đã sáp nhập khỏi danh sách khai thác, giúp hệ thống luôn phản ánh đúng thực tế quản lý. Việc xóa mềm đảm bảo dữ liệu không bị mất vĩnh viễn, hỗ trợ công tác kiểm toán và khôi phục trong trường hợp xóa nhầm. Quy trình xóa có xác nhận ngăn ngừa xóa vô tình hoặc xóa trái phép.

## Flow Summary
Người dùng chọn một Cảng cạn từ danh sách và chọn hành động "Xóa". Hệ thống hiển thị hộp thoại xác nhận với thông tin Cảng cạn và cảnh báo về hậu quả của việc xóa. Người dùng xác nhận bằng cách nhập mã Cảng cạn hoặc nhấn nút xác nhận. Hệ thống thực hiện xóa mềm — chuyển trạng thái Cảng cạn thành "đã xóa" thay vì xóa vĩnh viễn — ghi nhận người xóa, ngày giờ xóa và lưu vào nhật ký. Cảng cạn bị xóa không còn hiển thị trong danh sách khai thác nhưng vẫn可查看 trong lịch sử.

## Acceptance Criteria
1. Người dùng nhận được hộp thoại xác nhận trước khi xóa Cảng cạn
2. Cảng cạn bị xóa mềm (soft delete), không bị xóa vĩnh viễn khỏi cơ sở dữ liệu
3. Cảng cạn bị xóa không còn hiển thị trong danh sách khai thác chính
4. Nhật ký xóa được ghi nhận đầy đủ: người xóa, ngày giờ, lý do
5. Không thể xóa Cảng cạn đang có hoạt động logistics đang diễn ra

## In Scope
- Xóa mềm Cảng cạn (soft delete)
- Xác nhận xóa bằng hộp thoại
- Ghi nhật ký xóa vào hệ thống
- Không hiển thị Cảng cạn đã xóa trong danh sách chính
- Kiểm tra điều kiện xóa (không có hoạt động đang diễn ra)

## Out of Scope
- Xóa vĩnh viễn Cảng cạn khỏi cơ sở dữ liệu
- Khôi phục Cảng cạn đã xóa (thuộc chức năng quản lý khôi phục riêng)
- Xóa hàng loạt Cảng cạn
- Xóa tự động theo quy tắc thời gian

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Nhân viên Cảng | Không có quyền xóa |
| Trưởng phòng QL Cảng | Xóa (có xác nhận) |
| Quản trị viên | Xóa, Khôi phục |

## Entities
- **CangCan**: id, ma, ten, diaChi, toDo, loaiHinh, dienTich, nangLxuLy, dichVu, trangThai, daXoa, nguoiXoa, ngayXoa, createdAt, updatedAt
- **NhatKyXoa**: id, cangCanId, cangCanMa, cangCanTen, nguoiXoa, ngayXoa, lyDo, createdAt

## Business Rules
1. Chỉ người dùng vai trò Trưởng phòng hoặc Quản trị viên mới có quyền xóa
2. Phải có xác nhận bằng hộp thoại trước khi xóa
3. Không thể xóa Cảng cạn đang có hoạt động logistics đang diễn ra
4. Xóa là xóa mềm — dữ liệu vẫn được bảo tồn với cờ đã xóa
5. Nhật ký xóa phải ghi nhận đầy đủ người xóa và ngày giờ

## Testing Strategy
Kiểm thử xóa với Cảng cạn không có hoạt động (thành công), kiểm thử xóa với Cảng cạn đang có hoạt động (bị chặn), kiểm thử xác nhận xóa, kiểm thử xóa mềm và khôi phục, kiểm thử ghi nhật ký xóa, kiểm thử phân quyền xóa.
