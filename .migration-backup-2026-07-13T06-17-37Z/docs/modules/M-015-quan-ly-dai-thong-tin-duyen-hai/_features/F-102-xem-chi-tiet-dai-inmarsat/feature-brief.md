---
id: F-102
name: Xem chi tiết Đại Inmarsat
slug: xem-chi-tiet-dai-inmarsat
module-id: M-015
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Xem chi tiết Đại Inmarsat

## Description
Cho phép tất cả các vai trò trong hệ thống tra cứu và xem chi tiết thông tin của một Đại Inmarsat (trạm vệ tinh Inmarsat) đã được phê duyệt, bao gồm thông tin kỹ thuật về modem, tần số, vùng phủ sóng, vị trí trên bản đồ, lịch sử thay đổi và các văn bản đính kèm liên quan.

## Business Intent
Cung cấp khả năng tra cứu nhanh chóng và chính xác thông tin Đại Inmarsat cho tất cả các bên liên quan, hỗ trợ công tác quản lý, điều độ vệ tinh và kiểm tra thông tin kỹ thuật của hệ thống Inmarsat phục vụ cứu nạn cứu hộ trên biển một cách hiệu quả.

## Flow Summary
Người dùng truy cập danh sách Đại Inmarsat, tìm kiếm theo mã thiết bị/tên đại/loại modem, chọn bản ghi cần xem, hệ thống hiển thị trang chi tiết với các tab: Thông tin cơ bản (mã thiết bị, tên đại, loại modem, tần số, vùng phủ sóng, mã SAR), Bản đồ vị trí, Lịch sử thay đổi, Văn bản đính kèm.

## Acceptance Criteria
- Tất cả các vai trò đều có thể xem chi tiết thông tin Đại Inmarsat đã được phê duyệt
- Thông tin hiển thị đầy đủ: mã thiết bị, tên đại, loại modem, tần số, vùng phủ sóng, mã SAR, địa chỉ, liên hệ
- Có thể xem vị trí Đại Inmarsat trên bản đồ tương tác
- Hiển thị lịch sử thay đổi dạng timeline (ai, khi nào, thay đổi gì)
- Hiển thị danh sách văn bản đính kèm liên quan đến bản ghi

## In Scope
- Trang chi tiết Đại Inmarsat với đầy đủ thông tin kỹ thuật vệ tinh
- Hiển thị vị trí trên bản đồ tương tác (Google Maps/OpenLayers)
- Tab lịch sử thay đổi dạng timeline
- Tab văn bản đính kèm với chức năng xem/tải xuống
- Tìm kiếm và lọc danh sách Đại Inmarsat theo nhiều tiêu chí
- Hiển thị thông tin vùng phủ sóng (SVC/ROB/FOT/SEA)

## Out of Scope
- Chỉnh sửa thông tin (thuộc F-099)
- Phê duyệt yêu cầu (thuộc F-101)
- Xuất thông tin ra file PDF/Excel
- Tích hợp bản đồ offline
- Hiển thị thông tin lịch sử của bản ghi đã bị xóa

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Xem chi tiết, Tải văn bản đính kèm |
| Trưởng phòng | Xem chi tiết, Tải văn bản đính kèm |
| Trưởng cục | Xem chi tiết, Tải văn bản đính kèm |
| Admin | Xem chi tiết, Tải văn bản đính kèm, Quản lý file đính kèm |

## Architecture Notes
Dùng REST API `GET /api/v1/coastal-stations/inmarsat/{id}` để lấy thông tin chi tiết. Bản đồ dùng thư viện OpenLayers hoặc Google Maps với marker tại tọa độ GPS. Lịch sử thay đổi lấy từ bảng `coastal_station_inmarsat_history`, văn bản đính kèm từ bảng `station_attachments`.

## Entities
- **CoastalStationInmarsat**: id, device_code, station_name, modem_type, frequency, coverage_zone, sar_code, location_address, contact_person, contact_phone, status, created_by, created_at, updated_at
- **StationAttachment**: id, station_id, file_name, file_type, file_size, uploaded_by, uploaded_at, description

## Business Rules
1. Chỉ hiển thị bản ghi ở trạng thái "Đã phê duyệt" cho tất cả user (trừ Admin)
2. Tần số được hiển thị theo đơn vị MHz vàGHz
3. Vùng phủ sóng (SVC/ROB/FOT/SEA) được hiển thị dưới dạng biểu tượng
4. Văn bản đính kèm chỉ hiển thị cho user có quyền truy cập vào bản ghi tương ứng
5. Lịch sử thay đổi hiển thị tối đa 100 thay đổi gần nhất, phân trang nếu nhiều hơn

## Testing Strategy
- Test unit: API trả về đúng thông tin, format tần số
- Test integration: xem chi tiết qua UI, kiểm tra bản đồ và timeline
- Test permission: xác nhận các role khác nhau chỉ xem đúng bản ghi được phân quyền
- Test performance: tải trang chi tiết với 100+ bản ghi lịch sử
