---
id: F-117
name: Quản lý Đại TT Hàng Hải HN - Cập nhật
slug: quan-ly-dai-tt-hang-hai-hn-cap-nhat
module-id: M-015
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Đại TT Hàng Hải HN - Cập nhật

## Description
Cho phép Chuyên viên cập nhật thông tin của một Đại TT Hàng Hải HN đã được phê duyệt trong hệ thống. Mọi thay đổi về thông tin kỹ thuật, vị trí, phạm vi phủ sóng, hoặc cấu hình thiết bị đều được ghi nhận và phải trải qua quy trình phê duyệt lại để đảm bảo tính toàn vẹn dữ liệu.

## Business Intent
Việc cập nhật thông tin Đại TT Hàng Hải HN phải được kiểm soát chặt chẽ, mọi thay đổi cần phải được phê duyệt lại bởi lãnh đạo cấp Phòng và Cục, đảm bảo không có sửa đổi trái phép nào ảnh hưởng đến thông tin kỹ thuật của hệ thống thông tin hàng hải tại Hà Nội phục vụ quản lý nhà nước về hàng hải.

## Flow Summary
Chuyên viên truy cập danh sách Đại TT Hàng Hải HN, chọn bản ghi cần cập nhật, hệ thống hiển thị thông tin chi tiết, Chuyên viên chỉnh sửa các trường cần thay đổi, hệ thống validate dữ liệu, tạo yêu cầu cập nhật ở trạng thái "Chờ phê duyệt" và gửi thông báo đến lãnh đạo cấp Phòng. Sau khi phê duyệt, bản ghi được cập nhật chính thức.

## Acceptance Criteria
- Chuyên viên có thể truy cập và chỉnh sửa thông tin của Đại TT Hàng Hải HN đã được phê duyệt
- Hệ thống kiểm tra validate mọi thay đổi trước khi ghi nhận
- Yêu cầu cập nhật được tạo ở trạng thái "Chờ phê duyệt" và gửi đến lãnh đạo cấp Phòng
- Dữ liệu gốc được bảo toàn và lịch sử thay đổi được ghi nhận đầy đủ
- Bản ghi chỉ được cập nhật chính thức sau khi hoàn tất quy trình phê duyệt

## In Scope
- Giao diện xem và chỉnh sửa thông tin Đại TT Hàng Hải HN
- Validate dữ liệu thay đổi (kiểu dữ liệu, phạm vi giá trị, loại thiết bị)
- Tạo yêu cầu phê duyệt khi có thay đổi
- Hiển thị diff giữa bản ghi cũ và mới
- Ghi nhận lịch sử thay đổi vào audit trail

## Out of Scope
- Thay đổi mã đại (mã đại không thể thay đổi sau khi tạo)
- Xóa bản ghi (thuộc F-118)
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
Thay đổi được lưu vào bảng `coastal_station_maritime_hn_history` với thông tin old_value/new_value/thay_doien_bang. Khi phê duyệt, bản ghi `coastal_station_maritime_hn` được cập nhật. Dùng optimistic locking (version field) để tránh ghi đè đồng thời.

## Entities
- **CoastalStationMaritimeHN**: id, station_code, station_name, latitude, longitude, frequency_band, transmit_power, coverage_range_km, location_address, contact_person, contact_phone, status, version
- **CoastalStationMaritimeHNChange**: id, station_id, changed_by, changed_at, changed_fields(JSON), old_values(JSON), new_values(JSON), approval_status

## Business Rules
1. Mã đại không thể thay đổi sau khi bản ghi đã được tạo
2. Mọi thay đổi ở các trường bắt buộc đều phải trải qua phê duyệt
3. Lịch sử thay đổi phải được ghi lại đầy đủ (trường nào, ai sửa, khi nào)
4. Không cho phép cập nhật nếu bản ghi đang ở trạng thái "bị từ chối" trước khi sửa lại
5. Chỉ bản ghi ở trạng thái "Đã phê duyệt" mới được phép cập nhật

## Testing Strategy
- Test unit: kiểm tra validate trường thay đổi, kiểm tra duy nhất mã đại
- Test integration: API cập nhật, xác nhận trạng thái pending
- Test audit: xác nhận lịch sử thay đổi được ghi nhận chính xác
- Test UI: biểu mẫu cập nhật, hiển thị diff giữa cũ và mới
