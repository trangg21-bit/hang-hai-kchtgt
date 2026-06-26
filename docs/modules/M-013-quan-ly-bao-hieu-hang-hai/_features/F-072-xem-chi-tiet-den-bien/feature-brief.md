---
id: F-072
name: Xem chi tiết Đèn biển
slug: xem-chi-tiet-den-bien
module-id: M-013
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Xem chi tiết Đèn biển

## Description
Chức năng cho phép tất cả các vai trò trong hệ thống tra cứu và xem thông tin chi tiết của một Đèn biển bao gồm đầy đủ thông tin kỹ thuật, vị trí trên bản đồ, trạng thái phê duyệt, lịch sử thay đổi và các văn bản đính kèm liên quan. Giao diện hiển thị dạng trang chi tiết với thông tin được phân nhóm hợp lý, hỗ trợ xem bản đồ vị trí và tải xuống các tài liệu đính kèm.

## Business Intent
Hệ thống cần cung cấp kênh tra cứu thông tin Đèn biển nhanh chóng, đầy đủ và trực quan cho tất cả người dùng, hỗ trợ công tác quản lý, giám sát và ra quyết định về hệ thống báo hiệu hàng hải. Mọi thông tin chi tiết phải được hiển thị rõ ràng kèm theo trạng thái phê duyệt và các văn bản pháp lý liên quan để phục vụ công tác thanh tra, kiểm tra và báo cáo.

## Flow Summary
Người dùng truy cập danh sách Đèn biển, chọn một Đèn biển cụ thể để xem chi tiết, hệ thống hiển thị trang thông tin chi tiết với các tab phân nhóm: thông tin kỹ thuật (mã Đèn biển, vị trí, đặc tính chiếu sáng), thông tin hoạt động (trạng thái, người tạo, ngày lắp đặt), bản đồ vị trí (GIS layer hiển thị tọa độ), lịch sử thay đổi (audit trail), và văn bản đính kèm (các tài liệu pháp lý, hình ảnh thực địa). Người dùng có thể tải xuống văn bản đính kèm, in thông tin chi tiết, hoặc chia sẻ liên kết tra cứu.

## Acceptance Criteria
- Tất cả vai trò có quyền xem thông tin chi tiết của Đèn biển phù hợp với phân quyền của mình
- Trang chi tiết hiển thị đầy đủ các nhóm thông tin: kỹ thuật, hoạt động, vị trí, lịch sử, văn bản đính kèm
- Bản đồ vị trí hiển thị chính xác tọa độ của Đèn biển trên nền GIS
- Văn bản đính kèm có thể tải xuống và xem trước trực tiếp trên trình duyệt
- Lịch sử thay đổi hiển thị đầy đủ các lần cập nhật với thông tin người thực hiện và thời gian
- Người dùng có thể in hoặc xuất thông tin chi tiết thành file PDF

## In Scope
- Trang chi tiết Đèn biển với các tab phân nhóm thông tin
- Hiển thị bản đồ vị trí (GIS) trên trang chi tiết
- Hiển thị danh sách và tải xuống văn bản đính kèm
- Hiển thị lịch sử thay đổi (audit trail) của Đèn biển
- Chức năng in và xuất PDF thông tin chi tiết
- Chia sẻ liên kết tra cứu Đèn biển

## Out of Scope
- Tạo mới Đèn biển (thuộc F-068)
- Cập nhật thông tin Đèn biển (thuộc F-069)
- Xóa Đèn biển (thuộc F-070)
- Phê duyệt Đèn biển (thuộc F-071)
- Quản lý lịch sử thay đổi (thuộc F-073)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | View own submissions, View all |
| Trưởng phòng | View all, View approval details |
| Lãnh đạo Cục | View all, View approval details |
| Quản trị hệ thống | View all, View system logs |

## Architecture Notes
Tính năng sử dụng endpoint REST API `GET /api/v1/beacons/{beaconId}` trả về toàn bộ thông tin chi tiết của Đèn biển bao gồm cả关联的 văn bản đính kèm và audit trail. GIS layer sử dụng thư viện Leaflet hoặc OpenLayers để hiển thị vị trí trên bản đồ. Backend tích hợp với module lưu trữ file (File Storage Service) để quản lý văn bản đính kèm. Frontend sử dụng tab component để phân nhóm thông tin.

## Entities
- **Beacon**: id, beaconCode, name, latitude, longitude, beaconType, lightCharacteristic, color, period, luminousRange, powerSource, status, approvalStage, installedDate, createdBy, createdAt, updatedAt
- **BeaconDocument**: id, beaconId, documentName, documentType, filePath, uploadedBy, uploadedAt, fileSize
- **BeaconChangeLog**: id, beaconId, changedBy, changedAt, fieldChanged, oldValue, newValue, reason

## Business Rules
1. Chỉ Đèn biển có trạng thái "approved" hoặc "pending_approval" mới hiển thị trong kết quả tra cứu
2. Văn bản đính kèm phải là file PDF, JPG hoặc PNG, kích thước tối đa 10MB/file
3. Lịch sử thay đổi hiển thị tối đa 100 bản ghi gần nhất, có phân trang nếu vượt quá
4. Người dùng không có thẩm quyền không được xem các trường nhạy cảm (lý do từ chối, audit chi tiết)
5. Tọa độ hiển thị trên bản đồ sử dụng hệ tọa độ VN-2000 hoặc WGS-84

## Testing Strategy
- Unit test cho endpoint `GET /api/v1/beacons/{beaconId}` với các trường hợp phân quyền khác nhau
- Integration test kiểm tra hiển thị đúng thông tin chi tiết bao gồm关联的 văn bản đính kèm và audit trail
- End-to-end test kiểm tra toàn bộ quy trình xem chi tiết: chọn từ danh sách → hiển thị đầy đủ thông tin → tải xuống văn bản → in PDF
- Test kiểm tra phân quyền: các vai trò khác nhau chỉ thấy thông tin phù hợp với权限 của mình
- Test kiểm tra GIS layer hiển thị chính xác vị trí Đèn biển
- Test kiểm tra phân trang lịch sử thay đổi khi vượt quá 100 bản ghi
