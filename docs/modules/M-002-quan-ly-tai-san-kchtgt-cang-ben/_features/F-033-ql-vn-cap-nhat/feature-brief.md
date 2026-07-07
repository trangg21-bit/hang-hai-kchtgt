---
id: F-033
name: Quản lý Vùng nước - Cập nhật
slug: ql-vn-cap-nhat
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-29T11:10:09Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Vùng nước - Cập nhật

## Description
Cập nhật thông tin của Vùng nước đã tồn tại trong hệ thống, bao gồm thay đổi tọa độ, diện tích, độ sâu, điều kiện hải văn, khả năng thông hành, các trường kỹ thuật và giấy tờ pháp lý liên quan, với lịch sử biến động được ghi nhận tự động.

## Business Intent
Cho phép cập nhật thông tin Vùng nước khi có thay đổi về điều kiện tự nhiên (thủy triều, độ sâu), mở rộng năng lực thông hành, thay đổi biên giới hoặc điều chỉnh giấy tờ pháp lý. Việc cập nhật đúng quy trình đảm bảo cơ sở dữ liệu luôn chính xác và cập nhật, hỗ trợ công tác quản lý và ra quyết định về phân vùng khai thác biển. Mọi thay đổi đều được ghi nhận lịch sử để phục vụ kiểm toán và追溯 nguồn gốc.

## Flow Summary
Chuyên viên/Người dùng tại Cảng chọn một Vùng nước từ danh sách, truy cập giao diện "Cập nhật" và điền thông tin cần thay đổi. Hệ thống so sánh giá trị trước và sau khi cập nhật, ghi nhận lịch sử thay đổi chi tiết. Sau khi lưu, nếu thay đổi ảnh hưởng đến điều kiện phê duyệt (ví dụ: thay đổi độ sâu hoặc khả năng thông hành), hệ thống tự động chuyển trạng thái sang "cần phê duyệt lại" và gửi yêu cầu phê duyệt hai cấp mới (phòng → Cục). Người dùng có thể cập nhật nhiều trường cùng lúc trong một lần.

## Acceptance Criteria
1. Người dùng có thể chọn một Vùng nước và truy cập giao diện cập nhật
2. Hệ thống hiển thị giá trị hiện tại và cho phép chỉnh sửa các trường cần thay đổi
3. Hệ thống tự động ghi nhận lịch sử thay đổi sau khi lưu
4. Thay đổi quan trọng kích hoạt yêu cầu phê duyệt lại theo quy trình hai cấp
5. Dữ liệu được kiểm tra hợp lệ trước khi lưu

## In Scope
- Form cập nhật thông tin Vùng nước
- Hiển thị giá trị hiện tại và giá trị mới
- Ghi nhận lịch sử thay đổi tự động
- Kiểm tra hợp lệ dữ liệu trước khi lưu
- Kích hoạt phê duyệt lại khi thay đổi quan trọng

## Out of Scope
- Tạo mới Vùng nước (thuộc F-032)
- Xóa Vùng nước (thuộc F-034)
- Xem chi tiết Vùng nước (thuộc F-036)
- Xem lịch sử thay đổi (thuộc F-037)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên Cảng | Cập nhật (khi Vùng nước không khóa) |
| Trưởng phòng QL Cảng | Cập nhật, Phê duyệt lại cấp 1 |
| Quản trị viên | Cập nhật, Khóa/Mở khóa |

## Entities
- **VungNuoc**: id, ma, ten, viTri, toDo, dienTich, doSau, dieuKienHaiVan, khaNangThongHanh, loaiVungNuoc, trangThai, ghiChu, createdAt, updatedAt
- **LichSuVungNuoc**: id, vungNuocId, ngayThayDoi, nguoiThucHien, loaiThayDoi, noiDungTruoc, noiDungSau, ghiChu, createdAt

## Business Rules
1. Chỉ Vùng nước ở trạng thái "chờ phê duyệt", "bị từ chối" hoặc "đã kích hoạt" mới được cập nhật
2. Các trường: tên, vị trí và loại vùng nước là bắt buộc khi cập nhật
3. Thay đổi độ sâu hoặc khả năng thông hành phải được phê duyệt lại
4. Lịch sử thay đổi được ghi nhận tự động cho mọi cập nhật
5. Người cập nhật được ghi nhận tự động từ tài khoản đăng nhập

## Testing Strategy
Kiểm thử cập nhật từng trường đơn lẻ và nhiều trường cùng lúc, kiểm thử ghi nhận lịch sử thay đổi, kiểm thử kích hoạt phê duyệt lại khi thay đổi quan trọng, kiểm thử hợp lệ dữ liệu đầu vào, kiểm thử khi Vùng nước bị khóa.
