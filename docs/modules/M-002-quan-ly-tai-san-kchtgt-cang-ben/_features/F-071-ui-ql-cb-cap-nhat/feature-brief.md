---
id: F-071
name: "Cập nhật Cảng biển"
slug: ui-ql-cb-cap-nhat
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:12Z"
last-updated: "2026-07-01T04:08:12Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Cập nhật Cảng biển

## Description

Giao diện cập nhật Cảng biển (CangBienEditPage) cung cấp form chỉnh sửa thông tin của một cảng biển đã tồn tại. Form được pre-fill với dữ liệu hiện tại từ API GET /api/v1/cang-bien/:id và sử dụng cùng cơ chế validation như trang tạo mới (React Hook Form + Zod schema). Trường maCang luôn ở chế độ readonly (không thể thay đổi). Khi submit, form gọi PUT /api/v1/cang-bien/:id để cập nhật dữ liệu. Sau khi cập nhật, trangThaiPheDuyet tự động được đặt lại về CHỜ_PHÊ_DUYỆT, và một bản ghi LichSuThayDoi được tạo tự động để ghi nhận mọi thay đổi. Form hiển thị toast "Cập nhật thành công — chờ phê duyệt lại" và điều hướng về danh sách (F-068).

## Business Intent

Cho phép các tổ chức cập nhật thông tin của cảng biển đã được đăng ký (tên, địa điểm, tọa độ, diện tích, khả năng tiếp nhận). Việc cập nhật yêu cầu phê duyệt lại đảm bảo tính toàn vẹn dữ liệu — mọi thay đổi đều phải được Lãnh đạo xác nhận. LichSuThayDoi record giúp truy vết mọi thay đổi đã thực hiện.

## Flow Summary

Người dùng nhấp "Chỉnh sửa" từ danh sách (F-068) hoặc trang chi tiết (F-069), hệ thống gọi GET /api/v1/cang-bien/:id để lấy dữ liệu hiện tại và pre-fill form. Form hiển thị 7 trường với maCang readonly. GPS fields (viDo/kinhDo) phải được cung cấp cùng nhau hoặc để trống cùng nhau (BE validates @AssertTrue isGpsPaired()). User thay đổi các trường cần chỉnh sửa, hệ thống thực hiện inline validation (Zod). Submit gọi PUT /api/v1/cang-bien/:id, nếu hợp lệ, server trả về bản ghi đã cập nhật với trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT và tạo bản ghi LichSuThayDoi. Form hiển thị toast "Cập nhật thành công — chờ phê duyệt lại", điều hướng về danh sách. Nếu maCang đã tồn tại (trường hợp hiếm), API trả 409.

## Acceptance Criteria

1. Form được pre-fill với dữ liệu hiện tại từ GET /api/v1/cang-bien/:id, maCang luôn ở chế độ readonly (không thể chỉnh sửa).
2. Cùng validation schema như trang tạo mới (F-070): required, regex VN-36 cho maCang, range GPS, max diện tích 5000 — inline validation React Hook Form + Zod.
3. Submit thành công gọi PUT /api/v1/cang-bien/:id, API trả bản ghi đã cập nhật với trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT (reset từ trạng thái cũ).
4. Một bản ghi LichSuThayDoi được tạo tự động khi cập nhật, ghi nhận field nào thay đổi, giá trị cũ/mới, người thay đổi, thời gian thay đổi.
5. Toast "Cập nhật thành công — chờ phê duyệt lại" hiển thị sau khi cập nhật, hệ thống điều hướng về danh sách (F-068).
6. Nếu maCang đã tồn tại trong khi sửa (trường hợp hiếm), API trả HTTP 409 — form hiển thị toast lỗi.

## In Scope

- Form cập nhật với pre-fill dữ liệu từ API
- maCang readonly
- Validation inline (React Hook Form + Zod) cùng schema như tạo mới
- Submit → PUT /api/v1/cang-bien/:id
- Reset trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT sau update
- Tự động tạo LichSuThayDoi record
- Toast "Cập nhật thành công — chờ phê duyệt lại"
- Điều hướng về danh sách sau update

## Out of Scope

- Thay đổi maCang sau tạo (không khả dụng)
- Phê duyệt thực thi (thuộc F-072)
- Xóa mềm (thuộc F-093)
- Xem lịch sử thay đổi (thuộc F-094)
- Chỉnh sửa nhiều bản ghi cùng lúc (bulk edit)
- Export dữ liệu ra file

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full | Chỉnh sửa, xóa, phê duyệt tất cả Cảng biển |
| Lãnh đạo | Full + Phê duyệt | Chỉnh sửa, xóa, phê duyệt/từ chối tất cả Cảng biển |
| Chuyên viên Cục | CRUD | Chỉnh sửa Cảng biển của Cục mình |
| Chuyên viên Cảng vụ | CRUD | Chỉnh sửa Cảng biển của Cảng vụ mình |
| Doanh nghiệp cảng | CRUD | Chỉnh sửa Cảng biển của đơn vị mình |
| Nhân viên vận hành | Read-only | Không có quyền chỉnh sửa |

## Entities

- **CangBien**: id (UUID), maCang (string, unique, length≤50, immutable after creation), tenCang (string, length≤255), tinhThanhPho (string, length≤100), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), dienTich (BigDecimal, precision 15 scale 2, >0), khaNangTiepNhan (BigDecimal, precision 15 scale 2), trangThaiHoatDong (string), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt, updatedAt, deletedAt (nullable)
- **LichSuThayDoi**: id (UUID), cangBienId (UUID), loaiThayDoi (CẬP_NHẬT), field (string), oldValue, newValue, thayDoiBoi (UUID), changedAt

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | maCang không thể thay đổi sau khi tạo (readonly) | maCang | Entity spec, F-071 |
| BR-002 | viDo [-90, 90], kinhDo [-180, 180], dienTich [0, 5000] | GPS + Diện tích | Entity spec |
| BR-003 | trangThaiPheDuyet tự động reset về CHỜ_PHÊ_DUYỆT sau khi cập nhật | Cập nhật | F-071, F-009 |
| BR-004 | LichSuThayDoi được tạo tự động khi cập nhật, ghi nhận tất cả field thay đổi | Lịch sử | F-071, INT-003 |

## Testing Strategy

Giao diện cập nhật Cảng biển được kiểm thử bằng React Testing Library cho việc pre-fill form từ API response, validation inline (maCang readonly, range GPS, max dienTich), và xử lý lỗi 409. Cypress thực hiện end-to-end test: điều hướng đến trang chi tiết → click "Chỉnh sửa" → pre-fill xác minh dữ liệu hiện tại → thay đổi các trường (tenCang, tinhThanhPho, dienTich) → submit → xác nhận toast "Cập nhật thành công — chờ phê duyệt lại" → xác nhận điều hướng về danh sách → click "Lịch sử" → xác nhận LichSuThayDoi record được tạo. Negative test: maCang không thể sửa (readonly field disabled); điền viDo = -100 → lỗi range; điền dienTich = 6000 → lỗi max.
