---
id: F-090
name: Xem chi tiết Nhà trạm đèn
slug: xem-chi-tiet-nha-tram-den
module-id: M-014
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Xem chi tiết Nhà trạm đèn

## Description
Tính năng cho phép tất cả các vai trò trong hệ thống tra cứu và xem chi tiết thông tin nhà trạm đèn, bao gồm toàn bộ dữ liệu mô tả, tọa độ trên bản đồ, loại đèn, cường độ ánh sáng, tầm chiếu sáng, tình trạng, trạng thái phê duyệt và các văn bản đính kèm liên quan. Dữ liệu hiển thị ở chế độ đọc-only, không cho phép chỉnh sửa trực tiếp từ màn hình chi tiết.

## Business Intent
Cho phép mọi người dùng có quyền truy cập tra cứu, xem thông tin chi tiết và văn bản đính kèm của nhà trạm đèn, hỗ trợ công tác quản lý, giám sát và ra quyết định dựa trên dữ liệu chính xác và cập nhật về hạ tầng dẫn đường hàng hải.

## Flow Summary
Người dùng bất kỳ có quyền truy cập vào danh sách nhà trạm đèn, tìm kiếm hoặc lọc bản ghi cần xem, sau đó nhấn vào tên hoặc nút "Xem chi tiết" để mở màn hình chi tiết. Màn hình hiển thị đầy đủ thông tin: mã, tên, tọa độ (hiển thị trên bản đồ), loại đèn, cường độ ánh sáng, tầm chiếu sáng, tình trạng, trạng thái phê duyệt, thông tin người tạo/cập nhật, ngày tạo/cập nhật và danh sách các văn bản đính kèm (có thể xem trước hoặc tải về).

## Acceptance Criteria
- Mọi role có quyền truy cập đều có thể xem chi tiết nhà trạm đèn.
- Màn hình chi tiết hiển thị đầy đủ các trường thông tin: mã, tên, tọa độ, loại đèn, cường độ, tầm chiếu sáng, tình trạng, trạng thái phê duyệt.
- Tọa độ được hiển thị trên bản đồ tích hợp (Leaflet).
- Các văn bản đính kèm hiển thị danh sách, cho phép xem trước (PDF) hoặc tải về.
- Dữ liệu hiển thị ở chế độ đọc-only, không cho phép chỉnh sửa trực tiếp.

## In Scope
- Màn hình hiển thị chi tiết nhà trạm đèn ở chế độ đọc-only
- Hiển thị tọa độ trên bản đồ tích hợp
- Danh sách văn bản đính kèm với chức năng xem trước/tải về
- Hiển thị thông tin trạng thái phê duyệt và lịch sử phê duyệt
- breadcrumb và nút quay lại danh sách

## Out of Scope
- Tạo mới nhà trạm đèn (thuộc F-086)
- Cập nhật thông tin (thuộc F-087)
- Xóa nhà trạm đèn (thuộc F-088)
- Phê duyệt (thuộc F-089)
- Xem lịch sử thay đổi chi tiết (thuộc F-091)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Xem chi tiết |
| Trưởng phòng | Xem chi tiết |
| Lãnh đạo Cục | Xem chi tiết |
| Admin hệ thống | Xem chi tiết toàn bộ |

## Architecture Notes
- Frontend: Detail page component React, sử dụng Leaflet cho bản đồ, PDF.js cho xem trước tài liệu.
- Backend: GET `/api/v1/beacons/{id}` trả về full detail bao gồm metadata phê duyệt và danh sách attachment files.
- Authorization: Middleware check role-based access, tất cả authenticated users đều được phép xem.
- Caching: Detail page có thể cache ngắn hạn (5 phút) để giảm tải database cho các truy vấn xem thường xuyên.

## Entities
- **BeaconStationDetail**: id, name, code, longitude, latitude, beaconType, lightIntensity, visibilityRange, status, description, approvalStatus, createdBy, updatedBy, createdAt, updatedAt, attachments ([])

## Business Rules
1. Tất cả các role đã đăng nhập đều có quyền xem chi tiết nhà trạm đèn.
2. Dữ liệu hiển thị ở chế độ đọc-only, không cho phép chỉnh sửa trực tiếp từ màn hình chi tiết.
3. Văn bản đính kèm chỉ hiển thị cho các role có quyền truy cập, không công khai.
4. Tọa độ được hiển thị chính xác đến 6 chữ số thập phân (độ phân giải ~0.1m).

## Testing Strategy
- Unit test: Kiểm tra service layer trả về đúng detail bao gồm attachments và metadata phê duyệt.
- Integration test: Gọi GET `/api/v1/beacons/{id}` với các role khác nhau, xác nhận phản hồi 200 + dữ liệu đầy đủ.
- E2E test: Truy cập chi tiết nhà trạm đèn từ danh sách, xác nhận hiển thị đúng thông tin, bản đồ tọa độ và danh sách tài liệu.
