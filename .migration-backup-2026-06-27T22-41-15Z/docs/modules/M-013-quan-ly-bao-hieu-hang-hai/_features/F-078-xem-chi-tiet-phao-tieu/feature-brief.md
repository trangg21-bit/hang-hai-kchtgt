---
id: F-078
name: Xem chi tiết Phao tiêu
slug: xem-chi-tiet-phao-tieu
module-id: M-013
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Xem chi tiết Phao tiêu

## Description
Chức năng cho phép tất cả các vai trò trong hệ thống tra cứu và xem thông tin chi tiết của một Phao tiêu bao gồm đầy đủ thông tin kỹ thuật, vị trí trên bản đồ, trạng thái phê duyệt, lịch sử thay đổi và các văn bản đính kèm liên quan. Giao diện hiển thị dạng trang chi tiết với thông tin được phân nhóm hợp lý, hỗ trợ xem bản đồ vị trí và tải xuống các tài liệu đính kèm, tương tự như chức năng Xem chi tiết Đèn biển.

## Business Intent
Hệ thống cần cung cấp kênh tra cứu thông tin Phao tiêu nhanh chóng, đầy đủ và trực quan cho tất cả người dùng, hỗ trợ công tác quản lý, giám sát và ra quyết định về hệ thống báo hiệu hàng hải. Mọi thông tin chi tiết phải được hiển thị rõ ràng kèm theo trạng thái phê duyệt và các văn bản pháp lý liên quan để phục vụ công tác thanh tra, kiểm tra và báo cáo về việc quản lý Phao tiêu tại các vùng biển.

## Flow Summary
Người dùng truy cập danh sách Phao tiêu, chọn một Phao tiêu cụ thể để xem chi tiết, hệ thống hiển thị trang thông tin chi tiết với các tab phân nhóm: thông tin kỹ thuật (mã Phao tiêu, vị trí, đặc tính, cấu trúc), thông tin hoạt động (trạng thái, người tạo, ngày lắp đặt), bản đồ vị trí (GIS layer hiển thị tọa độ), lịch sử thay đổi (audit trail), và văn bản đính kèm (các tài liệu pháp lý, hình ảnh thực địa). Người dùng có thể tải xuống văn bản đính kèm, in thông tin chi tiết, hoặc chia sẻ liên kết tra cứu.

## Acceptance Criteria
- Tất cả vai trò có quyền xem thông tin chi tiết của Phao tiêu phù hợp với phân quyền của mình
- Trang chi tiết hiển thị đầy đủ các nhóm thông tin: kỹ thuật, hoạt động, vị trí, lịch sử, văn bản đính kèm
- Bản đồ vị trí hiển thị chính xác tọa độ của Phao tiêu trên nền GIS
- Văn bản đính kèm có thể tải xuống và xem trước trực tiếp trên trình duyệt
- Lịch sử thay đổi hiển thị đầy đủ các lần cập nhật với thông tin người thực hiện và thời gian
- Người dùng có thể in hoặc xuất thông tin chi tiết thành file PDF

## In Scope
- Trang chi tiết Phao tiêu với các tab phân nhóm thông tin
- Hiển thị bản đồ vị trí (GIS) trên trang chi tiết
- Hiển thị danh sách và tải xuống văn bản đính kèm
- Hiển thị lịch sử thay đổi (audit trail) của Phao tiêu
- Chức năng in và xuất PDF thông tin chi tiết
- Chia sẻ liên kết tra cứu Phao tiêu

## Out of Scope
- Tạo mới Phao tiêu (thuộc F-074)
- Cập nhật thông tin Phao tiêu (thuộc F-075)
- Xóa Phao tiêu (thuộc F-076)
- Phê duyệt Phao tiêu (thuộc F-077)
- Quản lý lịch sử thay đổi (thuộc F-079)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | View own submissions, View all |
| Trưởng phòng | View all, View approval details |
| Lãnh đạo Cục | View all, View approval details |
| Quản trị hệ thống | View all, View system logs |

## Architecture Notes
Tính năng sử dụng endpoint REST API `GET /api/v1/buoys/{buoyId}` trả về toàn bộ thông tin chi tiết của Phao tiêu bao gồm cả关联的 văn bản đính kèm và audit trail. GIS layer sử dụng thư viện Leaflet hoặc OpenLayers để hiển thị vị trí trên bản đồ. Backend tích hợp với module lưu trữ file (File Storage Service) để quản lý văn bản đính kèm. Frontend sử dụng tab component để phân nhóm thông tin.

## Entities
- **Buoy**: id, buoyCode, name, latitude, longitude, buoyType, shape, color, lightCharacteristic, radarReflector, mooringType, waterDepth, status, approvalStage, installedDate, createdBy, createdAt, updatedAt
- **BuoyDocument**: id, buoyId, documentName, documentType, filePath, uploadedBy, uploadedAt, fileSize
- **BuoyChangeLog**: id, buoyId, changedBy, changedAt, fieldChanged, oldValue, newValue, reason

## Business Rules
1. Chỉ Phao tiêu có trạng thái "approved" hoặc "pending_approval" mới hiển thị trong kết quả tra cứu
2. Văn bản đính kèm phải là file PDF, JPG hoặc PNG, kích thước tối đa 10MB/file
3. Lịch sử thay đổi hiển thị tối đa 100 bản ghi gần nhất, có phân trang nếu vượt quá
4. Người dùng không có thẩm quyền không được xem các trường nhạy cảm (lý do từ chối, audit chi tiết)
5. Tọa độ hiển thị trên bản đồ sử dụng hệ tọa độ VN-2000 hoặc WGS-84

## Testing Strategy
- Unit test cho endpoint `GET /api/v1/buoys/{buoyId}` với các trường hợp phân quyền khác nhau
- Integration test kiểm tra hiển thị đúng thông tin chi tiết bao gồm关联의 văn bản đính kèm và audit trail
- End-to-end test kiểm tra toàn bộ quy trình xem chi tiết: chọn từ danh sách → hiển thị đầy đủ thông tin → tải xuống văn bản → in PDF
- Test kiểm tra phân quyền: các vai trò khác nhau chỉ thấy thông tin phù hợp với权限 của mình
- Test kiểm tra GIS layer hiển thị chính xác vị trí Phao tiêu
- Test kiểm tra phân trang lịch sử thay đổi khi vượt quá 100 bản ghi
