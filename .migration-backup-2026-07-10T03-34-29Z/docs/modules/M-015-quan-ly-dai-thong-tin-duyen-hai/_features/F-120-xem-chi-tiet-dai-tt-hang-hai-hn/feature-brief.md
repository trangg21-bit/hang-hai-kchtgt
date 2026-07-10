---
id: F-120
name: Xem chi tiết Đại TT Hàng Hải HN
slug: xem-chi-tiet-dai-tt-hang-hai-hn
module-id: M-015
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Xem chi tiết Đại TT Hàng Hải HN

## Description
Cho phép tất cả các vai trò trong hệ thống tra cứu và xem chi tiết thông tin của một Đại TT Hàng Hải HN đã được phê duyệt, bao gồm thông tin kỹ thuật, vị trí trên bản đồ, lịch sử thay đổi và các văn bản đính kèm liên quan. Giao diện hiển thị trực quan với đầy đủ metadata và bản đồ vị trí.

## Business Intent
Cung cấp khả năng tra cứu nhanh chóng và chính xác thông tin Đại TT Hàng Hải HN cho tất cả các bên liên quan, hỗ trợ công tác quản lý, điều độ và kiểm tra thông tin kỹ thuật của hệ thống thông tin hàng hải tại Hà Nội một cách hiệu quả, phục vụ công tác quản lý nhà nước về giao thông vận tải biển.

## Flow Summary
Người dùng truy cập danh sách Đại TT Hàng Hải HN, tìm kiếm theo mã/tên/địa chỉ, chọn bản ghi cần xem, hệ thống hiển thị trang chi tiết với các tab: Thông tin cơ bản (mã đại, tên đại, tọa độ, tần số, thiết bị), Bản đồ vị trí (vị trí trên bản đồ tương tác), Lịch sử thay đổi (timeline các lần cập nhật), Văn bản đính kèm (các file liên quan).

## Acceptance Criteria
- Tất cả các vai trò đều có thể xem chi tiết thông tin Đại TT Hàng Hải HN đã được phê duyệt
- Thông tin hiển thị đầy đủ: mã đại, tên đại, tọa độ, tần số, thiết bị, địa chỉ, liên hệ
- Có thể xem vị trí Đại TT Hàng Hải HN trên bản đồ tương tác
- Hiển thị lịch sử thay đổi dạng timeline (ai, khi nào, thay đổi gì)
- Hiển thị danh sách văn bản đính kèm liên quan đến bản ghi

## In Scope
- Trang chi tiết Đại TT Hàng Hải HN với đầy đủ thông tin kỹ thuật
- Hiển thị vị trí trên bản đồ tương tác (Google Maps/OpenLayers)
- Tab lịch sử thay đổi dạng timeline
- Tab văn bản đính kèm với chức năng xem/tải xuống
- Tìm kiếm và lọc danh sách Đại TT Hàng Hải HN theo nhiều tiêu chí
- Hiển thị trạng thái hiện tại của bản ghi

## Out of Scope
- Chỉnh sửa thông tin (thuộc F-117)
- Phê duyệt yêu cầu (thuộc F-119)
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
Dùng REST API `GET /api/v1/coastal-stations/maritime-hn/{id}` để lấy thông tin chi tiết. Bản đồ dùng thư viện OpenLayers hoặc Google Maps với marker tại tọa độ GPS. Lịch sử thay đổi lấy từ bảng `coastal_station_maritime_hn_history`, văn bản đính kèm từ bảng `station_attachments`.

## Entities
- **CoastalStationMaritimeHN**: id, station_code, station_name, latitude, longitude, frequency_band, transmit_power, coverage_range_km, location_address, contact_person, contact_phone, status, created_by, created_at, updated_at
- **StationAttachment**: id, station_id, file_name, file_type, file_size, uploaded_by, uploaded_at, description

## Business Rules
1. Chỉ hiển thị bản ghi ở trạng thái "Đã phê duyệt" cho tất cả user (trừ Admin)
2. Tọa độ GPS được hiển thị dưới dạng thập phân (decimal degrees) và trên bản đồ
3. Văn bản đính kèm chỉ hiển thị cho user có quyền truy cập vào bản ghi tương ứng
4. Lịch sử thay đổi hiển thị tối đa 100 thay đổi gần nhất, phân trang nếu nhiều hơn

## Testing Strategy
- Test unit: API trả về đúng thông tin, format tọa độ
- Test integration: xem chi tiết qua UI, kiểm tra bản đồ và timeline
- Test permission: xác nhận các role khác nhau chỉ xem đúng bản ghi được phân quyền
- Test performance: tải trang chi tiết với 100+ bản ghi lịch sử
