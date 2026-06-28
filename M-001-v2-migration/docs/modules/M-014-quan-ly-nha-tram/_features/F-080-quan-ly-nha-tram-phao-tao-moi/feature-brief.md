---
id: F-080
name: Tạo mới Nhà trạm phao
slug: quan-ly-nha-tram-phao-tao-moi
module-id: M-014
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Tạo mới Nhà trạm phao

## Description
Tính năng cho phép Chuyên viên đăng nhập hệ thống nhập và tạo mới hồ sơ Nhà trạm phao, bao gồm đầy đủ các thông tin mô tả vị trí, tọa độ, tình trạng và các tài liệu đính kèm liên quan đến nhà trạm phao hàng hải.

## Business Intent
Nhà trạm phao phải được tạo mới và lưu trữ trong hệ thống với đầy đủ thông tin ban đầu, sau đó được chuyển sang trạng thái chờ duyệt để đảm bảo tính chính xác và tuân thủ quy trình quản lý hạ tầng hàng hải.

## Flow Summary
Chuyên viên đăng nhập hệ thống, truy cập giao diện quản lý nhà trạm phao, chọn chức năng tạo mới, điền đầy đủ các trường thông tin bắt buộc bao gồm tên nhà trạm, mã định danh, tọa độ địa lý, loại phao, tình trạng hoạt động, mô tả chi tiết và tải lên các tài liệu đính kèm (nếu có). Hệ thống sẽ validate các trường bắt buộc, kiểm tra trùng lặp mã định danh, sau đó tạo mới bản ghi với trạng thái "chờ duyệt". Người dùng nhận được thông báo thành công và có thể xem lại bản ghi vừa tạo ở danh sách nhà trạm phao.

## Acceptance Criteria
- Chuyên viên có thể truy cập giao diện tạo mới nhà trạm phao từ menu quản lý chính.
- Hệ thống yêu cầu đầy đủ các trường bắt buộc: tên nhà trạm, mã định danh, tọa độ (kinh độ/vĩ độ), loại phao, tình trạng hoạt động.
- Hệ thống validate dữ liệu đầu vào: kiểm tra định dạng tọa độ, mã định danh không trùng lặp, các trường văn bản không rỗng.
- Sau khi lưu, hệ thống tự động chuyển bản ghi sang trạng thái "chờ duyệt" và thông báo thành công cho người dùng.
- Bản ghi mới tạo hiển thị ngay trong danh sách nhà trạm phao với trạng thái chờ duyệt.

## In Scope
- Form nhập thông tin nhà trạm phao với các trường cơ bản và mở rộng
- Validate dữ liệu đầu vào (required fields, format, duplicate check)
- Tự động chuyển trạng thái sang "chờ duyệt" sau khi tạo thành công
- Thông báo kết quả tạo mới (thành công / lỗi)
- Hiển thị danh sách nhà trạm phao sau khi tạo

## Out of Scope
- Phê duyệt nhà trạm phao (thuộc F-083)
- Chỉnh sửa thông tin sau khi tạo (thuộc F-081)
- Xem lịch sử thay đổi (thuộc F-085)
- Xóa nhà trạm phao (thuộc F-082)
- Xuất/import dữ liệu hàng loạt

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Tạo mới, Xem chi tiết |
| Trưởng phòng | Xem chi tiết, Phê duyệt |
| Lãnh đạo Cục | Xem chi tiết, Phê duyệt |
| Admin hệ thống | Tạo mới, Xem toàn bộ |

## Architecture Notes
- Frontend: Form React với validation sử dụng thư viện Yup hoặc Formik, tích hợp bản đồ Leaflet để chọn tọa độ.
- Backend: Endpoint RESTful POST `/api/v1/buoys` thuộc controller `BuoyStationController`, service layer xử lý validate và tạo mới.
- State machine: Trạng thái ban đầu luôn là `PENDING_APPROVAL`, chuyển sang `APPROVED` sau khi phê duyệt 2 cấp.
- Database: INSERT vào bảng `buoy_stations` với trạng thái mặc định.

## Entities
- **BuoyStation**: id, name, code, longitude, latitude, buoyType, status, description, createdBy, createdAt, approvalStatus, attachmentFiles

## Business Rules
1. Mã định danh nhà trạm phao phải là duy nhất trên toàn hệ thống, không được trùng lặp khi tạo mới.
2. Tọa độ phải nằm trong vùng biển Việt Nam (kinh độ: 101°Đ - 117°Đ, vĩ độ: 8°B - 23°B), nếu không hiển thị cảnh báo.
3. Trạng thái ban đầu của nhà trạm phao mới tạo luôn là "chờ duyệt" (pending approval).
4. Các trường: tên, mã định danh, tọa độ, loại phao là bắt buộc, không cho phép bỏ trống.

## Testing Strategy
- Unit test: Kiểm tra các rule validate trên service layer (trùng mã, format tọa độ, required fields).
- Integration test: Gọi API POST, kiểm tra phản hồi 201 khi thành công, 400 khi dữ liệu sai, 409 khi trùng mã.
- E2E test: Chạy trên UI, tạo mới nhà trạm phao với dữ liệu hợp lệ, xác nhận bản ghi xuất hiện trong danh sách với trạng thái chờ duyệt.
