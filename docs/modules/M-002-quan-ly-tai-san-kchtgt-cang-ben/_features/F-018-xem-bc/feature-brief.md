---
id: F-018
name: "Xem chi tiết Bến cảng"
slug: xem-bc
module-id: M-002
status: proposed
classification: local
priority: critical
created: "2026-06-16T04:40:42Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Xem chi tiết Bến cảng

## Description

Tính năng cho phép người dùng xem thông tin chi tiết của một Bến cảng bao gồm các trường dữ liệu kỹ thuật chuyên biệt (kích thước, loại bến, độ sâu luồng), vị trí trên bản đồ, trạng thái hiện tại, thông tin người tạo và người cập nhật cuối, hỗ trợ tìm kiếm và lọc theo mã bến, tên bến, cảng mẹ và loại bến.

## Business Intent

Việc cung cấp thông tin chi tiết về Bến cảng giúp các bên liên quan — từ cán bộ quản lý cảng đến nhà điều hành tàu — có thể tra cứu nhanh chóng, chính xác các thông tin kỹ thuật phục vụ công tác phân bổ lượt tàu, lập kế hoạch tiếp cận bến và đánh giá năng lực phục vụ của từng bến cảng trong hệ thống hạ tầng giao thông đường thủy.

## Flow Summary

Người dùng đăng nhập vào hệ thống, truy cập vào mục quản lý Bến cảng và sử dụng thanh tìm kiếm để tra cứu theo mã bến, tên bến, cảng mẹ hoặc loại bến. Hệ thống hiển thị danh sách kết quả tra cứu kèm thông tin tóm tắt (mã bến, tên, cảng mẹ, loại bến, trạng thái). Người dùng click vào một Bến cảng trong danh sách để xem trang chi tiết. Trang chi tiết hiển thị đầy đủ các trường thông tin kỹ thuật: mã bến, tên, cảng mẹ (với link đến trang chi tiết cảng), kích thước chiều dài/rộng, loại bến, độ sâu luồng trước bến, tọa độ GPS trên bản đồ, trạng thái, người tạo và người cập nhật cuối cùng.

## Acceptance Criteria

1. Người dùng có quyền "Xem" có thể tra cứu Bến cảng theo mã bến, tên bến, cảng mẹ hoặc loại bến với kết quả trả về trong vòng 3 giây.
2. Trang chi tiết hiển thị đầy đủ tất cả các trường thông tin kỹ thuật của Bến cảng, bao gồm tọa độ GPS được hiển thị trên bản đồ tích hợp.
3. Các trường thông tin nhạy cảm hoặc không liên quan đến vai trò người dùng được ẩn theo cơ chế phân quyền.
4. Danh sách tra cứu hiển thị tối đa 50 kết quả mỗi trang, có phân trang và sắp xếp theo tên hoặc thời gian tạo.

## In Scope

- Thanh tìm kiếm với bộ lọc theo mã bến, tên bến, cảng mẹ, loại bến, trạng thái
- Bảng danh sách kết quả với phân trang và sắp xếp
- Trang chi tiết Bến cảng hiển thị đầy đủ thông tin kỹ thuật
- Tích hợp bản đồ hiển thị tọa độ GPS
- Hiển thị thông tin người tạo và người cập nhật cuối
- Link đến trang chi tiết Cảng mẹ (liên kết chéo)
- Điều hướng đến các chức năng cập nhật/xóa (nếu có quyền)

## Out of Scope

- Tạo mới Bến cảng (thuộc F-014)
- Cập nhật Bến cảng (thuộc F-015)
- Xóa Bến cảng (thuộc F-016)
- Xuất dữ liệu Bến cảng ra file Excel/PDF
- Lịch sử thay đổi chi tiết của Bến cảng (thuộc F-019)
- Phê duyệt Bến cảng (thuộc F-017)

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Quản trị viên | Xem đầy đủ |
| Quản lý cảng | Xem đầy đủ |
| Nhân viên vận hành | Xem (một số trường kỹ thuật bị ẩn) |
| KháchExternal | Không có quyền truy cập |

## Entities

- **BenCang**: id (UUID), maBen (string, unique), tenBen (string), cangMeId (UUID, FK → CangBien), tuyensDuongThuy (string), toDo (JSON: {lat, lng}), chieuDaiBen (decimal, m), chieuRongBen (decimal, m), loaiBen (enum: hang_containers, hang_kho, dau_khi, dich_vu), doSauLuongTruocBen (decimal, m), trangThai (enum: cho_phe_duyet, hien_hanh, tam_ngung, da_xoa), ghiChu (text), createdAt (timestamp), updatedAt (timestamp), createdBy (UUID), updatedBy (UUID, nullable)

## Business Rules

1. Tọa độ GPS của Bến cảng được hiển thị trên bản đồ tích hợp với mức zoom phù hợp để xác định vị trí chính xác trong phạm vi Cảng mẹ.
2. Chỉ Bến cảng có trạng thái "Hi hiện hành" hoặc "Tạm ngừng" được hiển thị trong kết quả tìm kiếm mặc định; Bến "Chờ phê duyệt" và "Đã xóa" chỉ hiển thị khi người dùng bật tùy chọn xem tất cả.
3. Phân quyền hiển thị: Nhân viên vận hành chỉ xem được các trường cơ bản (mã, tên, cảng mẹ, loại bến, trạng thái); các trường kỹ thuật chi tiết (kích thước, độ sâu) chỉ hiển thị cho vai trò Quản lý cảng trở lên.
4. Kết quả tìm kiếm được cập nhật thời gian thực với độ trễ không quá 500ms.

## Testing Strategy

Kiểm thử đơn vị cho các hàm tra cứu và lọc; kiểm thử tích hợp cho API trả về danh sách và chi tiết Bến cảng; kiểm thử giao diện cho thanh tìm kiếm, bảng phân trang, trang chi tiết và bản đồ tích hợp; kiểm thử phân quyền cho các vai trò khác nhau để xác nhận trường nào được hiển thị; kiểm thử hiệu năng với 1000 Bến cảng để đảm bảo thời gian tra cứu dưới 3 giây; kiểm thử liên kết chéo đến trang chi tiết Cảng mẹ.
