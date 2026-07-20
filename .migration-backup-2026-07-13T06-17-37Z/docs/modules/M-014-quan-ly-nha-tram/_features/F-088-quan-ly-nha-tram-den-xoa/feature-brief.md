---
id: F-088
name: Xóa Nhà trạm đèn
slug: quan-ly-nha-tram-den-xoa
module-id: M-014
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Xóa Nhà trạm đèn

## Description
Tính năng cho phép Chuyên viên xóa nhà trạm đèn khỏi hệ thống. Chỉ những nhà trạm đèn đã được phê duyệt (đã duyệt) mới có thể bị xóa. Xóa được thực hiện theo mô hình mềm (soft delete) — bản ghi không bị xóa khỏi database mà được đánh dấu trạng thái "đã xóa", giúp bảo toàn dữ liệu lịch sử và hỗ trợ khôi phục nếu cần.

## Business Intent
Việc xóa nhà trạm đèn chỉ được phép thực hiện đối với dữ liệu đã được phê duyệt, đảm bảo tính toàn vẹn dữ liệu và tuân thủ quy trình quản lý. Xóa mềm cho phép khôi phục lại dữ liệu khi có sai sót và duy trì lịch sử biến động đầy đủ.

## Flow Summary
Chuyên viên truy cập danh sách nhà trạm đèn, chọn một bản ghi có trạng thái "đã duyệt", nhấn nút "Xóa". Hệ thống hiển thị hộp thoại xác nhận với thông tin: tên nhà trạm đèn, lý do cần xóa (tùy chọn), và cảnh báo về hậu quả của hành động xóa. Nếu người dùng xác nhận, bản ghi được chuyển sang trạng thái "đã xóa" (mềm), không còn hiển thị trong danh sách chính nhưng vẫn có thể tìm thấy trong danh sách đã xóa.

## Acceptance Criteria
- Chỉ nhà trạm đèn ở trạng thái "đã duyệt" mới được phép xóa.
- Hệ thống hiển thị hộp thoại xác nhận trước khi xóa, với thông tin chi tiết bản ghi và cảnh báo.
- Hành động xóa sử dụng soft delete — bản ghi không bị xóa khỏi database mà chuyển trạng thái sang "đã xóa".
- Bản ghi đã xóa không hiển thị trong danh sách nhà trạm đèn mặc định.
- Người dùng nhận được thông báo kết quả xóa thành công.

## In Scope
- Kiểm tra trạng thái bản ghi trước khi cho phép xóa (chỉ xóa khi đã duyệt)
- Hộp thoại xác nhận xóa với thông tin chi tiết
- Soft delete: chuyển trạng thái bản ghi sang "đã xóa"
- Cập nhật danh sách nhà trạm đèn sau khi xóa
- Lịch sử biến động ghi nhận hành động xóa

## Out of Scope
- Hard delete (xóa vĩnh viễn khỏi database)
- Khôi phục bản ghi đã xóa (thuộc tính năng quản lý rác/thùng rác)
- Xóa hàng loạt nhiều bản ghi cùng lúc
- Phê duyệt hành động xóa (không yêu cầu phê duyệt riêng)
- Export danh sách bản ghi đã xóa

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Xóa (chỉ bản đã duyệt), Xem chi tiết |
| Trưởng phòng | Xem, Không xóa trực tiếp |
| Lãnh đạo Cục | Xem, Không xóa trực tiếp |
| Admin hệ thống | Xóa (mọi trạng thái), Khôi phục |

## Architecture Notes
- Soft delete: Trường `deleted_at` được set khi xóa, query mặc định bao gồm điều kiện `deleted_at IS NULL`.
- API: DELETE `/api/v1/beacons/{id}` xử lý soft delete trong controller, service layer update status và log action.
- Database: Bảng `beacon_stations` có trường `is_deleted` (boolean) hoặc `deleted_at` (timestamp) cho soft delete.
- Query filters: Danh sách chính hiển thị bản ghi chưa xóa; danh sách "đã xóa" hiển thị bản ghi có `is_deleted = true`.

## Entities
- **BeaconStation**: id, name, code, status, deletedBy, deletedAt, isDeleted, previousApprovalStatus

## Business Rules
1. Chỉ nhà trạm đèn ở trạng thái "đã duyệt" mới cho phép xóa. Nhà trạm "chờ duyệt" hoặc "bị từ chối" không được xóa.
2. Hành động xóa sử dụng soft delete — bản ghi vẫn tồn tại trong database với cờ isDeleted = true.
3. Thông tin người xóa và thời gian xóa được ghi nhận vào trường deletedBy và deletedAt.
4. Bản ghi đã xóa không xuất hiện trong kết quả tìm kiếm và danh sách mặc định.

## Testing Strategy
- Unit test: Kiểm tra rule chỉ cho phép xóa khi trạng thái = đã duyệt; kiểm tra soft delete set đúng trường deletedAt và isDeleted.
- Integration test: Gọi API DELETE trên bản ghi đã duyệt → 200 + bản ghi chuyển trạng thái; gọi trên bản ghi chờ duyệt → 403.
- E2E test: Tạo nhà trạm, phê duyệt, xóa, xác nhận không xuất hiện trong danh sách chính; kiểm tra log biến động ghi nhận xóa.
