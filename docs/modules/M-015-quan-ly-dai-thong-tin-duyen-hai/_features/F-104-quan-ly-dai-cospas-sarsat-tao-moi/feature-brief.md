---
id: F-104
name: Quản lý Đại Cospas-Sarsat - Tạo mới
slug: quan-ly-dai-cospas-sarsat-tao-moi
module-id: M-015
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Đại Cospas-Sarsat - Tạo mới

## Description
Cho phép Chuyên viên đăng ký và tạo mới một Đại Cospas-Sarsat (trạm tiếp nhận tín hiệu cứu nạn vệ tinh Cospas-Sarsat) vào hệ thống với đầy đủ thông tin kỹ thuật bao gồm mã thiết bị ELT/EPIRB, tần số hoạt động, loại platform, vùng phủ sóng và thông tin liên hệ quản lý. Dữ liệu đầu vào được chuẩn hóa và gửi yêu cầu phê duyệt sau khi tạo.

## Business Intent
Đại Cospas-Sarsat mới phải được tạo và lưu trữ trong hệ thống để quản lý tập trung các trạm tiếp nhận tín hiệu cứu nạn vệ tinh, đồng thời phải trải qua quy trình phê duyệt hai cấp (Phòng → Cục) trước khi chính thức đi vào hoạt động, đảm bảo mọi thông tin kỹ thuật đều được kiểm duyệt chặt chẽ để phục vụ công tác cứu nạn cứu hộ trên biển.

## Flow Summary
Chuyên viên đăng nhập hệ thống, truy cập menu Quản lý Đại Cospas-Sarsat, chọn chức năng Tạo mới, điền đầy đủ thông tin vào biểu mẫu (mã thiết bị, tên đại, loại beacon, tần số, vùng phủ sóng, mã MMSI, địa chỉ sở tại, liên hệ quản lý), hệ thống validate dữ liệu đầu vào, sau đó tạo bản ghi ở trạng thái "Chờ phê duyệt" và thông báo cho lãnh đạo cấp Phòng xem xét.

## Acceptance Criteria
- Chuyên viên có thể tạo thành công một bản ghi Đại Cospas-Sarsat mới với đầy đủ thông tin kỹ thuật
- Hệ thống kiểm tra validate các trường bắt buộc và cảnh báo lỗi cụ thể khi thiếu/thông tin không hợp lệ
- Bản ghi được lưu ở trạng thái "Chờ phê duyệt" (pending) sau khi tạo
- Thông báo phê duyệt được gửi tự động đến lãnh đạo cấp Phòng qua hệ thống
- Dữ liệu được lưu vào cơ sở dữ liệu với đầy đủ metadata (người tạo, thời gian tạo, phiên bản)

## In Scope
- Biểu mẫu tạo mới Đại Cospas-Sarsat với các trường thông tin kỹ thuật (loại beacon, tần số, vùng phủ sóng)
- Validate dữ liệu đầu vào (kiểu dữ liệu, khoảng giá trị, trường bắt buộc)
- Tự động chuyển trạng thái bản ghi sang "Chờ phê duyệt"
- Gửi thông báo phê duyệt đến lãnh đạo cấp Phòng
- Lưu lịch tạo mới vào bảng audit trail

## Out of Scope
- Quy trình phê duyệt (thuộc F-107)
- Chỉnh sửa bản ghi sau khi tạo (thuộc F-105)
- Xóa bản ghi (thuộc F-106)
- Tích hợp API với hệ thống Cospas-Sarsat bên ngoài
- Import hàng loạt từ file Excel/CSV

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Tạo mới, Xem chi tiết |
| Trưởng phòng | Phê duyệt / Từ chối |
| Trưởng cục | Phê duyệt cấp 2 |
| Admin | Quản lý hệ thống |

## Architecture Notes
Bản ghi Đại Cospas-Sarsat được lưu vào bảng `coastal_station_cospas_sarsat` với trạng thái `status = 'pending'`. Quy trình phê duyệt dùng state machine chuyển trạng thái từ `pending` → `approved` hoặc `rejected`. Tích hợp với module NotificationService để gửi thông báo tự động.

## Entities
- **CoastalStationCospasSarsat**: id, device_code, station_name, beacon_type, frequency, coverage_zone, mmsi_code, location_address, contact_person, contact_phone, status, created_by, created_at, updated_at
- **BeaconType**: id, type_code, type_name, supported_frequencies, max_range_km

## Business Rules
1. Mã thiết bị Cospas-Sarsat phải là duy nhất trong toàn hệ thống, không được trùng lặp
2. Tất cả các trường bắt buộc (mã thiết bị, tên đại, loại beacon, tần số) phải được điền đầy đủ
3. Tần số phải nằm trong dải được quy định: 406 MHz (chính) và 121.5 MHz (hướng dẫn)
4. Bản ghi mới luôn ở trạng thái "Chờ phê duyệt" và không thể chỉnh sửa trực tiếp
5. Chỉ Chuyên viên mới có quyền tạo mới; các role khác chỉ xem hoặc phê duyệt

## Testing Strategy
- Test unit: validate các trường đầu vào, kiểm tra duy nhất mã thiết bị
- Test integration: tạo mới bản ghi qua REST API, xác nhận trạng thái pending
- Test workflow: kiểm tra flow phê duyệt từ Phòng đến Cục sau khi tạo
- Test UI: biểu mẫu tạo mới với các validation messages
