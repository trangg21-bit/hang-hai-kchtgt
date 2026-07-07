---
id: F-034
name: Quản lý Vùng nước - Xóa
slug: ql-vn-xoa
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-29T11:10:10Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Vùng nước - Xóa

## Description
Xóa Vùng nước khỏi hệ thống khi không còn sử dụng hoặc đã được điều chỉnh phân vùng, với cơ chế xóa mềm (soft delete) để bảo tồn dữ liệu lịch sử và hỗ trợ khôi phục nếu cần. Quy trình xóa yêu cầu xác nhận và được ghi nhận đầy đủ vào nhật ký hệ thống. Chỉ Vùng nước đã được phê duyệt mới có thể xóa.

## Business Intent
Cho phép loại bỏ Vùng nước không còn hoạt động hoặc đã sáp nhập vào Vùng nước khác khỏi danh sách khai thác, giúp hệ thống luôn phản ánh đúng thực tế quản lý phân vùng biển. Việc xóa mềm đảm bảo dữ liệu không bị mất vĩnh viễn, hỗ trợ công tác kiểm toán và khôi phục trong trường hợp xóa nhầm. Quy trình xóa có xác nhận ngăn ngừa xóa vô tình hoặc xóa trái phép đối với tài sản vùng nước quan trọng.

## Flow Summary
Người dùng chọn một Vùng nước từ danh sách và chọn hành động "Xóa". Hệ thống kiểm tra điều kiện — chỉ Vùng nước đã phê duyệt mới có thể xóa. Hộp thoại xác nhận hiển thị thông tin Vùng nước và cảnh báo về hậu quả của việc xóa. Người dùng xác nhận bằng cách nhập mã Vùng nước hoặc nhấn nút xác nhận. Hệ thống thực hiện xóa mềm — chuyển trạng thái Vùng nước thành "đã xóa" thay vì xóa vĩnh viễn — ghi nhận người xóa, ngày giờ xóa và lưu vào nhật ký. Vùng nước bị xóa không còn hiển thị trong danh sách khai thác nhưng vẫn可查看 trong lịch sử.

## Acceptance Criteria
1. Người dùng nhận được hộp thoại xác nhận trước khi xóa Vùng nước
2. Chỉ Vùng nước đã được phê duyệt mới có thể xóa
3. Vùng nước bị xóa mềm (soft delete), không bị xóa vĩnh viễn khỏi cơ sở dữ liệu
4. Nhật ký xóa được ghi nhận đầy đủ: người xóa, ngày giờ, lý do
5. Không thể xóa Vùng nước đang có hoạt động khai thác đang diễn ra

## In Scope
- Xóa mềm Vùng nước (soft delete)
- Kiểm tra điều kiện: chỉ Vùng nước đã phê duyệt mới được xóa
- Xác nhận xóa bằng hộp thoại
- Ghi nhật ký xóa vào hệ thống
- Không hiển thị Vùng nước đã xóa trong danh sách chính
- Kiểm tra điều kiện xóa (không có hoạt động đang diễn ra)

## Out of Scope
- Xóa vĩnh viễn Vùng nước khỏi cơ sở dữ liệu
- Khôi phục Vùng nước đã xóa (thuộc chức năng quản lý khôi phục riêng)
- Xóa hàng loạt Vùng nước
- Xóa tự động theo quy tắc thời gian

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên Cảng | Không có quyền xóa |
| Trưởng phòng QL Cảng | Xóa (có xác nhận) |
| Quản trị viên | Xóa, Khôi phục |

## Entities
- **VungNuoc**: id, ma, ten, viTri, toDo, dienTich, doSau, dieuKienHaiVan, khaNangThongHanh, loaiVungNuoc, trangThai, daXoa, nguoiXoa, ngayXoa, createdAt, updatedAt
- **NhatKyXoa**: id, vungNuocId, vungNuocMa, vungNuocTen, nguoiXoa, ngayXoa, lyDo, createdAt

## Business Rules
1. Chỉ người dùng vai trò Trưởng phòng hoặc Quản trị viên mới có quyền xóa
2. Chỉ Vùng nước đã được phê duyệt mới có thể xóa
3. Phải có xác nhận bằng hộp thoại trước khi xóa
4. Không thể xóa Vùng nước đang có hoạt động khai thác đang diễn ra
5. Xóa là xóa mềm — dữ liệu vẫn được bảo tồn với cờ đã xóa
6. Nhật ký xóa phải ghi nhận đầy đủ người xóa và ngày giờ

## Testing Strategy
Kiểm thử xóa với Vùng nước đã phê duyệt (thành công), kiểm thử xóa với Vùng nước chưa phê duyệt (bị chặn), kiểm thử xóa với Vùng nước đang có hoạt động (bị chặn), kiểm thử xác nhận xóa, kiểm thử xóa mềm và khôi phục, kiểm thử ghi nhật ký xóa, kiểm thử phân quyền xóa.
