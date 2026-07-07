---
id: F-085
name: "Tạo mới Cảng cạn"
slug: ui-ql-cc-tao-moi
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T06:56:22Z"
last-updated: "2026-07-01T06:56:22Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Tạo mới Cảng cạn

## Description

Tính năng Tạo mới Cảng cạn cung cấp giao diện form cho phép người dùng tạo mới một cảng cạn trong hệ thống. Form bao gồm các trường bắt buộc: mã cảng cạn (`maCangCan` — duy nhất, chiều dài tối đa 50 ký tự), tên cảng cạn (`tenCangCan` — chiều dài tối đa 255 ký tự), và trạng thái phê duyệt mặc định là `CHỜ_PHÊ_DUYỆT`. Các trường tùy chọn: tỉnh/thành phố (`tinhThanhPho` — chiều dài tối đa 100 ký tự), vĩ độ (`viDo` — BigDecimal precision 10 scale 6, khoảng -90 đến 90), kinh độ (`kinhDo` — BigDecimal precision 10 scale 6, khoảng -180 đến 180), diện tích (`dienTich` — BigDecimal precision 15 scale 2, phải lớn hơn 0), công suất TEU (`congSuatTEU` — BigDecimal precision 15 scale 2), và trạng thái hoạt động (`trangThaiHoatDong` — mặc định HIEN_HANH nếu không chọn). Form có validation client-side ngay khi người dùng nhập: kiểm tra trùng mã cảng cạn (gọi API kiểm tra trước khi submit), validate tọa độ GPS (vĩ độ và kinh độ phải được nhập cùng nhau — BE validates `@AssertTrue isGpsPaired()`), diện tích phải dương. Sau khi submit thành công, hệ thống hiển thị toast "Tạo mới cảng cạn thành công" và chuyển hướng về danh sách cảng cạn (F-083). Nếu có lỗi validation, hiển thị message error bên cạnh trường tương ứng.

## Business Intent

Cho phép người dùng tạo mới một cảng cạn với đầy đủ thông tin kỹ thuật và nghiệp vụ, đảm bảo dữ liệu đầu vào được kiểm tra tính hợp lệ trước khi lưu vào hệ thống, và cảng cạn mới tạo sẽ ở trạng thái chờ phê duyệt để Lãnh đạo xem xét.

## Flow Summary

Người dùng truy cập menu "Quản lý cảng cạn" → click nút "Tạo mới cảng cạn". Form tạo mới hiển thị với tất cả các trường theo thứ tự: maCangCan (bắt buộc, unique), tenCangCan (bắt buộc), tinhThanhPho (tùy chọn), viDo (tùy chọn), kinhDo (tùy chọn, phải có kèm viDo), dienTich (tùy chọn, phải >0), congSuatTEU (tùy chọn), trangThaiHoatDong (dropdown mặc định HIEN_HANH), trangThaiPheDuyet (auto-set = CHỜ_PHÊ_DUYỆT, ẩn). Người dùng điền các trường bắt buộc, kiểm tra validation real-time (maCangCan unique, GPS paired, dienTich >0), sau đó click "Lưu". Hệ thống gọi POST /api/v1/cang-can với dữ liệu từ form. Nếu thành công, toast "Tạo mới thành công" hiển thị và chuyển hướng về danh sách (F-083). Nếu thất bại, hiển thị lỗi chi tiết theo từng trường.

## Acceptance Criteria

1. Form tạo mới hiển thị tất cả các trường: maCangCan, tenCangCan, tinhThanhPho, viDo, kinhDo, dienTich, congSuatTEU, trangThaiHoatDong, trangThaiPheDuyet (auto-set = CHỜ_PHÊ_DUYỆT, ẩn).
2. Trường `maCangCan` là bắt buộc, độ dài tối đa 50 ký tự, kiểm tra trùng mã khi người dùng nhập xong (blur event) — nếu đã tồn tại hiển thị lỗi "Mã cảng cạn đã tồn tại".
3. Trường `tenCangCan` là bắt buộc, độ dài tối đa 255 ký tự.
4. Khi `viDo` có giá trị thì `kinhDo` phải có giá trị và ngược lại — nếu chỉ nhập một trong hai hiển thị lỗi "Vui lòng nhập đầy đủ tọa độ GPS (vĩ độ và kinh độ)".
5. `viDo` phải nằm trong khoảng -90 đến 90; `kinhDo` phải nằm trong khoảng -180 đến 180 — hiển thị lỗi phạm vi nếu vượt quá.
6. Nếu `dienTich` được nhập, phải lớn hơn 0 — hiển thị lỗi "Diện tích phải lớn hơn 0" nếu giá trị ≤ 0 hoặc âm.
7. Trạng thái phê duyệt (`trangThaiPheDuyet`) được tự động đặt thành `CHỜ_PHÊ_DUYỆT` và không thể thay đổi trên form tạo mới.
8. Click "Lưu" gọi POST /api/v1/cang-can với đầy đủ dữ liệu từ form; nếu thành công hiển thị toast "Tạo mới cảng cạn thành công" và chuyển hướng về danh sách (F-083).
9. Nếu có lỗi validation từ BE, hiển thị message error chi tiết cho từng trường bị lỗi ngay dưới trường tương ứng.
10. Click "Hủy" hoặc "Quay lại" chuyển người dùng về danh sách cảng cạn (F-083) mà không lưu dữ liệu.
11. Các trường tùy chọn (tinhThanhPho, viDo, kinhDo, dienTich, congSuatTEU) không bắt buộc — form cho phép bỏ trống và chỉ validate nếu có giá trị.

## In Scope

- Form tạo mới với tất cả các trường của thực thể CangCan
- Validation client-side: maCangCan unique, GPS paired (viDo + kinhDo), dienTich > 0, phạm vi GPS
- Auto-set trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT (không thể thay đổi)
- POST /api/v1/cang-can gửi dữ liệu form lên BE
- Toast thông báo thành công và chuyển hướng về danh sách
- Hiển thị lỗi validation chi tiết theo từng trường
- Xử lý các trường tùy chọn (nullable)

## Out of Scope

- Tạo nhiều cảng cạn cùng lúc (bulk create)
- Import danh sách cảng cạn từ file Excel/CSV
- Clone/tạo mới từ cảng cạn có sẵn
- Hiển thị bản đồ chọn vị trí GPS
- Quản lý văn bản đính kèm khi tạo mới (thuộc F-106)
- Tự động sinh mã cảng cạn (người dùng tự nhập maCangCan)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| QuanTriCangBien (Quản lý cảng biển) | Create | Tạo mới cảng cạn trong hệ thống |
| Admin | Create | Toàn quyền tạo mới cảng cạn |
| Doanh nghiệp cảng | Create | Tạo mới cảng cạn thuộc cảng của mình |
| NhanVienCangBien (Nhân viên cảng) | Create | Có thể tạo mới cảng cạn, không có quyền xóa |

## Entities

| Entity | Fields |
|---|---|
| CangCan | id (UUID), maCangCan (string, unique, length≤50), tenCangCan (string, length≤255), tinhThanhPho (string, length≤100), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), dienTich (BigDecimal, precision 15 scale 2, >0), congSuatTEU (BigDecimal, precision 15 scale 2), trangThaiHoatDong (string, length≤50), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt (LocalDateTime), updatedAt (LocalDateTime), deletedAt (nullable) |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-01 | Mã cảng cạn (`maCangCan`) phải là duy nhất trong toàn hệ thống — kiểm tra trùng khi người dùng nhập (blur event) và trước khi submit | POST | Entity constraint (CangCan.java:29) |
| BR-02 | Tọa độ GPS (`viDo` và `kinhDo`) phải được nhập cùng nhau — BE validates `@AssertTrue isGpsPaired()`; nếu chỉ nhập một trong hai sẽ bị reject | POST | BE validation |
| BR-03 | `dienTich` (precision 15 scale 2) phải là giá trị dương (>0) nếu được nhập | POST | Type validation |
| BR-04 | `viDo` phải nằm trong [-90, 90] và `kinhDo` phải nằm trong [-180, 180] | POST | GPS range validation |
| BR-05 | Trạng thái phê duyệt mặc định khi tạo mới là `CHỜ_PHÊ_DUYỆT`, không cho phép thay đổi trên form | POST | Default value |

## Testing Strategy

Kiểm thử đơn vị (unit test) xác nhận các business rule trên BE: kiểm tra mã duy nhất, validation `@AssertTrue isGpsPaired()` cho GPS paired, kiểm tra `dienTich > 0`, phạm vi `viDo` (-90..90) và `kinhDo` (-180..180), và default giá trị `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT`. Kiểm thử tích hợp (integration test) xác nhận POST /api/v1/cang-can tạo thành công cảng cạn mới với dữ liệu hợp lệ, reject khi có lỗi validation (trùng mã, GPS không paired, dienTich ≤ 0, viDo/kinhDo vượt phạm vi), và xác nhận trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT trong kết quả trả về. Kiểm thử E2E/UI sử dụng browser automation để verify: form hiển thị đúng các trường, validation real-time hoạt động (maCangCan unique check, GPS paired, dienTich >0), submit thành công và toast + redirect về danh sách, submit thất bại với đúng error message, và click "Hủy" quay lại danh sách.
