---
id: F-106
name: Quản lý Đại Cospas-Sarsat - Xóa
slug: quan-ly-dai-cospas-sarsat-xoa
module-id: M-015
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Đại Cospas-Sarsat - Xóa

## Description
Cho phép Chuyên viên xóa (hoặc vô hiệu hóa) một Đại Cospas-Sarsat (trạm vệ tinh cứu nạn Cospas-Sarsat) đã được phê duyệt trong hệ thống. Việc xóa chỉ được thực hiện trên các bản ghi đã hoàn tất quy trình phê duyệt, với cơ chế soft delete để bảo toàn dữ liệu lịch sử cho mục đích kiểm toán.

## Business Intent
Việc xóa Đại Cospas-Sarsat cần phải được kiểm soát nghiêm ngặt, chỉ thực hiện trên dữ liệu đã được phê duyệt để đảm bảo không có thông tin nào bị xóa trái phép. Sử dụng soft delete để duy trì tính toàn vẹn của dữ liệu lịch sử, hỗ trợ hoạt động kiểm toán và phân tích sau này về hệ thống vệ tinh cứu nạn.

## Flow Summary
Chuyên viên truy cập danh sách Đại Cospas-Sarsat, chọn bản ghi cần xóa, hệ thống kiểm tra điều kiện (bản ghi phải ở trạng thái "Đã phê duyệt"), xác nhận xóa bằng popup xác nhận, hệ thống chuyển trạng thái bản ghi thành "Đã xóa" (soft delete) và ghi nhận vào lịch sử kiểm toán.

## Acceptance Criteria
- Chỉ có thể xóa bản ghi Đại Cospas-Sarsat ở trạng thái "Đã phê duyệt"
- Xóa sử dụng soft delete, bản ghi không bị xóa khỏi CSDL mà chỉ chuyển trạng thái
- Hệ thống yêu cầu xác nhận trước khi thực hiện xóa
- Dữ liệu lịch sử vẫn được bảo toàn sau khi xóa
- Bản ghi đã xóa không hiển thị trong danh sách mặc định (có thể filter để xem)

## In Scope
- Giao diện chọn và xóa Đại Cospas-Sarsat
- Kiểm tra điều kiện bản ghi phải ở trạng thái "Đã phê duyệt"
- Xác nhận xóa bằng popup xác nhận
- Soft delete (chuyển trạng thái thành "Đã xóa")
- Ghi nhận vào lịch sử kiểm toán
- Ẩn bản ghi đã xóa khỏi danh sách mặc định

## Out of Scope
- Xóa cứng (hard delete) dữ liệu khỏi cơ sở dữ liệu
- Xóa bản ghi đang ở trạng thái "Chờ phê duyệt" hoặc "Từ chối"
- Xóa hàng loạt nhiều bản ghi cùng lúc
- Khôi phục bản ghi đã xóa (thuộc feature khác)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Xóa (soft delete) bản ghi đã phê duyệt |
| Trưởng phòng | Phê duyệt yêu cầu xóa |
| Trưởng cục | Phê duyệt cấp 2 yêu cầu xóa |
| Admin | Quản lý hệ thống, khôi phục bản ghi |

## Architecture Notes
Xóa mềm (soft delete) bằng cách set flag `is_deleted = true` và `deleted_at = timestamp` trên bản ghi `coastal_station_cospas_sarsat`. Query mặc định thêm điều kiện `WHERE is_deleted = false`. Bảng `coastal_station_cospas_sarsat_history` vẫn ghi nhận sự kiện xóa để phục vụ kiểm toán.

## Entities
- **CoastalStationCospasSarsat**: id, device_code, station_name, beacon_type, frequency, coverage_zone, mmsi_code, location_address, contact_person, contact_phone, status, is_deleted, deleted_by, deleted_at
- **AuditLog**: id, entity_type, entity_id, action, performed_by, performed_at, details

## Business Rules
1. Chỉ có thể xóa bản ghi ở trạng thái "Đã phê duyệt" (đã xong quy trình phê duyệt)
2. Không cho phép xóa bản ghi đang ở trạng thái "Chờ phê duyệt" hoặc "Từ chối"
3. Xóa là soft delete — bản ghi vẫn tồn tại với flag is_deleted = true
4. Bản ghi đã xóa không xuất hiện trong danh sách mặc định
5. Chuyên viên chỉ được xóa, không thể khôi phục — Admin mới có quyền khôi phục

## Testing Strategy
- Test unit: kiểm tra điều kiện chỉ xóa được bản ghi đã phê duyệt
- Test integration: API xóa, xác nhận status chuyển thành deleted
- Test soft delete: xác nhận bản ghi vẫn tồn tại trong CSDL nhưng is_deleted = true
- Test UI: xác nhận popup, danh sách không hiển thị bản ghi đã xóa
