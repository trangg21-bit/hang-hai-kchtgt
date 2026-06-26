---
id: F-076
name: Quản lý Phao tiêu - Xóa
slug: quan-ly-phao-tieu-xoa
module-id: M-013
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Phao tiêu - Xóa

## Description
Chức năng cho phép Chuyên viên viên chức hàng hải xóa bỏ Phao tiêu đã không còn hoạt động hoặc đã được tháo dỡ khỏi hệ thống báo hiệu hàng hải. Tính năng chỉ cho phép xóa các Phao tiêu đã được phê duyệt và có trạng thái hoạt động, với cơ chế xóa mềm (soft delete) để giữ lại dữ liệu lịch sử cho mục đích tra cứu và kiểm toán, tương tự quy trình của Đèn biển.

## Business Intent
Hệ thống cần đảm bảo rằng việc xóa Phao tiêu khỏi cơ sở dữ liệu hoạt động không làm mất dữ liệu lịch sử, đồng thời chỉ cho phép xóa các Phao tiêu đã hoàn thành vòng đời hoạt động và có đủ thẩm quyền phê duyệt, nhằm duy trì tính toàn vẹn của hồ sơ quản lý báo hiệu hàng hải và phục vụ công tác thanh tra, kiểm tra về việc tháo dỡ Phao tiêu tại các vùng biển.

## Flow Summary
Chuyên viên chọn Phao tiêu cần xóa từ danh sách tra cứu, hệ thống kiểm tra điều kiện cho phép xóa (chỉ Phao tiêu đã phê duyệt, không có ràng buộc với các hồ sơ khác). Người dùng xác nhận hành động xóa trên dialog xác nhận với lý do xóa. Hệ thống thực hiện xóa mềm, chuyển trạng thái Phao tiêu thành "deleted" với timestamp xóa, ghi lại nhật ký audit trail chi tiết. Phao tiêu không còn xuất hiện trong danh sách hoạt động nhưng vẫn lưu trữ trong cơ sở dữ liệu để tra cứu lịch sử.

## Acceptance Criteria
- Chỉ Phao tiêu đã được phê duyệt mới có thể xóa được, Phao tiêu chờ phê duyệt không cho phép xóa
- Hệ thống kiểm tra ràng buộc: Phao tiêu không bị tham chiếu bởi hồ sơ nào khác trước khi cho phép xóa
- Dialog xác nhận xóa hiển thị thông tin Phao tiêu và yêu cầu nhập lý do xóa
- Sau khi xóa, Phao tiêu không còn xuất hiện trong danh sách hoạt động mặc định
- Dữ liệu Phao tiêu vẫn được lưu trữ với trạng thái "deleted" và có thể khôi phục bởi Quản trị hệ thống

## In Scope
- Kiểm tra điều kiện cho phép xóa (phê duyệt, không ràng buộc)
- Giao diện dialog xác nhận xóa với lý do
- Xóa mềm (soft delete) Phao tiêu trên cơ sở dữ liệu
- Ghi nhật ký audit trail cho hành động xóa
- Loại bỏ Phao tiêu khỏi danh sách hoạt động hiển thị

## Out of Scope
- Phê duyệt xóa (không cần phê duyệt riêng cho xóa)
- Tạo mới Phao tiêu (thuộc F-074)
- Cập nhật thông tin Phao tiêu (thuộc F-075)
- Xem chi tiết Phao tiêu (thuộc F-078)
- Xem lịch sử thay đổi (thuộc F-079)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Delete (đã phê duyệt), View |
| Trưởng phòng | Approve delete, View |
| Lãnh đạo Cục | View |
| Quản trị hệ thống | Hard delete, Recover deleted, View all |

## Architecture Notes
Tính năng sử dụng endpoint REST API `DELETE /api/v1/buoys/{buoyId}` với cơ chế soft delete bằng field `deletedAt` và `deletedBy`. Repository không trả về bản ghi đã xóa mặc định (global scope filter). Hard delete chỉ khả dụng qua API quản trị dành cho Quản trị hệ thống. Data retention policy quy định giữ dữ liệu đã xóa tối thiểu 5 năm.

## Entities
- **Buoy**: id, buoyCode, name, latitude, longitude, buoyType, shape, color, lightCharacteristic, radarReflector, mooringType, waterDepth, status, installedDate, deletedAt, deletedBy, createdAt, updatedAt
- **AuditLog**: id, entityType, entityId, action, performedBy, performedAt, reason

## Business Rules
1. Chỉ Phao tiêu có trạng thái "approved" mới được phép xóa, Phao tiêu "pending_approval" hoặc "rejected" không cho phép xóa
2. Phao tiêu đang được tham chiếu bởi các hồ sơ khác (công trình, dự án) không được phép xóa
3. Xóa chỉ thực hiện xóa mềm (soft delete), dữ liệu vật lý được giữ lại tối thiểu 5 năm
4. Lý do xóa là trường bắt buộc khi thực hiện hành động xóa
5. Chỉ Quản trị hệ thống mới có quyền xóa cứng (hard delete) hoặc khôi phục bản ghi đã xóa

## Testing Strategy
- Unit test cho hàm kiểm tra điều kiện cho phép xóa (trạng thái, ràng buộc)
- Integration test cho API endpoint `DELETE /api/v1/buoys/{buoyId}` kiểm tra các trường hợp xóa thành công, xóa không được phép, và xóa bị chặn do ràng buộc
- End-to-end test kiểm tra toàn bộ quy trình xóa từ dialog xác nhận đến khi Phao tiêu biến khỏi danh sách hoạt động
- Test kiểm tra audit trail được ghi nhận đầy đủ cho mỗi lần xóa
- Test kiểm tra soft delete: bản ghi đã xóa vẫn tồn tại trong DB với `deletedAt` được set
- Test kiểm tra khôi phục bản ghi đã xóa bởi Quản trị hệ thống
