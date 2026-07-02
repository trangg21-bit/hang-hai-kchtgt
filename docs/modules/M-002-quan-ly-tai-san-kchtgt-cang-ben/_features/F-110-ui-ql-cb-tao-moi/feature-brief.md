---
id: F-110
name: "Tao moi Cang Bien"
slug: ui-ql-cb-tao-moi
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T07:49:59Z"
last-updated: "2026-07-01T07:49:59Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Tao moi Cang Bien

## Description

Giao diện tạo mới Cảng biển (CangBienCreatePage) cung cấp một form nhập liệu với 7 trường chính cho phép người dùng có quyền create đăng ký một cảng biển mới vào hệ thống. Form được xây dựng bằng React Hook Form kết hợp với Zod validation cho inline validation ngay khi người dùng nhập liệu (onBlur/onSubmit). Các trường bao gồm: maCang (string, unique), tenCang (string), tinhThanhPho (string), viDo (BigDecimal), kinhDo (BigDecimal), dienTich (BigDecimal), khaNangTiepNhan (BigDecimal). GPS fields (viDo/kinhDo) phải được cung cấp cùng nhau hoặc để trống cùng nhau (BE validates @AssertTrue isGpsPaired()). Sau khi tạo thành công, maCang không thể thay đổi (readonly). Form kiểm tra trùng maCang real-time: nếu maCang đã tồn tại, hệ thống trả về HTTP 409 và hiển thị thông báo lỗi "Mã cảng đã tồn tại". Submit thành công gọi POST /api/v1/cang-bien, tạo bản ghi mới với trangThaiPheDuyet mặc định CHỜ_PHÊ_DUYỆT. Hiển thị toast "Tạo mới thành công — chờ phê duyệt", sau đó điều hướng về danh sách (F-108).

## Business Intent

Cho phép các tổ chức, cảng biển đăng ký thông tin cảng vào hệ thống quản lý tài sản cảng biển một cách có cấu trúc và được kiểm tra ngay lỗi. Việc tạo bản ghi mới với trạng thái CHỜ_PHÊ_DUYỆT đảm bảo tuân thủ quy trình phê duyệt, dữ liệu mới sẽ được Lãnh đạo xem xét và phê duyệt trước khi đưa vào hoạt động.

## Flow Summary

Người dùng điều hướng đến trang "Tạo mới Cảng biển" từ danh sách (F-108) bằng nút "Thêm mới". Form hiển thị 7 trường với validation inline (Zod schema: required, regex cho maCang VN-36, range cho GPS, max diện tích 5000, GPS paired constraint). Người dùng nhập liệu, hệ thống kiểm tra định dạng và hiển thị lỗi real-time (blurred field). Khi submit, form gọi POST /api/v1/cang-bien với dữ liệu đã validated. Nếu maCang đã tồn tại, API trả HTTP 409 — form hiển thị toast lỗi "Mã cảng đã tồn tại". Nếu thành công, API trả bản ghi mới với trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT. Form hiển thị toast thành công "Tạo mới thành công — chờ phê duyệt" và điều hướng về danh sách. maCang sau tạo là immutable (readonly).

## Acceptance Criteria

1. Form hiển thị đúng 7 trường (maCang, tenCang, tinhThanhPho, viDo, kinhDo, dienTich, khaNangTiepNhan) với validation inline qua React Hook Form + Zod schema.
2. maCang có regex validation định dạng VN-36 (độ dài 6-10 ký tự), sau khi tạo thành công không thể thay đổi (readonly).
3. viDo được kiểm tra range [-90, 90], kinhDo [-180, 180], dienTich [0, 5000] — hiển thị lỗi inline khi vượt quá giới hạn.
4. Submit thành công gọi POST /api/v1/cang-bien, trả về bản ghi mới với trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT, hiển thị toast "Tạo mới thành công — chờ phê duyệt", điều hướng về danh sách.
5. Nếu maCang đã tồn tại, API trả HTTP 409 — form hiển thị toast lỗi "Mã cảng đã tồn tại", form giữ nguyên dữ liệu đã nhập.
6. Chỉ người dùng có quyền 'cangbien:create' (Admin, Lãnh đạo, Chuyên viên Cục/Cảng vụ, Doanh nghiệp cảng) mới thấy nút "Tạo mới".

## In Scope

- Form tạo mới với 7 trường (React Hook Form + Zod)
- Inline validation (required, regex VN-36, range GPS, max diện tích)
- Kiểm tra trùng maCang real-time → 409 nếu tồn tại
- Submit → POST /api/v1/cang-bien
- Default trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT
- Toast thông báo thành công
- Điều hướng về danh sách sau tạo
- maCang readonly sau khi tạo

## Out of Scope

- Chỉnh sửa maCang sau tạo (không khả dụng)
- Phê duyệt (thuộc F-112)
- Xóa mềm (thuộc F-113)
- Xem lịch sử thay đổi (thuộc F-114)
- Import hàng loạt từ file Excel/CSV
- Tự động sinh maCang

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full | Tạo, chỉnh sửa, xóa, phê duyệt tất cả Cảng biển |
| Lãnh đạo | Full + Phê duyệt | Tạo, chỉnh sửa, xóa, phê duyệt/từ chối tất cả Cảng biển |
| Chuyên viên Cục | CRUD | Tạo, chỉnh sửa Cảng biển của Cục mình |
| Chuyên viên Cảng vụ | CRUD | Tạo, chỉnh sửa Cảng biển của Cảng vụ mình |
| Doanh nghiệp cảng | CRUD | Tạo, chỉnh sửa Cảng biển của đơn vị mình |
| Nhân viên vận hành | Read-only | Không có quyền tạo |

## Entities

- **CangBien**: id (UUID), maCang (string, unique, length≤50, immutable after creation), tenCang (string, length≤255), tinhThanhPho (string, length≤100), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), dienTich (BigDecimal, precision 15 scale 2, >0), khaNangTiepNhan (BigDecimal, precision 15 scale 2), trangThaiHoatDong (string), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt, updatedAt, deletedAt (nullable)

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | maCang định dạng VN-36, độ dài 6-10 ký tự, phải unique toàn hệ thống | maCang | Entity spec, F-110 |
| BR-002 | viDo phải nằm trong [-90, 90], kinhDo [-180, 180], dienTich [0, 5000] | GPS + Diện tích | Entity spec |
| BR-003 | Trang thái phê duyệt mặc định là CHỜ_PHÊ_DUYỆT | Create | Entity spec |
| BR-004 | maCang không thể thay đổi sau khi tạo (readonly) | maCang | F-110, F-008 |
| BR-005 | Nếu maCang đã tồn tại, API trả HTTP 409 Conflict | Tạo mới | F-110, F-008 |

## Testing Strategy

Giao diện tạo mới Cảng biển được kiểm thử bằng React Testing Library cho việc render form 7 trường, validation inline (required fields, regex maCang VN-36, range GPS, max dienTich, GPS paired constraint), và xử lý lỗi 409 khi maCang trùng. Cypress thực hiện end-to-end test: điều hướng đến trang tạo mới → điền form hợp lệ → submit → xác nhận toast "Tạo mới thành công — chờ phê duyệt" → xác nhận điều hướng về danh sách với bản ghi mới. Negative test: điền maCang trùng → 409 → toast lỗi → form giữ nguyên dữ liệu; điền viDo = 100 → lỗi range; điền dienTich = 6000 → lỗi max. Accessibility test: Tab qua tất cả trường, Enter submit form.
