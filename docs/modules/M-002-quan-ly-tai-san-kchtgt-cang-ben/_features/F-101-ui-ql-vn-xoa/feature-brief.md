---
id: F-101
name: "Xóa Vùng nước"
slug: ui-ql-vn-xoa
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:09:14Z"
last-updated: "2026-07-01T04:09:14Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xóa Vùng nước

## Description

Tính năng Xóa Vùng nước cho phép người dùng có quyền xóa (LeDuan hoặc QuanTriCangBien) loại bỏ một vùng nước khỏi hệ thống bằng cơ chế soft-delete. Hành động xóa được khởi động từ trang Danh sách Vùng nước (F-088) qua nút "Xóa" hoặc từ trang Chi tiết (F-089) khi vùng nước được chọn. Khi người dùng click nút "Xóa", hệ thống hiển thị hộp thoại xác nhận (confirmation dialog) với tiêu đề "Xác nhận xóa vùng nước {tenVungNuoc}", mô tả "Bạn có chắc chắn muốn xóa vùng nước này? Hành động này không thể hoàn tác.", cùng hai nút "Hủy" và "Xác nhận xóa". Sau khi người dùng click "Xác nhận xóa", hệ thống gọi API `DELETE /api/v1/vung-nuoc/{id}`. Backend thực hiện soft-delete bằng cách đặt giá trị `deletedAt` = current timestamp cho bản ghi VungNuoc, không xóa vật lý khỏi database. Vì VungNuoc là leaf entity (không có child), hệ thống không cần kiểm tra sự hiện diện của con trước khi xóa. Sau khi xóa thành công, danh sách tự động refresh và toast "Xóa thành công" được hiển thị.

## Business Intent

Cho phép người dùng có thẩm quyền loại bỏ các vùng nước không còn phù hợp hoặc đã lỗi thời khỏi danh sách hoạt động, đảm bảo dữ liệu luôn sạch và chính xác mà vẫn giữ lại lịch sử truy xuất thông qua cơ chế soft-delete.

## Flow Summary

Người dùng click nút "Xóa" trên trang Danh sách Vùng nước (F-088) hoặc trang Chi tiết (F-089). Hộp thoại xác nhận xuất hiện với thông tin vùng nước sẽ bị xóa và cảnh báo "hành động không thể hoàn tác". Người dùng click "Hủy" để đóng hộp thoại mà không thực hiện hành động, hoặc click "Xác nhận xóa" để xác nhận. Hệ thống gọi API `DELETE /api/v1/vung-nuoc/{id}` — nếu thành công, bản ghi VungNuoc được set `deletedAt` = current timestamp (soft-delete), không cần kiểm tra child (leaf entity). Hệ thống hiển thị toast "Xóa thành công", tự động refresh danh sách (trang hiện tại) và vùng nước bị xóa biến mất khỏi bảng. Nếu xóa thất bại (ví dụ: vùng nước đã bị xóa trước đó, hoặc có lỗi hệ thống), toast lỗi hiển thị và danh sách không thay đổi.

## Acceptance Criteria

1. Nút "Xóa" chỉ hiển thị cho người dùng có quyền xóa (`@auth.check(authentication, 'vungnuoc:delete')`) — tức LeDuan hoặc QuanTriCangBien.
2. Khi click nút "Xóa", hộp thoại xác nhận xuất hiện với tiêu đề "Xác nhận xóa vùng nước {tenVungNuoc}" và nút "Hủy" + "Xác nhận xóa".
3. Click "Hủy" trong hộp thoại đóng hộp thoại mà không thực hiện bất kỳ hành động nào.
4. Sau khi click "Xác nhận xóa", hệ thống gọi `DELETE /api/v1/vung-nuoc/{id}` — sau khi thành công, bản ghi được set `deletedAt` = current timestamp (soft-delete).
5. Hệ thống không kiểm tra sự hiện diện của child trước khi xóa — VungNuoc là leaf entity, không có child guard.
6. Sau khi xóa thành công, danh sách tự động refresh và vùng nước bị xóa biến mất khỏi bảng; toast "Xóa thành công" được hiển thị.
7. Nếu xóa thất bại (lỗi server, vùng nước đã bị xóa trước đó), toast lỗi hiển thị và danh sách không thay đổi.

## In Scope

- Nút "Xóa" trên trang Danh sách (F-088) và trang Chi tiết (F-089)
- Hộp thoại xác nhận xóa với thông tin vùng nước và cảnh báo
- API DELETE /api/v1/vung-nuoc/{id}
- Soft-delete: đặt deletedAt = current timestamp
- Không kiểm tra child (leaf entity)
- Toast thông báo thành công/lỗi
- Tự động refresh danh sách sau khi xóa
- RBAC chặn người dùng không có quyền delete

## Out of Scope

- Hard-delete (xóa vật lý khỏi database)
- Batch xóa nhiều vùng nước cùng lúc
- Undo/hoàn tác hành động xóa
- Xem lịch sử xóa (thuộc F-102)
- Xóa vùng nước đã có child (không áp dụng vì VungNuoc là leaf)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| QuanTriCangBien (Quản lý cảng biển) | Delete + Read | Có quyền xóa tất cả vùng nước của cảng |
| LeDuan (Lãnh đạo) | Delete + Read + Approve | Có quyền xóa và phê duyệt tất cả vùng nước |
| NhanVienCangBien (Nhân viên cảng) | Read + Write | Không có quyền xóa vùng nước |
| QuanTramMien (Quan tra miền) | Read only | Không có quyền xóa vùng nước |

## Entities

| Entity | Fields |
|---|---|
| VungNuoc | id (UUID), maVungNuoc (string, unique, length≤50), tenVungNuoc (string, length≤255), cangBienId (UUID, parent), dienTich (BigDecimal, precision 15 scale 2), doSauMax (BigDecimal, precision 10 scale 2), doSauTrungBinh (BigDecimal, precision 10 scale 2), loaiVungNuoc (string, length≤100), trangThaiHoatDong (string, length≤50), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt (LocalDateTime), updatedAt (LocalDateTime), deletedAt (nullable) |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-01 | Xóa sử dụng soft-delete — đặt `deletedAt` = current timestamp, không xóa vật lý khỏi database | DELETE | Soft-delete pattern |
| BR-02 | Không kiểm tra sự hiện diện của child — VungNuoc là leaf entity, không có child guard | DELETE | Soft-delete pattern |
| BR-03 | Chỉ người dùng có quyền delete (`@auth.check(authentication, 'vungnuoc:delete')`) mới thực hiện được hành động xóa | DELETE, Display | RBAC |
| BR-04 | Vùng nước đã bị xóa (deletedAt != null) không hiển thị trong danh sách mặc định và không cho phép xóa lại | DELETE, List | Soft-delete pattern |

## Testing Strategy

Kiểm thử đơn vị (unit test) xác nhận backend: API DELETE /api/v1/vung-nuoc/{id} đặt deletedAt = current timestamp (soft-delete), không xóa record khỏi DB, không kiểm tra child guard (leaf entity). Kiểm thử tích hợp xác nhận vùng nước đã soft-delete không xuất hiện trong danh sách (F-088: `findAllActive` chỉ trả về `deletedAt IS NULL`), và không cho phép xóa lại một vùng nước đã bị xóa. Kiểm thử E2E/UI sử dụng browser automation để verify: nút "Xóa" chỉ hiển thị cho người dùng có quyền delete, hộp thoại xác nhận xuất hiện đúng với thông tin vùng nước và nút Hủy/Xác nhận xóa, click "Hủy" không thực hiện hành động, click "Xác nhận xóa" gọi DELETE API đúng ID, toast "Xóa thành công" xuất hiện, danh sách tự động refresh và vùng nước biến mất, và toast lỗi xuất hiện nếu xóa thất bại.
