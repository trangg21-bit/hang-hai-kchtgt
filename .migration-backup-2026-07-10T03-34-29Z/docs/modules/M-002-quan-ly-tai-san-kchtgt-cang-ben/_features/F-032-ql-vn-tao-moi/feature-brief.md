---
id: F-032
name: Quản lý Vùng nước - Tạo mới
slug: ql-vn-tao-moi
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-29T11:10:09Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Vùng nước - Tạo mới

## Description
Tạo mới Vùng nước (khu vực nước biển, cửa sông, luồng lạch được quản lý phục vụ hoạt động cảng biển) trong hệ thống quản lý tài sản KCHTGT, bao gồm điền đầy đủ thông tin địa lý, điều kiện hải văn, khả năng thông hành và các giấy tờ pháp lý liên quan.

## Business Intent
Cho phép nhân viên có thẩm quyền đăng ký và khởi tạo Vùng nước mới vào hệ thống, phục vụ công tác quản lý hạ tầng cảng biển và phân vùng khai thác biển. Việc tạo mới đúng quy trình đảm bảo mọi Vùng nước đều được thu thập đầy đủ thông tin địa lý, điều kiện tự nhiên và pháp lý, sẵn sàng cho quy trình phê duyệt hai cấp (phòng → Cục) và đưa vào khai thác, góp phần hoàn thiện cơ sở dữ liệu tài sản quốc gia về vùng nước phục vụ giao thông vận tải biển.

## Flow Summary
Chuyên viên/Người dùng tại Cảng truy cập giao diện "Tạo mới Vùng nước", điền đầy đủ các trường thông tin bắt buộc: mã vùng nước, tên vùng nước, tọa độ biên giới, diện tích mặt nước, độ sâu trung bình, điều kiện hải văn (thủy triều, sóng, dòng chảy), khả năng thông hành tàu thuyền, loại vùng nước và các giấy tờ liên quan. Hệ thống kiểm tra tính hợp lệ của các trường, tạo mã tự động nếu chưa cung cấp và lưu Vùng nước ở trạng thái "chờ phê duyệt". Sau khi lưu, người dùng có thể đính kèm giấy tờ liên quan và gửi yêu cầu phê duyệt hai cấp (phòng → Cục) để đưa Vùng nước vào khai thác.

## Acceptance Criteria
1. Chuyên viên tại Cảng có thể điền đầy đủ thông tin bắt buộc để tạo mới Vùng nước
2. Hệ thống kiểm tra hợp lệ dữ liệu và báo lỗi rõ ràng cho các trường không hợp lệ
3. Vùng nước mới được lưu với trạng thái "chờ phê duyệt" và không hiển thị trong danh sách khai thác
4. Mã Vùng nước được tự động sinh theo quy tắc nếu người dùng chưa nhập
5. Người dùng có thể đính kèm tối thiểu một giấy tờ pháp lý khi tạo mới
6. Yêu cầu phê duyệt được gửi theo quy trình hai cấp (phòng → Cục)

## In Scope
- Form tạo mới Vùng nước với các trường bắt buộc
- Kiểm tra hợp lệ dữ liệu đầu vào
- Tự động sinh mã Vùng nước
- Lưu ở trạng thái "chờ phê duyệt"
- Đính kèm giấy tờ pháp lý liên quan
- Chuyển sang quy trình phê duyệt hai cấp (F-035)

## Out of Scope
- Chỉnh sửa Vùng nước sau khi tạo (thuộc F-033)
- Xóa Vùng nước (thuộc F-034)
- Phê duyệt Vùng nước hai cấp (thuộc F-035)
- Xem chi tiết Vùng nước (thuộc F-036)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên Cảng | Tạo mới, Chỉnh sửa (khi chờ phê duyệt) |
| Trưởng phòng QL Cảng | Xem, Phê duyệt cấp 1 |
| Quản trị viên | Tạo mới, Chỉnh sửa, Xóa |

## Entities
- **VungNuoc**: id, ma, ten, viTri, toDo, dienTich, doSau, dieuKienHaiVan, khaNangThongHanh, loaiVungNuoc, trangThai, ghiChu, createdAt, updatedAt
- **GiayTo**: id, vungNuocId, tenGiayTo, loaiTaiLieu, duongDan, nguoiTanRieng, ngayCapNhat

## Business Rules
1. Mã Vùng nước phải là duy nhất trên toàn hệ thống
2. Tên Vùng nước không được trùng với Vùng nước đã tồn tại
3. Vùng nước mới luôn ở trạng thái "chờ phê duyệt" khi được tạo
4. Các trường: mã, tên, vị trí, diện tích và loại vùng nước là bắt buộc khi tạo mới
5. Chỉ Vùng nước ở trạng thái "chờ phê duyệt" hoặc "bị từ chối" mới được chỉnh sửa

## Testing Strategy
Kiểm thử form tạo mới với đầy đủ dữ liệu hợp lệ và không hợp lệ, kiểm thử sinh mã tự động, kiểm thử lưu dữ liệu ở trạng thái "chờ phê duyệt", kiểm thử đính kèm giấy tờ, kiểm thử xác thực quyền tạo mới, kiểm thử trùng mã và trùng tên, kiểm thử gửi yêu cầu phê duyệt hai cấp.
