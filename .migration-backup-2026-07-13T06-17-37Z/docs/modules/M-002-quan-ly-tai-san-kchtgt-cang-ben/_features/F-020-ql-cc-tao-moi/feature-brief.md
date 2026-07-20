---
id: F-020
name: Quản lý Cầu cảng - Tạo mới
slug: ql-cc-tao-moi
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:41:01Z
last-updated: 2026-06-29T11:10:03Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Cầu cảng - Tạo mới

## Description

Tính năng cho phép người dùng có thẩm quyền tạo mới một Cầu cảng (mã cầu theo quy chuẩn VN-614) vào hệ thống quản lý tài sản KCHTGT cảng-bến, bao gồm việc nhập đầy đủ thông tin mã số, tên, Bến cảng mẹ, loại kết cấu, vật liệu, tải trọng thiết kế và các thuộc tính kỹ thuật chuyên biệt theo chuẩn dữ liệu quốc gia về kết cấu cảng biển.

## Business Intent

Cầu cảng là kết cấu hạ tầng then chốt trực tiếp tiếp nhận tàu và hỗ trợ hoạt động bốc xếp hàng hóa; việc số hóa quy trình đăng ký và quản lý Cầu cảng giúp đảm bảo thông tin kỹ thuật chính xác (tải trọng, vật liệu, loại kết cấu), phục vụ công tác tính toán năng lực bốc xếp, đánh giá an toàn kết cấu và lập kế hoạch bảo trì, sửa chữa theo chu kỳ.

## Flow Summary

Người dùng đăng nhập vào hệ thống, chọn chức năng "Tạo mới Cầu cảng" từ menu quản lý tài sản. Hệ thống hiển thị biểu mẫu với các trường bắt buộc: mã cầu (tuân thủ mã VN-614), tên cầu, Bến cảng mẹ (danh sách chọn từ các Bến cảng đã tồn tại), loại kết cấu (bê tông cốt thép, thép, gỗ, tổ hợp), vật liệu chính, tải trọng thiết kế (T/m²), chiều dài (m), chiều rộng (m), mực nước cao nhất tại vị trí cầu cảng, và trạng thái hoạt động. Người dùng điền đầy đủ thông tin, hệ thống tự động kiểm tra tính hợp lệ của mã cầu và phát hiện trùng lặp. Sau khi nộp, Cầu cảng được lưu vào cơ sở dữ liệu với trạng thái "Chờ phê duyệt" và thông báo thành công được gửi đến người dùng.

## Acceptance Criteria

1. Người dùng có vai trò "Admin" hoặc "Quản lý cảng" có thể truy cập được chức năng tạo mới Cầu cảng từ giao diện quản lý tài sản.
2. Hệ thống yêu cầu điền đầy đủ các trường bắt buộc: mã cầu (duy nhất, định dạng VN-614), tên cầu, Bến cảng mẹ (phải chọn từ danh sách tồn tại), loại kết cấu, vật liệu chính, tải trọng thiết kế (> 0), chiều dài (> 0), chiều rộng (> 0).
3. Hệ thống từ chối tạo mới nếu mã cầu đã tồn tại trong cơ sở dữ liệu, hiển thị thông báo lỗi rõ ràng cho người dùng.
4. Cầu cảng được tạo thành công sẽ được lưu vào cơ sở dữ liệu với trạng thái mặc định "Chờ phê duyệt" và ghi nhận thời gian tạo tự động.

## In Scope

- Biểu mẫu tạo mới Cầu cảng với các trường thông tin kỹ thuật chuyên biệt
- Kiểm tra tính hợp lệ của mã cầu theo chuẩn VN-614
- Kiểm tra trùng lặp mã cầu trong cơ sở dữ liệu
- Danh sách chọn Bến cảng mẹ từ các Bến cảng đã tồn tại
- Lưu Cầu cảng với trạng thái "Chờ phê duyệt"
- Ghi nhật ký tạo mới vào bảng lịch sử thay đổi

## Out of Scope

- Quy trình phê duyệt Cầu cảng (thuộc F-023)
- Cập nhật thông tin Cầu cảng sau khi tạo (thuộc F-021)
- Xóa Cầu cảng (thuộc F-022)
- Tích hợp API với hệ thống kết cấu cảng quốc gia
- Xuất/Cập nhập dữ liệu Cầu cảng hàng loạt
- Tính toán an toàn kết cấu tự động

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Quản trị viên | Tạo mới, Xem, Chỉnh sửa, Xóa |
| Quản lý cảng | Tạo mới, Xem, Chỉnh sửa |
| Nhân viên vận hành | Xem |
| KháchExternal | Không có quyền truy cập |

## Entities

- **CauCang**: id (UUID), maCau (string, unique), tenCau (string), benCangMeId (UUID, FK → BenCang), loaiKetCau (enum: be_tong_co_thep, thep, go, to_hop), vatLieuChinh (string), taiTrongThietKe (decimal, T/m²), chieuDaiCau (decimal, m), chieuRongCau (decimal, m), mucNuocCaoNhat (decimal, m), trangThai (enum: cho_phe_duyet, hien_hanh, tam_ngung, da_xoa), ghiChu (text), createdAt (timestamp), updatedAt (timestamp)

## Business Rules

1. Mã cầu phải tuân thủ chuẩn mã hóa VN-614, độ dài từ 6 đến 10 ký tự, không được trùng lặp trong toàn hệ thống.
2. Bến cảng mẹ phải là một Bến cảng đã tồn tại và có trạng thái "Hi hiện hành" hoặc "Tạm ngừng" — không được chọn Bến "Chờ phê duyệt" hoặc "Đã xóa".
3. Tải trọng thiết kế phải là giá trị dương, đơn vị T/m², không vượt quá 20 T/m².
4. Chiều dài và chiều rộng cầu phải là giá trị dương, không vượt quá 500m.
5. Trạng thái mặc định của Cầu cảng sau khi tạo mới luôn là "Chờ phê duyệt".

## Testing Strategy

Kiểm thử đơn vị cho các rule validation của mã cầu, kích thước cầu cảng và tải trọng thiết kế; kiểm thử tích hợp cho luồng tạo mới Cầu cảng qua API REST với các trường hợp dữ liệu hợp lệ và không hợp lệ; kiểm thử giao diện cho biểu mẫu tạo mới bao gồm validation client-side, server-side và danh sách chọn Bến cảng mẹ; kiểm thử chấp nhận người dùng với người dùng đóng vai trò Quản lý cảng.
