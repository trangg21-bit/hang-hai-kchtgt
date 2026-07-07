---
id: F-119
name: "Phê duyệt Bến cảng"
slug: ui-phe-duyet-bc
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:24Z"
last-updated: "2026-07-01T04:08:24Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phê duyệt Bến cảng

## Description

Tính năng "Phê duyệt Bến cảng" (F-119) cung cấp giao diện dành riêng cho người dùng có quyền Leader để xem, phê duyệt hoặc từ chối các Bến cảng đang trong trạng thái chờ phê duyệt (trangThaiPheDuyet = CHO_PHE_DUYET). Màn hình hiển thị danh sách các Bến cảng cần phê duyệt với các thông tin chính: maBen, tenBen, loại bến (loaiBen), ngày tạo, người tạo, và các trường kỹ thuật quan trọng (cangBienId, viDo/kinhDo, chieuDai, chieuRong). Mỗi bản ghi trong danh sách có 2 nút hành động: "Phê duyệt" (chuyển trạng thái thành DUOC_PHE_DUYET) và "Từ chối" (chuyển trạng thái thành TU_CHO). Khi người dùng click "Phê duyệt", hệ thống mở hộp thoại xác nhận "Bạn có chắc chắn muốn phê duyệt Bến cảng [maBen]?" → sau khi xác nhận gọi API `POST /api/v1/ben-cang/:id/approve` → backend cập nhật trạng thái thành DUOC_PHE_DUYET và tạo bản ghi PheDuyetLog → hiển thị toast "Đã phê duyệt Bến cảng" → bản ghi bị xóa khỏi danh sách chờ phê duyệt. Khi người dùng click "Từ chối", hệ thống mở hộp thoại yêu cầu lý do từ chối (ít nhất 10 ký tự) → xác nhận → gọi API `POST /api/v1/ben-cang/:id/reject` với lý do → backend cập nhật trạng thái thành TU_CHO và tạo bản ghi PheDuyetLog → hiển thị toast "Đã từ chối Bến cảng: [lý do]" → bản ghi bị xóa khỏi danh sách chờ phê duyệt. Giao diện chỉ hiển thị cho các Role có quyền `bencang:approve` (QuanTriCangBien, QuanLyDonVi, ThanhVienPheDuyet).

## Business Intent

Đảm bảo mọi thông tin Bến cảng mới tạo hoặc thay đổi đều được xem xét và phê duyệt bởi người có thẩm quyền trước khi chính thức đưa vào vận hành, tạo lập cơ chế kiểm soát chất lượng dữ liệu, phân quyền phê duyệt theo đơn vị, và lưu trữ bằng chứng phê duyệt/từ chối trong bảng PheDuyetLog để phục vụ kiểm toán và追溯 nguồn gốc.

## Flow Summary

Người dùng có quyền Leader truy cập màn hình "Phê duyệt Bến cảng" (F-119) → hệ thống gọi `GET /api/v1/ben-cang?status=CHO_PHE_DUYET` để lấy danh sách các Bến cảng cần phê duyệt (được lọc theo đơn vị của người dùng) → hiển thị bảng danh sách với các cột maBen, tenBen, loaiBen, trangThaiHoatDong, createdAt, updatedBy. Mỗi hàng có 2 nút: "Phê duyệt" và "Từ chối". Người dùng nhấn "Phê duyệt" → hệ thống mở hộp thoại xác nhận → người dùng xác nhận → gọi `POST /:id/approve` → backend cập nhật trạng thái thành DUOC_PHE_DUYET + tạo PheDuyetLog → toast "Đã phê duyệt" → bản ghi bị xóa khỏi danh sách. Người dùng nhấn "Từ chối" → hệ thống mở hộp thoại yêu cầu lý do (≥10 ký tự) → xác nhận → gọi `POST /:id/reject` với lý do → backend cập nhật trạng thái thành TU_CHO + tạo PheDuyetLog → toast "Đã từ chối: [lý do]" → bản ghi bị xóa khỏi danh sách. Người dùng có thể dùng tìm kiếm/lọc để nhanh chóng tìm Bến cảng cần phê duyệt.

## Acceptance Criteria

1. Màn hình chỉ hiển thị các Bến cảng có trangThaiPheDuyet = CHO_PHE_DUYET khi gọi `GET /api/v1/ben-cang?status=CHO_PHE_DUYET`.
2. Danh sách hiển thị các cột: maBen, tenBen, loaiBen, trangThaiHoatDong, createdAt, updatedBy (người tạo).
3. Nút "Phê duyệt" và "Từ chối" chỉ hiển thị cho các Role có quyền `bencang:approve` (QuanTriCangBien, QuanLyDonVi, ThanhVienPheDuyet).
4. Khi nhấn "Phê duyệt", hệ thống mở hộp thoại xác nhận với thông báo "Bạn có chắc chắn muốn phê duyệt Bến cảng [maBen]?"; sau khi xác nhận gọi `POST /api/v1/ben-cang/:id/approve` → trạng thái chuyển thành DUOC_PHE_DUYET + tạo PheDuyetLog → toast "Đã phê duyệt Bến cảng" → bản ghi bị xóa khỏi danh sách.
5. Khi nhấn "Từ chối", hệ thống mở hộp thoại yêu cầu lý do (ít nhất 10 ký tự); sau khi xác nhận gọi `POST /api/v1/ben-cang/:id/reject` với lý do → trạng thái chuyển thành TU_CHO + tạo PheDuyetLog → toast "Đã từ chối Bến cảng: [lý do]" → bản ghi bị xóa khỏi danh sách.
6. Lý do từ chối có tối thiểu 10 ký tự; nếu nhập < 10 ký tự, hệ thống chặn submit và hiển thị lỗi "Lý do từ chối phải có ít nhất 10 ký tự".
7. PheDuyetLog được tạo tự động khi phê duyệt hoặc từ chối, lưu trữ: benCangId, pheDuyetAction (APPROVE/REJECT), pheDuyetBy, pheDuyetAt, lyDo (cho REJECT).
8. Sau khi phê duyệt hoặc từ chối thành công, bản ghi bị xóa khỏi danh sách chờ phê duyệt và không thể thao tác lại.
9. Toast thông báo lỗi "Không thể thực hiện thao tác: [error message]" được hiển thị khi API trả về HTTP 4xx/5xx.
10. Người dùng không có quyền `bencang:approve` không nhìn thấy các nút Phê duyệt/Từ chối và không thể truy cập màn hình này.

## In Scope

- Danh sách Bến cảng có trạng thái CHO_PHE_DUYET (lọc theo đơn vị người dùng).
- Các cột: maBen, tenBen, loaiBen, trangThaiHoatDong, createdAt, updatedBy.
- Nút "Phê duyệt" (→ DUOC_PHE_DUYET) với hộp thoại xác nhận.
- Nút "Từ chối" (→ TU_CHO) với hộp thoại yêu cầu lý do (≥10 ký tự).
- Backend tự động tạo PheDuyetLog khi phê duyệt hoặc từ chối.
- Toast success/error sau khi thực hiện thao tác.
- Bản ghi bị xóa khỏi danh sách sau khi phê duyệt/từ chối thành công.
- RBAC: chỉ hiển thị cho Role có quyền `bencang:approve`.
- Tìm kiếm và lọc trong danh sách chờ phê duyệt.

## Out of Scope

- Tạo mới Bến cảng (thuộc F-117).
- Chỉnh sửa Bến cảng (thuộc F-118).
- Xóa Bến cảng (thuộc F-120).
- Xem lịch sử thay đổi chi tiết (thuộc F-121).
- Xem chi tiết đầy đủ Bến cảng (thuộc F-116).
- Phê duyệt/từ chối nhiều Bến cảng cùng lúc (bulk approve/reject).
- Xuất danh sách chờ phê duyệt ra Excel/PDF.
- Phê duyệt/từ chối Bến cảng của đơn vị khác (chỉ đơn vị mình).
- Gửi thông báo email/SMS khi phê duyệt/từ chối.
- Thu hồi phê duyệt đã thực hiện.

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| QuanTriCangBien | Approve | Được phê duyệt/từ chối tất cả Bến cảng trong toàn bộ hệ thống. Quyền `bencang:approve`. |
| QuanLyDonVi | Approve | Được phê duyệt/từ chối Bến cảng thuộc đơn vị mình; không có quyền phê duyệt Bến cảng của đơn vị khác. |
| NhanVien | No access | Không có quyền phê duyệt hoặc từ chối Bến cảng. Chỉ được xem danh sách và chi tiết. |
| ThanhVienPheDuyet | Approve | Được phê duyệt/từ chối Bến cảng thuộc đơn vị mình; chuyên trách nhiệm vụ phê duyệt. |

## Entities

| Entity | Fields |
|---|---|
| BenCang | id (UUID), maBen (string, unique, length≤50), tenBen (string, length≤255), cangBienId (UUID, parent ref), tuyenDuongThuy (string, length≤255), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), chieuDai (BigDecimal, precision 15 scale 2), chieuRong (BigDecimal, precision 15 scale 2), loaiBen (string, length≤100), doSauLuong (BigDecimal, precision 10 scale 2), trangThaiHoatDong (string, length≤50), trangThaiPheDuyet (string, length≤50: CHO_PHE_DUYET/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt (LocalDateTime), updatedAt (LocalDateTime) |
| PheDuyetLog | id (UUID), benCangId (UUID FK → BenCang), pheDuyetAction (string: APPROVE/REJECT), pheDuyetBy (string → user), pheDuyetAt (LocalDateTime), lyDo (text, chỉ có khi REJECT) |
| CangBien (parent) | id (UUID), ten (string), trangThaiHoatDong (string) — được join qua cangBienId |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-119-01 | Chỉ có thể phê duyệt hoặc từ chối Bến cảng có trạng thái CHO_PHE_DUYET. | Approve/Reject | F-017 backend |
| BR-119-02 | Phê duyệt chuyển trạng thái từ CHO_PHE_DUYET → DUOC_PHE_DUYET; tạo bản ghi PheDuyetLog với action=APPROVE. | Approve | F-017 backend |
| BR-119-03 | Từ chối chuyển trạng thái từ CHO_PHE_DUYET → TU_CHO; yêu cầu lý do ≥10 ký tự; tạo PheDuyetLog với action=REJECT và lý do. | Reject | F-017 backend |
| BR-119-04 | Chỉ người dùng có quyền `bencang:approve` mới được thực hiện phê duyệt hoặc từ chối. | RBAC | Auth |
| BR-119-05 | Sau khi phê duyệt hoặc từ chối thành công, bản ghi bị xóa khỏi danh sách chờ phê duyệt; không thể thao tác lại. | UI logic | Business rule |

## Testing Strategy

Kiểm thử chấp nhận tập trung vào các kịch bản: (1) danh sách chỉ hiển thị Bến cảng có trạng thái CHO_PHE_DUYET, được lọc theo đơn vị của người dùng đăng nhập; (2) các cột maBen, tenBen, loaiBen, trangThaiHoatDong, createdAt, updatedBy hiển thị chính xác; (3) nút Phê duyệt/Từ chối chỉ hiển thị cho Role có quyền `bencang:approve`; (4) nhấn Phê duyệt → hộp thoại xác nhận → xác nhận → `POST /:id/approve` → trạng thái chuyển thành DUOC_PHE_DUYET → tạo PheDuyetLog → toast "Đã phê duyệt" → bản ghi bị xóa khỏi danh sách; (5) nhấn Từ chối → hộp thoại yêu cầu lý do → lý do < 10 ký tự bị chặn với lỗi hiển thị → lý do ≥ 10 ký tự → `POST /:id/reject` → trạng thái TU_CHO → tạo PheDuyetLog với lý do → toast "Đã từ chối" → bản ghi bị xóa khỏi danh sách; (6) PheDuyetLog được tạo với đầy đủ thông tin action, pheDuyetBy, pheDuyetAt, lyDo (nếu REJECT); (7) API trả lỗi 4xx/5xx → toast error hiển thị; (8) người dùng không có quyền `bencang:approve` không nhìn thấy nút Phê duyệt/Từ chối.
