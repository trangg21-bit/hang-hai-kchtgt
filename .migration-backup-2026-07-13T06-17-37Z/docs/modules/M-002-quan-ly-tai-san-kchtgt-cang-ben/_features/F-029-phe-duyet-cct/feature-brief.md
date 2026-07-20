---
id: F-029
name: Phê duyệt Cảng cạn
slug: phe-duyet-cct
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-29T11:10:07Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Phê duyệt Cảng cạn

## Description
Quy trình phê duyệt Cảng cạn (Cảng nội địa) do nhân viên Cảng khởi tạo, nhằm xác nhận thông tin và điều kiện khai thác trước khi đưa Cảng cạn vào sử dụng chính thức trong hệ thống quản lý tài sản KCHTGT.

## Business Intent
Đảm bảo mọi Cảng cạn mới hoặc cập nhật đều trải qua quá trình xem xét, kiểm tra và phê duyệt bởi cấp có thẩm quyền trước khi kích hoạt. Điều này tuân thủ quy định quản lý hạ tầng cảng biển và logistics liên quan, tránh rủi ro vận hành do thiếu thẩm định, đồng thời tạo lập hồ sơ pháp lý đầy đủ cho từng Cảng cạn phục vụ quản lý nhà nước về giao thông vận tải.

## Flow Summary
Nhân viên Cảng khởi tạo yêu cầu phê duyệt Cảng cạn bằng cách điền đầy đủ thông tin kỹ thuật, địa chỉ, diện tích, năng lực xử lý, loại hình dịch vụ và các giấy tờ liên quan (giấy phép thành lập, quyết định chủ trương). Yêu cầu được lưu ở trạng thái "chờ phê duyệt" và gửi đến Trưởng phòng Quản lý Cảng để xem xét. Trưởng phòng thực hiện phê duyệt hoặc từ chối kèm lý do; nếu từ chối, nhân viên Cảng có thể chỉnh sửa và gửi lại. Khi được phê duyệt, trạng thái Cảng cạn chuyển sang "đã kích hoạt" và có thể đưa vào khai thác.

## Acceptance Criteria
1. Nhân viên Cảng có thể khởi tạo yêu cầu phê duyệt Cảng cạn với đầy đủ thông tin bắt buộc
2. Trưởng phòng Quản lý Cảng nhận được thông báo và có thể xem, phê duyệt hoặc từ chối yêu cầu
3. Khi được phê duyệt, trạng thái Cảng cạn tự động chuyển sang "đã kích hoạt"
4. Khi bị từ chối, hệ thống ghi nhận lý do và cho phép nhân viên chỉnh sửa, gửi lại

## In Scope
- Khởi tạo yêu cầu phê duyệt Cảng cạn bởi nhân viên Cảng
- Duyệt hoặc từ chối yêu cầu bởi Trưởng phòng Quản lý Cảng
- Cập nhật trạng thái Cảng cạn (chờ phê duyệt / đã phê duyệt / bị từ chối)
- Gửi thông báo cho các bên liên quan
- Chỉnh sửa và gửi lại yêu cầu khi bị từ chối

## Out of Scope
- Phê duyệt bởi cấp Cục (thuộc quy trình phê duyệt hai cấp của Vùng nước)
- Tự động phê duyệt dựa trên quy tắc
- Tích hợp với hệ thống nghiệp vụ bên ngoài

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Nhân viên Cảng | Khởi tạo, Chỉnh sửa (khi bị từ chối), Xem |
| Trưởng phòng QL Cảng | Xem, Phê duyệt, Từ chối |
| Quản trị viên | Xem toàn bộ, Quản lý vai trò |

## Entities
- **CangCan**: id, ma, ten, diaChi, toDo, loaiHinh, dienTich, nangLxuLy, dichVu, trangThai, ghiChu, createdAt, updatedAt
- **YeuCauPheDuyet**: id, cangCanId, nguoiTao, ngayTao, trangThai, nguoiPheDuyet, ngayPheDuyet, lyDo, createdAt, updatedAt

## Business Rules
1. Chỉ Cảng cạn có trạng thái "chờ phê duyệt" hoặc "bị từ chối" mới được khởi tạo hoặc gửi lại yêu cầu phê duyệt
2. Thông tin bắt buộc bao gồm: mã, tên, địa chỉ, loại hình và năng lực xử lý
3. Chỉ Trưởng phòng Quản lý Cảng mới có quyền phê duyệt hoặc từ chối yêu cầu
4. Mọi thay đổi trạng thái Cảng cạn đều được ghi nhận vào lịch sử
5. Yêu cầu từ chối phải cung cấp lý do rõ ràng

## Testing Strategy
Kiểm thử đơn vị cho từng bước của luồng phê duyệt, kiểm thử tích hợp giữa dịch vụ Cảng cạn và dịch vụ phê duyệt, kiểm thử giao diện người dùng cho các màn hình khởi tạo, xem và phê duyệt yêu cầu, kiểm thử xác thực quyền truy cập theo vai trò, kiểm thử trường hợp từ chối và gửi lại.
