---
id: F-010
name: Quản lý Cảng biển - Xóa
slug: ql-cb-xoa
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-16T04:40:19Z
last-updated: 2026-06-29T11:09:58Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Cảng biển - Xóa

## Description

Tính năng cho phép người dùng có thẩm quyền xóa một Cảng biển khỏi hệ thống quản lý tài sản KCHTGT cảng-bến, áp dụng cơ chế xóa mềm (soft delete) để bảo tồn dữ liệu lịch sử và tuân thủ quy định lưu trữ hồ sơ hạ tầng giao thông, đồng thời đảm bảo các điều kiện ràng buộc liên quan được kiểm tra trước khi thực hiện xóa.

## Business Intent

Việc xóa Cảng biển khỏi hệ thống chỉ được thực hiện khi cảng chấm dứt hoạt động vĩnh viễn hoặc được tái cấu trúc thành đơn vị khác; cơ chế xóa mềm giúp duy trì tính toàn vẹn của dữ liệu lịch sử, phục vụ công tác kiểm toán và báo cáo thống kê, đồng thời cho phép khôi phục nếu có sai sót trong quá trình xóa.

## Flow Summary

Người dùng đăng nhập vào hệ thống, tìm kiếm và chọn Cảng biển cần xóa từ danh sách hoặc trang chi tiết. Hệ thống hiển thị thông tin Cảng biển kèm cảnh báo về hậu quả của việc xóa. Người dùng xác nhận hành động xóa bằng cách nhập tên Cảng biển để xác nhận. Hệ thống kiểm tra điều kiện xóa: Cảng biển không được có dữ liệu liên quan chưa được xử lý (nếu có), không nằm trong quá trình phê duyệt. Nếu vượt qua kiểm tra, hệ thống đánh dấu Cảng biển là "đã xóa" (soft delete), ghi nhật ký xóa, và cập nhật trạng thái hiển thị trong danh sách.

## Acceptance Criteria

1. Chỉ người dùng có vai trò "Admin" hoặc "Quản lý cảng" mới có thể thực hiện thao tác xóa Cảng biển.
2. Hệ thống yêu cầu xác nhận xóa bằng cách nhập tên Cảng biển vào hộp thoại xác nhận trước khi thực hiện xóa.
3. Hệ thống kiểm tra điều kiện ràng buộc trước khi xóa: nếu Cảng biển đang có dữ liệu liên quan (tàu, lịch sử vận hành) chưa được xử lý, hệ thống hiển thị cảnh báo và ngăn xóa.
4. Sau khi xóa thành công, Cảng biển không còn hiển thị trong danh sách mặc định nhưng vẫn được lưu trữ với trạng thái "đã xóa" và có thể khôi phục trong thời hạn quy định.

## In Scope

- Giao diện chọn và xác nhận xóa Cảng biển
- Kiểm tra điều kiện ràng buộc (dữ liệu liên quan, trạng thái)
- Xác nhận xóa bằng cách nhập tên Cảng biển
- Xóa mềm (soft delete) với ghi nhật ký
- Khôi phục Cảng biển đã xóa trong thời hạn cho phép
- Cập nhật trạng thái hiển thị trong danh sách

## Out of Scope

- Xóa cứng Cảng biển khỏi cơ sở dữ liệu
- Xóa hàng loạt nhiều Cảng biển cùng lúc
- Xóa Cảng biển kèm dữ liệu liên quan (cascade delete)
- Phê duyệt xóa bởi cấp quản lý cao hơn (thuộc F-011)
- Xuất báo cáo lịch sử xóa

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Quản trị viên | Xóa, Xem, Khôi phục |
| Quản lý cảng | Xóa, Xem, Khôi phục |
| Nhân viên vận hành | Xem (không xóa) |
| KháchExternal | Không có quyền truy cập |

## Entities

- **CangBien**: id (UUID), maCang (string, unique), tenCang (string), tinhThanh (string), toDo (JSON: {lat, lng}), dienTich (decimal), khaNangTiepNhanTau (string), trangThai (enum: cho_phe_duyet, hien_hanh, tam_ngung, da_xoa), ghiChu (text), createdAt (timestamp), updatedAt (timestamp), deletedAt (timestamp, nullable), deletedBy (UUID, nullable)

## Business Rules

1. Xóa Cảng biển áp dụng cơ chế xóa mềm (soft delete) — trạng thái chuyển thành "da_xoa", trường deletedAt và deletedBy được tự động điền.
2. Không cho phép xóa Cảng biển đang có dữ liệu liên quan chưa được xử lý hoặc đang trong quá trình phê duyệt thay đổi.
3. Cảng biển bị xóa có thể được khôi phục trong vòng 90 ngày kể từ ngày xóa; sau thời hạn này dữ liệu chỉ được xử lý theo quy định lưu trữ.
4. Nhật ký xóa phải ghi nhận đầy đủ: ai xóa, khi nào xóa, lý do xóa (nếu có).

## Testing Strategy

Kiểm thử đơn vị cho quy tắc xóa mềm và kiểm tra điều kiện ràng buộc; kiểm thử tích hợp cho luồng xóa Cảng biển với các trường hợp: xóa thành công, xóa bị chặn do dữ liệu liên quan, và xóa khi không có quyền; kiểm thử giao diện cho hộp thoại xác nhận xóa; kiểm thử khôi phục Cảng biển đã xóa trong thời hạn cho phép.
