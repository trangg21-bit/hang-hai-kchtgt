---
id: F-069
name: Quản lý Đèn biển - Cập nhật
slug: quan-ly-den-bien-cap-nhat
module-id: M-013
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Đèn biển - Cập nhật

## Description
Chức năng cho phép Chuyên viên viên chức hàng hải cập nhật thông tin kỹ thuật của Đèn biển đã tồn tại trong hệ thống. Tính năng hỗ trợ sửa đổi toàn bộ hoặc từng phần các thuộc tính của Đèn biển bao gồm vị trí tọa độ, đặc tính chiếu sáng, công suất nguồn điện và các thông tin kỹ thuật khác, với cơ chế kiểm tra và phê duyệt trước khi thay đổi có hiệu lực.

## Business Intent
Hệ thống cần đảm bảo rằng mọi thay đổi đối với thông tin Đèn biển đã được phê duyệt đều phải trải qua quy trình kiểm soát thay đổi, ngăn ngừa việc cập nhật trực tiếp vào dữ liệu hoạt động mà không có sự giám sát, nhằm duy trì tính chính xác và toàn vẹn của cơ sở dữ liệu hệ thống báo hiệu hàng hải phục vụ công tác an toàn hàng hải.

## Flow Summary
Chuyên viên chọn Đèn biển cần cập nhật từ danh sách tra cứu, hệ thống hiển thị form với thông tin hiện tại của Đèn biển. Người dùng chỉnh sửa các trường thông tin cần thay đổi, hệ thống tự động phát hiện các thay đổi và so sánh với bản gốc. Sau khi lưu, hồ sơ được lưu dưới dạng "revision pending" với ghi chú về nội dung thay đổi. Hệ thống tạo một bản ghi audit trail chi tiết trước khi gửi hồ sơ đã chỉnh sửa đến quy trình phê duyệt 2 cấp (Phòng → Cục) để xem xét và phê duyệt thay đổi.

## Acceptance Criteria
- Chuyên viên có thể chọn và mở form cập nhật thông tin của một Đèn biển cụ thể
- Hệ thống hiển thị giá trị hiện tại và cho phép chỉnh sửa các trường có thể thay đổi
- Khi lưu cập nhật, hệ thống tự động tạo bản ghi audit trail ghi nhận thay đổi trước và sau
- Hồ sơ cập nhật chuyển sang trạng thái "chờ phê duyệt" và không có hiệu lực cho đến khi được phê duyệt
- Người dùng nhận được thông báo rõ ràng về trạng thái phê duyệt sau khi gửi cập nhật

## In Scope
- Giao diện form cập nhật thông tin Đèn biển với dữ liệu hiện tại được load sẵn
- Kiểm tra tính hợp lệ dữ liệu đầu vào cho các trường được chỉnh sửa
- Lưu bản ghi audit trail ghi nhận mọi thay đổi trước và sau
- Chuyển hồ sơ cập nhật sang trạng thái chờ phê duyệt
- Thông báo và theo dõi tiến trình phê duyệt cho người dùng

## Out of Scope
- Phê duyệt cập nhật (thuộc F-071)
- Tạo mới Đèn biển (thuộc F-068)
- Xóa Đèn biển (thuộc F-070)
- Xem chi tiết Đèn biển (thuộc F-072)
- Xem lịch sử thay đổi đầy đủ (thuộc F-073)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Update own submissions, View |
| Trưởng phòng | Approve changes |
| Lãnh đạo Cục | Approve changes |
| Quản trị hệ thống | View all, Override any update |

## Architecture Notes
Tính năng sử dụng endpoint REST API `PUT /api/v1/beacons/{beaconId}` với cơ chế optimistic locking để tránh xung đột cập nhật đồng thời. Diff giữa dữ liệu cũ và mới được lưu vào bảng `BeaconChangeLog`. Frontend sử dụng form binding 2 chiều, highlight các trường đã thay đổi. Workflow approval复用 từ module chung của M-013.

## Entities
- **Beacon**: id, beaconCode, name, latitude, longitude, beaconType, lightCharacteristic, color, period, luminousRange, powerSource, status, installedDate, updatedBy, createdAt, updatedAt
- **BeaconChangeLog**: id, beaconId, changedBy, changedAt, fieldChanged, oldValue, newValue, reason, approvalStatus

## Business Rules
1. Chỉ các trường thông tin kỹ thuật được phép mới có thể cập nhật; mã Đèn biển không được thay đổi sau khi đã tạo
2. Mọi thay đổi phải được ghi nhận vào bảng BeaconChangeLog với thông tin trường thay đổi, giá trị cũ và mới
3. Cập nhật chỉ có hiệu lực sau khi được phê duyệt bởi cả 2 cấp (Phòng và Cục)
4. Trường thời gian `installedDate` không được phép thay đổi bởi Chuyên viên, chỉ Quản trị hệ thống mới có quyền sửa

## Testing Strategy
- Unit test cho hàm tính toán diff giữa dữ liệu cũ và mới của entity Beacon
- Integration test cho API endpoint `PUT /api/v1/beacons/{beaconId}` kiểm tra các trường hợp cập nhật thành công, xung đột dữ liệu, và lỗi validation
- End-to-end test kiểm tra toàn bộ quy trình cập nhật từ giao diện đến audit trail và trạng thái chờ phê duyệt
- Test kiểm tra optimistic locking: 2 người dùng cập nhật cùng 1 Đèn biển, người sau phải nhận cảnh báo
- Test kiểm tra BeaconChangeLog được ghi nhận đầy đủ mọi thay đổi
