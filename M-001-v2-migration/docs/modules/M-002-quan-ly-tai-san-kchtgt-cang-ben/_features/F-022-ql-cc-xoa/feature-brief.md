---
id: F-022
name: "Quản lý Cầu cảng - Xóa"
slug: ql-cc-xoa
module-id: M-002
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:01Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Cầu cảng - Xóa

## Description

Tính năng cho phép người dùng có thẩm quyền xóa một Cầu cảng khỏi hệ thống quản lý tài sản KCHTGT cảng-bến, áp dụng cơ chế xóa mềm (soft delete) để bảo tồn dữ liệu lịch sử, đồng thời kiểm tra các điều kiện ràng buộc liên quan (lượt tàu neo đậu, lịch sử kiểm tra kết cấu) trước khi thực hiện xóa để đảm bảo toàn vẹn dữ liệu kết cấu.

## Business Intent

Việc xóa Cầu cảng khỏi hệ thống chỉ được thực hiện khi cầu cảng bị phá dỡ, sập đổ hoặc được sáp nhập vào kết cấu cầu cảng khác; cơ chế xóa mềm giúp duy trì tính toàn vẹn của dữ liệu lịch sử kết cấu, phục vụ công tác kiểm toán an toàn, đánh giá nguyên nhân sự cố và báo cáo thống kê theo yêu cầu của cơ quan quản lý nhà nước về giao thông đường thủy.

## Flow Summary

Người dùng đăng nhập vào hệ thống, tìm kiếm và chọn Cầu cảng cần xóa từ danh sách hoặc trang chi tiết. Hệ thống hiển thị thông tin Cầu cảng kèm cảnh báo về hậu quả của việc xóa, bao gồm thông tin về dữ liệu liên quan nếu có. Người dùng xác nhận hành động xóa bằng cách nhập tên Cầu cảng vào hộp thoại xác nhận. Hệ thống kiểm tra điều kiện xóa: Cầu cảng không được có dữ liệu liên quan (lượt tàu neo đậu, lịch sử kiểm tra kết cấu) chưa được xử lý. Nếu vượt qua kiểm tra, hệ thống đánh dấu Cầu cảng là "đã xóa" (soft delete), ghi nhật ký xóa và cập nhật trạng thái trong danh sách.

## Acceptance Criteria

1. Chỉ người dùng có vai trò "Admin" hoặc "Quản lý cảng" mới có thể thực hiện thao tác xóa Cầu cảng.
2. Hệ thống yêu cầu xác nhận xóa bằng cách nhập tên Cầu cảng vào hộp thoại xác nhận trước khi thực hiện xóa.
3. Hệ thống kiểm tra điều kiện ràng buộc: nếu Cầu cảng đang có dữ liệu liên quan (lượt tàu neo đậu, lịch sử kiểm tra kết cấu), hệ thống hiển thị cảnh báo chi tiết và ngăn xóa, đề xuất phương án xử lý dữ liệu liên quan trước.
4. Sau khi xóa thành công, Cầu cảng không còn hiển thị trong danh sách mặc định nhưng vẫn được lưu trữ với trạng thái "đã xóa" và có thể khôi phục trong thời hạn quy định.

## In Scope

- Giao diện chọn và xác nhận xóa Cầu cảng
- Kiểm tra điều kiện ràng buộc (dữ liệu liên quan: lượt tàu neo đậu, lịch sử kiểm tra kết cấu)
- Xác nhận xóa bằng cách nhập tên Cầu cảng
- Xóa mềm (soft delete) với ghi nhật ký
- Khôi phục Cầu cảng đã xóa trong thời hạn cho phép
- Cập nhật trạng thái hiển thị trong danh sách

## Out of Scope

- Xóa cứng Cầu cảng khỏi cơ sở dữ liệu
- Xóa hàng loạt nhiều Cầu cảng cùng lúc
- Xóa Cầu cảng kèm dữ liệu liên quan (cascade delete)
- Phê duyệt xóa bởi cấp quản lý cao hơn (thuộc F-023)
- Xuất báo cáo lịch sử xóa
- Đánh giá an toàn kết cấu sau xóa

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Quản trị viên | Xóa, Xem, Khôi phục |
| Quản lý cảng | Xóa, Xem, Khôi phục |
| Nhân viên vận hành | Xem (không xóa) |
| KháchExternal | Không có quyền truy cập |

## Entities

- **CauCang**: id (UUID), maCau (string, unique), tenCau (string), benCangMeId (UUID, FK → BenCang), loaiKetCau (enum: be_tong_co_thep, thep, go, to_hop), vatLieuChinh (string), taiTrongThietKe (decimal, T/m²), chieuDaiCau (decimal, m), chieuRongCau (decimal, m), mucNuocCaoNhat (decimal, m), trangThai (enum: cho_phe_duyet, hien_hanh, tam_ngung, da_xoa), ghiChu (text), createdAt (timestamp), updatedAt (timestamp), deletedAt (timestamp, nullable), deletedBy (UUID, nullable)

## Business Rules

1. Xóa Cầu cảng áp dụng cơ chế xóa mềm (soft delete) — trạng thái chuyển thành "da_xoa", trường deletedAt và deletedBy được tự động điền.
2. Không cho phép xóa Cầu cảng đang có dữ liệu liên quan (lượt tàu neo đậu, lịch sử kiểm tra kết cấu) — người dùng phải xử lý hoặc di chuyển dữ liệu liên quan trước khi xóa.
3. Cầu cảng bị xóa có thể được khôi phục trong vòng 90 ngày kể từ ngày xóa; sau thời hạn này dữ liệu chỉ được xử lý theo quy định lưu trữ.
4. Nhật ký xóa phải ghi nhận đầy đủ: ai xóa, khi nào xóa, lý do xóa (nếu có).

## Testing Strategy

Kiểm thử đơn vị cho quy tắc xóa mềm và kiểm tra điều kiện ràng buộc; kiểm thử tích hợp cho luồng xóa Cầu cảng với các trường hợp: xóa thành công, xóa bị chặn do dữ liệu liên quan, và xóa khi không có quyền; kiểm thử giao diện cho hộp thoại xác nhận xóa; kiểm thử khôi phục Cầu cảng đã xóa trong thời hạn cho phép; kiểm thử nhật ký xóa được ghi đầy đủ.
