---
id: F-086
name: Tạo mới Nhà trạm đèn
slug: quan-ly-nha-tram-den-tao-moi
module-id: M-014
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Tạo mới Nhà trạm đèn

## Description
Tính năng cho phép Chuyên viên đăng nhập hệ thống nhập và tạo mới hồ sơ Nhà trạm đèn, bao gồm đầy đủ các thông tin mô tả vị trí, tọa độ, loại đèn, cường độ ánh sáng, tầm chiếu sáng và các tài liệu đính kèm liên quan đến nhà trạm đèn hàng hải.

## Business Intent
Nhà trạm đèn phải được tạo mới và lưu trữ trong hệ thống với đầy đủ thông tin ban đầu, sau đó được chuyển sang trạng thái chờ duyệt để đảm bảo tính chính xác và tuân thủ quy trình quản lý hạ tầng dẫn đường hàng hải.

## Flow Summary
Chuyên viên đăng nhập hệ thống, truy cập giao diện quản lý nhà trạm đèn, chọn chức năng tạo mới, điền đầy đủ các trường thông tin bắt buộc bao gồm tên nhà trạm, mã định danh, tọa độ địa lý, loại đèn, cường độ ánh sáng, tầm chiếu sáng, mô tả chi tiết và tải lên các tài liệu đính kèm (nếu có). Hệ thống sẽ validate các trường bắt buộc, kiểm tra trùng lặp mã định danh, sau đó tạo mới bản ghi với trạng thái "chờ duyệt". Người dùng nhận được thông báo thành công và có thể xem lại bản ghi vừa tạo ở danh sách nhà trạm đèn.

## Acceptance Criteria
- Chuyên viên có thể truy cập giao diện tạo mới nhà trạm đèn từ menu quản lý chính.
- Hệ thống yêu cầu đầy đủ các trường bắt buộc: tên nhà trạm, mã định danh, tọa độ (kinh độ/vĩ độ), loại đèn, cường độ ánh sáng, tầm chiếu sáng.
- Hệ thống validate dữ liệu đầu vào: kiểm tra định dạng tọa độ, mã định danh không trùng lặp, cường độ ánh sáng phải là số dương.
- Sau khi lưu, hệ thống tự động chuyển bản ghi sang trạng thái "chờ duyệt" và thông báo thành công cho người dùng.
- Bản ghi mới tạo hiển thị ngay trong danh sách nhà trạm đèn với trạng thái chờ duyệt.

## In Scope
- Form nhập thông tin nhà trạm đèn với các trường cơ bản và mở rộng
- Validate dữ liệu đầu vào (required fields, format, duplicate check)
- Tự động chuyển trạng thái sang "chờ duyệt" sau khi tạo thành công
- Thông báo kết quả tạo mới (thành công / lỗi)
- Hiển thị danh sách nhà trạm đèn sau khi tạo

## Out of Scope
- Phê duyệt nhà trạm đèn (thuộc F-089)
- Chỉnh sửa thông tin sau khi tạo (thuộc F-087)
- Xem lịch sử thay đổi (thuộc F-091)
- Xóa nhà trạm đèn (thuộc F-088)
- Xuất/import dữ liệu hàng loạt

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Tạo mới, Xem chi tiết |
| Trưởng phòng | Xem chi tiết, Phê duyệt |
| Lãnh đạo Cục | Xem chi tiết, Phê duyệt |
| Admin hệ thống | Tạo mới, Xem toàn bộ |

## Architecture Notes
- Frontend: Form React với validation sử dụng thư viện Yup hoặc Formik, tích hợp bản đồ Leaflet để chọn tọa độ. Các trường cường độ ánh sáng và tầm chiếu sáng là số, validated tại client và server.
- Backend: Endpoint RESTful POST `/api/v1/beacons` thuộc controller `BeaconStationController`, service layer xử lý validate và tạo mới.
- State machine: Trạng thái ban đầu luôn là `PENDING_APPROVAL`, chuyển sang `APPROVED` sau khi phê duyệt 2 cấp.
- Database: INSERT vào bảng `beacon_stations` với trạng thái mặc định.

## Entities
- **BeaconStation**: id, name, code, longitude, latitude, beaconType, lightIntensity, visibilityRange, description, createdBy, createdAt, approvalStatus, attachmentFiles

## Business Rules
1. Mã định danh nhà trạm đèn phải là duy nhất trên toàn hệ thống, không được trùng lặp khi tạo mới.
2. Tọa độ phải nằm trong vùng biển Việt Nam (kinh độ: 101°Đ - 117°Đ, vĩ độ: 8°B - 23°B), nếu không hiển thị cảnh báo.
3. Cường độ ánh sáng và tầm chiếu sáng phải là số dương (> 0), không cho phép giá trị âm hoặc 0.
4. Trạng thái ban đầu của nhà trạm đèn mới tạo luôn là "chờ duyệt" (pending approval).
5. Các trường: tên, mã định danh, tọa độ, loại đèn, cường độ ánh sáng là bắt buộc.

## Testing Strategy
- Unit test: Kiểm tra các rule validate trên service layer (trùng mã, format tọa độ, cường độ > 0, required fields).
- Integration test: Gọi API POST, kiểm tra phản hồi 201 khi thành công, 400 khi dữ liệu sai, 409 khi trùng mã.
- E2E test: Chạy trên UI, tạo mới nhà trạm đèn với dữ liệu hợp lệ, xác nhận bản ghi xuất hiện trong danh sách với trạng thái chờ duyệt. Test trường hợp cường độ = 0 → lỗi validate.
