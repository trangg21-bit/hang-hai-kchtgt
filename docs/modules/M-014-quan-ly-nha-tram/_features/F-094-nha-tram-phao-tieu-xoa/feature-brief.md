---
id: F-094
name: Nhà trạm phao tiêu - Xóa
slug: nha-tram-phao-tieu-xoa
module-id: M-014
status: proposed
classification: local
priority: high
created: 2026-07-30T00:00:00Z
last-updated: 2026-07-30T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Nhà trạm phao tiêu - Xóa

## Description
Tính năng cho phép Chuyên viên thực hiện xóa nhà trạm phao tiêu khỏi hệ thống. Chỉ những nhà trạm phao tiêu đã được phê duyệt (APPROVED) mới có thể bị xóa. Việc xóa được thực hiện theo mô hình xóa mềm (soft delete): bản ghi không bị xóa vĩnh viễn khỏi cơ sở dữ liệu mà được đánh dấu với thời điểm xóa (deletedAt), giúp bảo toàn dữ liệu lịch sử, hỗ trợ khôi phục khi cần và duy trì tính toàn vẹn tham chiếu với các bảng dữ liệu liên quan (tọa độ, file đính kèm, phao tiêu con, kế hoạch vận hành, bảo trì, sự cố). Trước khi xóa, hệ thống hiển thị dialog xác nhận với thông tin chi tiết về bản ghi và cảnh báo về hậu quả của hành động xóa, yêu cầu người dùng nhập lý do xóa (bắt buộc).

## Business Intent
Việc xóa nhà trạm phao tiêu là một thao tác quan trọng chỉ được thực hiện khi nhà trạm thực sự ngừng hoạt động vĩnh viễn hoặc được bàn giao cho đơn vị khác quản lý. Xóa mềm giúp đảm bảo dữ liệu không bị mất hoàn toàn, cho phép khôi phục nếu có sai sót và duy trì lịch sử vận hành đầy đủ cho mục đích kiểm toán. Yêu cầu nhập lý do xóa giúp tạo dấu vết kiểm tra (audit trail) cho mọi hành động xóa, hỗ trợ công tác thanh tra, kiểm tra sau này.

## Flow Summary
Chuyên viên truy cập danh sách nhà trạm phao tiêu, chọn một bản ghi có trạng thái APPROVED (đã duyệt), nhấn nút "Xóa". Hệ thống hiển thị dialog xác nhận với thông tin chi tiết: tên nhà trạm, mã nhà trạm, đơn vị quản lý, trạng thái hiện tại, kèm cảnh báo "Hành động này sẽ xóa nhà trạm và toàn bộ dữ liệu liên quan (tọa độ, phao tiêu trực thuộc, file đính kèm, kế hoạch vận hành, kế hoạch bảo trì, sự cố) khỏi danh sách vận hành. Dữ liệu vẫn được lưu trữ trong hệ thống và có thể khôi phục." Người dùng phải nhập lý do xóa (trường text bắt buộc) trước khi xác nhận. Nếu người dùng xác nhận, hệ thống thực hiện soft delete: cập nhật trường deletedAt và deletedBy trên bản ghi chính và các bản ghi con (coordinates, attachments, subItems, v.v.), ghi nhận hành động SOFT_DELETE vào lịch sử biến động. Bản ghi không còn hiển thị trong danh sách chính nhưng vẫn có thể truy vấn qua API dành cho admin hoặc trong danh sách "Đã xóa". Người dùng nhận được thông báo "Xóa nhà trạm phao tiêu thành công." Nếu bản ghi chưa được phê duyệt, nút Xóa bị ẩn hoặc vô hiệu hóa.

## Acceptance Criteria
- Chỉ nhà trạm phao tiêu ở trạng thái APPROVED mới được phép xóa. Các trạng thái DRAFT, PENDING, REJECTED không cho phép xóa.
- Nút "Xóa" chỉ hiển thị (enabled) trên các bản ghi có trạng thái APPROVED. Các bản ghi khác không hiển thị nút hoặc hiển thị disabled kèm tooltip.
- Dialog xác nhận hiển thị đầy đủ thông tin: tên nhà trạm, mã nhà trạm, đơn vị quản lý, trạng thái hiện tại và cảnh báo về hậu quả xóa.
- Trường "Lý do xóa" là bắt buộc trong dialog, không cho phép bỏ trống.
- Hành động xóa sử dụng soft delete — bản ghi chính (BuoyBeaconStation) được cập nhật deletedAt và deletedBy, không bị xóa khỏi database.
- Toàn bộ dữ liệu liên quan (tọa độ, file đính kèm, phao tiêu con, kế hoạch, sự cố) cũng được soft delete đồng bộ.
- Hành động SOFT_DELETE được ghi nhận vào bảng lịch sử biến động (changes) với lý do xóa.
- Bản ghi đã xóa không hiển thị trong danh sách nhà trạm phao tiêu mặc định.
- Người dùng nhận được thông báo "Xóa nhà trạm phao tiêu thành công" dạng toast.

## In Scope
- Kiểm tra trạng thái bản ghi trước khi cho phép xóa (chỉ xóa khi APPROVED)
- Dialog xác nhận xóa với thông tin chi tiết + trường nhập lý do xóa bắt buộc
- Soft delete bản ghi chính (set deletedAt, deletedBy)
- Soft delete đồng bộ các bản ghi con (coordinates, attachments, subItems, change logs, v.v.)
- Ghi nhận hành động SOFT_DELETE vào lịch sử biến động
- Cập nhật danh sách nhà trạm phao tiêu sau khi xóa (bản ghi biến mất khỏi danh sách chính)

## Out of Scope
- Hard delete (xóa vĩnh viễn khỏi database)
- Khôi phục bản ghi đã xóa (thuộc tính năng quản lý thùng rác)
- Xóa hàng loạt nhiều bản ghi cùng lúc
- Phê duyệt hành động xóa (không yêu cầu phê duyệt riêng)
- Export danh sách bản ghi đã xóa
- Xóa bản ghi ở trạng thái DRAFT (cần xử lý riêng — cho phép xóa trực tiếp không cần duyệt)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Xóa (chỉ bản APPROVED), Xem chi tiết |
| Trưởng phòng | Xem, Không xóa trực tiếp |
| Lãnh đạo Cục | Xem, Không xóa trực tiếp |
| Admin hệ thống | Xóa (mọi trạng thái), Khôi phục |

## Architecture Notes
- Soft delete: Trường `deleted_at` (timestamp) và `deleted_by` (UUID) được set khi xóa. Query danh sách mặc định bao gồm điều kiện `deleted_at IS NULL`.
- API: DELETE `/api/v1/buoy-beacon-stations/{id}` với body chứa lý do xóa `{"reason": "..."}`. Controller gọi service layer xử lý soft delete toàn bộ cây dữ liệu.
- Database: Tất cả bảng con (coordinates, attachments, subItems, changes, operationPlans, maintenancePlans, incidents) đều có trường `deleted_at` để soft delete đồng bộ.
- Transaction: Toàn bộ soft delete được thực hiện trong một transaction để đảm bảo tính nhất quán.
- Query filters: Repository mặc định filter `deleted_at IS NULL`; repository riêng cho admin/khôi phục không filter.

## Entities
- **BuoyBeaconStation**: id, ..., deletedBy, deletedAt, deleteReason
- **BuoyBeaconStationCoordinate**: id, stationId, ..., deletedAt
- **BuoyBeaconStationAttachment**: id, stationId, ..., deletedAt
- **BuoyBeaconSubItem**: id, stationId, ..., deletedAt
- **BuoyBeaconStationChange**: id, stationId, ..., deletedAt
- **BuoyBeaconOperationPlan**: id, stationId, code, name, startDate, endDate, deletedAt
- **BuoyBeaconMaintenancePlan**: id, stationId, code, name, startDate, endDate, deletedAt
- **BuoyBeaconIncident**: id, stationId, code, type, location, time, deletedAt

## Business Rules
1. Chỉ nhà trạm phao tiêu ở trạng thái APPROVED mới cho phép xóa. Nhà trạm ở trạng thái DRAFT, PENDING hoặc REJECTED không được xóa.
2. Hành động xóa sử dụng soft delete — bản ghi vẫn tồn tại trong database với trường deletedAt được set.
3. Thông tin người xóa (deletedBy), thời gian xóa (deletedAt) và lý do xóa (deleteReason) được ghi nhận đầy đủ.
4. Toàn bộ dữ liệu liên quan (coordinates, attachments, subItems, changes, operationPlans, maintenancePlans, incidents) cũng được soft delete đồng bộ trong cùng một transaction.
5. Bản ghi đã xóa không xuất hiện trong kết quả tìm kiếm và danh sách mặc định. Chỉ hiển thị khi có filter "Đã xóa" hoặc qua API dành cho admin.
6. Hành động xóa được ghi nhận vào lịch sử biến động (change log) với changeType = SOFT_DELETE và ghi rõ lý do.

## Testing Strategy
- Unit test: Kiểm tra rule chỉ cho phép xóa khi trạng thái = APPROVED; kiểm tra soft delete set đúng deletedAt, deletedBy, deleteReason; kiểm tra soft delete đồng bộ các bản ghi con.
- Integration test: Gọi API DELETE trên bản ghi APPROVED → 200 OK; gọi API DELETE trên bản ghi DRAFT → 400 Bad Request; gọi API DELETE trên bản ghi không tồn tại → 404 Not Found.
- E2E test: Tạo nhà trạm, phê duyệt, xóa với lý do, xác nhận không xuất hiện trong danh sách chính; kiểm tra log biến động ghi nhận SOFT_DELETE.
