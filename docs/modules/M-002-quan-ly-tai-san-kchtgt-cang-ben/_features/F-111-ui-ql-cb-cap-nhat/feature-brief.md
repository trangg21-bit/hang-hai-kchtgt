---
id: F-111
name: "Cap nhat Cang Bien"
slug: ui-ql-cb-cap-nhat
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T07:49:59Z"
last-updated: "2026-07-01T07:49:59Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Cap nhat Cang Bien

## Description

Giao diện cập nhật Cảng biển (CangBienUpdatePage) cho phép người dùng có quyền update chỉnh sửa thông tin của một cảng biển đã tồn tại trong hệ thống. Trang mở từ nút "Chỉnh sửa" trên trang Danh sách (F-108) hoặc trang Chi tiết (F-109). Form được pre-filled với toàn bộ dữ liệu hiện tại của cảng biển từ API GET /api/v1/cang-bien/:id. Trường maCang được hiển thị dưới dạng readonly (không cho phép chỉnh sửa) để đảm bảo tính duy nhất và bất biến của mã cảng sau khi tạo. Các trường còn lại (tenCang, tinhThanhPho, viDo, kinhDo, dienTich, khaNangTiepNhan, trangThaiHoatDong) cho phép chỉnh sửa với cùng quy tắc validation như khi tạo mới (F-110): GPS fields (viDo/kinhDo) phải được cung cấp cùng nhau, các trường số kiểm tra precision/scale. Khi click nút "Cập nhật", hệ thống gọi API PUT /api/v1/cang-bien/:id. Sau khi cập nhật thành công, hệ thống tự động tạo bản ghi LichSuThayDoi ghi nhận các trường bị thay đổi, hiển thị toast "Cập nhật thành công" và redirect về trang chi tiết (F-109).

## Business Intent

Cho phép người dùng cập nhật thông tin của một cảng biển đã tồn tại (tên, địa lý, diện tích, khả năng tiếp nhận, trạng thái hoạt động), với cơ chế tự động ghi nhận thay đổi trong lịch sử. Việc maCang không cho phép chỉnh sửa đảm bảo tính toàn vẹn của mã định danh cảng biển trên toàn hệ thống.

## Flow Summary

Người dùng click nút "Chỉnh sửa" từ trang Danh sách (F-108) hoặc trang Chi tiết (F-109). Hệ thống gọi API GET /api/v1/cang-bien/:id để lấy thông tin hiện tại và pre-fill form. Người dùng chỉnh sửa các trường cần thay đổi (maCang readonly). Client-side validation thực hiện khi mất focus (blur) cho từng trường: tenCang (required), tinhThanhPho (required), viDo/kinhDo (range check, paired), dienTich (positive, max 5000), khaNangTiepNhan (BigDecimal hợp lệ). Sau khi điền xong, người dùng click nút "Cập nhật". Hệ thống gọi PUT /api/v1/cang-bien/:id — nếu thành công, hệ thống tự động tạo bản ghi LichSuThayDoi ghi nhận các thay đổi, hiển thị toast "Cập nhật thành công", và redirect về trang Chi tiết (F-109). Nếu lỗi (duplicate maCang, validation failure), toast lỗi hiển thị và form giữ lại dữ liệu.

## Acceptance Criteria

1. Khi mở trang, form được pre-filled với toàn bộ dữ liệu của cảng biển từ API GET /api/v1/cang-bien/:id; trường maCang hiển thị dưới dạng readonly (disabled input).
2. Client-side validation khi mất focus cho từng trường: tinhThanhPho (required, length≤100), viDo (range [-90, 90]), kinhDo (range [-180, 180]), dienTich (positive, max 5000), khaNangTiepNhan (BigDecimal hợp lệ).
3. GPS fields (viDo/kinhDo) phải được cung cấp cùng nhau hoặc để trống cùng nhau — nếu một field có giá trị thì field kia cũng phải có giá trị hợp lệ, ngược lại hiển thị lỗi "Vui lòng điền cả tọa độ vĩ độ và kinh độ".
4. Sau khi click "Cập nhật" và dữ liệu hợp lệ, hệ thống gọi PUT /api/v1/cang-bien/:id — sau khi thành công, toast "Cập nhật thành công" được hiển thị.
5. Sau khi cập nhật thành công, một bản ghi LichSuThayDoi được tự động tạo ghi nhận các trường thay đổi (field, oldValue, newValue, changedBy, changedAt).
6. Sau khi toast hiển thị, hệ thống tự động redirect về trang Chi tiết (F-109) với dữ liệu đã cập nhật.
7. Nếu cập nhật thất bại (lỗi server, validation failure), toast lỗi hiển thị và form giữ lại toàn bộ dữ liệu đã nhập.

## In Scope

- Form cập nhật cảng biển với dữ liệu pre-filled từ API
- Trường maCang readonly (không cho phép chỉnh sửa)
- Validation tương tự tạo mới (range GPS, max diện tích, required fields)
- API PUT /api/v1/cang-bien/:id
- Tự động tạo bản ghi LichSuThayDoi ghi nhận thay đổi
- Toast thông báo và redirect về trang chi tiết

## Out of Scope

- Tạo mới cảng biển (thuộc F-110)
- Xóa cảng biển (thuộc F-113)
- Phê duyệt/từ chối (thuộc F-112)
- Xem lịch sử thay đổi chi tiết (thuộc F-114)
- Undo/hoàn tác thay đổi sau khi đã cập nhật
- Chỉnh sửa maCang sau tạo (không khả dụng)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full | Cập nhật tất cả Cảng biển |
| Lãnh đạo | Full + Phê duyệt | Cập nhật và phê duyệt/từ chối tất cả Cảng biển |
| Chuyên viên Cục | CRUD | Cập nhật Cảng biển của Cục mình |
| Chuyên viên Cảng vụ | CRUD | Cập nhật Cảng biển của Cảng vụ mình |
| Doanh nghiệp cảng | CRUD | Cập nhật Cảng biển của đơn vị mình |
| Nhân viên vận hành | Read-only | Không có quyền cập nhật |

## Entities

- **CangBien**: id (UUID), maCang (string, unique, length≤50, immutable after creation), tenCang (string, length≤255), tinhThanhPho (string, length≤100), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), dienTich (BigDecimal, precision 15 scale 2, >0), khaNangTiepNhan (BigDecimal, precision 15 scale 2), trangThaiHoatDong (string), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt, updatedAt, deletedAt (nullable)
- **LichSuThayDoi**: id (UUID), cangBienId (UUID), loaiThayDoi (enum CẬP_NHẬT), field (string), oldValue (text), newValue (text), thayDoiBoi (UUID), changedAt

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | maCang không cho phép chỉnh sửa trên form cập nhật (readonly field) | PUT | Entity constraint |
| BR-002 | viDo phải nằm trong [-90, 90], kinhDo [-180, 180], dienTich (0, 5000] | GPS + Diện tích | Entity spec |
| BR-003 | GPS fields (viDo và kinhDo) phải được cung cấp cùng nhau hoặc để trống cùng nhau | PUT | Entity spec, F-110 |
| BR-004 | Sau khi cập nhật thành công, bản ghi LichSuThayDoi được tạo ghi nhận các trường thay đổi | PUT | INT-003 |
| BR-005 | Chỉ người dùng có quyền update mới thực hiện được hành động cập nhật | PUT | RBAC |

## Testing Strategy

Giao diện cập nhật Cảng biển được kiểm thử bằng React Testing Library cho việc render form với dữ liệu pre-filled đúng từ API, maCang readonly, validation inline (required fields, range GPS, max dienTich, GPS paired constraint). Cypress thực hiện end-to-end test: điều hướng đến trang cập nhật từ danh sách hoặc chi tiết → xác minh form pre-filled đúng → chỉnh sửa tenCang và tinhThanhPho → submit → xác nhận toast "Cập nhật thành công" → xác nhận điều hướng về trang chi tiết với dữ liệu mới. Negative test: nhập viDo = 100 → lỗi range; nhập dienTich = 6000 → lỗi max; điền viDo nhưng kinhDo rỗng → lỗi GPS paired; nhập tên quá 255 ký tự → lỗi length. Accessibility test: Tab qua tất cả trường, Enter submit form. Kiểm thử bản ghi LichSuThayDoi được tạo chính xác sau khi PUT.
