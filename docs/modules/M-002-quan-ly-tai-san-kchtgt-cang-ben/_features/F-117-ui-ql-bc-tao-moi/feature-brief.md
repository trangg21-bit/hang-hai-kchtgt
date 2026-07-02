---
id: F-117
name: "Tạo mới Bến cảng"
slug: ui-ql-bc-tao-moi
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:22Z"
last-updated: "2026-07-01T04:08:22Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Tạo mới Bến cảng

## Description

Tính năng "Tạo mới Bến cảng" (F-117) cung cấp giao diện form nhập liệu để tạo một Bản ghi Bến cảng mới. Form bao gồm các trường: maBen (string, unique, không để trống), tenBen (string, required), cangBienId (dropdown chọn từ danh sách CangBien có trạng thái HIEN_HANH), tuyenDuongThuy (string, optional), viDo (BigDecimal, validation -90..90, optional), kinhDo (BigDecimal, validation -180..180, optional), chieuDai (BigDecimal, đơn vị mét, optional), chieuRong (BigDecimal, đơn vị mét, optional), loaiBen (string, optional), doSauLuong (BigDecimal, đơn vị mét, optional), trangThaiHoatDong (string, optional). Hệ thống thực hiện validation client-side: maBen kiểm tra trùng lặp (gọi API `GET /api/v1/ben-cang?search=<maBen>` để kiểm tra unique trước khi submit), viDo/kinhDo kiểm tra phạm vi GPS khi có giá trị, cangBienId kiểm tra trạng thái HIEN_HANH của Bến cảng cha. Khi người dùng nhấn "Lưu", hệ thống gọi `POST /api/v1/ben-cang` với payload chứa toàn bộ dữ liệu đã nhập → backend tạo bản ghi với trangThaiPheDuyet = CHO_PHE_DUYET → hệ thống hiển thị toast "Đã tạo mới Bến cảng thành công, chờ phê duyệt" → tự động redirect về màn hình danh sách (F-115). Form hỗ trợ cancel (hủy và quay lại danh sách) với xác nhận nếu có thay đổi chưa lưu.

## Business Intent

Cho phép người dùng được ủy quyền tạo thông tin Bến cảng mới vào hệ thống quản lý tài sản cảng biển, đảm bảo dữ liệu đầu vào đầy đủ, chính xác và tuân thủ các quy tắc nghiệp vụ trước khi chuyển sang quy trình phê duyệt.

## Flow Summary

Người dùng nhấn nút "Tạo mới Bến cảng" trên màn hình danh sách (F-115) → hệ thống mở màn hình form tạo mới với tất cả trường rỗng. Dropdown cangBienId được populate từ `GET /api/v1/cang-bien?status=HIEN_HANH` để chỉ hiển thị các Bến cảng cha đang hoạt động. Người dùng điền đầy đủ các trường bắt buộc (maBen, tenBen, cangBienId) và các trường tùy chọn. Validation client-side chạy ngay tại thời điểm blur mỗi trường (maBen unique check, GPS range check khi có giá trị, parent status check). Khi nhấn "Lưu", hệ thống gọi `POST /api/v1/ben-cang` với toàn bộ dữ liệu → backend kiểm tra unique maBen, tạo bản ghi với trangThaiPheDuyet = CHO_PHE_DUYET, trả về bản ghi vừa tạo → toast thông báo "Đã tạo mới Bến cảng thành công, chờ phê duyệt" → redirect về danh sách (F-115). Nếu API trả lỗi (400 Bad Request, 409 Conflict), hệ thống hiển thị toast lỗi chi tiết và giữ nguyên form.

## Acceptance Criteria

1. Form tạo mới hiển thị các trường: maBen (required, unique), tenBen (required), cangBienId (required dropdown), tuyenDuongThuy, viDo, kinhDo, chieuDai, chieuRong, loaiBen, doSauLuong, trangThaiHoatDong.
2. Dropdown cangBienId chỉ hiển thị các CangBien có trạng thái HIEN_HANH; được populate từ API `GET /api/v1/cang-bien?status=HIEN_HANH` khi form được mở.
3. Trường loaiBen là trường string tự do (không có enum cố định trong BE).
4. maBen là trường unique: khi người dùng nhập giá trị maBen trùng với bản ghi đã tồn tại, hệ thống hiển thị thông báo lỗi "Mã bến đã tồn tại" ngay sau khi blur.
5. viDo phải nằm trong khoảng [-90, 90]; ngoài khoảng này hiển thị lỗi "Tọa độ vĩ độ phải nằm trong [-90, 90]".
6. kinhDo phải nằm trong khoảng [-180, 180]; ngoài khoảng này hiển thị lỗi "Tọa độ kinh độ phải nằm trong [-180, 180]".
7. Khi nhấn "Lưu" với dữ liệu hợp lệ, hệ thống gọi `POST /api/v1/ben-cang` và trả về toast "Đã tạo mới Bến cảng thành công, chờ phê duyệt".
8. Sau khi tạo thành công, hệ thống tự động redirect về màn hình danh sách Bến cảng (F-115).
9. Nếu maBen đã tồn tại, API trả về 409 Conflict → toast "Mã bến đã tồn tại" và form không submit.
10. Nút "Hủy" quay về danh sách; nếu có thay đổi chưa lưu, hiển thị hộp thoại xác nhận "Bạn có chắc chắn muốn hủy? Các thay đổi chưa lưu sẽ bị mất."
11. Trạng thái phê duyệt mặc định của bản ghi mới tạo là CHO_PHE_DUYET.
12. Tất cả các trường required phải được kiểm tra: nếu để trống, hiển thị lỗi "Trường này là bắt buộc" tại trường tương ứng.

## In Scope

- Form tạo mới với tất cả các trường của entity BenCang.
- Dropdown cangBienId chỉ hiển thị CangBien trạng thái HIEN_HANH.
- Trường loaiBen là string tự do (không có enum cố định trong BE).
- Client-side validation: required fields, maBen unique, GPS range, parent HIEN_HANH.
- API POST /api/v1/ben-cang.
- Toast success → redirect danh sách.
- Toast error → giữ nguyên form với thông báo lỗi chi tiết.
- Nút Hủy với xác nhận.

## Out of Scope

- Chỉnh sửa Bến cảng đã tồn tại (thuộc F-118).
- Xem chi tiết Bến cảng (thuộc F-116).
- Phê duyệt / Từ chối Bến cảng (thuộc F-119).
- Xóa Bến cảng (thuộc F-120).
- Upload tài liệu đính kèm khi tạo mới.
- Import dữ liệu Bến cảng từ file CSV/Excel.
- Tạo nhiều Bến cảng cùng lúc (bulk create).
- Prefill form với dữ liệu mẫu để testing.

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| QuanTriCangBien | Full access | Được phép tạo mới Bến cảng trong toàn bộ hệ thống. Quyền `bencang:create`. |
| QuanLyDonVi | Create | Được tạo mới Bến cảng thuộc đơn vị mình. Không có quyền xóa hoặc phê duyệt Bến cảng của đơn vị khác. |
| NhanVien | No access | Không có quyền tạo mới Bến cảng. Chỉ được xem danh sách và chi tiết. |
| ThanhVienPheDuyet | No access | Không có quyền tạo mới; chỉ có quyền xem và phê duyệt/từ chối. |

## Entities

| Entity | Fields |
|---|---|
| BenCang (create) | maBen (string, unique, length≤50, NotBlank), tenBen (string, length≤255, NotBlank), cangBienId (UUID, NotNull, parent must be HIEN_HANH), tuyenDuongThuy (string, length≤255, optional), viDo (BigDecimal, precision 10 scale 6, optional), kinhDo (BigDecimal, precision 10 scale 6, optional), chieuDai (BigDecimal, precision 15 scale 2, optional), chieuRong (BigDecimal, precision 15 scale 2, optional), loaiBen (string, length≤100, optional), doSauLuong (BigDecimal, precision 10 scale 2, optional), trangThaiHoatDong (string, length≤50, optional), trangThaiPheDuyet (string, length≤50, default CHO_PHE_DUYET), orgUnitId (UUID, optional), createdBy (string, auto-filled), updatedBy (string, auto-filled), createdAt (LocalDateTime, auto), updatedAt (LocalDateTime, auto) |
| CangBien (parent) | id (UUID), ten (string), trangThaiHoatDong (string) — chỉ hiển thị các bản ghi có trạng thái hoạt động = HIEN_HANH |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-117-01 | maBen phải là duy nhất trong toàn bộ hệ thống; tạo mới bị chặn nếu maBen đã tồn tại (HTTP 409). | Create | Unique constraint |
| BR-117-02 | Bến cảng cha (CangBien) phải có trạng thái HIEN_HANH; không cho phép chọn CangBien TAM_NGUNG. | Create | Parent guard |
| BR-117-03 | viDo phải nằm trong [-90, 90], kinhDo phải nằm trong [-180, 180]; validation client-side và server-side. | Create | GPS validation |
| BR-117-04 | Trạng thái phê duyệt mặc định là CHO_PHE_DUYET khi tạo mới. | Create | Default status |
| BR-117-05 | Các trường maBen, tenBen, cangBienId là bắt buộc (NotBlank/NotNull trong CreateDTO); không cho phép tạo nếu thiếu. | Create | Required fields |

## Testing Strategy

Kiểm thử chấp nhận tập trung vào các kịch bản: (1) form hiển thị đúng tất cả các trường với nhãn tiếng Việt phù hợp; (2) dropdown cangBienId chỉ hiển thị CangBien HIEN_HANH, không hiển thị TAM_NGUNG; (3) loaiBen là trường string tự do (không có enum cố định); (4) maBen duplicate detection: nhập maBen trùng → blur trigger API check → hiển thị lỗi "Mã bến đã tồn tại"; (5) viDo ngoài [-90, 90] → hiển thị lỗi range; (6) kinhDo ngoài [-180, 180] → hiển thị lỗi range; (7) submit với đầy đủ dữ liệu hợp lệ → API POST trả 200 → toast success → redirect danh sách; (8) submit với maBen trùng → API trả 409 → toast error → form giữ nguyên; (9) submit với trường required trống → client-side validation hiển thị lỗi tại từng trường; (10) nút Hủy → xác nhận discard changes → quay về danh sách; (11) trạng thái phê duyệt bản ghi mới là CHO_PHE_DUYET.
