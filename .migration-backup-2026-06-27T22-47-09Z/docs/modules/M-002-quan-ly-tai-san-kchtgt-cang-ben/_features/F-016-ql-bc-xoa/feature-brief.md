---
id: F-016
name: "Quản lý Bến cảng - Xóa"
slug: ql-bc-xoa
module-id: M-002
status: proposed
classification: local
priority: high
created: "2026-06-16T04:40:42Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Bến cảng - Xóa

## Description

Tính năng cho phép người dùng có thẩm quyền xóa một Bến cảng khỏi hệ thống quản lý tài sản KCHTGT cảng-bến, áp dụng cơ chế xóa mềm (soft delete) để bảo tồn dữ liệu lịch sử, đồng thời kiểm tra các điều kiện ràng buộc liên quan (lượt tàu, lịch sử phục vụ) trước khi thực hiện xóa để đảm bảo toàn vẹn dữ liệu.

## Business Intent

Việc xóa Bến cảng khỏi hệ thống chỉ được thực hiện khi bến chấm dứt hoạt động vĩnh viễn, bị phá dỡ hoặc được sáp nhập vào Bến cảng khác; cơ chế xóa mềm giúp duy trì tính toàn vẹn của dữ liệu lịch sử, phục vụ công tác kiểm toán, đánh giá hiệu quả đầu tư hạ tầng và báo cáo thống kê theo yêu cầu của cơ quan quản lý.

## Flow Summary

Người dùng đăng nhập vào hệ thống, tìm kiếm và chọn Bến cảng cần xóa từ danh sách hoặc trang chi tiết. Hệ thống hiển thị thông tin Bến cảng kèm cảnh báo về hậu quả của việc xóa. Người dùng xác nhận hành động xóa bằng cách nhập tên Bến cảng vào hộp thoại xác nhận. Hệ thống kiểm tra điều kiện xóa: Bến cảng không được có dữ liệu liên quan (lượt tàu, lịch sử phục vụ) chưa được xử lý. Nếu vượt qua kiểm tra, hệ thống đánh dấu Bến cảng là "đã xóa" (soft delete), ghi nhật ký xóa và cập nhật trạng thái trong danh sách.

## Acceptance Criteria

1. Chỉ người dùng có vai trò "Admin" hoặc "Quản lý cảng" mới có thể thực hiện thao tác xóa Bến cảng.
2. Hệ thống yêu cầu xác nhận xóa bằng cách nhập tên Bến cảng vào hộp thoại xác nhận trước khi thực hiện xóa.
3. Hệ thống kiểm tra điều kiện ràng buộc: nếu Bến cảng đang có dữ liệu liên quan (lượt tàu, lịch sử phục vụ), hệ thống hiển thị cảnh báo chi tiết và ngăn xóa, đề xuất phương án xử lý dữ liệu liên quan trước.
4. Sau khi xóa thành công, Bến cảng không còn hiển thị trong danh sách mặc định nhưng vẫn được lưu trữ với trạng thái "đã xóa" và có thể khôi phục trong thời hạn quy định.

## In Scope

- Giao diện chọn và xác nhận xóa Bến cảng
- Kiểm tra điều kiện ràng buộc (dữ liệu liên quan: lượt tàu, lịch sử phục vụ)
- Xác nhận xóa bằng cách nhập tên Bến cảng
- Xóa mềm (soft delete) với ghi nhật ký
- Khôi phục Bến cảng đã xóa trong thời hạn cho phép
- Cập nhật trạng thái hiển thị trong danh sách

## Out of Scope

- Xóa cứng Bến cảng khỏi cơ sở dữ liệu
- Xóa hàng loạt nhiều Bến cảng cùng lúc
- Xóa Bến cảng kèm dữ liệu liên quan (cascade delete)
- Phê duyệt xóa bởi cấp quản lý cao hơn (thuộc F-017)
- Xuất báo cáo lịch sử xóa

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Quản trị viên | Xóa, Xem, Khôi phục |
| Quản lý cảng | Xóa, Xem, Khôi phục |
| Nhân viên vận hành | Xem (không xóa) |
| KháchExternal | Không có quyền truy cập |

## Entities

- **BenCang**: id (UUID), maBen (string, unique), tenBen (string), cangMeId (UUID, FK → CangBien), tuyensDuongThuy (string), toDo (JSON: {lat, lng}), chieuDaiBen (decimal, m), chieuRongBen (decimal, m), loaiBen (enum: hang_containers, hang_kho, dau_khi, dich_vu), doSauLuongTruocBen (decimal, m), trangThai (enum: cho_phe_duyet, hien_hanh, tam_ngung, da_xoa), ghiChu (text), createdAt (timestamp), updatedAt (timestamp), deletedAt (timestamp, nullable), deletedBy (UUID, nullable)

## Business Rules

1. Xóa Bến cảng áp dụng cơ chế xóa mềm (soft delete) — trạng thái chuyển thành "da_xoa", trường deletedAt và deletedBy được tự động điền.
2. Không cho phép xóa Bến cảng đang có dữ liệu liên quan (lượt tàu, lịch sử phục vụ) — người dùng phải xử lý hoặc di chuyển dữ liệu liên quan trước khi xóa.
3. Bến cảng bị xóa có thể được khôi phục trong vòng 90 ngày kể từ ngày xóa; sau thời hạn này dữ liệu chỉ được xử lý theo quy định lưu trữ.
4. Nhật ký xóa phải ghi nhận đầy đủ: ai xóa, khi nào xóa, lý do xóa (nếu có).

## Testing Strategy

Kiểm thử đơn vị cho quy tắc xóa mềm và kiểm tra điều kiện ràng buộc; kiểm thử tích hợp cho luồng xóa Bến cảng với các trường hợp: xóa thành công, xóa bị chặn do dữ liệu liên quan, và xóa khi không có quyền; kiểm thử giao diện cho hộp thoại xác nhận xóa; kiểm thử khôi phục Bến cảng đã xóa trong thời hạn cho phép.
