---
id: F-110
name: Quản lý Đại LRIT - Tạo mới
slug: quan-ly-dai-lrit-tao-moi
module-id: M-015
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Đại LRIT - Tạo mới

## Description
Cho phép Chuyên viên đăng ký và tạo mới một Đại LRIT (trạm thu nhận thông tin vị trí tàu xa bờ Long Range Identification and Tracking) vào hệ thống với đầy đủ thông tin kỹ thuật bao gồm mã thiết bị, tần số hoạt động, loại antenna, phạm vi thu tín hiệu và thông tin liên hệ quản lý. Dữ liệu đầu vào được chuẩn hóa và gửi yêu cầu phê duyệt sau khi tạo.

## Business Intent
Đại LRIT mới phải được tạo và lưu trữ trong hệ thống để quản lý tập trung các trạm thu nhận thông tin vị trí tàu theo quy định của IMO SOLAS, đồng thời phải trải qua quy trình phê duyệt hai cấp (Phòng → Cục) trước khi chính thức đi vào hoạt động, đảm bảo tuân thủ các yêu cầu quốc tế về giám sát tàu thuyền trên biển.

## Flow Summary
Chuyên viên đăng nhập hệ thống, truy cập menu Quản lý Đại LRIT, chọn chức năng Tạo mới, điền đầy đủ thông tin vào biểu mẫu (mã thiết bị, tên đại, loại antenna, tần số thu, phạm vi thu tín hiệu, vị trí địa lý, địa chỉ sở tại, liên hệ quản lý), hệ thống validate dữ liệu đầu vào, sau đó tạo bản ghi ở trạng thái "Chờ phê duyệt" và thông báo cho lãnh đạo cấp Phòng xem xét.

## Acceptance Criteria
- Chuyên viên có thể tạo thành công một bản ghi Đại LRIT mới với đầy đủ thông tin kỹ thuật
- Hệ thống kiểm tra validate các trường bắt buộc và cảnh báo lỗi cụ thể khi thiếu/thông tin không hợp lệ
- Bản ghi được lưu ở trạng thái "Chờ phê duyệt" (pending) sau khi tạo
- Thông báo phê duyệt được gửi tự động đến lãnh đạo cấp Phòng qua hệ thống
- Dữ liệu được lưu vào cơ sở dữ liệu với đầy đủ metadata (người tạo, thời gian tạo, phiên bản)

## In Scope
- Biểu mẫu tạo mới Đại LRIT với các trường thông tin kỹ thuật (loại antenna, tần số, phạm vi thu)
- Validate dữ liệu đầu vào (kiểu dữ liệu, khoảng giá trị, trường bắt buộc)
- Tự động chuyển trạng thái bản ghi sang "Chờ phê duyệt"
- Gửi thông báo phê duyệt đến lãnh đạo cấp Phòng
- Lưu lịch tạo mới vào bảng audit trail

## Out of Scope
- Quy trình phê duyệt (thuộc F-113)
- Chỉnh sửa bản ghi sau khi tạo (thuộc F-111)
- Xóa bản ghi (thuộc F-112)
- Tích hợp API với hệ thống LRIT Data Centre (LRIT-DC)
- Import hàng loạt từ file Excel/CSV

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Tạo mới, Xem chi tiết |
| Trưởng phòng | Phê duyệt / Từ chối |
| Trưởng cục | Phê duyệt cấp 2 |
| Admin | Quản lý hệ thống |

## Architecture Notes
Bản ghi Đại LRIT được lưu vào bảng `coastal_station_lrit` với trạng thái `status = 'pending'`. Quy trình phê duyệt dùng state machine chuyển trạng thái từ `pending` → `approved` hoặc `rejected`. Tích hợp với module NotificationService để gửi thông báo tự động.

## Entities
- **CoastalStationLRIT**: id, device_code, station_name, antenna_type, receive_frequency, receive_range_km, location_address, contact_person, contact_phone, status, created_by, created_at, updated_at
- **AntennaType**: id, type_code, type_name, supported_frequencies, max_range_km, manufacturer

## Business Rules
1. Mã thiết bị LRIT phải là duy nhất trong toàn hệ thống, không được trùng lặp
2. Tất cả các trường bắt buộc (mã thiết bị, tên đại, loại antenna, tần số) phải được điền đầy đủ
3. Tần số thu phải nằm trong dải quy định cho LRIT (1.6 GHz L-band theo chuẩn IMO)
4. Bản ghi mới luôn ở trạng thái "Chờ phê duyệt" và không thể chỉnh sửa trực tiếp
5. Chỉ Chuyên viên mới có quyền tạo mới; các role khác chỉ xem hoặc phê duyệt

## Testing Strategy
- Test unit: validate các trường đầu vào, kiểm tra duy nhất mã thiết bị
- Test integration: tạo mới bản ghi qua REST API, xác nhận trạng thái pending
- Test workflow: kiểm tra flow phê duyệt từ Phòng đến Cục sau khi tạo
- Test UI: biểu mẫu tạo mới với các validation messages
