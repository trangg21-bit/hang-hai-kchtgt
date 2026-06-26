---
id: F-014
name: "Quản lý Bến cảng - Tạo mới"
slug: ql-bc-tao-moi
module-id: M-002
status: proposed
classification: local
priority: critical
created: "2026-06-16T04:40:42Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Bến cảng - Tạo mới

## Description

Tính năng cho phép người dùng có thẩm quyền tạo mới một Bến cảng (mã bến theo quy chuẩn VN-301) vào hệ thống quản lý tài sản KCHTGT cảng-bến, bao gồm việc nhập đầy đủ thông tin mã số, tên, cảng mẹ, vị trí, kích thước bến, loại bến và các thuộc tính kỹ thuật chuyên biệt theo chuẩn dữ liệu quốc gia.

## Business Intent

Bến cảng là đơn vị hạ tầng chi tiết bên trong mỗi Cảng biển, nơi trực tiếp tiếp nhận và phục vụ tàu bè; việc số hóa quy trình đăng ký và quản lý Bến cảng giúp đảm bảo tính chính xác trong việc phân loại, sắp xếp và theo dõi năng lực phục vụ của từng bến, góp phần tối ưu hóa việc phân bổ lượt tàu và nâng cao hiệu quả vận hành cảng tổng thể.

## Flow Summary

Người dùng đăng nhập vào hệ thống, chọn chức năng "Tạo mới Bến cảng" từ menu quản lý tài sản. Hệ thống hiển thị biểu mẫu với các trường bắt buộc: mã bến (tuân thủ mã VN-301), tên bến, Cảng mẹ (danh sách chọn từ các Cảng biển đã tồn tại), tuyến đường thủy, tọa độ GPS, chiều dài bến (m), chiều rộng bến (m), loại bến (hàngcontainers/hàng khô/dầu khí/dịch vụ), độ sâu luồng trước bến (m), và trạng thái hoạt động. Người dùng điền đầy đủ thông tin, hệ thống tự động kiểm tra tính hợp lệ của mã bến và phát hiện trùng lặp. Sau khi nộp, Bến cảng được lưu vào cơ sở dữ liệu với trạng thái "Chờ phê duyệt" và thông báo thành công được gửi đến người dùng.

## Acceptance Criteria

1. Người dùng có vai trò "Admin" hoặc "Quản lý cảng" có thể truy cập được chức năng tạo mới Bến cảng từ giao diện quản lý tài sản.
2. Hệ thống yêu cầu điền đầy đủ các trường bắt buộc: mã bến (duy nhất, định dạng VN-301), tên bến, Cảng mẹ (phải chọn từ danh sách tồn tại), chiều dài bến (> 0), chiều rộng bến (> 0), loại bến, độ sâu luồng trước bến.
3. Hệ thống từ chối tạo mới nếu mã bến đã tồn tại trong cơ sở dữ liệu, hiển thị thông báo lỗi rõ ràng cho người dùng.
4. Bến cảng được tạo thành công sẽ được lưu vào cơ sở dữ liệu với trạng thái mặc định "Chờ phê duyệt" và ghi nhận thời gian tạo tự động.

## In Scope

- Biểu mẫu tạo mới Bến cảng với các trường thông tin cơ bản và mở rộng
- Kiểm tra tính hợp lệ của mã bến theo chuẩn VN-301
- Kiểm tra trùng lặp mã bến trong cơ sở dữ liệu
- Danh sách chọn Cảng mẹ từ các Cảng biển đã tồn tại
- Lưu Bến cảng với trạng thái "Chờ phê duyệt"
- Ghi nhật ký tạo mới vào bảng lịch sử thay đổi

## Out of Scope

- Quy trình phê duyệt Bến cảng (thuộc F-017)
- Cập nhật thông tin Bến cảng sau khi tạo (thuộc F-015)
- Xóa Bến cảng (thuộc F-016)
- Tích hợp API với hệ thống cảng quốc gia
- Xuất/Cập nhập dữ liệu Bến cảng hàng loạt

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Quản trị viên | Tạo mới, Xem, Chỉnh sửa, Xóa |
| Quản lý cảng | Tạo mới, Xem, Chỉnh sửa |
| Nhân viên vận hành | Xem |
| KháchExternal | Không có quyền truy cập |

## Entities

- **BenCang**: id (UUID), maBen (string, unique), tenBen (string), cangMeId (UUID, FK → CangBien), tuyensDuongThuy (string), toDo (JSON: {lat, lng}), chieuDaiBen (decimal, m), chieuRongBen (decimal, m), loaiBen (enum: hang_containers, hang_kho, dau_khi, dich_vu), doSauLuongTruocBen (decimal, m), trangThai (enum: cho_phe_duyet, hien_hanh, tam_ngung, da_xoa), ghiChu (text), createdAt (timestamp), updatedAt (timestamp)

## Business Rules

1. Mã bến phải tuân thủ chuẩn mã hóa VN-301, độ dài từ 6 đến 10 ký tự, không được trùng lặp trong toàn hệ thống.
2. Cảng mẹ phải là một Cảng biển đã tồn tại và có trạng thái "Hiện hành" hoặc "Tạm ngừng" — không được chọn Cảng "Chờ phê duyệt" hoặc "Đã xóa".
3. Chiều dài và chiều rộng bến phải là giá trị dương, không vượt quá 2000m.
4. Độ sâu luồng trước bến phải là giá trị dương, đơn vị mét, không nhỏ hơn 3m.
5. Trạng thái mặc định của Bến cảng sau khi tạo mới luôn là "Chờ phê duyệt".

## Testing Strategy

Kiểm thử đơn vị cho các rule validation của mã bến, kích thước bến và độ sâu luồng; kiểm thử tích hợp cho luồng tạo mới Bến cảng qua API REST với các trường hợp dữ liệu hợp lệ và không hợp lệ; kiểm thử giao diện cho biểu mẫu tạo mới bao gồm validation client-side, validation server-side và danh sách chọn Cảng mẹ; kiểm thử chấp nhận người dùng với người dùng đóng vai trò Quản lý cảng.
