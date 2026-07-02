---
id: F-074
name: "Chi tiết Bến cảng"
slug: ui-xem-bc-chi-tiet
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:20Z"
last-updated: "2026-07-01T04:08:20Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Chi tiết Bến cảng

## Description

Tính năng "Chi tiết Bến cảng" (F-074) cung cấp giao diện xem thông tin đầy đủ của một Bến cảng cụ thể, hiển thị tất cả các trường dữ liệu từ entity BenCang bao gồm: mã bến (readonly), tên bến, tên bến cảng cha (CangBienId — hiển thị dưới dạng liên kết đến chi tiết CangBien), tuyến đường thủy, tọa độ GPS (viDo, kinhDo) với độ chính xác ±XX.XXXXXX, chiều dài (chieuDai, đơn vị mét), chiều rộng (chieuRong, đơn vị mét), loại bến (loaiBen), độ sâu luồng (doSauLuong, đơn vị mét), trạng thái hoạt động (trangThaiHoatDong), trạng thái phê duyệt (trangThaiPheDuyet), và các thông tin metadata (orgUnitId, createdBy, updatedBy, createdAt, updatedAt). Giao diện sử dụng breadcrumb điều hướng từ danh sách Bến cảng → Chi tiết Bến cảng. Trạng thái phê duyệt được hiển thị bằng badge màu: vàng cho CHO_PHE_DUYET, xanh lá cho DUOC_PHE_DUYET, đỏ cho TU_CHO. Dành cho người dùng có quyền Leader, các nút hành động "Phê duyệt" và "Từ chối" (chuyển sang TU_CHO) được hiển thị trên màn hình chi tiết. Khi người dùng chọn phê duyệt hoặc từ chối, hệ thống mở hộp thoại xác nhận với lý do (≥10 ký tự khi từ chối), sau đó gọi API tương ứng và cập nhật trạng thái ngay lập tức trên màn hình.

## Business Intent

Cung cấp cái nhìn tổng quan, toàn diện về thông tin kỹ thuật và quản lý của từng Bến cảng, hỗ trợ cán bộ quản lý ra quyết định về vận hành, bảo trì, và phê duyệt trong thời gian thực, đồng thời tạo điều kiện cho việc kiểm toán và追溯 nguồn gốc thay đổi thông qua lịch sử phê duyệt.

## Flow Summary

Người dùng nhấn nút "Xem chi tiết" trên màn hình danh sách (F-073) hoặc tìm kiếm Bến cảng bằng maBen/tenBen → hệ thống gọi `GET /api/v1/ben-cang/:id` → hiển thị màn hình chi tiết với breadcrumb "Danh sách Bến cảng > Chi tiết: [maBen]". Giao diện chia thành 2 phần: (1) Thông tin cơ bản — hiển thị maBen (readonly), tenBen, cangBienId (link đến CangBien detail), tuyenDuongThuy, viDo, kinhDo (hiển thị ±XX.XXXXXX), chieuDai, chieuRong, loaiBen, doSauLuong, orgUnitId, createdBy, updatedBy, createdAt, updatedAt; (2) Trạng thái — hiển thị badge trangThaiHoatDong (HIEN_HANH=xanh dương, TAM_NGUNG=cam) và badge trangThaiPheDuyet (CHO_PHE_DUYET=vàng, DUOC_PHE_DUYET=xanh lá, TU_CHO=đỏ). Nếu người dùng có quyền Leader, nút "Phê duyệt" (→ DUOC_PHE_DUYET) và "Từ chối" (→ TU_CHO, yêu cầu lý do ≥10 ký tự) được hiển thị. Khi click "Phê duyệt" hoặc "Từ chối", mở hộp thoại xác nhận → xác nhận → gọi API `POST /:id/approve` hoặc `POST /:id/reject` → hệ thống hiển thị toast thông báo kết quả → refresh chi tiết.

## Acceptance Criteria

1. Màn hình chi tiết hiển thị đầy đủ tất cả các trường của entity BenCang khi gọi `GET /api/v1/ben-cang/:id` thành công.
2. Breadcrumb điều hướng hiển thị: "Danh sách Bến cảng" (link về F-073) → "Chi tiết: [maBen]".
3. Trường cangBienId hiển thị tên của CangBien cha dưới dạng liên kết click được, khi click mở màn hình chi tiết CangBien tương ứng.
4. Tọa độ GPS (viDo, kinhDo) hiển thị với định dạng ±XX.XXXXXX (5 chữ số thập phân).
5. Badge trạng thái phê duyệt có màu: vàng (CHO_PHE_DUYET), xanh lá (DUOC_PHE_DUYET), đỏ (TU_CHO).
6. Badge trạng thái hoạt động có màu: xanh dương (HIEN_HANH), cam (TAM_NGUNG).
7. Các trường metadata (createdBy, updatedBy) hiển thị dạng string; createdAt, updatedAt hiển thị dạng datetime định dạng dd/MM/yyyy HH:mm:ss.
8. Nút "Phê duyệt" chỉ hiển thị cho người dùng có quyền Leader (authentication `bencang:approve`).
9. Khi nhấn "Phê duyệt", hệ thống mở hộp thoại xác nhận với thông báo "Bạn có chắc chắn muốn phê duyệt Bến cảng này?"; sau khi xác nhận gọi `POST /:id/approve` và cập nhật trạng thái thành DUOC_PHE_DUYET.
10. Khi nhấn "Từ chối", hệ thống mở hộp thoại yêu cầu lý do (ít nhất 10 ký tự); sau khi xác nhận gọi `POST /:id/reject` với lý do và cập nhật trạng thái thành TU_CHO.
11. Toast thông báo thành công "Đã phê duyệt Bến cảng" hoặc "Đã từ chối Bến cảng" được hiển thị sau khi API trả về HTTP 200.
12. Toast thông báo lỗi "Không thể thực hiện thao tác: [error message]" được hiển thị khi API trả về HTTP 4xx/5xx.
13. Các trường metadata (createdBy, updatedBy, createdAt, updatedAt) được hiển thị dưới dạng readable date-time (dd/MM/yyyy HH:mm:ss).

## In Scope

- Hiển thị đầy đủ tất cả các trường của entity BenCang.
- Breadcrumb điều hướng từ danh sách.
- Trường cangBienId hiển thị dưới dạng link đến CangBien detail.
- GPS ±XX.XXXXXX định dạng 5 chữ số thập phân.
- Badge trạng thái với mã màu chuẩn cho cả trangThaiHoatDong và trangThaiPheDuyet.
- Hiển thị đầy đủ các trường metadata (orgUnitId, createdBy, updatedBy, createdAt, updatedAt).
- Nút Phê duyệt / Từ chối (Leader only) với hộp thoại xác nhận.
- Toast thông báo thành công / lỗi sau khi thực hiện approval/reject.
- Loading state và error handling khi fetch chi tiết.

## Out of Scope

- Tạo mới Bến cảng (thuộc F-075).
- Chỉnh sửa trực tiếp trên màn hình chi tiết — phải chuyển qua màn hình cập nhật (F-076).
- Xóa Bến cảng — phải chuyển qua màn hình xóa (F-095).
- Xem lịch sử thay đổi chi tiết — phải chuyển qua màn hình lịch sử (F-096).
- Upload tài liệu đính kèm mới — chỉ hiển thị danh sách đã tồn tại.
- Export chi tiết Bến cảng ra PDF.
- So sánh phiên bản trước/sau của các trường.
- Inline editing của các trường (mặc định là readonly).

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| QuanTriCangBien | Full access | Được xem toàn bộ chi tiết, phê duyệt, từ chối, chỉnh sửa, xóa tất cả Bến cảng. Quyền `bencang:create/read/update/delete/approve`. |
| QuanLyDonVi | Read + Approve | Được xem chi tiết và phê duyệt / từ chối Bến cảng thuộc đơn vị mình; không có quyền xóa. |
| NhanVien | Read only | Được xem chi tiết Bến cảng thuộc đơn vị mình; không có quyền phê duyệt, chỉnh sửa hoặc xóa. |
| ThanhVienPheDuyet | Read + Approve | Được xem chi tiết và thực hiện phê duyệt / từ chối; không có quyền chỉnh sửa, tạo mới hoặc xóa. |

## Entities

| Entity | Fields |
|---|---|
| BenCang | id (UUID), maBen (string, unique, length≤50), tenBen (string, length≤255), cangBienId (UUID, parent ref), tuyenDuongThuy (string, length≤255), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), chieuDai (BigDecimal, precision 15 scale 2), chieuRong (BigDecimal, precision 15 scale 2), loaiBen (string, length≤100), doSauLuong (BigDecimal, precision 10 scale 2), trangThaiHoatDong (string, length≤50), trangThaiPheDuyet (string, length≤50: CHO_PHE_DUYET/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt (LocalDateTime), updatedAt (LocalDateTime) |
| CangBien | id (UUID), ten (string) — được join qua cangBienId để hiển thị tên và làm link navigation |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-074-01 | Chỉ hiển thị chi tiết của Bến cảng có deletedAt = NULL (không bị xóa mềm). | Read | Soft-delete filter |
| BR-074-02 | Trạng thái phê duyệt mặc định là CHO_PHE_DUYET khi tạo mới; badge màu tương ứng được hiển thị. | Display | Default status |
| BR-074-03 | GPS viDo nằm trong [-90, 90], kinhDo nằm trong [-180, 180]; hiển thị với định dạng ±XX.XXXXXX. | Display | GPS validation |
| BR-074-04 | Chỉ người dùng có quyền Leader mới được nhìn thấy và thao tác với nút "Phê duyệt" và "Từ chối". | UI logic | RBAC |
| BR-074-05 | Lý do từ chối phải có ít nhất 10 ký tự; không cho phép phê duyệt nếu lý do < 10 ký tự. | UI validation | Reason length |
| BR-074-06 | Các trường metadata (createdBy, updatedBy) được hiển thị dạng string; createdAt, updatedAt hiển thị dạng datetime định dạng dd/MM/yyyy HH:mm:ss. | Display | Metadata format |

## Testing Strategy

Kiểm thử chấp nhận tập trung vào các kịch bản: (1) fetch chi tiết BenCang thành công hiển thị đúng tất cả các trường dữ liệu; (2) breadcrumb điều hướng chính xác về F-073; (3) link cangBienId mở đúng màn hình chi tiết CangBien; (4) định dạng GPS ±XX.XXXXXX hiển thị đúng 5 chữ số thập phân; (5) badge màu trạng thái đúng cho cả 2 enum; (6) các trường metadata (orgUnitId, createdBy, updatedBy, createdAt, updatedAt) hiển thị đúng định dạng; (7) nút Phê duyệt/Từ chối chỉ hiển thị cho Role có quyền Leader; (8) xác nhận phê duyệt qua hộp thoại → gọi `POST /:id/approve` → trạng thái chuyển thành DUOC_PHE_DUYET → toast thành công; (9) từ chối với lý do < 10 ký tự bị chặn, lý do ≥ 10 ký tự → gọi `POST /:id/reject` → trạng thái TU_CHO → toast thành công; (10) xử lý lỗi API (404 Not Found, 500 Server Error) hiển thị toast phù hợp.
