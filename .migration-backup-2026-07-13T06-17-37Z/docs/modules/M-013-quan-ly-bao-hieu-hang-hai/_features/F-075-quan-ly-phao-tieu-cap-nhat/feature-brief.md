---
id: F-075
name: Quản lý Phao tiêu - Cập nhật
slug: quan-ly-phao-tieu-cap-nhat
module-id: M-013
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Phao tiêu - Cập nhật

## Description
Chức năng cho phép Chuyên viên viên chức hàng hải cập nhật thông tin kỹ thuật của Phao tiêu đã tồn tại trong hệ thống. Tính năng hỗ trợ sửa đổi toàn bộ hoặc từng phần các thuộc tính của Phao tiêu bao gồm vị trí tọa độ, đặc tính thị giác/điện tử, cấu trúc vật lý, loại neo và các thông tin kỹ thuật khác, với cơ chế kiểm tra và phê duyệt trước khi thay đổi có hiệu lực, tương tự quy trình của Đèn biển.

## Business Intent
Hệ thống cần đảm bảo rằng mọi thay đổi đối với thông tin Phao tiêu đã được phê duyệt đều phải trải qua quy trình kiểm soát thay đổi, ngăn ngừa việc cập nhật trực tiếp vào dữ liệu hoạt động mà không có sự giám sát, nhằm duy trì tính chính xác và toàn vẹn của cơ sở dữ liệu hệ thống báo hiệu hàng hải, đảm bảo an toàn hàng hải tại các tuyến đường biển và khu vực cảng mà Phao tiêu đang hoạt động.

## Flow Summary
Chuyên viên chọn Phao tiêu cần cập nhật từ danh sách tra cứu, hệ thống hiển thị form với thông tin hiện tại của Phao tiêu. Người dùng chỉnh sửa các trường thông tin cần thay đổi, hệ thống tự động phát hiện các thay đổi và so sánh với bản gốc, highlight các trường đã thay đổi. Sau khi lưu, hồ sơ được lưu dưới dạng "revision pending" với ghi chú về nội dung thay đổi. Hệ thống tạo một bản ghi audit trail chi tiết trước khi gửi hồ sơ đã chỉnh sửa đến quy trình phê duyệt 2 cấp (Phòng → Cục) để xem xét và phê duyệt thay đổi.

## Acceptance Criteria
- Chuyên viên có thể chọn và mở form cập nhật thông tin của một Phao tiêu cụ thể
- Hệ thống hiển thị giá trị hiện tại và cho phép chỉnh sửa các trường có thể thay đổi
- Khi lưu cập nhật, hệ thống tự động tạo bản ghi audit trail ghi nhận thay đổi trước và sau
- Hồ sơ cập nhật chuyển sang trạng thái "chờ phê duyệt" và không có hiệu lực cho đến khi được phê duyệt
- Người dùng nhận được thông báo rõ ràng về trạng thái phê duyệt sau khi gửi cập nhật

## In Scope
- Giao diện form cập nhật thông tin Phao tiêu với dữ liệu hiện tại được load sẵn
- Kiểm tra tính hợp lệ dữ liệu đầu vào cho các trường được chỉnh sửa
- Highlight các trường đã thay đổi so với bản gốc
- Lưu bản ghi audit trail ghi nhận mọi thay đổi trước và sau
- Chuyển hồ sơ cập nhật sang trạng thái chờ phê duyệt
- Thông báo và theo dõi tiến trình phê duyệt cho người dùng

## Out of Scope
- Phê duyệt cập nhật (thuộc F-077)
- Tạo mới Phao tiêu (thuộc F-074)
- Xóa Phao tiêu (thuộc F-076)
- Xem chi tiết Phao tiêu (thuộc F-078)
- Xem lịch sử thay đổi đầy đủ (thuộc F-079)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Update own submissions, View |
| Trưởng phòng | Approve changes |
| Lãnh đạo Cục | Approve changes |
| Quản trị hệ thống | View all, Override any update |

## Architecture Notes
Tính năng sử dụng endpoint REST API `PUT /api/v1/buoys/{buoyId}` với cơ chế optimistic locking để tránh xung đột cập nhật đồng thời. Diff giữa dữ liệu cũ và mới được lưu vào bảng `BuoyChangeLog`. Frontend sử dụng form binding 2 chiều, highlight các trường đã thay đổi bằng màu sắc. Workflow approval复用 từ module chung của M-013, cùng cơ chế với Đèn biển.

## Entities
- **Buoy**: id, buoyCode, name, latitude, longitude, buoyType, shape, color, lightCharacteristic, radarReflector, mooringType, waterDepth, status, installedDate, updatedBy, createdAt, updatedAt
- **BuoyChangeLog**: id, buoyId, changedBy, changedAt, fieldChanged, oldValue, newValue, reason, approvalStatus

## Business Rules
1. Chỉ các trường thông tin kỹ thuật được phép mới có thể cập nhật; mã Phao tiêu không được thay đổi sau khi đã tạo
2. Mọi thay đổi phải được ghi nhận vào bảng BuoyChangeLog với thông tin trường thay đổi, giá trị cũ và mới
3. Cập nhật chỉ có hiệu lực sau khi được phê duyệt bởi cả 2 cấp (Phòng và Cục)
4. Trường thời gian `installedDate` không được phép thay đổi bởi Chuyên viên, chỉ Quản trị hệ thống mới có quyền sửa
5. Loại Phao tiêu không được thay đổi từ "nguy hiểm" sang các loại khác nếu Phao tiêu đang trong vùng biển đang hoạt động

## Testing Strategy
- Unit test cho hàm tính toán diff giữa dữ liệu cũ và mới của entity Buoy
- Integration test cho API endpoint `PUT /api/v1/buoys/{buoyId}` kiểm tra các trường hợp cập nhật thành công, xung đột dữ liệu, và lỗi validation
- End-to-end test kiểm tra toàn bộ quy trình cập nhật từ giao diện đến audit trail và trạng thái chờ phê duyệt
- Test kiểm tra optimistic locking: 2 người dùng cập nhật cùng 1 Phao tiêu, người sau phải nhận cảnh báo
- Test kiểm tra BuoyChangeLog được ghi nhận đầy đủ mọi thay đổi
- Test kiểm tra highlight các trường đã thay đổi trên giao diện
