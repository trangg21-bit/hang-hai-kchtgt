---
id: F-111
name: Quản lý Đại LRIT - Cập nhật
slug: quan-ly-dai-lrit-cap-nhat
module-id: M-015
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Đại LRIT - Cập nhật

## Description
Cho phép Chuyên viên cập nhật thông tin của một Đại LRIT (trạm thu nhận thông tin vị trí tàu LRIT) đã được phê duyệt trong hệ thống. Mọi thay đổi về thông tin kỹ thuật, cấu hình antenna, tần số thu hoặc thông tin liên hệ đều được ghi nhận và phải trải qua quy trình phê duyệt lại để đảm bảo tính toàn vẹn dữ liệu.

## Business Intent
Việc cập nhật thông tin Đại LRIT phải được kiểm soát chặt chẽ, mọi thay đổi cần phải được phê duyệt lại bởi lãnh đạo cấp Phòng và Cục, đảm bảo không có sửa đổi trái phép nào ảnh hưởng đến thông tin kỹ thuật của hệ thống thu nhận thông tin vị trí tàu LRIT, phục vụ giám sát tàu thuyền theo quy định IMO SOLAS.

## Flow Summary
Chuyên viên truy cập danh sách Đại LRIT, chọn bản ghi cần cập nhật, hệ thống hiển thị thông tin chi tiết, Chuyên viên chỉnh sửa các trường cần thay đổi, hệ thống validate dữ liệu, tạo yêu cầu cập nhật ở trạng thái "Chờ phê duyệt" và gửi thông báo đến lãnh đạo cấp Phòng. Sau khi phê duyệt, bản ghi được cập nhật chính thức.

## Acceptance Criteria
- Chuyên viên có thể truy cập và chỉnh sửa thông tin của Đại LRIT đã được phê duyệt
- Hệ thống kiểm tra validate mọi thay đổi trước khi ghi nhận
- Yêu cầu cập nhật được tạo ở trạng thái "Chờ phê duyệt" và gửi đến lãnh đạo cấp Phòng
- Dữ liệu gốc được bảo toàn và lịch sử thay đổi được ghi nhận đầy đủ
- Bản ghi chỉ được cập nhật chính thức sau khi hoàn tất quy trình phê duyệt

## In Scope
- Giao diện xem và chỉnh sửa thông tin Đại LRIT
- Validate dữ liệu thay đổi (kiểu dữ liệu, phạm vi tần số, loại antenna)
- Tạo yêu cầu phê duyệt khi có thay đổi
- Hiển thị diff giữa bản ghi cũ và mới
- Ghi nhận lịch sử thay đổi vào audit trail

## Out of Scope
- Thay đổi mã thiết bị LRIT (không thể thay đổi sau khi tạo)
- Xóa bản ghi (thuộc F-112)
- Import hàng loạt thay đổi từ file
- Tự động phê duyệt thay đổi nhỏ

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Cập nhật (chờ phê duyệt), Xem chi tiết |
| Trưởng phòng | Phê duyệt / Từ chối thay đổi |
| Trưởng cục | Phê duyệt cấp 2 |
| Admin | Quản lý hệ thống |

## Architecture Notes
Thay đổi được lưu vào bảng `coastal_station_lrit_history` với thông tin old_value/new_value/thay_doien_bang. Khi phê duyệt, bản ghi `coastal_station_lrit` được cập nhật. Dùng optimistic locking (version field) để tránh ghi đè đồng thời.

## Entities
- **CoastalStationLRIT**: id, device_code, station_name, antenna_type, receive_frequency, receive_range_km, location_address, contact_person, contact_phone, status, version
- **CoastalStationLRITChange**: id, station_id, changed_by, changed_at, changed_fields(JSON), old_values(JSON), new_values(JSON), approval_status

## Business Rules
1. Mã thiết bị LRIT không thể thay đổi sau khi bản ghi đã được tạo
2. Mọi thay đổi ở các trường bắt buộc đều phải trải qua phê duyệt
3. Tần số thay đổi phải nằm trong dải L-band (1.6 GHz) theo chuẩn IMO LRIT
4. Lịch sử thay đổi phải được ghi lại đầy đủ (trường nào, ai sửa, khi nào)
5. Chỉ bản ghi ở trạng thái "Đã phê duyệt" mới được phép cập nhật

## Testing Strategy
- Test unit: kiểm tra validate trường thay đổi, kiểm tra dải tần L-band
- Test integration: API cập nhật, xác nhận trạng thái pending
- Test audit: xác nhận lịch sử thay đổi được ghi nhận chính xác
- Test UI: biểu mẫu cập nhật, hiển thị diff giữa cũ và mới
