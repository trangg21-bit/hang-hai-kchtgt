---
id: F-095
name: "Xóa Bến cảng"
slug: ui-ql-bc-xoa
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:09:07Z"
last-updated: "2026-07-01T04:09:07Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xóa Bến cảng

## Description

Tính năng "Xóa Bến cảng" (F-095) cung cấp giao diện cho phép người dùng có quyền Leader/Admin xóa mềm (soft-delete) một Bến cảng khỏi hệ thống quản lý tài sản. Thao tác xóa được thực hiện thông qua nút "Xóa" trên màn hình danh sách (F-073) hoặc màn hình chi tiết (F-074). Trước khi xóa, hệ thống mở hộp thoại xác nhận (confirmation dialog) với thông báo "Bạn có chắc chắn muốn xóa Bến cảng [maBen]?" và hiển thị cảnh báo về hậu quả của việc xóa mềm. Hệ thống tự động pre-check số lượng con cháu (CauCang và VungNuoc) liên kết với Bến cảng này: nếu tồn tại bất kỳ CauCang hoặc VungNuoc nào chưa bị xóa (deletedAt = NULL), hệ thống sẽ trả về HTTP 409 Conflict và hiển thị thông báo "Không thể xóa Bến cảng vì còn [n] Cầu cảng và [m] vùng nước liên kết" — ngăn chặn việc xóa để đảm bảo toàn vẹn tham chiếu. Nếu không có con cháu, hệ thống gọi `DELETE /api/v1/ben-cang/:id` → backend đặt giá trị deletedAt = datetime → bản ghi không còn xuất hiện trong danh sách hoạt động → hiển thị toast "Đã xóa Bến cảng [maBen]" → danh sách/chi tiết được refresh. Xóa mềm được áp dụng để bảo toàn dữ liệu lịch sử (không xóa vĩnh viễn) và hỗ trợ truy xuất lại nếu cần. Chỉ các Role có quyền `bencang:delete` (QuanTriCangBien, QuanLyDonVi — đơn vị mình) mới nhìn thấy nút "Xóa".

## Business Intent

Cho phép người dùng có thẩm quyền xóa Bến cảng khỏi danh sách hoạt động khi không còn nhu cầu sử dụng, đồng thời đảm bảo toàn vẹn dữ liệu bằng cách ngăn xóa mềm nếu còn con cháu (CauCang, VungNuoc) liên kết, sử dụng cơ chế soft-delete để giữ lại dữ liệu lịch sử cho mục đích kiểm toán và追溯 nguồn gốc, giới hạn quyền xóa cho các Role có thẩm quyền cao.

## Flow Summary

Người dùng click nút "Xóa" trên màn hình danh sách (F-073) hoặc màn hình chi tiết (F-074) của một Bến cảng → hệ thống mở hộp thoại xác nhận xóa mềm với thông báo "Bạn có chắc chắn muốn xóa Bến cảng [maBen]?" và cảnh báo "Dữ liệu sẽ được ẩn khỏi danh sách hoạt động nhưng vẫn được lưu trong lịch sử". Hệ thống gọi API `GET /api/v1/ben-cang/:id/children` để pre-check số lượng CauCang và VungNuoc chưa bị xóa (deletedAt = NULL). Nếu số lượng > 0: hiển thị toast lỗi "Không thể xóa Bến cảng vì còn [n] Cầu cảng và [m] vùng nước liên kết" → dừng thao tác. Nếu số lượng = 0: người dùng xác nhận trong hộp thoại → hệ thống gọi `DELETE /api/v1/ben-cang/:id` → backend đặt deletedAt = datetime → toast "Đã xóa Bến cảng [maBen]" → danh sách/chi tiết được refresh → bản ghi biến mất khỏi danh sách hoạt động. Nếu API trả lỗi khác (403 Forbidden, 500 Server Error), hệ thống hiển thị toast lỗi tương ứng.

## Acceptance Criteria

1. Nút "Xóa" chỉ hiển thị cho các Role có quyền `bencang:delete` (QuanTriCangBien, QuanLyDonVi — đơn vị mình).
2. Khi click nút "Xóa", hệ thống mở hộp thoại xác nhận với thông báo "Bạn có chắc chắn muốn xóa Bến cảng [maBen]?" và cảnh báo "Dữ liệu sẽ được ẩn khỏi danh sách hoạt động nhưng vẫn được lưu trong lịch sử".
3. Trước khi xóa, hệ thống tự động pre-check số lượng con cháu (CauCang và VungNuoc) có deletedAt = NULL liên kết với BenCang.
4. Nếu tồn tại con cháu (CauCang hoặc VungNuoc): hệ thống trả về HTTP 409 Conflict và hiển thị toast "Không thể xóa Bến cảng vì còn [n] Cầu cảng và [m] vùng nước liên kết" — không thực hiện xóa.
5. Nếu không có con cháu: người dùng xác nhận trong hộp thoại → hệ thống gọi `DELETE /api/v1/ben-cang/:id` → backend đặt deletedAt = datetime → toast "Đã xóa Bến cảng [maBen]" → danh sách/chi tiết được refresh.
6. Bản ghi sau khi xóa mềm (deletedAt != NULL) không còn xuất hiện trong danh sách hoạt động (F-073) hoặc chi tiết (F-074).
7. Toast thông báo lỗi "Không thể thực hiện thao tác: [error message]" được hiển thị khi API trả về HTTP 403 Forbidden, 404 Not Found, hoặc 500 Server Error.
8. Nút "Hủy" trong hộp thoại xác nhận đóng hộp thoại mà không thực hiện thao tác xóa.
9. Người dùng không có quyền `bencang:delete` không nhìn thấy nút "Xóa" trên danh sách hoặc chi tiết.

## In Scope

- Nút "Xóa" hiển thị theo RBAC (chỉ role có quyền `bencang:delete`).
- Hộp thoại xác nhận xóa mềm với thông báo và cảnh báo rõ ràng.
- Pre-check số lượng con cháu (CauCang, VungNuoc) trước khi xóa.
- HTTP 409 Conflict nếu tồn tại con cháu → toast thông báo số lượng con cháu.
- DELETE /api/v1/ben-cang/:id → đặt deletedAt = datetime (soft-delete).
- Soft-delete: bản ghi không xuất hiện trong danh sách/chi tiết hoạt động.
- Toast success/error sau khi thực hiện thao tác.
- Refresh danh sách/chi tiết sau khi xóa thành công.
- Nút "Hủy" trong hộp thoại xác nhận.

## Out of Scope

- Tạo mới Bến cảng (thuộc F-075).
- Chỉnh sửa Bến cảng (thuộc F-076).
- Xem chi tiết Bến cảng (thuộc F-074).
- Phê duyệt / Từ chối Bến cảng (thuộc F-077).
- Xem lịch sử thay đổi chi tiết (thuộc F-096).
- Xóa vĩnh viễn (hard-delete) — chỉ hỗ trợ soft-delete.
- Xóa nhiều Bến cảng cùng lúc (bulk delete).
- Khôi phục Bến cảng đã xóa (restore).
- Export danh sách Bến cảng đã xóa.
- Xóa Bến cảng của đơn vị khác (chỉ đơn vị mình).

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| QuanTriCangBien | Delete | Được phép xóa mềm tất cả Bến cảng trong toàn bộ hệ thống. Quyền `bencang:delete`. |
| QuanLyDonVi | Delete | Được xóa mềm Bến cảng thuộc đơn vị mình; không có quyền xóa Bến cảng của đơn vị khác. |
| NhanVien | No access | Không có quyền xóa Bến cảng. Chỉ được xem danh sách và chi tiết. |
| ThanhVienPheDuyet | No access | Không có quyền xóa; chỉ có quyền xem và phê duyệt/từ chối. |

## Entities

| Entity | Fields |
|---|---|
| BenCang | id (UUID), maBen (string, unique, length≤50), tenBen (string, length≤255), cangBienId (UUID, parent ref), tuyenDuongThuy (string, length≤255), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), chieuDai (BigDecimal, precision 15 scale 2), chieuRong (BigDecimal, precision 15 scale 2), loaiBen (string, length≤100), doSauLuong (BigDecimal, precision 10 scale 2), trangThaiHoatDong (string, length≤50), trangThaiPheDuyet (string, length≤50: CHO_PHE_DUYET/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt (LocalDateTime), updatedAt (LocalDateTime), deletedAt (LocalDateTime, nullable — set khi soft-delete) |
| CauCang (child) | id (UUID), benCangId (UUID FK → BenCang), ten (string), trangThaiHoatDong (string), deletedAt (LocalDateTime, nullable) — pre-check count trước khi xóa BenCang |
| VungNuoc (child) | id (UUID), benCangId (UUID FK → BenCang), ten (string), trangThaiHoatDong (string), deletedAt (LocalDateTime, nullable) — pre-check count trước khi xóa BenCang |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-095-01 | Chỉ có thể xóa mềm Bến cảng không có con cháu (CauCang và VungNuoc) có deletedAt = NULL. Nếu tồn tại con cháu → HTTP 409 Conflict. | Delete | F-016 backend |
| BR-095-02 | Xóa mềm đặt giá trị deletedAt = datetime; bản ghi không xuất hiện trong danh sách hoạt động nhưng vẫn được lưu trữ để truy xuất lịch sử. | Soft-delete | F-016 backend |
| BR-095-03 | Chỉ người dùng có quyền `bencang:delete` mới có thể thực hiện thao tác xóa; UI ẩn nút "Xóa" cho các Role khác. | RBAC | Auth |

## Testing Strategy

Kiểm thử chấp nhận tập trung vào các kịch bản: (1) nút "Xóa" chỉ hiển thị cho Role có quyền `bencang:delete` (QuanTriCangBien, QuanLyDonVi); (2) click nút "Xóa" mở hộp thoại xác nhận với thông báo "Bạn có chắc chắn muốn xóa Bến cảng [maBen]?" và cảnh báo về hậu quả; (3) pre-check số lượng con cháu: nếu CauCang/VungNuoc > 0 → HTTP 409 → toast "Không thể xóa vì còn [n] Cầu cảng và [m] vùng nước liên kết"; (4) nếu không có con cháu → xác nhận trong hộp thoại → `DELETE /api/v1/ben-cang/:id` → deletedAt được đặt → toast "Đã xóa" → bản ghi biến mất khỏi danh sách; (5) bản ghi đã xóa mềm không còn xuất hiện trong danh sách (F-073) hoặc chi tiết (F-074); (6) API trả lỗi 403 Forbidden → toast "Không có quyền thực hiện thao tác"; (7) nút "Hủy" trong hộp thoại đóng mà không thực hiện xóa; (8) kiểm thử trên các trường hợp edge: BenCang không tồn tại (404), BenCang đã bị xóa mềm trước đó (đã có deletedAt).
