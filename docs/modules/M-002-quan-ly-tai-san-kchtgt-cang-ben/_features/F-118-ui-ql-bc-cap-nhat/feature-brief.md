---
id: F-118
name: "Cập nhật Bến cảng"
slug: ui-ql-bc-cap-nhat
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:23Z"
last-updated: "2026-07-01T04:08:23Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Cập nhật Bến cảng

## Description

Tính năng "Cập nhật Bến cảng" (F-118) cung cấp giao diện form nhập liệu để chỉnh sửa thông tin của một Bến cảng đã tồn tại trong hệ thống. Form được pre-filled với dữ liệu hiện tại của BenCang (lấy từ `GET /api/v1/ben-cang/:id`). Trường maBen hiển thị dưới dạng readonly (không cho phép chỉnh sửa) vì không có trong UpdateDTO (khóa duy nhất, immutable). Các trường có thể chỉnh sửa bao gồm: tenBen (string, optional), cangBienId (dropdown chọn từ CangBien có trạng thái HIEN_HANH, optional), tuyenDuongThuy (string, optional), viDo (BigDecimal, validation -90..90, optional), kinhDo (BigDecimal, validation -180..180, optional), chieuDai (BigDecimal, đơn vị mét, optional), chieuRong (BigDecimal, đơn vị mét, optional), loaiBen (string, optional), doSauLuong (BigDecimal, đơn vị mét, optional), trangThaiHoatDong (string, optional). Hệ thống thực hiện client-side validation: viDo/kinhDo kiểm tra phạm vi GPS khi có giá trị, cangBienId kiểm tra trạng thái HIEN_HANH của Bến cảng cha khi thay đổi. Khi người dùng nhấn "Lưu", hệ thống gọi `PUT /api/v1/ben-cang/:id` với toàn bộ dữ liệu đã chỉnh sửa → backend cập nhật bản ghi → tự động reset trạng thái phê duyệt về CHO_PHE_DUYET (yêu cầu phê duyệt lại) → tạo bản ghi trong bảng LichSuThayDoi để lưu lại lịch sử thay đổi → hệ thống hiển thị toast "Đã cập nhật Bến cảng, chờ phê duyệt lại" → redirect về danh sách (F-115) hoặc màn hình chi tiết (F-116) tùy điểm xuất phát. Form hỗ trợ cancel (hủy và quay lại) với xác nhận nếu có thay đổi chưa lưu.

## Business Intent

Cho phép người dùng được ủy quyền cập nhật thông tin Bến cảng đã được tạo trước đó, đồng thời tự động đưa bản ghi về trạng thái chờ phê duyệt lại để đảm bảo toàn bộ thay đổi đều được xem xét và phê duyệt theo đúng quy trình quản lý tài sản, tạo lập lịch sử thay đổi để phục vụ kiểm toán và追溯 nguồn gốc.

## Flow Summary

Người dùng click nút "Chỉnh sửa" trên màn hình danh sách (F-115) hoặc màn hình chi tiết (F-116) → hệ thống mở màn hình form cập nhật với dữ liệu pre-filled từ `GET /api/v1/ben-cang/:id`. Trường maBen hiển thị readonly. Dropdown cangBienId được populate từ API `GET /api/v1/cang-bien?status=HIEN_HANH` để chỉ hiển thị Bến cảng cha đang hoạt động. Người dùng điền các thay đổi cần thiết. Validation client-side chạy ngay tại thời điểm blur mỗi trường (GPS range check khi có giá trị, field value validation). Khi nhấn "Lưu", hệ thống gọi `PUT /api/v1/ben-cang/:id` với toàn bộ dữ liệu → backend kiểm tra và cập nhật bản ghi → tự động reset trangThaiPheDuyet về CHO_PHE_DUYET → tạo bản ghi trong bảng LichSuThayDoi ghi lại mọi thay đổi → toast "Đã cập nhật Bến cảng, chờ phê duyệt lại" → redirect về danh sách (F-115) hoặc chi tiết (F-116). Nếu API trả lỗi (400 Bad Request, 404 Not Found), hệ thống hiển thị toast lỗi chi tiết và giữ nguyên form.

## Acceptance Criteria

1. Form cập nhật hiển thị đầy đủ các trường của BenCang khi gọi `GET /api/v1/ben-cang/:id` thành công, với dữ liệu pre-filled chính xác.
2. Trường maBen hiển thị readonly (không thể chỉnh sửa), được ghi rõ "readonly — không thể thay đổi" bên cạnh nhãn.
3. Dropdown cangBienId chỉ hiển thị các CangBien có trạng thái HIEN_HANH; được populate từ API `GET /api/v1/cang-bien?status=HIEN_HANH` khi form được mở.
4. Client-side validation: viDo phải nằm trong [-90, 90], kinhDo phải nằm trong [-180, 180]; validation áp dụng khi trường có giá trị (UpdateDTO không có required fields).
5. Khi nhấn "Lưu" với dữ liệu hợp lệ, hệ thống gọi `PUT /api/v1/ben-cang/:id` và trả về toast "Đã cập nhật Bến cảng, chờ phê duyệt lại".
6. Sau khi cập nhật thành công, backend tự động reset trạng thái phê duyệt về CHO_PHE_DUYET và tạo bản ghi LichSuThayDoi ghi lại toàn bộ thay đổi.
7. Nếu cập nhật thất bại (400 Bad Request, 404 Not Found), hệ thống hiển thị toast lỗi chi tiết và giữ nguyên form với dữ liệu hiện tại.
8. Nút "Hủy" quay về danh sách hoặc chi tiết; nếu có thay đổi chưa lưu, hiển thị hộp thoại xác nhận "Bạn có chắc chắn muốn hủy? Các thay đổi chưa lưu sẽ bị mất."
9. Trạng thái phê duyệt mặc định sau khi cập nhật là CHO_PHE_DUYET (reset approval required).
10. Người dùng không có quyền update không nhìn thấy nút "Chỉnh sửa" trên danh sách hoặc chi tiết.

## In Scope

- Form cập nhật với tất cả các trường của entity BenCang (maBen readonly, không có trong UpdateDTO).
- Dropdown cangBienId chỉ hiển thị CangBien trạng thái HIEN_HANH.
- Trường loaiBen là string tự do (không có enum cố định trong BE).
- Client-side validation: GPS range khi có giá trị, parent HIEN_HANH.
- API PUT /api/v1/ben-cang/:id.
- Backend tự động reset trạng thái phê duyệt về CHO_PHE_DUYET.
- Backend tạo bản ghi LichSuThayDoi ghi lại thay đổi.
- Toast success "chờ phê duyệt lại" → redirect danh sách hoặc chi tiết.
- Toast error → giữ nguyên form với thông báo lỗi chi tiết.
- Nút Hủy với xác nhận discard changes.
- RBAC: chỉ người có quyền `bencang:update` mới thấy nút "Chỉnh sửa".

## Out of Scope

- Tạo mới Bến cảng (thuộc F-117).
- Xem chi tiết Bến cảng (thuộc F-116).
- Phê duyệt / Từ chối Bến cảng (thuộc F-119).
- Xóa Bến cảng (thuộc F-120).
- Xem lịch sử thay đổi chi tiết (thuộc F-121).
- Upload tài liệu đính kèm khi cập nhật.
- Import dữ liệu Bến cảng từ file CSV/Excel.
- Cập nhật nhiều Bến cảng cùng lúc (bulk update).
- Prefill form với dữ liệu mẫu để testing.

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| QuanTriCangBien | Full access | Được phép cập nhật tất cả Bến cảng trong toàn bộ hệ thống. Quyền `bencang:update`. |
| QuanLyDonVi | Update | Được cập nhật Bến cảng thuộc đơn vị mình; không có quyền cập nhật Bến cảng của đơn vị khác. |
| NhanVien | No access | Không có quyền cập nhật Bến cảng. Chỉ được xem danh sách và chi tiết. |
| ThanhVienPheDuyet | No access | Không có quyền cập nhật; chỉ có quyền xem và phê duyệt/từ chối. |

## Entities

| Entity | Fields |
|---|---|
| BenCang (update) | id (UUID, NotNull), maBen (string, unique, length≤50, readonly — không có trong UpdateDTO), tenBen (string, length≤255, optional), cangBienId (UUID, optional, parent must be HIEN_HANH), tuyenDuongThuy (string, length≤255, optional), viDo (BigDecimal, precision 10 scale 6, optional), kinhDo (BigDecimal, precision 10 scale 6, optional), chieuDai (BigDecimal, precision 15 scale 2, optional), chieuRong (BigDecimal, precision 15 scale 2, optional), loaiBen (string, length≤100, optional), doSauLuong (BigDecimal, precision 10 scale 2, optional), trangThaiHoatDong (string, length≤50, optional), trangThaiPheDuyet (string, length≤50 — tự động reset về CHO_PHE_DUYET sau cập nhật), orgUnitId (UUID), createdBy (string), updatedBy (string, auto-updated), createdAt (LocalDateTime), updatedAt (LocalDateTime, auto) |
| CangBien (parent) | id (UUID), ten (string), trangThaiHoatDong (string) — chỉ hiển thị các bản ghi có trạng thái hoạt động = HIEN_HANH |
| LichSuThayDoi | id (UUID), benCangId (UUID FK → BenCang), fieldChanged (string), oldValue (text), newValue (text), changedBy (string), changedAt (datetime) — tạo tự động mỗi lần cập nhật |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-118-01 | Trường maBen không được phép chỉnh sửa — luôn hiển thị readonly (không có trong UpdateDTO). | UI logic | Unique constraint |
| BR-118-02 | Bến cảng cha (CangBien) phải có trạng thái HIEN_HANH; không cho phép chọn CangBien TAM_NGUNG. | Update | Parent guard |
| BR-118-03 | viDo phải nằm trong [-90, 90], kinhDo phải nằm trong [-180, 180]; validation client-side và server-side (chỉ áp dụng khi có giá trị). | Update | GPS validation |
| BR-118-04 | Sau khi cập nhật, trạng thái phê duyệt tự động reset về CHO_PHE_DUYET (yêu cầu phê duyệt lại). | Backend | F-015 backend |
| BR-118-05 | Mỗi lần cập nhật tạo bản ghi trong bảng LichSuThayDoi ghi lại fieldChanged, oldValue, newValue, changedBy, changedAt. | Backend | INT-003 |

## Testing Strategy

Kiểm thử chấp nhận tập trung vào các kịch bản: (1) form hiển thị đúng tất cả các trường với dữ liệu pre-filled từ `GET /api/v1/ben-cang/:id`; (2) trường maBen hiển thị readonly, không cho phép chỉnh sửa; (3) dropdown cangBienId chỉ hiển thị CangBien HIEN_HANH; (4) loaiBen là trường string tự do (không có enum cố định); (5) client-side validation: viDo ngoài [-90, 90] hoặc kinhDo ngoài [-180, 180] → hiển thị lỗi range (chỉ khi có giá trị); (6) submit với dữ liệu hợp lệ → API PUT trả 200 → backend reset trạng thái về CHO_PHE_DUYET → tạo LichSuThayDoi → toast success "chờ phê duyệt lại" → redirect danh sách; (7) nút Hủy → xác nhận discard changes → quay về danh sách; (8) người dùng không có quyền `bencang:update` không nhìn thấy nút "Chỉnh sửa".
