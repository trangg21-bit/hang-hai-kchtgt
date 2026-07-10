---
id: F-116
name: Quản lý Đại TT Hàng Hải HN - Tạo mới
slug: quan-ly-dai-tt-hang-hai-hn-tao-moi
module-id: M-015
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Đại TT Hàng Hải HN - Tạo mới

## Description
Cho phép Chuyên viên đăng ký và tạo mới một Đại Thông tin Hàng Hải Hà Nội vào hệ thống với đầy đủ thông tin kỹ thuật và vị trí địa lý. Giao diện nhập liệu bao gồm các trường bắt buộc như mã đại, tên đại, tọa độ, tần số hoạt động, phạm vi phủ sóng và thông tin liên hệ, đảm bảo dữ liệu đầu vào được chuẩn hóa trước khi gửi yêu cầu phê duyệt.

## Business Intent
Đại TT Hàng Hải HN mới phải được tạo và lưu trữ trong hệ thống để quản lý tập trung tại trụ sở Hà Nội, đồng thời phải trải qua quy trình phê duyệt hai cấp (Phòng → Cục) trước khi chính thức hoạt động, đảm bảo mọi thông tin kỹ thuật đều được kiểm duyệt chặt chẽ phục vụ công tác thông tin hàng hải quốc gia.

## Flow Summary
Chuyên viên đăng nhập hệ thống, truy cập menu Quản lý Đại TT Hàng Hải HN, chọn chức năng Tạo mới, điền đầy đủ thông tin vào biểu mẫu (mã đại, tên đại, tọa độ GPS, dải tần, công suất phát, phạm vi phủ sóng, địa chỉ sở tại tại Hà Nội, liên hệ quản lý), hệ thống validate dữ liệu đầu vào, sau đó tạo bản ghi ở trạng thái "Chờ phê duyệt" và thông báo cho lãnh đạo cấp Phòng xem xét.

## Acceptance Criteria
- Chuyên viên có thể tạo thành công một bản ghi Đại TT Hàng Hải HN mới với đầy đủ thông tin bắt buộc
- Hệ thống kiểm tra validate các trường bắt buộc và cảnh báo lỗi cụ thể khi thiếu/thông tin không hợp lệ
- Bản ghi được lưu ở trạng thái "Chờ phê duyệt" (pending) sau khi tạo
- Thông báo phê duyệt được gửi tự động đến lãnh đạo cấp Phòng qua hệ thống
- Dữ liệu được lưu vào cơ sở dữ liệu với đầy đủ metadata (người tạo, thời gian tạo, phiên bản)

## In Scope
- Biểu mẫu tạo mới Đại TT Hàng Hải HN với các trường thông tin kỹ thuật
- Validate dữ liệu đầu vào (kiểu dữ liệu, khoảng giá trị, trường bắt buộc)
- Tự động chuyển trạng thái bản ghi sang "Chờ phê duyệt"
- Gửi thông báo phê duyệt đến lãnh đạo cấp Phòng
- Lưu lịch tạo mới vào bảng audit trail

## Out of Scope
- Quy trình phê duyệt (thuộc F-119)
- Chỉnh sửa bản ghi sau khi tạo (thuộc F-117)
- Xóa bản ghi (thuộc F-118)
- Tích hợp API với hệ thống thông tin hàng hải bên ngoài
- Import hàng loạt từ file Excel/CSV

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Tạo mới, Xem chi tiết |
| Trưởng phòng | Phê duyệt / Từ chối |
| Trưởng cục | Phê duyệt cấp 2 |
| Admin | Quản lý hệ thống |

## Architecture Notes
Bản ghi Đại TT Hàng Hải HN được lưu vào bảng `coastal_station_maritime_hn` với trạng thái `status = 'pending'`. Quy trình phê duyệt dùng state machine chuyển trạng thái từ `pending` → `approved` hoặc `rejected`. Tích hợp với module NotificationService để gửi thông báo tự động.

## Entities
- **CoastalStationMaritimeHN**: id, station_code, station_name, latitude, longitude, frequency_band, transmit_power, coverage_range_km, location_address, contact_person, contact_phone, status, created_by, created_at, updated_at
- **CoverageRange**: id, range_code, range_name, description_km

## Business Rules
1. Mã đại phải là duy nhất trong toàn hệ thống, không được trùng lặp
2. Tất cả các trường bắt buộc (mã đại, tên đại, tọa độ, tần số) phải được điền đầy đủ
3. Tọa độ GPS phải nằm trong phạm vi khu vực hoạt động của Cục Hàng Hải (có thể mở rộng)
4. Bản ghi mới luôn ở trạng thái "Chờ phê duyệt" và không thể chỉnh sửa trực tiếp
5. Chỉ Chuyên viên mới có quyền tạo mới; các role khác chỉ xem hoặc phê duyệt

## Testing Strategy
- Test unit: validate các trường đầu vào, kiểm tra duy nhất mã đại
- Test integration: tạo mới bản ghi qua REST API, xác nhận trạng thái pending
- Test workflow: kiểm tra flow phê duyệt từ Phòng đến Cục sau khi tạo
- Test UI: biểu mẫu tạo mới với các validation messages
