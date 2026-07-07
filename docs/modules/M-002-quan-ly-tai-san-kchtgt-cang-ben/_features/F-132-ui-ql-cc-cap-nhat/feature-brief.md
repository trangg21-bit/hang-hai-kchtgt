---
id: F-132
name: "Cap nhat Cang Can"
slug: ui-ql-cc-cap-nhat
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T07:51:07Z"
last-updated: "2026-07-01T07:51:07Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Cap nhat Cang Can

## Description

Tính năng Cập nhật Cảng cạn cung cấp giao diện form cho phép người dùng chỉnh sửa thông tin của một cảng cạn đã tồn tại trong hệ thống. Form được pre-filled với dữ liệu hiện tại của cảng cạn được chọn (lấy từ API GET /api/v1/cang-can/{id}). Các trường hiển thị: mã cảng cạn (maCangCan — hiển thị nhưng không cho phép chỉnh sửa, immutable sau khi tạo), tên cảng cạn (tenCangCan), tỉnh/thành phố (tinhThanhPho), vĩ độ (viDo), kinh độ (kinhDo), diện tích (dienTich), công suất TEU (congSuatTEU), trạng thái hoạt động (trangThaiHoatDong), trạng thái phê duyệt (trangThaiPheDuyet — hiển thị readonly, không cho phép chỉnh sửa). Form áp dụng cùng các validation rules như khi tạo mới: maCangCan immutable (không submit), GPS paired (viDo + kinhDo phải cùng có hoặc cùng không có giá trị), dienTich > 0 (nếu có giá trị), viDo [-90..90], kinhDo [-180..180]. Trường maCangCan được hiển thị dưới dạng readonly/disabled để người dùng biết nhưng không thể thay đổi. Trường trangThaiPheDuyet cũng được hiển thị readonly vì việc thay đổi trạng thái phê duyệt được thực hiện qua trang Phê duyệt (F-133).

## Business Intent

Cho phép người dùng chỉnh sửa thông tin của một cảng cạn đã tồn tại (tên, địa điểm, thông số kỹ thuật) mà không thể thay đổi mã định danh và trạng thái phê duyệt, đảm bảo tính toàn vẹn dữ liệu và tuân thủ quy trình phê duyệt tách biệt.

## Flow Summary

Người dùng mở trang Chi tiết Cảng cạn (F-130) → click nút "Chỉnh sửa" hoặc click "Chỉnh sửa" từ danh sách (F-129). Hệ thống chuyển đến trang Cập nhật Cảng cạn và gọi API GET /api/v1/cang-can/{id} để lấy dữ liệu hiện tại, pre-fill form với các giá trị tương ứng. Người dùng sửa đổi các trường cho phép chỉnh sửa (tất cả trừ maCangCan và trangThaiPheDuyet). Nếu viDo được sửa thì kinhDo phải được sửa (GPS paired constraint). Nếu dienTich được sửa phải > 0. Người dùng click "Lưu" — hệ thống gọi PUT /api/v1/cang-can/{id} với dữ liệu từ form (không bao gồm maCangCan). Nếu thành công, toast "Cập nhật thành công" hiển thị và chuyển hướng về trang Chi tiết (F-130). Nếu thất bại, hiển thị lỗi chi tiết theo từng trường.

## Acceptance Criteria

1. Form cập nhật pre-filled với dữ liệu hiện tại của cảng cạn được chọn từ API GET /api/v1/cang-can/{id}.
2. Trường maCangCan hiển thị dưới dạng readonly/disabled — người dùng thấy giá trị nhưng không thể chỉnh sửa.
3. Trường trangThaiPheDuyet hiển thị readonly với badge màu tương ứng — không cho phép chỉnh sửa trên form (quy trình phê duyệt riêng ở F-133).
4. Các trường cho phép chỉnh sửa: tenCangCan, tinhThanhPho, viDo, kinhDo, dienTich, congSuatTEU, trangThaiHoatDong.
5. Khi viDo có giá trị thì kinhDo phải có giá trị và ngược lại — BE validates @AssertTrue isGpsPaired(), nếu không sẽ bị reject với lỗi "Tọa độ GPS không đầy đủ".
6. dienTich (nếu được nhập) phải lớn hơn 0 — hiển thị lỗi "Diện tích phải lớn hơn 0" nếu giá trị ≤ 0.
7. viDo phải nằm trong [-90, 90] và kinhDo phải nằm trong [-180, 180] — hiển thị lỗi phạm vi nếu vượt quá.
8. Click "Lưu" gọi PUT /api/v1/cang-can/{id} (không bao gồm maCangCan trong payload) — nếu thành công hiển thị toast "Cập nhật thành công" và chuyển hướng về trang Chi tiết (F-130).
9. Nếu có lỗi validation từ BE, hiển thị message error chi tiết cho từng trường bị lỗi ngay dưới trường tương ứng.
10. Click "Hủy" hoặc "Quay lại" chuyển người dùng về trang Chi tiết Cảng cạn (F-130) mà không lưu dữ liệu.
11. Nếu không tìm thấy cảng cạn (HTTP 404) khi pre-fill form, hiển thị thông báo "Không tìm thấy cảng cạn" và nút "Quay lại danh sách".

## In Scope

- Form cập nhật với tất cả các trường của thực thể CangCan, trừ maCangCan (readonly) và trangThaiPheDuyet (readonly)
- Pre-fill dữ liệu hiện tại từ GET /api/v1/cang-can/{id}
- Validation client-side: GPS paired (viDo + kinhDo), dienTich > 0, phạm vi GPS
- PUT /api/v1/cang-can/{id} gửi dữ liệu form lên BE (không bao gồm maCangCan)
- Toast thông báo thành công và chuyển hướng về trang Chi tiết (F-130)
- Hiển thị lỗi validation chi tiết theo từng trường
- Xử lý trường hợp không tìm thấy (404)

## Out of Scope

- Chỉnh sửa trạng thái phê duyệt trên form (thuộc F-133)
- Chỉnh sửa nhiều cảng cạn cùng lúc (bulk edit)
- Clone/tạo mới từ cảng cạn hiện tại
- Hiển thị bản đồ chọn vị trí GPS
- Quản lý văn bản đính kèm khi cập nhật (thuộc F-106)
- Xem lại lịch sử thay đổi từ trang cập nhật (thuộc F-135)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| QuanTriCangBien (Quản lý cảng biển) | Update | Chỉnh sửa thông tin cảng cạn |
| Admin | Update | Toàn quyền chỉnh sửa thông tin cảng cạn |
| Doanh nghiệp cảng | Update | Chỉnh sửa cảng cạn thuộc cảng của mình |
| NhanVienCangBien (Nhân viên cảng) | Update | Có thể chỉnh sửa cảng cạn, không có quyền xóa |
| LeDuan (Lãnh đạo) | Update | Có thể chỉnh sửa thông tin cảng cạn |

## Entities

| Entity | Fields |
|---|---|
| CangCan | id (UUID), maCangCan (string, unique, length≤50, immutable after creation), tenCangCan (string, length≤255), tinhThanhPho (string, length≤100), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), dienTich (BigDecimal, precision 15 scale 2, >0), congSuatTEU (BigDecimal, precision 15 scale 2), trangThaiHoatDong (string, length≤50), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI, readonly on update), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt (LocalDateTime), updatedAt (LocalDateTime), deletedAt (nullable) |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-01 | Mã cảng cạn (maCangCan) là IMMUTABLE — không cho phép chỉnh sửa sau khi tạo, không nằm trong UpdateDTO | PUT | Entity design |
| BR-02 | Tọa độ GPS (viDo và kinhDo) phải được nhập cùng nhau — BE validates @AssertTrue isGpsPaired(); nếu chỉ nhập một trong hai sẽ bị reject | PUT | BE validation |
| BR-03 | dienTich (precision 15 scale 2) phải là giá trị dương (>0) nếu được nhập | PUT | Type validation |
| BR-04 | viDo phải nằm trong [-90, 90] và kinhDo phải nằm trong [-180, 180] | PUT | GPS range validation |
| BR-05 | Trạng thái phê duyệt (trangThaiPheDuyet) không được phép chỉnh sửa trên form update — phải qua trang Phê duyệt (F-133) | PUT | RBAC + Process guard |

## Testing Strategy

Kiểm thử đơn vị (unit test) xác nhận các business rule trên BE: maCangCan không nằm trong UpdateDTO, validation @AssertTrue isGpsPaired() cho GPS paired, kiểm tra dienTich > 0, phạm vi viDo (-90..90) và kinhDo (-180..180). Kiểm thử tích hợp (integration test) xác nhận PUT /api/v1/cang-can/{id} cập nhật thành công với dữ liệu hợp lệ, reject khi maCangCan được gửi trong payload, reject khi GPS không paired, reject khi dienTich ≤ 0, và xác nhận các trường không được phép chỉnh sửa (maCangCan, trangThaiPheDuyet) không bị thay đổi sau khi cập nhật. Kiểm thử E2E/UI sử dụng browser automation để verify: form pre-fill đúng dữ liệu từ API, maCangCan và trangThaiPheDuyet là readonly, validation real-time hoạt động (GPS paired, dienTich >0, viDo/kinhDo range), submit thành công với toast + redirect về F-130, submit thất bại với đúng error message, và click "Hủy" quay lại F-130.
