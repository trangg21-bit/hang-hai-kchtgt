---
id: F-008
name: Quản lý Cảng biển - Tạo mới
slug: ql-cb-tao-moi
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:19Z
last-updated: 2026-06-29T11:09:57Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Cảng biển - Tạo mới

## Description

Tính năng cho phép người dùng có thẩm quyền tạo mới một Cảng biển (mã cảng theo quy chuẩn VN-36) vào hệ thống quản lý tài sản KCHTGT cảng-bến, bao gồm việc nhập đầy đủ thông tin mã số, tên, vị trí địa lý và các thuộc tính kỹ thuật cần thiết theo chuẩn dữ liệu quốc gia.

## Business Intent

Hoạt động cảng biển là nền tảng hạ tầng then chốt cho chuỗi logistics biển; việc số hóa quy trình đăng ký và quản lý cảng biển giúp đảm bảo tính chính xác, minh bạch và tuân thủ quy chuẩn kỹ thuật, đồng thời tạo điều kiện thuận lợi cho công tác thống kê, báo cáo và điều phối tài nguyên cảng trên phạm vi toàn quốc một cách hiệu quả.

## Flow Summary

Người dùng đăng nhập vào hệ thống, chọn chức năng "Tạo mới Cảng biển" từ menu quản lý tài sản. Hệ thống hiển thị biểu mẫu với các trường bắt buộc: mã cảng (tuân thủ mã VN-36), tên cảng, tỉnh/thành phố, tọa độ GPS, diện tích, khả năng tiếp nhận tàu, và trạng thái hoạt động. Người dùng điền đầy đủ thông tin, hệ thống tự động kiểm tra tính hợp lệ của mã cảng và phát hiện trùng lặp. Sau khi nộp, Cảng biển được lưu vào cơ sở dữ liệu với trạng thái "Chờ phê duyệt" và thông báo thành công được gửi đến người dùng.

## Acceptance Criteria

1. Người dùng có vai trò "Admin" hoặc "Quản lý cảng" có thể truy cập được chức năng tạo mới Cảng biển từ giao diện quản lý tài sản.
2. Hệ thống yêu cầu điền đầy đủ các trường bắt buộc: mã cảng (duy nhất, định dạng VN-36), tên cảng, tỉnh/thành phố, tọa độ GPS (vĩ độ và kinh độ), diện tích (km²), trạng thái hoạt động trước khi cho phép lưu.
3. Hệ thống từ chối tạo mới nếu mã cảng đã tồn tại trong cơ sở dữ liệu, hiển thị thông báo lỗi rõ ràng cho người dùng.
4. Cảng biển được tạo thành công sẽ được lưu vào cơ sở dữ liệu với trạng thái mặc định "Chờ phê duyệt" và ghi nhận thời gian tạo tự động.

## In Scope

- Biểu mẫu tạo mới Cảng biển với các trường thông tin cơ bản và mở rộng
- Kiểm tra tính hợp lệ của mã cảng theo chuẩn VN-36
- Kiểm tra trùng lặp mã cảng trong cơ sở dữ liệu
- Lưu Cảng biển với trạng thái "Chờ phê duyệt"
- Gửi thông báo thành công hoặc lỗi cho người dùng
- Ghi nhật ký tạo mới vào bảng lịch sử thay đổi

## Out of Scope

- Quy trình phê duyệt Cảng biển (thuộc F-011)
- Cập nhật thông tin Cảng biển sau khi tạo (thuộc F-009)
- Xóa Cảng biển (thuộc F-010)
- Tích hợp API với hệ thống cơ sở dữ liệu cảng quốc gia
- Xuất/Cập nhập dữ liệu Cảng biển hàng loạt

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Quản trị viên | Tạo mới, Xem, Chỉnh sửa, Xóa |
| Quản lý cảng | Tạo mới, Xem, Chỉnh sửa |
| Nhân viên vận hành | Xem |
| KháchExternal | Không có quyền truy cập |

## Entities

- **CangBien**: id (UUID), maCang (string, unique), tenCang (string), tinhThanh (string), toDo (JSON: {lat, lng}), dienTich (decimal), khaNangTiepNhanTau (string), trangThai (enum: cho_phe_duyet, hien_hanh, tam_ngung, da_xoa), ghiChu (text), createdAt (timestamp), updatedAt (timestamp)

## Business Rules

1. Mã cảng phải tuân thủ chuẩn mã hóa VN-36, độ dài từ 6 đến 10 ký tự, không được trùng lặp trong toàn hệ thống.
2. Tọa độ GPS (vĩ độ và kinh độ) phải nằm trong khoảng chấp nhận được: vĩ độ -90 đến 90, kinh độ -180 đến 180.
3. Diện tích cảng phải là giá trị dương, đơn vị km², không vượt quá 5000 km².
4. Trạng thái mặc định của Cảng biển sau khi tạo mới luôn là "Chờ phê duyệt" trước khi được kích hoạt hoạt động.

## Testing Strategy

Kiểm thử đơn vị (unit test) cho các rule validation của mã cảng và tọa độ GPS; kiểm thử tích hợp (integration test) cho luồng tạo mới Cảng biển qua API REST với các trường hợp dữ liệu hợp lệ và không hợp lệ; kiểm thử giao diện (UI test) cho biểu mẫu tạo mới bao gồm validation client-side và server-side; kiểm thử chấp nhận người dùng (UAT) với người dùng đóng vai trò Quản lý cảng trong môi trường staging.
