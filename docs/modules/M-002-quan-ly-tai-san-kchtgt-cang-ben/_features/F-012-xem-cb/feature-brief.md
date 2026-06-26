---
id: F-012
name: "Xem chi tiết Cảng biển"
slug: xem-cb
module-id: M-002
status: proposed
classification: local
priority: critical
created: "2026-06-16T04:40:19Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Xem chi tiết Cảng biển

## Description

Tính năng cho phép người dùng xem thông tin chi tiết của một Cảng biển bao gồm các trường dữ liệu cơ bản, vị trí trên bản đồ, trạng thái hiện tại, thông tin người tạo và người cập nhật cuối, hỗ trợ tìm kiếm và lọc theo mã cảng, tên cảng, tỉnh/thành phố, và trạng thái hoạt động.

## Business Intent

Việc cung cấp thông tin chi tiết về Cảng biển giúp các bên liên quan — từ cán bộ quản lý đến đối tác logistics — có thể tra cứu nhanh chóng, chính xác và đầy đủ các thông tin kỹ thuật, pháp lý về cảng, phục vụ cho công tác điều phối vận tải biển, lập kế hoạch logistics và báo cáo quản lý nhà nước.

## Flow Summary

Người dùng đăng nhập vào hệ thống, truy cập vào mục quản lý Cảng biển và sử dụng thanh tìm kiếm để tra cứu theo mã cảng, tên cảng, hoặc tỉnh/thành phố. Hệ thống hiển thị danh sách kết quả tra cứu kèm thông tin tóm tắt (mã cảng, tên cảng, tỉnh, trạng thái). Người dùng click vào một Cảng biển trong danh sách để xem trang chi tiết. Trang chi tiết hiển thị đầy đủ các trường thông tin: mã cảng, tên, vị trí địa lý với bản đồ, diện tích, khả năng tiếp nhận tàu, trạng thái, người tạo, người cập nhật cuối cùng. Người dùng có thể quay lại danh sách hoặc chuyển sang các chức năng khác (cập nhật, xóa) nếu có quyền.

## Acceptance Criteria

1. Người dùng có quyền "Xem" có thể tra cứu Cảng biển theo mã cảng, tên cảng, hoặc tỉnh/thành phố với kết quả trả về trong vòng 3 giây.
2. Trang chi tiết hiển thị đầy đủ tất cả các trường thông tin của Cảng biển, bao gồm tọa độ GPS được hiển thị trên bản đồ tích hợp.
3. Các trường thông tin nhạy cảm hoặc không liên quan đến vai trò người dùng được ẩn hoặc không hiển thị theo cơ chế phân quyền.
4. Danh sách tra cứu hiển thị tối đa 50 kết quả mỗi trang, có phân trang và sắp xếp theo tên hoặc thời gian tạo.

## In Scope

- Thanh tìm kiếm với bộ lọc theo mã cảng, tên cảng, tỉnh/thành, trạng thái
- Bảng danh sách kết quả với phân trang và sắp xếp
- Trang chi tiết Cảng biển hiển thị đầy đủ thông tin
- Tích hợp bản đồ hiển thị tọa độ GPS
- Hiển thị thông tin người tạo và người cập nhật cuối
- Điều hướng đến các chức năng cập nhật/xóa (nếu có quyền)

## Out of Scope

- Tạo mới Cảng biển (thuộc F-008)
- Cập nhật Cảng biển (thuộc F-009)
- Xóa Cảng biển (thuộc F-010)
- Xuất dữ liệu Cảng biển ra file Excel/PDF
- Lịch sử thay đổi chi tiết của Cảng biển (thuộc F-013)
- Phê duyệt Cảng biển (thuộc F-011)

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Quản trị viên | Xem đầy đủ |
| Quản lý cảng | Xem đầy đủ |
| Nhân viên vận hành | Xem (một số trường bị ẩn) |
| KháchExternal | Không có quyền truy cập |

## Entities

- **CangBien**: id (UUID), maCang (string, unique), tenCang (string), tinhThanh (string), toDo (JSON: {lat, lng}), dienTich (decimal), khaNangTiepNhanTau (string), trangThai (enum: cho_phe_duyet, hien_hanh, tam_ngung, da_xoa), ghiChu (text), createdAt (timestamp), updatedAt (timestamp), createdBy (UUID), updatedBy (UUID, nullable)

## Business Rules

1. Tọa độ GPS của Cảng biển được hiển thị trên bản đồ tích hợp với mức zoom phù hợp để xác định vị trí chính xác.
2. Chỉ Cảng biển có trạng thái "Hiện hành" hoặc "Tạm ngừng" được hiển thị trong kết quả tìm kiếm mặc định; Cảng "Chờ phê duyệt" và "Đã xóa" chỉ hiển thị khi người dùng bật tùy chọn xem tất cả.
3. Phân quyền hiển thị: Nhân viên vận hành chỉ xem được các trường cơ bản (mã, tên, tỉnh, trạng thái); các trường kỹ thuật mở rộng chỉ hiển thị cho vai trò Quản lý cảng trở lên.
4. Kết quả tìm kiếm được cập nhật thời gian thực (live search) với độ trễ không quá 500ms.

## Testing Strategy

Kiểm thử đơn vị cho các hàm tra cứu và lọc; kiểm thử tích hợp cho API trả về danh sách và chi tiết Cảng biển; kiểm thử giao diện cho thanh tìm kiếm, bảng phân trang, trang chi tiết và bản đồ tích hợp; kiểm thử phân quyền cho các vai trò khác nhau để xác nhận trường nào được hiển thị; kiểm thử hiệu năng với 1000 Cảng biển để đảm bảo thời gian tra cứu dưới 3 giây.
